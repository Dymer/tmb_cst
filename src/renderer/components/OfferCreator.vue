<template>
  <v-container fluid>
    <v-row>
      <!-- Terméklista -->
      <v-col cols="6">
        <v-card elevation="5">
          <v-card-title>Terméklista</v-card-title>

          <v-card-text>
            <v-data-table
                :headers="productHeaders"
                :items="filteredProducts"
                :items-per-page="20"
                dense
                :footer-props="{ itemsPerPageOptions: [5, 10, 20, 50,100, -1] }"
                group-by="categoryName">

              <template v-slot:body.prepend="{ props }">
                <tr>
                  <td>
                    <v-text-field
                        v-model="productFilter"
                        prepend-inner-icon="mdi-tag-text-outline"
                    />
                  </td>
                  <td>

                  </td>
                  <td>
                    <v-text-field
                        v-model="unitFilter"
                        prepend-inner-icon="mdi-tag-text-outline"
                    />


                  </td>
                </tr>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn icon @click="addToQuote(item)">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Ajánlatok -->
      <v-col cols="6">
        <v-card elevation="5">
          <v-card-title>
            Ajánlat
          </v-card-title>
          <v-card-text>

            <v-text-field v-model="quoteName" label="Ajánlat neve" dense outlined></v-text-field>
            <v-select v-model="selectedGroupIndex" :items="groupOptions" label="Melyik csoporthoz adja hozzá?" dense
                      outlined/>
            <div v-for="(group, gIndex) in groups" :key="gIndex" class="mt-4">
              <v-card
                  elevation="10"
                  outlined
                  :class="gIndex === selectedGroupIndex ? 'selected-group' : ''"
              >
                <v-card-title>
                  <v-row>
                    <v-col :cols="12">
                      <v-text-field
                          v-model="group.name"
                          label="Csoport neve"
                          dense
                          outlined
                          append-icon="mdi-delete"
                          @click:append="removeGroup(gIndex)"
                      />
                    </v-col>
                  </v-row>

                </v-card-title>
                <v-list>
                  <draggable class="list-group" handle=".drag-handle" v-bind="dragOptions" v-model="group.items">
                    <v-list-item v-for="(item, index) in group.items" :key="item.id">
                      <v-row align="center">
                        <v-col cols="4">{{ item.name }}</v-col>
                        <v-col cols="3">
                          <v-text-field v-model.number="item.quantity" type="number" dense></v-text-field>
                        </v-col>
                        <v-col cols="3">{{ item.price * item.quantity }} Ft</v-col>
                        <v-col cols="1">
                          <v-btn icon @click="removeFromGroup(group, item)">
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </v-col>
                        <v-col cols="1">
                           <span class="drag-handle">
                               <v-icon class="mdi-drag">mdi-drag</v-icon>
                           </span>
                        </v-col>
                      </v-row>
                    </v-list-item>
                  </draggable>
                </v-list>
              </v-card>
            </div>
          </v-card-text>

          <v-card-actions class="mt-5">
            <v-spacer></v-spacer>
            <v-btn color="primary"
                   align="center"
                   @click="addGroup">
              <v-icon>mdi-plus</v-icon>
              Új csoport hozzáadása
            </v-btn>
            <v-spacer/>
          </v-card-actions>

          <v-divider class="my-4"></v-divider>
          <v-card-text>
            <v-simple-table class="my-4">
              <thead>
              <tr>
                <th class="text-left">Összesen:</th>
                <th class="text-right">{{ formatPrice(totalPrice) }}</th>
              </tr>
              </thead>
              <tbody>
              <tr>
                <td>
                  <v-text-field
                      v-model="workFeePercentage"
                      label="Munkadíj százalékban"
                      class="mt-3"
                      dense
                      style="width: 200px"
                      outlined
                      type="number"
                  />
                </td>
                <td class="text-right">
                  {{ formatPrice(totalPrice * workFeePercentage / 100) }}
                </td>
              </tr>
              <tr>
                <td><strong>Végösszeg:</strong></td>
                <td class="text-right">
                  {{ formatPrice(totalPrice + (totalPrice * workFeePercentage / 100)) }}
                </td>
              </tr>
              </tbody>
            </v-simple-table>
            <v-textarea
                v-model="comment"
                label="Megjegyzés"
                outlined
                dense
                rows="5"
            ></v-textarea>

          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="generateQuote">Ajánlat készítése</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import draggable from 'vuedraggable';
