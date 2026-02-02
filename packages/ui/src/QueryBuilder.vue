<script setup lang="ts">
import { computed, ref } from 'vue'
import axios from 'axios'

const serverBase = ref('http://127.0.0.1:4011')

const collection = ref('')
const whereJson = ref('[]')
const orderByField = ref('')
const orderByDir = ref<'asc' | 'desc'>('asc')
const limit = ref(25)

const rows = ref<Array<{ id: string; data: any }>>([])
const nextPageToken = ref<string | null>(null)
const selected = ref<any>(null)

const loading = ref(false)
const error = ref<string | null>(null)

const canRun = computed(() => !!collection.value && !loading.value)

async function runQuery(reset = true) {
  error.value = null
  loading.value = true
  try {
    const res = await axios.get(`${serverBase.value}/query`, {
      params: {
        collection: collection.value,
        where: whereJson.value,
        orderByField: orderByField.value || undefined,
        orderByDir: orderByField.value ? orderByDir.value : undefined,
        limit: limit.value,
        startAfterId: reset ? undefined : nextPageToken.value ?? undefined,
      },
    })
    rows.value = reset ? res.data.docs : [...rows.value, ...res.data.docs]
    nextPageToken.value = res.data.nextPageToken
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

const canLoadMore = computed(() => !!nextPageToken.value && !loading.value)
</script>

<template>
  <div>
    <h3>Query Builder (read-only)</h3>

    <div style="display:flex; gap: 12px; flex-wrap: wrap; align-items: flex-end">
      <label>
        Local server:
        <input v-model="serverBase" style="min-width: 320px" />
      </label>

      <label>
        Collection:
        <input v-model="collection" placeholder="e.g. users" />
      </label>

      <label>
        Limit:
        <input v-model.number="limit" type="number" min="1" max="200" style="width: 90px" />
      </label>

      <label>
        Order by:
        <input v-model="orderByField" placeholder="field (optional)" />
      </label>

      <label>
        Dir:
        <select v-model="orderByDir">
          <option value="asc">asc</option>
          <option value="desc">desc</option>
        </select>
      </label>

      <button @click="runQuery(true)" :disabled="!canRun">Run</button>
      <button @click="runQuery(false)" :disabled="!canLoadMore">Load more</button>
    </div>

    <div style="margin-top: 8px">
      <label style="display:block">Where (JSON):</label>
      <textarea v-model="whereJson" rows="5" style="width: 100%" />
      <div style="color:#666; font-size: 12px; margin-top: 4px">
        Example: <code>[{"field":"status","op":"==","value":"active"}]</code>
      </div>
    </div>

    <p v-if="error" style="color:#c00">{{ error }}</p>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px">
      <div>
        <h4>Results</h4>
        <div style="max-height: 420px; overflow: auto; border: 1px solid #ddd; padding: 8px">
          <div v-for="d in rows" :key="d.id" style="display:flex; gap:8px; align-items:center; padding: 4px 0">
            <button @click="selected = d" style="min-width: 90px">View</button>
            <code>{{ d.id }}</code>
          </div>
        </div>
      </div>

      <div>
        <h4>Selected</h4>
        <div v-if="selected" style="border: 1px solid #ddd; padding: 8px">
          <div><strong>ID:</strong> <code>{{ selected.id }}</code></div>
          <pre style="background: #111; color: #ddd; padding: 12px; overflow: auto; max-height: 420px">{{ JSON.stringify(selected.data, null, 2) }}</pre>
        </div>
        <p v-else style="color:#666">Select a result to view JSON.</p>
      </div>
    </div>
  </div>
</template>
