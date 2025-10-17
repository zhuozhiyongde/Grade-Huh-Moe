# Grade Huh Moe Frontend

面向北京大学医学部同学的成绩查询与课程信息展示前端界面。

## ✨ 功能亮点

-   支持医学部账号登录与学籍信息展示，方便同学集中查看成绩与必修课程要求。
-   结合学分统计、课程状态提示等模块，帮助快速识别未完成项。
-   响应式界面适配桌面与移动端，满足不同使用场景。

## 🧠 成绩获取方式

-   本部成绩通过 IAAA 接口获取。
-   医学部成绩数据由开源后端项目提供，代码见 [Grade Huh Moe Backend](https://github.com/zhuozhiyongde/Grade-Huh-Moe-Backend)。
-   所有敏感字段均在后端完成鉴权与脱敏，前端仅负责渲染与交互。

## 🛠️ 技术栈

-   Next.js 15 (App Router) + React 19 负责页面渲染与路由。
-   Tailwind CSS 4 提供原子化样式与主题定制。
-   Bun 用于包管理与开发/构建脚本执行。

## 🚀 本地开发

-   `bun install` 安装依赖。
-   `bun run dev` 启动开发服务器，你需要修改 `BACKEND_BASE_URL` 为你的后端地址。

## 📜 许可

本前端项目以 GPL-3.0 协议发布。
