import re
import time
import zipfile
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# Cibles
ROOT = "https://donnees.biodiversite-auvergne-rhone-alpes.fr/"
URL = ROOT + "#/synthese"

# Identifiants (si possible, externaliser ces valeurs)
AURA_USERNAME = "Robin Wojcik"
AURA_PASSWORD = "Vd8AfZ2Hlwx6SIvc09FQ"

# Chemins (référencés relativement au dépôt)
REPO_ROOT = Path(__file__).resolve().parents[1]
TXT_PATH = REPO_ROOT / "Taxons Koala.txt"
OUTPUT_DIR = REPO_ROOT / "OUTPUT SHAPEFILE"

# Paramètres
DEPARTEMENT_TEXTE = "Isere"  # utiliser "Isère" si nécessaire
# Débogage/expérience: mettez False pour voir le navigateur
HEADLESS = False


def sanitize_filename(s: str) -> str:
    return re.sub(r'[\\/*?:"<>|]+', "_", s.strip())


def ensure_dir(p: Path | str):
    Path(p).mkdir(parents=True, exist_ok=True)


def read_species_from_txt(txt_path: Path) -> list[str]:
    if not txt_path.exists():
        raise FileNotFoundError(f"Fichier introuvable: {txt_path}")
    items: list[str] = []
    with txt_path.open("r", encoding="utf-8-sig") as f:
        for line in f:
            s = line.strip()
            if not s:
                continue
            if s.startswith("#") or s.startswith("//"):
                continue
            items.append(s)
    return items


def build_driver(download_dir: Path) -> webdriver.Chrome:
    ensure_dir(download_dir)
    opts = Options()
    # headless pour accélérer et réduire la consommation
    if HEADLESS:
        opts.add_argument("--headless=new")
    else:
        opts.add_argument("--start-maximized")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument("--lang=fr-FR")
    opts.add_argument("--disable-extensions")
    opts.add_argument("--disable-infobars")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-notifications")
    if HEADLESS:
        opts.add_argument("--blink-settings=imagesEnabled=false")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    # limite la verbosité de Chrome
    opts.add_experimental_option('excludeSwitches', ['enable-logging'])
    opts.page_load_strategy = "eager"

    prefs = {
        "download.default_directory": str(Path(download_dir).resolve()),
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True,
        "profile.default_content_setting_values.automatic_downloads": 1,
    }
    if HEADLESS:
        prefs["profile.managed_default_content_settings.images"] = 2
    opts.add_experimental_option("prefs", prefs)

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=opts)

    # Autoriser les téléchargements en headless (et parfois même en non-headless)
    try:
        driver.execute_cdp_cmd(
            "Page.setDownloadBehavior",
            {"behavior": "allow", "downloadPath": str(Path(download_dir).resolve())},
        )
    except Exception:
        pass
    return driver


def _is_zip_valid(path: Path) -> bool:
    if not path.exists() or path.suffix.lower() != ".zip" or path.stat().st_size == 0:
        return False
    try:
        with zipfile.ZipFile(path, 'r') as zf:
            # au moins un fichier, et aucune entrée corrompue
            if not zf.namelist():
                return False
            bad = zf.testzip()
            return bad is None
    except Exception:
        return False


def _size_stable(path: Path, hold_seconds: float = 1.0) -> bool:
    """Returns True if file size remains unchanged for hold_seconds."""
    try:
        s1 = path.stat().st_size
    except FileNotFoundError:
        return False
    t0 = time.time()
    while time.time() - t0 < hold_seconds:
        time.sleep(0.25)
        try:
            s2 = path.stat().st_size
        except FileNotFoundError:
            return False
        if s2 != s1:
            return False
    return True


def wait_new_zip_complete(folder: Path, before: set[Path], timeout: int = 240) -> Path:
    """Attend l'arrivée d'un nouveau .zip complet et valide dans folder."""
    end = time.time() + timeout
    while time.time() < end:
        cur = set(p for p in folder.glob("*") if p.is_file())
        new = [p for p in cur - before if not p.name.endswith(".crdownload")]
        # Priorise les .zip récents
        zips = [p for p in new if p.suffix.lower() == ".zip"]
        if zips:
            # essaie le plus récent d'abord
            for f in sorted(zips, key=lambda p: p.stat().st_mtime, reverse=True):
                # taille stable puis validation zip
                if _size_stable(f, 0.7) and _is_zip_valid(f):
                    return f
        time.sleep(0.3)
    raise TimeoutError("Téléchargement du ZIP non détecté/valide à temps.")


