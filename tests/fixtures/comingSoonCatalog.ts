import type { Catalog } from '../../src/content/catalog'
import { testCatalog } from './testCatalog'

/** testCatalog plus Level 3 and two placeholders (one under a level that also has live books). */
export const comingSoonCatalog: Catalog = {
  ...testCatalog,
  levels: [...testCatalog.levels, { id: 'level-3', title: 'Level 3' }],
  comingSoon: [
    {
      id: 'level-1-student-book',
      levelId: 'level-1',
      type: 'textbook',
      title: 'English in Action 1: Student Book',
      titleTranslations: { es: 'English in Action 1: Libro del estudiante' },
    },
    { id: 'level-3-workbook', levelId: 'level-3', type: 'workbook', title: 'English in Action 3: Workbook' },
  ],
}
