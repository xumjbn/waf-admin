# waf-admin

OpenWAF / NebulaWAF 管理控制台前端 —— React 18 + TypeScript 5 + Vite 5 + Ant Design 5。

是 OpenWAF 三件套中的 UI 层：

```
┌──────────────────┐  REST/JSON   ┌─────────────────┐  gRPC + REST 上报  ┌────────────────┐
│   waf-admin      │ ───────────▶ │   waf-control   │ ◀──────────────────│   waf-agent    │
│ （这个仓库）     │ ◀─────────── │ （Go 控制面）   │                    │ （节点 sidecar）│
└──────────────────┘              └─────────────────┘                    └────────────────┘
```

## 技术栈

- React 18 + TypeScript 5
- Vite 5（开发/打包）
- Ant Design 5 + @ant-design/pro-components
- Zustand 4（全局 store）
- React Router v6
- Axios（统一封装在 `src/api/`）
- ECharts 6（监控/大盘图表）
- i18next（中英文）
- MSW（开发态 mock）+ Vitest（单测）+ Playwright（E2E）

## 目录结构

```
src/
├── api/                 # 接口层
│   ├── auth.ts          # 登录/登出/续期
│   ├── identity.ts      # 用户/角色/项目（mock 适配 → 真后端）
│   └── live/            # 真后端 adapter（与 waf-control 直连）
│       ├── log.ts       # 攻击日志（封禁IP / 加白 / 关联事件）
│       ├── policy.ts    # 策略规则（命中计数 / 内置规则）
│       ├── alert.ts     # 告警渠道（邮件/微信/钉钉/PagerDuty/Webhook/SMS）
│       ├── report.ts    # 报表（统一列表 / 立即执行 / 下载）
│       ├── system.ts    # 系统设置 + 授权
│       ├── upgrade.ts   # 系统升级（check / apply）
│       ├── monitor.ts   # KPI 看板
│       ├── site.ts      # 站点
│       └── instance.ts  # 防护实例（集群）
├── components/          # 通用组件（AvatarMenu / CommandPalette / TweaksPanel ...）
├── hooks/               # usePermission / useThemeEffect
├── layouts/             # BasicLayout（侧边栏 + 顶栏 + 用户中心）
├── mocks/               # MSW handlers（dev 模式自动启用）
├── pages/               # 业务页面（site / instance / policy / log / monitor / report / system / acl / user）
├── store/               # Zustand stores（theme.ts ...）
└── types/               # 跨页面共享类型
```

## 快速开始

```bash
# 装依赖
npm install

# 起开发服务器（默认 http://localhost:5173，自带 MSW mock）
npm run dev

# 类型检查
npm run typecheck

# 单元测试 / E2E
npm test
npm run e2e

# 生产构建
npm run build
npm run preview
```

## 对接真后端

UI 默认走 MSW mock。要切到真 waf-control，在 `.env.local` 配 API base：

```
VITE_API_BASE=http://localhost:9200/api/v1
```

`src/api/live/*.ts` 里的每个适配器都把后端 JSON 翻译成 UI 期望的 MockXxx 形状，保持页面零改动地切真接口。

## 主要约定

- **接口层只在 `src/api/` 下面写**，页面只 import 函数；不要在页面里直写 axios。
- **adapter 模式**：`src/api/live/<module>.ts` 提供 `adapt()` 把后端字段映射成 UI 字段，新增字段时优先扩 adapter，不动 UI。
- **Tweaks/主题** 通过 `useThemeStore`（src/store/theme.ts），不要散在各页面。
- **MSW handlers** 在 `src/mocks/handlers.ts`，对照 `src/api/live/` 的端点结构维护。

## 仓库归属

`waf-admin` 是 OpenWAF monorepo（[xumjbn/OpenWAF](https://github.com/xumjbn/OpenWAF)）下的 git 子模块。
顶层提供 `make update / build / deploy` 一键脚本，详见根目录 `Makefile` 与 `make.ps1`。
