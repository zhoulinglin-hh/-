# 四级词汇背诵应用 - 部署指南

## 方案一：Render（推荐，免费）

### 步骤 1：准备代码
1. 将整个 `cet4-vocabulary-app` 文件夹压缩为 zip 文件
2. 确保包含以下文件：
   - `server.js`
   - `package.json`
   - `data/` 文件夹
   - `client/build/` 文件夹（已构建的前端）
   - `render.yaml`

### 步骤 2：注册 Render 账号
1. 访问 https://render.com
2. 使用 GitHub 账号登录

### 步骤 3：创建 Web Service
1. 在 Render Dashboard 点击 "New +"
2. 选择 "Web Service"
3. 选择部署方式：
   - 方式 A：连接 GitHub 仓库（推荐）
     - 授权 Render 访问您的 GitHub
     - 选择包含此项目的仓库
   - 方式 B：手动上传
     - 选择 "Upload your code"
     - 上传 zip 文件

### 步骤 4：配置服务
1. **Name**: `cet4-vocabulary-app`
2. **Runtime**: `Node`
3. **Build Command**: 
   ```bash
   npm install && cd client && npm install && npm run build
   ```
4. **Start Command**:
   ```bash
   NODE_ENV=production node server.js
   ```
5. **Plan**: 选择 "Free"

### 步骤 5：环境变量
添加以下环境变量：
- `NODE_ENV`: `production`
- `PORT`: `10000` (Render 会自动分配，此变量可选)

### 步骤 6：部署
点击 "Create Web Service"，Render 会自动构建和部署。

部署完成后，您会获得一个永久公网 URL，例如：
`https://cet4-vocabulary-app.onrender.com`

---

## 方案二：Railway（免费，更简单）

### 步骤 1：注册 Railway
1. 访问 https://railway.app
2. 使用 GitHub 账号登录

### 步骤 2：创建项目
1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择您的仓库

### 步骤 3：配置
Railway 会自动识别 `package.json` 和 `render.yaml`，无需额外配置。

### 步骤 4：获取域名
部署完成后，Railway 会自动生成一个域名，您也可以绑定自定义域名。

---

## 方案三：Vercel + Render（分离部署）

### 前端部署到 Vercel
1. 将 `client` 文件夹单独推送到 GitHub
2. 在 Vercel 导入该项目
3. 自动部署，获得前端 URL

### 后端部署到 Render
1. 部署 Node.js 后端到 Render
2. 配置 CORS 允许 Vercel 域名访问

---

## 注意事项

1. **免费额度**：
   - Render Free: 每月 750 小时运行时间
   - Railway Free: 每月 $5 额度
   - Vercel Free: 无限静态托管

2. **数据持久化**：
   - 当前使用内存存储用户数据
   - 生产环境建议添加数据库（如 MongoDB Atlas 免费版）

3. **自定义域名**：
   - Render 和 Railway 都支持绑定自定义域名
   - 国内访问建议绑定已备案域名

---

## 快速部署脚本

如果您有 Git，可以使用以下命令：

```bash
# 初始化仓库
git init
git add .
git commit -m "Initial commit"

# 推送到 GitHub
git remote add origin https://github.com/您的用户名/cet4-vocabulary-app.git
git push -u origin main
```

然后在 Render 或 Railway 上连接 GitHub 仓库即可自动部署。
