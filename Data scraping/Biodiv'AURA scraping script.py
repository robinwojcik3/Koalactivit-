import re, time
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

AURA_USERNAME = "Robin Wojcik"
AURA_PASSWORD = "Vd8AfZ2Hlwx6SIvc09FQ"

EXCEL_PATH   = r"C:\Users\utilisateur\Mon Drive\1 - Bota & Travail\+++++++++  BOTA  +++++++++\---------------------- 3) BDD\PYTHON\0) Scripts Python\Koalactivit-\Taxons Koala.xlsx"
DOWNLOAD_DIR = r"C:\Users\utilisateur\Mon Drive\1 - Bota & Travail\+++++++++  BOTA  +++++++++\---------------------- 3) BDD\PYTHON\0) Scripts Python\Koalactivit-\Data scraping"

DEPARTEMENT_TEXTE = "Isere"   # mets "Isère" si le site l’exige

# >>> Input EXACT fourni pour l’étape 5 (département)
DEP_INPUT_XPATH_EXACT = (
    "//input[@aria-autocomplete='list' and @type='text' and "
    "@autocorrect='off' and @autocapitalize='off' and "
    "@autocomplete='a01311f1b606' and "
    "@aria-activedescendant='a01311f1b606-0' and "
    "@aria-controls='a01311f1b606']"
)

def sanitize_filename(s:str)->str:
    return re.sub(r'[\\/*?:"<>|]+', "_", s.strip())

def ensure_dir(p:str):
    Path(p).mkdir(parents=True, exist_ok=True)

def build_driver(download_dir:str)->webdriver.Chrome:
    ensure_dir(download_dir)
    opts = Options()
    opts.add_argument("--start-maximized")
    opts.add_argument("--lang=fr-FR")
    prefs = {
        "download.default_directory": str(Path(download_dir).resolve()),
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True,
        "profile.default_content_setting_values.automatic_downloads": 1,
    }
    opts.add_experimental_option("prefs", prefs)
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=opts)

def wait_new_file(folder:Path, before:set, timeout=240)->Path:
    end = time.time() + timeout
    while time.time() < end:
        cur = set(p for p in folder.glob("*") if p.is_file())
        new = [p for p in cur - before if not p.name.endswith(".crdownload")]
        if new:
            f = max(new, key=lambda p: p.stat().st_mtime)
            if not f.with_name(f.name + ".crdownload").exists():
                return f
        time.sleep(0.4)
    raise TimeoutError("Téléchargement non détecté.")

def get_species(xlsx:str, n=151):
    df = pd.read_excel(xlsx, header=None, usecols=[0], nrows=n)
    out=[]
    for v in df.iloc[:,0].tolist():
        if isinstance(v,str) and v.strip(): out.append(v.strip())
        elif pd.notna(v): out.append(str(v).strip())
    return out

def dismiss_cookies(driver):
    for txt in ["Tout accepter","Accepter","J’accepte","OK"]:
        try:
            WebDriverWait(driver,2).until(
                EC.element_to_be_clickable((By.XPATH, f"//button[normalize-space()='{txt}' or .//span[normalize-space()='{txt}']]"))
            ).click(); break
        except Exception: pass

def close_all_modals(driver):
    # ferme tout ngb-modal-window s’il bloque
    try:
        modals = driver.find_elements(By.CSS_SELECTOR, "ngb-modal-window")
        if modals:
            for label in ["Fermer","OK","Valider","Annuler","Close","×"]:
                btns = driver.find_elements(By.XPATH, f"//ngb-modal-window//button[normalize-space()='{label}' or .//span[normalize-space()='{label}']]")
                for b in btns:
                    try: b.click(); time.sleep(0.2)
                    except Exception: pass
            WebDriverWait(driver,5).until(EC.invisibility_of_element_located((By.CSS_SELECTOR,"ngb-modal-window")))
    except Exception:
        pass

def login(driver):
    wait = WebDriverWait(driver, 25)
    driver.get(ROOT)
    dismiss_cookies(driver)
    # champs login
    user = wait.until(EC.element_to_be_clickable((By.XPATH,"//input[@placeholder='Identifiant' or contains(@placeholder,'Identifiant')]")))
    pwd  = wait.until(EC.element_to_be_clickable((By.XPATH,"//input[@type='password' or @placeholder='Mot de passe']")))
    user.clear(); user.send_keys(AURA_USERNAME)
    pwd.clear();  pwd.send_keys(AURA_PASSWORD)
    try:
        wait.until(EC.element_to_be_clickable((By.XPATH,"//button[.//span[normalize-space()='SE CONNECTER'] or normalize-space()='SE CONNECTER']"))).click()
    except Exception:
        pwd.send_keys(Keys.ENTER)
    WebDriverWait(driver, 30).until(EC.url_contains("#/"))

