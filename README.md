# LightPanel Vue

Lucky Web服务轻面板前端项目，基于 Vue 3 + Vite + TypeScript 构建的现代化导航面板。

## 项目简介

LuckyLightPanel 是 [Lucky](https://lucky666.cn) Web服务中的轻量级导航面板前端，提供美观、响应式的站点导航、Docker 容器监控、Lucky 服务状态展示等功能。

### 主要特性

- 🎨 **现代化UI** - 基于 Vue 3 + shadcn-vue 构建，支持亮色/暗色主题
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🔗 **站点导航** - 支持分组管理、内外网链接自动切换
- 🐳 **Docker 监控** - 实时显示容器状态、CPU、内存等信息
- 🚀 **Lucky 服务** - 展示端口转发、STUN穿透、Web服务等状态
- 🔍 **快速搜索** - 支持站点快速搜索定位
- ⚡ **高性能** - 静态资源优化，支持多种部署方式

## 技术栈

- **框架**: Vue 3.5+ (Composition API)
- **构建工具**: Vite 6
- **类型检查**: TypeScript 5.7
- **状态管理**: Pinia
- **UI组件**: radix-vue + lucide-vue-next
- **动画**: motion-v
- **工具库**: @vueuse/core

## 编译构建

### 环境要求

- Node.js >= 20.0.0
- pnpm (推荐) 或 npm

### 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 开发模式

```bash
pnpm dev
# 或
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`

### 生产构建

```bash
pnpm build
# 或
npm run build
```

构建产物输出到 `dist` 目录，可直接部署到静态文件服务器。

### 预览构建结果

```bash
pnpm preview
# 或
npm run preview
```

## 部署方式

### 在 Lucky Web服务中使用

LightPanel 设计用于 Lucky 的 Web服务子规则中，作为轻面板类型的前端静态源。

#### 方式一：HTTP 远程源（推荐）

1. 将构建后的 `dist` 目录内容部署到任意 HTTP 服务器
2. 在 Lucky Web服务子规则中设置：
   - **前端静态源类型**: `HTTP`
   - **路径**: 填写部署后的 URL，如 `https://your-domain.com/lightpanel/`

#### 方式二：本地文件源

1. 将构建后的 `dist` 目录复制到服务器本地
2. 在 Lucky Web服务子规则中设置：
   - **前端静态源类型**: `本地`
   - **路径**: 填写本地绝对路径，如 `/opt/lightpanel/`

#### 方式三：Rclone 远端源

1. 在 Lucky 中配置好 Rclone 远端
2. 将构建产物上传到 Rclone 远端
3. 在 Lucky Web服务子规则中设置：
   - **前端静态源类型**: `Rclone`
   - **远端 Key**: 选择配置好的 Rclone 远端
   - **根目录**: 填写远端中的目录路径

#### 方式四：存储管理源

1. 在 Lucky 存储管理中配置好存储
2. 将构建产物上传到存储
3. 在 Lucky Web服务子规则中设置：
   - **前端静态源类型**: `存储管理`
   - **存储 Key**: 选择配置好的存储
   - **根目录**: 填写存储中的目录路径

### 静态源高级配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| 默认首页文件 | 目录访问时默认返回的文件 | `index.htm,index.html` |
| 禁止访问的文件 | 禁止访问的文件列表，支持通配符 | 无 |

**禁止文件通配符示例**:
- `*.php` - 禁止所有 PHP 文件
- `.ht*` - 禁止所有 .ht 开头的文件
- `config.json` - 禁止特定文件

## 配置文件

轻面板的配置通过后端 API 获取，主要配置文件说明请参考 [API.md](./API.md)。

## 目录结构

```
lightpanel-vue/
├── dist/                    # 构建输出目录
├── public/
│   └── backend/             # 开发环境 Mock 数据
├── src/
│   ├── assets/styles/       # 全局样式
│   ├── components/          # Vue 组件
│   │   ├── common/          # 通用组件
│   │   ├── docker/          # Docker 相关组件
│   │   ├── layout/          # 布局组件
│   │   ├── luckyServices/   # Lucky 服务组件
│   │   ├── settings/        # 设置面板组件
│   │   └── sites/           # 站点导航组件
│   ├── stores/              # Pinia 状态管理
│   ├── types/               # TypeScript 类型定义
│   ├── App.vue              # 根组件
│   └── main.ts              # 应用入口
├── index.html               # HTML 模板
├── package.json             # 项目配置
├── tsconfig.json            # TypeScript 配置
└── vite.config.ts           # Vite 配置
```

## 开源协议

本项目基于 [MIT License](./LICENSE) 开源。

## 相关链接

- [Lucky 官网](https://lucky666.cn)
- [API 接口文档](./API.md)
