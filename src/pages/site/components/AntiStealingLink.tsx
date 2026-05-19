import { useState, useRef } from 'react'
import { ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Select, Switch, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  listAntiStealingLink,
  createAntiStealingLink,
  updateAntiStealingLink,
  deleteAntiStealingLink,
} from '@/api/site'
import type { AntiStealingLink } from '@/api/types/site'

const { TextArea } = Input

interface AntiStealingLinkProps {
  siteId: string
}

const FILE_TYPE_OPTIONS = [
  { label: '图片 (gif/jpeg/png/bmp/jpg)', value: 'gif,jpeg,png,bmp,jpg' },
  { label: '音频 (wav/midi/cda/mp3/wma/mp4)', value: 'wav,midi,cda,mp3,wma,mp4' },
  {
    label: '视频 (avi/rmvb/rm/asf/divx/mpg/wmv/mkv/vob)',
    value: 'avi,rmvb,rm,asf,divx,mpg,wmv,mkv,vob',
  },
  { label: '文档 (doc/xls/xlsx/ppt/pdf)', value: 'doc,xls,xlsx,ppt,pdf' },
]

const AntiStealingLinkPanel = ({ siteId: _siteId }: AntiStealingLinkProps) => {
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: AntiStealingLink) => {
    setEditingId(record.id)
    form.setFieldsValue({
      ...record,
      file_types: record.file_types ? record.file_types.split(';') : [],
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAntiStealingLink(id)
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
        file_types: values.file_types?.length ? values.file_types.join(';') : undefined,
      }
      if (editingId) {
        await updateAntiStealingLink(editingId, payload)
        message.success('更新成功')
      } else {
        await createAntiStealingLink(payload)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<AntiStealingLink>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '可信主机', dataIndex: 'trust_hosts', ellipsis: true },
    { title: '文件类型', dataIndex: 'file_types', ellipsis: true },
    {
      title: '日志',
      dataIndex: 'log',
      render: (_, record) => (
        <Tag color={record.log ? 'blue' : 'default'}>{record.log ? '开启' : '关闭'}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      render: (_, record) => (
        <Tag color={record.enabled ? 'green' : 'default'}>{record.enabled ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定删除该防盗链规则？"
          onConfirm={() => handleDelete(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <>
      <ProTable<AntiStealingLink>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listAntiStealingLink()
            return { data: res.anti_stealing_link, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建防盗链规则
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑防盗链规则' : '创建防盗链规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ log: false, enabled: true }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item name="trust_hosts" label="可信主机">
            <TextArea rows={4} placeholder="请输入可信主机，每行一个" />
          </Form.Item>
          <Form.Item name="file_types" label="文件类型">
            <Select mode="multiple" placeholder="请选择文件类型" options={FILE_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="log" label="日志" valuePropName="checked">
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default AntiStealingLinkPanel
