import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  IdGen,
  resolveTheme,
  picXml,
  rectShapeXml,
  presetGeomShapeXml,
  textBoxXml,
  addBackgroundArt,
  buildEntrEffectPar,
  buildExitEffectPar,
  buildTransientEffectPars,
  wrapStepGroup,
  wrapMainTiming,
  morphTransitionXml,
  addDiagonalBladeOpeningRig,
  addPleatedCurtainOpeningRig,
  addOrigamiCranesOpeningRig,
  addWindRibbonsOpeningRig,
  addShardPunchOpeningRig,
  addEmberDissolveOpeningRig,
  addPaperCrumpleTossOpeningRig,
  packagePptx,
} from "../../skills/pptx-kinetic-transitions/lib/ooxml-kinetic-core.mjs";

const BASE_DIR = path.dirname(fileURLToPath(import.meta.url));
const MEDIA_DIR = path.join(BASE_DIR, "media");
const OUT_PPTX = path.join(BASE_DIR, "daiqing-morph-typography-showcase.pptx");

const MEDIA = {
  daiqingCover: path.join(MEDIA_DIR, "daiqing-indigo-xuan-cover.jpg"),
  xuanCover: path.join(MEDIA_DIR, "xuan-indigo-gold-cover.jpg"),
  softGoldMist: path.join(MEDIA_DIR, "soft-gold-mist.png"),
  softIndigoMist: path.join(MEDIA_DIR, "soft-indigo-mist.png"),
  dq01River: path.join(MEDIA_DIR, "dq-01-river-mist.jpg"),
  dq02Pavilion: path.join(MEDIA_DIR, "dq-02-pavilion.jpg"),
  dq03Bamboo: path.join(MEDIA_DIR, "dq-03-bamboo.jpg"),
  dq04Skiff: path.join(MEDIA_DIR, "dq-04-skiff-horizon.jpg"),
  dq05Peaks: path.join(MEDIA_DIR, "dq-05-peaks.jpg"),
  dq06Waves: path.join(MEDIA_DIR, "dq-06-waves.jpg"),
  dq07Bridge: path.join(MEDIA_DIR, "dq-07-bridge.jpg"),
  dq08Waterfall: path.join(MEDIA_DIR, "dq-08-waterfall.jpg"),
  dq09BrushGold: path.join(MEDIA_DIR, "dq-09-brush-gold.jpg"),
  dq10LeftPeaks: path.join(MEDIA_DIR, "dq-10-left-peaks-mist.jpg"),
  dq11TwilightRiver: path.join(MEDIA_DIR, "dq-11-twilight-river.jpg"),
  splashMtns: path.join(MEDIA_DIR, "splash-mountains-bg.jpg"),
  splashWaves: path.join(MEDIA_DIR, "ink-water-waves.png"),
  splashSkiff: path.join(MEDIA_DIR, "ink-skiff-large.png"),
  splashSwallows: path.join(MEDIA_DIR, "ink-swallows-layer.png"),
  splashRod: path.join(MEDIA_DIR, "wooden-rod-layer.png"),
  splashReeds: path.join(MEDIA_DIR, "ink-reeds.png"),
};

for (const [key, p] of Object.entries(MEDIA)) {
  if (!fs.existsSync(p)) {
    throw new Error(`Missing required Daiqing/Dawn media asset [${key}]: ${p}`);
  }
}

const T = resolveTheme("daiqing-ink-gold");

function createSlideCtx() {
  const ids = new IdGen(100);
  let sp = 2;
  const getSp = () => sp++;
  const shapes = [];
  const buildSpids = [];
  const mediaPaths = [];
  const useMedia = (absPath) => {
    let idx = mediaPaths.indexOf(absPath);
    if (idx === -1) {
      idx = mediaPaths.length;
      mediaPaths.push(absPath);
    }
    return `rId${idx + 2}`;
  };
  return { ids, getSp, shapes, buildSpids, mediaPaths, useMedia };
}

/** Builds a click-triggered Entrance step group (`nodeType="clickEffect"` on item 0, `"withEffect"` thereafter). */
function makeClickStep(c, grpId, items) {
  const pars = items.map((it, idx) =>
    buildEntrEffectPar(c.ids, {
      spid: it.spid,
      nodeType: idx === 0 ? "clickEffect" : "withEffect",
      grpId,
      delayMs: it.delay ?? idx * 65,
      durMs: it.durMs ?? 520,
      fadeMs: it.fadeMs ?? 360,
      wipeDir: it.wipeDir || null,
      pathStr: it.pathStr !== undefined ? it.pathStr : "M 0 0.025 L 0 0 E",
      ptsTypes: it.ptsTypes ?? "AA",
      accel: it.accel ?? 12000,
      decel: it.decel ?? 76000,
      rotByDeg: it.rotByDeg ?? 0,
      rotDurMs: it.rotDurMs ?? null,
      scaleFromX: it.scaleFromX ?? null,
      scaleFromY: it.scaleFromY ?? null,
      scaleToX: it.scaleToX ?? 100,
      scaleToY: it.scaleToY ?? 100,
      scaleDurMs: it.scaleDurMs ?? null,
    })
  );
  return wrapStepGroup(c.ids, pars.join(""), "indefinite");
}

/** Creates a twilight indigo translucent card (`barSide: "left" | "top"`). */
function addDaiqingCard(
  c,
  name,
  {
    x,
    y,
    w,
    h,
    kicker = "",
    title,
    body = "",
    accentHex = T.accentHex,
    bgHex = "101B2E",
    bgAlpha = 83000,
    borderHex = T.accentHex,
    borderAlpha = 38000,
    barSide = "left",
    titleSize = 15,
    bodySize = 11.2,
    visibleInitially = false,
    prefixMorph = false,
  }
) {
  const bgId = c.getSp();
  const barId = c.getSp();
  const txtId = c.getSp();
  const spids = [bgId, barId, txtId];
  const nmBg = prefixMorph ? `!!${name}_bg` : `${name}_bg`;
  const nmBar = prefixMorph ? `!!${name}_bar` : `${name}_${barSide === "top" ? "rule" : "bar"}`;
  const nmTxt = prefixMorph ? `!!${name}_txt` : `${name}_txt`;

  c.shapes.push(
    rectShapeXml({
      id: bgId,
      name: nmBg,
      x,
      y,
      w,
      h,
      fillHex: bgHex,
      fillAlpha: bgAlpha,
      borderHex,
      borderAlpha,
      borderW: 1,
      radius: 4200,
    }),
    barSide === "top"
      ? rectShapeXml({
          id: barId,
          name: nmBar,
          x: x + 22,
          y: y + 18,
          w: 58,
          h: 3.5,
          fillHex: accentHex,
          fillAlpha: 94000,
        })
      : rectShapeXml({
          id: barId,
          name: nmBar,
          x: x + 16,
          y: y + 16,
          w: 4,
          h: h - 32,
          fillHex: accentHex,
          fillAlpha: 92000,
        })
  );

  const paragraphs = [];
  if (kicker) {
    paragraphs.push({
      spaceAfter: 4,
      runs: [{ text: kicker, size: 10, color: accentHex, bold: true, font: T.fontBody }],
    });
  }
  paragraphs.push({
    spaceAfter: body ? 5 : 0,
    runs: [{ text: title, size: titleSize, color: T.titleHex, bold: true, font: T.fontTitle }],
  });
  if (body) {
    paragraphs.push({
      linePct: 128000,
      runs: [{ text: body, size: bodySize, color: "D1DCE9", bold: false, font: T.fontBody }],
    });
  }

  const padLeft = barSide === "top" ? x + 22 : x + 32;
  const padTop = barSide === "top" ? y + 32 : y + 10;
  const txtW = barSide === "top" ? w - 44 : w - 48;
  const txtH = barSide === "top" ? h - 46 : h - 20;

  c.shapes.push(
    textBoxXml({
      id: txtId,
      name: nmTxt,
      x: padLeft,
      y: padTop,
      w: txtW,
      h: txtH,
      paragraphs,
      padX: 2,
      padY: 2,
      anchor: barSide === "top" ? "t" : "ctr",
    })
  );

  if (!visibleInitially) c.buildSpids.push(...spids);
  return spids;
}

/** Creates a warm Xuan cream card for Dawn Climax Slides 12-13. */
function addWarmXuanCard(c, name, { x, y, w, h, kicker = "", title, body, accentHex = "9E3426", titleSize = 14.8, bodySize = 10.8 }) {
  const bgId = c.getSp();
  const barId = c.getSp();
  const txtId = c.getSp();
  const spids = [bgId, barId, txtId];

  c.shapes.push(
    rectShapeXml({
      id: bgId,
      name: `${name}_bg`,
      x,
      y,
      w,
      h,
      fillHex: "FCF8EF",
      fillAlpha: 93000,
      borderHex: "CBBFA8",
      borderAlpha: 72000,
      borderW: 1,
      radius: 4200,
    }),
    rectShapeXml({
      id: barId,
      name: `${name}_bar`,
      x: x + 16,
      y: y + 13,
      w: 4.5,
      h: h - 26,
      fillHex: accentHex,
      fillAlpha: 94000,
    })
  );

  const paragraphs = [];
  if (kicker) {
    paragraphs.push({
      spaceAfter: 3,
      runs: [{ text: kicker, size: 9.5, color: accentHex, bold: true, font: "Microsoft YaHei" }],
    });
  }
  paragraphs.push({
    spaceAfter: 3,
    runs: [{ text: title, size: titleSize, color: "14181F", bold: true, font: "KaiTi" }],
  });
  paragraphs.push({
    linePct: 124000,
    runs: [{ text: body, size: bodySize, color: "3A424E", bold: false, font: "Microsoft YaHei" }],
  });

  c.shapes.push(
    textBoxXml({
      id: txtId,
      name: `${name}_txt`,
      x: x + 30,
      y: y + 8,
      w: w - 42,
      h: h - 16,
      paragraphs,
      padX: 2,
      padY: 2,
      anchor: "ctr",
    })
  );

  c.buildSpids.push(...spids);
  return spids;
}

