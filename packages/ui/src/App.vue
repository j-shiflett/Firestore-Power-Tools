<script setup lang="ts">
import { computed, ref } from 'vue'

import DbBrowser from './DbBrowser.vue'
import SchemaViewer from './SchemaViewer.vue'

type Tab = 'db' | 'schema'
const tab = ref<Tab>('db')

const title = computed(() => (tab.value === 'db' ? 'Database Browser' : 'Schema Explorer'))
</script>

<template>
  <div style="max-width: 1100px; margin: 24px auto; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif">
    <div style="display:flex; align-items:center; justify-content: space-between; gap: 12px; flex-wrap: wrap">
      <div>
        <h2 style="margin:0">Firestore Power Tools</h2>
        <div style="color:#666">{{ title }}</div>
      </div>

      <div style="display:flex; gap: 8px">
        <button @click="tab = 'db'" :disabled="tab === 'db'">DB Browser</button>
        <button @click="tab = 'schema'" :disabled="tab === 'schema'">Schema</button>
      </div>
    </div>

    <div style="margin-top: 16px">
      <DbBrowser v-if="tab === 'db'" />
      <SchemaViewer v-else />
    </div>
  </div>
</template>
