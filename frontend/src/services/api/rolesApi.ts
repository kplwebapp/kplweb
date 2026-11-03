import { apiClient } from './client'

export type AdminPanelArea = {
  key: string
  label: string
  description?: string
  permissions: string[]
}

export type AdminRole = {
  role_id: number
  role_code: string
  role_name: string
  description: string | null
  created_at?: string
  permissions: string[]
  areas: string[]
  is_system: boolean
}

type Envelope<T> = { success: boolean; message?: string; data: T }

export const rolesApi = {
  list: () => apiClient.get<Envelope<AdminRole[]>>('/roles'),
  areas: () => apiClient.get<Envelope<AdminPanelArea[]>>('/roles/areas'),
  create: (body: {
    roleName: string
    roleCode: string
    description?: string
    areas: string[]
  }) => apiClient.post<Envelope<AdminRole>>('/roles', body),
  update: (
    roleId: number,
    body: { roleName: string; description?: string; areas: string[] },
  ) => apiClient.put<Envelope<AdminRole>>(`/roles/${roleId}`, body),
  remove: (roleId: number) => apiClient.delete<Envelope<{ deleted: boolean }>>(`/roles/${roleId}`),
}
