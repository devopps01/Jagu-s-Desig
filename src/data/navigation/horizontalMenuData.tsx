// Type Imports
import type { HorizontalMenuDataType } from '@/types/menuTypes'
import type { getDictionary } from '@/utils/getDictionary'

import { STORE_MENU_GROUPS } from '@/data/navigation/storeMenu'

const horizontalMenuData = (_dictionary: Awaited<ReturnType<typeof getDictionary>>): HorizontalMenuDataType[] =>
  STORE_MENU_GROUPS.map(group => ({
    label: group.label,
    icon: group.icon,
    children: group.items.map(item => ({
      label: item.label,
      href: item.href
    }))
  }))

export default horizontalMenuData
