import { useState, useRef } from 'react'
import { ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Select, InputNumber, Popconfirm, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  listAccelerator,
  createAccelerator,
  updateAccelerator,
  deleteAccelerator,
} from '@/api/site'
import type { Accelerator } from '@/api/types/site'

interface AcceleratorProps {
  siteId: string
}

const FILETYPE_OPTIONS = [
  { label: '文档 (doc/docx/ppt/pptx/xls/xlsx/txt)', value: 'doc|docx|ppt|pptx|xls|xlsx|txt' },
  { label: '图片 (gif/jpg/jpeg/png)', value: 'gif|jpg|jpeg|png' },
  { label: '网页 (html/htm)', value: 'html|htm' },
]

const AcceleratorPanel = ({ siteId }: AcceleratorProps) => {
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const isGlobal = Form.useWatch('is_global', form)

  const handleCreate = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Accelerator) => {
    setEditingId(record.id)
    form.setFieldsValue({
      ...record,
      filetypes: record.filetypes ? record.filetypes.split(',') : [],
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAccelerator(siteId, id)
      message.success('删除成功')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        filetypes:
          values.is_global === 'disable' && values.filetypes?.length
            ? values.filetypes.join(',')
            : undefined,
      }
      if (editingId) {
        await updateAccelerator(siteId, editingId, payload)
        message.success('更新成功')
      } else {
        await createAccelerator(siteId, payload)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<Accelerator>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '缓存路径', dataIndex: 'url', ellipsis: true },
    { title: '文件类型', dataIndex: 'filetypes', ellipsis: true },
    { title: '过期时间(分钟)', dataIndex: 'expired_time' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定删除该加速规则？"
          onConfirm={() => handleDelete(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <>
      <ProTable<Accelerator>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listAccelerator(siteId)
            return { data: res.accelerator, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建加速规则
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑加速规则' : '创建加速规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={560}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ is_global: 'enable', expired_time: 60 }}
        >
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item
            name="url"
            label="缓存路径"
            rules={[{ required: true, message: '请输入缓存的URL路径' }]}
          >
            <Input placeholder="请输入缓存的URL路径" />
          </Form.Item>
          <Form.Item name="is_global" label="缓存范围">
            <Select
              options={[
                { label: '全部缓存', value: 'enable' },
                { label: '部分缓存', value: 'disable' },
              ]}
            />
          </Form.Item>
          {isGlobal === 'disable' && (
            <Form.Item name="filetypes" label="文件类型">
              <Select mode="multiple" placeholder="请选择文件类型" options={FILETYPE_OPTIONS} />
            </Form.Item>
          )}
          <Form.Item
            name="expired_time"
            label="过期时间(分钟)"
            rules={[{ required: true, message: '请输入过期时间' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入过期时间" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default AcceleratorPanel
