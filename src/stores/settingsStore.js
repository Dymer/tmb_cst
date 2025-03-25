import {defineStore} from 'pinia'

export const useSettingsStore = defineStore('settingsStore', {

    state: () => ({
        categories: [
            {
                id: "487a3d4b-41b4-4635-a939-5b6f6ab7652e",
                name: "Fogasok",
                lastSync: "Soha",
                codes: ["729", "752", "769"]
            },
            {
                id: "497a3d4b-41b4-4635-a939-5b6f6ab7652e",
                name: "Görgők",
                lastSync: "Soha",
                codes: ["32"]
            }
        ],
        products: [
            {
                categoryId: "487a3d4b-41b4-4635-a939-5b6f6ab7652e",
                name: "Fogas 1",
                price: 1000,
            },
            {
                categoryId: "487a3d4b-41b4-4635-a939-5b6f6ab7652e",
                name: "Fogas 2",
                price: 2000,
            }
        ]
    }),
    actions: {
        addCategory(name) {
            this.categories.push({name, codes: []});
        },
        removeCategory(index) {
            this.categories.splice(index, 1);
        },
        updateCategory(index, newName) {
            this.categories[index].name = newName;
        },
        addCode(categoryIndex, code) {
            this.categories[categoryIndex].codes.push(code);
        },
        removeCode(categoryIndex, codeIndex) {
            this.categories[categoryIndex].codes.splice(codeIndex, 1);
        },
        updateCode(categoryIndex, codeIndex, newCode) {
            this.categories[categoryIndex].codes[codeIndex] = newCode;
        },
        deleteCategoryItemsFromProducts(categoryId){
            this.products = this.products.filter(product => product.categoryId !== categoryId);
        },
        updateSynchTime(categoryId){
            this.categories.find(category => category.id === categoryId).lastSync = new Date().toLocaleString();
        },
        deleteProductById(productId){
            this.products = this.products.filter(product => product.id !== productId);
        },
        addProduct(product){
            this.products.push(product);
        }

    },
    persist: true
})