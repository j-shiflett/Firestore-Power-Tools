import { createApp } from 'vue'
import PrimeVue from 'primevue/config'

import 'primeicons/primeicons.css'

import App from './App.vue'

createApp(App)
  // PrimeVue's plugin typing can be a bit finicky across TS versions.
  .use(PrimeVue as any)
  .mount('#app')
