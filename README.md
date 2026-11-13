# Árajánlat készítő

Webes árajánlat készítő bútorgyártáshoz. A termékárakat hetente letölti a
[butorkellek.hu](https://www.butorkellek.hu/) webshopból, az ajánlatot Excel fájlba exportálja.

**Weboldal:** https://dymer.github.io/tmb_cst/

## Részek

| Mappa | Mit csinál |
|---|---|
| `src/renderer/` | Vue 2 + Vuetify webalkalmazás (ajánlatkészítő, mentett ajánlatok, termékek, szinkronizáció) |
| `scraper/` | Python program, amely letölti az árakat; a kategóriák listája: `scraper/categories.json` |
| `.github/workflows/scrape.yml` | Hetente (hétfő 01:00 UTC) lefuttatja a scrapert, az eredmény a `data` ágon: `products.json` |
| `.github/workflows/pages.yml` | Minden változásnál újraépíti és közzéteszi a weboldalt (GitHub Pages) |

Az ajánlatok és a kézzel felvett termékek a böngészőben tárolódnak (eszközönként külön).

## Fejlesztés

```bash
npm install
npm run dev      # fejlesztői szerver: http://localhost:8080
npm run build    # éles build a build/web mappába
```

Scraper helyben:

```bash
pip install -r scraper/requirements.txt
python scraper/scrape.py --categories scraper/categories.json --output products.json
```
