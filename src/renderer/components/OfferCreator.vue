<template>
  <v-container fluid>
    <v-row>
      <!-- Terméklista -->
      <v-col cols="12" md="6">
        <v-card elevation="5">
          <v-card-title>Terméklista</v-card-title>

          <v-card-text>
            <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                label="Keresés (név, mértékegység, kategória, M-kód)"
                hint="Ékezet nélkül is kereshetsz, pl. „fiok sin”"
                clearable
                outlined
                dense
            />
            <v-data-table
                :headers="productHeaders"
                :items="filteredProducts"
                :items-per-page="20"
                dense
                :footer-props="{ itemsPerPageOptions: [5, 10, 20, 50, 100, -1] }"
                group-by="categoryName"
                no-data-text="Nincsenek termékek – töltsd le az árakat a Szinkronizáció oldalon."
                no-results-text="Nincs találat."
            >
              <template v-slot:item.name="{ item }">
                {{ item.name }}
                <a
                    v-if="!item.manual"
                    :href="shopUrl(item)"
                    target="_blank"
                    rel="noopener"
                    title="Megnyitás a webshopban"
                    class="text-decoration-none"
                >
                  <v-icon x-small>mdi-open-in-new</v-icon>
                </a>
              </template>

              <template v-slot:item.price="{ item }">
                {{ formatPrice(item.price) }}
              </template>

              <template v-slot:item.unit="{ item }">
                {{ item.unit }}
                <v-icon
                    v-if="item.unitMissing"
                    x-small
                    color="warning"
                    title="A webshop nem adott meg mértékegységet, „db”-nak feltételezve"
                >
                  mdi-alert-outline
                </v-icon>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn icon small title="Hozzáadás az ajánlathoz" @click="addToQuote(item)">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Ajánlat -->
      <v-col cols="12" md="6">
        <v-card v-if="quote" elevation="5">
          <v-card-title>
            Ajánlat
            <v-spacer/>
            <v-btn text small class="mr-1" @click="newQuote">
              <v-icon left small>mdi-file-plus</v-icon>
              Új ajánlat
            </v-btn>
            <v-btn text small to="/quotes">
              <v-icon left small>mdi-folder-open</v-icon>
              Mentett ajánlatok
            </v-btn>
          </v-card-title>
          <v-card-subtitle>
            Automatikusan mentve · utoljára módosítva: {{ formatDateTime(quote.updatedAt) }}
          </v-card-subtitle>

          <v-card-text>
            <v-text-field v-model="quote.name" label="Ajánlat neve" dense outlined/>
            <v-select
                v-model="selectedGroupIndex"
                :items="groupOptions"
                label="Melyik csoporthoz adja hozzá?"
                dense
                outlined
            />

            <div v-for="(group, gIndex) in quote.groups" :key="group.id" class="mt-4">
              <v-card
                  elevation="10"
                  outlined
                  :class="gIndex === selectedGroupIndex ? 'selected-group' : ''"
              >
                <v-card-title>
                  <v-text-field
                      v-model="group.name"
                      label="Csoport neve"
                      dense
                      outlined
                      hide-details
                      append-icon="mdi-delete"
                      @click:append="removeGroup(gIndex)"
                  />
                </v-card-title>

                <v-card-text>
                  <v-row v-if="group.items.length" dense class="caption grey--text">
                    <v-col cols="4">Megnevezés</v-col>
                    <v-col cols="2">Mennyiség</v-col>
                    <v-col cols="1">Egység</v-col>
                    <v-col cols="2">Egységár</v-col>
                    <v-col cols="2" class="text-right">Ár</v-col>
                    <v-col cols="1"/>
                  </v-row>

                  <draggable
                      v-model="group.items"
                      class="list-group"
                      handle=".drag-handle"
                      v-bind="dragOptions"
                  >
                    <v-row
                        v-for="item in group.items"
                        :key="item.quoteItemId"
                        dense
                        align="center"
                    >
                      <template v-if="item.custom">
                        <v-col cols="4">
                          <v-text-field v-model="item.name" placeholder="Megnevezés" dense hide-details/>
                        </v-col>
                        <v-col cols="2">
                          <v-text-field v-model.number="item.quantity" type="number" min="0" dense hide-details/>
                        </v-col>
                        <v-col cols="1">
                          <v-text-field v-model="item.unit" dense hide-details/>
                        </v-col>
                        <v-col cols="2">
                          <v-text-field v-model.number="item.price" type="number" min="0" suffix="Ft" dense hide-details/>
                        </v-col>
                      </template>
                      <template v-else>
                        <v-col cols="4">{{ item.name }}</v-col>
                        <v-col cols="2">
                          <v-text-field v-model.number="item.quantity" type="number" min="0" dense hide-details/>
                        </v-col>
                        <v-col cols="1">{{ item.unit }}</v-col>
                        <v-col cols="2">{{ formatPrice(item.price) }}</v-col>
                      </template>
                      <v-col cols="2" class="text-right">{{ formatPrice(lineTotal(item)) }}</v-col>
                      <v-col cols="1" class="d-flex align-center">
                        <v-btn icon x-small title="Törlés" @click="removeFromGroup(group, item)">
                          <v-icon small>mdi-delete</v-icon>
                        </v-btn>
                        <span class="drag-handle" title="Áthúzás">
                          <v-icon small>mdi-drag</v-icon>
                        </span>
                      </v-col>
                    </v-row>
                  </draggable>

                  <v-btn text small color="primary" class="mt-2" @click="addCustomItem(group)">
                    <v-icon left small>mdi-pencil-plus</v-icon>
                    Egyedi tétel
                  </v-btn>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>

          <v-card-actions class="mt-2">
            <v-spacer/>
            <v-btn color="primary" @click="addGroup">
              <v-icon left>mdi-plus</v-icon>
              Új csoport hozzáadása
            </v-btn>
            <v-spacer/>
          </v-card-actions>

          <v-divider class="my-4"/>
          <v-card-text>
            <v-simple-table class="my-4">
              <thead>
              <tr>
                <th class="text-left">Összesen:</th>
                <th class="text-right">{{ formatPrice(totals.subtotal) }}</th>
              </tr>
              </thead>
              <tbody>
              <tr>
                <td>
                  <v-text-field
                      v-model.number="quote.workFeePercentage"
                      label="Munkadíj százalékban"
                      class="mt-3"
                      dense
                      style="width: 200px"
                      outlined
                      type="number"
                  />
                </td>
                <td class="text-right">
                  {{ formatPrice(totals.workFee) }}
                </td>
              </tr>
              <tr>
                <td><strong>Végösszeg:</strong></td>
                <td class="text-right">
                  <strong>{{ formatPrice(totals.total) }}</strong>
                </td>
              </tr>
              </tbody>
            </v-simple-table>
            <v-textarea
                v-model="quote.comment"
                label="Megjegyzés"
                outlined
                dense
                rows="5"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer/>
            <v-btn color="primary" @click="generateQuote">Ajánlat készítése (Excel)</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import draggable from 'vuedraggable';
