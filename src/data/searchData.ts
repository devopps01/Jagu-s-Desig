import { STORE_SEARCH_ENTRIES } from '@/data/navigation/storeMenu'

type SearchData = {
  id: string
  name: string
  url: string
  excludeLang?: boolean
  icon: string
  section: string
  shortcut?: string
}

/** Admin command palette — only real store pages with APIs. */
const data: SearchData[] = STORE_SEARCH_ENTRIES

export default data
