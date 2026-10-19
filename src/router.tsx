import type { RouteObject } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Book } from './pages/Book'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { Track } from './pages/Track'
import { Unit } from './pages/Unit'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'b/:bookId', element: <Book /> },
      { path: 'b/:bookId/u/:unitId', element: <Unit /> },
      { path: 'b/:bookId/u/:unitId/t/:trackId', element: <Track /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]
