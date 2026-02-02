<script setup lang="ts">
import { computed, ref } from 'vue'

import DbBrowser from './DbBrowser.vue'
import SchemaViewer from './SchemaViewer.vue'
import QueryBuilder from './QueryBuilder.vue'

type Tab = 'db' | 'query' | 'schema'
const tab = ref<Tab>('db')

const title = computed(() => {
  if (tab.value === 'db') return 'Database Browser'
  if (tab.value === 'query') return 'Query Builder'
  return 'Schema Explorer'
})
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
        <button @click="tab = 'query'" :disabled="tab === 'query'">Query</button>
        <button @click="tab = 'schema'" :disabled="tab === 'schema'">Schema</button>
      </div>
    </div>

    <div style="margin-top: 16px">
      <DbBrowser v-if="tab === 'db'" />
      <QueryBuilder v-else-if="tab === 'query'" />
      <SchemaViewer v-else />
    </div>
  </div>
</template>