def click_quick(driver: webdriver.Chrome, by: By, sel: str, timeout: int = 15):
    el = WebDriverWait(driver, timeout).until(EC.element_to_be_clickable((by, sel)))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
    driver.execute_script("arguments[0].click();", el)
    return el


def dismiss_cookies(driver: webdriver.Chrome):
    for txt in ["Tout accepter", "Accepter", "J'accepte", "OK", "Autoriser"]:
        try:
            click_quick(
                driver,
                By.XPATH,
                f"//button[normalize-space()='{txt}' or .//span[normalize-space()='{txt}']]",
                3,
            )
            break
        except Exception:
            pass


def close_all_modals(driver: webdriver.Chrome):
    try:
        modals = driver.find_elements(By.CSS_SELECTOR, "ngb-modal-window")
        if not modals:
            return
        # tente un clic sur boutons de fermeture
        for xp in [
            "//ngb-modal-window//button[normalize-space()='×' or normalize-space()='Fermer' or normalize-space()='OK' or normalize-space()='Valider' or normalize-space()='Annuler']",
        ]:
            for b in driver.find_elements(By.XPATH, xp):
                try:
                    driver.execute_script("arguments[0].click();", b)
                except Exception:
                    pass
        WebDriverWait(driver, 5).until(
            EC.invisibility_of_element_located((By.CSS_SELECTOR, "ngb-modal-window"))
        )
    except Exception:
        pass


def login(driver: webdriver.Chrome):
    driver.get(ROOT)
    dismiss_cookies(driver)
    user = click_quick(
        driver,
        By.XPATH,
        "//input[@placeholder='Identifiant' or contains(@placeholder,'Identifiant')]",
        3,
    )
    pwd = click_quick(
        driver,
        By.XPATH,
        "//input[@type='password' or @placeholder='Mot de passe']",
        3,
    )
    user.clear()
    user.send_keys(AURA_USERNAME)
    pwd.clear()
    pwd.send_keys(AURA_PASSWORD)
    try:
        click_quick(
            driver,
            By.XPATH,
            "//button[.//span[normalize-space()='SE CONNECTER'] or normalize-space()='SE CONNECTER']",
            3,
        )
    except Exception:
        pwd.send_keys(Keys.ENTER)
    WebDriverWait(driver, 25).until(EC.url_contains("#/"))


def goto_synthese(driver: webdriver.Chrome):
    driver.get(URL)
    WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, "taxonInput")))


def set_taxon(driver: webdriver.Chrome, taxon: str):
    el = click_quick(driver, By.ID, "taxonInput", 15)
    # Nettoie toute sélection/chip précédente pour éviter l'accumulation (a, puis a&b, ...)
    try:
        for _ in range(12):
            removed = False
            for xp in [
                "//ng-select[.//input[@id='taxonInput']]//span[contains(@class,'ng-clear-wrapper') or contains(@class,'ng-clear')]",
                "//ng-select[.//input[@id='taxonInput']]//span[contains(@class,'ng-value-icon')]",
                "//ng-select[.//input[@id='taxonInput']]//button[contains(@class,'mat-chip-remove') or @aria-label='Remove']",
            ]:
                try:
                    btn = driver.find_element(By.XPATH, xp)
                    driver.execute_script("arguments[0].click();", btn)
                    time.sleep(0.05)
                    removed = True
                except Exception:
                    pass
            if not removed:
                break
    except Exception:
        pass
    el.send_keys(Keys.CONTROL, "a")
    try:
        el.send_keys(Keys.DELETE)
        for _ in range(6):
            el.send_keys(Keys.BACK_SPACE)
            time.sleep(0.03)
    except Exception:
        pass
    el.send_keys(taxon)
    # attend la liste déroulante (plus rapide que sleep fixe)
    try:
        WebDriverWait(driver, 5).until(
            EC.presence_of_element_located(
                (By.XPATH, "//div[contains(@class,'ng-option') or contains(@class,'mat-option')]")
            )
        )
    except Exception:
        time.sleep(0.5)
    # Sélectionne la suggestion correspondant exactement au taxon si possible
    try:
        xp_exact = f"//div[contains(@class,'ng-option') or contains(@class,'mat-option')]//*[normalize-space()='{taxon}']"
        opt = WebDriverWait(driver, 3).until(
            EC.element_to_be_clickable((By.XPATH, xp_exact))
        )
        driver.execute_script("arguments[0].click();", opt)
    except Exception:
        el.send_keys(Keys.ENTER)


