import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { catalog as bundled, createCatalogApi, type Catalog } from './catalog'

type CatalogApi = ReturnType<typeof createCatalogApi>

const CatalogContext = createContext<CatalogApi | null>(null)

export function CatalogProvider({ catalog = bundled, children }: { catalog?: Catalog; children: ReactNode }) {
  const api = useMemo(() => createCatalogApi(catalog), [catalog])
  return <CatalogContext.Provider value={api}>{children}</CatalogContext.Provider>
}

export function useCatalog(): CatalogApi {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider')
  return ctx
}
