import sys
import requests
from bs4 import BeautifulSoup
import json
import time

def main():
    # print to err or info
    # print("Python script futott!", file=sys.stderr)
    # print(f"Kapott paraméterek: {sys.argv[1:]}", file=sys.stderr)

    # Alap URL
    base_url = "https://www.butorkellek.hu/index.php?kezd={}&mkod=" + sys.argv[1] + "&modul=termek"

    headers = {"User-Agent": "Mozilla/5.0"}

    kezd = 0  # Kezdő index (első oldal: 0)
    leptek = 20  # Lapozás lépésköze (pl. 20 termék/oldal)
    all_products = []  # Az összegyűjtött termékek listája

    while True:
        url = base_url.format(kezd)
        response = requests.get(url, headers=headers)

        if response.status_code != 200:
            # print(f"Hiba a lekérdezés során! Státuszkód: {response.status_code}", file=sys.stderr)
            break

        soup = BeautifulSoup(response.text, "html.parser")

        # Termékek kiválasztása
        products = soup.select(".termek_brief1")

        # Ha nincs több termék, kilépünk a ciklusból
        if not products:
            # print(f"Nincs több termék ({len(products)} találat), kilépés.", file=sys.stderr)
            break

        # print(f"Oldal {kezd // leptek + 1} - Talált termékek száma: {len(products)}", file=sys.stderr)

        for product in products:
            name_tag = product.select_one(".termeknev")
            price_tag = product.select_one(".ar")
            open_url = product.select_one("a")["href"]

            if name_tag and price_tag and open_url:
                name = name_tag.text.strip()
                price = price_tag.text.strip()
                "index.php?kod = 7549 & modul = termek"
                product_url = "https://www.butorkellek.hu/" + open_url

                response2 = requests.get(product_url, headers=headers)
                soup2 = BeautifulSoup(response2.text, "html.parser")
                unit = soup2.select_one(".unit").text.strip()
                product_id = open_url.split("kod=")[1].split("&")[0]

                product_json = {
                    "id": product_id,
                    "name": name,
                    "price": price.replace("Ft", "").replace(" ", "").replace("\n", ""),
                    "categoryId": sys.argv[2],
                    "unit": unit
                }
                json_output = json.dumps(product_json, ensure_ascii=False)
                print(json_output, flush=True)

                all_products.append(product_json)

                #print(f"Termék: {name}, product_id: {product_id}, Ár: {price}, unit: {unit}")
                #print(open_url)

        # Ha az adott oldal **nem teljes (kevesebb mint 20 termék van), akkor ez az utolsó és kilépünk**
        if len(products) < leptek:
            # print(f"Utolsó oldal elérve ({len(products)} termék), kilépés.", file=sys.stderr)
            break

        kezd += leptek  # Következő oldal

    # Összes termék kiírása
    # print(f"\nÖsszes termék száma (minden oldal): {len(all_products)}", file=sys.stderr)
    # print json
      # Az ensure_ascii=False megőrzi az ékezetes karaktereket

    time.sleep(1)

    print(json.dumps({
        "state":"FINISHED",
        "categoryId": sys.argv[2]
    }),flush=True)


if __name__ == "__main__":
    main()
