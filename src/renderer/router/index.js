import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
    {
        path: '/',
        component: () => import('../layouts/MainLayout.vue'),
        hidden: true,
        props: true,
        meta: {
            requiresAuth: true
        },
        children: [
            {
                path: '',
                redirect: '/offer'
            },
            {
                path: '/offer',
                name: 'Offer',
                component: () => import('../components/OfferCreator.vue')
            },
            {
                path: '/categories',
                name: 'Categories',
                component: () => import('../components/CategorySettings.vue')
            },
            {
                path: '/synch',
                name: 'Synch',
                component: () => import('../components/SynchSettings.vue')
            },
            {
                path: '/products',
                name: 'Products',
                component: () => import('../components/ProductList.vue')
            }

        ]
    }
]

const router = new VueRouter({
    routes
})


export default router
