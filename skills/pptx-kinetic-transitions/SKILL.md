---
name: pptx-kinetic-transitions
description: 原生 OpenXML（.pptx）高阶物理动效与多主题换肤引擎。无需外挂视频框、零外部依赖，即可在 PowerPoint 2019+/365 与最新版 WPS 演示中生成带真实实景纹理切片 (<a:blipFill> + <a:srcRect>) 的「黛青墨夜」「玄黑墨金·漆绝」等百变风格动态演示包：斜刀劈裂 (addDiagonalBladeOpeningRig)、立体帷幔对开 (addPleatedCurtainOpeningRig)、千纸鹤群飞带幕/掀卷 (addOrigamiCranesOpeningRig)、乱拳连击碎屏 (addShardPunchOpeningRig)、狂风卷条斜剥 (addWindRibbonsOpeningRig)、机械快门光圈 (addShutterIrisOpeningRig)、余烬散纸纹理近似 (addEmberDissolveOpeningRig)、两段式揉团抛飞 (addPaperCrumpleTossOpeningRig)、电影级平滑推镜 Morph (morphTransitionXml + !!name) 与同轴甩入抽棍定格。采用「物理引擎 × 主题色板 × 纹理插槽」三层开源解耦架构，传一行 theme 或自定义贴图即可跨画风复用。
metadata:
  author: "宁维 (Neve)"
  version: "3.0.0"
  license: "MIT"
---

# Native PPTX Kinetic Transitions（开源原生 `.pptx` 物理动效与三层换肤引擎 v3.0）

打破「PPT 只能纯色方块淡入淡出」或「靠贴视频假装动效」的局限：**纯原生 OpenXML 时间轴 + `1:1` 纹理切片 (`<a:srcRect>`) + 可插拔主题系统 (`lib/themes.mjs`)**。生成出的 `.pptx` 可在 **Microsoft PowerPoint (2019+/365)** 与 **WPS 演示** 中直接编辑文本与形状、自由删改版式，并支持 **60fps 硬件加速放映**。

---

## 1. 开源三层解耦架构（Engine × Theme × Texture Slot）

```text
  pptx-kinetic-transitions/
  ├── SKILL.md
  └── lib/
      ├── themes.mjs              ← 视觉皮肤层：6 套预设色板 + resolveTheme() 局部覆盖（含 softMode 护眼柔光开关）
      └── ooxml-kinetic-core.mjs  ← 物理引擎层：8 大开场 Rig（齐备漆绝全七式 + 光圈）、Morph、时间轴与媒体去重打包
```

别人拿到本 SKILL 后，**无需改动任何动效公式或 XML 时序**，只需替换 **Theme** 与 **Texture Slots** 就能直接输出全新视觉流派：

```js
import {
  IdGen, resolveTheme, addBackgroundArt,
  addShardPunchOpeningRig, wrapStepGroup, wrapMainTiming, packagePptx,
} from "./lib/ooxml-kinetic-core.mjs";

const theme = resolveTheme("obsidian-gold"); // 或传 { preset: "keynote-slate", accentHex: "F59E0B" }
const mediaPaths = [];
const useMedia = (p) => { let i = mediaPaths.indexOf(p); if (i === -1) { i = mediaPaths.length; mediaPaths.push(p); } return `rId${i + 2}`; };

// 1) 全屏山河/概念底图 + 负空间压暗渐变遮罩（无框融入背景）
addBackgroundArt({
  shapes, getSp,
  mediaRid: useMedia("bg-waves.jpg"),
  scrimStops: [{ pos: 0, hex: theme.bgHex, alpha: 86000 }, { pos: 100000, hex: theme.bgHex, alpha: 8000 }],
});

// 2) 一行注入主题与实景封面/冲击波贴图
const rigPars = addShardPunchOpeningRig({
  shapes, buildSpids, ids, getSp,
  theme,                                      // 配色/边框全由主题驱动
  coverMediaRid: useMedia("cover-ink.jpg"),   // 自动 calcSrcRect 1:1 切进 16 块碎片！
  splashMediaRid: useMedia("splash-gold.png"),
  splashAltMediaRid: useMedia("splash-ember.png"),
});

packagePptx({ outPath: "out.pptx", slides: [{ bgColor: theme.bgHex, shapesXml: shapes.join("\n"), timingXml, mediaPaths }] });
```

### 内置六大开源主题预设 (`lib/themes.mjs`)

