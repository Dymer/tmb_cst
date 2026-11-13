"""
Offline tests for scraper/scrape.py: the network is replaced by fake shop pages.

    pip install -r scraper/requirements.txt -r scraper/requirements-dev.txt
    python -m pytest scraper/tests
"""
import json
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import scrape  # noqa: E402


# ---------------------------------------------------------------- fake shop

def listing_html(products):
    """products: list of (id, name, price_text)"""
    items = "".join(
        f'<div class="termek_brief1"><a href="index.php?kod={pid}&modul=termek">'
        f'<span class="termeknev">{name}</span></a><span class="ar">{price}</span></div>'
        for pid, name, price in products
    )
    return f"<html><body>{items}</body></html>"


def product_html(unit):
    if unit is None:
        return "<html><body><h1>Termék</h1></body></html>"
    return f'<html><body><span class="unit">{unit}</span></body></html>'


def listing_url(code, offset):
    return f"{scrape.BASE}index.php?kezd={offset}&mkod={code}&modul=termek"


def product_url(pid):
    return f"{scrape.BASE}index.php?kod={pid}&modul=termek"


class FakeShop:
    """Maps URL -> HTML (None = network failure). Records every requested URL."""

    def __init__(self, pages=None):
        self.pages = dict(pages or {})
        self.requests = []

    def fetch(self, url):
        self.requests.append(url)
        return self.pages.get(url, "<html><body></body></html>")

    def add_category(self, code, products, units=None, page_size=scrape.PAGE_SIZE):
        units = units or {}
        for i in range(0, max(len(products), 1), page_size):
            self.pages[listing_url(code, i)] = listing_html(products[i:i + page_size])
        for pid, _, _ in products:
            self.pages[product_url(pid)] = product_html(units.get(pid, "db"))

    def product_page_requests(self):
        return [u for u in self.requests if "kod=" in u and "mkod=" not in u]


def make_products(start, count, price="1 000 Ft"):
    return [(str(start + i), f"Termék {start + i}", price) for i in range(count)]


@pytest.fixture
def shop(monkeypatch):
    fake = FakeShop()
    monkeypatch.setattr(scrape, "fetch", fake.fetch)
    monkeypatch.setattr(scrape.time, "sleep", lambda *_: None)
    return fake


# ---------------------------------------------------------------- parsing

@pytest.mark.parametrize("text, expected", [
    ("2 075 Ft", 2075),
    ("1 234 Ft", 1234),       # non-breaking spaces
    ("\n  943 Ft \n", 943),
    ("12,5 Ft", 12.5),
    ("Ár: n/a", None),
    ("", None),
])
def test_parse_price(text, expected):
    assert scrape.parse_price(text) == expected


@pytest.mark.parametrize("href, expected", [
    ("index.php?kod=1354&modul=termek", "1354"),
    ("index.php?modul=termek&kod=77", "77"),
    ("index.php?modul=termek", None),
    (None, None),
])
def test_extract_product_id(href, expected):
    assert scrape.extract_product_id(href) == expected


# ---------------------------------------------------------------- scrape_code

def test_paginates_until_a_page_is_not_full(shop):
    shop.add_category("10", make_products(1, 25))

    result = scrape.scrape_code("10", "cat", {})

    assert [p["id"] for p in result] == [str(i) for i in range(1, 26)]
    assert listing_url("10", 40) not in shop.requests
    assert result[0] == {"id": "1", "name": "Termék 1", "price": 1000, "categoryId": "cat", "unit": "db", "code": "10"}


def test_stops_when_the_shop_repeats_the_same_page(shop):
    page = listing_html(make_products(1, 20))
    shop.pages[listing_url("10", 0)] = page
    shop.pages[listing_url("10", 20)] = page   # shop ignores the offset
    for pid in range(1, 21):
        shop.pages[product_url(pid)] = product_html("db")

    result = scrape.scrape_code("10", "cat", {})

    assert len(result) == 20
    assert listing_url("10", 40) not in shop.requests