import {mapActions, mapState} from "pinia";
import {v4 as uuidv4} from "uuid";
import {useSettingsStore} from "../stores/settingsStore";
import {useQuotesStore} from "../stores/quotesStore";
import generateExcel from "../excelExport";
import {formatDateTime, formatPrice, lineTotal, normalizeText, quoteTotals, shopUrl} from "../quoteUtils";

export default {
  name: "OfferCreator",
  components: {
    draggable
  },
  data() {
    return {
      search: '',
      selectedGroupIndex: 0,
      signatureQuoteId: null,
      productHeaders: [
        {text: "Termék", value: "name"},
        {text: "Ár", value: "price"},
        {text: "Mértékegység", value: "unit"},
        {text: "Kategória", value: "categoryName"},
        {text: "", value: "actions", sortable: false}
      ],
      dragOptions: {
        animation: 200,
        group: 'quote-items',
        disabled: false,
        ghostClass: 'ghost'
      },
    };
  },
  computed: {
    ...mapState(useSettingsStore, ["products", "categories"]),
    ...mapState(useQuotesStore, {quote: "current"}),
    categoryNames() {
      return Object.fromEntries(this.categories.map(c => [c.id, c.name]));
    },
    productsWithCategory() {
      return this.products.map(p => {
        const categoryName = this.categoryNames[p.categoryId] || '';
        return {
          ...p,
          categoryName,
          searchText: normalizeText([p.name, p.unit, categoryName, p.code].join(' ')),
        };
      });
    },
    filteredProducts() {
      // every word must occur somewhere, in any order: "sin fiok" finds "Fiók sín"
      const words = normalizeText(this.search).split(/\s+/).filter(Boolean);
      if (!words.length) return this.productsWithCategory;
      return this.productsWithCategory.filter(p => words.every(w => p.searchText.includes(w)));
    },
    totals() {
      return quoteTotals(this.quote);
    },
    groupOptions() {
      return (this.quote?.groups || []).map((group, index) => ({text: group.name || `Csoport ${index + 1}`, value: index}));
    },
    // Everything except the timestamp, to detect real changes
    quoteSignature() {
      if (!this.quote) return '';
      // eslint-disable-next-line no-unused-vars
      const {updatedAt, ...rest} = this.quote;
      return JSON.stringify(rest);
    },
  },
  watch: {
    quoteSignature(newVal, oldVal) {
      const id = this.quote?.id || null;
      // Only a change of the same quote counts as an edit, not opening another one
      if (oldVal && id && id === this.signatureQuoteId) {
        this.touch(id);
      }
      this.signatureQuoteId = id;
    },
    'quote.id'() {
      this.selectedGroupIndex = 0;
    },
  },
  created() {
    this.ensureCurrent();
    this.signatureQuoteId = this.quote?.id || null;
  },
  methods: {
    ...mapActions(useQuotesStore, ['ensureCurrent', 'touch']),
    formatPrice,
    formatDateTime,
    lineTotal,
    shopUrl,
    newQuote() {
      useQuotesStore().newQuote();
    },
    addGroup() {
      this.quote.groups.push({id: uuidv4(), name: '', items: []});
      this.selectedGroupIndex = this.quote.groups.length - 1;
    },
    removeGroup(index) {
      const group = this.quote.groups[index];
      if (group.items.length && !confirm(`Biztosan törlöd a(z) „${group.name || 'névtelen'}” csoportot a tételeivel együtt?`)) {
        return;
      }
      this.quote.groups.splice(index, 1);
      if (this.selectedGroupIndex >= this.quote.groups.length) {
        this.selectedGroupIndex = Math.max(0, this.quote.groups.length - 1);
      }
    },
    currentGroup() {
      if (this.quote.groups.length === 0) {
        this.addGroup();
      }
      return this.quote.groups[this.selectedGroupIndex] || this.quote.groups[0];
    },
    addToQuote(product) {
      const group = this.currentGroup();
      const existing = group.items.find(p => !p.custom && p.id === product.id);
      if (existing) {
        existing.quantity = (Number(existing.quantity) || 0) + 1;
      } else {
        // eslint-disable-next-line no-unused-vars
        const {categoryName, searchText, ...item} = product;
        group.items.push({...item, quoteItemId: uuidv4(), quantity: 1});
      }
    },
    addCustomItem(group) {
      group.items.push({
        quoteItemId: uuidv4(),
        custom: true,
        id: null,
        name: '',
        quantity: 1,
        unit: 'db',
        price: 0,
      });
    },
    removeFromGroup(group, item) {
      group.items = group.items.filter(p => p.quoteItemId !== item.quoteItemId);
    },
    generateQuote() {
      generateExcel({
        name: this.quote.name,
        groups: this.quote.groups,
        workFeePercentage: this.quote.workFeePercentage,
        comment: this.quote.comment
      }).catch(err => {
        console.error(err);
        alert("Hiba az Excel fájl készítése során: " + err.message);
      })
    },
  }
};
</script>

<style scoped>
.selected-group {
  border: 2.5px solid var(--v-primary-base);
}

.drag-handle {
  cursor: grab;
}
</style>
