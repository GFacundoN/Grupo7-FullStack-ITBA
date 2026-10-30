import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// El front le pide los datos directo a la API con la URL de VITE_API_URL
// (ver services/productosApi.js), sin proxy.
export default defineConfig({
  plugins: [react()],
})