def force_clear_taxon(driver: webdriver.Chrome, max_clicks: int = 30):
    """Force la remise à zéro du champ Taxon pour éviter le cumul a→a&b→a&b&c.

    Essaye successivement:
    - clics sur icônes de suppression (ng-select, mat-chip, clear-wrapper) à proximité
      du champ possédant l'input #taxonInput
    - séquences de Delete/Backspace pour purger d'éventuels chips restants
    """
    try:
        el = click_quick(driver, By.ID, "taxonInput", 8)
    except Exception:
        return

    # 1) Ferme menus et tente les icônes de suppression proches du champ Taxon
    try:
        el.send_keys(Keys.ESCAPE)
    except Exception:
        pass

    xps = [
        "//*[contains(@class,'ng-clear-wrapper') or contains(@class,'ng-clear')][ancestor::*[.//input[@id='taxonInput']]]",
        "//*[contains(@class,'ng-value-icon')][ancestor::*[.//input[@id='taxonInput']]]",
        "//*[contains(@class,'mat-chip-remove') or @aria-label='Remove'][ancestor::*[.//input[@id='taxonInput']]]",
    ]
    for _ in range(max_clicks):
        removed = False
        for xp in xps:
            try:
                btn = driver.find_element(By.XPATH, xp)
                driver.execute_script("arguments[0].click();", btn)
                time.sleep(0.03)
                removed = True
            except Exception:
                pass
        if not removed:
            break

    # 2) Efface texte/chips par clavier
    try:
        el.send_keys(Keys.CONTROL, "a")
        el.send_keys(Keys.DELETE)
        for _ in range(80):
            el.send_keys(Keys.BACK_SPACE)
            time.sleep(0.005)
    except Exception:
        pass


def reset_all_filters(driver: webdriver.Chrome):
    """Tente de réinitialiser tous les filtres avant une nouvelle espèce.

    1) Clique sur un bouton de réinitialisation si présent (plusieurs sélecteurs).
    2) Supprime tous les chips/valeurs de taxon par sécurité.
    """
    # 1) Bouton "Réinitialiser" (différentes variantes possibles)
    reset_xpaths = [
        "//button[normalize-space()='Réinitialiser' or normalize-space()='Reinitialiser']",
        "//button[.//span[normalize-space()='Réinitialiser' or normalize-space()='Reinitialiser']]",
        # bouton juste à gauche de RECHERCHER
        "(//button[.//span[normalize-space()='RECHERCHER']]/preceding::button)[1]",
        # bouton avec icône refresh/sync
        "//button[.//i[contains(@class,'fa-sync') or contains(@class,'fa-rotate') or contains(@class,'fa-refresh')]]",
        # bouton rouge générique proche de RECHERCHER
        "(//span[normalize-space()='RECHERCHER']/ancestor::button/preceding::button[contains(@class,'btn')])[1]",
    ]
    for xp in reset_xpaths:
        try:
            btn = WebDriverWait(driver, 2).until(
                EC.element_to_be_clickable((By.XPATH, xp))
            )
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
            driver.execute_script("arguments[0].click();", btn)
            time.sleep(0.2)
            break
        except Exception:
            pass

    # 2) Sécurité: supprimer manuellement les chips Taxon (dans divers conteneurs)
    try:
        # d'abord ceux près du champ taxonInput
        force_clear_taxon(driver, max_clicks=40)
        # puis ceux visibles dans un bloc "Taxon(s) recherché(s)"
        for _ in range(40):
            removed = False
            for xp in [
                "//div[contains(., 'Taxon') and contains(., 'recherch') ]//*[self::button or self::span][@aria-label='Remove' or contains(@class,'ng-value-icon') or contains(@class,'mat-chip-remove') or contains(@class,'ng-clear')]",
                "//*[contains(@class,'taxon') and (contains(@class,'chip') or contains(@class,'value'))]//*[self::button or self::span][@aria-label='Remove' or contains(@class,'ng-value-icon') or contains(@class,'mat-chip-remove')]",
            ]:
                try:
                    x = driver.find_element(By.XPATH, xp)
                    driver.execute_script("arguments[0].click();", x)
                    time.sleep(0.03)
                    removed = True
                except Exception:
                    pass
            if not removed:
                break
    except Exception:
        pass


