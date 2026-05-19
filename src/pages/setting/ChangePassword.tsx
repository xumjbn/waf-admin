import { useState } from 'react'
import { PageContainer } from '@ant-design/pro-components'
import { Card, Form, Input, Button, message } from 'antd'
import { updateUser } from '@/api/user'
import { useAuthStore } from '@/store/auth'

interface PasswordForm {
  current_password: string
  new_password: string
  confirm_password: string
}

const ChangePassword = () => {
  const [form] = Form.useForm<PasswordForm>()
  const [loading, setLoading] = useState(false)
  const user = useAuthStore(state => state.user)

  const handleSubmit = async (values: PasswordForm) => {
    if (!user?.id) {
      message.error('用户信息不存在')
      return
    }

    setLoading(true)
    try {
      await updateUser(user.id, { password: values.new_password })
      message.success('密码修改成功，请重新登录')
      form.resetFields()
    } catch {
      /* 已由拦截器提示 */
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer title="修改密码">
      <Card style={{ maxWidth: 600 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item
            name="current_password"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码长度至少8位' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message: '密码必须包含大小写字母、数字和特殊字符',
              },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="确认新密码"
            dependencies={['new_password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              提交
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => form.resetFields()}>
              重置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  )
}

export default ChangePassword