| `theme` ID | 风格名 | 核心色调 (`bgHex` / `accentHex` / `secondaryHex`) | 典型搭档背景材质 |
|---|---|---|---|
| **`"daiqing-ink-gold"`** | **黛青墨夜 · 柔金微光（护眼首选）** | `#111C2D` / `#DFC07A` / `#6B98B3`（`softMode: true` 去火环白闪） | 深靛洒金宣纸、青绿山水、雾化金粉透明柔光贴图 |
| **`"obsidian-gold"`** | **玄黑墨金 · 漆绝（炽烈版）** | `#07090D` / `#E6C27A` / `#CFA042`（朱砂 `#C83228`） | 黑金泼墨山水、洒金宣纸、透明金朱墨环 |
| **`"xuan-splash"`** | **暖白宣纸 · 青墨山水** | `#FBF7EE` / `#C83228` / `#B8862D` | 暖白桑皮宣纸、水墨远山、孤立透明青墨插画 |
| **`"keynote-slate"`** | **苹果深空科技光学** | `#050814` / `#38BDF8` / `#6366F1` | 暗夜极光光场、玻璃态芯片与光学圆环 |
| **`"swiss-architect"`** | **极简瑞士建筑构成** | `#F4F5F7` / `#E11D48` / `#0F172A` | 建筑摄影、石膏浅灰网格与国际主义红标尺 |
| **`"street-neon"`** | **街头工业霓虹撞色** | `#09090B` / `#FACC15` / `#00F5D4` | 机甲线稿、霓虹荧光洋红/赛博青冲击环 |

---

## 2. 全量物理转场与开场接口速查

| 配方 / 接口 | 核心物理机制与纹理支持 |
|---|---|
| **乱拳/柔光碎纸碎屏 (`addShardPunchOpeningRig`)** | 将整张封面 (`coverMediaRid` 或主题渐变) 按共顶点扰动网格无隙剖分为 **16 枚碎块** (`calcSrcRect` 1:1 精准裁切)，依三拍节奏散开；支持 `softMode: true` 自动关闭高闪白块，转为温润薄雾涟漪 (`soft-gold-mist.png`) |
| **斜刀劈裂开场 (`addDiagonalBladeOpeningRig`)** | 一对互补 `custGeom` 斜切封面（支持 `coverMediaRid` 整图一刀两断）+ `rotDeg` 对角闪光刃横扫 + 6 颗碎光粒子向两侧爆裂 |
| **立体丝绒帷幔对开 (`addPleatedCurtainOpeningRig`)** | 左右各 4 条四段明暗褶皱渐变幕布 + 顶部滑杆与 10 枚挂环，退场带 `scaleToX: 46` 模拟真实布料挤皱抽拢 |
| **千纸鹤群飞带幕/掀卷 (`addOrigamiCranesOpeningRig`)** | 14 只四面立体折纸鹤沿无断点 `C` 阶贝塞尔曲线斜飞掠屏；`seamlessMode`（`softMode` 主题自动开启）下保留单张无缝整幅画卷 (`rig_crane_veil_full`) 随头鹤领飞自左向右柔和 wipe 退幕（`transition="out"` 配 `wipe(left)` 顺流由左向右揭开底画），彻底消除竖条栅栏与菱形印章；传 `seamlessMode: false` 可切换 4 幅拼接长卷模式 |
| **狂风卷条斜剥 (`addWindRibbonsOpeningRig`)** | 7 条 `-22°` 防漏缝搭接斜切风带（支持 `coverMediaRid` 肌理与细金边）伴 9 道气流速线吹飞退隐 |
| **机械快门光圈开合 (`addShutterIrisOpeningRig`)** | 中心 f-stop 光学镜盖先行旋缩，8 片弧形叶片（支持 `coverMediaRid` 材质）依 `animRot` 旋转 `+38°` 外扩消隐 |
| **云散金粉/余烬近似 (`addEmberDissolveOpeningRig`)** | 4 块纹理宣纸扇面外退消隐 + 双层柔和微光云雾（或炽焰火环）扩张 + 16 粒飘浮金粉/余烬微尘（`daiqing-ink-gold` 主题下自动柔化去刺眼火环） |
| **揉团抛飞开场 (`addPaperCrumpleTossOpeningRig`)** | 两段式连续物理近似：完整封面画布先向画面中心 `(800, 450)` 急速拧缩聚拢，再无缝交接给共外接框 14 面多边形棱角揉皱纸团收紧并沿右上方抛物线旋转 (`+335°`) 飞出银幕，留 6 粒微尘轻散 |
| **电影感平滑推镜 (`morphTransitionXml`)** | 输出 `<p159:morph option="byObject"/>` 与 `<p:fade/>` 双重兼容；相邻两页无全屏遮罩时，命名带相同 `!!name` 前缀的图形/徽章自动飞跃缩放对齐 |
| **激光擦除与同轴甩入** | `buildEntrEffectPar` 配 `wipeDir: "right"`；`buildExitEffectPar` 设 `visibility="hidden"`；两张同尺寸透明图跑相同 `animMotion` 后单独退隐木棍即可实现皮影定格 |

