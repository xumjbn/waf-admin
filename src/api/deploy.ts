// 部署管理模块 API
import { requestV1 } from './request'
import type {
  DeployRequest,
  DeployResponse,
  DeploymentDetail,
  DeployHistoryResponse,
  DeployPreviewResponse,
} from './types/deploy'

// POST /api/v1/sites/{id}/deploy
export const deploySite = (siteId: string, data: DeployRequest) =>
  requestV1.post<never, DeployResponse>(`/sites/${siteId}/deploy`, data)

// GET /api/v1/sites/{id}/deployments
export const listSiteDeployments = (siteId: string, page = 1, pageSize = 20) =>
  requestV1.get<never, DeployHistoryResponse>(`/sites/${siteId}/deployments`, {
    params: { page, page_size: pageSize },
  })

// GET /api/v1/deployments/{id}
export const getDeployment = (id: number) =>
  requestV1.get<never, { deployment: DeploymentDetail }>(`/deployments/${id}`)

// POST /api/v1/sites/{id}/preview
export const previewSiteConfig = (siteId: string) =>
  requestV1.post<never, DeployPreviewResponse>(`/sites/${siteId}/preview`)
