<template>
  <v-dialog
      v-model="dialog"
      max-width="290"
  >
    <v-card>
      <v-card-title
          class="headline"
          primary-title
      >
        Termék szerkesztés
      </v-card-title>
      <v-card-text>
        <v-text-field
            v-model="name"
            label="Név"
        />
        <v-text-field
            v-model.number="price"
            label="Ár"
            type="number"
        />
        <v-select
            v-model="category"
            :items="categories"
            item-text="name"
            item-value="id"
            label="Category"
        />
        <v-text-field
            v-model="unit"
            label="Mértékegység"
        />
      </v-card-text>

      <v-card-actions
          class="d-flex justify-end"
      >
        <v-btn
            color="blue darken-1"
            text
            @click="dialog = false"
        >
          Mégsem
        </v-btn>
        <v-btn
            color="blue darken-1"
            text
            @click="saveProduct"
        >
          Mentés
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import {mapActions, mapState} from "pinia";
import {useSettingsStore} from "../stores/settingsStore";

export default {
  name: "ProductEditDialog",
  data() {
    return {
      dialog: false,
      product: null,
      name: "",
      unit: "db",
      price: 0,
      category: null,
    };
  },
  computed: {
    ...mapState(useSettingsStore, ["categories"]),
  },
  methods: {
    ...mapActions(useSettingsStore, ["addProduct"]),
    openEditor(product) {
      // Always reload the fields, so values from a cancelled edit don't remain
      this.product = product;
      this.name = product.name || "";
      this.price = product.price ?? 0;
      this.category = product.categoryId ?? null;
      this.unit = product.unit || "db";
      this.dialog = true;
    },
    saveProduct() {
      const {isNew, ...original} = this.product;
      // addProduct replaces an existing product (same id), or adds a new one
      this.addProduct({
        ...original,
        name: this.name,
        price: this.price,
        categoryId: this.category,
        unit: this.unit,
      });
      this.dialog = false;
    }
  },
}
</script>

<style scoped>

</style>