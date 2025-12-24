import os
import urllib.parse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException


class WikipediaScraper:
    """Servicio para extraer informacion de Wikipedia usando Selenium headless."""

    def __init__(self):
        self.options = Options()
        self.options.add_argument('--headless')
        self.options.add_argument('--no-sandbox')
        self.options.add_argument('--disable-dev-shm-usage')
        self.options.add_argument('--disable-gpu')
        self.options.add_argument('--window-size=1920,1080')
        self.options.add_argument('--disable-extensions')
        self.options.add_argument('--disable-software-rasterizer')

        # Usar Chromium del sistema en Docker
        chrome_bin = os.environ.get('CHROME_BIN', '/usr/bin/chromium')
        if os.path.exists(chrome_bin):
            self.options.binary_location = chrome_bin

    def _create_driver(self):
        """Crear instancia del driver de Chrome/Chromium."""
        chromedriver_path = os.environ.get('CHROMEDRIVER_PATH', '/usr/bin/chromedriver')

        if os.path.exists(chromedriver_path):
            service = Service(executable_path=chromedriver_path)
            return webdriver.Chrome(service=service, options=self.options)
        else:
            # Fallback: dejar que Selenium encuentre el driver
            return webdriver.Chrome(options=self.options)

    def search_and_extract(self, search_term: str) -> dict:
        """
        Busca un termino en Wikipedia (espanol) y extrae el primer parrafo.

        Args:
            search_term: Termino a buscar

        Returns:
            dict con url, text (primer parrafo), title

        Raises:
            Exception si no se encuentra el articulo o hay error
        """
        driver = self._create_driver()

        try:
            # Codificar el termino para URL
            encoded_term = urllib.parse.quote(search_term.replace(' ', '_'))
            url = f"https://es.wikipedia.org/wiki/{encoded_term}"

            driver.get(url)

            # Esperar a que cargue el contenido principal
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "mw-content-text"))
            )

            # Verificar si es una pagina de desambiguacion o no existe
            current_url = driver.current_url

            # Detectar si fuimos redirigidos a busqueda
            if "search" in current_url.lower() or "Especial:Buscar" in current_url:
                raise Exception(f"No se encontro articulo para: {search_term}")

            # Extraer el titulo de la pagina
            title = driver.title.replace(" - Wikipedia, la enciclopedia libre", "").strip()

            # Buscar parrafos en el contenido principal
            paragraphs = driver.find_elements(
                By.CSS_SELECTOR,
                "#mw-content-text .mw-parser-output > p"
            )

            first_paragraph = ""
            for p in paragraphs:
                text = p.text.strip()
                # Ignorar parrafos vacios o muy cortos (coordenadas, etc.)
                if text and len(text) > 50 and not text.startswith("Coordenadas"):
                    first_paragraph = text
                    break

            if not first_paragraph:
                # Intentar obtener cualquier parrafo con contenido
                for p in paragraphs:
                    text = p.text.strip()
                    if text and len(text) > 20:
                        first_paragraph = text
                        break

            if not first_paragraph:
                raise Exception(f"No se pudo extraer contenido del articulo: {search_term}")

            return {
                "url": current_url,
                "text": first_paragraph,
                "title": title
            }

        except TimeoutException:
            raise Exception(f"Timeout al cargar Wikipedia para: {search_term}")
        except NoSuchElementException as e:
            raise Exception(f"No se encontro el elemento esperado: {str(e)}")
        finally:
            driver.quit()
