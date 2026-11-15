---
name: kinetic-ppt-studio
description: 开源双引擎物理动效演示文稿工坊（Native OpenXML .pptx + HTML5/GSAP Bespoke Engine）。内置「七绝」物理开场（斜刀劈裂、立体帷幔对开、千纸鹤左出掀卷、狂风卷条斜剥、柔光碎纸/乱拳破屏、云散金粉/点触水墨焚纸、揉团抛飞）、动态交互文字排版（游标金线切字、三速视差、反向轰散退场）、电影级平滑推镜（Morph）以及皮影木棍平托双燕入局抽棍定格。支持一键生成原生可编辑 PowerPoint (.pptx) 或单文件离线便携网页 (.html) 与 16:9 静态归档 PDF。
metadata:
  author: "宁维 (Neve)"
  version: "3.0.0"
  license: "MIT"
---

# Kinetic PPT Studio（动效演示文稿双引擎开源工坊 v3.0）

> 自有代码与文档由宁维 (Neve) 按 [MIT License](./LICENSE) 发布。内置 GSAP 遵循 [GSAP Standard “No Charge” License](https://gsap.com/standard-license/)。

本仓库提供一套**双引擎物理动效演示文稿技能体系**，彻底告别呆板套壳模板与外挂视频框。无论你需要**在 PowerPoint / WPS 中原生可编辑放映的 `.pptx`**，还是**带逐像素噪波滤镜与 Canvas 粒子动力学的单文件 `.html` 交互网页**，均可按需调用对应子技能或双剑合璧。

---

## 1. 双引擎路由指南（AI Agent 必读）

收到用户的演示文稿 / 幻灯片 / 录屏动效需求时，按交付载体选择对应子引擎：

| 用户场景与目标产物 | 调用子技能路径 | 核心技术栈与优势 |
|---|---|---|
| **需要原生 `.pptx` 文件**（可在 PowerPoint 2019+/365 与 WPS 演示直接打开、改字、放映、发抖音） | [`./skills/pptx-kinetic-transitions/SKILL.md`](./skills/pptx-kinetic-transitions/SKILL.md) | **零外部依赖 Node.js 原生 OpenXML 引擎**：`1:1` 实景纹理切片 (`<a:srcRect>`) + 8 大开场 Rig + 动态文字交互排版 + `Morph` 平滑推镜 + 持棍送燕垂直抽棍 |
| **需要浏览器全屏交互 / 翻页笔讲课 / 逐像素噪波特效**（双击即播的单文件 `.html` + 归档 `.pdf`） | [`./skills/ink-kinetic-ppt/SKILL.md`](./skills/ink-kinetic-ppt/SKILL.md) | **GSAP 3 + SVG 分形遮罩/位移滤镜 + Canvas 硬件合批引擎**：支持像素级火焚 (`fire`)、曲面揉纸 (`crumple`)、无图极简 Keynote 讲义模式与离线单文件打包 |

---

## 2. 仓库目录结构

```text
kinetic-ppt-studio/
├── SKILL.md                                  # 总入口技能定义（双引擎智能路由）
├── README.md                                 # 开源项目主页说明与视觉画廊
├── GITHUB_PUBLISH_GUIDE.md                   # 零命令行 GitHub 网页/客户端发布教程
├── LICENSE                                   # MIT 开源协议 — Copyright (c) 2026 宁维 (Neve)
├── skills/
│   ├── pptx-kinetic-transitions/             # 引擎一：原生 PowerPoint (.pptx) 物理动效与换肤引擎
│   │   ├── SKILL.md
│   │   └── lib/
│   │       ├── ooxml-kinetic-core.mjs        # OpenXML 物理时序、几何切片、Morph 与去重打包核心
│   │       └── themes.mjs                    # 6 套可插拔主题预设（含 daiqing-ink-gold 护眼柔光）
│   └── ink-kinetic-ppt/                      # 引擎二：HTML5 + GSAP + SVG/Canvas 七绝物理引擎
│       ├── SKILL.md
│       ├── README.md
│       ├── presets/themes.css
│       ├── scripts/
│       │   ├── bundle-standalone.mjs         # 单文件离线便携 .html 打包器
│       │   ├── deck-file.mjs                # 解析稿件目录内的资源
│       │   └── export-pdf.mjs                # 16:9 高清静态 .pdf 导出器
│       └── starter/                          # 8 页开箱即用 HTML 骨架与离线 GSAP 3.15
├── examples/
│   ├── daiqing-morph-typography/             # 旗舰样板：黛青13页「七绝开场 × 动态文字 × 五镜推镜 × 破晓长卷」
│   │   ├── build-daiqing-morph-typography.mjs
│   │   ├── daiqing-morph-typography-showcase.pptx
│   │   ├── daiqing-morph-typography-showcase.pdf
│   │   └── media/                            # 21 组高清山水、宣纸与孤立水墨图层
│   └── ink-html-showcase/                    # HTML 样板：双击即播的单文件离线七绝演示网页
│       └── ink-kinetic-showcase.html
└── docs/
    └── previews/                             # 10 张精选高光帧预览图
```

---

## 3. 快速验证与构建命令

只需安装 **Node.js 18+**（**零 npm 第三方依赖**即可直接生成原生 `.pptx` 与单文件 `.html`）：

```bash
# 1. 一键重新编译 13 页黛青终极母版 .pptx（零外部依赖）
node examples/daiqing-morph-typography/build-daiqing-morph-typography.mjs

# 2. 一键将 HTML 动效工程打包为双击离线可播的单文件 .html（零外部依赖）
node skills/ink-kinetic-ppt/scripts/bundle-standalone.mjs --src skills/ink-kinetic-ppt/starter --out examples/ink-html-showcase/ink-kinetic-showcase.html
```

网页 PDF 导出需要 Playwright 和 Chromium，详见 [PDF 导出](./skills/ink-kinetic-ppt/README.md#pdf-导出)。

详细 API 参数、坐标换算铁律与避坑规范请查阅对应子技能的 `SKILL.md`。
