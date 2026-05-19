import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8081', changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          const match = id.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)
          const pkgName = match?.[1]
          if (!pkgName) {
            return 'vendor-misc'
          }

          if (pkgName === 'react' || pkgName === 'react-dom' || pkgName === 'scheduler') {
            return 'vendor-react'
          }
          if (pkgName.startsWith('react-router')) {
            return 'vendor-router'
          }

          if (pkgName === 'echarts' || pkgName === 'echarts-for-react' || pkgName === 'zrender') {
            return 'vendor-chart'
          }

          if (pkgName === '@ant-design/pro-components' || pkgName.startsWith('@ant-design/pro-')) {
            return 'vendor-antd-pro'
          }
          if (pkgName === 'antd') {
            return 'vendor-antd'
          }
          if (
            pkgName.startsWith('rc-') ||
            pkgName.startsWith('@rc-component/') ||
            pkgName.startsWith('@ant-design/')
          ) {
            return 'vendor-antd-deps'
          }

          if (
            pkgName === 'i18next' ||
            pkgName === 'react-i18next' ||
            pkgName === 'i18next-browser-languagedetector'
          ) {
            return 'vendor-i18n'
          }
          if (pkgName === 'axios') {
            return 'vendor-axios'
          }
          if (pkgName === 'dayjs' || pkgName === 'moment') {
            return 'vendor-date'
          }
          if (pkgName.startsWith('lodash')) {
            return 'vendor-lodash'
          }

          return `vendor-${pkgName.replace('@', '').replace('/', '-')}`
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})
