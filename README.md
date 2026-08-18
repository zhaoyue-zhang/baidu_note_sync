# 网盘笔记 (Baidu Notes Web)

百度网盘笔记的 Web / PWA / Android 客户端。基于 React + Vite + TypeScript,使用
Capacitor 打包成 Android App,Web 端可作为 PWA 安装。

## 技术栈

- **React 19** + **TypeScript 5** + **Vite 6**
- **Capacitor 7** — 移动端壳
- **Milkdown** / **Editormd** — 双编辑器(可在组件层切换)
- **pnpm** — 包管理
- 状态:本地 React state + `services/` 下的工具函数(api / format / session / settings)

## 开发

```bash
# 安装依赖
pnpm install

# 启动 dev server(默认 0.0.0.0:5173,局域网内可访问)
pnpm dev

# 类型检查
pnpm typecheck
```

## 构建

```bash
# Web / PWA 构建,产物在 dist/
pnpm build

# 本地预览构建产物
pnpm preview
```

## 移动端(Capacitor / Android)

```bash
# 添加 Android 平台(首次)
npx cap add android

# 把 dist/ 同步到 android/
npx cap sync android

# 用 Android Studio 打开 android/ 工程,或:
npx cap run android
```

## 目录结构

```
src/
├── components/        # 顶层组件:TopBar、NoteList、TableOfContents、EditormdEditor、MilkdownEditor
├── pages/App.tsx      # 单页主入口,Router 视图模式(list / editor)
├── services/          # api / format / session / settings(无后端依赖层)
├── styles/app.css
└── types/notes.ts     # Note / Group 等核心类型
```

## 配置

- `capacitor.config.ts` — appId = `com.local.baidunotes`,appName = `网盘笔记`,webDir = `dist`
- `vite.config.ts` — 端口 5173,React plugin
- `pnpm-workspace.yaml` — `storeDir` 指向本机固定路径(见下方"已知问题")

## 已知问题 / 待修

- **`pnpm-workspace.yaml` 里的 `storeDir` 写死了** `notion/.pnpm-store/v10`,这个目录
  已不存在。在新机器上 clone 后第一次 `pnpm install` 会自动回退到默认 store
  (`~/.local/share/pnpm/store`),但如果想恢复原配置,把这一行删掉即可。
- `.gitignore` 排除了 `node_modules/`、`.pnpm-store/`、`dist/`、`.env`(包含 secrets)
- jQuery 是遗留依赖,新代码优先用 React + 现代 DOM API

## License

Private / 内部项目,未授权开源。
