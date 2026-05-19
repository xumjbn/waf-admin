import { useState, useRef } from 'react'
import { ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Tag,
  Popconfirm,
  message,
} from 'antd'
import { PlusOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  listAntiTamper,
  createAntiTamper,
  updateAntiTamper,
  deleteAntiTamper,
  deleteAntiTamperStudy,
  getAntiTamperStudy,
} from '@/api/site'
import type { AntiTamper } from '@/api/types/site'

interface AntiTamperProps {
  siteId: string
}

const FILE_TYPE_OPTIONS = [
  '*.htm',
  '*.txt',
  '*.jpeg',
  '*.gif',
  '*.png',
  '*.pdf',
  '*.doc',
  '*.ppt',
  '*.xml',
  '*.exe',
  '*.zip',
  '*.chm',
  '*.xls',
  '*.js',
  '*.swf',
  '*.gzip',
  '*.css',
].map(v => ({ label: v, value: v }))

const AntiTamperPanel = ({ siteId }: AntiTamperProps) => {
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: AntiTamper) => {
    setEditingId(record.id)
    form.setFieldsValue({
      ...record,
      file_type: record.file_type ? record.file_type.split(',') : [],
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAntiTamper(siteId, id)
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
        log: true,
        file_type: Array.isArray(values.file_type) ? values.file_type.join(',') : values.file_type,
      }
      if (editingId) {
        await updateAntiTamper(siteId, editingId, payload)
        message.success('更新成功')
      } else {
        await createAntiTamper(siteId, payload)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleDownloadStudy = async () => {
    try {
      const res = await getAntiTamperStudy(siteId)
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `anti_tamper_study_${siteId}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleClearStudy = async () => {
    try {
      await deleteAntiTamperStudy(siteId)
      message.success('清空学习数据成功')
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<AntiTamper>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: 'URL', dataIndex: 'url', ellipsis: true },
    { title: '文件类型', dataIndex: 'file_type', ellipsis: true },
    {
      title: '动作',
      dataIndex: 'action',
      render: (_, record) => (
        <Tag color={record.action === 'deny' ? 'red' : 'green'}>
          {record.action === 'deny' ? '阻断' : '放行'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (_, record) => (
        <Tag color={record.status ? 'green' : 'default'}>{record.status ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm key="delete" title="确定删除该规则？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <>
      <ProTable<AntiTamper>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listAntiTamper(siteId)
            return { data: res.anti_tamper, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="download" icon={<DownloadOutlined />} onClick={handleDownloadStudy}>
            下载学习URL
          </Button>,
          <Popconfirm key="clear" title="确定清空学习数据？" onConfirm={handleClearStudy}>
            <Button icon={<DeleteOutlined />} danger>
              清空学习数据
            </Button>
          </Popconfirm>,
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增规则
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑防篡改规则' : '新增防篡改规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ status: true, action: 'deny' }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item name="url" label="URL" rules={[{ required: true, message: '请输入URL' }]}>
            <Input placeholder="请输入URL" />
          </Form.Item>
          <Form.Item name="file_type" label="文件类型">
            <Select mode="multiple" options={FILE_TYPE_OPTIONS} placeholder="请选择文件类型" />
          </Form.Item>
          <Form.Item name="action" label="动作">
            <Select
              options={[
                { label: '阻断', value: 'deny' },
                { label: '放行', value: 'allow' },
              ]}
            />
          </Form.Item>
          <Form.Item name="max_file_size" label="文件大小(字节)">
            <InputNumber
              min={1}
              max={10485760}
              style={{ width: '100%' }}
              placeholder="请输入文件大小"
            />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default AntiTamperPanel
