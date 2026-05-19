# CloudASG WAF Logo 设计说明

## 设计理念

为 CloudASG WAF 管理平台设计的 logo 系列,核心设计元素包括:

### 1. 盾牌形状
- **象征意义**: 代表防护、安全、保护
- **视觉效果**: 立即传达"防火墙"的核心功能
- **识别度**: 盾牌是安全领域最直观的视觉符号

### 2. 防护网格
- **象征意义**: 代表 WAF 的过滤和检测能力
- **技术关联**: 暗示流量检测、规则匹配、多层防护
- **视觉层次**: 半透明网格增加设计深度

### 3. 流量波形
- **象征意义**: 代表实时流量监控和分析
- **动态效果**: 动画波形展示系统的活跃状态
- **技术感**: 体现现代化的监控能力

### 4. 对勾标识
- **象征意义**: 防护成功、安全验证通过
- **用户体验**: 给用户信心和安全感
- **视觉焦点**: 白色对勾在蓝色盾牌上形成强烈对比

### 5. 配色方案
- **主色**: Ant Design 蓝 (#1890ff) - 专业、可信赖
- **渐变**: 深蓝 (#096dd9) - 增加视觉深度
- **强调色**: 绿色 (#52c41a) - 代表"防护中"、"安全"状态
- **边框**: 深蓝 (#0050b3) - 增强轮廓清晰度

## Logo 文件说明

### 1. logo.svg (主 Logo - 200x200)
**用途**: 
- 登录页面
- 关于页面
- 品牌展示
- 大尺寸显示场景

**特点**:
- 完整的设计元素
- 动态流量波形动画
- 防护网格背景
- 适合独立展示

### 2. logo-horizontal.svg (横版 Logo - 400x120)
**用途**:
- 导航栏 header
- 页面顶部
- 邮件签名
- 横向布局场景

**特点**:
- 图标 + 文字组合
- "CloudASG WAF 管理平台"完整标识
- 实时状态指示器("防护中")
- 适合窄高度空间

### 3. logo-simple.svg (简化版 - 200x200)
**用途**:
- 中等尺寸显示
- 移动端
- 简化场景
- 快速识别

**特点**:
- 盾牌 + WAF 字母
- 去除复杂细节
- 保留核心识别元素
- 适合快速加载

### 4. logo-icon.svg (图标版 - 64x64)
**用途**:
- Favicon
- 浏览器标签页
- 桌面图标
- 极小尺寸显示

**特点**:
- 最简化设计
- 盾牌 + W 字母
- 高度抽象
- 保证小尺寸可识别

## 使用建议

### 在 React 组件中使用

```tsx
// 导入 SVG 作为 React 组件
import Logo from '@/assets/logo.svg?react';
import LogoHorizontal from '@/assets/logo-horizontal.svg?react';
import LogoSimple from '@/assets/logo-simple.svg?react';
import LogoIcon from '@/assets/logo-icon.svg?react';

// 使用示例
function Header() {
  return (
    <div className="header">
      <LogoHorizontal style={{ height: 40 }} />
    </div>
  );
}

function LoginPage() {
  return (
    <div className="login">
      <Logo style={{ width: 200, height: 200 }} />
      <h1>CloudASG WAF 管理平台</h1>
    </div>
  );
}
```

### 作为图片引入

```tsx
import logoUrl from '@/assets/logo.svg';

function Component() {
  return <img src={logoUrl} alt="CloudASG WAF" />;
}
```

### 在 HTML 中使用

```html
<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/src/assets/logo-icon.svg" />

<!-- 导航栏 -->
<img src="/src/assets/logo-horizontal.svg" alt="CloudASG WAF" height="40" />

<!-- 登录页 -->
<img src="/src/assets/logo.svg" alt="CloudASG WAF" width="200" />
```

## 尺寸建议

| 场景 | 推荐 Logo | 推荐尺寸 |
|------|-----------|----------|
| 导航栏 | logo-horizontal.svg | 高度 32-48px |
| 登录页 | logo.svg | 150-250px |
| 移动端导航 | logo-simple.svg | 40-60px |
| Favicon | logo-icon.svg | 32x32, 64x64 |
| 关于页面 | logo.svg | 200-300px |
| 邮件签名 | logo-horizontal.svg | 高度 60-80px |

## 动画效果

主 Logo (logo.svg) 包含以下动画:
- **流量波形**: 2秒循环,模拟实时流量监控
- **检测点**: 随波形上下移动,展示动态检测

横版 Logo (logo-horizontal.svg) 包含:
- **状态指示器**: 2秒呼吸灯效果,显示"防护中"状态

## 可访问性

所有 logo 文件都包含:
- 清晰的轮廓和对比度
- 适合深色和浅色背景
- 支持缩放不失真
- 语义化的 SVG 结构

## 品牌一致性

使用 logo 时请注意:
- 保持足够的留白空间(至少 logo 高度的 20%)
- 不要拉伸变形
- 不要改变配色方案
- 不要添加额外的装饰元素
- 保持 logo 的完整性

## 技术规格

- **格式**: SVG (矢量图形)
- **颜色空间**: RGB
- **主色值**: #1890ff (Ant Design 蓝)
- **文件大小**: < 5KB (所有文件)
- **浏览器兼容**: 所有现代浏览器

## 下一步建议

1. **生成 PNG 版本**: 为不支持 SVG 的场景准备 PNG 备用
2. **创建深色模式版本**: 为深色主题优化配色
3. **制作加载动画**: 基于 logo 设计加载指示器
4. **品牌指南**: 完善完整的品牌视觉规范
