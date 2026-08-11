import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { router } from './router/router'
import { store } from './store/store'
import { registerSW } from 'virtual:pwa-register'
import ThemeManager from './components/ThemeManager'

import './index.css'
import './App.css'

registerSW({
  immediate: true,
})

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <ThemeManager />
    <Toaster position="top-center" />
    <RouterProvider router={router} />
  </Provider>
)