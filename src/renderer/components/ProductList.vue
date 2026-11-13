<template>
  <v-container>
    <v-card class="pa-4">
      <v-card-title>
        Termékek
        <v-spacer/>
        <v-btn
            color="primary"
            @click="$refs.editDialog.openEditor(
                {id: getId(), name: '', price: 0, unit: 'db', categoryId: null, manual: true}
            )"
        >
          Új termék
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-data-table
            :headers="headers"
            :items="products"
            :items-per-page="10"
            class="elevation-1"
        >
          <template #item.actions="{ item }">
            <v-icon small @click="editProduct(item)">mdi-pencil</v-icon>
            <v-icon small @click="deleteProduct(item)">mdi-delete</v-icon>
          </template>

          <template #item.category="{ item }">
            {{ getCategoryName(item.categoryId) }}
          </template>

        </v-data-table>
      </v-card-text>
    </v-card>
    <ProductEditDialog
        ref="editDialog"
    />
  </v-container>

</template>

<script>
import {mapActions, mapState} from "pinia";
import {useSettingsStore} from "../stores/settingsStore";
import ProductEditDialog from "./ProductEditDialog.vue";
import { v4 as uuidv4 } from 'uuid'


export default {
  name: "ProductList",
  components: {ProductEditDialog},
  data() {
    return {
      headers: [
        {
          value: 'actions',
        },
        {
          text: 'Név',
          align: 'start',
          sortable: true,
          value: 'name',
        },
        {text: 'Ár', value: 'price'},
        {text: 'Kategória', value: 'category', sortable: false},
        {text: 'Mértékegység', value: 'unit'},
        {text: 'M-kód', value: 'code'},
        {text: 'Azonosító', value: 'id'},
      ],
    }
  },
  computed: {
    ...mapState(useSettingsStore, ["products", "categories"]),
  },

  methods: {
    ...mapActions(useSettingsStore, ['deleteProductById']),
    editProduct(product) {
      this.$refs.editDialog.openEditor(product)
    },
    deleteProduct(product) {
      if (confirm('Biztosan törölni szeretnéd a terméket?')) {
        this.deleteProductById(product.id)
      }

    },
    getCategoryName(categoryId) {
      return this.categories.find(category => category.id === categoryId)?.name || ''
    },
    getId(){
      return uuidv4()
    }
  }
}
</script>


<style scoped>

</style>