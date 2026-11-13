import {defineStore} from 'pinia'
import axios from 'axios'
import {useSettingsStore} from './settingsStore'

const AUTO_SYNC_AFTER_MS = 6 * 60 * 60 * 1000; // 6 hours

/** Downloads the products.json published by the scraper (not persisted). */
export const useSyncStore = defineStore('syncStore', {
    state: () => ({
        loading: false,
        error: null,
    }),
    actions: {
        async sync() {
            if (this.loading) return;
            const settings = useSettingsStore();
            this.loading = true;
            this.error = null;
            try {
                const response = await axios.get(settings.dataUrl, {
                    params: {t: Date.now()}, // avoid stale caches
                    timeout: 60000,
                    responseType: 'json',
                });
                const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
                settings.applyRemoteData(data);
            } catch (e) {
                this.error = e.response
                    ? `A letöltés sikertelen (HTTP ${e.response.status}).`
                    : (e.message || String(e));
                console.error('Szinkronizáció hiba:', e);
            } finally {
                this.loading = false;
            }
        },
        /** On startup: refresh in the background when the local copy is old. */
        autoSync() {
            const last = Date.parse(useSettingsStore().lastDownload || '');
            if (!last || Date.now() - last > AUTO_SYNC_AFTER_MS) {
                this.sync();
            }
        },
    },
})
