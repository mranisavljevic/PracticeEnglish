import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AnalyticsProvider } from '../../src/analytics/AnalyticsProvider'
import { routes } from '../../src/router'
import { LocaleProvider } from '../../src/i18n/LocaleProvider'
import { CatalogProvider } from '../../src/content/CatalogProvider'
import { testCatalog } from '../fixtures/testCatalog'
import type { Catalog } from '../../src/content/catalog'

export function renderApp(path = '/', catalog: Catalog = testCatalog) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const utils = render(
    <CatalogProvider catalog={catalog}>
      <LocaleProvider>
        <AnalyticsProvider>
          <RouterProvider router={router} />
        </AnalyticsProvider>
      </LocaleProvider>
    </CatalogProvider>,
  )
  return { router, ...utils }
}
