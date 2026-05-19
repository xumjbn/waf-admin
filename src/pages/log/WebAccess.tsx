import { useState, useEffect, useCallback } from 'react'
import { PageContainer } from '@ant-design/pro-components'
import { Card, Select, Button, Popconfirm, message, Space, Empty } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { getWebAccessReport, clearAllWebAccess } from '@/api/log'
import { listSites } from '@/api/site'
import type { ProtectSite } from '@/api/types/site'
import type { WebAccessReport as WebAccessReportType } from '@/api/types/log'
import ReactECharts from 'echarts-for-react'

const reportTypeOptions = [
  { label: '访问统计', value: 'access_stats' },
  { label: '流量分析', value: 'traffic_analysis' },
  { label: '响应时间', value: 'response_time' },
  { label: '状态码分布', value: 'status_code' },
  { label: 'TOP URL', value: 'top_url' },
  { label: 'TOP IP', value: 'top_ip' },
]

const WebAccess = () => {
  const [sites, setSites] = useState<ProtectSite[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<string>()
  const [selectedReportType, setSelectedReportType] = useState<string>('access_stats')
  const [reportData, setReportData] = useState<WebAccessReportType | null>(null)
  const [loading, setLoading] = useState(false)

  const loadSites = useCallback(async () => {
    try {
      const res = await listSites()
      const siteList = res.protect_sites ?? []
      setSites(siteList)
      if (siteList.length > 0) {
        setSelectedSiteId(siteList[0].id)
      }
    } catch {
      /* 已由拦截器提示 */
    }
  }, [])

  const loadReport = useCallback(async () => {
    if (!selectedSiteId || !selectedReportType) return
    setLoading(true)
    try {
      const res = await getWebAccessReport(selectedSiteId, selectedReportType)
      setReportData(res)
    } catch {
      /* 已由拦截器提示 */
    } finally {
      setLoading(false)
    }
  }, [selectedSiteId, selectedReportType])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSites()
  }, [loadSites])

  useEffect(() => {
    if (selectedSiteId && selectedReportType) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadReport()
    }
  }, [selectedSiteId, selectedReportType, loadReport])

  const handleClear = async () => {
    try {
      await clearAllWebAccess()
      message.success('清空成功')
      loadReport()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const getChartOption = () => {
    if (!reportData?.data) return null

    const data = reportData.data as Record<string, unknown>

    switch (selectedReportType) {
      case 'access_stats':
        return {
          title: { text: '访问统计' },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: data.dates || [] },
          yAxis: { type: 'value' },
          series: [{ data: data.counts || [], type: 'line', smooth: true }],
        }

      case 'traffic_analysis':
        return {
          title: { text: '流量分析' },
          tooltip: { trigger: 'axis' },
          legend: { data: ['入站流量', '出站流量'] },
          xAxis: { type: 'category', data: data.dates || [] },
          yAxis: { type: 'value' },
          series: [
            { name: '入站流量', data: data.inbound || [], type: 'bar' },
            { name: '出站流量', data: data.outbound || [], type: 'bar' },
          ],
        }

      case 'response_time':
        return {
          title: { text: '响应时间分布' },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: data.dates || [] },
          yAxis: { type: 'value', name: '毫秒' },
          series: [
            {
              data: data.avg_response_time || [],
              type: 'line',
              smooth: true,
              name: '平均响应时间',
            },
          ],
        }

      case 'status_code':
        return {
          title: { text: '状态码分布' },
          tooltip: { trigger: 'item' },
          series: [
            {
              type: 'pie',
              radius: '50%',
              data: Object.entries(data.status_codes || {}).map(([name, value]) => ({
                name,
                value,
              })),
            },
          ],
        }

      case 'top_url':
        return {
          title: { text: 'TOP URL' },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'value' },
          yAxis: { type: 'category', data: (data.urls as string[]) || [] },
          series: [{ data: data.counts || [], type: 'bar' }],
        }

      case 'top_ip':
        return {
          title: { text: 'TOP IP' },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'value' },
          yAxis: { type: 'category', data: (data.ips as string[]) || [] },
          series: [{ data: data.counts || [], type: 'bar' }],
        }

      default:
        return null
    }
  }

  const chartOption = getChartOption()

  return (
    <PageContainer>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space>
            <span>选择站点:</span>
            <Select
              style={{ width: 200 }}
              value={selectedSiteId}
              onChange={setSelectedSiteId}
              options={sites.map(site => ({ label: site.name, value: site.id }))}
            />
            <span>报告类型:</span>
            <Select
              style={{ width: 200 }}
              value={selectedReportType}
              onChange={setSelectedReportType}
              options={reportTypeOptions}
            />
            <Popconfirm title="确定清空所有Web审计数据吗？" onConfirm={handleClear}>
              <Button icon={<DeleteOutlined />} danger>
                清空
              </Button>
            </Popconfirm>
          </Space>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>加载中...</div>
          ) : chartOption ? (
            <ReactECharts option={chartOption} style={{ height: 400 }} />
          ) : (
            <Empty description="暂无数据" />
          )}
        </Space>
      </Card>
    </PageContainer>
  )
}

export default WebAccess
