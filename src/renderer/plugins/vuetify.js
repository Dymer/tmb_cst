import Vue from 'vue'
import Vuetify from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import hu from 'vuetify/es5/locale/hu'

Vue.use(Vuetify)

export default new Vuetify({
    lang: {
        locales: {hu},
        current: 'hu',
    },
    theme: {
        options: {
            customProperties: true,
            variations: true
        },
    }
})
