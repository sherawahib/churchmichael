import { bibleBooks } from '../data/bibleBooks.js'
import { BIBLE_VERSIONS } from './store'

const BOLLS_BOOK_IDS = bibleBooks.map((_, index) => index + 1)

export function getBibleVersion(id) {
  return BIBLE_VERSIONS.find((item) => item.id === id) || BIBLE_VERSIONS[0]
}

export async function fetchBibleChapter(bookName, chapter, versionId = 'kjv') {
  const version = getBibleVersion(versionId)
  if (version.source === 'bible-api') {
    const reference = encodeURIComponent(`${bookName} ${chapter}`)
    const response = await fetch(`https://bible-api.com/${reference}?translation=${version.id}`)
    if (!response.ok) throw new Error('Bible passage unavailable')
    const data = await response.json()
    if (!Array.isArray(data.verses)) throw new Error('Bible passage unavailable')
    return data.verses.map((verse) => ({
      verse: verse.verse,
      text: verse.text,
    }))
  }

  const bookIndex = bibleBooks.findIndex((book) => book.name === bookName)
  if (bookIndex < 0) throw new Error('Book not found')
  const bookId = BOLLS_BOOK_IDS[bookIndex]
  const response = await fetch(`https://bolls.life/get-text/${version.id}/${bookId}/${chapter}/`)
  if (!response.ok) throw new Error(`${version.label} could not be loaded. Try KJV or WEB.`)
  const data = await response.json()
  if (!Array.isArray(data) || !data.length) throw new Error(`${version.label} could not be loaded. Try KJV or WEB.`)
  return data.map((verse) => ({
    verse: verse.verse,
    text: String(verse.text || '').replace(/<[^>]+>/g, ' '),
  }))
}
