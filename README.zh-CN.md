<h1 align="center">
  <img src="assets/icon.png" width="72" alt="DeepSeek Harness Desktop 标志" />
  <br />
  DeepSeek Harness Desktop
</h1>

<p align="center">
  面向 <a href="https://github.com/deepseek-ai/deepseek-harness">DeepSeek Harness</a>
  的轻量、本地优先、跨平台桌面封装。
</p>

<p align="center">
  <a href="https://deepseek-harness-desktop.vercel.app"><strong>官方网站</strong></a>
</p>

<p align="center">
  <a href="README.md">English</a> · <strong>简体中文</strong>
</p>

<p align="center">
  <a href="https://github.com/VanemKrAu/deepseek-harness-desktop/releases/latest"><img alt="最新版本" src="https://img.shields.io/github/v/release/VanemKrAu/deepseek-harness-desktop?style=flat-square&color=171513" /></a>
  <a href="LICENSE"><img alt="许可证：MIT" src="https://img.shields.io/badge/License-MIT-171513.svg?style=flat-square" /></a>
  <a href="https://github.com/VanemKrAu/deepseek-harness-desktop/actions/workflows/release.yml"><img alt="发行构建" src="https://github.com/VanemKrAu/deepseek-harness-desktop/actions/workflows/release.yml/badge.svg" /></a>
  <img alt="macOS" src="https://img.shields.io/badge/macOS-Apple%20Silicon%20%7C%20Intel-171513.svg?style=flat-square" />
  <img alt="Windows" src="https://img.shields.io/badge/Windows-x64-171513.svg?style=flat-square" />
  <img alt="Linux" src="https://img.shields.io/badge/Linux-x64-171513.svg?style=flat-square" />
</p>

<img width="2880" height="1882" alt="DeepSeek Harness Desktop 截图" src="https://github.com/user-attachments/assets/4252ec13-c09b-4e74-996f-cf4d1bcb74c8" />

