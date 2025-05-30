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
            v-model="price"
            label="Ár"
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
import {mapState} from "pinia";
import {useSettingsStore} from "../stores/settingsStore";
import {v4 as uuidv4} from 'uuid'

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
    ...mapState(useSettingsStore, ["categories", "addProduct"]),
  },
  watch: {
    product: {
      handler(val) {
        this.name = val.name;
        this.price = val.price;
        this.category = val.categoryId;
        this.unit = val.unit;
      },
    }
  },
  methods: {
    openEditor(product) {
      this.product = product;
      this.dialog = true;
    },
    saveProduct() {
      this.product.name = this.name;
      this.product.price = this.price;
      this.product.categoryId = this.category;
      this.product.unit = this.unit;
      if (this.product.isNew) {
        this.product.id = uuidv4();
        this.addProduct(this.product);
      }
      this.dialog = false;
    }
  },
}
</script>

<style scoped>

</style>