> **诚实技术边界说明**：
> HTML/SVG 引擎里的「点触焚纸 `fire`」与「揉皱抛纸 `crumple`」底层依赖实时逐像素 Perlin 噪声/连续曲面网格变形；纯原生 PowerPoint OpenXML 不支持逐像素噪声着色器与实时网格揉曲。本技能以 `addEmberDissolveOpeningRig`（柔光散雾/余烬近似）与 `addPaperCrumpleTossOpeningRig`（整页向心收缩交接 14 面棱角折纸团抛飞近似）实现全原生齐备「漆绝七式」；若追求 100% 像素溶解烧灼与连续柔性揉纸网格，请改用 `ink-kinetic-ppt`（HTML 引擎）录制视频或浏览器演示。

---

## 3. 跨画风参考样板（均已通过 OOXML 结构与视觉核验）

1. **黛青暮蓝 · 会动的文字排版 × 五镜推镜 × 破晓收官全栈展示版（v3.0 抖音/讲台终极母版）**：
   - 构建脚本：`examples/daiqing-morph-typography/build-daiqing-morph-typography.mjs`
   - 成品演示：`examples/daiqing-morph-typography/daiqing-morph-typography-showcase.pptx`（`7.25 MB` / `7,600,524` 字节，`13` 页 · `21` 组原生高清媒体资源：统一采用「黛青墨夜 · 柔金微光」渲染 **1–11 页**七绝物理开场 + **游标金线切字与左甩退场** + **三速视差与上下反向轰散** + **2×2 对称竹林与寒江指标聚升** + **横排三卡腾空直转垂直瀑布流时间轴（`Morph #1–#3`）**，最终通过 **11→12→13 页**两段破晓 `Morph #4–#5` 迈入暖白宣青绿《泼墨长卷》并重现江水滑入、孤舟平推与持木棍平托双燕平滑入局、落定后垂直抽棍收官；配套归档 `examples/daiqing-morph-typography/daiqing-morph-typography-showcase.pdf` `7,419,544` 字节）
2. **其他扩展画风配置参考**：
   - **玄黑墨金 · 漆绝全七幕展示风**：调用 `resolveTheme("obsidian-gold")` 搭配实景宣纸金箔切块与透明金朱墨环
   - **苹果 Keynote 深空科技发布会风**：调用 `resolveTheme("keynote-slate")` 搭配斜刀劈裂与平滑推镜
   - **现代瑞士建筑构成与街头霓虹撞色风**：调用 `resolveTheme("swiss-architect")` / `resolveTheme("street-neon")`
   - **暖白宣纸 · 青墨山水风**：调用 `resolveTheme("xuan-splash")` 搭配画外元素分层滑入与木棍送燕定格

---

## 4. 核心工程规范与避坑红线

- **全局图片去重与 `rId` 绑定规则**：
  每页构造独立 `mediaPaths` 数组，`rId` 从 `rId2` 顺延（`rId1` 固定留给 `slideLayout1.xml`）；传入 `packagePptx(...)` 后，底层会自动把跨页复用的贴图（如玄宣底纹、冲击环）在 `ppt/media/` 中全局合并去重为单份存储，不增加多余体积。
- **像素与字号换算铁律（`1600×900` 坐标系，`EMU = 7620`）**：
  逻辑宽 `1600px` 对应幻灯片 `13.333in`（`960pt`），因此 **`1 pt = 1.667 px`**。主副标题及印章徽章（如「言简意丰 · 泼墨成章」需给够 `w: 278` 以上宽度）须预留充足行宽避免单字掉行；多栏参数推荐拆分独立 `textBoxXml` 列。
- **反边框与负空间法则**：
  实景全屏底画须配合不对称方向渐变蒙版（`addBackgroundArt` + `scrimStops`），文案置于暗调或大留白区，**严禁给孤立山水或透明元素套生硬大黑框**。
- **`<p:animEffect transition="out">` 擦除方向反转规律（WPS / PowerPoint 实测）**：
  SMIL 的 `transition="out"` 会反转 `wipe(...)` 方向：**`filter="wipe(left)"` 实测为由左向右渐隐掀开**（与左起飞鹤同步）；若写成 `wipe(right)` 则会从右向左反向抹除。
- **`<p:timing>` 与 `<p:bldLst>` 铁律**：
  - 自动入场组首节点固定使用 `nodeType="afterEffect"`（整组 `condDelay="0"`），并发节点用 `withEffect`；点击分步揭示组使用独立 `wrapStepGroup(...)` 生成 `delay="indefinite"`；
  - 所有需延迟进入或隐身待命的对象 `spid` 须放入 `buildSpids`（进入 `<p:bldLst>`）；初始就覆盖屏幕准备退场的开场遮罩**切勿**放进 `buildSpids`，确保幻灯片切换第 `0ms` 瞬间即可 100% 封住舞台。
- **反持续抖动**：所有 `<p:animMotion>` 路径必须设置 `fill="hold"` 并以准确落点收尾（如入场收敛至 `0 0 E`），落地后完全静止。
