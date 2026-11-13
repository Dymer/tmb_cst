<template>
  <v-navigation-drawer
      v-model="drawer"
      app
      :mini-variant.sync="mini"
      permanent
  >
    <v-list-item class="px-2">
      <v-list-item-avatar>
        <v-img src="https://randomuser.me/api/portraits/lego/7.jpg" />
      </v-list-item-avatar>

      <v-list-item-title>Timber Tibi</v-list-item-title>

      <v-btn
          icon
          @click.stop="mini = !mini"
      >
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>

    </v-list-item>

    <v-divider />

    <v-list
        dense
        nav
    >
      <v-list-item
          v-for="item in menuPoints"
          :key="item.title"
          link
          :class="isSelected(item) ? 'primary' : ''"
          :to="item.route"
      >
        <v-list-item-icon>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>{{ item.label }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>

</template>
<script>

export default {
  name: 'TheMenu',
  data() {
    return {
      drawer: true,
      mini: true,
      isMiniLogo: true,
      menuPoints: [
        {
          icon: 'mdi-file-document-edit',
          label: 'Árajanlat készítő',
          name:'offer',
          route: '/offer'
        },
        {
          icon: 'mdi-chart-line',
          label: 'Szinkonizació',
          name:'synch',
          route: '/synch'
        },
        {
          icon: 'mdi-cube',
          label: 'Termékek',
          name:'products',
          route: '/products'
        },
      ],
      logoSrc : '/assets/logo.png'
    }
  },
  methods: {
    isSelected(item) {
      return this.$route.name.toLowerCase() === item.name.toLowerCase()
    },
  }
}
</script>
<style scoped />