def goto_synthese(driver):
    driver.get(URL)
    WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.ID,"taxonInput")))

def set_taxon(driver, taxon:str):
    wait = WebDriverWait(driver, 20)
    el = wait.until(EC.element_to_be_clickable((By.ID,"taxonInput")))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
    el.click()
    el.send_keys(Keys.CONTROL, "a")
    el.send_keys(taxon)
    time.sleep(2)              # étape 4 imposée
    el.send_keys(Keys.ENTER)   # étape 5 imposée

def open_departement_dropdown(driver):
    # clic sur la zone “Départements” pour faire apparaître l’input exact
    # ng-select
    try:
        box = WebDriverWait(driver,10).until(EC.element_to_be_clickable(
            (By.XPATH, "//div[contains(@class,'ng-select')][.//div[contains(@class,'ng-placeholder') and normalize-space()='Départements']]")
        ))
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", box)
        box.click()
        return
    except Exception:
        pass
    # mat-select
    box = WebDriverWait(driver,10).until(EC.element_to_be_clickable(
        (By.XPATH, "//mat-form-field[.//label[contains(normalize-space(),'Départements')]]//div[contains(@class,'mat-select-trigger')]")
    ))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", box)
    box.click()

def set_departement_exact(driver, texte:str):
    open_departement_dropdown(driver)
    # input EXACT fourni
    inp = WebDriverWait(driver,10).until(EC.element_to_be_clickable((By.XPATH, DEP_INPUT_XPATH_EXACT)))
    inp.click()
    inp.send_keys(Keys.CONTROL, "a")
    inp.send_keys(texte)
    inp.send_keys(Keys.ENTER)

def click_rechercher(driver):
    WebDriverWait(driver, 25).until(
        EC.element_to_be_clickable((By.XPATH,"//span[normalize-space()='Rechercher' or normalize-space()=' Rechercher ']"))
    ).click()

def click_telecharger_shapefile(driver):
    wait = WebDriverWait(driver, 60)
    wait.until(EC.element_to_be_clickable((By.ID,"download-btn"))).click()
    wait.until(EC.element_to_be_clickable((By.XPATH,"//span[normalize-space()='Format shapefile']"))).click()
    # attendre disparition d’un éventuel modal
    try:
        WebDriverWait(driver,10).until(EC.invisibility_of_element_located((By.CSS_SELECTOR,"ngb-modal-window")))
    except Exception:
        close_all_modals(driver)

def run():
    ensure_dir(DOWNLOAD_DIR)
    species = get_species(EXCEL_PATH, 151)
    if not species: print("Aucun taxon."); return

    driver = build_driver(DOWNLOAD_DIR)
    try:
        login(driver)
        goto_synthese(driver)

        ok, ko = [], []
        dl_dir = Path(DOWNLOAD_DIR)

        for i, taxon in enumerate(species, 1):
            print(f"[{i}/{len(species)}] {taxon} ...", end=" ")
            try:
                close_all_modals(driver)

                set_taxon(driver, taxon)
                close_all_modals(driver)

                set_departement_exact(driver, DEPARTEMENT_TEXTE)
                click_rechercher(driver)

                WebDriverWait(driver, 60).until(EC.element_to_be_clickable((By.ID,"download-btn")))
                before = set(dl_dir.glob("*"))
                click_telecharger_shapefile(driver)
                f = wait_new_file(dl_dir, before, timeout=240)

                target = f.with_name(sanitize_filename(f"{taxon}{f.suffix}"))
                k=1
                while target.exists():
                    target = f.with_name(sanitize_filename(f"{taxon} ({k}){f.suffix}")); k+=1
                f.rename(target)
                print(f"OK -> {target.name}"); ok.append((taxon, str(target)))

            except Exception as e:
                print(f"ECHEC -> {e}")
                ko.append((taxon, str(e)))

        print(f"\nSuccès: {len(ok)} | Échecs: {len(ko)}")
        if ko:
            for t,m in ko: print(f" - {t}: {m}")

    finally:
        pass  # driver.quit()

if __name__ == "__main__":
    run()
