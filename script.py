import sys
import requests
from bs4 import BeautifulSoup
import json
import time

def main():

    MAX_RETRY = 3  # Maximum újrapróbálkozások száma

    # Alap URL
    base_url = "https://www.butorkellek.hu/index.php?kezd={}&mkod=" + sys.argv[1] + "&modul=termek"

    headers = {"User-Agent": "Mozilla/5.0"}

    kezd = 0  # Kezdő index (első oldal: 0)
    leptek = 20  # Lapozás lépésköze (pl. 20 termék/oldal)
    prev_first_product_id = None
    should_break = False
    while True:
        main_retires = 0
        url = base_url.format(kezd)
        products = []
        while main_retires < MAX_RETRY:
            response = requests.get(url, headers=headers)
            if response.status_code != 200:
                print(f"Hiba a lekérdezés során! Státuszkód: {response.status_code}", file=sys.stderr)
                break

            soup = BeautifulSoup(response.text, "html.parser")
            products = soup.select(".termek_brief1")

            if products:
                current_first_product_id = products[0].select_one("a")["href"].split("kod=")[1].split("&")[0]

                if current_first_product_id == prev_first_product_id:
                    print("Ismétlődő oldal detektálva, kilépés.", file=sys.stderr)
                    should_break = True
                    break

                prev_first_product_id = current_first_product_id

            if products:
                break
            else:
                print(f"Üres válasz érkezett, újrapróbálkozás... ({main_retires + 1}/{MAX_RETRY})", file=sys.stderr)
                main_retires += 1
                time.sleep(1)

        if should_break:
            break

        for product in products:
            name_tag = product.select_one(".termeknev")
            price_tag = product.select_one(".ar")
            open_url = product.select_one("a")["href"]

            if name_tag and price_tag and open_url:
                name = name_tag.text.strip()
                price = price_tag.text.strip()
                "index.php?kod = 7549 & modul = termek"
                product_url = "https://www.butorkellek.hu/" + open_url

                product_retires = 0
                while product_retires < MAX_RETRY:
                    response2 = requests.get(product_url, headers=headers)
                    soup2 = BeautifulSoup(response2.text, "html.parser")
                    if response.status_code == 200 and soup2.select_one(".unit") != None:
                        break
                    else:
                        print(f"Üres válasz érkezett a termék oldalról, újrapróbálkozás... ({product_retires + 1}/{MAX_RETRY})", file=sys.stderr)
                        product_retires += 1
                        time.sleep(1)



                if response2.status_code != 200:
                    print(f"Hiba a termék oldal lekérdezése során! Státuszkód: {response2.status_code}", file=sys.stderr)
                    continue

                unit = soup2.select_one(".unit")
                product_id = open_url.split("kod=")[1].split("&")[0]
                if unit != None:
                    unitText = unit.text.strip()

                    product_json = {
                        "id": product_id,
                        "name": name,
                        "price": price.replace("Ft", "").replace(" ", "").replace("\n", ""),
                        "categoryId": sys.argv[2],
                        "unit": unitText,
                        "code": sys.argv[1],
                    }
                    json_output = json.dumps(product_json, ensure_ascii=False)
                    print(json_output, flush=True)

                else:
                    print(f"Nincs egység a termékhez ({name}), termék_id: {product_id}", file=sys.stderr)
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
        "code": sys.argv[1],
        "categoryId": sys.argv[2]
    }),flush=True)


if __name__ == "__main__":
    main()