/** Adds hero badge/title block that settles smoothly right after opener curtain opens. */
function addHeroBlock(
  c,
  {
    x,
    y,
    w,
    sealChar = "",
    kicker,
    titleLines,
    subtext = "",
    align = "l",
    enterDelay = 420,
    titleSize = 31,
    visibleInitially = false,
  }
) {
  const pars = [];
  let cursorY = y;

  if (sealChar) {
    const sBg = c.getSp();
    const sTx = c.getSp();
    const tagId = c.getSp();
    c.shapes.push(
      rectShapeXml({
        id: sBg,
        name: "hero_seal_bg",
        x,
        y: cursorY,
        w: 38,
        h: 38,
        fillHex: T.veilAccentHex,
        fillAlpha: 94000,
        borderHex: T.accentHex,
        borderAlpha: 65000,
        borderW: 1,
        radius: 5000,
      }),
      textBoxXml({
        id: sTx,
        name: "hero_seal_txt",
        x,
        y: cursorY,
        w: 38,
        h: 38,
        paragraphs: [{ align: "ctr", runs: [{ text: sealChar, size: 14, color: "FAF5EB", bold: true, font: "KaiTi" }] }],
        anchor: "ctr",
        padX: 0,
        padY: 0,
      }),
      textBoxXml({
        id: tagId,
        name: "hero_kicker",
        x: x + 50,
        y: cursorY + 4,
        w: w - 50,
        h: 30,
        paragraphs: [{ align, runs: [{ text: kicker, size: 11.5, color: T.accentHex, bold: true, font: T.fontBody }] }],
        anchor: "ctr",
        padX: 0,
        padY: 0,
      })
    );
    if (!visibleInitially) {
      c.buildSpids.push(sBg, sTx, tagId);
      for (const id of [sBg, sTx, tagId]) {
        pars.push(
          buildEntrEffectPar(c.ids, {
            spid: id,
            nodeType: "withEffect",
            grpId: 1,
            delayMs: enterDelay,
            durMs: 380,
            fadeMs: 320,
          })
        );
      }
    }
    cursorY += 48;
  } else {
    const tagId = c.getSp();
    c.shapes.push(
      textBoxXml({
        id: tagId,
        name: "hero_kicker",
        x,
        y: cursorY,
        w,
        h: 28,
        paragraphs: [{ align, runs: [{ text: kicker, size: 11.5, color: T.accentHex, bold: true, font: T.fontBody }] }],
        padX: 0,
        padY: 0,
      })
    );
    if (!visibleInitially) {
      c.buildSpids.push(tagId);
      pars.push(
        buildEntrEffectPar(c.ids, {
          spid: tagId,
          nodeType: "withEffect",
          grpId: 1,
          delayMs: enterDelay,
          durMs: 360,
          fadeMs: 300,
        })
      );
    }
    cursorY += 34;
  }

  const titleId = c.getSp();
  const titleH = titleLines.length * Math.round(titleSize * 2.25) + 12;
  c.shapes.push(
    textBoxXml({
      id: titleId,
      name: "hero_title",
      x,
      y: cursorY,
      w,
      h: titleH,
      paragraphs: titleLines.map((line, i) => ({
        align,
        spaceAfter: i === titleLines.length - 1 ? 6 : 2,
        runs: [{ text: line, size: titleSize, color: T.titleHex, bold: true, font: T.fontTitle }],
      })),
      padX: 0,
      padY: 0,
    })
  );
  if (!visibleInitially) {
    c.buildSpids.push(titleId);
    pars.push(
      buildEntrEffectPar(c.ids, {
        spid: titleId,
        nodeType: "withEffect",
        grpId: 1,
        delayMs: enterDelay + 50,
        durMs: 500,
        fadeMs: 400,
        pathStr: "M 0 0.018 L 0 0 E",
        ptsTypes: "AA",
      })
    );
  }
  cursorY += titleH + 6;

  if (subtext) {
    const subId = c.getSp();
    c.shapes.push(
      textBoxXml({
        id: subId,
        name: "hero_sub",
        x,
        y: cursorY,
        w,
        h: 64,
        paragraphs: [{ align, linePct: 132000, runs: [{ text: subtext, size: 12.2, color: "D1DCE9", font: T.fontBody }] }],
        padX: 0,
        padY: 2,
      })
    );
    if (!visibleInitially) {
      c.buildSpids.push(subId);
      pars.push(
        buildEntrEffectPar(c.ids, {
          spid: subId,
          nodeType: "withEffect",
          grpId: 1,
          delayMs: enterDelay + 110,
          durMs: 460,
          fadeMs: 360,
        })
      );
    }
  }

  return pars;
}

/** Helper to attach Keynote-style gold vertical laser sweep wiping a target headline. */
function addLaserSweepGroup(c, { x, y, textW, h, grpId, delayMs, targetSpid, enterNodeType = "withEffect", cursorName = "laser_bar" }) {
  const cursorId = c.getSp();
  c.shapes.push(
    rectShapeXml({
      id: cursorId,
      name: cursorName,
      x,
      y: y + 6,
      w: 5,
      h: h - 12,
      fillHex: T.accentHex,
      fillAlpha: 96000,
      borderHex: "FBF5E6",
      borderAlpha: 75000,
      borderW: 1,
      radius: 2000,
    })
  );
  c.buildSpids.push(cursorId);

  const sweepRelX = Math.min(0.75, textW / 1600).toFixed(3);
  const wipEntr = buildEntrEffectPar(c.ids, {
    spid: targetSpid,
    nodeType: enterNodeType,
    grpId,
    delayMs: delayMs + 40,
    durMs: 820,
    fadeMs: 110,
    wipeDir: "right",
    pathStr: null,
  });
  const cursorPars = buildTransientEffectPars(c.ids, {
    spid: cursorId,
    grpId,
    enterNodeType: "withEffect",
    enterDelay: delayMs,
    enterDur: 130,
    holdMs: 20,
    exitDur: 800,
    exitPathStr: `M 0 0 L ${sweepRelX} 0 E`,
    exitPtsTypes: "AA",
  });
  return [wipEntr, ...cursorPars];
}

