import { useOutletContext } from 'react-router-dom'
import type { ActivityKind, Category } from '@/services/api/activitiesApi'
import { adminSession } from '@/utils/adminSession'

export type AdminContext = {
  categories: Record<ActivityKind, Category[]>
  categoriesLoaded: boolean
  reloadCategories: () => Promise<unknown>
  isSuperAdmin: boolean
}

export const useAdminContext = () => useOutletContext<AdminContext>()

export function readIsSuperAdmin(): boolean {
  return Boolean(adminSession.getUser()?.roles?.includes('SUPER_ADMIN'))
}
