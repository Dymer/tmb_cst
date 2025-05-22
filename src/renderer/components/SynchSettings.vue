<template>
  <v-container>
    <v-card class="pa-4">

      <v-card-title>
        Szinkronizáció
      </v-card-title>

      <v-card-text>
        <v-list>
          <v-list-item :key="category.name"
                       v-for="category in categories"
          >
            <v-list-item-title>
              {{ category.name }}
            </v-list-item-title>
            <v-list-item-subtitle
            >
              Termék szám: {{ getProductCount(category) }} db
            </v-list-item-subtitle>
            <v-list-item-subtitle
            >
              Utoljára frissítve: {{ category.lastSync }}
            </v-list-item-subtitle>
            <v-list-item-action>
              <v-btn
                  v-if="!loadingCategories.includes(category.id)"
                  icon
                  @click="refreshCategory(category)"
              >
                <v-icon>mdi-refresh</v-icon>
              </v-btn>

              <v-progress-circular
                  v-else
                  indeterminate
              />


            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import {useSettingsStore} from "../stores/settingsStore";
import {mapActions, mapState} from "pinia";

const {ipcRenderer} = require("electron");


export default {
  name: "SynchSettings",
  data() {
    return {
      loadingCategories: [],
    }
  },
  computed: {
    ...mapState(useSettingsStore, ["categories", "products"]),
  },
  mounted() {
    ipcRenderer.on("python-response", (event, data) => {
      console.log(data)
      const resultData = JSON.parse(data)
      if (resultData.state === "FINISHED") {
        this.loadingCategories.splice(
            this.loadingCategories.indexOf(resultData.categoryId),
            1
        )
      } else {
        this.products.push(resultData)
        if (!this.loadingCategories.includes(resultData.categoryId)) {
          this.loadingCategories.push(resultData.categoryId)
        }
      }

    });
  },
  methods: {
    ...mapActions(useSettingsStore, ['deleteCategoryItemsFromProducts', 'updateSynchTime']),
    refreshCategory(category) {
      this.deleteCategoryItemsFromProducts(category.id)
      this.loadingCategories.push(category.id)
      category.codes.forEach((code) => {
        ipcRenderer.send("run-python", [code, category.id]);
      })
      this.updateSynchTime(category.id)
    },

    getProductCount(category) {
      return this.products.filter(product => product.categoryId === category.id).length
    }
  }
}
</script>


<style scoped>

</style>