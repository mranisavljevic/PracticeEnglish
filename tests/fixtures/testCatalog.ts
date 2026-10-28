import type { Catalog } from '../../src/content/catalog'

export const testCatalog: Catalog = {
  version: 1,
  levels: [
    { id: 'level-1', title: 'Level 1' },
    { id: 'level-2', title: 'Level 2' },
  ],
  books: [
    {
      id: 'book-a',
      levelId: 'level-1',
      type: 'textbook',
      title: 'Book A Textbook',
      titleTranslations: { es: 'Libro A' },
      units: [
        {
          id: 'unit-1',
          number: '1',
          title: 'Hello',
          titleTranslations: { es: 'Hola' },
          tracks: [
            { id: 't-1', label: '1', file: 'sample/one.mp3' },
            { id: 't-2', label: '2', file: 'sample/two.mp3' },
            { id: 't-12a', label: '12a', file: 'sample/twelve-a.mp3' },
          ],
        },
        { id: 'unit-2', number: '2', title: 'Goodbye', tracks: [{ id: 't-1', label: '1', file: 'sample/one.mp3' }] },
      ],
    },
    { id: 'book-b', levelId: 'level-1', type: 'workbook', title: 'Book B Workbook', units: [] },
    { id: 'book-c', levelId: 'level-2', type: 'textbook', title: 'Book C Textbook', units: [] },
  ],
}
