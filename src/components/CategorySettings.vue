<template>
  <v-container>
    <v-card class="pa-4">
      <h2>Kategóriák kezelése</h2>

      <v-card class="mt-4"
              elevation="10"
              v-for="(category, catIndex) in categories" :key="catIndex">
        <v-card-text>
          <v-text-field
              v-model="category.name"
              label="Kategória neve"
              outlined
              dense
              @change="updateCategory(catIndex, category.name)"
          ></v-text-field>

          <v-row >
            <v-col>
              <v-combobox
                  v-model="category.codes"
                  :items="[]"
                  hide-selected
                  outlined
                  label="M-Kódok"
                  multiple
                  persistent-hint
                  deletable-chips
                  chips
              >
                <template v-slot:no-data>
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-title>
                        Press <kbd>enter</kbd> to create a new one
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </template>
              </v-combobox>
            </v-col>
            <v-col cols="1" class="justify-center align-content-center">
              <v-btn color="red" @click="removeCategory(catIndex)" icon>
                <v-icon color="red">mdi-delete</v-icon>
              </v-btn>
            </v-col>
          </v-row>


        </v-card-text>
      </v-card>
      <v-card
          class="mt-4"
      >
        <v-card-text>
          <v-text-field v-model="newCategory" label="Új kategória" outlined dense class="mt-4"></v-text-field>
          <v-btn color="green" @click="addCategory">Kategória hozzáadása</v-btn>
        </v-card-text>
      </v-card>

    </v-card>
  </v-container>
</template>

<script>
import {useSettingsStore} from '../stores/settingsStore';

export default {
  name: "CategorySettings",
  data() {
    return {
      newCategory: "",
      newCodes: {}, // Új kódok beviteléhez szükséges objektum
      model: null,
    };
  },
  computed: {
    settingsStore() {
      return useSettingsStore();
    },
    categories() {
      return this.settingsStore.categories;
    }
  },
  methods: {
    addCategory() {
      if (this.newCategory.trim()) {
        this.settingsStore.addCategory(this.newCategory);
        this.newCategory = "";
      }
    },
    removeCategory(index) {
      this.settingsStore.removeCategory(index);
    },
    updateCategory(index, newName) {
      this.settingsStore.updateCategory(index, newName);
    },
    addCode(categoryIndex) {
      if (this.newCodes[categoryIndex]?.trim()) {
        this.settingsStore.addCode(categoryIndex, this.newCodes[categoryIndex]);
        this.$set(this.newCodes, categoryIndex, ""); // Input törlése
      }
    },
    removeCode(categoryIndex, codeIndex) {
      this.settingsStore.removeCode(categoryIndex, codeIndex);
    },
    updateCode(categoryIndex, codeIndex, newCode) {
      this.settingsStore.updateCode(categoryIndex, codeIndex, newCode);
    }
  }
};
</script>

<style scoped>
.v-card {
  max-width: 600px;
  margin: auto;
}
</style>
