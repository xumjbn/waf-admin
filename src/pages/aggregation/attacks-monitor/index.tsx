import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Table, Tag, Progress, Button, Tooltip } from 'antd'
import { PageContainer } from '@ant-design/pro-components'
import {
  ThunderboltOutlined,
  GlobalOutlined,
  SafetyOutlined,
  WarningOutlined,
  FireOutlined,
  LockOutlined,
  UnlockOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout'
import type { LayoutItem, Layout, ResponsiveLayouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import AttackMap from '@/components/AttackMap'
import {
  getInstancemTime,
  getSiteStats,
  getAttackStats,
  getAttackSeverity,
  getAttackSourceTop,
  getTopSites,
} from '@/api/aggregation'
import type {
  AttackRecord,
  AttackSeverity,
  AttackSourceTop,
  SiteStats,
} from '@/api/types/aggregation'
import { severityColors } from '@/theme'

const REFRESH_INTERVAL_MS = 10_000
const STORAGE_KEY = 'attacks-monitor-layouts'

const defaultLayout: LayoutItem[] = [
  { i: 'kpi', x: 0, y: 0, w: 12, h: 4, minW: 6, minH: 2 },
  { i: 'map', x: 0, y: 4, w: 8, h: 15, minW: 4, minH: 10 },
  { i: 'severity', x: 8, y: 4, w: 4, h: 7, minW: 2, minH: 5 },
  { i: 'source', x: 8, y: 11, w: 4, h: 8, minW: 2, minH: 5 },
  { i: 'sites', x: 0, y: 19, w: 4, h: 8, minW: 2, minH: 5 },
  { i: 'records', x: 4, y: 19, w: 8, h: 8, minW: 4, minH: 6 },
]

const defaultLayouts: ResponsiveLayouts = {
  lg: defaultLayout,
  md: [
    { i: 'kpi', x: 0, y: 0, w: 10, h: 4, minW: 6, minH: 2 },
    { i: 'map', x: 0, y: 4, w: 8, h: 15, minW: 4, minH: 10 },
    { i: 'severity', x: 6, y: 19, w: 4, h: 7, minW: 2, minH: 5 },
    { i: 'source', x: 6, y: 26, w: 4, h: 8, minW: 2, minH: 5 },
    { i: 'sites', x: 0, y: 19, w: 4, h: 8, minW: 2, minH: 5 },
    { i: 'records', x: 2, y: 34, w: 8, h: 8, minW: 4, minH: 6 },
  ],
}

const darkPageStyle = {
  background: 'linear-gradient(135deg, #050f23 0%, #0a1929 50%, #0d1f3c 100%)',
  minHeight: 'calc(100vh - 56px)',
  padding: '20px 24px',
}

const darkCardStyle = {
  background: 'linear-gradient(135deg, rgba(10, 25, 41, 0.95) 0%, rgba(13, 31, 60, 0.95) 100%)',
  border: '1px solid rgba(77, 148, 255, 0.15)',
  borderRadius: 10,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
}

const darkCardBodyStyle = {
  padding: 20,
  color: '#e0e6f0',
  flex: 1,
  overflow: 'hidden',
}

const kpiCardStyle = {
  background: 'linear-gradient(135deg, rgba(10, 25, 41, 0.8) 0%, rgba(13, 31, 60, 0.8) 100%)',
  border: '1px solid rgba(77, 148, 255, 0.2)',
  borderRadius: 8,
  padding: '12px 16px',
  textAlign: 'center' as const,
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
  height: '100%',
}

const cloneDefaultLayouts = (): ResponsiveLayouts => ({
  lg: defaultLayouts.lg!.map(item => ({ ...item })),
  md: defaultLayouts.md!.map(item => ({ ...item })),
})

const AttacksMonitor = () => {
  const [managerTime, setInstancemTime] = useState<string>('-')
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null)
  const [attacks, setAttacks] = useState<AttackRecord[]>([])
  const [severity, setSeverity] = useState<AttackSeverity | null>(null)
  const [sourceTop, setSourceTop] = useState<AttackSourceTop[]>([])
  const [topSites, setTopSites] = useState<Array<[string, number]>>([])
  const [isLocked, setIsLocked] = useState(true)

  const { width, containerRef } = useContainerWidth()

  const loadStatic = async () => {
    try {
      const [time, stats] = await Promise.all([getInstancemTime(), getSiteStats()])
      setInstancemTime(time)
      setSiteStats(stats)
    } catch {
      /* */
    }
  }

  const loadRealtime = async () => {
    try {
      const [att, sev, src, sites] = await Promise.all([
        getAttackStats(),
        getAttackSeverity(),
        getAttackSourceTop(),
        getTopSites(),
      ])
      setAttacks(att.statistic_info ?? [])
      setSeverity(sev)
      setSourceTop(src)
      setTopSites(sites)
    } catch {
      /* */
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStatic()
    loadRealtime()
    const timer = setInterval(loadRealtime, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  const [layouts, setLayouts] = useState<ResponsiveLayouts>(() => {
    const initialLayouts = cloneDefaultLayouts()

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        return initialLayouts
      }

      const parsedLayouts = JSON.parse(saved) as ResponsiveLayouts
      return {
        ...initialLayouts,
        ...parsedLayouts,
      }
    } catch {
      return initialLayouts
    }
  })

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout, allLayouts: ResponsiveLayouts) => {
      setLayouts(allLayouts)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allLayouts))
      } catch {
        /* */
      }
    },
    []
  )

  const handleResetLayout = useCallback(() => {
    setLayouts(cloneDefaultLayouts())
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* */
    }
  }, [])

  const severityTotal = severity
    ? severity.critical + severity.high + severity.medium + severity.low + severity.info
    : 0

  const cardTitleStyle = useMemo(
    () => ({
      padding: '16px 20px',
      borderBottom: '1px solid rgba(77, 148, 255, 0.1)',
      cursor: isLocked ? 'default' : 'move',
      userSelect: 'none' as const,
    }),
    [isLocked]
  )

  return (
    <div style={darkPageStyle}>
      <PageContainer
        title={
          <span style={{ color: '#e0e6f0', fontSize: 24, fontWeight: 600 }}>攻击监控大屏</span>
        }
        subTitle={<span style={{ color: '#555770', fontSize: 13 }}>管理节点 时间: {managerTime}</span>}
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Tag
              color="processing"
              icon={<ThunderboltOutlined />}
              style={{
                fontSize: 13,
                padding: '4px 12px',
                background: 'rgba(0, 102, 255, 0.15)',
                border: '1px solid rgba(0, 102, 255, 0.4)',
                color: '#4d94ff',
              }}
            >
              实时监控
            </Tag>
            {!isLocked && (
              <Tooltip title="重置布局">
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={handleResetLayout}
                  style={{
                    background: 'rgba(255, 152, 0, 0.15)',
                    border: '1px solid rgba(255, 152, 0, 0.4)',
                    color: '#ff9800',
                  }}
                >
                  重置
                </Button>
              </Tooltip>
            )}
            <Tooltip title={isLocked ? '解锁布局以拖拽和调整卡片大小' : '锁定布局'}>
              <Button
                size="small"
                icon={isLocked ? <UnlockOutlined /> : <LockOutlined />}
                onClick={() => setIsLocked(!isLocked)}
                style={{
                  background: isLocked
                    ? 'rgba(0, 200, 83, 0.15)'
                    : 'rgba(244, 67, 54, 0.15)',
                  border: isLocked
                    ? '1px solid rgba(0, 200, 83, 0.4)'
                    : '1px solid rgba(244, 67, 54, 0.4)',
                  color: isLocked ? '#00c853' : '#f44336',
                }}
              >
                {isLocked ? '解锁' : '锁定'}
              </Button>
            </Tooltip>
          </div>
        }
        style={{ background: 'transparent' }}
      >
        <div ref={containerRef as React.RefObject<HTMLDivElement>}>
          <ResponsiveGridLayout
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768 }}
            cols={{ lg: 12, md: 10, sm: 6 }}
            width={width}
            rowHeight={30}
            margin={[16, 16]}
            onLayoutChange={handleLayoutChange}
            dragConfig={{
              enabled: !isLocked,
              handle: '.drag-handle',
            }}
            resizeConfig={{
              enabled: !isLocked,
              handles: ['se', 'sw', 'ne', 'nw'],
            }}
          >
            <div key="kpi">
              <div style={darkCardStyle}>
                <div className="drag-handle" style={cardTitleStyle}>
                  <h3 style={{ margin: 0, color: '#e0e6f0', fontSize: 16, fontWeight: 600 }}>
                    站点统计
                  </h3>
                </div>
                <div style={{ ...darkCardBodyStyle, display: 'flex', gap: 16 }}>
                  <div style={{ ...kpiCardStyle, borderLeft: '3px solid #00c853', flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div
                          style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: '#00c853',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {siteStats?.on ?? 0}
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8ca1', marginTop: 4 }}>
                          已启用站点
                        </div>
                      </div>
                      <SafetyOutlined style={{ fontSize: 36, color: 'rgba(0, 200, 83, 0.3)' }} />
                    </div>
                  </div>
                  <div style={{ ...kpiCardStyle, borderLeft: '3px solid #ff9800', flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div
                          style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: '#ff9800',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {siteStats?.off ?? 0}
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8ca1', marginTop: 4 }}>
                          已禁用站点
                        </div>
                      </div>
                      <WarningOutlined style={{ fontSize: 36, color: 'rgba(255, 152, 0, 0.3)' }} />
                    </div>
                  </div>
                  <div style={{ ...kpiCardStyle, borderLeft: '3px solid #f44336', flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div
                          style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: '#f44336',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {siteStats?.idle ?? 0}
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8ca1', marginTop: 4 }}>
                          未防护站点
                        </div>
                      </div>
                      <FireOutlined style={{ fontSize: 36, color: 'rgba(244, 67, 54, 0.3)' }} />
                    </div>
                  </div>
                  <div style={{ ...kpiCardStyle, borderLeft: '3px solid #0066ff', flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div
                          style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: '#4d94ff',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {attacks.length}
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8ca1', marginTop: 4 }}>攻击总数</div>
                      </div>
                      <GlobalOutlined style={{ fontSize: 36, color: 'rgba(0, 102, 255, 0.3)' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div key="map">
              <div style={darkCardStyle}>
                <div className="drag-handle" style={cardTitleStyle}>
                  <h3 style={{ margin: 0, color: '#e0e6f0', fontSize: 16, fontWeight: 600 }}>
                    全球攻击态势
                  </h3>
                </div>
                <div style={{ ...darkCardBodyStyle, padding: 0 }}>
                  <AttackMap attacks={attacks} height="100%" />
                </div>
              </div>
            </div>

            <div key="severity">
              <div style={darkCardStyle}>
                <div className="drag-handle" style={cardTitleStyle}>
                  <h3 style={{ margin: 0, color: '#e0e6f0', fontSize: 15, fontWeight: 600 }}>
                    威胁级别分布
                  </h3>
                </div>
                <div style={darkCardBodyStyle}>
                  {severity && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {(['critical', 'high', 'medium', 'low', 'info'] as const).map(k => {
                        const count = severity[k]
                        const percent = severityTotal > 0 ? (count / severityTotal) * 100 : 0
                        return (
                          <div key={k}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 6,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 12,
                                  color: '#8c8ca1',
                                  textTransform: 'uppercase',
                                  fontWeight: 500,
                                }}
                              >
                                {k}
                              </span>
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: severityColors[k],
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                {count}
                              </span>
                            </div>
                            <Progress
                              percent={Math.round(percent)}
                              strokeColor={{
                                '0%': severityColors[k],
                                '100%': severityColors[k],
                              }}
                              trailColor="rgba(255,255,255,0.05)"
                              showInfo={false}
                              size="small"
                              strokeWidth={8}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div key="source">
              <div style={darkCardStyle}>
                <div className="drag-handle" style={cardTitleStyle}>
                  <h3 style={{ margin: 0, color: '#e0e6f0', fontSize: 15, fontWeight: 600 }}>
                    攻击来源 TOP 5
                  </h3>
                </div>
                <div style={darkCardBodyStyle}>
                  {sourceTop.slice(0, 5).map((item, idx) => (
                    <div
                      key={item.src_ip}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        marginBottom: 8,
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 6,
                        border: '1px solid rgba(77, 148, 255, 0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 24,
                            height: 24,
                            lineHeight: '24px',
                            textAlign: 'center',
                            borderRadius: 4,
                            background: idx === 0 ? '#ff6b35' : 'rgba(77, 148, 255, 0.2)',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#b5b5c3' }}>
                          {item.src_ip}
                        </span>
                      </div>
                      <Tag
                        color="blue"
                        style={{
                          background: 'rgba(0, 102, 255, 0.15)',
                          border: '1px solid rgba(0, 102, 255, 0.3)',
                          color: '#4d94ff',
                          fontWeight: 600,
                        }}
                      >
                        {item.count}
                      </Tag>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div key="sites">
              <div style={darkCardStyle}>
                <div className="drag-handle" style={cardTitleStyle}>
                  <h3 style={{ margin: 0, color: '#e0e6f0', fontSize: 15, fontWeight: 600 }}>
                    被攻击站点 TOP 5
                  </h3>
                </div>
                <div style={darkCardBodyStyle}>
                  {topSites.slice(0, 5).map(([host, count], idx) => (
                    <div
                      key={host}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        marginBottom: 8,
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 6,
                        border: '1px solid rgba(77, 148, 255, 0.08)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            width: 24,
                            height: 24,
                            lineHeight: '24px',
                            textAlign: 'center',
                            borderRadius: 4,
                            background: idx === 0 ? '#ff9800' : 'rgba(77, 148, 255, 0.2)',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: '#b5b5c3',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={host}
                        >
                          {host}
                        </span>
                      </div>
                      <Tag
                        color="orange"
                        style={{
                          background: 'rgba(255, 152, 0, 0.15)',
                          border: '1px solid rgba(255, 152, 0, 0.3)',
                          color: '#ff9800',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {count}
                      </Tag>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div key="records">
              <div style={darkCardStyle}>
                <div className="drag-handle" style={cardTitleStyle}>
                  <h3 style={{ margin: 0, color: '#e0e6f0', fontSize: 15, fontWeight: 600 }}>
                    实时攻击记录
                  </h3>
                </div>
                <div style={darkCardBodyStyle}>
                  <Table<AttackRecord>
                    size="small"
                    rowKey={r => `${r.datetime}-${r.src_ip}-${r.dst_ip}`}
                    dataSource={attacks}
                    pagination={{ pageSize: 8, size: 'small' }}
                    scroll={{ x: 'max-content' }}
                    style={{ background: 'transparent' }}
                    className="dark-table"
                    columns={[
                      {
                        title: '时间',
                        dataIndex: 'datetime',
                        width: 150,
                        render: (v: string) => (
                          <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#8c8ca1' }}>
                            {v}
                          </span>
                        ),
                      },
                      {
                        title: '源 IP',
                        dataIndex: 'src_ip',
                        width: 130,
                        render: (v: string) => (
                          <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#b5b5c3' }}>
                            {v}
                          </span>
                        ),
                      },
                      {
                        title: '站点',
                        dataIndex: 'host',
                        ellipsis: true,
                        render: (v: string) => (
                          <span style={{ fontSize: 13, color: '#b5b5c3' }}>{v}</span>
                        ),
                      },
                      {
                        title: '严重度',
                        dataIndex: 'severity',
                        width: 90,
                        render: (v: string) => (
                          <Tag
                            color={severityColors[v as keyof typeof severityColors]}
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              border: 'none',
                            }}
                          >
                            {v.toUpperCase()}
                          </Tag>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
          </ResponsiveGridLayout>
        </div>

        <style>{`
          .react-grid-item.react-grid-placeholder {
            background: rgba(77, 148, 255, 0.3) !important;
            opacity: 0.5 !important;
            border: 2px dashed rgba(77, 148, 255, 0.6) !important;
            border-radius: 10px !important;
          }

          .react-grid-item > .react-resizable-handle::after {
            border-right-color: rgba(77, 148, 255, 0.8) !important;
            border-bottom-color: rgba(77, 148, 255, 0.8) !important;
          }

          .dark-table .ant-table {
            background: transparent !important;
            color: #e0e6f0 !important;
          }
          .dark-table .ant-table-thead > tr > th {
            background: rgba(255, 255, 255, 0.05) !important;
            color: #8c8ca1 !important;
            border-bottom: 1px solid rgba(77, 148, 255, 0.15) !important;
            font-weight: 600 !important;
            font-size: 12px !important;
          }
          .dark-table .ant-table-tbody > tr > td {
            background: transparent !important;
            border-bottom: 1px solid rgba(77, 148, 255, 0.08) !important;
          }
          .dark-table .ant-table-tbody > tr:hover > td {
            background: rgba(0, 102, 255, 0.08) !important;
          }
          .dark-table .ant-pagination {
            color: #8c8ca1 !important;
          }
          .dark-table .ant-pagination-item {
            background: rgba(255, 255, 255, 0.05) !important;
            border-color: rgba(77, 148, 255, 0.2) !important;
          }
          .dark-table .ant-pagination-item a {
            color: #b5b5c3 !important;
          }
          .dark-table .ant-pagination-item-active {
            background: rgba(0, 102, 255, 0.2) !important;
            border-color: #0066ff !important;
          }
          .dark-table .ant-pagination-item-active a {
            color: #4d94ff !important;
          }
          .dark-table .ant-pagination-prev .ant-pagination-item-link,
          .dark-table .ant-pagination-next .ant-pagination-item-link {
            background: rgba(255, 255, 255, 0.05) !important;
            border-color: rgba(77, 148, 255, 0.2) !important;
            color: #b5b5c3 !important;
          }
          .dark-table .ant-pagination-disabled .ant-pagination-item-link {
            color: rgba(255, 255, 255, 0.2) !important;
          }
          .dark-table .ant-pagination-total-text {
            color: #8c8ca1 !important;
          }
        `}</style>
      </PageContainer>
    </div>
  )
}

export default AttacksMonitor
