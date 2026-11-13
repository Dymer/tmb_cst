import {defineStore} from 'pinia'

/**
 * products.json published by the "Scrape products" GitHub Action (see scraper/).
 * Can be overridden on the Szinkronizáció page.
 */
export const DEFAULT_DATA_URL = 'https://raw.githubusercontent.com/Dymer/tmb_cst/data/products.json'
const OLD_DATA_URLS = ['https://raw.githubusercontent.com/bdavid9393/tmb_cst/data/products.json']

export function toNumber(value) {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(String(value ?? '').replace(/[^\d,.-]/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
}

// Scraped products have the webshop's numeric id; hand-added ones get a uuid.
const isManualProduct = product => product.manual || /[^\d]/.test(String(product.id));

export const useSettingsStore = defineStore('settingsStore', {

    state: () => ({
        dataUrl: DEFAULT_DATA_URL,
        dataGeneratedAt: null, // when the scraper produced the data
        lastDownload: null,    // when this app last downloaded it
        categories: [],
        products: []
    }),
    actions: {
        /** Replace the scraped categories and products; hand-added products are kept. */
        applyRemoteData(data) {
            if (!data || !Array.isArray(data.categories) || !Array.isArray(data.products)) {
                throw new Error('A letöltött adat formátuma hibás.');
            }
            const manual = this.products.filter(isManualProduct);
            const remote = data.products.map(p => ({
                ...p,
                price: toNumber(p.price),
                unit: p.unit || '',
            }));
            this.$patch(state => {
                state.categories = data.categories;
                state.products = [...remote, ...manual];
                state.dataGeneratedAt = data.generatedAt || null;
                state.lastDownload = new Date().toISOString();
            });
        },
        deleteProductById(productId) {
            this.products = this.products.filter(product => product.id !== productId);
        },
        addProduct(product) {
            const normalized = {...product, price: toNumber(product.price), unit: product.unit || ''};
            const index = this.products.findIndex(p => p.id === normalized.id);
            if (index >= 0) {
                this.products.splice(index, 1, normalized);
            } else {
                this.products.push(normalized);
            }
        },
        // Fix data saved by older versions of the app
        migrate() {
            if (!this.dataUrl || OLD_DATA_URLS.includes(this.dataUrl)) {
                this.dataUrl = DEFAULT_DATA_URL;
            }
            this.products.forEach(product => {
                if (typeof product.price !== 'number') {
                    product.price = toNumber(product.price);
                }
                if (product.unit == null) {
                    product.unit = '';
                }
                if (isManualProduct(product)) {
                    product.manual = true;
                }
                delete product.isNew;
            });
        },

        reset() {
            this.$reset();
        }

    },
    persist: true
})
