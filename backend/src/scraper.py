from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import re
import sys
import json

def extract_coordinates_from_url(url):
    """Estrae coordinate da un URL di Google Maps con multiple strategie"""
    print_debug(f"[DEBUG] Estrazione coordinate da: {url[:120]}...")

    # 1. Priorità massima: coordinate precise (!3d, !4d)
    match = re.search(r'!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)', url)
    if match:
        lat, lon = float(match.group(1)), float(match.group(2))
        print_debug(f"[DEBUG] ✅ Metodo !3d/!4d (PRECISO): lat={lat}, lon={lon}")
        return lat, lon

    # 2. Coordinate dall'URL @ pattern - cerca quella con più decimali
    matches = re.findall(r'@(-?\d+\.\d+),(-?\d+\.\d+)', url)
    if matches:
        best_match = None
        max_decimals = 0

        for lat_str, lon_str in matches:
            lat, lon = float(lat_str), float(lon_str)
            decimals_lat = len(lat_str.split('.')[1]) if '.' in lat_str else 0
            decimals_lon = len(lon_str.split('.')[1]) if '.' in lon_str else 0
            total_decimals = decimals_lat + decimals_lon

            if total_decimals > max_decimals:
                max_decimals = total_decimals
                best_match = (lat, lon)

        if best_match:
            print_debug(f"[DEBUG] ✅ Metodo @ pattern: lat={best_match[0]}, lon={best_match[1]} ({max_decimals} decimali)")
            return best_match

    # 3. Fallback: coordinate dai parametri !8m2!3d!4d
    match = re.search(r'!8m2!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)', url)
    if match:
        lat, lon = float(match.group(1)), float(match.group(2))
        print_debug(f"[DEBUG] ✅ Metodo !8m2: lat={lat}, lon={lon}")
        return lat, lon

    print_debug("[DEBUG] ❌ Nessuna coordinata trovata")
    return None

def print_debug(message):
    """Stampa messaggi di debug formattati su stderr."""
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}][Python] {message}", file=sys.stderr)

