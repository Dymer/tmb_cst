import {defineStore} from 'pinia'
import {v4 as uuidv4} from 'uuid'

export const DEFAULT_COMMENT = "Elkészített árajánlat tartalmazza az alapanyag és szerelvények beszerzését, bútorelemek előzetes illetve helyszíni szerelését.  Lapszabászati idő: kb. 2 hét. Gyártás és összeszerelés együtt kb. 2 hét.\nA kiválasztott bútorlapokat táblában forgalmazzák a lapszabászatok, tehát ez azt jelenti, hogy a lapszabászat során keletkező maradék táblákat is meg kell vásárolni!!!\nÉrdemes körülnézni színválasztáshoz a SOMY Kft-nél is, mert náluk szélesebb palettából lehet választani olyan bútorlapot, amit szabnak és nem kell megvenni az egész táblát.  Természetesen az általatok választott színekből is el lehet készíteni a konyhabútort."

function blankQuote() {
    const now = new Date().toISOString();
    return {
        id: uuidv4(),
        name: '',
        createdAt: now,
        updatedAt: now,
        workFeePercentage: 40,
        comment: DEFAULT_COMMENT,
        groups: [{id: uuidv4(), name: 'Alapanyag', items: []}],
    };
}

/** Saved quotes; every change is stored in the browser automatically. */
export const useQuotesStore = defineStore('quotesStore', {
    state: () => ({
        quotes: [],
        currentId: null,
    }),
    getters: {
        current: (state) => state.quotes.find(q => q.id === state.currentId) || null,
    },
    actions: {
        newQuote() {
            const quote = blankQuote();
            this.quotes.unshift(quote);
            this.currentId = quote.id;
            return quote;
        },
        /** Make sure there is a quote to edit (the last one used, or a new one). */
        ensureCurrent() {
            if (!this.current) {
                if (this.quotes.length) {
                    this.currentId = this.quotes[0].id;
                } else {
                    this.newQuote();
                }
            }
        },
        open(id) {
            if (this.quotes.some(q => q.id === id)) {
                this.currentId = id;
            }
        },
        duplicate(id) {
            const source = this.quotes.find(q => q.id === id);
            if (!source) return null;
            const now = new Date().toISOString();
            const copy = JSON.parse(JSON.stringify(source));
            copy.id = uuidv4();
            copy.name = `${source.name || 'Névtelen ajánlat'} (másolat)`;
            copy.createdAt = now;
            copy.updatedAt = now;
            copy.groups.forEach(group => {
                group.id = uuidv4();
                group.items.forEach(item => {
                    item.quoteItemId = uuidv4();
                });
            });
            this.quotes.unshift(copy);
            this.currentId = copy.id;
            return copy;
        },
        remove(id) {
            this.quotes = this.quotes.filter(q => q.id !== id);
            if (this.currentId === id) {
                this.currentId = null;
            }
        },
        touch(id) {
            const quote = this.quotes.find(q => q.id === id);
            if (quote) {
                quote.updatedAt = new Date().toISOString();
            }
        },
    },
    persist: true,
})
