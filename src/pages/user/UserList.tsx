import { useState, useRef } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Select, Switch, Tag, Popconfirm, message, Grid } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listRoles,
  assignUserRole,
  revokeUserRole,
  listUserRoles,
} from '@/api/user'
import type { User, Role } from '@/api/types/user'

const { useBreakpoint } = Grid

const UserList = () => {
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [roleModalVisible, setRoleModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [userRoles, setUserRoles] = useState<string[]>([])
  const screens = useBreakpoint()
  const isMobile = screens.xs || screens.sm

  const handleCreate = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: User) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id)
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
        await updateUser(editingId, values)
        message.success('更新成功')
      } else {
        await createUser(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleManageRoles = async (record: User) => {
    setCurrentUser(record)
    try {
      const [rolesRes, userRolesRes] = await Promise.all([listRoles(), listUserRoles(record.id)])
      setAllRoles(rolesRes.roles)
      setUserRoles(userRolesRes.roles.map(r => r.id))
      setRoleModalVisible(true)
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleRoleChange = async (selectedRoleIds: string[]) => {
    if (!currentUser) return
    try {
      const toAdd = selectedRoleIds.filter(id => !userRoles.includes(id))
      const toRemove = userRoles.filter(id => !selectedRoleIds.includes(id))
      await Promise.all([
        ...toAdd.map(roleId => assignUserRole(roleId, currentUser.id)),
        ...toRemove.map(roleId => revokeUserRole(roleId, currentUser.id)),
      ])
      setUserRoles(selectedRoleIds)
      message.success('角色分配更新成功')
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<User>[] = [
    { title: '用户名', dataIndex: 'name', fixed: isMobile ? undefined : 'left', width: 120 },
    { title: '邮箱', dataIndex: 'email', ellipsis: true, hideInTable: isMobile },
    { title: '描述', dataIndex: 'description', ellipsis: true, hideInTable: isMobile },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 80,
      render: (_, record) => (
        <Tag color={record.enabled ? 'green' : 'default'}>{record.enabled ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      width: 180,
      hideInTable: isMobile,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <a key="role" onClick={() => handleManageRoles(record)}>
          角色
        </a>,
        <Popconfirm key="delete" title="确定删除该用户？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer title="用户管理">
      <ProTable<User>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: isMobile ? 10 : 20 }}
        search={false}
        scroll={{ x: 'max-content' }}
        request={async () => {
          try {
            const res = await listUsers()
            return { data: res.users, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建用户
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑用户' : '创建用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={isMobile ? '100%' : undefined}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ enabled: true, domain_id: 'default' }}>
          <Form.Item
            name="name"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          {!editingId && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" rows={2} />
          </Form.Item>
          <Form.Item name="domain_id" label="域" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`角色分配 - ${currentUser?.name ?? ''}`}
        open={roleModalVisible}
        onCancel={() => setRoleModalVisible(false)}
        width={isMobile ? '100%' : undefined}
        footer={null}
      >
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="选择角色"
          value={userRoles}
          onChange={handleRoleChange}
          options={allRoles.map(r => ({ label: r.name, value: r.id }))}
        />
      </Modal>
    </PageContainer>
  )
}

export default UserList
