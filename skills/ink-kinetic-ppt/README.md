# Ink Kinetic PPT — 七绝物理动效 HTML 演示引擎（开源版 v2.1.0）

> 彻底丢掉千篇一律的固定 PPT 模板壳，用 **GSAP 3 + SVG 动态遮罩/滤镜 + Canvas 物理引擎** 做出可触控、兼容讲台翻页笔、可一键打包离线分享的电影级演示文稿。

---

## 核心特性

- **七套物理级交互转场（「七绝」）**：
  1. `blade`（`B`）：**斜刀劈裂** — 斜向刀锋斩落、页面微震、双半片断口金/蓝边滑开
  2. `fire`（`G`）：**点触焚纸** — 以点击处为火源蔓延五阶分形焦痕与余烬（深/浅纸底均真实炭化燃烧）
  3. `fists`（`P`）：**乱拳破纸** — 连环重拳冲穿撕纸裂洞，末拳轰碎 12 片飞散碎片
  4. `cranes`（`C`）：**千纸鹤衔卷** — 52 只折纸飞鹤振翅斜掠带走旧画切入新章
  5. `curtain`（`M`）：**帷幔对开** — 顶部环扣滑杆联动双翼褶皱丝滑扯开
  6. `wind`（`W`）：**狂风吹飞** — 纸面被气流吹出鼓浪褶皱，随气流线斜卷飞出画面
  7. `crumple`（`R`）：**揉团抛飞** — 正中急速捏成多面折痕纸团并沿抛物线甩飞出屏
- **6 套一键切换主题 (`T` 键 / `?theme=...`)**：
  - 东方画卷组：`obsidian-gold`（玄墨鎏金 · 默认） / `vermilion-palace`（故宫朱砂） / `jade-mist`（千里青绿） / `cyber-noir`（赛博暗刃）
  - 极简讲课组：`keynote-slate`（**苹果 Keynote 极简深板风** · 无水墨装饰，纯深灰蓝大字投影风） / `clean-lecture`（**日系暖白极简讲义风** · 开灯教室高亮可读，自动关闭飘尘并重配色全部 7 套物理转场）
- **无配图讲台极简模式**：无需图片资产时直接省略 `<div class="slide-art">`，配合 `layout-keynote-hero` 与 `layout-keynote-grid` 即可零图纯排版做出干净现代的讲课幻灯片。
- **翻页快捷键与双格式导出**：支持 `PageDown`、`PageUp`、`Enter`、`Space` 和方向键。使用 Node.js 打包离线 HTML，或用 Chromium 导出 16:9 静态 PDF。

---

## 快速上手

### 1. 复制骨架新建自己的 PPT

将 `starter/` 目录完整复制为你的项目目录，直接修改 `<html lang="zh-CN" data-theme="keynote-slate">`（或 `obsidian-gold` / `clean-lecture` 等）：

```html
<html lang="zh-CN" data-theme="keynote-slate">
```

每一页只需写一个 `<section class="slide" data-out-transition="blade">` 指定它翻到下一页时触发的特效；不需要插画时可直接不写 `.slide-art`：

```html
<section class="slide" data-slide-index="0" data-out-transition="blade">
  <div class="slide-content layout-keynote-hero">
    <span class="keynote-badge">LECTURE · MODULE 01</span>
    <h1 class="keynote-hero-title anim-split">用极简大字配合物理动效讲课</h1>
    <p class="keynote-hero-sub anim-rise">教室全屏打开，翻页笔即可触发 7 套交互转场。</p>
  </div>
</section>
```

### 2. 讲台演示与录屏快捷键

- **翻页（适配翻页笔）**：`→` / `←`、`PageDown` / `PageUp`、`Space`、`Enter`、数字键 `1`–`9`，或直接点击空白舞台（在**「火焚」**与**「乱拳」**模式下会以**鼠标点击像素**作为火源/拳击起点）
- **锁定单种转场**：`B` 刃劈 · `G` 火焚 · `P` 乱拳 · `C` 纸鹤 · `M` 帷幔 · `W` 狂风 · `R` 揉团
- **换肤预览**：按 **`T`** 在 6 套配色预设间实时切换（或 URL 追加 `?theme=keynote-slate` / `?theme=clean-lecture`）
- **录屏洁净模式**：按 **`H`** 隐藏/恢复底部控制条，按 **`F`** 进入全屏

### 3. 一键打包与导出 PDF

以下命令在本技能目录运行。使用 Node.js 18+ 打包 HTML。请将图片、CSS 和 JS 放在 `--src` 目录内，并使用指向其子路径的相对引用，例如 `assets/cover.jpg`。

```bash
node scripts/bundle-standalone.mjs --src ./starter --out ./dist/my-deck-portable.html
```

#### PDF 导出

PDF 命令需要 Playwright 和 Chromium。使用当前 Playwright 版本时，请使用 Node.js 22 或 24 LTS。以下 PowerShell 命令会将 npm 缓存、临时文件和 Chromium 下载到当前工作区。请从用于安装和导出的同一个终端运行。

```powershell
New-Item -ItemType Directory -Path .tmp -Force | Out-Null
$env:TEMP = Join-Path (Get-Location) '.tmp'
$env:TMP = $env:TEMP
$env:TMPDIR = $env:TEMP
$env:npm_config_cache = Join-Path $env:TEMP 'npm-cache'
$env:PLAYWRIGHT_BROWSERS_PATH = '0'
npm install --no-save --package-lock=false playwright
npx playwright install chromium --only-shell
node scripts/export-pdf.mjs --src ./starter --out ./dist/my-deck.pdf --theme keynote-slate
```

已有运行环境时，可用 `--playwright` 指定 Node.js 的 Playwright 模块入口，用 `--chrome` 指定已有的 Chromium、Chrome 或 Edge 可执行文件。相对路径以命令运行目录为基准。

> **重要格式说明**：标准 PDF 是静态页面规范，任何浏览器或 PDF 阅读器都无法在 `.pdf` 内运行网页级 Canvas/SVG/GSAP 物理特效。若要上台讲课或发给别人体验完整动效，请使用 **`bundle-standalone.mjs` 产出的单文件 `.html`**；`.pdf` 适合静态分发阅读与留档。

---

## 致谢与运行库说明

- 自有代码与文档采用 [MIT License](../../LICENSE)，版权署名为 `Copyright (c) 2026 宁维 (Neve)`。独立分发此子技能时，请随附仓库根目录的 `LICENSE`。
- `starter/vendor/gsap/` 及打包 HTML 内嵌的 GSAP 3.15.0、CustomEase、SplitText、DrawSVGPlugin 遵循 [GSAP Standard “No Charge” License](https://gsap.com/standard-license/)。发布时保留上游版权声明。
