// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'
import type { getDictionary } from '@/utils/getDictionary'

import { STORE_MENU_GROUPS } from '@/data/navigation/storeMenu'

const verticalMenuData = (_dictionary: Awaited<ReturnType<typeof getDictionary>>): VerticalMenuDataType[] => [
  {
    label: "Jagu's Designing",
    isSection: true,
    children: STORE_MENU_GROUPS.map(group => ({
      label: group.label,
      icon: group.icon,
      children: group.items.map(item => ({
        label: item.label,
        href: item.href
      }))
    }))
  }
]

export default verticalMenuData
