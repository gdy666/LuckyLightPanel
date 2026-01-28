# LightPanel 后端 API 文档

> **声明**: 本文档由 AI 生成，请自行测试验证接口。

本文档描述 LightPanel 轻面板前端所使用的后端 API 接口，这些接口由 Lucky Web服务提供。

## 基础信息

- **基础路径**: `/backend/`
- **请求方法**: 所有接口均为 `GET` 请求
- **响应格式**: JSON

---

## 全局配置接口

### GET /backend/nav.json

获取导航面板的全局配置信息，包括标题、Logo、功能开关等。

#### 响应示例

```json
{
  "version": "1.0",
  "settings": {
    "title": "我的面板",
    "subtitle": "个人导航页",
    "logo": "iconlibs/simple-icons/lucky.svg",
    "favicon": "iconlibs/simple-icons/lucky.svg",
    "backgroundImages": []
  },
  "sitesEnabled": true,
  "dockerEnabled": true,
  "luckyServicesEnabled": true
}
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `version` | string | 配置版本号 |
| `settings` | object | 面板设置 |
| `settings.title` | string | 面板标题 |
| `settings.subtitle` | string | 面板副标题 |
| `settings.logo` | string | Logo 图片路径（支持图标库路径或 URL） |
| `settings.favicon` | string | 网站图标路径 |
| `settings.backgroundImages` | string[] | 背景图片列表 |
| `sitesEnabled` | boolean | 是否启用站点导航功能，默认 `true` |
| `dockerEnabled` | boolean | 是否启用 Docker 监控功能，默认 `true` |
| `luckyServicesEnabled` | boolean | 是否启用 Lucky 服务展示功能，默认 `true` |

---

## 站点导航接口

### GET /backend/sites.json

获取站点导航配置，包括站点分组和站点列表，同时返回客户端网络类型。

#### 响应示例

```json
{
  "groups": [
    {
      "key": "tools",
      "name": "常用工具",
      "icon": "Wrench",
      "order": 1,
      "collapsed": false
    }
  ],
  "sites": [
    {
      "key": "site1",
      "name": "示例站点",
      "description": "这是一个示例站点",
      "frontendUrls": ["https://example.com"],
      "backendUrls": ["http://192.168.1.100:8080"],
      "icon": "Globe",
      "iconUrl": "",
      "iconColor": "#3b82f6",
      "groupKey": "tools",
      "order": 1,
      "target": "_blank",
      "enable": true
    }
  ],
  "networkType": "internal",
  "clientIP": "192.168.1.50"
}
```

#### 分组字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | string | 分组唯一标识 |
| `name` | string | 分组显示名称 |
| `icon` | string | 分组图标名称（Lucide 图标名） |
| `order` | number | 排序序号，数字越小越靠前 |
| `collapsed` | boolean | 是否默认折叠 |

#### 站点字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | string | 站点唯一标识 |
| `name` | string | 站点显示名称 |
| `description` | string | 站点描述 |
| `frontendUrls` | string[] | 外网访问链接列表 |
| `backendUrls` | string[] | 内网访问链接列表 |
| `icon` | string | 图标名称（Lucide 图标名） |
| `iconUrl` | string | 自定义图标 URL（优先级高于 icon） |
| `iconColor` | string | 图标颜色（CSS 颜色值） |
| `groupKey` | string | 所属分组 key |
| `order` | number | 排序序号 |
| `target` | string | 链接打开方式：`_blank`（新窗口）、`_self`（当前窗口） |
| `enable` | boolean | 是否启用 |

#### 网络类型字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `networkType` | string | 客户端网络类型：`internal`（内网）或 `external`（外网） |
| `clientIP` | string | 客户端 IP 地址 |

> **注意**: 前端根据 `networkType` 自动选择使用 `frontendUrls`（外网）或 `backendUrls`（内网）作为站点链接。

---

## 网络类型接口

### GET /backend/api/network-type

单独获取客户端网络类型，用于前端动态刷新网络状态。

#### 响应示例

```json
{
  "networkType": "internal",
  "clientIP": "192.168.1.50"
}
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `networkType` | string | 网络类型：`internal`（内网）或 `external`（外网） |
| `clientIP` | string | 客户端 IP 地址 |

---

## Docker 容器接口

### GET /backend/docker.json

获取配置的 Docker 容器列表及其状态信息。

#### 响应示例

```json
{
  "ret": 0,
  "containers": [
    {
      "key": "container1",
      "containerName": "nginx",
      "displayName": "Nginx 服务器",
      "description": "Web 服务器",
      "iconUrl": "iconlibs/walkxcode/nginx.svg",
      "groupKey": "web",
      "order": 1,
      "showStatus": true,
      "state": "running",
      "status": "Up 2 hours"
    }
  ],
  "groups": [
    {
      "key": "web",
      "name": "Web 服务",
      "icon": "Globe",
      "order": 1,
      "collapsed": false
    }
  ]
}
```

