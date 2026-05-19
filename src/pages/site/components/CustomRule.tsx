import { useState, useRef, useCallback } from 'react'
import { ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Transfer, Popconfirm, message } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import { listCustomRules, createCustomRuleRelevance, removeCustomRuleSites } from '@/api/site'
import { listGlobalCustomRules } from '@/api/policy'
import type { CustomRule as CustomRuleType } from '@/api/types/site'
import type { GlobalCustomRule } from '@/api/types/policy'

interface CustomRuleProps {
  siteId: string
}

const CustomRule = ({ siteId }: CustomRuleProps) => {
  const actionRef = useRef<ActionType>()
  const [modalVisible, setModalVisible] = useState(false)
  const [globalRules, setGlobalRules] = useState<GlobalCustomRule[]>([])
  const [targetKeys, setTargetKeys] = useState<string[]>([])
  const [confirmLoading, setConfirmLoading] = useState(false)

  const handleOpenModal = useCallback(async () => {
    try {
      const [globalRes, siteRes] = await Promise.all([
        listGlobalCustomRules(),
        listCustomRules(siteId),
      ])
      setGlobalRules(globalRes.custom_rules ?? [])
      const existingIds = (siteRes.custom_rules ?? []).map(r => r.id)
      setTargetKeys(existingIds)
      setModalVisible(true)
    } catch {
      /* 已由拦截器提示 */
    }
  }, [siteId])

  const handleUnlink = async (id: string) => {
    try {
      await removeCustomRuleSites(id)
      message.success('解除关联成功')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleSubmit = async () => {
    setConfirmLoading(true)
    try {
      await createCustomRuleRelevance(siteId, { rule_ids: targetKeys })
      message.success('关联规则成功')
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    } finally {
      setConfirmLoading(false)
    }
  }

  const columns: ProColumns<CustomRuleType>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '优先级', dataIndex: 'priority', width: 100 },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, record) => [
        <Popconfirm
          key="unlink"
          title="确定解除该规则的关联？"
          onConfirm={() => handleUnlink(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>解除关联</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <>
      <ProTable<CustomRuleType>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listCustomRules(siteId)
            return { data: res.custom_rules ?? [], success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="link" type="primary" icon={<LinkOutlined />} onClick={handleOpenModal}>
            关联规则
          </Button>,
        ]}
      />

      <Modal
        title="关联自定义规则"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={confirmLoading}
        width={640}
        destroyOnClose
      >
        <Transfer
          dataSource={globalRules.map(r => ({ key: r.id, title: r.name }))}
          titles={['全局规则', '已选规则']}
          targetKeys={targetKeys}
          onChange={nextKeys => setTargetKeys(nextKeys as string[])}
          render={item => item.title ?? ''}
          listStyle={{ width: 260, height: 360 }}
        />
      </Modal>
    </>
  )
}

export default CustomRule
