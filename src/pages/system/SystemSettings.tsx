import { useState, useEffect, useCallback } from 'react'
import { PageContainer } from '@ant-design/pro-components'
import {
  Collapse,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Descriptions,
  Spin,
  message,
} from 'antd'
import { EditOutlined } from '@ant-design/icons'
import {
  getRunningMode,
  updateRunningMode,
  getInstancemTime,
  changeTime,
  getDnsSetting,
  updateDnsSetting,
  getSyslogSetting,
  updateSyslogSetting,
  getMailSetting,
  updateMailSetting,
  getSnmpSetting,
  updateSnmpSetting,
  getJvmSetting,
  updateJvmSetting,
  getFailoverSetting,
  updateFailoverSetting,
  getSessionTimeout,
  updateSessionTimeout,
} from '@/api/system'
import type {
  RunningMode,
  SystemTime,
  DnsSetting,
  SyslogSetting,
  MailSetting,
  SnmpSetting,
  JvmSetting,
  FailoverSetting,
  SessionTimeout,
} from '@/api/types/system'

type SettingType =
  | 'running_mode'
  | 'time'
  | 'dns'
  | 'syslog'
  | 'mail'
  | 'snmp'
  | 'jvm'
  | 'failover'
  | 'session'

const SystemSettings = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentType, setCurrentType] = useState<SettingType | null>(null)
  const [settings, setSettings] = useState<Record<string, unknown>>({})

  const loadAllSettings = useCallback(async () => {
    setLoading(true)
    try {
      const [runningMode, time, dns, syslog, mail, snmp, jvm, failover, session] =
        await Promise.all([
          getRunningMode(),
          getInstancemTime(),
          getDnsSetting(),
          getSyslogSetting(),
          getMailSetting(),
          getSnmpSetting(),
          getJvmSetting(),
          getFailoverSetting(),
          getSessionTimeout(),
        ])
      setSettings({
        running_mode: runningMode,
        time,
        dns,
        syslog,
        mail,
        snmp,
        jvm,
        failover,
        session,
      })
    } catch {
      /* 已由拦截器提示 */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAllSettings()
  }, [loadAllSettings])

  const openEditModal = (type: SettingType) => {
    setCurrentType(type)
    const dataMap: Record<SettingType, unknown> = {
      running_mode: settings.running_mode,
      time: settings.time,
      dns: settings.dns,
      syslog: settings.syslog,
      mail: settings.mail,
      snmp: settings.snmp,
      jvm: settings.jvm,
      failover: settings.failover,
      session: settings.session,
    }
    form.resetFields()
    form.setFieldsValue(dataMap[type] ?? {})
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const updateMap: Record<SettingType, () => Promise<unknown>> = {
        running_mode: () => updateRunningMode(values as RunningMode),
        time: () => changeTime(values as SystemTime),
        dns: () => updateDnsSetting(values as DnsSetting),
        syslog: () => updateSyslogSetting(values as SyslogSetting),
        mail: () => updateMailSetting(values as MailSetting),
        snmp: () => updateSnmpSetting(values as SnmpSetting),
        jvm: () => updateJvmSetting(values as JvmSetting),
        failover: () => updateFailoverSetting(values as FailoverSetting),
        session: () => updateSessionTimeout(values as SessionTimeout),
      }
      await updateMap[currentType!]()
      message.success('保存成功')
      setModalVisible(false)
      loadAllSettings()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const titleMap: Record<SettingType, string> = {
    running_mode: '运行模式',
    time: '系统时间',
    dns: 'DNS 设置',
    syslog: 'Syslog 设置',
    mail: '邮件设置',
    snmp: 'SNMP 设置',
    jvm: 'JVM 设置',
    failover: '故障转移设置',
    session: '会话超时',
  }

  const editBtn = (type: SettingType) => (
    <Button
      type="link"
      icon={<EditOutlined />}
      onClick={e => {
        e.stopPropagation()
        openEditModal(type)
      }}
    >
      编辑
    </Button>
  )

  const rm = settings.running_mode as RunningMode | undefined
  const tm = settings.time as SystemTime | undefined
  const dns = settings.dns as DnsSetting | undefined
  const syslog = settings.syslog as SyslogSetting | undefined
  const mail = settings.mail as MailSetting | undefined
  const snmp = settings.snmp as SnmpSetting | undefined
  const jvm = settings.jvm as JvmSetting | undefined
  const fo = settings.failover as FailoverSetting | undefined
  const sess = settings.session as SessionTimeout | undefined

  const collapseItems = [
    {
      key: 'running_mode',
      label: '运行模式',
      extra: editBtn('running_mode'),
      children: (
        <Descriptions column={1}>
          <Descriptions.Item label="模式">{rm?.mode ?? '-'}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'time',
      label: '系统时间',
      extra: editBtn('time'),
      children: (
        <Descriptions column={1}>
          <Descriptions.Item label="时间">{tm?.time ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="时区">{tm?.timezone ?? '-'}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'dns',
      label: 'DNS 设置',
      extra: editBtn('dns'),
      children: (
        <Descriptions column={1}>
          <Descriptions.Item label="主 DNS">{dns?.primary_dns ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="备 DNS">{dns?.secondary_dns ?? '-'}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'syslog',
      label: 'Syslog 设置',
      extra: editBtn('syslog'),
      children: (
        <Descriptions column={1}>
          <Descriptions.Item label="启用">{syslog?.enabled ? '是' : '否'}</Descriptions.Item>
          <Descriptions.Item label="服务器">{syslog?.server ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="端口">{syslog?.port ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="协议">{syslog?.protocol ?? '-'}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'mail',
      label: '邮件设置',
      extra: editBtn('mail'),
      children: (
        <Descriptions column={1}>
          <Descriptions.Item label="SMTP 服务器">{mail?.smtp_server ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="端口">{mail?.smtp_port ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="发件人">{mail?.from_address ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="TLS">{mail?.use_tls ? '是' : '否'}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'snmp',
      label: 'SNMP 设置',
      extra: editBtn('snmp'),
      children: (
        <Descriptions column={1}>
          <Descriptions.Item label="启用">{snmp?.enabled ? '是' : '否'}</Descriptions.Item>
          <Descriptions.Item label="团体名">{snmp?.community ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="版本">{snmp?.version ?? '-'}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'jvm',
      label: 'JVM 设置',
      extra: editBtn('jvm'),
      children: (
        <Descriptions column={1}>
          <Descriptions.Item label="堆大小">{jvm?.heap_size ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="GC 类型">{jvm?.gc_type ?? '-'}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'failover',
      label: '故障转移设置',
      extra: editBtn('failover'),
      children: (
        <Descriptions column={1}>
          <Descriptions.Item label="启用">{fo?.enabled ? '是' : '否'}</Descriptions.Item>
          <Descriptions.Item label="超时">{fo?.timeout ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="重试次数">{fo?.retry_count ?? '-'}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'session',
      label: '会话超时',
      extra: editBtn('session'),
      children: (
        <Descriptions column={1}>
          <Descriptions.Item label="超时时间(秒)">{sess?.timeout ?? '-'}</Descriptions.Item>
        </Descriptions>
      ),
    },
  ]

  const renderModalForm = () => {
    if (!currentType) return null
    const formMap: Record<SettingType, React.JSX.Element> = {
      running_mode: (
        <Form.Item name="mode" label="运行模式" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      ),
      time: (
        <>
          <Form.Item name="time" label="时间" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="timezone" label="时区">
            <Input />
          </Form.Item>
        </>
      ),
      dns: (
        <>
          <Form.Item name="primary_dns" label="主 DNS" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="secondary_dns" label="备 DNS">
            <Input />
          </Form.Item>
        </>
      ),
      syslog: (
        <>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="server" label="服务器" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="port" label="端口" rules={[{ required: true }]}>
            <InputNumber min={1} max={65535} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="protocol" label="协议" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'UDP', value: 'udp' },
                { label: 'TCP', value: 'tcp' },
              ]}
            />
          </Form.Item>
        </>
      ),
      mail: (
        <>
          <Form.Item name="smtp_server" label="SMTP 服务器" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="smtp_port" label="端口" rules={[{ required: true }]}>
            <InputNumber min={1} max={65535} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="username" label="用户名">
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码">
            <Input.Password />
          </Form.Item>
          <Form.Item name="from_address" label="发件人" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="use_tls" label="使用 TLS" valuePropName="checked">
            <Switch />
          </Form.Item>
        </>
      ),
      snmp: (
        <>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="community" label="团体名">
            <Input />
          </Form.Item>
          <Form.Item name="version" label="版本">
            <Input />
          </Form.Item>
        </>
      ),
      jvm: (
        <>
          <Form.Item name="heap_size" label="堆大小">
            <Input placeholder="例如: 2g" />
          </Form.Item>
          <Form.Item name="gc_type" label="GC 类型">
            <Input placeholder="例如: G1GC" />
          </Form.Item>
        </>
      ),
      failover: (
        <>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="timeout" label="超时(秒)">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="retry_count" label="重试次数">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </>
      ),
      session: (
        <Form.Item name="timeout" label="超时时间(秒)" rules={[{ required: true }]}>
          <InputNumber min={60} style={{ width: '100%' }} />
        </Form.Item>
      ),
    }
    return formMap[currentType]
  }

  return (
    <PageContainer title="系统设置">
      <Spin spinning={loading}>
        <Collapse items={collapseItems} />
      </Spin>
      <Modal
        title={`编辑${currentType ? titleMap[currentType] : ''}`}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {renderModalForm()}
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default SystemSettings