def test_exactly_full_last_page_ends_on_the_empty_next_page(shop):
    shop.add_category("10", make_products(1, 20))   # next offset returns an empty page

    result = scrape.scrape_code("10", "cat", {})

    assert len(result) == 20
    assert shop.requests.count(listing_url("10", 20)) == scrape.MAX_RETRY


def test_known_units_are_not_downloaded_again(shop):
    shop.add_category("10", make_products(1, 3), units={"1": "pár", "2": "m", "3": "db"})

    result = scrape.scrape_code("10", "cat", {"1": "pár", "2": "m"})

    assert [p["unit"] for p in result] == ["pár", "m", "db"]
    assert shop.product_page_requests() == [product_url(3)]


def test_new_units_are_added_to_the_cache(shop):
    shop.add_category("10", make_products(1, 1), units={"1": "pár"})
    cache = {}

    scrape.scrape_code("10", "cat", cache)

    assert cache == {"1": "pár"}


def test_missing_unit_falls_back_to_db_and_is_flagged(shop):
    shop.add_category("10", make_products(1, 2), units={"2": None})
    cache = {}

    result = scrape.scrape_code("10", "cat", cache)

    assert result[0]["unit"] == "db" and "unitMissing" not in result[0]
    assert result[1]["unit"] == "db" and result[1]["unitMissing"] is True
    assert "2" not in cache   # guessed units are not cached


def test_unparsable_price_is_skipped(shop):
    shop.add_category("10", [("1", "Jó", "500 Ft"), ("2", "Rossz", "Érdeklődjön")])

    result = scrape.scrape_code("10", "cat", {})

    assert [p["id"] for p in result] == ["1"]


def test_listing_network_failure_raises(shop):
    shop.pages[listing_url("10", 0)] = None

    with pytest.raises(RuntimeError):
        scrape.scrape_code("10", "cat", {})


# ---------------------------------------------------------------- main()

def run_main(monkeypatch, tmp_path, categories, previous=None):
    cat_file = tmp_path / "categories.json"
    cat_file.write_text(json.dumps(categories), encoding="utf-8")
    out_file = tmp_path / "out" / "products.json"
    argv = ["scrape.py", "--categories", str(cat_file), "--output", str(out_file)]
    if previous is not None:
        prev_file = tmp_path / "previous.json"
        prev_file.write_text(json.dumps(previous), encoding="utf-8")
        argv += ["--previous", str(prev_file)]
    monkeypatch.setattr(sys, "argv", argv)
    scrape.main()
    return json.loads(out_file.read_text(encoding="utf-8"))


def test_main_writes_categories_and_products(shop, monkeypatch, tmp_path):
    shop.add_category("1", make_products(1, 2), units={"2": None})
    shop.add_category("2", make_products(100, 1))
    categories = [{"id": "a", "name": "A", "codes": ["1"]}, {"id": "b", "name": "B", "codes": ["2"]}]

    data = run_main(monkeypatch, tmp_path, categories)

    assert data["generatedAt"]
    assert [c["productCount"] for c in data["categories"]] == [2, 1]
    assert [c["missingUnitCount"] for c in data["categories"]] == [1, 0]
    assert [c["stale"] for c in data["categories"]] == [False, False]
    assert {p["id"]: p["categoryId"] for p in data["products"]} == {"1": "a", "2": "a", "100": "b"}