import {mapState} from "pinia";
import {useSettingsStore} from "../stores/settingsStore";
import generateExcel from "../excelExport";

export default {
  components: {
    draggable
  },
  data() {
    return {
      quoteName: '',
      productFilter: '',
      unitFilter: '',
      selectedGroupIndex: 0,
      groups: [{name: 'Alapanyag', items: []}],
      productHeaders: [
        {text: "Termék", value: "name"},
        {text: "Ár", value: "price"},
        {text: "Mértékegység", value: "unit"},
        {text: "Kategória", value: "categoryName"},
        {text: "", value: "actions", sortable: false}
      ],
      dragOptions: {
        animation: 200,
        group: 'description',
        disabled: false,
        ghostClass: 'ghost'
      },
      dragOptionsGroup: {
        animation: 200,
        group: 'description',
        disabled: false,
        ghostClass: 'ghost'
      },
      workFeePercentage: 40,
      comment: "Elkészített árajánlat tartalmazza az alapanyag és szerelvények beszerzését, bútorelemek előzetes illetve helyszíni szerelését.  Lapszabászati idő: kb. 2 hét. Gyártás és összeszerelés együtt kb. 2 hét.\nA kiválasztott bútorlapokat táblában forgalmazzák a lapszabászatok, tehát ez azt jelenti, hogy a lapszabászat során keletkező maradék táblákat is meg kell vásárolni!!!\nÉrdemes körülnézni színválasztáshoz a SOMY Kft-nél is, mert náluk szélesebb palettából lehet választani olyan bútorlapot, amit szabnak és nem kell megvenni az egész táblát.  Természetesen az általatok választott színekből is el lehet készíteni a konyhabútort."
    };
  },
  computed: {
    ...mapState(useSettingsStore, ["products", "categories"]),
    filteredProducts() {
      return this.productsWithCategory
          .filter(p => p.name.toLowerCase().includes(this.productFilter.toLowerCase()))
          .filter(p => p.unit.toLowerCase().includes(this.unitFilter.toLowerCase()))
          ;
    },
    totalPrice() {
      return this.groups.reduce((sum, group) => sum + group.items.reduce((gSum, item) => gSum + item.price * item.quantity, 0), 0);
    },
    productsWithCategory() {
      return this.products.map(p => ({...p, categoryName: this.getCategoryName(p.categoryId)}));
    },
    groupOptions() {
      return this.groups.map((group, index) => ({text: group.name || `Csoport ${index + 1}`, value: index}));
    }
  },
  methods: {
    addGroup() {
      this.groups.push({name: '', items: []});
    },
    removeGroup(index) {
      this.groups.splice(index, 1);
    },
    addToQuote(product) {
      if (this.selectedGroupIndex === null) return;
      const currentGroup = this.groups[this.selectedGroupIndex];
      const existing = currentGroup.items.find(p => p.id === product.id);
      if (existing) {
        existing.quantity++;
      } else {
        currentGroup.items.push({...product, quantity: 1});
      }
    },
    removeFromGroup(group, item) {
      group.items = group.items.filter(p => p.id !== item.id);
    },
    generateQuote() {
      generateExcel({
        name: this.quoteName,
        groups: this.groups,
        workFeePercentage: this.workFeePercentage,
        comment: this.comment
      })
    },
    getCategoryName(categoryId) {
      return this.categories.find(category => category.id === categoryId)?.name || '';
    },
    formatPrice(price) {
      return new Intl.NumberFormat('hu-HU', {style: 'currency', currency: 'HUF'}).format(price);
    }
  }
};
</script>

<style scoped>
.selected-group {
  border: 2.5px solid var(--v-primary-base);
}

v-simple-table {
  width: 100%;
  border-collapse: collapse;
}

v-simple-table th, v-simple-table td {
  padding: 12px 16px;
  font-size: 16px;
}

v-simple-table th {
  background-color: #f5f5f5;
}

v-simple-table td {
  background-color: #ffffff;
}
</style>

