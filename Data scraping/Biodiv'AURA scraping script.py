import os, time, re
from pathlib import Path
import pandas as pd

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

ROOT = "https://donnees.biodiversite-auvergne-rhone-alpes.fr/"
URL  = ROOT + "#/synthese"

# --- Identifiants demandés ---
AURA_USERNAME = "Robin Wojcik"
AURA_PASSWORD = "Vd8AfZ2Hlwx6SIvc09FQ"

# Chemins
EXCEL_PATH = r"C:\Users\utilisateur\Mon Drive\1 - Bota & Travail\+++++++++  BOTA  +++++++++\---------------------- 3) BDD\PYTHON\0) Scripts Python\Koalactivit-\Taxons Koala.xlsx"
DOWNLOAD_DIR = r"C:\Users\utilisateur\Mon Drive\1 - Bota & Travail\+++++++++  BOTA  +++++++++\---------------------- 3) BDD\PYTHON\0) Scripts Python\Koalactivit-\Data scraping"

DEPARTEMENT_TEXTE = "Isere"  # change en "Isère" si nécessaire

def sanitize_filename(name: str) -> str:
    return re.sub(r'[\\/*?:"<>|]+', '_', name.strip())

def ensure_dir(p: str):
    Path(p).mkdir(parents=True, exist_ok=True)

def build_driver(download_dir: str) -> webdriver.Chrome:
    ensure_dir(download_dir)
    chrome_options = Options()
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--lang=fr-FR")
    prefs = {
        "download.default_directory": str(Path(download_dir).resolve()),
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True,
        "profile.default_content_setting_values.automatic_downloads": 1,
    }
    chrome_options.add_experimental_option("prefs", prefs)
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=chrome_options)

def click_if_present(driver, xpath, timeout=3):
    try:
        el = WebDriverWait(driver, timeout).until(EC.element_to_be_clickable((By.XPATH, xpath)))
        el.click()
        return True
    except Exception:
        return False

def dismiss_cookies_if_any(driver):
    # variantes fréquentes
    for txt in ["Tout accepter", "Accepter", "J’accepte", "OK"]:
        if click_if_present(driver, f"//button[normalize-space()='{txt}' or .//span[normalize-space()='{txt}']]"):
            break

def login_if_needed(driver: webdriver.Chrome):
    wait = WebDriverWait(driver, 25)
    driver.get(ROOT)
    dismiss_cookies_if_any(driver)

    # Si déjà connecté, la page Synthèse est accessible
    try:
        driver.get(URL)
        WebDriverWait(driver, 8).until(EC.presence_of_element_located((By.ID, "taxonInput")))
        return
    except Exception:
        driver.get(ROOT)

    # Formulaire de connexion
    try:
        user_inp = wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@placeholder='Identifiant' or contains(@placeholder,'Identifiant')]")))
        pwd_inp  = wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@placeholder='Mot de passe' or @type='password']")))
    except Exception:
        # si overlay, tenter “ACCÈS PUBLIC” n’est pas souhaité. Forcer affichage du formulaire si bouton présent.
        click_if_present(driver, "//button[.//span[normalize-space()='SE CONNECTER'] or normalize-space()='SE CONNECTER']", timeout=5)
        user_inp = wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@placeholder='Identifiant' or contains(@placeholder,'Identifiant')]")))
        pwd_inp  = wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@placeholder='Mot de passe' or @type='password']")))

    user_inp.clear(); user_inp.send_keys(AURA_USERNAME)
    pwd_inp.clear();  pwd_inp.send_keys(AURA_PASSWORD)

    # Valider
    if not click_if_present(driver, "//button[.//span[normalize-space()='SE CONNECTER'] or normalize-space()='SE CONNECTER']", timeout=5):
        pwd_inp.send_keys(Keys.ENTER)

    # Attendre session
    try:
        WebDriverWait(driver, 25).until(EC.url_contains("#/"))
    except Exception:
        # debug
        Path(DOWNLOAD_DIR).mkdir(parents=True, exist_ok=True)
        driver.save_screenshot(str(Path(DOWNLOAD_DIR, "login_error.png")))
        raise RuntimeError("Connexion échouée. Capture: login_error.png")

    # Aller à Synthèse
    driver.get(URL)
    WebDriverWait(driver, 25).until(EC.presence_of_element_located((By.ID, "taxonInput")))

