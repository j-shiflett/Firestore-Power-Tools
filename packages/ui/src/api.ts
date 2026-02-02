import axios from 'axios'

export type ApiClient = {
  baseUrl: string
}

export function createApi(baseUrl: string): ApiClient {
  return { baseUrl }
}

export async function getCollections(api: ApiClient): Promise<string[]> {
  const res = await axios.get(`${api.baseUrl}/collections`)
  return res.data.collections
}

export type DocRow = { id: string; data: any }

export async function getDocs(
  api: ApiClient,
  params: { collection: string; limit?: number; startAfter?: string }
): Promise<{ docs: DocRow[]; nextPageToken: string | null }> {
  const res = await axios.get(`${api.baseUrl}/docs`, { params })
  return { docs: res.data.docs, nextPageToken: res.data.nextPageToken }
}

export async function getDoc(api: ApiClient, params: { collection: string; id: string }): Promise<DocRow> {
  const res = await axios.get(`${api.baseUrl}/doc`, { params })
  return res.data
}
