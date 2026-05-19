import type { ThemeConfig } from 'antd'

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#0066ff',
    colorInfo: '#0066ff',
    colorSuccess: '#00c853',
    colorWarning: '#ff9800',
    colorError: '#f44336',
    colorLink: '#0066ff',

    colorBgBase: '#f0f2f5',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f0f2f5',

    colorText: '#1a1a2e',
    colorTextSecondary: '#555770',
    colorTextTertiary: '#8c8ca1',
    colorTextQuaternary: '#b5b5c3',

    colorBorder: '#d9dce6',
    colorBorderSecondary: '#e8eaf0',

    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    fontSize: 14,
    fontSizeHeading1: 32,
    fontSizeHeading2: 26,
    fontSizeHeading3: 22,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,

    boxShadow: '0 2px 8px rgba(0, 102, 255, 0.08)',
    boxShadowSecondary: '0 4px 16px rgba(0, 102, 255, 0.12)',

    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },

  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#001529',
      bodyBg: '#f0f2f5',
      headerHeight: 56,
      headerPadding: '0 24px',
    },

    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17',
      darkItemSelectedBg: 'rgba(0, 102, 255, 0.4)',
      darkItemHoverBg: 'rgba(0, 102, 255, 0.2)',
      darkItemColor: 'rgba(255, 255, 255, 0.65)',
      darkItemSelectedColor: '#ffffff',
      darkItemHoverColor: '#ffffff',
      itemHeight: 44,
      iconSize: 16,
      collapsedIconSize: 18,
    },

    Card: {
      borderRadiusLG: 10,
      boxShadowTertiary: '0 1px 4px rgba(0, 21, 41, 0.08)',
      paddingLG: 20,
    },

    Table: {
      headerBg: '#fafbfc',
      headerColor: '#1a1a2e',
      headerSortActiveBg: '#f0f2f5',
      rowHoverBg: 'rgba(0, 102, 255, 0.04)',
      borderColor: '#e8eaf0',
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
    },

    Statistic: {
      contentFontSize: 28,
      titleFontSize: 13,
    },

    Button: {
      primaryShadow: '0 2px 6px rgba(0, 102, 255, 0.25)',
      fontWeight: 500,
    },

    Input: {
      activeBorderColor: '#0066ff',
      hoverBorderColor: '#4d94ff',
    },

    Tag: {
      borderRadiusSM: 4,
    },

    Progress: {
      defaultColor: '#0066ff',
    },

    Descriptions: {
      labelBg: '#fafbfc',
    },

    Modal: {
      borderRadiusLG: 12,
    },
  },
}

export const severityColors = {
  critical: '#f44336',
  high: '#ff6b35',
  medium: '#ff9800',
  low: '#ffc107',
  info: '#0066ff',
} as const

export const statusColors = {
  active: '#00c853',
  inactive: '#ff9800',
  error: '#f44336',
  idle: '#ff5252',
} as const

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#4d94ff',
    colorInfo: '#4d94ff',
    colorSuccess: '#00e676',
    colorWarning: '#ffb74d',
    colorError: '#ff5252',
    colorLink: '#4d94ff',

    colorBgBase: '#141414',
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#262626',
    colorBgLayout: '#0a0a0a',

    colorText: 'rgba(255, 255, 255, 0.85)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
    colorTextQuaternary: 'rgba(255, 255, 255, 0.25)',

    colorBorder: '#434343',
    colorBorderSecondary: '#303030',

    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    fontSize: 14,
    fontSizeHeading1: 32,
    fontSizeHeading2: 26,
    fontSizeHeading3: 22,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,

    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.45)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.65)',

    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },

  components: {
    Layout: {
      headerBg: '#1f1f1f',
      siderBg: '#001529',
      bodyBg: '#0a0a0a',
      headerHeight: 56,
      headerPadding: '0 24px',
    },

    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17',
      darkItemSelectedBg: 'rgba(77, 148, 255, 0.4)',
      darkItemHoverBg: 'rgba(77, 148, 255, 0.2)',
      darkItemColor: 'rgba(255, 255, 255, 0.65)',
      darkItemSelectedColor: '#ffffff',
      darkItemHoverColor: '#ffffff',
      itemHeight: 44,
      iconSize: 16,
      collapsedIconSize: 18,
    },

    Card: {
      borderRadiusLG: 10,
      boxShadowTertiary: '0 1px 4px rgba(0, 0, 0, 0.45)',
      paddingLG: 20,
    },

    Table: {
      headerBg: '#262626',
      headerColor: 'rgba(255, 255, 255, 0.85)',
      headerSortActiveBg: '#1f1f1f',
      rowHoverBg: 'rgba(77, 148, 255, 0.08)',
      borderColor: '#434343',
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
    },

    Statistic: {
      contentFontSize: 28,
      titleFontSize: 13,
    },

    Button: {
      primaryShadow: '0 2px 6px rgba(77, 148, 255, 0.35)',
      fontWeight: 500,
    },

    Input: {
      activeBorderColor: '#4d94ff',
      hoverBorderColor: '#6ba3ff',
    },

    Tag: {
      borderRadiusSM: 4,
    },

    Progress: {
      defaultColor: '#4d94ff',
    },

    Descriptions: {
      labelBg: '#262626',
    },

    Modal: {
      borderRadiusLG: 12,
    },
  },
}

export const defaultTheme = lightTheme