> [!NOTE]
> **本仓库是定制 fork**，基于 [agent-earth/deepseek-harness-desktop](https://github.com/agent-earth/deepseek-harness-desktop)（原作者 Steven，MIT 许可与署名保留）。因原仓库 release 长期停留在 `0.1.1-rc.2`，本 fork 自行完成了上游 DSH 升级与打包修复。
>
> 本仓库发布的安装包由本仓库自己的 tag 触发流水线（`.github/workflows/release.yml`）构建，内置 DSH **`0.1.5-rc.2`**（本 fork 版本号 `0.3.9`）。上游 `agent-earth/…` 的安装包是 `0.3.8`、内置仍是 `0.1.1-rc.2` —— 要拿到下文列出的修复，请认准本仓库的 `0.3.9` 安装包。

## 本 fork 相对上游 `0.3.8`（上游当前 release）的改动

- **内置 DSH 从 `0.1.1-rc.2` 升级到 `0.1.5-rc.2`**（npm 的 `next` 通道；`latest` 仍是 `0.1.5-rc.1`）
- 依赖同步：`@deepseek-ai/cordis-plugin-group` → `1.0.2`、`dshmarket` → `1.45.1`
- `scripts/prepare-dependencies.mjs`：3 处硬失败改为容错跳过（上游变更不再中断安装）
  - `@deepseek-ai/dsh-host-apiproxy` 在 DSH 0.1.2+ 已停止发布 → 目标缺失时跳过该补丁
  - 精简版 Node（目录内无 LICENSE 文件）→ 只告警，仍复制 `dsh-node.exe`
  - dsh 清单 / 设置页市场图标补丁 → 增加 `existsSync` + `try/catch`
- `scripts/build-windows-launcher.ps1`：修复 `.NET Framework64` 下存在语言包目录（如 `1041` / `2052`）时 `[version]` 解析抛错、导致打包中断的问题
- `package.json`：新增 `build.npmRebuild: false`；放行 `node-pty` / `koffi` / `@deepseek-ai/dsh-subprocess-local` 等原生模块的安装脚本

### 构建须知（本 fork）

```powershell
npm install --force
# 必须 --force：dshmarket 的 peerDependencies 只声明到 DSH 0.1.2-alpha.2，与 0.1.5 冲突。
# 切勿使用 --legacy-peer-deps：它会跳过 peer 安装，导致 dsh-jobs / dsh-settings 等缺失、
# 整棵插件树加载失败（表现为 dsh web 起不来）。

npm run dist:win
# 产物：dist/DeepSeek-Harness-Desktop-<version>-windows-x64.exe（NSIS）与 .zip（便携）
```

`build.npmRebuild: false` 表示跳过 Electron ABI 重编。若本机缺少 Windows SDK，
需保证 `node_modules/node-pty/build/Release/*.node` 是为当前 Electron 版本编译的产物
（可从「同一 Electron 版本」的既有安装中复用）；若环境具备完整 Visual Studio + Windows SDK，
可将该项改为 `true` 交由 electron-builder 自行编译。

### 已知限制（本 fork）

- `@dsh-external/dsh-automation`（定时任务调度）在 DSH 0.1.5 下注册 RPC 时会访问 `owner.webServer`，
  因 0.1.5 收紧了权限（未 `inject` 即报 `cannot get property "webServer" without inject`）
  而导致**整棵插件树加载失败**。需在 profile 的 `cordis.patch.yml` 中将其 `disabled: true`；
  上游该插件（0.1.7）尚未适配。
- 打包产物未做代码签名，Windows SmartScreen 可能提示。

DeepSeek Harness Desktop 将官方 DeepSeek Harness Web 体验封装为独立桌面应用。无需手动启动 CLI 或管理端口，打开应用即可使用完整 Harness 界面。

本项目专注于桌面宿主能力，不 fork、不修改、不注入，也不重新实现 Harness UI。模型、会话、设置、插件和 Agent 能力均由官方 `@deepseek-ai/dsh` 提供。

> [!IMPORTANT]
> 本项目是非官方社区封装，目前仍属于早期版本，并依赖快速演进中的 `@deepseek-ai/dsh@0.1.5-rc.2`。macOS 构建尚未经过 Apple 公证，Windows 构建尚未进行商业代码签名。

## 下载

| 平台 | 架构 | 安装包 | 下载 |
| --- | --- | --- | --- |
| macOS | Apple Silicon | DMG | [下载 Apple Silicon 版本](https://github.com/VanemKrAu/deepseek-harness-desktop/releases/latest/download/DeepSeek-Harness-Desktop-latest-arm64.dmg) |
| macOS | Intel | DMG | [下载 Intel 版本](https://github.com/VanemKrAu/deepseek-harness-desktop/releases/latest/download/DeepSeek-Harness-Desktop-latest-x64.dmg) |
| Windows | x64 | 安装程序 | [下载 Windows 安装程序](https://github.com/VanemKrAu/deepseek-harness-desktop/releases/latest/download/DeepSeek-Harness-Desktop-latest-windows-x64.exe) |
| Windows | x64 | 便携 ZIP | [下载 Windows ZIP](https://github.com/VanemKrAu/deepseek-harness-desktop/releases/latest/download/DeepSeek-Harness-Desktop-latest-windows-x64.zip) |
| Linux | x64 | AppImage | [下载 AppImage](https://github.com/VanemKrAu/deepseek-harness-desktop/releases/latest/download/DeepSeek-Harness-Desktop-latest-linux-x86_64.AppImage) |
| Debian / Ubuntu | x64 | deb | [下载 deb](https://github.com/VanemKrAu/deepseek-harness-desktop/releases/latest/download/DeepSeek-Harness-Desktop-latest-linux-amd64.deb) |

全部当前和历史安装包可在 [GitHub Releases](https://github.com/VanemKrAu/deepseek-harness-desktop/releases) 查看；另有社区夸克网盘镜像：[夸克网盘镜像](https://pan.quark.cn/s/e2dfc232c52d)（镜像内容可能落后于最新 release）。

## 为什么需要桌面版

DeepSeek Harness 已经提供完整的 Agent Runtime 和 Web UI。本项目不重复实现这些能力，而是补充桌面应用所需的宿主层：

- 自动启动和关闭本地 Harness 服务
- 自动分配随机 `127.0.0.1` 回环端口
- 等待 Harness 就绪后再显示应用窗口
- 提供单实例桌面窗口和外部链接安全处理
- 为渲染进程启用沙箱、`contextIsolation` 和导航限制
- 为 macOS、Windows 和 Linux 提供可直接安装的发行包

## 主要特性

- Harness 就绪后直接进入官方界面，无额外操作步骤
- 启动 Harness 服务时显示轻量等待界面，不再出现无响应感
- 内置“设置 → Plugin Market”，由 [dsh-market](https://github.com/dsh-market/dsh-market) 与经过整理的 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 目录提供
- 随应用提供 pnpm，可直接安装、更新和卸载目录中的插件，无需另行配置 Node.js 工具链
- 支持系统托盘驻留，关闭主窗口后可继续在后台运行
- 可通过托盘菜单在系统浏览器中打开当前本地 Harness 地址
- 保留完整的设置、模型、会话、插件和 Agent 能力
- 应用退出时自动终止 Harness 子进程
- Web 服务仅监听随机本地回环端口，不暴露到局域网
- macOS 支持 Apple Silicon 和 Intel
- macOS 标题栏会与 DSH 当前浅色或深色主题自然融合
- Windows 支持 x64 安装程序与便携 ZIP
- Linux 支持 x64 AppImage 和 deb
- Windows 使用官方应用内目录浏览器，避免打包环境下的原生文件夹对话框异常
- Windows 预留可拖动标题栏，避免原生窗口按钮遮挡 Harness 内容
- Windows 隐藏 Electron 默认的 File、Edit、View 和 Window 菜单栏

## 插件市场

打开“**设置 → Plugin Market**”即可浏览和搜索社区插件，查看插件来源，并执行安装、更新、停用或卸载。插件目录实时读取自 [awesome-dsh-plugin.com](https://awesome-dsh-plugin.com)，插件变更仍通过官方 `dsh plugin --profile web` 流程完成，并保存在本机 DSH profile 中。

桌面安装包内置 `dshmarket@1.45.1` 和兼容的 pnpm 运行时（`pnpm@10.34.5`）。由于应用生命周期由桌面宿主管理，市场内的一键进程重启已关闭；当插件提示需要重启时，请刷新页面或重新启动 DeepSeek Harness Desktop。

### SSH 与远程运维

如需 SSH 能力，可在“**设置 → Plugin Market**”中搜索并安装 [`dsh-ssh-ops`](https://github.com/caoyiwei850/dsh-ssh-ops)。它支持 SSH 终端、SFTP、端口转发、批量命令和数据库连接，并已验证可在本项目当前内置的 DSH 版本中正常加载。

由于 SSH 插件会处理远程凭据，并可在其他机器上执行命令，本项目不会默认安装或启用它。请先检查插件源码与权限，仅在需要时安装，并在安装完成后重启 DeepSeek Harness Desktop。

> [!WARNING]
> 目录中的插件是社区维护的第三方代码，不代表 DeepSeek 或本项目的背书。插件安装后会以当前用户权限在本机运行，并可能访问 Harness 可访问的数据。安装前请检查源码、发布者、权限和构建脚本提示。

## 安装说明

### macOS

macOS 构建已进行完整性签名，但尚未经过 Apple 公证。首次启动：

1. 打开 DMG，将 **DeepSeek Harness** 拖入“应用程序”。
2. 尝试打开应用；如果 macOS 阻止启动，请点击“完成”。
3. 打开“系统设置 → 隐私与安全性”。
4. 在“安全性”区域找到 DeepSeek Harness，点击“仍要打开”。
5. 再次点击“打开”确认。

该确认通常只需完成一次。

### Windows

Windows 安装包尚未进行商业代码签名。如果 Microsoft Defender SmartScreen 出现提示：

1. 点击“更多信息”。
2. 点击“仍要运行”。
3. 按安装向导完成安装。

### Linux

- AppImage：执行 `chmod +x DeepSeek-Harness-Desktop-*.AppImage` 后直接运行。
- Debian / Ubuntu：使用系统软件安装器打开 deb，或运行 `sudo apt install ./DeepSeek-Harness-Desktop-*.deb`。

## 安全模型

- Harness 服务仅绑定 `127.0.0.1`，每次启动使用随机端口
- Renderer 禁用 Node.js 集成
- 启用 `contextIsolation` 和 Chromium sandbox
- 新窗口和跨域导航交由系统浏览器处理
- Harness 在独立的 Electron Node 子进程中运行
- Cordis HMR 所需的 `--expose-internals` 只授予 Harness 子进程，不暴露给 Renderer
- 插件市场的写操作要求同源请求，安装来源限制为经过整理的目录
- 第三方插件安装后仍会以当前用户权限执行

## 运行架构

```text
DeepSeek Harness Desktop
├── Electron Main
│   ├── 单实例窗口
│   ├── Harness 子进程生命周期
│   ├── 随机回环端口与就绪检测
│   └── 平台菜单和外部链接处理
│
├── Harness Child Process
│   └── @deepseek-ai/dsh web
│       └── http://127.0.0.1:<random-port>
│
└── Sandboxed BrowserWindow
    └── DeepSeek Harness Web UI
```

## 当前验证状态

| 平台 | 构建 | 打包后启动 | Web UI |
| --- | --- | --- | --- |
| macOS Apple Silicon | DMG / ZIP 通过 | 通过 | HTTP 200 |
| macOS Intel | DMG / ZIP 通过 | 通过 | HTTP 200 |
| Windows x64 | NSIS / ZIP 通过 | 通过 | HTTP 200 |
| Linux x64 | AppImage / deb 通过 | 通过 | HTTP 200 |

以上结果来自本仓库由版本 tag 触发的 `.github/workflows/release.yml` 流水线 —— 它会在匹配平台的 GitHub-hosted runner 上构建每个安装包，并在发布前执行打包后 smoke test。Windows 的 NSIS/ZIP 构建（`npm run dist:win`）另外已在本机完成构建与验证。fork 的构建同样没有 Apple 公证与商业代码签名。

## 已知限制

- 上游 DSH 仍是 RC 版本，接口和行为可能快速变化
- macOS 尚未接入 Developer ID 和 notarization
- Windows 尚未接入商业代码签名，首次启动可能出现 SmartScreen
- 尚未提供 Windows ARM64 和 Linux ARM64 构建
- 尚未集成自动更新
- 本 fork 版本号（`0.3.9`）已领先上游（`0.3.8`）；更早的 fork 构建与上游同为 `0.3.8`，如果你手上有旧文件，请按内置 DSH 版本判断（`0.1.5-rc.2` = 本 fork，`0.1.1-rc.2` = 上游）

## 上游版本与许可

当前固定使用 `@deepseek-ai/dsh@0.1.5-rc.2`，以保证打包结果可复现。

桌面封装采用 [MIT License](LICENSE)。内置的 DeepSeek Harness、dsh-market 与 pnpm 同样采用 MIT License，其许可声明保存在 [`third-party-licenses`](third-party-licenses)。

本项目与 DeepSeek 不存在隶属或官方合作关系。DeepSeek Harness 及相关名称的权利归其各自所有者所有。应用图标使用上游 DeepSeek Harness Web favicon 中的黑色鲸鱼图案。
