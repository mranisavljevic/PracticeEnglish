import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { LocaleProvider } from './i18n/LocaleProvider'
import { routes } from './router'

const router = createBrowserRouter(routes)

export default function App() {
  return (
    <LocaleProvider>
      <RouterProvider router={router} />
    </LocaleProvider>
  )
}
