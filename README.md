# 🎓 四级3500词背诵小程序

一个功能完整的四级词汇学习应用，采用 React + Express 全栈架构，支持熟词可斩、词根衍生、近反义词、例句、易错易混词汇辨析、考频观测等强大功能。

## ✨ 核心功能

### 1. 📚 背诵卡模式
- **完整词汇卡片**：每个单词展示词根衍生、释义、近反义词、例句
- **熟词可斩**：标记已掌握词汇，自动移出复习队列
- **智能提示**：根据考频等级生成个性化学习建议
- **语音朗读**：集成 Web Speech API 播放单词发音
- **顺序/随机模式**：支持顺序学习和随机抽词

### 2. ⚠️ 易错易混板块
- **分组辨析**：按主题分组展示易混淆词汇
- **详细对比**：每个词汇提供释义、例句、辨析要点
- **搜索功能**：快速查找特定词汇组

### 3. 📊 考频观测中心
- **考频分布图表**：柱状图 + 饼图展示词汇考频分布
- **个人进度追踪**：实时显示学习进度和掌握情况
- **学习策略建议**：基于考频数据提供学习优先级建议

## 🛠️ 技术栈

### 后端
- **Node.js** + **Express** - RESTful API 服务
- **SQLite** (内存存储) - 用户学习数据持久化
- **UUID** - 用户标识生成

### 前端
- **React 18** - UI 框架
- **Tailwind CSS** - 样式框架
- **Framer Motion** - 动画效果
- **Recharts** - 数据可视化图表
- **Lucide React** - 图标库
- **Axios** - HTTP 客户端

## 📁 项目结构

```
cet4-vocabulary-app/
├── server.js                 # Express 服务端入口
├── package.json              # 后端依赖配置
├── data/
│   ├── vocabulary.js         # 四级词汇数据（50词示例）
│   └── confusableGroups.js   # 易错易混词汇组
├── client/                   # React 前端应用
│   ├── package.json          # 前端依赖配置
│   ├── tailwind.config.js    # Tailwind 配置
│   ├── public/
│   └── src/
│       ├── App.js            # 主应用组件
│       ├── index.js          # 入口文件
│       ├── index.css         # 全局样式
│       ├── utils/
│       │   ├── api.js        # API 封装
│       │   └── helpers.js    # 工具函数
│       └── components/
│           ├── Header.jsx           # 顶部导航
│           ├── WordCard.jsx         # 单词卡片
│           ├── ConfusableCard.jsx   # 易混词汇卡片
│           ├── FrequencyChart.jsx   # 考频图表
│           ├── StudyMode.jsx        # 背诵模式
│           ├── ConfusableMode.jsx   # 易错易混模式
│           └── StatsMode.jsx        # 统计模式
└── README.md
```

## 🚀 快速开始

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装步骤

1. **克隆项目**
```bash
cd cet4-vocabulary-app
```

2. **安装后端依赖**
```bash
npm install
```

3. **安装前端依赖**
```bash
cd client
npm install
cd ..
```

4. **启动开发服务器**

方式一：同时启动前后端（推荐）
```bash
npm run dev
```

方式二：分别启动
```bash
# 终端 1：启动后端
npm run server

# 终端 2：启动前端
cd client
npm start
```

5. **访问应用**
- 前端: http://localhost:3000
- 后端 API: http://localhost:3001

### 生产部署

1. **构建前端**
```bash
cd client
npm run build
cd ..
```

2. **启动生产服务器**
```bash
NODE_ENV=production npm start
```

## 📡 API 接口文档

### 用户相关
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/user/create` | 创建新用户 |

### 词汇相关
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/words` | 获取所有词汇 |
| GET | `/api/words/search?q=keyword` | 搜索词汇 |
| GET | `/api/words/high-frequency` | 获取高频词汇 |

### 学习相关
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/study/queue?shuffle=true` | 获取学习队列 |
| POST | `/api/study/master` | 标记熟词 |
| POST | `/api/study/unmaster` | 取消熟词标记 |
| GET | `/api/study/mastered` | 获取已掌握词汇 |
| POST | `/api/study/reset` | 重置学习进度 |

### 易错易混
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/confusable` | 获取所有易混组 |
| GET | `/api/confusable/:id` | 获取特定易混组 |

### 统计相关
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats/frequency-distribution` | 考频分布统计 |
| GET | `/api/stats/user` | 用户学习统计 |

## 📝 词汇数据结构

```javascript
{
  id: 1,                              // 唯一标识
  word: "abandon",                    // 单词
  phonetic: "/əˈbændən/",               // 音标
  definition: "v. 放弃，抛弃",         // 释义
  rootDerivatives: "【词根】band=ban...", // 词根衍生
  synonyms: ["desert", "forsake"],    // 近义词
  antonyms: ["retain", "keep"],       // 反义词
  example: "He abandoned his car...", // 例句
  frequency: 5,                       // 考频等级 1-5
  category: "高频核心"                 // 分类
}
```

## 🎯 考频等级说明

| 等级 | 名称 | 颜色 | 说明 |
|------|------|------|------|
| 5 | 极高频 | 🔴 红色 | 必背单词，历年高频出现 |
| 4 | 高频 | 🟠 橙色 | 重点记忆，常考词汇 |
| 3 | 中频 | 🟡 黄色 | 需要掌握，中等频率 |
| 2 | 低频 | 🟢 绿色 | 了解即可，偶尔出现 |
| 1 | 极低频 | ⚪ 灰色 | 可选记忆，极少出现 |

## 🔧 自定义扩展

### 添加更多词汇
编辑 `data/vocabulary.js`，按照现有格式添加新词汇：

```javascript
{
  id: 51,
  word: "your-word",
  phonetic: "/phonetic/",
  definition: "释义",
  rootDerivatives: "词根衍生说明",
  synonyms: ["synonym1", "synonym2"],
  antonyms: ["antonym1", "antonym2"],
  example: "例句",
  frequency: 4,
  category: "分类"
}
```

### 添加易错易混组
编辑 `data/confusableGroups.js`，添加新的辨析组：

```javascript
{
  id: 11,
  title: "新词汇组标题",
  description: "描述",
  words: [
    { word: "word1", definition: "...", example: "...", note: "..." },
    { word: "word2", definition: "...", example: "...", note: "..." }
  ],
  distinction: "辨析总结"
}
```

## 📱 移动端适配

应用采用响应式设计，完美适配手机、平板、桌面设备：
- 移动端优先的卡片布局
- 触摸友好的按钮尺寸
- 安全区域适配（刘海屏、底部导航栏）
- 可添加到主屏幕作为 PWA 使用

## 🤝 贡献指南

欢迎提交 Issue 和 PR：
1. Fork 本仓库
2. 创建特性分支 `git checkout -b feature/AmazingFeature`
3. 提交更改 `git commit -m 'Add some AmazingFeature'`
4. 推送分支 `git push origin feature/AmazingFeature`
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- 词汇数据参考：大学英语四级考试大纲
- 词根词缀参考：常见英语词根词缀词典
- UI 设计灵感：现代简约风格

---

Made with ❤️ for CET4 Students