function buildMasterShowcaseDeck() {
  const slides = [];

  // =========================================================================
  // SLIDE 1 · 卷首破题 · 斜刀劈裂 (blade) × 阶梯三卡点按入场
  // =========================================================================
  {
    const c = createSlideCtx();
    addBackgroundArt({
      shapes: c.shapes,
      getSp: c.getSp,
      mediaRid: c.useMedia(MEDIA.dq01River),
      scrimStops: [
        { pos: 0, hex: "0D1726", alpha: 64000 },
        { pos: 48000, hex: "0D1726", alpha: 24000 },
        { pos: 100000, hex: "0D1726", alpha: 0 },
      ],
    });

    const heroPars = addHeroBlock(c, {
      x: 92,
      y: 72,
      w: 620,
      sealChar: "壹",
      kicker: "OPENING 01 · 斜刀破局 × 左峰虚空阶梯排版",
      titleLines: ["第一帧，山河随字动"],
      subtext: "斜锋划开暮色画卷，留白静候，每一条要点只待指尖轻点应声落位。",
      enterDelay: 380,
      titleSize: 31,
    });

    const c1 = addDaiqingCard(c, "s1_c1", {
      x: 92,
      y: 300,
      w: 492,
      h: 134,
      kicker: "STEP 01 · 留白骨架",
      title: "重山留右境，云水承左文",
      body: "主峰与江影安居画面右半，左侧暮色开阔天地专门落位阶梯卡片。",
    });
    const c2 = addDaiqingCard(c, "s1_c2", {
      x: 118,
      y: 454,
      w: 492,
      h: 134,
      kicker: "STEP 02 · 斜刃破画",
      title: "金光斜劈一瞬即撤",
      body: "38.7° 对角劈裂兼顾冲击感与克制，视线不喧宾夺主直接锚定主峰。",
      accentHex: T.secondaryHex,
    });
    const c3 = addDaiqingCard(c, "s1_c3", {
      x: 144,
      y: 608,
      w: 492,
      h: 134,
      kicker: "STEP 03 · 十三幕全景",
      title: "七绝入场 × 五组无缝推镜",
      body: "黛青夜色连贯十一幕渐入佳境，终章推镜破晓迈入暖白青绿长卷。",
      accentHex: "C4934A",
    });

    const rigPars = addDiagonalBladeOpeningRig({
      shapes: c.shapes,
      buildSpids: c.buildSpids,
      ids: c.ids,
      getSp: c.getSp,
      theme: "daiqing-ink-gold",
      coverMediaRid: c.useMedia(MEDIA.daiqingCover),
      bladeColor: T.accentHex,
      autoDelay: 90,
    });

    const steps = [
      wrapStepGroup(c.ids, [...rigPars, ...heroPars].join(""), 0),
      makeClickStep(c, 2, c1.map((id) => ({ spid: id, pathStr: "M -0.05 0 L 0 0 E" }))),
      makeClickStep(c, 3, c2.map((id) => ({ spid: id, pathStr: "M -0.05 0 L 0 0 E" }))),
      makeClickStep(c, 4, c3.map((id) => ({ spid: id, pathStr: "M -0.05 0 L 0 0 E" }))),
    ];

    slides.push({
      bgColor: T.bgHex,
      shapesXml: c.shapes.join("\n"),
      timingXml: wrapMainTiming(c.ids, steps.join(""), c.buildSpids),
      mediaPaths: c.mediaPaths,
    });
  }

  // =========================================================================
  // SLIDE 2 · 立体帷幔 × 激光金线切字 × 旧卡退场让位 (Prepares Morph #1)
  // =========================================================================
  {
    const c = createSlideCtx();
    addBackgroundArt({
      shapes: c.shapes,
      getSp: c.getSp,
      mediaRid: c.useMedia(MEDIA.dq08Waterfall),
      scrimStops: [
        { pos: 0, hex: "0C1626", alpha: 60000 },
        { pos: 58000, hex: "0C1626", alpha: 30000 },
        { pos: 100000, hex: "0C1626", alpha: 8000 },
      ],
    });

    // Morph Anchor: Chip pill (stays visible for Slide 3 Morph!)
    const chipBg = c.getSp();
    const chipTxt = c.getSp();
    c.shapes.push(
      rectShapeXml({
        id: chipBg,
        name: "!!k_chip_bg",
        x: 92,
        y: 66,
        w: 316,
        h: 36,
        fillHex: "15253E",
        fillAlpha: 88000,
        borderHex: T.accentHex,
        borderAlpha: 65000,
        borderW: 1,
        radius: 18000,
      }),
      textBoxXml({
        id: chipTxt,
        name: "s2_chip_txt",
        x: 108,
        y: 66,
        w: 284,
        h: 36,
        paragraphs: [{ runs: [{ text: "OPENING 02 · 帷幔 × 游标切字", size: 10.5, color: T.accentHex, bold: true, font: T.fontBody }] }],
        anchor: "ctr",
        padX: 0,
        padY: 0,
      })
    );
    c.buildSpids.push(chipBg, chipTxt);

    // Morph Anchors: Ring + Orb parked gently over calm dark water lower-middle -> explodes 2.4x in S3!
    const ringId = c.getSp();
    const orbId = c.getSp();
    c.shapes.push(
      presetGeomShapeXml({
        id: ringId,
        name: "!!k_ring",
        prst: "donut",
        adjVal: 9000,
        x: 734,
        y: 622,
        w: 170,
        h: 170,
        fillHex: T.accentHex,
        fillAlpha: 44000,
        borderHex: T.accentHex,
        borderAlpha: 55000,
        borderW: 1,
      }),
      presetGeomShapeXml({
        id: orbId,
        name: "!!k_orb",
        prst: "ellipse",
        x: 764,
        y: 652,
        w: 110,
        h: 110,
        fillHex: "132238",
        fillAlpha: 68000,
        borderHex: T.secondaryHex,
        borderAlpha: 46000,
        borderW: 1,
      })
    );
    c.buildSpids.push(ringId, orbId);

    // Laser-wiped Headline + Subtitle
    const headId = c.getSp();
    c.shapes.push(
      textBoxXml({
        id: headId,
        name: "s2_laser_head",
        x: 92,
        y: 118,
        w: 690,
        h: 92,
        paragraphs: [{ runs: [{ text: "一束金线，切开山河", size: 32, color: T.titleHex, bold: true, font: T.fontTitle }] }],
        anchor: "ctr",
        padX: 0,
        padY: 0,
      })
    );
    c.buildSpids.push(headId);

    const subId = c.getSp();
    c.shapes.push(
      textBoxXml({
        id: subId,
        name: "s2_sub",
        x: 92,
        y: 204,
        w: 660,
        h: 46,
        paragraphs: [{ runs: [{ text: "帷幔向两侧退让，金色游标扫过主标，紧接着用退场动作淘汰臃肿旧稿。", size: 12, color: "D1DCE9", font: T.fontBody }] }],
        padX: 0,
        padY: 0,
      })
    );
    c.buildSpids.push(subId);

    // Click 1: Left OLD card (which EXITS on Click 2!) + Mid-Left Morph Focus Cards !!k_f1 / !!k_f2
    const oldCard = addDaiqingCard(c, "s2_old", {
      x: 92,
      y: 274,
      w: 486,
      h: 298,
      kicker: "旧式模板痛点 · 即将退场让位",
      title: "文字挤成一团，盖住飞瀑悬崖",
      body: "通栏堆砌多段长文，静态硬切让人分不清主次。真正讲课只需要留下最核心的一两组动作锚点。",
      accentHex: T.crimsonHex,
      bgHex: "151C28",
      bgAlpha: 90000,
      borderHex: T.crimsonHex,
      borderAlpha: 55000,
      titleSize: 16.5,
      bodySize: 11.8,
    });

    const f1 = addDaiqingCard(c, "k_f1", {
      x: 610,
      y: 268,
      w: 408,
      h: 150,
      kicker: "重点 A · 视觉牵引",
      title: "游标切字 · 目光跟着走",
      body: "竖线自左向右平滑扫字，节奏与解说同步。",
      barSide: "top",
      titleSize: 15,
      bodySize: 11,
      prefixMorph: true,
    });

    const f2 = addDaiqingCard(c, "k_f2", {
      x: 610,
      y: 438,
      w: 408,
      h: 150,
      kicker: "重点 B · 干净清场",
      title: "退场让位 · 画面不拥挤",
      body: "二次点击甩出旧卡，留焦点跨页推镜。",
      accentHex: T.secondaryHex,
      barSide: "top",
      titleSize: 15,
      bodySize: 11,
      prefixMorph: true,
    });

    // Click 2 spotlight note that appears once Left Old card rockets away
    const spotNote = addDaiqingCard(c, "s2_spot", {
      x: 92,
      y: 356,
      w: 486,
      h: 136,
      kicker: "聚焦清屏 · 对比完成",
      title: "冗余一退，飞瀑与焦点字卡双双透气",
      body: "此时右侧双卡已在幕内就位，下一页即凭同一名号平移重构。",
      accentHex: T.accentHex,
    });

    const rigPars = addPleatedCurtainOpeningRig({
      shapes: c.shapes,
      ids: c.ids,
      getSp: c.getSp,
      theme: "daiqing-ink-gold",
      autoDelay: 140,
    });

    const autoLaserPars = addLaserSweepGroup(c, {
      x: 92,
      y: 120,
      textW: 480,
      h: 84,
      grpId: 1,
      delayMs: 740,
      targetSpid: headId,
    });

    const autoAnchorPars = [chipBg, chipTxt, subId, ringId, orbId].map((id, i) =>
      buildEntrEffectPar(c.ids, {
        spid: id,
        nodeType: "withEffect",
        grpId: 1,
        delayMs: 560 + i * 55,
        durMs: 420,
        fadeMs: 320,
      })
    );

    const click2Pars = [
      ...oldCard.map((id, i) =>
        buildExitEffectPar(c.ids, {
          spid: id,
          nodeType: i === 0 ? "clickEffect" : "withEffect",
          grpId: 3,
          delayMs: i * 18,
          durMs: 680,
          pathStr: "M 0 0 L -0.46 0 E",
          ptsTypes: "AA",
          fadeFraction: 0.45,
          accel: 64000,
          decel: 12000,
        })
      ),
      ...spotNote.map((id, i) =>
        buildEntrEffectPar(c.ids, {
          spid: id,
          nodeType: "withEffect",
          grpId: 3,
          delayMs: 260 + i * 35,
          durMs: 540,
          fadeMs: 360,
          wipeDir: "right",
          pathStr: null,
        })
      ),
    ];

    const steps = [
      wrapStepGroup(c.ids, [...rigPars, ...autoAnchorPars, ...autoLaserPars].join(""), 0),
      makeClickStep(c, 2, [
        ...oldCard.map((id, i) => ({ spid: id, delay: i * 30, pathStr: "M -0.05 0 L 0 0 E" })),
        ...f1.map((id, i) => ({ spid: id, delay: 140 + i * 25, pathStr: "M 0 0.03 L 0 0 E" })),
        ...f2.map((id, i) => ({ spid: id, delay: 240 + i * 25, pathStr: "M 0 0.03 L 0 0 E" })),
      ]),
      wrapStepGroup(c.ids, click2Pars.join(""), "indefinite"),
    ];

    slides.push({
      bgColor: T.bgHex,
      shapesXml: c.shapes.join("\n"),
      timingXml: wrapMainTiming(c.ids, steps.join(""), c.buildSpids),
      mediaPaths: c.mediaPaths,
    });
  }

  // =========================================================================
  // SLIDE 3 · Morph #1 · 2.45× 镜头推拉重构 (NO Opener!)
  // =========================================================================
  {
    const c = createSlideCtx();
    addBackgroundArt({
      shapes: c.shapes,
      getSp: c.getSp,
      mediaRid: c.useMedia(MEDIA.dq09BrushGold),
      scrimStops: [
        { pos: 0, hex: "0D1726", alpha: 56000 },
        { pos: 52000, hex: "0D1726", alpha: 24000 },
        { pos: 100000, hex: "0D1726", alpha: 10000 },
      ],
    });

    // Morphed anchors immediately visible at t=0 (NOT in buildSpids!)
    c.shapes.push(
      rectShapeXml({
        id: c.getSp(),
        name: "!!k_chip_bg",
        x: 92,
        y: 66,
        w: 400,
        h: 36,
        fillHex: "15253E",
        fillAlpha: 88000,
        borderHex: T.accentHex,
        borderAlpha: 68000,
        borderW: 1,
        radius: 18000,
      }),
      textBoxXml({
        id: c.getSp(),
        name: "s3_chip_txt",
        x: 108,
        y: 66,
        w: 368,
        h: 36,
        paragraphs: [{ runs: [{ text: "MORPH 01 · 平滑推镜 × 2.45× 聚焦放大", size: 10.5, color: T.accentHex, bold: true, font: T.fontBody }] }],
        anchor: "ctr",
        padX: 0,
        padY: 0,
      }),
      presetGeomShapeXml({
        id: c.getSp(),
        name: "!!k_ring",
        prst: "donut",
        adjVal: 9000,
        x: 1030,
        y: 170,
        w: 420,
        h: 420,
        rotDeg: 45,
        fillHex: T.accentHex,
        fillAlpha: 42000,
        borderHex: T.accentHex,
        borderAlpha: 72000,
        borderW: 1.5,
      }),
      presetGeomShapeXml({
        id: c.getSp(),
        name: "!!k_orb",
        prst: "ellipse",
        x: 1098,
        y: 238,
        w: 284,
        h: 284,
        fillHex: "111D30",
        fillAlpha: 64000,
        borderHex: T.secondaryHex,
        borderAlpha: 55000,
        borderW: 1,
      })
    );

    // Visible headline
    c.shapes.push(
      textBoxXml({
        id: c.getSp(),
        name: "s3_head",
        x: 92,
        y: 116,
        w: 840,
        h: 68,
        paragraphs: [{ runs: [{ text: "同一组元素，推镜即换新章", size: 31, color: T.titleHex, bold: true, font: T.fontTitle }] }],
        padX: 0,
        padY: 0,
      })
    );

    // Morphed focus cards gliding straight from Slide 2 middle column into aligned left editorial rows!
    addDaiqingCard(c, "k_f1", {
      x: 92,
      y: 202,
      w: 500,
      h: 146,
      kicker: "重点 A · 视觉牵引",
      title: "游标切字 · 目光跟着走",
      body: "竖线自左向右平滑扫字，节奏与解说同步。",
      barSide: "top",
      titleSize: 15,
      bodySize: 11,
      visibleInitially: true,
      prefixMorph: true,
    });
    addDaiqingCard(c, "k_f2", {
      x: 92,
      y: 366,
      w: 500,
      h: 146,
      kicker: "重点 B · 干净清场",
      title: "退场让位 · 画面不拥挤",
      body: "二次点击甩出旧卡，留焦点跨页推镜。",
      accentHex: T.secondaryHex,
      barSide: "top",
      titleSize: 15,
      bodySize: 11,
      visibleInitially: true,
      prefixMorph: true,
    });

    // Click 1: Reveal 3rd pillar + lens focus overlay inside zoomed ring
    const f3 = addDaiqingCard(c, "s3_f3", {
      x: 92,
      y: 530,
      w: 500,
      h: 142,
      kicker: "重点 C · 原位增殖",
      title: "借金环放大，自然托出第三论点",
      body: "原有要素迁移落定后，第三论点顺势补齐。",
      accentHex: "C4934A",
      barSide: "top",
      titleSize: 15,
      bodySize: 11,
    });

    const lensLabelId = c.getSp();
    c.shapes.push(
      textBoxXml({
        id: lensLabelId,
        name: "s3_lens_label",
        x: 1126,
        y: 318,
        w: 228,
        h: 124,
        paragraphs: [
          { align: "ctr", spaceAfter: 6, runs: [{ text: "2.45×", size: 30, color: T.accentHex, bold: true, font: T.fontTitle }] },
          { align: "ctr", runs: [{ text: "圆环推镜锁定金笔锋芒", size: 12, color: T.titleHex, bold: true, font: T.fontBody }] },
        ],
        anchor: "ctr",
        padX: 4,
        padY: 4,
      })
    );
    c.buildSpids.push(lensLabelId);

    // Click 2: Full bottom editorial footnote bar
    const footCard = addDaiqingCard(c, "s3_foot", {
      x: 92,
      y: 688,
      w: 840,
      h: 92,
      kicker: "推镜美学",
      title: "不靠炫目闪切，只凭坐标迁移与大小缩放撑起高级电影感",
      body: "",
      titleSize: 15.5,
      bgAlpha: 78000,
    });

    const steps = [
      makeClickStep(c, 1, [
        ...f3.map((id, i) => ({ spid: id, delay: i * 35, pathStr: "M -0.05 0 L 0 0 E" })),
        { spid: lensLabelId, delay: 180, durMs: 560, wipeDir: "right", pathStr: null },
      ]),
      makeClickStep(
        c,
        2,
        footCard.map((id, i) => ({ spid: id, delay: i * 35, durMs: 580, wipeDir: "right", pathStr: null }))
      ),
    ];

    slides.push({
      bgColor: T.bgHex,
      shapesXml: c.shapes.join("\n"),
      timingXml: wrapMainTiming(c.ids, steps.join(""), c.buildSpids),
      transitionXml: morphTransitionXml(),
      mediaPaths: c.mediaPaths,
    });
  }

  // =========================================================================
  // SLIDE 4 · 左起千纸鹤 × 2×2 竹林分格排版 (cranes)
  // =========================================================================
  {
    const c = createSlideCtx();
    addBackgroundArt({
      shapes: c.shapes,
      getSp: c.getSp,
      mediaRid: c.useMedia(MEDIA.dq03Bamboo),
      scrimStops: [
        { pos: 0, hex: "0C1524", alpha: 52000 },
        { pos: 50000, hex: "0C1524", alpha: 42000 },
        { pos: 100000, hex: "0C1524", alpha: 52000 },
      ],
    });

    const heroPars = addHeroBlock(c, {
      x: 250,
      y: 52,
      w: 1100,
      align: "ctr",
      kicker: "OPENING 03 · 左侧飞鹤掀卷 × 2×2 竹林对称格律",
      titleLines: ["鹤自左来，四格如画舒展"],
      subtext: "十四只纸鹤自屏幕最左缘扑翼腾起，依次掀开黛青宣纸，随后四块文字随点击分列云雾上方。",
      enterDelay: 520,
      titleSize: 30,
    });

    const q1 = addDaiqingCard(c, "s4_q1", {
      x: 116,
      y: 232,
      w: 634,
      h: 164,
      kicker: "FIRST BEAT · 左翼动线",
      title: "顺势而为：转场从左出，叙事由左入",
      body: "鸟群贴合阅读习惯自左缘成群启程，观众不必重新搜寻视觉起点。",
      barSide: "top",
    });
    const q2 = addDaiqingCard(c, "s4_q2", {
      x: 850,
      y: 232,
      w: 634,
      h: 164,
      kicker: "SECOND BEAT · 纸缘留韵",
      title: "四格之间留足 100px 空气带",
      body: "中央竖向竹林雾气与下方墨竹轮廓完全敞亮，拒绝铺满压迫。",
      accentHex: T.secondaryHex,
      barSide: "top",
    });
    const q3 = addDaiqingCard(c, "s4_q3", {
      x: 116,
      y: 422,
      w: 634,
      h: 164,
      kicker: "THIRD BEAT · 刚柔并济",
      title: "硬朗切边配以微透明暮蓝磨砂",
      body: "卡片仅取 1px 古金细边勾勒，既有结构秩序，又融入底层竹影。",
      accentHex: "C4934A",
      barSide: "top",
    });
    const q4 = addDaiqingCard(c, "s4_q4", {
      x: 850,
      y: 422,
      w: 634,
      h: 164,
      kicker: "FOURTH BEAT · 讲台把控",
      title: "上双下双，两次翻页掌控全局",
      body: "不逐字狂闪，每次点击同时滑入并列一组论点，节奏松弛有度。",
      barSide: "top",
    });

    const rigPars = addOrigamiCranesOpeningRig({
      shapes: c.shapes,
      buildSpids: c.buildSpids,
      ids: c.ids,
      getSp: c.getSp,
      theme: "daiqing-ink-gold",
      coverMediaRid: c.useMedia(MEDIA.daiqingCover),
      seamlessMode: true,
      autoDelay: 90,
    });

    const steps = [
      wrapStepGroup(c.ids, [...rigPars, ...heroPars].join(""), 0),
      makeClickStep(c, 2, [
        ...q1.map((id, i) => ({ spid: id, delay: i * 35, pathStr: "M -0.05 0 L 0 0 E" })),
        ...q2.map((id, i) => ({ spid: id, delay: 110 + i * 35, pathStr: "M 0.05 0 L 0 0 E" })),
      ]),
      makeClickStep(c, 3, [
        ...q3.map((id, i) => ({ spid: id, delay: i * 35, pathStr: "M -0.04 0.03 L 0 0 E" })),
        ...q4.map((id, i) => ({ spid: id, delay: 110 + i * 35, pathStr: "M 0.04 0.03 L 0 0 E" })),
      ]),
    ];

    slides.push({
      bgColor: T.bgHex,
      shapesXml: c.shapes.join("\n"),
      timingXml: wrapMainTiming(c.ids, steps.join(""), c.buildSpids),
      mediaPaths: c.mediaPaths,
    });
  }

  // =========================================================================
  // SLIDE 5 · 狂风卷条 × 三速视差 × 上下反向轰散退场 (Prepares Morph #2!)
  // =========================================================================
  {
    const c = createSlideCtx();
    addBackgroundArt({
      shapes: c.shapes,
      getSp: c.getSp,
      mediaRid: c.useMedia(MEDIA.dq02Pavilion),
      scrimStops: [
        { pos: 0, hex: "0C1626", alpha: 8000 },
        { pos: 46000, hex: "0C1626", alpha: 36000 },
        { pos: 100000, hex: "0C1626", alpha: 68000 },
      ],
    });

    const heroPars = addHeroBlock(c, {
      x: 688,
      y: 52,
      w: 820,
      kicker: "OPENING 04 · 狂风卷条 × 三速视差与对冲退场",
      titleLines: ["远慢、中稳、近快 · 一点齐发"],
      subtext: "",
      enterDelay: 500,
      titleSize: 28,
    });

    // Click 1: 3-Speed Parallax Morph Anchors (!!mag_orb, !!mag_pill, !!mag_main)
    const magOrb = c.getSp();
    c.shapes.push(
      presetGeomShapeXml({
        id: magOrb,
        name: "!!mag_orb",
        prst: "ellipse",
        x: 68,
        y: 632,
        w: 148,
        h: 148,
        fillHex: "15243A",
        fillAlpha: 68000,
        borderHex: T.accentHex,
        borderAlpha: 85000,
        borderW: 2.5,
      })
    );
    c.buildSpids.push(magOrb);

    const magPillBg = c.getSp();
    const magPillTxt = c.getSp();
    c.shapes.push(
      rectShapeXml({
        id: magPillBg,
        name: "!!mag_pill_bg",
        x: 688,
        y: 162,
        w: 300,
        h: 38,
        rotDeg: -4.5,
        fillHex: T.accentHex,
        fillAlpha: 94000,
        radius: 19000,
      }),
      textBoxXml({
        id: magPillTxt,
        name: "s5_pill_txt",
        x: 696,
        y: 162,
        w: 284,
        h: 38,
        rotDeg: -4.5,
        paragraphs: [{ align: "ctr", runs: [{ text: "前景高速层 · 0.44s 抢眼定锚", size: 10.5, color: "101B2E", bold: true, font: T.fontBody }] }],
        anchor: "ctr",
        padX: 0,
        padY: 0,
      })
    );
    c.buildSpids.push(magPillBg, magPillTxt);

    const magMainBg = c.getSp();
    const magMainTxt = c.getSp();
    c.shapes.push(
      rectShapeXml({
        id: magMainBg,
        name: "!!mag_main_bg",
        x: 688,
        y: 238,
        w: 800,
        h: 332,
        fillHex: "101B2E",
        fillAlpha: 86000,
        borderHex: T.accentHex,
        borderAlpha: 42000,
        borderW: 1,
        radius: 5000,
      }),
      textBoxXml({
        id: magMainTxt,
        name: "s5_main_txt",
        x: 722,
        y: 260,
        w: 732,
        h: 286,
        paragraphs: [
          { spaceAfter: 8, runs: [{ text: "中景标准层 · 0.74s 稳妥落位", size: 11.5, color: T.accentHex, bold: true, font: T.fontBody }] },
          { spaceAfter: 12, runs: [{ text: "同一声点击里，制造前后景电影级速度差", size: 22, color: T.titleHex, bold: true, font: T.fontTitle }] },
          {
            linePct: 132000,
            runs: [
              {
                text: "左下暮金环最慢（1.08 秒）负责兜底，主框居中速稳落地，右上斜标签最快（0.44 秒）破风率先吸睛——不必花里胡哨，层层速差自带大片透视感。",
                size: 12.2,
                color: "D1DCE9",
                font: T.fontBody,
              },
            ],
          },
        ],
        anchor: "ctr",
        padX: 4,
        padY: 4,
      })
    );
    c.buildSpids.push(magMainBg, magMainTxt);

    // Clash Bars (Click 1 entrance -> Click 2 Counter-Directional Exit!)
    const clashTop = addDaiqingCard(c, "clash_top", {
      x: 1020,
      y: 162,
      w: 468,
      h: 52,
      kicker: "",
      title: "上轨对冲 · 二次点击朝左上瞬散",
      accentHex: T.secondaryHex,
      bgHex: "15253E",
      titleSize: 12.5,
    });
    const clashBot = addDaiqingCard(c, "clash_bot", {
      x: 688,
      y: 594,
      w: 520,
      h: 52,
      kicker: "",
      title: "下轨对冲 · 同步朝右下斜向清场",
      accentHex: "C4934A",
      bgHex: "15253E",
      titleSize: 12.5,
    });

    // Click 2 Clean Footnote
    const cleanNote = addDaiqingCard(c, "s5_clean_note", {
      x: 688,
      y: 662,
      w: 800,
      h: 92,
      kicker: "CLASH COMPLETE · 对冲清空",
      title: "双轨反向飞出幕外，留给下一幕推镜重构",
      body: "斜标签下页将抚平至 0° 移入左上角，主框立起成右翼展板。",
      titleSize: 14.5,
      bodySize: 11,
      bgAlpha: 78000,
    });

    const rigPars = addWindRibbonsOpeningRig({
      shapes: c.shapes,
      buildSpids: c.buildSpids,
      ids: c.ids,
      getSp: c.getSp,
      theme: "daiqing-ink-gold",
      coverMediaRid: c.useMedia(MEDIA.xuanCover),
      autoDelay: 90,
    });

    const click2Pars = [
      ...clashTop.map((id, i) =>
        buildExitEffectPar(c.ids, {
          spid: id,
          nodeType: i === 0 ? "clickEffect" : "withEffect",
          grpId: 3,
          delayMs: 0,
          durMs: 620,
          pathStr: "M 0 0 L -0.58 -0.18 E",
          ptsTypes: "AA",
          fadeFraction: 0.45,
          accel: 68000,
          decel: 10000,
        })
      ),
      ...clashBot.map((id) =>
        buildExitEffectPar(c.ids, {
          spid: id,
          nodeType: "withEffect",
          grpId: 3,
          delayMs: 35,
          durMs: 620,
          pathStr: "M 0 0 L 0.58 0.18 E",
          ptsTypes: "AA",
          fadeFraction: 0.45,
          accel: 68000,
          decel: 10000,
        })
      ),
      ...cleanNote.map((id, i) =>
        buildEntrEffectPar(c.ids, {
          spid: id,
          nodeType: "withEffect",
          grpId: 3,
          delayMs: 240 + i * 35,
          durMs: 560,
          fadeMs: 360,
          wipeDir: "right",
          pathStr: null,
        })
      ),
    ];

    const steps = [
      wrapStepGroup(c.ids, [...rigPars, ...heroPars].join(""), 0),
      makeClickStep(c, 2, [
        { spid: magOrb, delay: 0, durMs: 1080, pathStr: "M -0.12 0 L 0 0 E", decel: 82000 },
        { spid: magMainBg, delay: 60, durMs: 740, pathStr: "M 0.10 0 L 0 0 E" },
        { spid: magMainTxt, delay: 80, durMs: 740, pathStr: "M 0.10 0 L 0 0 E" },
        { spid: magPillBg, delay: 140, durMs: 440, pathStr: "M 0.15 0 L 0 0 E", decel: 88000 },
        { spid: magPillTxt, delay: 140, durMs: 440, pathStr: "M 0.15 0 L 0 0 E", decel: 88000 },
        ...clashTop.map((id, i) => ({ spid: id, delay: 220 + i * 25, durMs: 540, pathStr: "M 0 -0.05 L 0 0 E" })),
        ...clashBot.map((id, i) => ({ spid: id, delay: 260 + i * 25, durMs: 540, pathStr: "M 0 0.05 L 0 0 E" })),
      ]),
      wrapStepGroup(c.ids, click2Pars.join(""), "indefinite"),
    ];

    slides.push({
      bgColor: T.bgHex,
      shapesXml: c.shapes.join("\n"),
      timingXml: wrapMainTiming(c.ids, steps.join(""), c.buildSpids),
      mediaPaths: c.mediaPaths,
    });
  }

  // =========================================================================
  // SLIDE 6 · Morph #2 · 杂志感版面重组 (NO Opener!)
  // =========================================================================
  {
    const c = createSlideCtx();
    addBackgroundArt({
      shapes: c.shapes,
      getSp: c.getSp,
      mediaRid: c.useMedia(MEDIA.dq06Waves),
      scrimStops: [
        { pos: 0, hex: "0C1524", alpha: 24000 },
        { pos: 54000, hex: "0C1524", alpha: 36000 },
        { pos: 100000, hex: "0C1524", alpha: 64000 },
      ],
    });

    // Morphed elements from Slide 5 (t=0 immediately visible!)
    c.shapes.push(
      rectShapeXml({
        id: c.getSp(),
        name: "!!mag_pill_bg",
        x: 92,
        y: 68,
        w: 440,
        h: 38,
        rotDeg: 0,
        fillHex: T.accentHex,
        fillAlpha: 94000,
        radius: 19000,
      }),
      textBoxXml({
        id: c.getSp(),
        name: "s6_pill_txt",
        x: 108,
        y: 68,
        w: 408,
        h: 38,
        paragraphs: [{ runs: [{ text: "MORPH 02 · 斜标回正 × 主框拉立成柱", size: 10.5, color: "101B2E", bold: true, font: T.fontBody }] }],
        anchor: "ctr",
        padX: 0,
        padY: 0,
      }),
      presetGeomShapeXml({
        id: c.getSp(),
        name: "!!mag_orb",
        prst: "ellipse",
        x: 92,
        y: 590,
        w: 186,
        h: 186,
        fillHex: "15243A",
        fillAlpha: 72000,
        borderHex: T.accentHex,
        borderAlpha: 85000,
        borderW: 2.5,
      }),
      textBoxXml({
        id: c.getSp(),
        name: "s6_orb_cap",
        x: 108,
        y: 632,
        w: 154,
        h: 102,
        paragraphs: [
          { align: "ctr", spaceAfter: 4, runs: [{ text: "三速", size: 18, color: T.accentHex, bold: true, font: T.fontTitle }] },
          { align: "ctr", runs: [{ text: "同一画卷的透视芯", size: 10.5, color: T.titleHex, font: T.fontBody }] },
        ],
        anchor: "ctr",
        padX: 2,
        padY: 2,
      }),
      rectShapeXml({
        id: c.getSp(),
        name: "!!mag_main_bg",
        x: 948,
        y: 68,
        w: 560,
        h: 760,
        fillHex: "0E192B",
        fillAlpha: 86000,
        borderHex: T.accentHex,
        borderAlpha: 45000,
        borderW: 1,
        radius: 5000,
      }),
      textBoxXml({
        id: c.getSp(),
        name: "s6_head",
        x: 92,
        y: 132,
        w: 770,
        h: 188,
        paragraphs: [
          { spaceAfter: 8, runs: [{ text: "横框转纵柱，浪涛留给左边读诗", size: 32, color: T.titleHex, bold: true, font: T.fontTitle }] },
          { linePct: 132000, runs: [{ text: "主容器原地拉高迁居右侧变成展陈纵柱；原本偏斜的标题胶囊拧回水平，带着视角切向深蓝涌浪。", size: 12.5, color: "D1DCE9", font: T.fontBody }] },
        ],
        padX: 0,
        padY: 0,
      })
    );

    // Click 1: 3 stacked tenets inside the morphed vertical right column (x: 978..1478)
    const t1 = addDaiqingCard(c, "s6_t1", {
      x: 976,
      y: 104,
      w: 504,
      h: 212,
      kicker: "01 / 角度回正",
      title: "微倾标签拧回 0°，瞬时换挡叙事状态",
      body: "入场用倾斜制造破风张力，推镜抚平即刻回归秩序与高级杂志栏式结构。",
      bgHex: "15243A",
      bgAlpha: 72000,
      barSide: "top",
    });
    const t2 = addDaiqingCard(c, "s6_t2", {
      x: 976,
      y: 342,
      w: 504,
      h: 212,
      kicker: "02 / 容器拉伸",
      title: "横向画框拉伸成展陈长柱",
      body: "无需重新画线设框，借平滑缩放让同一块磨砂深蓝底自动担纲侧边目录。",
      accentHex: T.secondaryHex,
      bgHex: "15243A",
      bgAlpha: 72000,
      barSide: "top",
    });
    const t3 = addDaiqingCard(c, "s6_t3", {
      x: 976,
      y: 580,
      w: 504,
      h: 212,
      kicker: "03 / 腾出左境",
      title: "大片浪涌无遮无挡，情绪直给镜头",
      body: "短视频竖裁或宽屏播放时，左侧波峰翻涌与光晕都能成为最稳画面底气。",
      accentHex: "C4934A",
      bgHex: "15243A",
      bgAlpha: 72000,
      barSide: "top",
    });

    // Click 2: Poetic callout gliding right beside golden orb
    const quoteCard = addDaiqingCard(c, "s6_quote", {
      x: 304,
      y: 616,
      w: 560,
      h: 136,
      kicker: "杂志级节拍总结",
      title: "字随浪涌动，框按景深收",
      body: "一次平推重排，胜过十张生硬切换的拼贴图。",
      titleSize: 16.5,
      bodySize: 11.5,
      bgAlpha: 78000,
    });

    const steps = [
      makeClickStep(c, 1, [
        ...t1.map((id, i) => ({ spid: id, delay: i * 35, durMs: 500, wipeDir: "right", pathStr: null })),
        ...t2.map((id, i) => ({ spid: id, delay: 160 + i * 35, durMs: 500, wipeDir: "right", pathStr: null })),
        ...t3.map((id, i) => ({ spid: id, delay: 320 + i * 35, durMs: 500, wipeDir: "right", pathStr: null })),
      ]),
      makeClickStep(
        c,
        2,
        quoteCard.map((id, i) => ({ spid: id, delay: i * 35, durMs: 580, pathStr: "M -0.05 0 L 0 0 E" }))
      ),
    ];

    slides.push({
      bgColor: T.bgHex,
      shapesXml: c.shapes.join("\n"),
      timingXml: wrapMainTiming(c.ids, steps.join(""), c.buildSpids),
      transitionXml: morphTransitionXml(),
      mediaPaths: c.mediaPaths,
    });
  }

  // =========================================================================
  // SLIDE 7 · 柔光碎纸 × 三栏指标从水面聚升 (fists softMode)
  // =========================================================================
  {
    const c = createSlideCtx();
    addBackgroundArt({
      shapes: c.shapes,
      getSp: c.getSp,
      mediaRid: c.useMedia(MEDIA.dq05Peaks),
      scrimStops: [
        { pos: 0, hex: "0C1524", alpha: 52000 },
        { pos: 45000, hex: "0C1524", alpha: 18000 },
        { pos: 100000, hex: "0C1524", alpha: 52000 },
      ],
    });

    const heroPars = addHeroBlock(c, {
      x: 92,
      y: 56,
      w: 880,
      sealChar: "柒",
      kicker: "OPENING 05 · 柔光碎纸散墨 × 寒江三柱数据排版",
      titleLines: ["碎影聚光，山尖留给青天"],
      subtext: "十六块实景碎片柔和化开青金雾霭，所有数字指标下沉水波间，绝不挡住重岩峻岭。",
      enterDelay: 520,
      titleSize: 30,
    });

    const pillarSpecs = [
      {
        name: "s7_m1",
        x: 92,
        num: "16 枚碎片",
        kicker: "碎屏物理切片",
        body: "整幅封面图被精准映射进十六道不规则多边形，四散飞出如墨烟绽裂。",
        note: "柔光模式下褪去戾气，独留青夜冷韵",
        accent: T.accentHex,
      },
      {
        name: "s7_m2",
        x: 584,
        num: "3 层速差",
        kicker: "视差景深结构",
        body: "远慢、中稳、近快三条运动轨迹共存同页，一点击就拉出纵深感。",
        note: "主框不跟背景抢风头，靠磨砂微透呼吸",
        accent: T.secondaryHex,
      },
      {
        name: "s7_m3",
        x: 1076,
        num: "5 组推镜",
        kicker: "无缝转场闭环",
        body: "同类对象以双叹号同名锚定，转页时自带顺滑迁移、旋转与放大。",
        note: "竖横自如变阵，一直贯穿至晨曦长卷",
        accent: "C4934A",
      },
    ];

    const mCards = [];
    const mNotes = [];
    pillarSpecs.forEach((ps) => {
      const cardSp = addDaiqingCard(c, ps.name, {
        x: ps.x,
        y: 468,
        w: 432,
        h: 224,
        kicker: ps.kicker,
        title: ps.num,
        body: ps.body,
        accentHex: ps.accent,
        barSide: "top",
        titleSize: 23,
        bodySize: 11.4,
      });
      mCards.push(cardSp);

      const noteSp = addDaiqingCard(c, `${ps.name}_note`, {
        x: ps.x,
        y: 706,
        w: 432,
        h: 74,
        kicker: "",
        title: ps.note,
        accentHex: ps.accent,
        bgHex: "15253E",
        bgAlpha: 86000,
        titleSize: 12.2,
      });
      mNotes.push(noteSp);
    });

    const rigPars = addShardPunchOpeningRig({
      shapes: c.shapes,
      buildSpids: c.buildSpids,
      ids: c.ids,
      getSp: c.getSp,
      theme: "daiqing-ink-gold",
      coverMediaRid: c.useMedia(MEDIA.daiqingCover),
      splashMediaRid: c.useMedia(MEDIA.softGoldMist),
      splashAltMediaRid: c.useMedia(MEDIA.softIndigoMist),
      softMode: true,
      autoDelay: 90,
    });

    const steps = [
      wrapStepGroup(c.ids, [...rigPars, ...heroPars].join(""), 0),
      makeClickStep(
        c,
        2,
        mCards.flatMap((spids, cIdx) => spids.map((id, i) => ({ spid: id, delay: cIdx * 95 + i * 25, durMs: 560, pathStr: "M 0 0.06 L 0 0 E" })))
      ),
      makeClickStep(
        c,
        3,
        mNotes.flatMap((spids, cIdx) => spids.map((id, i) => ({ spid: id, delay: cIdx * 85 + i * 25, durMs: 480, wipeDir: "right", pathStr: null })))
      ),
    ];

    slides.push({
      bgColor: T.bgHex,
      shapesXml: c.shapes.join("\n"),
      timingXml: wrapMainTiming(c.ids, steps.join(""), c.buildSpids),
      mediaPaths: c.mediaPaths,
    });
  }

  // =========================================================================
  // SLIDE 8 · 云散金粉 × 水平演进轴 (Prepares Horizontal->Vertical Timeline Morph #3!)
  // =========================================================================
  {
    const c = createSlideCtx();
    addBackgroundArt({
      shapes: c.shapes,
      getSp: c.getSp,
      mediaRid: c.useMedia(MEDIA.dq04Skiff),
      scrimStops: [
        { pos: 0, hex: "0C1524", alpha: 54000 },
        { pos: 55000, hex: "0C1524", alpha: 24000 },
        { pos: 100000, hex: "0C1524", alpha: 48000 },
      ],
    });

    const heroPars = addHeroBlock(c, {
      x: 92,
      y: 58,
      w: 940,
      kicker: "OPENING 06 · 云散金粉 × 横纵推镜前站",
      titleLines: ["一叶轻舟，先横列再竖立"],
      subtext: "三张横排演进卡沿水面平铺展开；下一步进入第九幕时，它们将整组飞转排成垂直时间轴。",
      enterDelay: 500,
      titleSize: 30,
    });

    // Horizontal Spine Morph Anchor !!p_axis (rotates/stretches into vertical spine in Slide 9!)
    // Placed cleanly at y=672 BELOW the lone horizon skiff so boat & peaks stay 100% open!
    const axisId = c.getSp();
    c.shapes.push(
      rectShapeXml({
        id: axisId,
        name: "!!p_axis",
        x: 92,
        y: 672,
        w: 1416,
        h: 3.5,
        fillHex: T.accentHex,
        fillAlpha: 88000,
      })
    );
    c.buildSpids.push(axisId);

    // Exact shared !!p1, !!p2, !!p3 cards migrating intact from Horizontal Row (S8) -> Vertical Waterfall (S9)!
    const pDefs = [
      { key: "p1", x: 92, accent: T.accentHex, kicker: "PHASE 01 · 起势", title: "破局开卷 · 先声夺人", sub: "斜刀、帷幔与纸鹤建立首印象" },
      { key: "p2", x: 588, accent: T.secondaryHex, kicker: "PHASE 02 · 运镜", title: "聚散变阵 · 讲哪亮哪", sub: "点击逐步递进，绝不透支信息" },
      { key: "p3", x: 1084, accent: "C4934A", kicker: "PHASE 03 · 落定", title: "留白成诗 · 平滑收卷", sub: "横牌跨页腾空跃入竖向长廊" },
    ];

    const pCards = [];
    pDefs.forEach((pd) => {
      const spids = addDaiqingCard(c, pd.key, {
        x: pd.x,
        y: 694,
        w: 424,
        h: 158,
        kicker: pd.kicker,
        title: pd.title,
        body: pd.sub,
        accentHex: pd.accent,
        barSide: "top",
        titleSize: 15.5,
        bodySize: 11.2,
        prefixMorph: true,
      });
      pCards.push(spids);
    });

    // Click 2 sleek anticipatory upper-right pill (leaving entire mountain lake & skiff clear!)
    const flyBanner = addDaiqingCard(c, "s8_fly_banner", {
      x: 1044,
      y: 66,
      w: 464,
      h: 72,
      kicker: "MORPH 准备就绪",
      title: "→ 下一页：三卡凌空腾飞转竖轴",
      accentHex: T.accentHex,
      bgHex: "15253E",
      bgAlpha: 90000,
      titleSize: 13.5,
    });

    const rigPars = addEmberDissolveOpeningRig({
      shapes: c.shapes,
      buildSpids: c.buildSpids,
      ids: c.ids,
      getSp: c.getSp,
      theme: "daiqing-ink-gold",
      coverMediaRid: c.useMedia(MEDIA.xuanCover),
      splashMediaRid: c.useMedia(MEDIA.softGoldMist),
      autoDelay: 90,
    });

    const steps = [
      wrapStepGroup(c.ids, [...rigPars, ...heroPars].join(""), 0),
      makeClickStep(c, 2, [
        { spid: axisId, delay: 0, durMs: 680, wipeDir: "right", pathStr: null },
        ...pCards.flatMap((spids, cIdx) => spids.map((id, i) => ({ spid: id, delay: 110 + cIdx * 95 + i * 25, pathStr: "M 0 0.04 L 0 0 E" }))),
      ]),
      makeClickStep(
        c,
        3,
        flyBanner.map((id, i) => ({ spid: id, delay: i * 35, wipeDir: "right", pathStr: null }))
      ),
    ];

    slides.push({
      bgColor: T.bgHex,
      shapesXml: c.shapes.join("\n"),
      timingXml: wrapMainTiming(c.ids, steps.join(""), c.buildSpids),
      mediaPaths: c.mediaPaths,
    });
  }

  // =========================================================================
  // SLIDE 9 · Morph #3 · 横轴直接飞转成右侧阶梯瀑布时间轴 (NO Opener!)
  // =========================================================================
  {
    const c = createSlideCtx();
    addBackgroundArt({
      shapes: c.shapes,
      getSp: c.getSp,
      mediaRid: c.useMedia(MEDIA.dq07Bridge),
      scrimStops: [
        { pos: 0, hex: "0C1524", alpha: 24000 },
        { pos: 46000, hex: "0C1524", alpha: 38000 },
        { pos: 100000, hex: "0C1524", alpha: 70000 },
      ],
    });

    // Left poetic title resting calmly in upper-left sky above stone arch bridge!
    addHeroBlock(c, {
      x: 84,
      y: 56,
      w: 630,
      kicker: "MORPH 03 · 横轴瞬转纵轴瀑布流",
      titleLines: ["横行三牌，凌空改列成梯"],
      subtext: "石桥与松枝从容呼吸，三张横牌跨页飞跃至此，化为右翼错落时间轴。",
      visibleInitially: true,
      titleSize: 28,
    });

    // Vertical Spine Anchor !!p_axis pivoted from horizontal (1416x3.5) -> vertical spine!
    c.shapes.push(
      rectShapeXml({
        id: c.getSp(),
        name: "!!p_axis",
        x: 808,
        y: 104,
        w: 3.5,
        h: 690,
        fillHex: T.accentHex,
        fillAlpha: 88000,
      })
    );

    // Exact shared !!p1, !!p2, !!p3 cards landed into staggered right waterfall steps (x=838, 878, 918)!
    const vDefs = [
      {
        key: "p1",
        x: 838,
        y: 98,
        accent: T.accentHex,
        kicker: "PHASE 01 · 起势",
        title: "破局开卷 · 先声夺人",
        sub: "斜刀、帷幔与纸鹤建立首印象",
        extNote: "→ 视觉开场统一采用低饱和暮蓝金粉，杜绝刺眼红框。",
      },
      {
        key: "p2",
        x: 878,
        y: 342,
        accent: T.secondaryHex,
        kicker: "PHASE 02 · 运镜",
        title: "聚散变阵 · 讲哪亮哪",
        sub: "点击逐步递进，绝不透支信息",
        extNote: "→ 横排卡片飞迁后每格错开 40px 缩进，立体秩序立现。",
      },
      {
        key: "p3",
        x: 918,
        y: 586,
        accent: "C4934A",
        kicker: "PHASE 03 · 落定",
        title: "留白成诗 · 平滑收卷",
        sub: "横牌跨页腾空跃入竖向长廊",
        extNote: "→ 底层石桥与雾松从容呼吸，版面主宾清清楚楚。",
      },
    ];

    const dotSpids = [];
    const extCards = [];
    vDefs.forEach((vd) => {
      addDaiqingCard(c, vd.key, {
        x: vd.x,
        y: vd.y,
        w: 584,
        h: 158,
        kicker: vd.kicker,
        title: vd.title,
        body: vd.sub,
        accentHex: vd.accent,
        barSide: "top",
        titleSize: 15.5,
        bodySize: 11.2,
        visibleInitially: true,
        prefixMorph: true,
      });

      const dotId = c.getSp();
      c.shapes.push(
        presetGeomShapeXml({
          id: dotId,
          name: `s9_dot_${vd.key}`,
          prst: "diamond",
          x: 799,
          y: vd.y + 68,
          w: 22,
          h: 22,
          fillHex: vd.accent,
          fillAlpha: 96000,
          borderHex: "FBF5E6",
          borderAlpha: 80000,
          borderW: 1,
        })
      );
      c.buildSpids.push(dotId);
      dotSpids.push(dotId);

      const ext = addDaiqingCard(c, `s9_ext_${vd.key}`, {
        x: vd.x,
        y: vd.y + 166,
        w: 584,
        h: 50,
        kicker: "",
        title: vd.extNote,
        accentHex: vd.accent,
        bgHex: "15253E",
        bgAlpha: 84000,
        titleSize: 11.5,
      });
      extCards.push(ext);
    });

    const bridgeNote = addDaiqingCard(c, "s9_bridge_note", {
      x: 84,
      y: 718,
      w: 590,
      h: 92,
      kicker: "瀑布时间轴结语",
      title: "跨页飞迁不丢重心，横版一秒切换成汇报纵轴",
      body: "",
      titleSize: 14.5,
      bgAlpha: 78000,
    });

    const steps = [
      makeClickStep(c, 1, [
        ...dotSpids.map((id, i) => ({ spid: id, delay: i * 110, scaleFromX: 20, scaleFromY: 20, scaleToX: 100, scaleToY: 100, pathStr: null })),
        ...extCards.flatMap((spids, cIdx) => spids.map((id, i) => ({ spid: id, delay: 90 + cIdx * 110 + i * 25, wipeDir: "right", pathStr: null }))),
      ]),
      makeClickStep(
        c,
        2,
        bridgeNote.map((id, i) => ({ spid: id, delay: i * 35, pathStr: "M -0.05 0 L 0 0 E" }))
      ),
    ];

    slides.push({
      bgColor: T.bgHex,
      shapesXml: c.shapes.join("\n"),
      timingXml: wrapMainTiming(c.ids, steps.join(""), c.buildSpids),
      transitionXml: morphTransitionXml(),
      mediaPaths: c.mediaPaths,
    });
  }

  // =========================================================================
  // SLIDE 10 · 揉团抛飞 × 右侧明暗压幕 Bento 对比 + 预告破晓 (crumple)
  // =========================================================================
  {
    const c = createSlideCtx();
    addBackgroundArt({
      shapes: c.shapes,
      getSp: c.getSp,
      mediaRid: c.useMedia(MEDIA.dq10LeftPeaks),
      // Right mist gets rich indigo gradient scrim so right-side cards & hero sub gleam high-contrast while left peaks breathe free!
      scrimStops: [
        { pos: 0, hex: "0C1524", alpha: 12000 },
        { pos: 42000, hex: "0C1524", alpha: 54000 },
        { pos: 100000, hex: "0C1524", alpha: 86000 },
      ],
    });

    const heroPars = addHeroBlock(c, {
      x: 790,
      y: 54,
      w: 718,
      sealChar: "拾",
      kicker: "OPENING 07 · 揉团抛飞 × 暮色 Bento 宣言",
      titleLines: ["旧页揉碎丢去，右翼立起新章"],
      subtext: "十四面立体纸团捏紧甩出幕外，右半浅雾借渐暗蓝幕承托高亮 Bento 卡片群。",
      enterDelay: 560,
      titleSize: 28,
    });

    const bTop = addDaiqingCard(c, "s10_btop", {
      x: 790,
      y: 236,
      w: 718,
      h: 162,
      kicker: "核心观念",
      title: "把静态排版揉碎：为什么会动的字才更吸睛？",
      body: "短视频前 3 秒拼节奏，讲台演示拼专注；让文字像墨迹般按序落纸，每一页都值一个点赞与停驻。",
      barSide: "top",
      titleSize: 16.5,
      bodySize: 11.5,
    });
    const bLeft = addDaiqingCard(c, "s10_bl", {
      x: 790,
      y: 416,
      w: 348,
      h: 176,
      kicker: "法门 A · 删繁",
      title: "一页只讲两组动作",
      body: "入场留惊喜，退场不恋战。",
      accentHex: T.secondaryHex,
      barSide: "top",
      titleSize: 15,
    });
    const bRight = addDaiqingCard(c, "s10_br", {
      x: 1160,
      y: 416,
      w: 348,
      h: 176,
      kicker: "法门 B · 贴山",
      title: "右重左轻各安其位",
      body: "峻岭留左手，卡片稳居深幕。",
      accentHex: "C4934A",
      barSide: "top",
      titleSize: 15,
    });

    // Temp bar that EXITS downward on Click 2 -> Dawn bridge pill wipes right in!
    const tempHint = addDaiqingCard(c, "s10_temp", {
      x: 790,
      y: 616,
      w: 718,
      h: 82,
      kicker: "",
      title: "暮夜即将走到尽头 · 再点一下唤醒破晓提示",
      accentHex: T.crimsonHex,
      bgHex: "15253E",
      titleSize: 13.5,
    });
    const dawnPill = addDaiqingCard(c, "s10_dawn_pill", {
      x: 960,
      y: 620,
      w: 548,
      h: 74,
      kicker: "",
      title: "东方微白 · 下一幕转场迈向青绿破晓长卷 →",
      accentHex: T.accentHex,
      bgHex: "1C2E49",
      bgAlpha: 94000,
      borderAlpha: 72000,
      titleSize: 13.5,
    });

    const rigPars = addPaperCrumpleTossOpeningRig({
      shapes: c.shapes,
      buildSpids: c.buildSpids,
      ids: c.ids,
      getSp: c.getSp,
      theme: "daiqing-ink-gold",
      coverMediaRid: c.useMedia(MEDIA.daiqingCover),
      autoDelay: 90,
    });

    const click2Pars = [
      ...tempHint.map((id, i) =>
        buildExitEffectPar(c.ids, {
          spid: id,
          nodeType: i === 0 ? "clickEffect" : "withEffect",
          grpId: 3,
          delayMs: 0,
          durMs: 520,
          pathStr: "M 0 0 L 0 0.14 E",
          ptsTypes: "AA",
          fadeFraction: 0.45,
          accel: 60000,
          decel: 12000,
        })
      ),
      ...dawnPill.map((id, i) =>
        buildEntrEffectPar(c.ids, {
          spid: id,
          nodeType: "withEffect",
          grpId: 3,
          delayMs: 220 + i * 35,
          durMs: 560,
          fadeMs: 320,
          wipeDir: "right",
          pathStr: null,
        })
      ),
    ];

    const steps = [
      wrapStepGroup(c.ids, [...rigPars, ...heroPars].join(""), 0),
      makeClickStep(c, 2, [
        ...bTop.map((id, i) => ({ spid: id, delay: i * 30, pathStr: "M 0.06 0 L 0 0 E" })),
        ...bLeft.map((id, i) => ({ spid: id, delay: 110 + i * 30, pathStr: "M 0.04 0.03 L 0 0 E" })),
        ...bRight.map((id, i) => ({ spid: id, delay: 160 + i * 30, pathStr: "M 0.04 0.03 L 0 0 E" })),
        ...tempHint.map((id, i) => ({ spid: id, delay: 230 + i * 25, pathStr: "M 0 0.03 L 0 0 E" })),
      ]),
      wrapStepGroup(c.ids, click2Pars.join(""), "indefinite"),
    ];

    slides.push({
      bgColor: T.bgHex,
      shapesXml: c.shapes.join("\n"),
      timingXml: wrapMainTiming(c.ids, steps.join(""), c.buildSpids),
      mediaPaths: c.mediaPaths,
    });
  }

  // =========================================================================
  // SLIDE 11 · 暮蓝收束 × 激光破晓引 × 印章归心 (Prepares Morph #4!)
  // =========================================================================
  {
    const c = createSlideCtx();
    addBackgroundArt({
      shapes: c.shapes,
      getSp: c.getSp,
      mediaRid: c.useMedia(MEDIA.dq11TwilightRiver),
      scrimStops: [
        { pos: 0, hex: "0A1322", alpha: 36000 },
        { pos: 50000, hex: "0A1322", alpha: 42000 },
        { pos: 100000, hex: "0A1322", alpha: 52000 },
      ],
    });

    const headId = c.getSp();
    c.shapes.push(
      textBoxXml({
        id: headId,
        name: "s11_head",
        x: 110,
        y: 96,
        w: 1100,
        h: 96,
        paragraphs: [
          { spaceAfter: 6, runs: [{ text: "CLOSING PRELUDE · 暮夜归寂 · 东方欲明", size: 11.5, color: T.accentHex, bold: true, font: T.fontBody }] },
          { runs: [{ text: "暮蓝将尽，且看东方破晓成卷", size: 32, color: T.titleHex, bold: true, font: T.fontTitle }] },
        ],
        padX: 0,
        padY: 0,
      })
    );
    c.buildSpids.push(headId);

    const autoLaserPars = addLaserSweepGroup(c, {
      x: 110,
      y: 126,
      textW: 540,
      h: 72,
      grpId: 1,
      delayMs: 280,
      targetSpid: headId,
    });

    // Click 1: Left & Right contrast cards (both exit cleanly on Click 2!) + Centered Crimson Seal !!dawn_seal
    const leftCard = addDaiqingCard(c, "s11_left", {
      x: 110,
      y: 256,
      w: 660,
      h: 248,
      kicker: "上篇回顾 · 一至十幕",
      title: "七绝入场 × 三大动态文字排版心法",
      body: "斜刀、帷幔、左鹤、狂风、柔光碎纸、云散金粉、揉团抛飞统一采用黛青柔金肤色；配合游标扫字、三速视差与对冲退场，页页灵动。",
      barSide: "top",
      titleSize: 17,
      bodySize: 11.8,
    });
    const rightCard = addDaiqingCard(c, "s11_right", {
      x: 830,
      y: 256,
      w: 660,
      h: 248,
      kicker: "终章预告 · 十二至十三幕",
      title: "水墨长卷破晓：画外飞燕抽棍入江图",
      body: "再点一下清掉两侧框架，只留正中红印——下一页平滑推镜刹那，暖白宣纸与青绿山水将连同孤舟、飞燕一起绽开。",
      accentHex: T.secondaryHex,
      barSide: "top",
      titleSize: 17,
      bodySize: 11.8,
    });

    // Persistent Morph Seal !!dawn_seal (carries intact across Slides 11 -> 12 -> 13!)
    const sealBg = c.getSp();
    const sealTxt = c.getSp();
    c.shapes.push(
      rectShapeXml({
        id: sealBg,
        name: "!!dawn_seal_bg",
        x: 661,
        y: 598,
        w: 278,
        h: 48,
        fillHex: "9E3426",
        fillAlpha: 96000,
        borderHex: T.accentHex,
        borderAlpha: 65000,
        borderW: 1,
        radius: 4000,
      }),
      textBoxXml({
        id: sealTxt,
        name: "!!dawn_seal_txt",
        x: 661,
        y: 598,
        w: 278,
        h: 48,
        paragraphs: [{ align: "ctr", runs: [{ text: "一动一静 · 泼墨成章", size: 13.5, color: "FAF5EB", bold: true, font: "KaiTi" }] }],
        anchor: "ctr",
        padX: 4,
        padY: 4,
      })
    );
    c.buildSpids.push(sealBg, sealTxt);

    const whisperId = c.getSp();
    c.shapes.push(
      textBoxXml({
        id: whisperId,
        name: "s11_whisper",
        x: 420,
        y: 672,
        w: 760,
        h: 44,
        paragraphs: [{ align: "ctr", runs: [{ text: "↓ 下一页：红印上移入局，画卷正式破晓", size: 12.5, color: T.accentHex, bold: true, font: T.fontBody }] }],
        anchor: "ctr",
        padX: 0,
        padY: 0,
      })
    );
    c.buildSpids.push(whisperId);

    const click2Pars = [
      ...leftCard.map((id, i) =>
        buildExitEffectPar(c.ids, {
          spid: id,
          nodeType: i === 0 ? "clickEffect" : "withEffect",
          grpId: 3,
          delayMs: 0,
          durMs: 650,
          pathStr: "M 0 0 L -0.55 0 E",
          ptsTypes: "AA",
          fadeFraction: 0.45,
          accel: 65000,
        })
      ),
      ...rightCard.map((id) =>
        buildExitEffectPar(c.ids, {
          spid: id,
          nodeType: "withEffect",
          grpId: 3,
          delayMs: 30,
          durMs: 650,
          pathStr: "M 0 0 L 0.55 0 E",
          ptsTypes: "AA",
          fadeFraction: 0.45,
          accel: 65000,
        })
      ),
      buildEntrEffectPar(c.ids, {
        spid: whisperId,
        nodeType: "withEffect",
        grpId: 3,
        delayMs: 260,
        durMs: 560,
        fadeMs: 360,
        pathStr: "M 0 0.03 L 0 0 E",
        ptsTypes: "AA",
      }),
    ];

    const steps = [
      wrapStepGroup(c.ids, autoLaserPars.join(""), 0),
      makeClickStep(c, 2, [
        ...leftCard.map((id, i) => ({ spid: id, delay: i * 25, pathStr: "M -0.05 0 L 0 0 E" })),
        ...rightCard.map((id, i) => ({ spid: id, delay: 90 + i * 25, pathStr: "M 0.05 0 L 0 0 E" })),
        { spid: sealBg, delay: 220, durMs: 520, scaleFromX: 70, scaleFromY: 70, scaleToX: 100, scaleToY: 100, pathStr: null },
        { spid: sealTxt, delay: 220, durMs: 520, scaleFromX: 70, scaleFromY: 70, scaleToX: 100, scaleToY: 100, pathStr: null },
      ]),
      wrapStepGroup(c.ids, click2Pars.join(""), "indefinite"),
    ];

    slides.push({
      bgColor: T.bgHex,
      shapesXml: c.shapes.join("\n"),
      timingXml: wrapMainTiming(c.ids, steps.join(""), c.buildSpids),
      transitionXml: `<p:transition spd="med" advClick="1"><p:fade/></p:transition>`,
      mediaPaths: c.mediaPaths,
    });
  }

  // =========================================================================
  // SLIDE 12 · Morph #4 破晓高潮 ·《泼墨长卷》画外入戏 & 持棍送燕抽棍退场
  // =========================================================================
  {
    const c = createSlideCtx();
    const bgRid = c.useMedia(MEDIA.splashMtns);
    const wavesRid = c.useMedia(MEDIA.splashWaves);
    const skiffRid = c.useMedia(MEDIA.splashSkiff);
    const rodRid = c.useMedia(MEDIA.splashRod);
    const swallowsRid = c.useMedia(MEDIA.splashSwallows);
    const reedsRid = c.useMedia(MEDIA.splashReeds);

    c.shapes.push(picXml({ id: c.getSp(), name: "s12_bg", rId: bgRid, x: 0, y: 0, w: 1600, h: 900 }));

    // Morph Seal glides from Slide 11 center (661, 598) -> upper-left sky (78, 52)!
    c.shapes.push(
      rectShapeXml({
        id: c.getSp(),
        name: "!!dawn_seal_bg",
        x: 78,
        y: 52,
        w: 278,
        h: 48,
        fillHex: "9E3426",
        fillAlpha: 96000,
        radius: 4000,
      }),
      textBoxXml({
        id: c.getSp(),
        name: "!!dawn_seal_txt",
        x: 78,
        y: 52,
        w: 278,
        h: 48,
        paragraphs: [{ align: "ctr", runs: [{ text: "一动一静 · 泼墨成章", size: 13.5, color: "FAF5EB", bold: true, font: "KaiTi" }] }],
        anchor: "ctr",
        padX: 4,
        padY: 4,
      })
    );

    // Header top-right Xuan clean sky (x: 940..1512)
    c.shapes.push(
      textBoxXml({
        id: c.getSp(),
        name: "s12_header",
        x: 948,
        y: 44,
        w: 564,
        h: 102,
        paragraphs: [
          { spaceAfter: 4, runs: [{ text: "CLIMAX · 破晓入卷 × 画外运动物理", size: 11, color: "9E3426", bold: true, font: "Microsoft YaHei" }] },
          { runs: [{ text: "江涌、船行、持棍送燕平滑入局", size: 22.5, color: "14181F", bold: true, font: "KaiTi" }] },
        ],
        padX: 4,
        padY: 2,
      })
    );

    // Click 1: Flowing river waves + Card 1 (x=948, y=156)
    const wavesId = c.getSp();
    c.shapes.push(picXml({ id: wavesId, name: "s12_waves", rId: wavesRid, x: 55, y: 508, w: 1500, h: 495, alpha: 94000 }));
    c.buildSpids.push(wavesId);

    const card1 = addWarmXuanCard(c, "s12_c1", {
      x: 948,
      y: 158,
      w: 560,
      h: 98,
      kicker: "01 / 独立成层 · 画外滑入",
      title: "江浪自幕外长驱直入，水势带动视线",
      body: "先孤立水纹、舟船、枝燕，摆脱整页死板图框。",
      accentHex: "9E3426",
    });

    // Click 2: Morph Skiff + Rod (610x610) & Swallows (410x410) moving together upright from left sky -> (690, 238) + Card 2
    const skiffId = c.getSp();
    c.shapes.push(picXml({ id: skiffId, name: "!!dawn_skiff", rId: skiffRid, x: 290, y: 498, w: 610, h: 300 }));
    c.buildSpids.push(skiffId);

    // Aligned shadow-puppet rod & swallows assembly center = (690, 238) -> clear center sky, zero collision with x=948 cards!
    const rodId = c.getSp();
    c.shapes.push(picXml({ id: rodId, name: "s12_rod", rId: rodRid, x: 385, y: -67, w: 610, h: 610 }));
    c.buildSpids.push(rodId);

    const swallowsId = c.getSp();
    c.shapes.push(picXml({ id: swallowsId, name: "!!dawn_swallows", rId: swallowsRid, x: 485, y: 33, w: 410, h: 410 }));
    c.buildSpids.push(swallowsId);

    const card2 = addWarmXuanCard(c, "s12_c2", {
      x: 948,
      y: 272,
      w: 560,
      h: 98,
      kicker: "02 / 持棍引燕 · 落定抽棍",
      title: "木棍平托双燕滑入天际，落定后垂直抽棍",
      body: "燕群与木棍顺势平移定格，到位后木棍独自向下抽离。",
      accentHex: "2B6860",
    });

    // Click 3: Foreground bottom-left reeds + Card 3
    const reedsId = c.getSp();
    c.shapes.push(picXml({ id: reedsId, name: "s12_reeds", rId: reedsRid, x: 14, y: 630, w: 262, h: 274 }));
    c.buildSpids.push(reedsId);

    const card3 = addWarmXuanCard(c, "s12_c3", {
      x: 948,
      y: 386,
      w: 560,
      h: 98,
      kicker: "03 / 前景升起 · 准备终章推镜",
      title: "芦苇衬景压稳边角，下一幕整幅合龙",
      body: "孤舟与群燕同名保留，跨页即平滑落入收卷构图。",
      accentHex: "B27C36",
    });

    // Natural upright shadow-puppet glide: holds rod + swallows rigid together from left-mid sky to center (zero rotation)
    const puppetGlidePath = "M -0.58 0.24 C -0.34 0.12 -0.14 0.03 0 0 E";
    const puppetGlidePts = "AFFA";

    const click2Pars = [
      buildEntrEffectPar(c.ids, {
        spid: skiffId,
        nodeType: "clickEffect",
        grpId: 2,
        delayMs: 0,
        durMs: 1320,
        fadeMs: 420,
        pathStr: "M 0.85 0.05 C 0.52 0.01 0.22 -0.02 0 0 E",
        ptsTypes: "AFFA",
        decel: 82000,
      }),
      buildEntrEffectPar(c.ids, {
        spid: rodId,
        nodeType: "withEffect",
        grpId: 2,
        delayMs: 140,
        durMs: 1200,
        fadeMs: 320,
        pathStr: puppetGlidePath,
        ptsTypes: puppetGlidePts,
        accel: 12000,
        decel: 82000,
      }),
      buildEntrEffectPar(c.ids, {
        spid: swallowsId,
        nodeType: "withEffect",
        grpId: 2,
        delayMs: 140,
        durMs: 1200,
        fadeMs: 320,
        pathStr: puppetGlidePath,
        ptsTypes: puppetGlidePts,
        accel: 12000,
        decel: 82000,
      }),
      buildExitEffectPar(c.ids, {
        spid: rodId,
        nodeType: "withEffect",
        grpId: 2,
        delayMs: 1540,
        durMs: 650,
        pathStr: "M 0 0 L -0.06 0.44 E",
        ptsTypes: "AA",
        fadeFraction: 0.56,
        accel: 55000,
        decel: 15000,
      }),
      ...card2.map((id, i) =>
        buildEntrEffectPar(c.ids, {
          spid: id,
          nodeType: "withEffect",
          grpId: 2,
          delayMs: 260 + i * 30,
          durMs: 540,
          fadeMs: 340,
          pathStr: "M 0.05 0 L 0 0 E",
          ptsTypes: "AA",
        })
      ),
    ];

    const steps = [
      makeClickStep(c, 1, [
        { spid: wavesId, delay: 0, durMs: 1180, fadeMs: 480, pathStr: "M 0.92 0.02 C 0.55 -0.01 0.25 0.01 0 0 E", ptsTypes: "AFFA", decel: 80000 },
        ...card1.map((id, i) => ({ spid: id, delay: 220 + i * 30, pathStr: "M 0.05 0 L 0 0 E" })),
      ]),
      wrapStepGroup(c.ids, click2Pars.join(""), "indefinite"),
      makeClickStep(c, 3, [
        { spid: reedsId, delay: 0, durMs: 820, fadeMs: 380, pathStr: "M 0 0.16 L 0 0 E", ptsTypes: "AA", decel: 78000 },
        ...card3.map((id, i) => ({ spid: id, delay: 140 + i * 30, pathStr: "M 0.05 0 L 0 0 E" })),
      ]),
    ];

    slides.push({
      bgColor: "FAF5EA",
      shapesXml: c.shapes.join("\n"),
      timingXml: wrapMainTiming(c.ids, steps.join(""), c.buildSpids),
      transitionXml: morphTransitionXml(),
      mediaPaths: c.mediaPaths,
    });
  }

  // =========================================================================
  // SLIDE 13 · Morph #5 全篇闭幕定格 · 三步收藏清单
  // =========================================================================
  {
    const c = createSlideCtx();
    const bgRid = c.useMedia(MEDIA.splashMtns);
    const wavesRid = c.useMedia(MEDIA.splashWaves);
    const skiffRid = c.useMedia(MEDIA.splashSkiff);
    const swallowsRid = c.useMedia(MEDIA.splashSwallows);

    c.shapes.push(
      picXml({ id: c.getSp(), name: "s13_bg", rId: bgRid, x: 0, y: 0, w: 1600, h: 900, alpha: 92000 }),
      picXml({ id: c.getSp(), name: "s13_waves", rId: wavesRid, x: 80, y: 540, w: 1460, h: 485, alpha: 78000 }),
      // Morph Anchors carried seamlessly across from Slide 12!
      picXml({ id: c.getSp(), name: "!!dawn_skiff", rId: skiffRid, x: 560, y: 538, w: 650, h: 320 }),
      picXml({ id: c.getSp(), name: "!!dawn_swallows", rId: swallowsRid, x: 96, y: 42, w: 410, h: 410 }),
      // !!dawn_seal lands bottom-left finale anchor!
      rectShapeXml({
        id: c.getSp(),
        name: "!!dawn_seal_bg",
        x: 78,
        y: 742,
        w: 278,
        h: 48,
        fillHex: "9E3426",
        fillAlpha: 96000,
        radius: 4000,
      }),
      textBoxXml({
        id: c.getSp(),
        name: "!!dawn_seal_txt",
        x: 78,
        y: 742,
        w: 278,
        h: 48,
        paragraphs: [{ align: "ctr", runs: [{ text: "一动一静 · 泼墨成章", size: 13.5, color: "FAF5EB", bold: true, font: "KaiTi" }] }],
        anchor: "ctr",
        padX: 4,
        padY: 4,
      }),
      // Finale Top-Right Hero Plate
      rectShapeXml({
        id: c.getSp(),
        name: "s13_head_bg",
        x: 682,
        y: 66,
        w: 826,
        h: 124,
        fillHex: "FCF8EF",
        fillAlpha: 93000,
        borderHex: "CBBFA8",
        borderAlpha: 72000,
        borderW: 1,
        radius: 4200,
      }),
      rectShapeXml({ id: c.getSp(), name: "s13_head_bar", x: 698, y: 82, w: 5, h: 92, fillHex: "9E3426" }),
      textBoxXml({
        id: c.getSp(),
        name: "s13_head_txt",
        x: 718,
        y: 76,
        w: 770,
        h: 106,
        paragraphs: [
          { spaceAfter: 4, runs: [{ text: "FINALE · 十三幕收卷闭环 · 今晚即可复用", size: 11, color: "9E3426", bold: true, font: "Microsoft YaHei" }] },
          { runs: [{ text: "七绝开局 × 会动的排版 × 五镜平滑收官", size: 24, color: "14181F", bold: true, font: "KaiTi" }] },
        ],
        anchor: "ctr",
        padX: 4,
        padY: 2,
      })
    );

    const k1 = addWarmXuanCard(c, "s13_k1", {
      x: 682,
      y: 212,
      w: 826,
      h: 96,
      title: "① 立住第一眼：七绝物理入场全统一到黛青金粉画风",
      body: "斜刀、帷幔、左出纸鹤、狂风、柔光碎纸、云散金粉、揉团抛飞皆原生可演，零刺眼弹窗。",
      accentHex: "9E3426",
    });
    const k2 = addWarmXuanCard(c, "s13_k2", {
      x: 682,
      y: 324,
      w: 826,
      h: 96,
      title: "② 点一下动一条：游标切字、三速视差、反向轰散各显神通",
      body: "不是整页僵硬平铺，而是随翻页节奏入场、聚焦或果断清退，屏屏有惊喜。",
      accentHex: "2B6860",
    });
    const k3 = addWarmXuanCard(c, "s13_k3", {
      x: 682,
      y: 436,
      w: 826,
      h: 96,
      title: "③ 一镜推到底：五组平滑过渡串起横竖变阵与破晓长卷",
      body: "同源元素跨页滑移缩放，从夜幕黛青丝滑迎来晨光水墨，完整高清导出便于展示。",
      accentHex: "B27C36",
    });

    const steps = [
      makeClickStep(c, 1, k1.map((id, i) => ({ spid: id, delay: i * 35, pathStr: "M 0.05 0 L 0 0 E" }))),
      makeClickStep(c, 2, k2.map((id, i) => ({ spid: id, delay: i * 35, pathStr: "M 0.05 0 L 0 0 E" }))),
      makeClickStep(c, 3, k3.map((id, i) => ({ spid: id, delay: i * 35, pathStr: "M 0.05 0 L 0 0 E" }))),
    ];

    slides.push({
      bgColor: "FAF5EA",
      shapesXml: c.shapes.join("\n"),
      timingXml: wrapMainTiming(c.ids, steps.join(""), c.buildSpids),
      transitionXml: morphTransitionXml(),
      mediaPaths: c.mediaPaths,
    });
  }

  return packagePptx({
    outPath: OUT_PPTX,
    slides,
    themeName: "DaiqingMorphTypographyShowcase",
    bgSchemeHex: T.bgHex,
    darkHex: "111C2D",
    lightHex: "F7F1E3",
  });
}

const stats = buildMasterShowcaseDeck();
console.log(
  "Generated:",
  stats.outPath,
  "Slides:",
  stats.slidesCount,
  "Media:",
  stats.mediaCount,
  "Bytes:",
  fs.statSync(stats.outPath).size
);
