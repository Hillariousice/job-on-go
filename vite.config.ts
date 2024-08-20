import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { fileURLToPath, URL } from 'url'

export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      vueJsx(),
    ],
    server: {
      port: 4000,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {

      'process.env': {
        VUE_APP_FIREBASE_API_KEY: env.VUE_APP_FIREBASE_API_KEY,
        VUE_APP_FIREBASE_AUTH_DOMAIN: env.VUE_APP_FIREBASE_AUTH_DOMAIN,
        VUE_APP_FIREBASE_PROJECT_ID: env.VUE_APP_FIREBASE_PROJECT_ID,
        VUE_APP_FIREBASE_STORAGE_BUCKET: env.VUE_APP_FIREBASE_STORAGE_BUCKET,
        VUE_APP_FIREBASE_MESSAGING_SENDER_ID: env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
        VUE_APP_FIREBASE_APP_ID: env.VUE_APP_FIREBASE_APP_ID,
      },
    },
  }
})
