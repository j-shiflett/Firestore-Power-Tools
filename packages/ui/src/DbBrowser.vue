<script setup lang="ts">
import { computed, ref } from 'vue'
import { createApi, getCollections, getDoc, getDocs } from './api'

const serverBase = ref('http://127.0.0.1:4011')
const api = computed(() => createApi(serverBase.value))

const collections = ref<string[]>([])
const selectedCollection = ref<string>('')

const docs = ref<{ id: string; data: any }[]>([])
const nextPageToken = ref<string | null>(null)
const selectedDocId = ref<string>('')
const selectedDoc = ref<any>(null)

const loading = ref(false)
const error = ref<string | null>(null)

async function loadCollections() {
  error.value = null
  loading.value = true
  try {
    collections.value = await getCollections(api.value)
    if (collections.value.length && !selectedCollection.value) {
      selectedCollection.value = collections.value[0]
    }
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

async function loadDocs(reset = true) {
  if (!selectedCollection.value) return
  error.value = null
  loading.value = true
  try {
    const res = await getDocs(api.value, {
      collection: selectedCollection.value,
      limit: 25,
      startAfter: reset ? undefined : nextPageToken.value ?? undefined,
    })
    docs.value = reset ? res.docs : [...docs.value, ...res.docs]
    nextPageToken.value = res.nextPageToken
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

async function loadDoc() {
  if (!selectedCollection.value || !selectedDocId.value) return
  error.value = null
  loading.value = true
  try {
    selectedDoc.value = await getDoc(api.value, { collection: selectedCollection.value, id: selectedDocId.value })
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

function downloadUrl(format: 'jsonl' | 'csv') {
  const base = serverBase.value.replace(/\/$/, '')
  const c = encodeURIComponent(selectedCollection.value)
  return `${base}/export?collection=${c}&format=${format}&limit=1000`
}

const canLoadDocs = computed(() => !!selectedCollection.value && !loading.value)
const canLoadMore = computed(() => !!nextPageToken.value && !loading.value)
const canExport = computed(() => !!selectedCollection.value)
</script>

<template>
  <div>
    <h3>Database Browser (read-only)</h3>

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

      <button @click="loadDocs(true)" :disabled="!canLoadDocs">Load docs</button>
      <button @click="loadDocs(false)" :disabled="!canLoadMore">Load more</button>

      <span style="flex: 1" />

      <a :href="downloadUrl('jsonl')" :aria-disabled="!canExport" :style="{ pointerEvents: canExport ? 'auto' : 'none', opacity: canExport ? 1 : 0.5 }">
        Export JSONL
      </a>
      <a :href="downloadUrl('csv')" :aria-disabled="!canExport" :style="{ pointerEvents: canExport ? 'auto' : 'none', opacity: canExport ? 1 : 0.5 }">
        Export CSV
      </a>
    </div>

    <p v-if="error" style="color: #c00">{{ error }}</p>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px">
      <div>
        <h4>Documents</h4>
        <div style="max-height: 420px; overflow: auto; border: 1px solid #ddd; padding: 8px">
          <div v-for="d in docs" :key="d.id" style="display:flex; gap:8px; align-items:center; padding: 4px 0">
            <button @click="selectedDocId = d.id; loadDoc()" style="min-width: 90px">View</button>
            <code>{{ d.id }}</code>
          </div>
        </div>
      </div>

      <div>
        <h4>Selected doc</h4>
        <div v-if="selectedDoc" style="border: 1px solid #ddd; padding: 8px">
          <div><strong>ID:</strong> <code>{{ selectedDoc.id }}</code></div>
          <pre style="background: #111; color: #ddd; padding: 12px; overflow: auto; max-height: 420px">{{ JSON.stringify(selectedDoc.data, null, 2) }}</pre>
        </div>
        <p v-else style="color:#666">Select a document to view its JSON.</p>
      </div>
    </div>
  </div>
</template>