def get_coordinates_two_step(address):
    """Strategia ottimizzata per massima velocità: estrazione diretta coordinate da Google Maps"""

    options = Options()
    # Configurazione STABILE per evitare crash
    options.add_argument("--headless=new")  # Headless mode
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-images")  # Non caricare immagini per velocità
    options.add_argument("--window-size=800,600")  # Finestra normale per stabilità
    # Ottimizzazioni bilanciate per velocità + stabilità
    options.add_argument("--disable-background-timer-throttling")
    options.add_argument("--disable-renderer-backgrounding")
    options.add_argument("--disable-logging")
    options.add_argument("--disable-notifications")
    options.add_argument("--no-first-run")
    options.add_argument("--no-default-browser-check")
    options.add_argument("--disable-client-side-phishing-detection")
    options.add_argument("--disable-default-apps")
    options.add_argument("--disable-hang-monitor")
    options.add_argument("--disable-prompt-on-repost")
    options.add_argument("--disable-sync")
    options.add_argument("--disable-translate")
    options.add_argument("--disable-logging")
    options.add_argument("--disable-notifications")
    options.add_argument("--no-first-run")
    options.add_argument("--no-default-browser-check")
    options.add_argument("--single-process")  # ESTREMO: single process
    options.add_experimental_option('useAutomationExtension', False)
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    
    # Disabilita logging per velocità
    options.add_argument("--log-level=3")
    options.add_argument("--silent")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    try:
        # === STEP 1: Ottieni il primo URL (coordinate imprecise) ===
        print_debug("=== STEP 1: Ottengo il primo URL ===")
        print_debug("Apertura Google Maps...")
        driver.get("https://www.google.com/maps")

        # Gestione banner cookie ottimizzata
        try:
            # Attesa minima per banner
            time.sleep(0.5)
            reject_buttons = driver.find_elements(By.XPATH, "//button[contains(@aria-label, 'Reject') or contains(@aria-label, 'Rifiuta')]")
            if reject_buttons:
                print_debug("Banner cookie trovato, clicco 'Rifiuta tutto'")
                reject_buttons[0].click()
                time.sleep(0.3)
        except Exception as e:
            print_debug(f"Gestione cookie: {e}")

        # Trova e usa la barra di ricerca
        print_debug(f"Ricerca indirizzo: {address}")
        search_box = WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.ID, "searchboxinput"))
        )

        search_box.clear()
        search_box.send_keys(address)
        search_box.send_keys(Keys.ENTER)

        # Attesa ottimizzata per URL con coordinate
        print_debug("Aspetto il primo URL con coordinate...")
        # Aspetta che l'URL cambi (LOGICA CORRETTA per coordinate)
        print_debug("Aspetto primo URL con coordinate...")
        first_url = None
        for i in range(8):  # STABILE: 5 secondi max
            current_url = driver.current_url
            if '/@' in current_url and re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', current_url):
                first_url = current_url
                print_debug(f"✅ Primo URL con coordinate ottenuto dopo {(i+1)*0.5:.1f} secondi")
                break
            time.sleep(0.5)  # Stabile

        if not first_url:
            print_debug("❌ Timeout: primo URL non trovato")
            return None

        print_debug(f"Primo URL: {first_url}")

        # Estrai coordinate dal primo URL
        first_coords = extract_coordinates_from_url(first_url)
        if first_coords:
            print_debug(f"Coordinate dal primo URL: lat={first_coords[0]}, lon={first_coords[1]}")
            
            # 🚀 USCITA RAPIDA: Se abbiamo coordinate precise, skip step 2!
            print_debug("🚀 VELOCITÀ MASSIMA: Coordinate trovate nel primo URL, skip step 2!")
            return first_coords

        # === STEP 2: Naviga al primo URL per ottenere il redirect/correzione ===
        print_debug("\n=== STEP 2: Navigo al primo URL per ottenere coordinate corrette ===")
        print_debug(f"Navigazione al primo URL: {first_url}")

        # Naviga direttamente al primo URL
        driver.get(first_url)

        # Caricamento ottimizzato - strategia più aggressiva
        print_debug("Aspetto caricamento pagina...")
        try:
            # Timeout stabile per primo URL
            WebDriverWait(driver, 1.5).until(  # STABILE: 1.5 secondi
                lambda d: '/@' in d.current_url and re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', d.current_url)
            )
            print_debug("✅ Primo URL caricato")
        except Exception as e:
            print_debug(f"Timeout caricamento primo URL: {e}")

        # Processing stabile
        print_debug("Processing Maps...")
        time.sleep(0.8)  # STABILE: tempo sicuro

        # Ottieni l'URL finale
        final_url = driver.current_url
        print_debug(f"✅ URL finale: {final_url}")

        # === STEP 3: Estrai coordinate finali ===
        print_debug("\n=== STEP 3: Estraggo coordinate finali ===")
        final_coords = extract_coordinates_from_url(final_url)

        if final_coords:
            print_debug(f"✅ Coordinate finali: lat={final_coords[0]}, lon={final_coords[1]}")

            # Confronta con le coordinate iniziali
            if first_coords:
                lat_diff = abs(final_coords[0] - first_coords[0])
                lon_diff = abs(final_coords[1] - first_coords[1])

                if lat_diff > 0.0001 or lon_diff > 0.0001:
                    print_debug(f"📍 CORREZIONE RILEVATA! Differenza: lat={lat_diff:.7f}, lon={lon_diff:.7f}")
                else:
                    print_debug("Le coordinate sono rimaste invariate")

            # 🚀 OTTIMIZZAZIONE: Se abbiamo coordinate precise, SKIP fallback
            print_debug("🚀 VELOCITÀ: Coordinate trovate, skip fallback per velocità")
            return final_coords

        # === STEP 4: Fallback SOLO se necessario ===
        print_debug("\n=== STEP 4: Fallback veloce (solo se necessario) ===")
        
        # Se abbiamo coordinate dal primo step, usale invece del fallback
        if first_coords:
            print_debug("🚀 VELOCITÀ: Uso coordinate primo step per evitare fallback")
            return first_coords
            
        # Fallback solo se davvero necessario
        try:
            # Timeout ESTREMO per caricamento
            WebDriverWait(driver, 1.5).until(  # ULTRA RIDOTTO: da 3 a 1.5 secondi
                EC.any_of(
                    EC.presence_of_element_located((By.XPATH, "//*[@data-value='Directions' or @data-value='Indicazioni']")),
                    EC.presence_of_element_located((By.XPATH, "//h1")),
                    EC.presence_of_element_located((By.XPATH, "//*[@role='main']")),
                )
            )
            print_debug("✅ Elementi caricati")

            # Strategia fallback più veloce
            map_elements = driver.find_elements(By.XPATH, "//*[@role='main' or @data-tid='map-container']")
            if map_elements:
                print_debug("Click rapido sulla mappa...")
                driver.execute_script("arguments[0].click();", map_elements[0])
                time.sleep(0.3)  # ESTREMO: da 0.8 a 0.3 secondi

                after_click_url = driver.current_url
                after_click_coords = extract_coordinates_from_url(after_click_url)

                if after_click_coords:
                    print_debug(f"✅ Coordinate dopo click: lat={after_click_coords[0]}, lon={after_click_coords[1]}")
                    return after_click_coords
        except Exception as e:
            print_debug(f"Fallback fallito: {e}")

        # Se tutto fallisce, restituisci almeno le coordinate del primo URL
        if first_coords:
            print_debug(f"⚠️ Restituisco coordinate del primo URL: lat={first_coords[0]}, lon={first_coords[1]}")
            return first_coords

        print_debug("❌ Nessuna coordinata trovata con tutti i metodi")
        return None

    except Exception as e:
        print_debug(f"❌ Errore durante lo scraping: {e}")
        return None

    finally:
        print_debug("Chiusura browser...")
        driver.quit()

if __name__ == "__main__":
    # Filtra eventuali argomenti vuoti passati dallo spawner Node.js
    args = [arg for arg in sys.argv if arg]

    if len(args) < 2:
        print_debug("Errore: indirizzo non fornito.")
        print(json.dumps({"error": "Indirizzo non fornito"}))
        sys.exit(1)

    address_to_search = args[1]
    force_refresh = '--force' in args

    if force_refresh:
        print_debug(f"Modalità forzata attivata per: '{address_to_search}'")

    try:
        final_coordinates = get_coordinates_two_step(address_to_search)

        if final_coordinates:
            # Stampa il JSON su stdout per Node.js
            result_json = json.dumps({"lat": final_coordinates[0], "lon": final_coordinates[1]})
            print(result_json)
        else:
            # Stampa un errore JSON su stdout
            print(json.dumps({"error": "Impossibile trovare le coordinate"}))
            sys.exit(1)

    except Exception as e:
        print_debug(f"❌ Errore durante l'esecuzione principale: {e}")
        # Stampa un errore JSON su stdout
        print(json.dumps({"error": "Impossibile trovare le coordinate"}))
        sys.exit(1)