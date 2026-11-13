"""
Scrape butorkellek.hu for every category in categories.json and write a single
products.json for the desktop app to download.

    python scraper/scrape.py --categories scraper/categories.json \
        --previous previous.json --output out/products.json

--previous is the last published products.json (optional). It is used to
  * reuse product units (saves one page download per already known product),
  * keep the old products of a category whose scrape failed, instead of wiping it.
"""
import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

BASE = "https://www.butorkellek.hu/"
MAX_RETRY = 3
TIMEOUT = 30
PAGE_SIZE = 20
DELAY = 0.5  # seconds between requests, to be polite with the shop
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; tmbcst-price-sync)"}

session = requests.Session()
session.headers.update(HEADERS)

for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8")
    except AttributeError:
        pass


def log(message):
    print(message, file=sys.stderr, flush=True)


def fetch(url):
    """GET with retries and back-off; returns the HTML text or None."""
    for attempt in range(1, MAX_RETRY + 1):
        time.sleep(DELAY)
        try:
            response = session.get(url, timeout=TIMEOUT)
            if response.status_code == 200:
                return response.text
            log(f"  HTTP {response.status_code}: {url} ({attempt}/{MAX_RETRY})")
        except requests.RequestException as e:
            log(f"  Hálózati hiba: {url}: {e} ({attempt}/{MAX_RETRY})")
        time.sleep(2 * attempt)
    return None


def extract_product_id(href):
    match = re.search(r"kod=([^&]+)", href or "")
    return match.group(1) if match else None


def parse_price(text):
    # "2 075 Ft" -> 2075
    cleaned = re.sub(r"[^\d,]", "", text).replace(",", ".")
    try:
        value = float(cleaned)
    except ValueError:
        return None
    return int(value) if value.is_integer() else value


def fetch_listing(url):
    """Products on one listing page; [] if the page is empty or failed."""
    for attempt in range(1, MAX_RETRY + 1):
        html = fetch(url)
        if html is None:
            return None  # hard failure
        products = BeautifulSoup(html, "html.parser").select(".termek_brief1")
        if products:
            return products
        if attempt < MAX_RETRY:
            log(f"  Üres oldal, újrapróbálkozás... ({attempt}/{MAX_RETRY})")
    return []


def fetch_unit(product_url):
    html = fetch(product_url)
    if html is None:
        return None
    unit = BeautifulSoup(html, "html.parser").select_one(".unit")
    return unit.text.strip() if unit is not None else None


def scrape_code(code, category_id, unit_cache):
    """All products of one shop category code. Raises RuntimeError on hard failure."""
    base_url = BASE + "index.php?kezd={}&mkod=" + code + "&modul=termek"
    results = []
    offset = 0
    prev_first_id = None

    while True:
        products = fetch_listing(base_url.format(offset))
        if products is None:
            raise RuntimeError(f"listaoldal nem tölthető le (mkod={code}, kezd={offset})")
        if not products:
            break

        first_link = products[0].select_one("a")
        first_id = extract_product_id(first_link.get("href") if first_link else None)
        if first_id is not None and first_id == prev_first_id:
            log("  Ismétlődő oldal, kilépés.")
            break
        prev_first_id = first_id

        for product in products:
            name_tag = product.select_one(".termeknev")
            price_tag = product.select_one(".ar")
            link = product.select_one("a")
            href = link.get("href") if link else None
            product_id = extract_product_id(href)
            if not (name_tag and price_tag and href and product_id):
                continue

            name = name_tag.text.strip()
            price = parse_price(price_tag.text)
            if price is None:
                log(f"  Nem értelmezhető ár ({name}): {price_tag.text.strip()!r}")
                continue

            unit = unit_cache.get(product_id)
            if not unit:
                unit = fetch_unit(BASE + href)
                if not unit:
                    log(f"  Nincs egység: {name} (kod={product_id})")
                    continue
                unit_cache[product_id] = unit

            results.append({
                "id": product_id,
                "name": name,
                "price": price,
                "categoryId": category_id,
                "unit": unit,
                "code": code,
            })

        if len(products) < PAGE_SIZE:
            break
        offset += PAGE_SIZE

    return results


def load_json(path, default):
    if not path:
        return default
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--categories", required=True)
    parser.add_argument("--previous")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    categories = load_json(args.categories, None)
    if not categories:
        log("Nincs kategória.")
        sys.exit(2)

    previous = load_json(args.previous, {})
    previous_products = previous.get("products", []) if isinstance(previous, dict) else []
    unit_cache = {p["id"]: p["unit"] for p in previous_products if p.get("unit")}

    products = {}
    category_info = []
    failed = 0

    for category in categories:
        log(f"{category['name']} ({', '.join(category['codes'])})")
        category_products = []
        error = None
        try:
            for code in category["codes"]:
                category_products += scrape_code(code, category["id"], unit_cache)
        except RuntimeError as e:
            error = str(e)

        stale = False
        if error:
            failed += 1
            log(f"  HIBA: {error} -> előző adatok megtartva")
            category_products = [p for p in previous_products if p.get("categoryId") == category["id"]]
            stale = True

        for p in category_products:
            products.setdefault(p["id"], p)
        log(f"  {len(category_products)} termék")
        category_info.append({**category, "productCount": len(category_products), "stale": stale})

    if failed == len(categories):
        log("Minden kategória hibára futott, nincs mit publikálni.")
        sys.exit(1)

    output = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "categories": category_info,
        "products": list(products.values()),
    }
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=1)
    log(f"Kész: {len(output['products'])} termék, {failed} hibás kategória -> {args.output}")


if __name__ == "__main__":
    main()
