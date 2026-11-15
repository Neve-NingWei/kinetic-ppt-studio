---
name: ink-kinetic-ppt
description: 开源级无模板物理动效 HTML 演示文稿引擎与设计技能（Bespoke Kinetic Presentation Engine）。内置 GSAP 3 + CustomEase + SplitText + DrawSVG、SVG 分形遮罩/位移滤镜与高帧率 Canvas 动力学，支持「七绝」交互转场：斜刀劈裂 (blade)、点触水墨焚纸 (fire)、乱拳破纸 (fists)、千纸鹤衔卷 (cranes)、黑金帷幔对开 (curtain)、狂风鼓浪吹飞 (wind)、捏皱纸团抛飞 (crumple)。支持 N 页动态扩展、6 套可插拔主题色板预设（含「苹果 Keynote 极简深板 keynote-slate」与「日系暖白讲义浅色 clean-lecture」，支持无配图极简纯字讲课模式与讲台翻页笔兼容）、单文件离线便携 HTML 打包与 16:9 静态归档 PDF 导出。
metadata:
  author: "宁维 (Neve)"
  version: "3.0.0"
  license: "MIT"
---

# Ink Kinetic PPT（开源可定制物理动效演示文稿引擎 v3.0）

彻底抛弃「顶栏标题 + 三栏等宽卡片」的传统套壳模板，以 **GSAP 3 + SVG 遮罩/位移滤镜 + 硬件合批 Canvas** 打造兼顾东方水墨大片感与极简讲台可读性的交互式网页演示文稿。

本技能为**开源通用架构**：既能创作带 full-bleed 水墨/视觉原画的震撼作品，也能**零配图直出 Apple Keynote 极简深板风或教室暖白浅色讲义风**；调用者可自由换肤、增减任意页数（`N >= 2`）、逐页声明退场转场，并一键打包「双击离线可播全套动效的单文件 HTML」与「16:9 静态高清 PDF」。

---

## 1. 七大物理转场清单（七绝）

在每页 `<section class="slide">` 上声明 `data-out-transition="..."` 即可绑定该页翻到下一页时触发的退场动效；转场 Canvas 与 SVG 边缘颜色会根据当前主题（深色水墨 / Keynote 深板 / 浅白讲义）自动切换对比配色：

| 转场代号 | 名称 | 快捷键 | 物理实现与主题自适应特征 |
|---|---|---|---|
| `blade` | **斜刀劈裂** | `B` | 斜角刀光横贯画幅 + 微震相机 + 双半片错位滑开 + 粒子溅射（浅底自动切钴蓝高对比刀芒） |
| `fire` | **点触焚纸** | `G` | 以点击像素为火源，五阶分形噪波遮罩 (`#ink-burn-mask`) 啃噬纸面 + 炭化焦边 + 余烬（亮底自动切换正常灼烧混合模式） |
| `fists` | **乱拳破纸** | `P` | Canvas 连环重拳轰击屏幕，撕开 `#ink-fists-mask` 锯齿裂孔透出下页 + 末拳震碎 12 片径向碎片 |
| `cranes` | **千纸鹤衔卷** | `C` | 52 只三维投影折纸飞鹤斜向振翅掠过，牵引羽化风掀遮罩 (`#ink-cranes-mask`) 带走旧页（深/浅底自动适配折纸轮廓与光影） |
| `curtain` | **帷幔对开** | `M` | 双侧零闪 GPU 合批垂坠幕布 + 立体褶皱叠层 + 顶部 Canvas 滑杆 16 枚环扣同步外拉收拢 |
| `wind` | **狂风吹飞** | `W` | `#wind-billow-filter` 鼓浪褶皱滤镜 + 扫掠光影 + Canvas 曲笔气流线，先起纸波再整页斜卷刮飞 |
| `crumple` | **揉团抛飞** | `R` | `#crumple-crease-filter` + 14 边不规则多边形急速向心捏皱缩团，无缝交棒给多面折痕纸团沿抛物线甩飞 |

---

## 2. 仓库与技能目录结构

```text
ink-kinetic-ppt/
├── SKILL.md                      # AI 智能体执行指南
├── README.md                     # 人类开发者开源使用与二开说明
├── presets/
│   └── themes.css                # 6 套主题变量预设 (4 套东方水墨 + keynote-slate + clean-lecture)
├── scripts/
│   ├── bundle-standalone.mjs     # 单文件离线便携 .html 打包器 (CSS/JS/本地图转 Base64 内联)
│   ├── deck-file.mjs            # 将本地资源限制在稿件目录内
│   └── export-pdf.mjs            # 16:9 静态高清归档 .pdf 导出器 (支持 --theme 指定导出主题)
└── starter/                      # 开箱即用的运行时骨架与 8 页参考示范
    ├── index.html
    ├── themes.css
    ├── styles.css                # 含暗/亮底 HUD 与卡片令牌 + Keynote 极简讲课可选布局类
    ├── engine.js                 # 七绝主题自适应引擎 + 翻页笔按键全兼容 (Arrow/Space/PageDown/Enter)
    ├── assets/                   # 示范原画（做极简无图讲课 PPT 时可删去 `<div class="slide-art">` 直接不用）
    └── vendor/gsap/              # 离线 GSAP 3.15 (Core / CustomEase / SplitText / DrawSVGPlugin)
```

---

