import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Two entry points build into one dist/:
//   index.html      → main Akamai Media Solutions demo
//   cloudinary.html → Cloudinary demos, served from its own subdomain
//                     (nginx points that vhost at cloudinary.html as its index)
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        cloudinary: resolve(__dirname, 'cloudinary.html'),
      },
    },
  },
})