def test_main_keeps_previous_products_of_a_failed_category(shop, monkeypatch, tmp_path):
    shop.add_category("1", make_products(1, 1))
    shop.pages[listing_url("2", 0)] = None   # category B is down
    categories = [{"id": "a", "name": "A", "codes": ["1"]}, {"id": "b", "name": "B", "codes": ["2"]}]
    previous = {"products": [
        {"id": "50", "name": "Régi", "price": 10, "categoryId": "b", "unit": "db", "code": "2"},
        {"id": "1", "name": "Régi név", "price": 5, "categoryId": "a", "unit": "db", "code": "1"},
    ]}

    data = run_main(monkeypatch, tmp_path, categories, previous)

    by_id = {p["id"]: p for p in data["products"]}
    assert by_id["50"]["name"] == "Régi"            # kept from previous data
    assert by_id["1"]["name"] == "Termék 1"         # refreshed
    assert [c["stale"] for c in data["categories"]] == [False, True]


def test_main_uses_previous_units_but_retries_guessed_ones(shop, monkeypatch, tmp_path):
    shop.add_category("1", make_products(1, 2), units={"1": "pár", "2": "m"})
    previous = {"products": [
        {"id": "1", "unit": "pár", "categoryId": "a"},
        {"id": "2", "unit": "db", "unitMissing": True, "categoryId": "a"},
    ]}

    data = run_main(monkeypatch, tmp_path, [{"id": "a", "name": "A", "codes": ["1"]}], previous)

    assert shop.product_page_requests() == [product_url(2)]
    assert {p["id"]: p["unit"] for p in data["products"]} == {"1": "pár", "2": "m"}


def test_main_fails_without_writing_when_every_category_fails(shop, monkeypatch, tmp_path):
    shop.pages[listing_url("1", 0)] = None

    with pytest.raises(SystemExit) as exit_info:
        run_main(monkeypatch, tmp_path, [{"id": "a", "name": "A", "codes": ["1"]}])

    assert exit_info.value.code == 1
    assert not (tmp_path / "out" / "products.json").exists()


def test_main_ignores_a_broken_previous_file(shop, monkeypatch, tmp_path):
    shop.add_category("1", make_products(1, 1))
    cat_file = tmp_path / "c.json"
    cat_file.write_text(json.dumps([{"id": "a", "name": "A", "codes": ["1"]}]))
    prev_file = tmp_path / "prev.json"
    prev_file.write_text("this is not json")
    out_file = tmp_path / "p.json"
    monkeypatch.setattr(sys, "argv", ["s", "--categories", str(cat_file), "--previous", str(prev_file), "--output", str(out_file)])

    scrape.main()

    assert len(json.loads(out_file.read_text())["products"]) == 1


# ---------------------------------------------------------------- HTTP session

def test_session_retries_dropped_connections_and_busy_answers():
    retry = scrape.session.get_adapter("https://www.butorkellek.hu/").max_retries
    assert retry.read >= 1 and retry.connect >= 1
    assert {429, 503}.issubset(set(retry.status_forcelist))


# ---------------------------------------------------------------- encoding

class FakeResponse:
    def __init__(self, content, content_type="text/html"):
        self.content = content
        self.headers = {"Content-Type": content_type}
        self.encoding = None

    @property
    def text(self):
        return self.content.decode(self.encoding or "iso-8859-1")


def test_decode_uses_the_meta_charset_for_hungarian_letters():
    html = '<html><head><meta charset="iso-8859-2"></head><body>tömítőanyag, fűrész</body></html>'
    response = FakeResponse(html.encode("iso-8859-2"))
    assert "tömítőanyag, fűrész" in scrape.decode_html(response)


def test_decode_falls_back_to_latin2_without_any_charset():
    response = FakeResponse("Kivetőpánt".encode("iso-8859-2"))
    assert scrape.decode_html(response) == "Kivetőpánt"


def test_decode_respects_a_charset_in_the_http_header():
    response = FakeResponse("fűrész".encode("utf-8"), "text/html; charset=utf-8")
    response.encoding = "utf-8"
    assert scrape.decode_html(response) == "fűrész"


def test_numeric_category_codes_are_accepted(shop):
    shop.add_category("10", make_products(1, 1))
    result = scrape.scrape_code(10, "cat", {})
    assert result[0]["code"] == "10"
