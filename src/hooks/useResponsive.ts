import { Grid } from 'antd'

const { useBreakpoint } = Grid

export interface ResponsiveState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  modalWidth: number | string
  drawerWidth: number | string
  formLayout: 'horizontal' | 'vertical'
  labelCol: { span: number } | undefined
  wrapperCol: { span: number } | undefined
  tableScroll: { x: number | string }
}

export function useResponsive(): ResponsiveState {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const isTablet = !!screens.md && !screens.lg
  const isDesktop = !!screens.lg

  return {
    isMobile,
    isTablet,
    isDesktop,
    modalWidth: isMobile ? '100%' : isTablet ? '90vw' : 720,
    drawerWidth: isMobile ? '100%' : isTablet ? '70vw' : 520,
    formLayout: isMobile ? 'vertical' : 'horizontal',
    labelCol: isMobile ? undefined : { span: 6 },
    wrapperCol: isMobile ? undefined : { span: 18 },
    tableScroll: { x: 'max-content' },
  }
}
