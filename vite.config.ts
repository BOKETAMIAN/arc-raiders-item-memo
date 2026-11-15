import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages で任意のリポジトリ名配下でも動作するよう相対パスを指定
export default defineConfig({
  plugins: [react()],
  base: './',
})
