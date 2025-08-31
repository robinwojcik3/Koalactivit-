import os
import time
import re
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

URL = "https://donnees.biodiversite-auvergne-rhone-alpes.fr/#/synthese"

EXCEL_PATH = r"C:\Users\utilisateur\Mon Drive\1 - Bota & Travail\+++++++++  BOTA  +++++++++\---------------------- 3) BDD\PYTHON\0) Scripts Python\Koalactivit-\Taxons Koala.xlsx"
# Dossier où Chrome déposera les téléchargements
DOWNLOAD_DIR = r"C:\Users\utilisateur\Downloads\AURA_synthese"

# Départements à saisir dans le champ filtre
DEPARTEMENT_TEXTE = "Isere"  # laissez sans accent si c’est ce que vous utilisez d’habitude

def sanitize_filename(name: str) -> str:
    name = name.strip()
    # remplace tout caractère non autorisé sur Windows
    return re.sub(r'[\\/*?:"<>|]+', '_', name)

def ensure_dir(p: str):
    Path(p).mkdir(parents=True, exist_ok=True)

def build_driver(download_dir: str) -> webdriver.Chrome:
    ensure_dir(download_dir)
    chrome_options = Options()
    # Headless possible, mais de nombreux sites bloquent les téléchargements en headless.
    # Décommentez si nécessaire:
    # chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--start-maximized")
    chrome_prefs = {
        "download.default_directory": str(Path(download_dir).resolve()),
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True,
        "profile.default_content_setting_values.automatic_downloads": 1,
    }
    chrome_options.add_experimental_option("prefs", chrome_prefs)
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--no-sandbox")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    return driver

def wait_for_new_download(download_dir: str, before: set, timeout: int = 180) -> Path:
    dl_dir = Path(download_dir)
    end = time.time() + timeout
    candidate = None
    while time.time() < end:
        current = set(p for p in dl_dir.glob("*") if p.is_file())
        new_files = [p for p in current - before if not p.name.endswith(".crdownload")]
        if new_files:
            # choisit le plus récent
            candidate = max(new_files, key=lambda p: p.stat().st_mtime)
            # s’assure que le .crdownload associé a disparu
            cr = candidate.with_name(candidate.name + ".crdownload")
            if not cr.exists():
                return candidate
        time.sleep(0.5)
    raise TimeoutError("Téléchargement non détecté ou incomplet dans le délai imparti.")

def get_species_list(xlsx_path: str, max_rows: int = 151):
    # lit la colonne A, lignes 1..151, sans en-tête
    df = pd.read_excel(xlsx_path, header=None, usecols=[0], nrows=max_rows)
    species = []
    for v in df.iloc[:, 0].tolist():
        if isinstance(v, str):
            s = v.strip()
            if s:
                species.append(s)
        elif pd.notna(v):
            species.append(str(v).strip())
    return species

def click_search(driver: webdriver.Chrome, wait: WebDriverWait):
    # bouton "Rechercher"
    btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[normalize-space()=' Rechercher ' or normalize-space()='Rechercher']")))
    btn.click()

def click_download(driver: webdriver.Chrome, wait: WebDriverWait):
    # bouton "Télécharger"
    dl = wait.until(EC.element_to_be_clickable((By.ID, "download-btn")))
    dl.click()
    # option "Format shapefile"
    opt = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[normalize-space()='Format shapefile']")))
    opt.click()

def fill_taxon(driver: webdriver.Chrome, wait: WebDriverWait, taxon: str):
    # champ taxon par id stable
    taxon_input = wait.until(EC.element_to_be_clickable((By.ID, "taxonInput")))
    taxon_input.clear()
    taxon_input.click()
    taxon_input.send_keys(taxon)
    # délai court pour laisser apparaître la liste
    time.sleep(2)
    taxon_input.send_keys(Keys.ENTER)

def fill_departement(driver: webdriver.Chrome, wait: WebDriverWait, texte: str):
    """
    Le champ département est un input typeahead sans id stable.
    Stratégie: cibler un input aria-autocomplete=list qui n’est pas #taxonInput.
    """
    # récupère tous les input typeahead visibles
    inputs = wait.until(lambda d: [el for el in d.find_elements(By.CSS_SELECTOR, "input[aria-autocomplete='list'][type='text']") if el.is_displayed()])
    # choisit le premier qui n’est pas l’input taxon
    dep_input = None
    for el in inputs:
        try:
            el_id = el.get_attribute("id") or ""
            if el_id != "taxonInput":
                dep_input = el
                break
        except Exception:
            continue
    if dep_input is None:
        # fallback par XPath
        dep_input = wait.until(EC.element_to_be_clickable((By.XPATH, "(//input[@aria-autocomplete='list' and @type='text'])[2]")))
    dep_input.clear()
    dep_input.click()
    dep_input.send_keys(texte)
    # la liste se remplit. Entrée pour valider la valeur tapée si le site exige une sélection.
    time.sleep(1)
    dep_input.send_keys(Keys.ENTER)

def run_one_species(driver: webdriver.Chrome, download_dir: str, taxon: str):
    wait = WebDriverWait(driver, 60)
    driver.get(URL)

    # 1) taxon
    fill_taxon(driver, wait, taxon)

    # 2) département
    fill_departement(driver, wait, DEPARTEMENT_TEXTE)

    # 3) lancer la recherche
    click_search(driver, wait)

    # 4) attendre le chargement des résultats
    # Le besoin initial dit “attendre 30 s”; on attend que le bouton Télécharger soit cliquable avec timeout large.
    wait.until(EC.element_to_be_clickable((By.ID, "download-btn")))

    # 5) lancer le téléchargement
    before = set(Path(download_dir).glob("*"))
    click_download(driver, wait)

    # 6) attendre le fichier
    downloaded = wait_for_new_download(download_dir, before, timeout=240)

    # 7) renommer avec le taxon
    ext = downloaded.suffix  # souvent .zip
    target_name = sanitize_filename(f"{taxon}{ext}")
    target_path = downloaded.with_name(target_name)
    # éviter collision
    i = 1
    while target_path.exists():
        target_path = downloaded.with_name(sanitize_filename(f"{taxon} ({i}){ext}"))
        i += 1
    downloaded.rename(target_path)
    return target_path

def main():
    ensure_dir(DOWNLOAD_DIR)
    species = get_species_list(EXCEL_PATH, max_rows=151)
    if not species:
        print("Aucun taxon détecté dans la colonne A.")
        return

    driver = build_driver(DOWNLOAD_DIR)
    try:
        successes, failures = [], []
        for idx, taxon in enumerate(species, start=1):
            print(f"[{idx}/{len(species)}] {taxon} ...", end=" ", flush=True)
            try:
                path = run_one_species(driver, DOWNLOAD_DIR, taxon)
                print(f"OK -> {path.name}")
                successes.append((taxon, str(path)))
            except Exception as e:
                print(f"ECHEC -> {e}")
                failures.append((taxon, str(e)))
                # on poursuit avec l’espèce suivante
        print("\nRésumé:")
        print(f"Succès: {len(successes)} | Échecs: {len(failures)}")
        if failures:
            print("Échecs détaillés:")
            for t, msg in failures:
                print(f" - {t}: {msg}")
    finally:
        # laissez ouvert si besoin de diagnostiquer; sinon décommentez:
        # driver.quit()
        pass

if __name__ == "__main__":
    main()
