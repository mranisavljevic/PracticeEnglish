import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AnalyticsProvider } from './analytics/AnalyticsProvider'
import { CatalogProvider } from './content/CatalogProvider'
import { LocaleProvider } from './i18n/LocaleProvider'
import { routes } from './router'

const router = createBrowserRouter(routes)

export default function App() {
  return (
    <CatalogProvider>
      <LocaleProvider>
        <AnalyticsProvider>
          <RouterProvider router={router} />
        </AnalyticsProvider>
      </LocaleProvider>
    </CatalogProvider>
  )
}
