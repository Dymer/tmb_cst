import {beforeEach, describe, expect, it, vi} from 'vitest'
import {createPinia, setActivePinia} from 'pinia'
import Vue from 'vue'
import {PiniaVuePlugin} from 'pinia'

vi.mock('axios', () => ({default: {get: vi.fn()}}));
import axios from 'axios'

import {DEFAULT_DATA_URL, toNumber, useSettingsStore} from '../src/renderer/stores/settingsStore'
import {DEFAULT_COMMENT, useQuotesStore} from '../src/renderer/stores/quotesStore'
import {useSyncStore} from '../src/renderer/stores/syncStore'

Vue.use(PiniaVuePlugin);

const remoteData = () => ({
    generatedAt: '2026-11-13T15:00:00+00:00',
    categories: [{id: 'a', name: 'A', codes: ['1'], productCount: 2}],
    products: [
        {id: '1', name: 'Pánt', price: '1200', unit: 'db', categoryId: 'a', code: '1'},
        {id: '2', name: 'Láb', price: 300, unit: null, unitMissing: true, categoryId: 'a', code: '1'},
    ],
});

beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(axios.get).mockReset();
});

describe('settingsStore', () => {
    it('toNumber parses Hungarian-style prices', () => {
        expect(toNumber('2 075 Ft')).toBe(2075);
        expect(toNumber('12,5')).toBe(12.5);
        expect(toNumber(undefined)).toBe(0);
    });

    it('applyRemoteData replaces scraped products but keeps hand-added ones', () => {
        const store = useSettingsStore();
        store.products = [
            {id: '999', name: 'Régi webshop termék', price: 1, categoryId: 'a'},
            {id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Kézi', price: 50, manual: true},
        ];

        store.applyRemoteData(remoteData());

        expect(store.products.map(p => p.id)).toEqual(['1', '2', 'f47ac10b-58cc-4372-a567-0e02b2c3d479']);
        expect(store.products[0].price).toBe(1200);
        expect(store.products[1]).toMatchObject({unit: '', unitMissing: true});
        expect(store.categories).toHaveLength(1);
        expect(store.dataGeneratedAt).toBe('2026-11-13T15:00:00+00:00');
        expect(store.lastDownload).toBeTruthy();
    });

    it('applyRemoteData rejects malformed data and leaves the store untouched', () => {
        const store = useSettingsStore();
        store.products = [{id: '1', name: 'x', price: 1}];
        expect(() => store.applyRemoteData({products: 'nope'})).toThrow();
        expect(() => store.applyRemoteData(null)).toThrow();
        expect(store.products).toHaveLength(1);
    });

    it('addProduct replaces a product with the same id in place', () => {
        const store = useSettingsStore();
        store.products = [{id: '1', name: 'a', price: 1}, {id: '2', name: 'b', price: 2}];
        store.addProduct({id: '1', name: 'új', price: '10'});
        expect(store.products.map(p => p.name)).toEqual(['új', 'b']);
        expect(store.products[0].price).toBe(10);
    });

    it('migrate fixes data saved by older versions', () => {
        const store = useSettingsStore();
        store.dataUrl = 'https://raw.githubusercontent.com/bdavid9393/tmb_cst/data/products.json';
        store.products = [
            {id: '12', name: 'scraped', price: '100'},
            {id: '3f0c0b0e-1111-2222-3333-444455556666', name: 'kézi', price: 5, isNew: true, unit: null},
        ];

        store.migrate();

        expect(store.dataUrl).toBe(DEFAULT_DATA_URL);
        expect(store.products[0]).toMatchObject({price: 100, unit: ''});
        expect(store.products[0].manual).toBeUndefined();
        expect(store.products[1]).toMatchObject({manual: true, unit: ''});
        expect(store.products[1].isNew).toBeUndefined();
    });

    it('migrate keeps a custom data URL', () => {
        const store = useSettingsStore();
        store.dataUrl = 'https://example.com/p.json';
        store.migrate();
        expect(store.dataUrl).toBe('https://example.com/p.json');
    });
});

describe('quotesStore', () => {
    it('ensureCurrent creates a first quote with sensible defaults', () => {
        const store = useQuotesStore();
        store.ensureCurrent();
        expect(store.quotes).toHaveLength(1);
        expect(store.current).toMatchObject({workFeePercentage: 40, comment: DEFAULT_COMMENT});
        expect(store.current.groups[0].name).toBe('Alapanyag');
    });

    it('ensureCurrent reopens an existing quote instead of creating one', () => {
        const store = useQuotesStore();
        const first = store.newQuote();
        store.currentId = null;
        store.ensureCurrent();
        expect(store.quotes).toHaveLength(1);
        expect(store.currentId).toBe(first.id);
    });

    it('duplicate makes an independent deep copy with new ids', () => {
        const store = useQuotesStore();
        const original = store.newQuote();
        original.name = 'Konyha';
        original.groups[0].items.push({quoteItemId: 'i1', id: '1', name: 'Pánt', price: 100, quantity: 2});

        const copy = store.duplicate(original.id);

        expect(copy.name).toBe('Konyha (másolat)');
        expect(copy.id).not.toBe(original.id);
        expect(copy.groups[0].id).not.toBe(original.groups[0].id);
        expect(copy.groups[0].items[0].quoteItemId).not.toBe('i1');
        expect(store.currentId).toBe(copy.id);

        copy.groups[0].items[0].quantity = 99;
        expect(original.groups[0].items[0].quantity).toBe(2);
    });

    it('duplicate of an unknown id does nothing', () => {
        const store = useQuotesStore();
        expect(store.duplicate('nope')).toBeNull();
        expect(store.quotes).toHaveLength(0);
    });

    it('remove deletes the quote and clears the current selection', () => {
        const store = useQuotesStore();
        const a = store.newQuote();
        const b = store.newQuote();
        store.remove(b.id);
        expect(store.quotes.map(q => q.id)).toEqual([a.id]);
        expect(store.current).toBeNull();
    });

    it('open ignores unknown ids', () => {
        const store = useQuotesStore();
        const a = store.newQuote();
        store.open('missing');
        expect(store.currentId).toBe(a.id);
    });

    it('touch updates the modification time', () => {
        const store = useQuotesStore();
        const q = store.newQuote();
        q.updatedAt = '2020-01-01T00:00:00.000Z';
        store.touch(q.id);
        expect(q.updatedAt > '2020-01-01T00:00:00.000Z').toBe(true);
    });
});

describe('syncStore', () => {
    it('downloads and applies the data', async () => {
        vi.mocked(axios.get).mockResolvedValue({data: remoteData()});
        const sync = useSyncStore();

        await sync.sync();

        expect(axios.get).toHaveBeenCalledWith(DEFAULT_DATA_URL, expect.objectContaining({params: expect.any(Object)}));
        expect(useSettingsStore().products).toHaveLength(2);
        expect(sync.error).toBeNull();
        expect(sync.loading).toBe(false);
    });

    it('accepts the data delivered as text', async () => {
        vi.mocked(axios.get).mockResolvedValue({data: JSON.stringify(remoteData())});
        await useSyncStore().sync();
        expect(useSettingsStore().products).toHaveLength(2);
    });

    it('reports an HTTP error and keeps the old products', async () => {
        const settings = useSettingsStore();
        settings.products = [{id: '1', name: 'régi', price: 1}];
        vi.mocked(axios.get).mockRejectedValue({response: {status: 404}});
        const sync = useSyncStore();

        await sync.sync();

        expect(sync.error).toBe('A letöltés sikertelen (HTTP 404).');
        expect(settings.products).toHaveLength(1);
        expect(sync.loading).toBe(false);
    });

    it('reports malformed data', async () => {
        vi.mocked(axios.get).mockResolvedValue({data: {hello: 'world'}});
        const sync = useSyncStore();
        await sync.sync();
        expect(sync.error).toMatch(/formátuma hibás/);
    });

    it('autoSync downloads only when the local copy is old', async () => {
        vi.mocked(axios.get).mockResolvedValue({data: remoteData()});
        const settings = useSettingsStore();
        const sync = useSyncStore();

        settings.lastDownload = new Date().toISOString();
        sync.autoSync();
        expect(axios.get).not.toHaveBeenCalled();

        settings.lastDownload = new Date(Date.now() - 7 * 3600 * 1000).toISOString();
        sync.autoSync();
        expect(axios.get).toHaveBeenCalledTimes(1);

    });
});
