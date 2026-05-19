// 部署管理模块类型定义

export interface DeployRequest {
  deploy_type: string // 'full' | 'site' | 'policy'
  target_nodes: number[]
}

export interface DeployResponse {
  deployment_id: number
  config_version: string
  status: string
  node_count: number
}

export interface NodeDeployStatus {
  id: number
  deployment_id: number
  node_id: number
  node_hostname: string
  status: 'pending' | 'success' | 'failed'
  message: string
  applied_at: string | null
  created_at: string
}

export interface DeploymentItem {
  id: number
  site_id: number
  site_name: string
  site_domain: string
  config_version: string
  deploy_type: string
  operator_id: number
  operator_name: string
  created_at: string
}

export interface DeploymentDetail extends DeploymentItem {
  nginx_config: string
  modsec_config: string
  target_nodes: { id: number; hostname: string; ip: string }[]
  node_statuses: NodeDeployStatus[]
}

export interface DeployHistoryResponse {
  data: DeploymentItem[]
  total: number
  page: number
  size: number
}

export interface DeployPreviewResponse {
  site_config: string
  policy_config: string
}
