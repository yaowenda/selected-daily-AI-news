# AI 博客每日精选

从 [Andrej Karpathy 推荐的 90 个顶级技术博客](https://github.com/vigorX777/ai-daily-digest) 抓取最新文章，经 AI 评分与摘要，生成每日精选日报并部署为静态网站。

## 结构

- **ai-daily-digest/** — 日报生成脚本（Bun + TypeScript），复用 [ai-daily-digest](https://github.com/vigorX777/ai-daily-digest) 并增加 JSON 输出
- **site/** — 前端静态站（Vite + Vue 3），展示日报列表与内容
- **.github/workflows/** — 定时生成日报上传 OSS、push 时部署站点

## 部署

1. 将本仓库 push 到 GitHub，配置好 [GitHub Secrets](需要你提供.md) 与阿里云 OSS
2. **Push 到 main** → 自动构建并部署前端到 OSS
3. **每日北京时间 23:00** → 自动生成当日日报并上传

详见 [开发说明.md](开发说明.md)、[需要你提供.md](需要你提供.md)。
