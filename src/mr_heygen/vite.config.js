import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'static',
    emptyOutDir: false, // Don't delete existing files in static/
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'static/main.js'),
        tts: resolve(__dirname, 'static/tts.js')
      },
      output: {
        entryFileNames: '[name].bundle.js',
        chunkFileNames: '[name].chunk.js',
        assetFileNames: '[name].[ext]',
        dir: 'static'
      }
    }
  }
})
