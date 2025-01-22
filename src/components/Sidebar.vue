<template>
  <v-col cols="3" class="sidebar">
    <v-divider />

    <!-- Content based on selected tab -->
    <v-list dense>
      <template v-if="activeTab === 0">
        <v-subheader class="sidebar-title">المجموعات</v-subheader>
        <v-list-item
          v-for="group in groups"
          :key="group.id"
          @click="selectGroupChat(group.name)"
          class="cursor-pointer groups-name"
        >
          <v-list-item-content>
            <v-list-item-title>{{ group.name }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
    </v-list>
  </v-col>
</template>

<script>
export default {
  props: {
    groups: Array,
  },
  data() {
    return {
      activeTab: 0, // Keep only the "Groups" tab active
    };
  },
  methods: {
    selectGroupChat(groupName) {
      this.$emit("selectChat", { type: 'group', name: groupName });
    },
  },
};
</script>

<style scoped>
.sidebar {
  height: 100vh;
  overflow-y: auto;
}

.sidebar-title {
  color: white;
  display: flex;
  justify-content: end;
}

.groups-name{
  display: flex;
  justify-content: end;
}
</style>
