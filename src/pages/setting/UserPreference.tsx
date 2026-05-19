import { useState, useEffect } from 'react'
import { PageContainer } from '@ant-design/pro-components'
import { Card, Form, Radio, Select, Button, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/theme'

interface PreferenceForm {
  language: string
  theme: string
  pageSize: number
}

const UserPreference = () => {
  const [form] = Form.useForm<PreferenceForm>()
  const [loading, setLoading] = useState(false)
  const { t, i18n } = useTranslation()
  const isDark = useThemeStore(s => s.isDark)
  const setTheme = useThemeStore(s => s.setTheme)

  useEffect(() => {
    const savedPrefs = localStorage.getItem('userPreference')
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs) as PreferenceForm
        form.setFieldsValue(prefs)
        setTheme(prefs.theme === 'dark')
      } catch {
        /* 忽略解析错误 */
      }
    } else {
      form.setFieldsValue({
        language: i18n.language || 'zh-CN',
        theme: isDark ? 'dark' : 'light',
        pageSize: 20,
      })
    }
  }, [form, i18n.language, isDark, setTheme])

  const handleSubmit = async (values: PreferenceForm) => {
    setLoading(true)
    try {
      localStorage.setItem('userPreference', JSON.stringify(values))
      i18n.changeLanguage(values.language)
      setTheme(values.theme === 'dark')
      message.success(t('preference.saveSuccess'))
    } catch {
      message.error(t('preference.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer title={t('preference.title')}>
      <Card style={{ maxWidth: 600 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="language" label={t('preference.language')} rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="zh-CN">{t('preference.languageZh')}</Radio>
              <Radio value="en-US">{t('preference.languageEn')}</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="theme" label={t('preference.theme')} rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="light">{t('preference.themeLight')}</Radio>
              <Radio value="dark">{t('preference.themeDark')}</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="pageSize" label={t('preference.pageSize')} rules={[{ required: true }]}>
            <Select
              options={[
                { label: t('preference.pageSizeOption', { count: 10 }), value: 10 },
                { label: t('preference.pageSizeOption', { count: 20 }), value: 20 },
                { label: t('preference.pageSizeOption', { count: 50 }), value: 50 },
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {t('common.save')}
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => form.resetFields()}>
              {t('common.reset')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  )
}

export default UserPreference
