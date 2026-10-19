import type { RouteObject } from 'react-router-dom'
import { Layout } from './components/Layout'
import { NotFound } from './pages/NotFound'

function Placeholder({ name }: { name: string }) {
  return <h1 tabIndex={-1}>{name}</h1>
}

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <Placeholder name="Home" /> },
      { path: 'b/:bookId', element: <Placeholder name="Book" /> },
      { path: 'b/:bookId/u/:unitId', element: <Placeholder name="Unit" /> },
      { path: 'b/:bookId/u/:unitId/t/:trackId', element: <Placeholder name="Track" /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]
