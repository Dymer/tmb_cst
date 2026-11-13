<template>
  <v-container>
    <v-card class="pa-4">

      <v-card-title>
        Szinkronizáció
      </v-card-title>

      <v-card-text>
        <p>
          Az árakat egy szerveren futó program tölti le minden éjjel a butorkellek.hu-ról.
          Itt ennek az eredményét lehet letölteni.
        </p>

        <v-simple-table dense class="mb-4">
          <tbody>
          <tr>
            <td>Adatok frissítve a webshopból</td>
            <td>{{ formatDate(dataGeneratedAt) }}</td>
          </tr>
          <tr>
            <td>Utolsó letöltés</td>
            <td>{{ formatDate(lastDownload) }}</td>
          </tr>
          <tr>
            <td>Termékek száma</td>
            <td>{{ products.length }} db</td>
          </tr>
          </tbody>
        </v-simple-table>

        <v-alert v-if="error" type="error" dense>
          {{ error }}
        </v-alert>

        <v-btn
            color="primary"
            :loading="loading"
            @click="sync"
        >
          <v-icon left>mdi-refresh</v-icon>
          Árak letöltése
        </v-btn>

        <v-list class="mt-4">
          <v-subheader>Kategóriák</v-subheader>
          <v-list-item :key="category.id"
                       v-for="category in categories"
          >
            <v-list-item-content>
              <v-list-item-title>
                {{ category.name }}
                <v-chip v-if="category.stale" x-small color="warning" class="ml-2">
                  régi adat
                </v-chip>
              </v-list-item-title>
              <v-list-item-subtitle>
                Termék szám: {{ getProductCount(category) }} db · M-kódok: {{ category.codes.join(', ') }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <v-expansion-panels flat class="mt-4">
          <v-expansion-panel>
            <v-expansion-panel-header>Haladó beállítások</v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-text-field
                  v-model="dataUrl"
                  label="Adatforrás URL (products.json)"
                  dense
                  outlined
              />
              <v-btn small text @click="dataUrl = defaultDataUrl">Alapértelmezett URL</v-btn>
              <v-btn
                  color="red"
                  small
                  text
                  @click="resetAllDataClicked"
              >
                Összes adat visszaállítása
              </v-btn>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import {DEFAULT_DATA_URL, useSettingsStore} from "../stores/settingsStore";
import {useSyncStore} from "../stores/syncStore";
import {mapActions, mapState, mapWritableState} from "pinia";

export default {
  name: "SynchSettings",
  data() {
    return {
      defaultDataUrl: DEFAULT_DATA_URL,
    }
  },
  computed: {
    ...mapState(useSettingsStore, ["categories", "products", "dataGeneratedAt", "lastDownload"]),
    ...mapWritableState(useSettingsStore, ["dataUrl"]),
    ...mapState(useSyncStore, ["loading", "error"]),
    productCounts() {
      return this.products.reduce((counts, product) => {
        counts[product.categoryId] = (counts[product.categoryId] || 0) + 1;
        return counts;
      }, {});
    },
  },
  methods: {
    ...mapActions(useSettingsStore, ['reset']),
    ...mapActions(useSyncStore, ['sync']),
    getProductCount(category) {
      return this.productCounts[category.id] || 0
    },
    formatDate(value) {
      return value ? new Date(value).toLocaleString('hu-HU') : 'Soha';
    },
    resetAllDataClicked() {
      if (confirm("Biztosan visszaállítod az összes adatot? A kézzel felvett termékek is törlődnek.")) {
        this.reset()
        window.location.reload();
      }
    },
  }
}
</script>
