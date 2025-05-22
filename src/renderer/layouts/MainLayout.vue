<template>
  <v-container
      class="pa-0"
      fluid
  >
    <TheMenu/>
    <v-main class="fill-height">
      <v-container
          fluid
      >
        <router-view/>
      </v-container>
    </v-main>
  </v-container>
</template>

<script>




import TheMenu from "../components/TheMenu.vue";

export default {
  name: 'MainLayout',
  components: {TheMenu},

}
</script>

<style>
</style>
