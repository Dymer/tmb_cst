import {defineStore} from 'pinia'

export const useSettingsStore = defineStore('settingsStore', {

    state: () => ({
        categories: [
            {
                id: "0de8377f-5775-4668-be4a-5f1633d24a5f",
                name: "Sziloplasztok",
                lastSync: "Soha",
                codes: ["391"]
            },
            {
                id: "1a2b3c4d-5e6f-7081-9a0b-1c2d3e4f5g6h",
                name: "Faipari ragasztók",
                lastSync: "Soha",
                codes: ["390"]
            },
            {
                id: "2b3c4d5e-6f70-819a-0b1c-2d3e4f5g6h7i",
                name: "Bútorfüggesztők",
                lastSync: "Soha",
                codes: ["281"]
            },
            {
                id: "3c4d5e6f-7081-9a0b-1c2d-3e4f5g6h7i8j",
                name: "Sarok, egyenes és szegletvasak",
                lastSync: "Soha",
                codes: ["518"]
            },
            {
                id: "4d5e6f70-819a-0b1c-2d3e-4f5g6h7i8j9k",
                name: "Műanyag és fatiplik, lamellók, dübelek",
                lastSync: "Soha",
                codes: ["517"]
            },
            {
                id: "5e6f7081-9a0b-1c2d-3e4f-5g6h7i8j9k0l",
                name: "Fa és forgácslap csavarok",
                lastSync: "Soha",
                codes: ["522"]
            },
            {
                id: "6f70819a-0b1c-2d3e-4f5g-6h7i8j9k0l1m",
                name: "Dani tolóajtó rendszer",
                lastSync: "Soha",
                codes: ["329"]
            },
            {
                id: "7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v",
                name: "Syma 32 + Syma 14",
                lastSync: "Soha",
                codes: ["32"]
            },
            {
                id: "8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w",
                name: "Pántok, zsanérok",
                lastSync: "Soha",
                codes: ["223"]
            },
            {
                id: "9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x",
                name: "Gázteleszkópok bútorajtóhoz",
                lastSync: "Soha",
                "codes": ["459"]
            },
            {
                id: "0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y",
                name: "Bútorvasalat széles választéka",
                lastSync: "Soha",
                codes: ["458"]
            },
            {
                id: "1k2l3m4n-5o6p-7q8r-9s0t-1u2v3w4x5y6z",
                name: "Vertex fiókrendszer",
                lastSync: "Soha",
                codes: ["621"]
            },
            {
                id: "2l3m4n5o-6p7q-8r9s-0t1u-2v3w4x5y6z7a",
                name: "Akasztórudak és tartók",
                lastSync: "Soha",
                codes: ["450"]
            },
            {
                id: "3m4n5o6p-7q8r-9s0t-1u2v-3w4x5y6z7a8b",
                name: "Fém bútorfogantyúk",
                lastSync: "Soha",
                codes: ["696"]
            },
            {
                id: "4n5o6p7q-8r9s-0t1u-2v3w-4x5y6z7a8b9c",
                name: "Fém bútorgombok",
                lastSync: "Soha",
                codes: ["697"]
            }, {
                id: "3cbc6967-0f02-407d-b8d1-459a8864bef8",
                name: "Szintezőlábak és kiegészítők",
                lastSync: "Soha",
                codes: ["294"]
            },
            {
                id: "60c8bee1-3248-4ec3-aed8-5471004d6833",
                name: "Kivetőpántok",
                lastSync: "Soha",
                codes: ["19", "496", "498", "499", "500", "501", "502", "503", "504", "505", "506", "507", "508", "510", "509", "565", "497", "511"]
            },
            {
                id: "487a3d4b-41b4-4635-a939-5b6f6ab7652e",
                name: "Fiok sinek",
                lastSync: "Soha",
                codes: ["21", "23", "192", "22", "194", "195", "199", "133", "201", "200"]
            }
        ],
        products: []
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
        deleteCategoryItemsFromProducts(categoryId) {
            this.products = this.products.filter(product => product.categoryId !== categoryId);
        },
        updateSynchTime(categoryId) {
            this.categories.find(category => category.id === categoryId).lastSync = new Date().toLocaleString();
        },
        deleteProductById(productId) {
            this.products = this.products.filter(product => product.id !== productId);
        },
        addProduct(product) {
            if(this.products.find(p => p.id === product.id)) {
                this.products = this.products.filter(p => p.id !== product.id);
            }
            this.products.push(product);
        },

        reset() {
            this.$reset();
        }

    },
    persist: true
})