#### 返回码说明

| ret | 说明 |
|-----|------|
| 0 | 成功 |
| 1 | Docker 模块不可用 |
| 2 | 获取容器列表失败 |

#### 容器字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | string | 容器配置唯一标识 |
| `containerName` | string | Docker 容器名称 |
| `displayName` | string | 显示名称 |
| `description` | string | 容器描述 |
| `iconUrl` | string | 图标 URL |
| `groupKey` | string | 所属分组 key |
| `order` | number | 排序序号 |
| `showStatus` | boolean | 是否显示状态信息 |
| `state` | string | 容器状态：`running`、`exited`、`paused`、`unknown` |
| `status` | string | 状态详情，如 "Up 2 hours"、"Exited (0) 3 days ago" |

---

### GET /backend/docker-stats.json

获取 Docker 容器实时统计信息，用于定时刷新显示 CPU、内存等数据。

#### 响应示例

```json
{
  "ret": 0,
  "stats": [
    {
      "key": "container1",
      "containerName": "nginx",
      "displayName": "Nginx 服务器",
      "state": "running",
      "status": "Up 2 hours",
      "cpuPercent": "2.50%",
      "memoryUsage": "128 MiB / 2 GiB",
      "memoryPercent": "6.25%",
      "networkRx": "1.2 GB",
      "networkTx": "500 MB",
      "networkRxSpeed": 102400,
      "networkTxSpeed": 51200,
      "diskReadSpeed": 10240,
      "diskWriteSpeed": 5120
    }
  ]
}
```

#### 统计字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | string | 容器配置唯一标识 |
| `containerName` | string | Docker 容器名称 |
| `displayName` | string | 显示名称 |
| `state` | string | 容器状态 |
| `status` | string | 状态详情 |
| `cpuPercent` | string | CPU 使用率 |
| `memoryUsage` | string | 内存使用量 |
| `memoryPercent` | string | 内存使用率 |
| `networkRx` | string | 网络下载总量 |
| `networkTx` | string | 网络上传总量 |
| `networkRxSpeed` | number | 网络下载速度（字节/秒） |
| `networkTxSpeed` | number | 网络上传速度（字节/秒） |
| `diskReadSpeed` | number | 磁盘读取速度（字节/秒） |
| `diskWriteSpeed` | number | 磁盘写入速度（字节/秒） |

---

## Lucky 服务接口

### GET /backend/luckyservices.json

获取配置的 Lucky 服务列表。

#### 响应示例

```json
{
  "ret": 0,
  "services": [
    {
      "key": "service1",
      "serviceType": "portforward",
      "ruleKey": "pf_rule_001",
      "subKey": "",
      "displayName": "端口转发服务",
      "description": "TCP 端口转发",
      "iconUrl": "iconlibs/simple-icons/network.svg",
      "groupKey": "network",
      "order": 1,
      "showStats": true,
      "frontendUrls": ["https://example.com:8080"]
    }
  ],
  "groups": [
    {
      "key": "network",
      "name": "网络服务",
      "icon": "Network",
      "order": 1,
      "collapsed": false
    }
  ]
}
```

#### 服务字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | string | 服务配置唯一标识 |
| `serviceType` | string | 服务类型（见下方说明） |
| `ruleKey` | string | 对应的 Lucky 规则 Key |
| `subKey` | string | 子规则 Key（仅 `webservice` 类型使用） |
| `displayName` | string | 显示名称 |
| `description` | string | 服务描述 |
| `iconUrl` | string | 图标 URL |
| `groupKey` | string | 所属分组 key |
| `order` | number | 排序序号 |
| `showStats` | boolean | 是否显示统计信息 |
| `frontendUrls` | string[] | 访问链接列表 |

#### 服务类型说明

| serviceType | 说明 |
|-------------|------|
| `portforward` | 端口转发规则 |
| `stun` | STUN 穿透规则 |
| `webservice` | Web服务子规则 |
| `webservice-main` | Web服务主规则 |
| `webservice-default` | Web服务默认规则 |

---

### GET /backend/luckyservices-stats.json

获取 Lucky 服务实时统计信息。

#### 响应示例

```json
{
  "ret": 0,
  "stats": [
    {
      "key": "service1",
      "serviceType": "portforward",
      "ruleKey": "pf_rule_001",
      "displayName": "端口转发服务",
      "trafficIn": 1073741824,
      "trafficOut": 536870912,
      "inSpeed": 102400,
      "outSpeed": 51200,
      "tcpCurrentConnections": 10,
      "udpCurrentConnections": 5,
      "publicAddr": "",
      "state": "running"
    }
  ]
}
```

