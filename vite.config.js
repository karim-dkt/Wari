import { readFile, writeFile } from 'node:fs/promises'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Donne une version unique au service worker : chaque build relance son installation
const versionServiceWorker = () => ({
  name: 'version-service-worker',
  apply: 'build',
  async closeBundle() {
    const contenu = await readFile('dist/sw.js', 'utf8')
    await writeFile('dist/sw.js', contenu.replace('__BUILD__', Date.now().toString(36)))
  },
})

export default defineConfig({
  base: './',
  plugins: [react(), versionServiceWorker()],
})
