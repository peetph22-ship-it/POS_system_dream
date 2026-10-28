<template>
  <v-navigation-drawer permanent rail expand-on-hover>
    <v-list nav density="comfortable" color="primary">
      <v-list-item
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :prepend-icon="item.icon"
        :title="item.title"
        :exact="item.to === '/'"
      />
    </v-list>
  </v-navigation-drawer>
</template>