## 3. 为任意新需求构建演示文稿的工作流（AI Agent 必读）

1. **按需复制 `starter/` 骨架**：
   - **完整图文风格**：复制整个 `starter/` 至目标输出目录；
   - **无配图极简 Keynote / 讲课风格**：复制 `starter/`（可删除 `assets/` 或保留不用），删除每页里的 `<div class="slide-art">` 与深重遮罩 `<div class="slide-veil">`，引擎会自动使用 `themes.css` 的 `--stage-bg` 舞台背景渐变且零报错运行，并自动关闭飘尘微粒以保证投影纯净。
2. **选用或定制 6 大内置主题（Style Parameterization）**：
   - 修改 `<html lang="zh-CN" data-theme="...">`、访问 `?theme=...` 或按 **`T`** 键实时切换：
     - `obsidian-gold`：玄墨鎏金（默认水墨旗舰）
     - `vermilion-palace`：故宫朱砂
     - `jade-mist`：千里青绿
     - `cyber-noir`：赛博暗刃
     - `keynote-slate`：**苹果 Keynote 极简深板风**（深炭海蓝渐变底 + 纯白黑体主字 + 天青亮色，无水墨颗粒与衬线装饰，适合讲台震撼投影）
     - `clean-lecture`：**日系暖白极简讲义风**（亮白纸感渐变底 + 深炭黑字 + 钴蓝点缀 + 亮底安全透明底栏与炭化烧边适配，适合开灯教室）
   - 如需自定义全新配色，复制 `presets/themes.css` 任一主题块并同步配色变量即可，文字对比度须保持 `>= 4.5:1`。
3. **动态定制页数与反模板版式（N Slides & Anti-Slop Layouts）**：
   - `engine.js` 自动读取 `#slides-root > .slide` 数量（无硬编码页数限制），数字键 `1`–`9` 与 `#deck-hud` `.hud-dots` 对应。
   - **已有 8 大水墨/图文错落版式**：`layout-cover`、`layout-horizon`、`layout-cascade`、`layout-split-right`、`layout-duet`、`layout-lab`、`layout-statement`、`layout-closing`。
   - **新增 2 大无配图极简 Keynote / 讲堂版式**：
     - `layout-keynote-hero`（`.keynote-badge` + 居中巨字 `.keynote-hero-title` + `.keynote-hero-sub`）
     - `layout-keynote-grid`（`.keynote-grid-header` + `.keynote-cards` / `.cols-2` 极简悬浮边框卡片 `.keynote-card`）
   - 严禁连续三页套同一种卡片格子；若需一趟跑完 7 个转场，推荐设为 **8 页**（第 1→8 页依次声明 `data-out-transition="blade|fire|fists|cranes|curtain|wind|crumple"`），也可设为 **7 页闭环**。
4. **讲台翻页笔与键位支持**：
   - `engine.js` 默认兼容教室翻页笔（`PageDown` / `PageUp` / `ArrowRight` / `ArrowLeft` / `Space` / 非按钮聚焦态 `Enter`），`H` 一键隐藏底栏纯净全屏，点击非按钮舞台区也可触发局部空间转场。
5. **浏览器真机核验**：
   - 启动本地 HTTP 服务后用无头 Chrome 检查 `1600×900` 桌面端与 `375px` 移动端（`Errors: []`、`scrollW === clientW`、`#deck-hud` 单行无换行）；
   - 如使用亮底 `clean-lecture` 或无图 `keynote-slate`，务必截图抽检文字对比度以及 `blade`/`fire`/`curtain`/`crumple` 转场边缘显色。
6. **双格式交付导出**：
   - **交互演示首选（便携单文件 `.html`）**：
     `node scripts/bundle-standalone.mjs --src <dir> --out <deck-portable.html>`
   - **静态阅读归档（16:9 `.pdf`，支持指定主题）**：
     `node scripts/export-pdf.mjs --src <dir> --out <deck.pdf> [--theme keynote-slate]`
     导出前按 [PDF 导出说明](./README.md#pdf-导出) 准备 Playwright 和 Chromium。
   - **务必如实告知用户**：标准 `.pdf` 文档无法运行网页级 Canvas/SVG/GSAP 物理特效，完整交互与录屏演示请使用单文件 `.html`。

---

## 4. 开源扩展与美学红线

- **性能硬约束**：双半片或幕布位移转场（`blade`、`curtain`）最多克隆 2 片主切片，禁止同时克隆十余份整页 `.slide` DOM 或对大面积移动层加 `filter: drop-shadow()`；所有入场标题须在 `t = 0` 通过 `primeSlideEntrance()` 预置隐藏态避免闪屏。
- **反模板铁律**：禁止蓝色/黄色圆形序号徽章、斜体中文标题、虚构商业指标（如无来源的 `99.9%`）与系统彩色 Emoji（图标一律用单色线框内联 SVG `.btn-glyph`）。
- **环境约束**：保留 `prefers-reduced-motion` 温和降级。PDF 导出在目标文件所在的目录创建本次运行专用的临时目录，退出时清理。打包或导出所需的本地资源应位于 `--src` 内。
- **运行库许可**：自有代码与文档采用 MIT。`starter/vendor/gsap/` 及 HTML 内嵌的 GSAP 运行库遵循 [GSAP Standard “No Charge” License](https://gsap.com/standard-license/)。
