import { useState, useRef } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Switch, Tag, Popconfirm, message, Select } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  listProjectUsers,
  listUsers,
  listRoles,
  assignProjectUserRole,
  revokeProjectUserRole,
} from '@/api/user'
import type { Project, User, Role } from '@/api/types/user'

const ProjectList = () => {
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [memberModalVisible, setMemberModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [projectMembers, setProjectMembers] = useState<User[]>([])

  const handleCreate = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Project) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id)
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
        await updateProject(editingId, values)
        message.success('更新成功')
      } else {
        await createProject(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleManageMembers = async (record: Project) => {
    setCurrentProject(record)
    try {
      const [usersRes, rolesRes, membersRes] = await Promise.all([
        listUsers(),
        listRoles(),
        listProjectUsers(record.id),
      ])
      setAllUsers(usersRes.users)
      setAllRoles(rolesRes.roles)
      setProjectMembers(membersRes.users)
      setMemberModalVisible(true)
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const [addMemberForm] = Form.useForm()

  const handleAddMember = async () => {
    if (!currentProject) return
    try {
      const { user_id, role_id } = await addMemberForm.validateFields()
      await assignProjectUserRole(currentProject.id, user_id, role_id)
      message.success('成员添加成功')
      addMemberForm.resetFields()
      const res = await listProjectUsers(currentProject.id)
      setProjectMembers(res.users)
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!currentProject || allRoles.length === 0) return
    try {
      await Promise.all(allRoles.map(r => revokeProjectUserRole(currentProject.id, userId, r.id)))
      message.success('成员移除成功')
      const res = await listProjectUsers(currentProject.id)
      setProjectMembers(res.users)
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<Project>[] = [
    { title: '项目名称', dataIndex: 'name' },
    { title: '描述', dataIndex: 'description', ellipsis: true },
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
        <a key="members" onClick={() => handleManageMembers(record)}>
          成员
        </a>,
        <Popconfirm key="delete" title="确定删除该项目？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  const memberColumns: ProColumns<User>[] = [
    { title: '用户名', dataIndex: 'name' },
    { title: '邮箱', dataIndex: 'email' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <Popconfirm
          key="remove"
          title="确定移除该成员？"
          onConfirm={() => handleRemoveMember(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>移除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer title="项目管理">
      <ProTable<Project>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listProjects()
            return { data: res.projects, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建项目
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑项目' : '创建项目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ enabled: true, domain_id: 'default', is_domain: false }}
        >
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" rows={3} />
          </Form.Item>
          <Form.Item name="domain_id" label="域" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="is_domain" hidden valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`成员管理 - ${currentProject?.name ?? ''}`}
        open={memberModalVisible}
        onCancel={() => setMemberModalVisible(false)}
        footer={null}
        width={640}
      >
        <Form form={addMemberForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="user_id" rules={[{ required: true, message: '请选择用户' }]}>
            <Select
              placeholder="选择用户"
              style={{ width: 180 }}
              options={allUsers.map(u => ({ label: u.name, value: u.id }))}
            />
          </Form.Item>
          <Form.Item name="role_id" rules={[{ required: true, message: '请选择角色' }]}>
            <Select
              placeholder="选择角色"
              style={{ width: 180 }}
              options={allRoles.map(r => ({ label: r.name, value: r.id }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleAddMember}>
              添加
            </Button>
          </Form.Item>
        </Form>
        <ProTable<User>
          columns={memberColumns}
          dataSource={projectMembers}
          rowKey="id"
          search={false}
          toolBarRender={false}
          pagination={false}
        />
      </Modal>
    </PageContainer>
  )
}

export default ProjectList