def wait_for_new_download(download_dir: str, before: set, timeout: int = 180) -> Path:
    dl_dir = Path(download_dir)
    end = time.time() + timeout
    while time.time() < end:
        current = set(p for p in dl_dir.glob("*") if p.is_file())
        new_files = [p for p in current - before if not p.name.endswith(".crdownload")]
        if new_files:
            candidate = max(new_files, key=lambda p: p.stat().st_mtime)
            if not candidate.with_name(candidate.name + ".crdownload").exists():
                return candidate
        time.sleep(0.5)
    raise TimeoutError("Téléchargement non détecté.")

def get_species_list(xlsx_path: str, max_rows: int = 151):
    df = pd.read_excel(xlsx_path, header=None, usecols=[0], nrows=max_rows)
    out = []
    for v in df.iloc[:, 0].tolist():
        if isinstance(v, str) and v.strip():
            out.append(v.strip())
        elif pd.notna(v):
            out.append(str(v).strip())
    return out

def click_search(driver, wait):
    btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[normalize-space()='Rechercher' or normalize-space()=' Rechercher ']")))
    btn.click()

def click_download(driver, wait):
    dl = wait.until(EC.element_to_be_clickable((By.ID, "download-btn")))
    dl.click()
    opt = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[normalize-space()='Format shapefile']")))
    opt.click()

def fill_taxon(driver, wait, taxon: str):
    inp = wait.until(EC.element_to_be_clickable((By.ID, "taxonInput")))
    inp.clear(); inp.click(); inp.send_keys(taxon)
    time.sleep(2)
    inp.send_keys(Keys.ENTER)

def fill_departement(driver, wait, texte: str):
    # 2e typeahead visible
    inputs = wait.until(lambda d: [el for el in d.find_elements(By.CSS_SELECTOR, "input[aria-autocomplete='list'][type='text']") if el.is_displayed()])
    dep = next((el for el in inputs if (el.get_attribute("id") or "") != "taxonInput"), None)
    if dep is None:
        dep = wait.until(EC.element_to_be_clickable((By.XPATH, "(//input[@aria-autocomplete='list' and @type='text'])[2]")))
    dep.clear(); dep.click(); dep.send_keys(texte); time.sleep(1); dep.send_keys(Keys.ENTER)

def run_one_species(driver, taxon: str):
    wait = WebDriverWait(driver, 40)
    if "synthese" not in driver.current_url:
        driver.get(URL)
        try:
            wait.until(EC.presence_of_element_located((By.ID, "taxonInput")))
        except Exception:
            login_if_needed(driver)

    fill_taxon(driver, wait, taxon)
    fill_departement(driver, wait, DEPARTEMENT_TEXTE)
    click_search(driver, wait)
    wait.until(EC.element_to_be_clickable((By.ID, "download-btn")))

    before = set(Path(DOWNLOAD_DIR).glob("*"))
    click_download(driver, wait)
    file = wait_for_new_download(DOWNLOAD_DIR, before, timeout=240)

    ext = file.suffix
    target = file.with_name(sanitize_filename(f"{taxon}{ext}"))
    i = 1
    while target.exists():
        target = file.with_name(sanitize_filename(f"{taxon} ({i}){ext}")); i += 1
    file.rename(target)
    return target

def main():
    ensure_dir(DOWNLOAD_DIR)
    species = get_species_list(EXCEL_PATH, 151)
    if not species:
        print("Aucun taxon détecté."); return

    driver = build_driver(DOWNLOAD_DIR)
    try:
        login_if_needed(driver)
        ok, ko = [], []
        for i, taxon in enumerate(species, 1):
            print(f"[{i}/{len(species)}] {taxon} ...", end=" ")
            try:
                p = run_one_species(driver, taxon)
                print(f"OK -> {p.name}"); ok.append((taxon, str(p)))
            except Exception as e:
                print(f"ECHEC -> {e}"); ko.append((taxon, str(e)))
        print(f"\nSuccès: {len(ok)} | Échecs: {len(ko)}")
        if ko:
            for t, m in ko: print(f" - {t}: {m}")
    finally:
        pass  # driver.quit()

if __name__ == "__main__":
    main()
