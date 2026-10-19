import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { CatalogProvider } from './content/CatalogProvider'
import { LocaleProvider } from './i18n/LocaleProvider'
import { routes } from './router'

const router = createBrowserRouter(routes)

export default function App() {
  return (
    <CatalogProvider>
      <LocaleProvider>
        <RouterProvider router={router} />
      </LocaleProvider>
    </CatalogProvider>
  )
}
