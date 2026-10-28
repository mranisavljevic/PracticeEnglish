// Resolved by the `@catalog` alias in vite.config.ts (src/content/catalog.json unless VITE_CATALOG_FILE is set).
declare module '@catalog' {
  const catalog: unknown
  export default catalog
}