def count_taxon_chips(driver: webdriver.Chrome) -> int:
    selectors = [
        # chips dans le composant ng-select du taxon
        "//ng-select[.//input[@id='taxonInput']]//*[contains(@class,'ng-value') and not(contains(@class,'ng-placeholder'))]",
        # chips material
        "//*[contains(@class,'mat-chip') and ancestor::*[.//input[@id='taxonInput']]]",
        # chips listées dans un bloc 'Taxon(s) recherché(s)'
        "//div[contains(., 'Taxon') and contains(., 'recherch')]//*[contains(@class,'chip') or contains(@class,'ng-value')]",
    ]
    seen = set()
    total = 0
    for xp in selectors:
        try:
            els = driver.find_elements(By.XPATH, xp)
            for e in els:
                try:
                    k = (e.id)
                except Exception:
                    k = None
                if k in seen:
                    continue
                seen.add(k)
                total += 1
        except Exception:
            pass
    return total


def open_departement_dropdown(driver: webdriver.Chrome):
    # Ouvre la zone Départements (évite la confusion avec Communes)
    try:
        click_quick(
            driver,
            By.XPATH,
            "//div[contains(@class,'ng-select')][.//div[contains(@class,'ng-placeholder') and contains(normalize-space(),'partements')]]",
            6,
        )
        return
    except Exception:
        pass
    # fallback mat-select
    click_quick(
        driver,
        By.XPATH,
        "//mat-form-field[.//label[contains(normalize-space(),'partements')]]//div[contains(@class,'mat-select-trigger')]",
        6,
    )


def set_departement_exact(driver: webdriver.Chrome, texte: str):
    open_departement_dropdown(driver)
    # Essai sur input spécifique si présent
    tried = False
    try:
        inp = click_quick(
            driver,
            By.XPATH,
            "//div[contains(@class,'ng-dropdown-panel')]//input[@type='text' and @aria-autocomplete='list']",
            6,
        )
        tried = True
        inp.send_keys(Keys.CONTROL, "a")
        inp.send_keys(texte)
        inp.send_keys(Keys.ENTER)
        return
    except Exception:
        if not tried:
            pass
    # Fallback plus générique
    try:
        inp2 = click_quick(
            driver,
            By.XPATH,
            "//div[contains(@class,'ng-dropdown-panel')]//input[contains(@type,'text')]",
            6,
        )
        inp2.send_keys(Keys.CONTROL, "a")
        inp2.send_keys(texte)
        inp2.send_keys(Keys.ENTER)
    except Exception:
        # dernier recours: taper directement et valider
        driver.switch_to.active_element.send_keys(texte)
        driver.switch_to.active_element.send_keys(Keys.ENTER)


def click_rechercher(driver: webdriver.Chrome):
    click_quick(
        driver,
        By.XPATH,
        "//span[normalize-space()='Rechercher' or normalize-space()=' Rechercher ']",
        15,
    )


