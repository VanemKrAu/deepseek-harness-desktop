export const WINDOWS_TITLEBAR_HEIGHT = 40

export const WINDOWS_TITLEBAR_CSS = `
  html {
    background-color: Canvas;
  }

  /* 自绘标题栏的文字。DSH 页面本身不往这块 40px 区域画任何内容，
     窗口最顶部会是一条空白；这里补一行居中的应用名。
     用 html::before（html::after 已被下方的拖动热区占用），
     pointer-events: none 保证不拦截任何点击。 */
  html::before {
    content: "DeepSeek Harness";
    position: fixed;
    z-index: 2147483646;
    top: 0;
    left: 0;
    width: 100vw;
    height: ${WINDOWS_TITLEBAR_HEIGHT}px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0.2px;
    color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.82));
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
  }

  html::after {
    content: "";
    position: fixed;
    z-index: 2147483647;
    top: 0;
    left: env(titlebar-area-x, 0px);
    width: env(titlebar-area-width, 100%);
    height: env(titlebar-area-height, ${WINDOWS_TITLEBAR_HEIGHT}px);
    -webkit-app-region: drag;
    app-region: drag;
  }

  body {
    box-sizing: border-box !important;
    height: 100vh !important;
    padding-top: ${WINDOWS_TITLEBAR_HEIGHT}px !important;
    background-color: var(--dsw-alias-bg-base, Canvas) !important;
    overflow: hidden !important;
  }
`

export async function applyWindowsTitleBarStyle(webContents) {
  await webContents.insertCSS(WINDOWS_TITLEBAR_CSS)
}
