import { useState, useRef } from 'react'
import { ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Select, Popconfirm, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { listLbMembers, createLbMember, updateLbMember, deleteLbMember } from '@/api/site'
import type { LbMember as LbMemberType } from '@/api/types/site'

interface LbMemberProps {
  siteId: string
}

const LbMember = ({ siteId }: LbMemberProps) => {
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: LbMemberType) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteLbMember(siteId, id)
      message.success('删除成功')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        await updateLbMember(siteId, editingId, values)
        message.success('更新成功')
      } else {
        await createLbMember(siteId, values)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<LbMemberType>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '集群', dataIndex: 'lb_pool_id', ellipsis: true },
    { title: '后端地址', dataIndex: 'backend_address', ellipsis: true },
    { title: '后端端口', dataIndex: 'backend_protocol_port' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定删除该LB成员？"
          onConfirm={() => handleDelete(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <>
      <ProTable<LbMemberType>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listLbMembers(siteId)
            return { data: res.lbs, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增LB成员
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑LB成员' : '新增LB成员'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item name="lb_pool_id" label="集群">
            <Select allowClear placeholder="请选择集群" />
          </Form.Item>
          <Form.Item
            name="backend_address"
            label="后端地址"
            rules={[{ required: true, message: '请输入后端地址' }]}
          >
            <Input placeholder="请输入后端地址" />
          </Form.Item>
          <Form.Item
            name="backend_protocol_port"
            label="后端端口"
            rules={[{ required: true, message: '请输入后端端口' }]}
          >
            <Input placeholder="请输入后端端口" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default LbMember
