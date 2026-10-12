import { useOutletContext } from 'react-router-dom'
import type { ActivityKind, Category } from '@/services/api/activitiesApi'

export type AdminContext = {
  categories: Record<ActivityKind, Category[]>
  categoriesLoaded: boolean
  reloadCategories: () => Promise<unknown>
  isSuperAdmin: boolean
}

export const useAdminContext = () => useOutletContext<AdminContext>()

export function readIsSuperAdmin(): boolean {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null') as { roles?: string[] } | null
    return Boolean(user?.roles?.includes('SUPER_ADMIN'))
  } catch {
    return false
  }
}
