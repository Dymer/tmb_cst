<template>
  <v-container>
    <v-card class="pa-4">

      <v-card-title>
        Szinkronizáció
      </v-card-title>

      <v-card-text>
        <v-btn
            color="red"
            @click="resetAllDataClicked"
        >
          Összes adat visszaállítása
        </v-btn>

        <v-text-field
            v-model="concurrentLimit"
            label="Maximális párhuzamos szinkronizálás"
            type="number"
        />

        <v-btn
            color="primary"
            @click="startAllCategories"
          >
          Összes inditása
        </v-btn>

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
              <v-progress-circular
                  v-if="isCategoryLoading(category)"

                  indeterminate
              />

              <v-btn
                  v-else
                  icon
                  @click="refreshCategory(category)"
              >
                <v-icon>mdi-refresh</v-icon>
              </v-btn>

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
      loadingCodes: {},
      concurrentLimit: 7,
    }
  },
  computed: {
    ...mapState(useSettingsStore, ["categories", "products"]),
  },
  watch: {
    loadingCodes: {
      handler(newVal) {
        console.log("Loading codes változás:", newVal);
        const loadingNumber = Object.values(newVal).filter(val => val === "LOADING").length;
        if (loadingNumber >= this.concurrentLimit) {
          console.log("Valami még tölt...");
          return;
        }
        const nextCode = Object.keys(newVal).find(code => newVal[code] === "WAITING");
        if (!nextCode) {
          console.log("Nincs több kód");
          return;
        }
        const category = this.categories.find(cat => cat.codes.includes(nextCode));
        console.log("Következő kód:", nextCode, " kategória:", category);
        ipcRenderer.send("run-python", [nextCode, category.id]);
        this.$set(this.loadingCodes, nextCode, "LOADING")
      },
      deep: true,
    },
  },
  mounted() {
    ipcRenderer.on("python-response", (event, data) => {
      console.log(data)
      const resultData = JSON.parse(data)
      if (resultData.state === "FINISHED") {
        this.$set(this.loadingCodes, resultData.code, "FINISHED")
      } else {
        this.addProduct(resultData)
        // if (!this.loadingCodes.includes(resultData.code)) {
        //   this.loadingCodes.push(resultData.code)
        // }
      }

    });
    ipcRenderer.on("python-error", (event, data) => {
      console.error(data)
    });

  },
  methods: {
    ...mapActions(useSettingsStore, ['deleteCategoryItemsFromProducts', 'updateSynchTime', 'reset', 'addProduct']),
    refreshCategory(category) {
      this.deleteCategoryItemsFromProducts(category.id)
      category.codes.forEach(code => {
        console.log("Feltöltés: ", code)
        this.$set(this.loadingCodes, code, "WAITING")
      })
      console.log(this.loadingCodes)
      this.updateSynchTime(category.id)
    },

    getProductCount(category) {
      return this.products.filter(product => product.categoryId === category.id).length
    },
    resetAllDataClicked() {
      if (confirm("Biztosan visszaállítod az összes adatot?")) {
        this.reset()
        window.location.reload();
      }
    },
    isCategoryLoading(category) {
      return category.codes.some(code => this.loadingCodes[code] === "LOADING" || this.loadingCodes[code] === "WAITING")
    },
    startAllCategories() {
      this.categories.forEach(category => {
        this.refreshCategory(category)
      })
    },
  }
}
</script>


<style scoped>

</style>