#### 统计字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | string | 服务配置唯一标识 |
| `serviceType` | string | 服务类型 |
| `ruleKey` | string | 规则 Key |
| `displayName` | string | 显示名称 |
| `trafficIn` | number | 流入流量总量（字节） |
| `trafficOut` | number | 流出流量总量（字节） |
| `inSpeed` | number | 流入速度（字节/秒） |
| `outSpeed` | number | 流出速度（字节/秒） |
| `tcpCurrentConnections` | number | 当前 TCP 连接数 |
| `udpCurrentConnections` | number | 当前 UDP 连接数 |
| `publicAddr` | string | 公网地址（仅 STUN 类型有效） |
| `state` | string | 服务状态：`running`、`stopped`、`unknown` |

---

## 图标库接口

### GET /backend/iconlibs/{alias}/{path}

获取图标库中的图标文件。

#### 路径参数

| 参数 | 说明 |
|------|------|
| `alias` | 图标库别名 |
| `path` | 图标文件路径 |

#### 示例

```
GET /backend/iconlibs/simple-icons/docker.svg
GET /backend/iconlibs/walkxcode/nginx.svg
```

#### 响应

- 成功：返回图标文件内容，Content-Type 根据文件类型自动设置
- 404：图标不存在
- 403：请求的图标未在配置中使用（安全限制）

> **安全说明**: 只有在 nav.json、sites.json、docker.json、luckyservices.json 配置中引用的图标才能被访问，防止任意文件读取。

---

## 内网识别配置

nav.json 中可配置内网识别规则，用于判断客户端是内网还是外网访问。

### 配置示例

```json
{
  "internalNetworkConfig": {
    "enable": true,
    "sources": [
      {
        "key": "ddns1",
        "type": "ddns",
        "ddnsTaskKey": "task_001",
        "ddnsTaskName": "家庭宽带",
        "enable": true
      },
      {
        "key": "globalvar1",
        "type": "globalvar",
        "globalVarName": "myPublicIP",
        "enable": true
      }
    ],
    "ipv6PrefixLength": 64,
    "customCIDRs": ["192.168.0.0/16", "10.0.0.0/8"]
  }
}
```

### 内网识别配置字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `enable` | boolean | 是否启用自定义内网识别 |
| `sources` | array | 数据源列表 |
| `ipv6PrefixLength` | number | IPv6 前缀长度，默认 64 |
| `customCIDRs` | string[] | 自定义内网 CIDR 范围 |

### 数据源字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | string | 数据源唯一标识 |
| `type` | string | 类型：`ddns` 或 `globalvar` |
| `ddnsTaskKey` | string | DDNS 任务 Key（type 为 ddns 时） |
| `ddnsTaskName` | string | DDNS 任务名称（仅显示用） |
| `globalVarName` | string | 全局变量名（type 为 globalvar 时） |
| `enable` | boolean | 是否启用此数据源 |

### 内网判断逻辑

1. 检查是否在自定义 CIDR 范围内
2. 检查是否为回环地址 (localhost)
3. 检查客户端 IP 是否与 DDNS 任务获取的公网 IP 匹配
4. 对于 IPv6，检查前缀是否匹配（根据 `ipv6PrefixLength` 配置）
5. 如果未启用自定义内网识别，使用默认内网范围：`192.168.0.0/16`、`10.0.0.0/8`、`172.16.0.0/12`

---

## 链接变量替换

站点配置中的 `frontendUrls` 和 `backendUrls` 支持变量替换，变量格式为 `{变量名}`。

### 常用变量

| 变量名 | 说明 |
|--------|------|
| `{ipv4Addr}` | 当前 IPv4 地址 |
| `{ipv6Addr}` | 当前 IPv6 地址 |

> **注意**: 可用变量取决于 Lucky 全局变量配置，请参考 Lucky 文档了解更多变量。

### 示例

```json
{
  "frontendUrls": ["http://{ipv4Addr}:8080"],
  "backendUrls": ["http://192.168.1.100:8080"]
}
```

---

## 错误处理

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 403 | 禁止访问（文件被禁止或图标未授权） |
| 404 | 资源不存在 |
| 405 | 方法不允许（仅支持 GET） |
| 500 | 服务器内部错误 |
| 502 | 网关错误（HTTP 代理失败） |

---

## 缓存策略

| 资源类型 | Cache-Control |
|----------|---------------|
| 静态文件（本地/rclone/store） | `public, max-age=3600` (1小时) |
| 图标文件 | `public, max-age=86400` (24小时) |
| JSON API | 无缓存（每次请求获取最新数据） |

---

*本文档由 AI 生成，请自行测试验证接口。*
