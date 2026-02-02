<script setup lang="ts">
import { computed, ref } from 'vue'
import axios from 'axios'

const serverBase = ref('http://127.0.0.1:4011')

const collections = ref<string[]>([])
const selectedCollection = ref<string>('')

const schema = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const canInfer = computed(() => !!selectedCollection.value && !loading.value)

async function loadCollections() {
  error.value = null
  loading.value = true
  try {
    const res = await axios.get(`${serverBase.value}/collections`)
    collections.value = res.data.collections
    if (collections.value.length && !selectedCollection.value) {
      selectedCollection.value = collections.value[0]
    }
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

async function inferSchema() {
  error.value = null
  loading.value = true
  try {
    const res = await axios.get(`${serverBase.value}/schema/infer`, {
      params: { collection: selectedCollection.value, limit: 200 },
    })
    schema.value = res.data
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h3>Schema Explorer</h3>

    <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap">
      <label>
        Local server:
        <input v-model="serverBase" style="min-width: 320px" />
      </label>

      <button @click="loadCollections" :disabled="loading">Load collections</button>

      <label>
        Collection:
        <select v-model="selectedCollection">
          <option v-for="c in collections" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>

      <button @click="inferSchema" :disabled="!canInfer">Infer schema</button>
    </div>

    <p v-if="error" style="color: #c00">{{ error }}</p>

    <div v-if="schema" style="margin-top: 16px">
      <h4>Observed schema (sample: {{ schema.sampleSize }})</h4>
      <pre style="background: #111; color: #ddd; padding: 12px; overflow: auto">{{ JSON.stringify(schema, null, 2) }}</pre>
    </div>
  </div>
</template>