def click_telecharger_shapefile(driver: webdriver.Chrome):
    # Réduit le temps d'attente pour le bouton de téléchargement
    # On a déjà attendu son état prêt dans run(); ici, délai minimal
    click_quick(driver, By.ID, "download-btn", 3)
    # bouton peut être une option dans un menu; on cible 'shapefile' insensible à la casse
    xpath_case_insensitive = (
        "//span[translate(normalize-space(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')="
        "'format shapefile'] | //button[translate(normalize-space(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='format shapefile']"
    )
    try:
        # Attente plus courte pour l'option "Format shapefile"
        click_quick(driver, By.XPATH, xpath_case_insensitive, 4)
    except Exception:
        # fallback sur le texte exact existant
        click_quick(driver, By.XPATH, "//span[normalize-space()='Format shapefile']", 4)


def run():
    ensure_dir(OUTPUT_DIR)
    print(f"Chargement de la liste des espèces depuis: {TXT_PATH}")

    try:
        species = read_species_from_txt(TXT_PATH)
    except Exception as e:
        print(f"Erreur de lecture de la liste d'espèces: {e}")
        return

    if not species:
        print("Aucun taxon.")
        return

    driver = build_driver(OUTPUT_DIR)
    try:
        print("Connexion au portail...")
        login(driver)
        print("Ouverture de la page Synthèse...")
        goto_synthese(driver)

        ok, ko = [], []
        dl_dir = Path(OUTPUT_DIR)

        for i, taxon in enumerate(species, 1):
            print(f"[{i}/{len(species)}] {taxon} ...", end=" ")
            try:
                close_all_modals(driver)
                # Réinitialise tous les filtres pour éviter l'accumulation (1 espèce = 1 shapefile)
                reset_all_filters(driver)
                # Taxon
                # petite trace de progression
                # print(f"  -> Taxon: {taxon}")
                # S'assure que le champ Taxon est vide avant de saisir
                force_clear_taxon(driver)
                set_taxon(driver, taxon)
                print("  - Taxon saisi/validé")

                # Département
                set_departement_exact(driver, DEPARTEMENT_TEXTE)
                print(f"  - Département sélectionné: {DEPARTEMENT_TEXTE}")

                # Rechercher
                click_rechercher(driver)
                print("  - Recherche lancée")

                # Attente du bouton Télécharger
                WebDriverWait(driver, 8).until(
                    EC.element_to_be_clickable((By.ID, "download-btn"))
                )
                print("  - Bouton Télécharger prêt")

                # Skip si déjà présent et valide
                expected = sanitize_filename(f"{taxon}")
                existing = sorted(dl_dir.glob(f"{expected}*.zip"), key=lambda p: p.stat().st_mtime, reverse=True)
                if existing and _is_zip_valid(existing[0]):
                    print(f"SKIP -> déjà présent: {existing[0].name}")
                    ok.append((taxon, str(existing[0])))
                    continue

                # Téléchargement shapefile avec 2 tentatives si nécessaire
                last_error = None
                for attempt in range(1, 3):
                    try:
                        before = set(dl_dir.glob("*"))
                        click_telecharger_shapefile(driver)
                        print("  - Option 'Format shapefile' cliquée")
                        f = wait_new_zip_complete(dl_dir, before, timeout=120)
                        print(f"  - ZIP détecté: {f.name}")

                        # Renommage propre
                        target = f.with_name(sanitize_filename(f"{taxon}{f.suffix}"))
                        k = 1
                        while target.exists():
                            target = f.with_name(sanitize_filename(f"{taxon} ({k}){f.suffix}"))
                            k += 1
                        f.rename(target)

                        if not _is_zip_valid(target):
                            raise RuntimeError("ZIP corrompu ou vide après téléchargement")
                        break
                    except Exception as e:
                        last_error = e
                        time.sleep(0.5)
                else:
                    raise last_error if last_error else RuntimeError("Echec téléchargement après tentatives")

                print(f"OK -> {target.name}")
                ok.append((taxon, str(target)))

            except Exception as e:
                print(f"ECHEC -> {e}")
                ko.append((taxon, str(e)))

        print(f"\nSuccès: {len(ok)} | Échecs: {len(ko)}")
        if ko:
            for t, m in ko:
                print(f" - {t}: {m}")

    finally:
        try:
            driver.quit()
        except Exception:
            pass


if __name__ == "__main__":
    run()
