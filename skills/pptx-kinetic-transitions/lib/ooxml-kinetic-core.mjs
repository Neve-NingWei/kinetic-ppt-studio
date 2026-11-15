import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { resolveTheme } from "./themes.mjs";

export { resolveTheme, THEME_PRESETS } from "./themes.mjs";

export const SLIDE_W_PX = 1600;
export const SLIDE_H_PX = 900;
export const EMU = 7620; // 1600*7620 = 12192000 (13.333in), 900*7620 = 6858000 (7.5in)
export const SLIDE_W = SLIDE_W_PX * EMU;
export const SLIDE_H = SLIDE_H_PX * EMU;

export function px(n) {
  return Math.round(n * EMU);
}

export function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Computes OpenXML `<a:srcRect>` inward percentage crops (0..100000) so any polygon or strip
 * maps 1:1 onto its exact spatial region of a full-slide 1600x900 artwork.
 */
export function calcSrcRect(x, y, w, h, canvasW = SLIDE_W_PX, canvasH = SLIDE_H_PX) {
  const x0 = Math.max(0, Math.min(canvasW - 4, x));
  const y0 = Math.max(0, Math.min(canvasH - 4, y));
  const x1 = Math.max(x0 + 4, Math.min(canvasW, x + w));
  const y1 = Math.max(y0 + 4, Math.min(canvasH, y + h));
  return {
    l: Math.round((x0 / canvasW) * 100000),
    t: Math.round((y0 / canvasH) * 100000),
    r: Math.round(((canvasW - x1) / canvasW) * 100000),
    b: Math.round(((canvasH - y1) / canvasH) * 100000),
  };
}

// ---------- Pure Node CRC32 + PKZIP Builder ----------
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[i] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function buildZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const entry of entries) {
    const nameStr = entry.name.replace(/\\/g, "/");
    const nameBuf = Buffer.from(nameStr, "utf8");
    const raw = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, "utf8");
    const isMedia = /\.(png|jpe?g)$/i.test(nameStr);
    const method = isMedia ? 0 : 8;
    const comp = method === 8 ? zlib.deflateRawSync(raw, { level: 6 }) : raw;
    const crc = crc32(raw);

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0x0800, 6);
    lh.writeUInt16LE(method, 8);
    lh.writeUInt16LE(0, 10);
    lh.writeUInt16LE(0x5421, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(raw.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    locals.push(lh, nameBuf, comp);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(method, 10);
    ch.writeUInt16LE(0, 12);
    ch.writeUInt16LE(0x5421, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(comp.length, 20);
    ch.writeUInt32LE(raw.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt16LE(0, 30);
    ch.writeUInt16LE(0, 32);
    ch.writeUInt16LE(0, 34);
    ch.writeUInt16LE(0, 36);
    ch.writeUInt32LE(0, 38);
    ch.writeUInt32LE(offset, 42);
    centrals.push(ch, nameBuf);

    offset += lh.length + nameBuf.length + comp.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, centralBuf, eocd]);
}

// ---------- Shape, Texture & Picture XML Builders ----------
export function buildFillAndLine({
  fillHex = null,
  fillAlpha = 100000,
  gradStops = null,
  gradAngle = 5400000,
  blipRid = null,
  srcRect = null,
  rotWithShape = true,
  blipAlpha = 100000,
  borderHex = null,
  borderAlpha = 100000,
  borderW = 1,
}) {
  let fillXml = `<a:noFill/>`;
  if (blipRid) {
    const srcTag = srcRect
      ? `<a:srcRect l="${srcRect.l}" t="${srcRect.t}" r="${srcRect.r}" b="${srcRect.b}"/>`
      : `<a:srcRect/>`;
    const alphaTag = blipAlpha < 100000 ? `<a:alphaModFix amt="${blipAlpha}"/>` : "";
    const rw = rotWithShape ? "1" : "0";
    fillXml = `<a:blipFill dpi="0" rotWithShape="${rw}"><a:blip r:embed="${blipRid}">${alphaTag}</a:blip>${srcTag}<a:stretch><a:fillRect/></a:stretch></a:blipFill>`;
  } else if (gradStops && gradStops.length) {
    const gs = gradStops
      .map(
        (s) =>
          `<a:gs pos="${s.pos}"><a:srgbClr val="${s.hex}">${
            s.alpha !== undefined ? `<a:alpha val="${s.alpha}"/>` : ""
          }</a:srgbClr></a:gs>`
      )
      .join("");
    fillXml = `<a:gradFill><a:gsLst>${gs}</a:gsLst><a:lin ang="${gradAngle}" scaled="1"/></a:gradFill>`;
  } else if (fillHex) {
    fillXml = `<a:solidFill><a:srgbClr val="${fillHex}">${
      fillAlpha < 100000 ? `<a:alpha val="${fillAlpha}"/>` : ""
    }</a:srgbClr></a:solidFill>`;
  }

  const lnXml = borderHex
    ? `<a:ln w="${Math.round(borderW * 12700)}"><a:solidFill><a:srgbClr val="${borderHex}">${
        borderAlpha < 100000 ? `<a:alpha val="${borderAlpha}"/>` : ""
      }</a:srgbClr></a:solidFill></a:ln>`
    : `<a:ln><a:noFill/></a:ln>`;

  return { fillXml, lnXml };
}

export function picXml({ id, name, rId, x, y, w, h, rotDeg = 0, alpha = 100000, srcRect = null }) {
  const rotAttr = rotDeg ? ` rot="${Math.round(rotDeg * 60000)}"` : "";
  const alphaTag = alpha < 100000 ? `<a:alphaModFix amt="${alpha}"/>` : "";
  const srcTag = srcRect ? `<a:srcRect l="${srcRect.l}" t="${srcRect.t}" r="${srcRect.r}" b="${srcRect.b}"/>` : `<a:srcRect/>`;
  return `<p:pic>
    <p:nvPicPr><p:cNvPr id="${id}" name="${esc(name)}"/><p:cNvPicPr><a:picLocks noChangeAspect="0"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>
    <p:blipFill><a:blip r:embed="${rId}">${alphaTag}</a:blip>${srcTag}<a:stretch><a:fillRect/></a:stretch></p:blipFill>
    <p:spPr>
      <a:xfrm${rotAttr}><a:off x="${px(x)}" y="${px(y)}"/><a:ext cx="${px(w)}" cy="${px(h)}"/></a:xfrm>
      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    </p:spPr>
  </p:pic>`;
}

export function addBackgroundArt({ shapes, getSp, mediaRid, overlayAlpha = 35000, overlayHex = "07090D", scrimStops = null }) {
  shapes.push(
    picXml({
      id: getSp(),
      name: "bg_artwork",
      rId: mediaRid,
      x: 0,
      y: 0,
      w: SLIDE_W_PX,
      h: SLIDE_H_PX,
    })
  );
  if (scrimStops) {
    shapes.push(
      rectShapeXml({
        id: getSp(),
        name: "bg_scrim",
        x: 0,
        y: 0,
        w: SLIDE_W_PX,
        h: SLIDE_H_PX,
        gradStops: scrimStops,
        gradAngle: 0,
      })
    );
  } else if (overlayAlpha > 0) {
    shapes.push(
      rectShapeXml({
        id: getSp(),
        name: "bg_scrim",
        x: 0,
        y: 0,
        w: SLIDE_W_PX,
        h: SLIDE_H_PX,
        fillHex: overlayHex,
        fillAlpha: overlayAlpha,
      })
    );
  }
}

export function rectShapeXml({
  id,
  name,
  x,
  y,
  w,
  h,
  fillHex = null,
  fillAlpha = 100000,
  borderHex = null,
  borderAlpha = 100000,
  borderW = 1,
  radius = 0,
  rotDeg = 0,
  gradStops = null,
  gradAngle = 5400000,
  blipRid = null,
  srcRect = null,
  rotWithShape = true,
  blipAlpha = 100000,
}) {
  const rotAttr = rotDeg ? ` rot="${Math.round(rotDeg * 60000)}"` : "";
  const prst = radius > 0 ? "roundRect" : "rect";
  const avLst = radius > 0 ? `<a:avLst><a:gd name="adj" fmla="val ${Math.round(radius)}"/></a:avLst>` : `<a:avLst/>`;
  const { fillXml, lnXml } = buildFillAndLine({
    fillHex,
    fillAlpha,
    gradStops,
    gradAngle,
    blipRid,
    srcRect,
    rotWithShape,
    blipAlpha,
    borderHex,
    borderAlpha,
    borderW,
  });

  return `<p:sp>
    <p:nvSpPr><p:cNvPr id="${id}" name="${esc(name)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
    <p:spPr>
      <a:xfrm${rotAttr}><a:off x="${px(x)}" y="${px(y)}"/><a:ext cx="${px(w)}" cy="${px(h)}"/></a:xfrm>
      <a:prstGeom prst="${prst}">${avLst}</a:prstGeom>
      ${fillXml}${lnXml}
    </p:spPr>
    <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
  </p:sp>`;
}

export function presetGeomShapeXml({
  id,
  name,
  prst = "ellipse", // "ellipse" | "donut" | "diamond" | "triangle"
  adjVal = null,
  x,
  y,
  w,
  h,
  rotDeg = 0,
  fillHex = null,
  fillAlpha = 100000,
  gradStops = null,
  gradAngle = 5400000,
  blipRid = null,
  srcRect = null,
  rotWithShape = true,
  blipAlpha = 100000,
  borderHex = null,
  borderAlpha = 100000,
  borderW = 1,
}) {
  const rotAttr = rotDeg ? ` rot="${Math.round(rotDeg * 60000)}"` : "";
  const avLst = adjVal !== null ? `<a:avLst><a:gd name="adj" fmla="val ${Math.round(adjVal)}"/></a:avLst>` : `<a:avLst/>`;
  const { fillXml, lnXml } = buildFillAndLine({
    fillHex,
    fillAlpha,
    gradStops,
    gradAngle,
    blipRid,
    srcRect,
    rotWithShape,
    blipAlpha,
    borderHex,
    borderAlpha,
    borderW,
  });

  return `<p:sp>
    <p:nvSpPr><p:cNvPr id="${id}" name="${esc(name)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
    <p:spPr>
      <a:xfrm${rotAttr}><a:off x="${px(x)}" y="${px(y)}"/><a:ext cx="${px(w)}" cy="${px(h)}"/></a:xfrm>
      <a:prstGeom prst="${prst}">${avLst}</a:prstGeom>
      ${fillXml}${lnXml}
    </p:spPr>
    <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
  </p:sp>`;
}

export function customPolyXml({
  id,
  name,
  x,
  y,
  w,
  h,
  ptsNorm,
  rotDeg = 0,
  fillHex = null,
  fillAlpha = 100000,
  gradStops = null,
  gradAngle = 2700000,
  blipRid = null,
  srcRect = null,
  rotWithShape = true,
  blipAlpha = 100000,
  borderHex = null,
  borderAlpha = 100000,
  borderW = 1,
}) {
  const rotAttr = rotDeg ? ` rot="${Math.round(rotDeg * 60000)}"` : "";
  const W = 10000;
  const H = 10000;
  let moves = `<a:moveTo><a:pt x="${Math.round(ptsNorm[0][0])}" y="${Math.round(ptsNorm[0][1])}"/></a:moveTo>`;
  for (let i = 1; i < ptsNorm.length; i++) {
    moves += `<a:lnTo><a:pt x="${Math.round(ptsNorm[i][0])}" y="${Math.round(ptsNorm[i][1])}"/></a:lnTo>`;
  }
  moves += `<a:close/>`;

  const { fillXml, lnXml } = buildFillAndLine({
    fillHex,
    fillAlpha,
    gradStops,
    gradAngle,
    blipRid,
    srcRect,
    rotWithShape,
    blipAlpha,
    borderHex,
    borderAlpha,
    borderW,
  });

  return `<p:sp>
    <p:nvSpPr><p:cNvPr id="${id}" name="${esc(name)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
    <p:spPr>
      <a:xfrm${rotAttr}><a:off x="${px(x)}" y="${px(y)}"/><a:ext cx="${px(w)}" cy="${px(h)}"/></a:xfrm>
      <a:custGeom>
        <a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="${W}" b="${H}"/>
        <a:pathLst><a:path w="${W}" h="${H}">${moves}</a:path></a:pathLst>
      </a:custGeom>
      ${fillXml}${lnXml}
    </p:spPr>
    <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
  </p:sp>`;
}

export function polyFromWorldPts(pts) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [wx, wy] of pts) {
    if (wx < minX) minX = wx;
    if (wy < minY) minY = wy;
    if (wx > maxX) maxX = wx;
    if (wy > maxY) maxY = wy;
  }
  const w = Math.max(4, maxX - minX);
  const h = Math.max(4, maxY - minY);
  const ptsNorm = pts.map(([wx, wy]) => [Math.round(((wx - minX) / w) * 10000), Math.round(((wy - minY) / h) * 10000)]);
  let sx = 0;
  let sy = 0;
  for (const [wx, wy] of pts) {
    sx += wx;
    sy += wy;
  }
  return { x: minX, y: minY, w, h, cx: sx / pts.length, cy: sy / pts.length, ptsNorm };
}

export function textBoxXml({
  id,
  name,
  x,
  y,
  w,
  h,
  paragraphs,
  fillHex = null,
  fillAlpha = 100000,
  borderHex = null,
  borderAlpha = 100000,
  borderW = 1,
  radius = 0,
  rotDeg = 0,
  padX = 16,
  padY = 10,
  anchor = "t",
  vert = "horz",
}) {
  const rotAttr = rotDeg ? ` rot="${Math.round(rotDeg * 60000)}"` : "";
  const prst = radius > 0 ? "roundRect" : "rect";
  const avLst = radius > 0 ? `<a:avLst><a:gd name="adj" fmla="val ${Math.round(radius)}"/></a:avLst>` : `<a:avLst/>`;
  const { fillXml, lnXml } = buildFillAndLine({
    fillHex,
    fillAlpha,
    borderHex,
    borderAlpha,
    borderW,
  });

  const pXml = paragraphs
    .map((p) => {
      const algn = p.align || "l";
      const spcAft = p.spaceAfter !== undefined ? `<a:spcAft><a:spcPts val="${Math.round(p.spaceAfter * 100)}"/></a:spcAft>` : "";
      const lnSpc = p.linePct ? `<a:lnSpc><a:spcPct val="${p.linePct}"/></a:lnSpc>` : "";
      const runs = (p.runs || [{ text: p.text, size: p.size || 14, color: p.color || "FFFFFF", bold: p.bold, font: p.font }])
        .map((r) => {
          const sz = Math.round((r.size || 14) * 100);
          const fontName = r.font || "Microsoft YaHei";
          const boldAttr = r.bold ? ' b="1"' : ' b="0"';
          return `<a:r><a:rPr lang="zh-CN" altLang="en-US" sz="${sz}"${boldAttr} dirty="0"><a:solidFill><a:srgbClr val="${
            r.color || "FFFFFF"
          }"/></a:solidFill><a:latin typeface="${esc(fontName)}"/><a:ea typeface="${esc(fontName)}"/></a:rPr><a:t>${esc(
            r.text
          )}</a:t></a:r>`;
        })
        .join("");
      return `<a:p><a:pPr algn="${algn}">${lnSpc}${spcAft}</a:pPr>${runs}</a:p>`;
    })
    .join("");

  return `<p:sp>
    <p:nvSpPr><p:cNvPr id="${id}" name="${esc(name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
    <p:spPr>
      <a:xfrm${rotAttr}><a:off x="${px(x)}" y="${px(y)}"/><a:ext cx="${px(w)}" cy="${px(h)}"/></a:xfrm>
      <a:prstGeom prst="${prst}">${avLst}</a:prstGeom>
      ${fillXml}${lnXml}
    </p:spPr>
    <p:txBody>
      <a:bodyPr wrap="square" lIns="${px(padX)}" tIns="${px(padY)}" rIns="${px(padX)}" bIns="${px(padY)}" anchor="${anchor}" vert="${vert}"/>
      <a:lstStyle/>
      ${pXml}
    </p:txBody>
  </p:sp>`;
}

// ---------- OpenXML Timing & Kinetic Effect Engines ----------
export class IdGen {
  constructor(start = 100) {
    this.cur = start;
  }
  next() {
    return ++this.cur;
  }
}

export function buildEntrEffectPar(
  ids,
  {
    spid,
    nodeType = "withEffect",
    grpId = 0,
    delayMs = 0,
    durMs = 680,
    fadeMs = 240,
    wipeDir = null, // "right" | "down" | "left" | "up"
    pathStr = null,
    ptsTypes = null,
    accel = 15000,
    decel = 78000,
    rotByDeg = 0,
    rotDurMs = null,
    scaleFromX = null,
    scaleFromY = null,
    scaleToX = 100,
    scaleToY = 100,
    scaleDurMs = null,
  }
) {
  const cTnWrap = ids.next();
  const cTnSet = ids.next();
  const children = [];

  children.push(`<p:set>
    <p:cBhvr>
      <p:cTn id="${cTnSet}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>
      <p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>
      <p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst>
    </p:cBhvr>
    <p:to><p:strVal val="visible"/></p:to>
  </p:set>`);

  if (wipeDir) {
    const cTnWipe = ids.next();
    children.push(`<p:animEffect transition="in" filter="wipe(${wipeDir})">
      <p:cBhvr><p:cTn id="${cTnWipe}" dur="${fadeMs}" fill="hold"/><p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl></p:cBhvr>
    </p:animEffect>`);
  } else if (fadeMs > 0) {
    const cTnFade = ids.next();
    children.push(`<p:animEffect transition="in" filter="fade">
      <p:cBhvr><p:cTn id="${cTnFade}" dur="${fadeMs}" fill="hold"/><p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl></p:cBhvr>
    </p:animEffect>`);
  }

  if (pathStr) {
    const cTnMot = ids.next();
    const ptsAttr = ptsTypes ? ` ptsTypes="${ptsTypes}"` : "";
    children.push(`<p:animMotion origin="layout" path="${pathStr}" pathEditMode="relative"${ptsAttr}>
      <p:cBhvr>
        <p:cTn id="${cTnMot}" dur="${durMs}" fill="hold" accel="${accel}" decel="${decel}"/>
        <p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>
        <p:attrNameLst><p:attrName>ppt_x</p:attrName><p:attrName>ppt_y</p:attrName></p:attrNameLst>
      </p:cBhvr>
    </p:animMotion>`);
  }

  if (rotByDeg !== 0) {
    const cTnRot = ids.next();
    const rDur = rotDurMs || durMs;
    children.push(`<p:animRot by="${Math.round(rotByDeg * 60000)}">
      <p:cBhvr>
        <p:cTn id="${cTnRot}" dur="${rDur}" fill="hold" accel="20000" decel="65000"/>
        <p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>
        <p:attrNameLst><p:attrName>r</p:attrName></p:attrNameLst>
      </p:cBhvr>
    </p:animRot>`);
  }

  if (scaleFromX !== null || scaleFromY !== null) {
    const cTnSc = ids.next();
    const fx = Math.round((scaleFromX ?? scaleFromY) * 1000);
    const fy = Math.round((scaleFromY ?? scaleFromX) * 1000);
    const tx = Math.round(scaleToX * 1000);
    const ty = Math.round(scaleToY * 1000);
    const sDur = scaleDurMs || durMs;
    children.push(`<p:animScale>
      <p:cBhvr>
        <p:cTn id="${cTnSc}" dur="${sDur}" fill="hold" decel="75000"/>
        <p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>
      </p:cBhvr>
      <p:from x="${fx}" y="${fy}"/>
      <p:to x="${tx}" y="${ty}"/>
    </p:animScale>`);
  }

  const presetId = pathStr ? 2 : wipeDir ? 22 : 10;
  return `<p:par>
    <p:cTn id="${cTnWrap}" presetID="${presetId}" presetClass="entr" presetSubtype="0" fill="hold" grpId="${grpId}" nodeType="${nodeType}">
      <p:stCondLst><p:cond delay="${delayMs}"/></p:stCondLst>
      <p:childTnLst>${children.join("")}</p:childTnLst>
    </p:cTn>
  </p:par>`;
}

export function buildExitEffectPar(
  ids,
  {
    spid,
    nodeType = "withEffect",
    grpId = 0,
    delayMs = 0,
    durMs = 700,
    pathStr = null,
    ptsTypes = null,
    fadeFraction = 0.42,
    accel = 58000,
    decel = 12000,
    rotByDeg = 0,
    wipeOutDir = null,
    scaleToX = null,
    scaleToY = null,
  }
) {
  const cTnWrap = ids.next();
  const children = [];

  if (pathStr) {
    const cTnMot = ids.next();
    const ptsAttr = ptsTypes ? ` ptsTypes="${ptsTypes}"` : "";
    children.push(`<p:animMotion origin="layout" path="${pathStr}" pathEditMode="relative"${ptsAttr}>
      <p:cBhvr>
        <p:cTn id="${cTnMot}" dur="${durMs}" fill="hold" accel="${accel}" decel="${decel}"/>
        <p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>
        <p:attrNameLst><p:attrName>ppt_x</p:attrName><p:attrName>ppt_y</p:attrName></p:attrNameLst>
      </p:cBhvr>
    </p:animMotion>`);
  }

  if (rotByDeg !== 0) {
    const cTnRot = ids.next();
    children.push(`<p:animRot by="${Math.round(rotByDeg * 60000)}">
      <p:cBhvr>
        <p:cTn id="${cTnRot}" dur="${durMs}" fill="hold" accel="35000"/>
        <p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>
        <p:attrNameLst><p:attrName>r</p:attrName></p:attrNameLst>
      </p:cBhvr>
    </p:animRot>`);
  }

  if (scaleToX !== null || scaleToY !== null) {
    const cTnSc = ids.next();
    const tx = Math.round((scaleToX ?? 100) * 1000);
    const ty = Math.round((scaleToY ?? 100) * 1000);
    children.push(`<p:animScale>
      <p:cBhvr>
        <p:cTn id="${cTnSc}" dur="${durMs}" fill="hold" decel="55000"/>
        <p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>
      </p:cBhvr>
      <p:from x="100000" y="100000"/>
      <p:to x="${tx}" y="${ty}"/>
    </p:animScale>`);
  }

  const cTnEff = ids.next();
  const effDelay = Math.max(0, Math.round(durMs * (1 - fadeFraction)));
  const effDur = Math.max(80, Math.round(durMs * fadeFraction));
  const filterVal = wipeOutDir ? `wipe(${wipeOutDir})` : "fade";
  children.push(`<p:animEffect transition="out" filter="${filterVal}">
    <p:cBhvr>
      <p:cTn id="${cTnEff}" dur="${effDur}" fill="hold"><p:stCondLst><p:cond delay="${effDelay}"/></p:stCondLst></p:cTn>
      <p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>
    </p:cBhvr>
  </p:animEffect>`);

  const cTnHide = ids.next();
  children.push(`<p:set>
    <p:cBhvr>
      <p:cTn id="${cTnHide}" dur="1" fill="hold"><p:stCondLst><p:cond delay="${Math.max(1, durMs - 10)}"/></p:stCondLst></p:cTn>
      <p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>
      <p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst>
    </p:cBhvr>
    <p:to><p:strVal val="hidden"/></p:to>
  </p:set>`);

  return `<p:par>
    <p:cTn id="${cTnWrap}" presetID="10" presetClass="exit" presetSubtype="0" fill="hold" grpId="${grpId}" nodeType="${nodeType}">
      <p:stCondLst><p:cond delay="${delayMs}"/></p:stCondLst>
      <p:childTnLst>${children.join("")}</p:childTnLst>
    </p:cTn>
  </p:par>`;
}

export function buildTransientEffectPars(
  ids,
  { spid, grpId, enterNodeType = "withEffect", enterDelay = 0, enterDur = 240, holdMs = 80, exitDur = 360, pathStr = null, ptsTypes = null, exitPathStr = null, exitPtsTypes = null }
) {
  const entr = buildEntrEffectPar(ids, {
    spid,
    nodeType: enterNodeType,
    grpId,
    delayMs: enterDelay,
    durMs: enterDur,
    fadeMs: Math.min(200, enterDur),
    pathStr,
    ptsTypes,
  });
  const exit = buildExitEffectPar(ids, {
    spid,
    nodeType: "withEffect",
    grpId,
    delayMs: enterDelay + enterDur + holdMs,
    durMs: exitDur,
    pathStr: exitPathStr,
    ptsTypes: exitPtsTypes,
    fadeFraction: 0.85,
  });
  return [entr, exit];
}

export function wrapStepGroup(ids, innerParsXml, condDelay = "indefinite") {
  const cTnGroup = ids.next();
  const cTnInner = ids.next();
  return `<p:par>
    <p:cTn id="${cTnGroup}" fill="hold">
      <p:stCondLst><p:cond delay="${condDelay}"/></p:stCondLst>
      <p:childTnLst>
        <p:par>
          <p:cTn id="${cTnInner}" fill="hold">
            <p:stCondLst><p:cond delay="0"/></p:stCondLst>
            <p:childTnLst>${innerParsXml}</p:childTnLst>
          </p:cTn>
        </p:par>
      </p:childTnLst>
    </p:cTn>
  </p:par>`;
}

export function wrapMainTiming(ids, stepGroupsXml, buildSpids = []) {
  const rootId = ids.next();
  const mainSeqId = ids.next();
  const bldLst = buildSpids.length
    ? `<p:bldLst>${buildSpids.map((s) => `<p:bldP spid="${s}" grpId="0"/>`).join("")}</p:bldLst>`
    : "";

  return `<p:timing>
    <p:tnLst>
      <p:par>
        <p:cTn id="${rootId}" dur="indefinite" restart="never" nodeType="tmRoot">
          <p:childTnLst>
            <p:seq concurrent="1" nextAc="seek">
              <p:cTn id="${mainSeqId}" dur="indefinite" nodeType="mainSeq">
                <p:childTnLst>${stepGroupsXml}</p:childTnLst>
              </p:cTn>
              <p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>
              <p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst>
            </p:seq>
          </p:childTnLst>
        </p:cTn>
      </p:par>
    </p:tnLst>
    ${bldLst}
  </p:timing>`;
}

export function morphTransitionXml() {
  return `<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">
    <mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159">
      <p:transition spd="med" advClick="1"><p159:morph option="byObject"/></p:transition>
    </mc:Choice>
    <mc:Fallback>
      <p:transition spd="med" advClick="1"><p:fade/></p:transition>
    </mc:Fallback>
  </mc:AlternateContent>`;
}

// ---------- High-Level HTML-Replicating Transition Rig Helpers (Theme & Texture Decoupled) ----------

/**
 * 1. Diagonal Blade Split (`blade` / 斜刀劈裂):
 * Supports optional `coverMediaRid` so a painted cover tears in half cleanly along the gleaming slash.
 */
export function addDiagonalBladeOpeningRig({
  shapes,
  buildSpids,
  ids,
  getSp,
  theme = "obsidian-gold",
  coverMediaRid = null,
  topStops = null,
  botStops = null,
  bladeColor = null,
  seamTopX = 7260,
  seamBotX = 2740,
  gleamRotDeg = 38.7,
  autoDelay = 120,
}) {
  const T = resolveTheme(theme);
  const bColor = bladeColor || T.accentHex;
  const fullSrc = coverMediaRid ? { l: 0, t: 0, r: 0, b: 0 } : null;

  const topId = getSp();
  shapes.push(
    customPolyXml({
      id: topId,
      name: "rig_blade_top",
      x: 0,
      y: 0,
      w: SLIDE_W_PX,
      h: SLIDE_H_PX,
      ptsNorm: [
        [0, 0],
        [seamTopX + 10, 0],
        [seamBotX + 10, 10000],
        [0, 10000],
      ],
      blipRid: coverMediaRid,
      srcRect: fullSrc,
      gradStops: coverMediaRid ? null : topStops || T.bladeTopStops,
      gradAngle: 3200000,
      borderHex: bColor,
      borderW: 2.5,
    })
  );

  const botId = getSp();
  shapes.push(
    customPolyXml({
      id: botId,
      name: "rig_blade_bot",
      x: 0,
      y: 0,
      w: SLIDE_W_PX,
      h: SLIDE_H_PX,
      ptsNorm: [
        [seamTopX, 0],
        [10000, 0],
        [10000, 10000],
        [seamBotX, 10000],
      ],
      blipRid: coverMediaRid,
      srcRect: fullSrc,
      gradStops: coverMediaRid ? null : botStops || T.bladeBotStops,
      gradAngle: 3200000,
      borderHex: bColor,
      borderW: 2.5,
    })
  );

  const gleamId = getSp();
  shapes.push(
    rectShapeXml({
      id: gleamId,
      name: "rig_blade_gleam",
      x: 793,
      y: -150,
      w: 14,
      h: 1220,
      fillHex: bColor,
      fillAlpha: 96000,
      rotDeg: gleamRotDeg,
    })
  );
  buildSpids.push(gleamId);

  const sparkDefs = [
    { x: 560, y: 690, dx: -0.09, dy: -0.06 },
    { x: 670, y: 580, dx: 0.11, dy: 0.08 },
    { x: 785, y: 455, dx: -0.13, dy: 0.05 },
    { x: 875, y: 340, dx: 0.12, dy: -0.09 },
    { x: 980, y: 215, dx: -0.08, dy: -0.11 },
    { x: 1060, y: 120, dx: 0.10, dy: 0.07 },
  ];
  const sparkIds = [];
  for (let i = 0; i < sparkDefs.length; i++) {
    const sd = sparkDefs[i];
    const sid = getSp();
    sparkIds.push({ sid, dx: sd.dx, dy: sd.dy });
    shapes.push(
      presetGeomShapeXml({
        id: sid,
        name: `rig_blade_spark_${i + 1}`,
        prst: "diamond",
        x: sd.x,
        y: sd.y,
        w: 18,
        h: 18,
        fillHex: bColor,
        fillAlpha: 95000,
      })
    );
    buildSpids.push(sid);
  }

  const pars = [];
  pars.push(
    ...buildTransientEffectPars(ids, {
      spid: gleamId,
      grpId: 1,
      enterNodeType: "afterEffect",
      enterDelay: autoDelay,
      enterDur: 240,
      holdMs: 70,
      exitDur: 300,
      pathStr: "M -0.22 0.28 L 0 0 E",
      ptsTypes: "AA",
    })
  );

  for (let i = 0; i < sparkIds.length; i++) {
    const sk = sparkIds[i];
    pars.push(
      ...buildTransientEffectPars(ids, {
        spid: sk.sid,
        grpId: 1,
        enterDelay: autoDelay + 140 + i * 25,
        enterDur: 260,
        holdMs: 40,
        exitDur: 260,
        exitPathStr: `M 0 0 L ${sk.dx.toFixed(2)} ${sk.dy.toFixed(2)} E`,
        exitPtsTypes: "AA",
      })
    );
  }

  pars.push(
    buildExitEffectPar(ids, {
      spid: topId,
      nodeType: "withEffect",
      grpId: 1,
      delayMs: autoDelay + 170,
      durMs: 820,
      pathStr: "M 0 0 C -0.18 -0.11 -0.45 -0.26 -0.85 -0.50 E",
      ptsTypes: "AFFA",
      fadeFraction: 0.42,
      accel: 58000,
    }),
    buildExitEffectPar(ids, {
      spid: botId,
      nodeType: "withEffect",
      grpId: 1,
      delayMs: autoDelay + 170,
      durMs: 820,
      pathStr: "M 0 0 C 0.18 0.11 0.45 0.26 0.85 0.50 E",
      ptsTypes: "AFFA",
      fadeFraction: 0.42,
      accel: 58000,
    })
  );

  return pars;
}

/**
 * 2. Pleated Silk Curtain (`curtain` / 立体帷幔挤压对开):
 */
export function addPleatedCurtainOpeningRig({
  shapes,
  ids,
  getSp,
  theme = "obsidian-gold",
  darkTone = null,
  midTone = null,
  hiTone = null,
  trimColor = null,
  autoDelay = 160,
}) {
  const T = resolveTheme(theme);
  const dT = darkTone || T.curtainDark;
  const mT = midTone || T.curtainMid;
  const hT = hiTone || T.curtainHi;
  const trC = trimColor || T.curtainTrim;

  const leftIds = [];
  const rightIds = [];
  const leftX = [0, 200, 400, 600];
  const rightX = [790, 995, 1200, 1400];

  leftX.forEach((cx, i) => {
    const cid = getSp();
    leftIds.push(cid);
    shapes.push(
      rectShapeXml({
        id: cid,
        name: `rig_curtain_L${i + 1}`,
        x: cx,
        y: 16,
        w: 222,
        h: 884,
        gradStops: [
          { pos: 0, hex: dT },
          { pos: 45000, hex: mT },
          { pos: 72000, hex: hT },
          { pos: 100000, hex: dT },
        ],
        gradAngle: 0,
        borderHex: i === leftX.length - 1 ? trC : null,
        borderW: i === leftX.length - 1 ? 3 : 0,
      })
    );
  });

  rightX.forEach((cx, i) => {
    const cid = getSp();
    rightIds.push(cid);
    shapes.push(
      rectShapeXml({
        id: cid,
        name: `rig_curtain_R${i + 1}`,
        x: cx,
        y: 16,
        w: 222,
        h: 884,
        gradStops: [
          { pos: 0, hex: dT },
          { pos: 28000, hex: hT },
          { pos: 55000, hex: mT },
          { pos: 100000, hex: dT },
        ],
        gradAngle: 0,
        borderHex: i === 0 ? trC : null,
        borderW: i === 0 ? 3 : 0,
      })
    );
  });

  const railId = getSp();
  shapes.push(rectShapeXml({ id: railId, name: "rig_curtain_rail", x: 0, y: 12, w: 1600, h: 10, fillHex: trC }));

  const ringL = [];
  const ringR = [];
  for (let i = 0; i < 5; i++) {
    const lid = getSp();
    ringL.push(lid);
    shapes.push(presetGeomShapeXml({ id: lid, name: `rig_ring_L${i}`, prst: "ellipse", x: 35 + i * 165, y: 5, w: 24, h: 24, borderHex: trC, borderW: 3 }));
    const rid = getSp();
    ringR.push(rid);
    shapes.push(presetGeomShapeXml({ id: rid, name: `rig_ring_R${i}`, prst: "ellipse", x: 815 + i * 165, y: 5, w: 24, h: 24, borderHex: trC, borderW: 3 }));
  }

  const pars = [];
  leftIds.forEach((cid, i) => {
    pars.push(
      buildExitEffectPar(ids, {
        spid: cid,
        nodeType: i === 0 ? "afterEffect" : "withEffect",
        grpId: 1,
        delayMs: autoDelay + (3 - i) * 45,
        durMs: 920,
        pathStr: "M 0 0 C -0.18 0 -0.40 0 -0.60 0 E",
        ptsTypes: "AFFA",
        scaleToX: 46,
        scaleToY: 100,
        fadeFraction: 0.34,
        accel: 32000,
        decel: 56000,
      })
    );
  });
  rightIds.forEach((cid, i) => {
    pars.push(
      buildExitEffectPar(ids, {
        spid: cid,
        nodeType: "withEffect",
        grpId: 1,
        delayMs: autoDelay + i * 45,
        durMs: 920,
        pathStr: "M 0 0 C 0.18 0 0.40 0 0.60 0 E",
        ptsTypes: "AFFA",
        scaleToX: 46,
        scaleToY: 100,
        fadeFraction: 0.34,
        accel: 32000,
        decel: 56000,
      })
    );
  });
  ringL.forEach((rid, i) => {
    pars.push(
      buildExitEffectPar(ids, {
        spid: rid,
        nodeType: "withEffect",
        grpId: 1,
        delayMs: autoDelay + (4 - i) * 35,
        durMs: 920,
        pathStr: "M 0 0 L -0.58 0 E",
        ptsTypes: "AA",
        fadeFraction: 0.32,
      })
    );
  });
  ringR.forEach((rid, i) => {
    pars.push(
      buildExitEffectPar(ids, {
        spid: rid,
        nodeType: "withEffect",
        grpId: 1,
        delayMs: autoDelay + i * 35,
        durMs: 920,
        pathStr: "M 0 0 L 0.58 0 E",
        ptsTypes: "AA",
        fadeFraction: 0.32,
      })
    );
  });
  pars.push(
    buildExitEffectPar(ids, {
      spid: railId,
      nodeType: "withEffect",
      grpId: 1,
      delayMs: autoDelay + 840,
      durMs: 360,
      fadeFraction: 0.9,
    })
  );

  return pars;
}

/**
 * 3. Origami Cranes Swarm Veil Lift (`cranes` / 千纸鹤群飞掀卷):
 * Supports `coverMediaRid` (textured rice-paper scroll cut accurately into 4 seamless vertical strips)
 * + 14 four-facet rigid-body origami cranes + trailing sparks.
 */
export function addOrigamiCranesOpeningRig({
  shapes,
  buildSpids,
  ids,
  getSp,
  theme = "obsidian-gold",
  coverMediaRid = null,
  veilStops = null,
  veilAccentHex = null,
  cranePalettes = null,
  seamlessMode = null,
  autoDelay = 80,
}) {
  const T = resolveTheme(theme);
  const vStops = veilStops || T.veilStops;
  const vAccent = veilAccentHex || T.veilAccentHex;
  const cPals = cranePalettes || T.cranePalettes;
  const useSeamless = seamlessMode ?? Boolean(T.softMode);

  const panelIds = [];
  let sealId = null;

  if (useSeamless) {
    const coverPid = getSp();
    // In OOXML/WPS SMIL transition="out", wipe(left) erases from LEFT edge -> RIGHT edge behind flying cranes!
    panelIds.push({ pid: coverPid, delay: autoDelay + 140, dur: 880, wipeDir: "left", fadeFrac: 0.96 });
    shapes.push(
      rectShapeXml({
        id: coverPid,
        name: "rig_crane_veil_full",
        x: 0,
        y: 0,
        w: SLIDE_W_PX,
        h: SLIDE_H_PX,
        blipRid: coverMediaRid,
        gradStops: coverMediaRid ? null : vStops,
        gradAngle: 5400000,
      })
    );
  } else {
    const panelDefs = [
      { x: 0, w: 406, wipeDelay: autoDelay + 95 },
      { x: 400, w: 406, wipeDelay: autoDelay + 210 },
      { x: 800, w: 406, wipeDelay: autoDelay + 325 },
      { x: 1200, w: 400, wipeDelay: autoDelay + 440 },
    ];
    panelDefs.forEach((p, idx) => {
      const pid = getSp();
      panelIds.push({ pid, delay: p.wipeDelay, dur: 520, wipeDir: "left", fadeFrac: 0.90 });
      shapes.push(
        rectShapeXml({
          id: pid,
          name: `rig_crane_veil_${idx + 1}`,
          x: p.x,
          y: 0,
          w: p.w,
          h: SLIDE_H_PX,
          blipRid: coverMediaRid,
          srcRect: coverMediaRid ? calcSrcRect(p.x, 0, p.w, SLIDE_H_PX) : null,
          gradStops: coverMediaRid ? null : vStops,
          gradAngle: 5400000,
          borderHex: T.veilBorderHex,
          borderAlpha: 65000,
          borderW: 1.2,
        })
      );
    });

    sealId = getSp();
    shapes.push(
      rectShapeXml({
        id: sealId,
        name: "rig_crane_veil_seal",
        x: 597,
        y: 419,
        w: 44,
        h: 44,
        rotDeg: 45,
        fillHex: vAccent,
        fillAlpha: 92000,
        borderHex: T.accentHex,
        borderAlpha: 82000,
        borderW: 2.0,
        radius: 5000,
      })
    );
  }

  const CRANE_FACETS = [
    { key: "farWing", pts: [[3600, 4800], [1500, 900], [5000, 2900], [5700, 4400]] },
    { key: "body", pts: [[500, 6500], [3400, 4600], [6500, 4300], [4900, 6200], [2000, 7100]] },
    { key: "neck", pts: [[5800, 4500], [8350, 2150], [9750, 3050], [8500, 3550], [6500, 5200]] },
    { key: "nearWing", pts: [[4200, 4800], [5700, 9300], [7200, 5600], [5700, 4200]] },
  ];

  const craneSpecs = [
    { x: -210, y: 740, size: 88, pal: 0, d: 0, dur: 1180, dx: 1.38, dy: -0.94, rot: -10, c1x: 0.42, c1y: -0.22, c2x: 0.92, c2y: -0.64 },
    { x: -120, y: 920, size: 132, pal: 1, d: 65, dur: 1260, dx: 1.34, dy: -1.16, rot: 8, c1x: 0.38, c1y: -0.34, c2x: 0.88, c2y: -0.82 },
    { x: 40, y: 960, size: 176, pal: 0, d: 115, dur: 1300, dx: 1.24, dy: -1.24, rot: -8, c1x: 0.35, c1y: -0.38, c2x: 0.82, c2y: -0.88 },
    { x: -230, y: 510, size: 96, pal: 2, d: 140, dur: 1220, dx: 1.44, dy: -0.80, rot: 6, c1x: 0.45, c1y: -0.18, c2x: 0.96, c2y: -0.54 },
    { x: 240, y: 970, size: 210, pal: 1, d: 195, dur: 1340, dx: 1.15, dy: -1.32, rot: -12, c1x: 0.32, c1y: -0.44, c2x: 0.76, c2y: -0.94 },
    { x: -240, y: 310, size: 78, pal: 0, d: 230, dur: 1180, dx: 1.46, dy: -0.62, rot: -6, c1x: 0.48, c1y: -0.14, c2x: 0.98, c2y: -0.42 },
    { x: 140, y: 950, size: 146, pal: 2, d: 270, dur: 1260, dx: 1.22, dy: -1.26, rot: 11, c1x: 0.36, c1y: -0.38, c2x: 0.84, c2y: -0.88 },
    { x: -170, y: 660, size: 162, pal: 0, d: 310, dur: 1280, dx: 1.38, dy: -0.96, rot: -9, c1x: 0.40, c1y: -0.26, c2x: 0.90, c2y: -0.68 },
    { x: 430, y: 980, size: 188, pal: 0, d: 350, dur: 1280, dx: 1.04, dy: -1.34, rot: 7, c1x: 0.30, c1y: -0.45, c2x: 0.72, c2y: -0.96 },
    { x: -210, y: 420, size: 118, pal: 1, d: 390, dur: 1220, dx: 1.42, dy: -0.74, rot: -11, c1x: 0.44, c1y: -0.20, c2x: 0.95, c2y: -0.52 },
    { x: 310, y: 965, size: 126, pal: 2, d: 440, dur: 1200, dx: 1.12, dy: -1.28, rot: 9, c1x: 0.34, c1y: -0.40, c2x: 0.78, c2y: -0.90 },
    { x: 590, y: 975, size: 164, pal: 1, d: 495, dur: 1240, dx: 0.94, dy: -1.35, rot: -7, c1x: 0.28, c1y: -0.46, c2x: 0.66, c2y: -0.98 },
    { x: -160, y: 810, size: 102, pal: 0, d: 540, dur: 1180, dx: 1.36, dy: -1.10, rot: 12, c1x: 0.42, c1y: -0.32, c2x: 0.92, c2y: -0.78 },
    { x: 740, y: 980, size: 138, pal: 2, d: 595, dur: 1200, dx: 0.85, dy: -1.36, rot: -10, c1x: 0.26, c1y: -0.46, c2x: 0.60, c2y: -1.00 },
  ];

  const pars = [];
  let firstNodeUsed = false;
  const nextNodeType = () => {
    if (!firstNodeUsed) {
      firstNodeUsed = true;
      return "afterEffect";
    }
    return "withEffect";
  };

  if (useSeamless) {
    // Launch lead crane immediately as afterEffect so the flock pioneers the seamless veil transition
    craneSpecs.forEach((c, ci) => {
      const pal = cPals[c.pal % cPals.length];
      const pathStr = `M 0 0 C ${c.c1x.toFixed(2)} ${c.c1y.toFixed(2)} ${c.c2x.toFixed(2)} ${c.c2y.toFixed(2)} ${c.dx.toFixed(2)} ${c.dy.toFixed(2)} E`;
      const launchDelay = autoDelay + c.d;

      CRANE_FACETS.forEach((f, fi) => {
        const fid = getSp();
        buildSpids.push(fid);
        shapes.push(
          customPolyXml({
            id: fid,
            name: `rig_crane_${ci + 1}_${f.key}`,
            x: c.x,
            y: c.y,
            w: c.size,
            h: c.size,
            ptsNorm: f.pts,
            fillHex: pal[f.key],
            borderHex: pal.edge,
            borderAlpha: 68000,
            borderW: 0.8,
          })
        );

        pars.push(
          buildEntrEffectPar(ids, {
            spid: fid,
            nodeType: ci === 0 && fi === 0 ? nextNodeType() : "withEffect",
            grpId: 1,
            delayMs: launchDelay,
            durMs: c.dur,
            fadeMs: 120,
            pathStr,
            ptsTypes: "AFFA",
            accel: 8000,
            decel: 8000,
            rotByDeg: c.rot,
            rotDurMs: c.dur,
            scaleFromX: 92,
            scaleFromY: 92,
            scaleToX: 110,
            scaleToY: 110,
            scaleDurMs: c.dur,
          }),
          buildExitEffectPar(ids, {
            spid: fid,
            nodeType: "withEffect",
            grpId: 1,
            delayMs: launchDelay + c.dur - 190,
            durMs: 190,
            fadeFraction: 0.95,
          })
        );
      });
    });

    panelIds.forEach((p) => {
      pars.push(
        buildExitEffectPar(ids, {
          spid: p.pid,
          nodeType: "withEffect",
          grpId: 1,
          delayMs: p.delay,
          durMs: p.dur,
          wipeOutDir: p.wipeDir,
          fadeFraction: p.fadeFrac,
          accel: 18000,
          decel: 52000,
        })
      );
    });
  } else {
    panelIds.forEach((p) => {
      pars.push(
        buildExitEffectPar(ids, {
          spid: p.pid,
          nodeType: nextNodeType(),
          grpId: 1,
          delayMs: p.delay,
          durMs: p.dur,
          pathStr: "M 0 0 L 0.03 -0.05 E",
          ptsTypes: "AA",
          wipeOutDir: p.wipeDir,
          fadeFraction: p.fadeFrac,
          accel: 22000,
          decel: 58000,
        })
      );
    });
    if (sealId !== null) {
      pars.push(
        buildExitEffectPar(ids, {
          spid: sealId,
          nodeType: "withEffect",
          grpId: 1,
          delayMs: panelIds[1].delay,
          durMs: 500,
          pathStr: "M 0 0 L 0.03 -0.05 E",
          ptsTypes: "AA",
          rotByDeg: 14,
          fadeFraction: 0.92,
        })
      );
    }

    craneSpecs.forEach((c, ci) => {
      const pal = cPals[c.pal % cPals.length];
      const pathStr = `M 0 0 C ${c.c1x.toFixed(2)} ${c.c1y.toFixed(2)} ${c.c2x.toFixed(2)} ${c.c2y.toFixed(2)} ${c.dx.toFixed(2)} ${c.dy.toFixed(2)} E`;
      const launchDelay = autoDelay + c.d;

      CRANE_FACETS.forEach((f) => {
        const fid = getSp();
        buildSpids.push(fid);
        shapes.push(
          customPolyXml({
            id: fid,
            name: `rig_crane_${ci + 1}_${f.key}`,
            x: c.x,
            y: c.y,
            w: c.size,
            h: c.size,
            ptsNorm: f.pts,
            fillHex: pal[f.key],
            borderHex: pal.edge,
            borderAlpha: 68000,
            borderW: 0.8,
          })
        );

        pars.push(
          buildEntrEffectPar(ids, {
            spid: fid,
            nodeType: "withEffect",
            grpId: 1,
            delayMs: launchDelay,
            durMs: c.dur,
            fadeMs: 120,
            pathStr,
            ptsTypes: "AFFA",
            accel: 8000,
            decel: 8000,
            rotByDeg: c.rot,
            rotDurMs: c.dur,
            scaleFromX: 92,
            scaleFromY: 92,
            scaleToX: 110,
            scaleToY: 110,
            scaleDurMs: c.dur,
          }),
          buildExitEffectPar(ids, {
            spid: fid,
            nodeType: "withEffect",
            grpId: 1,
            delayMs: launchDelay + c.dur - 190,
            durMs: 190,
            fadeFraction: 0.95,
          })
        );
      });
    });
  }

  for (let i = 0; i < 8; i++) {
    const sid = getSp();
    buildSpids.push(sid);
    const sx = 210 + i * 165;
    const sy = 690 - i * 68;
    const isSoft = Boolean(T.softMode);
    const sz = isSoft ? 10 : 16;
    shapes.push(
      presetGeomShapeXml({
        id: sid,
        name: `rig_crane_spark_${i + 1}`,
        prst: "diamond",
        x: sx,
        y: sy,
        w: sz,
        h: sz,
        fillHex: i % 2 === 0 ? T.accentHex : vAccent,
        fillAlpha: isSoft ? 62000 : 92000,
      })
    );
    pars.push(
      ...buildTransientEffectPars(ids, {
        spid: sid,
        grpId: 1,
        enterDelay: autoDelay + 240 + i * 75,
        enterDur: isSoft ? 340 : 240,
        holdMs: isSoft ? 150 : 70,
        exitDur: isSoft ? 520 : 340,
        exitPathStr: "M 0 0 L 0.10 -0.09 E",
        exitPtsTypes: "AA",
      })
    );
  }

  return pars;
}

/**
 * 4. Multi-Beat Shard Shatter (`fists` / 乱拳破纸碎屏):
 * Cuts full-bleed `coverMediaRid` artwork 1:1 into 16 interlocking jagged cover fragments via `<a:srcRect>`,
 * exploding outward across 3 shockwave beats (using transparent ink-splash PNGs when `splashMediaRid` is supplied).
 */
export function addShardPunchOpeningRig({
  shapes,
  buildSpids,
  ids,
  getSp,
  theme = "obsidian-gold",
  coverMediaRid = null,
  splashMediaRid = null,
  splashAltMediaRid = null,
  shardPalettes = null,
  shockColors = null,
  seamHex = null,
  softMode = null,
  autoDelay = 60,
}) {
  const T = resolveTheme(theme);
  const useSoft = softMode ?? Boolean(T.softMode);
  const sPals = shardPalettes || T.shardPalettes;
  const sColors = shockColors || T.shockColors;
  const sHex = seamHex || T.seamHex;

  // Exact [0..1600, 0..900] boundary pinned planar crack mesh -> 1:1 srcRect artwork shards with ZERO leaks!
  const grid = [
    [
      [0, 0],
      [405, 0],
      [810, 0],
      [1215, 0],
      [1600, 0],
    ],
    [
      [0, 290],
      [355, 255],
      [780, 325],
      [1255, 250],
      [1600, 300],
    ],
    [
      [0, 610],
      [430, 640],
      [840, 565],
      [1185, 635],
      [1600, 595],
    ],
    [
      [0, 900],
      [390, 900],
      [820, 900],
      [1220, 900],
      [1600, 900],
    ],
  ];

  const shardPolys = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const tl = grid[r][c];
      const tr = grid[r][c + 1];
      const br = grid[r + 1][c + 1];
      const bl = grid[r + 1][c];
      const splitDiag = (r === 1 && (c === 1 || c === 2)) || (r === 0 && c === 1) || (r === 2 && c === 2);
      if (splitDiag) {
        if ((r + c) % 2 === 0) {
          shardPolys.push({ pts: [tl, tr, br], row: r, col: c });
          shardPolys.push({ pts: [tl, br, bl], row: r, col: c });
        } else {
          shardPolys.push({ pts: [tl, tr, bl], row: r, col: c });
          shardPolys.push({ pts: [tr, br, bl], row: r, col: c });
        }
      } else {
        shardPolys.push({ pts: [tl, tr, br, bl], row: r, col: c });
      }
    }
  }

  const beats = [
    { delay: autoDelay + 20, hx: 510, hy: 455, color: sColors[0], splashRid: splashMediaRid },
    { delay: autoDelay + 220, hx: 1080, hy: 365, color: sColors[1 % sColors.length], splashRid: splashAltMediaRid || splashMediaRid },
    { delay: autoDelay + 420, hx: 800, hy: 480, color: sColors[2 % sColors.length], splashRid: splashMediaRid },
  ];

  const shardDefs = shardPolys.map((sp, idx) => {
    const geom = polyFromWorldPts(sp.pts);
    let beatIdx = 2;
    if (geom.cx < 660 && geom.cy > 180 && geom.cy < 720 && sp.pts.length === 3) beatIdx = 0;
    else if (geom.cx >= 660 && geom.cy < 580 && sp.pts.length === 3) beatIdx = 1;
    else if (idx % 3 === 0 && geom.cx < 720) beatIdx = 0;
    else if (idx % 3 === 1 && geom.cx >= 720 && geom.cy < 620) beatIdx = 1;

    const hub = beats[beatIdx];
    const vx = geom.cx - hub.hx || (idx % 2 === 0 ? -120 : 120);
    const vy = geom.cy - hub.hy || -90;
    const len = Math.hypot(vx, vy) || 1;
    const travelPx = 1140 + (idx % 4) * 90;
    const dx = ((vx / len) * travelPx) / SLIDE_W_PX;
    const dy = ((vy / len) * travelPx) / SLIDE_H_PX;

    const sid = getSp();
    const isCore = sp.pts.length === 3;
    shapes.push(
      customPolyXml({
        id: sid,
        name: `rig_shard_${idx + 1}`,
        x: geom.x,
        y: geom.y,
        w: geom.w,
        h: geom.h,
        ptsNorm: geom.ptsNorm,
        blipRid: coverMediaRid,
        srcRect: coverMediaRid ? calcSrcRect(geom.x, geom.y, geom.w, geom.h) : null,
        gradStops: coverMediaRid ? null : sPals[idx % sPals.length],
        gradAngle: (idx * 650000) % 10800000,
        borderHex: isCore ? hub.color : sHex,
        borderAlpha: useSoft ? (isCore ? 38000 : 16000) : isCore ? 88000 : 45000,
        borderW: useSoft ? (isCore ? 1.0 : 0.6) : isCore ? 1.8 : 1.0,
      })
    );

    return {
      sid,
      delay: hub.delay + (idx % 3) * (useSoft ? 42 : 28),
      dur: (useSoft ? 720 : 580) + (idx % 3) * 45,
      dx,
      dy,
      rot: (idx % 2 === 0 ? 1 : -1) * ((useSoft ? 20 : 36) + (idx % 5) * (useSoft ? 8 : 14)),
    };
  });

  const pars = [];
  shardDefs.forEach((sh, i) => {
    pars.push(
      buildExitEffectPar(ids, {
        spid: sh.sid,
        nodeType: i === 0 ? "afterEffect" : "withEffect",
        grpId: 1,
        delayMs: sh.delay,
        durMs: sh.dur,
        pathStr: `M 0 0 L ${sh.dx.toFixed(2)} ${sh.dy.toFixed(2)} E`,
        ptsTypes: "AA",
        rotByDeg: sh.rot,
        scaleToX: useSoft ? 78 : 70,
        scaleToY: useSoft ? 78 : 70,
        fadeFraction: useSoft ? 0.50 : 0.42,
        accel: useSoft ? 44000 : 68000,
        decel: useSoft ? 24000 : 8000,
      })
    );
  });

  beats.forEach((b, bi) => {
    const ringId = getSp();
    buildSpids.push(ringId);

    if (b.splashRid) {
      const sz = useSoft ? 520 : 420;
      const half = sz / 2;
      shapes.push(
        picXml({
          id: ringId,
          name: `rig_punch_splash_${bi + 1}`,
          rId: b.splashRid,
          x: b.hx - half,
          y: b.hy - half,
          w: sz,
          h: sz,
          rotDeg: bi * 42,
          alpha: useSoft ? 86000 : 94000,
        })
      );
    } else {
      shapes.push(
        presetGeomShapeXml({
          id: ringId,
          name: `rig_punch_ring_${bi + 1}`,
          prst: "donut",
          adjVal: useSoft ? 1800 : 7200,
          x: b.hx - 140,
          y: b.hy - 140,
          w: 280,
          h: 280,
          fillHex: b.color,
          fillAlpha: useSoft ? 36000 : 94000,
        })
      );
    }

    if (useSoft) {
      pars.push(
        buildEntrEffectPar(ids, {
          spid: ringId,
          nodeType: "withEffect",
          grpId: 1,
          delayMs: b.delay,
          durMs: 520,
          fadeMs: 180,
          scaleFromX: 62,
          scaleFromY: 62,
          scaleToX: 145,
          scaleToY: 145,
          scaleDurMs: 520,
          rotByDeg: bi % 2 === 0 ? 10 : -10,
          decel: 84000,
        }),
        buildExitEffectPar(ids, {
          spid: ringId,
          nodeType: "withEffect",
          grpId: 1,
          delayMs: b.delay + 280,
          durMs: 420,
          scaleToX: 175,
          scaleToY: 175,
          fadeFraction: 0.96,
        })
      );
    } else {
      const flashId = getSp();
      buildSpids.push(flashId);
      shapes.push(
        presetGeomShapeXml({
          id: flashId,
          name: `rig_punch_flash_${bi + 1}`,
          prst: "diamond",
          x: b.hx - 44,
          y: b.hy - 44,
          w: 88,
          h: 88,
          fillHex: "FFF8E7",
          fillAlpha: 92000,
        })
      );

      pars.push(
        buildEntrEffectPar(ids, {
          spid: ringId,
          nodeType: "withEffect",
          grpId: 1,
          delayMs: b.delay,
          durMs: 340,
          fadeMs: 70,
          scaleFromX: 16,
          scaleFromY: 16,
          scaleToX: 170,
          scaleToY: 170,
          scaleDurMs: 340,
          rotByDeg: bi % 2 === 0 ? 18 : -18,
          decel: 82000,
        }),
        buildExitEffectPar(ids, {
          spid: ringId,
          nodeType: "withEffect",
          grpId: 1,
          delayMs: b.delay + 210,
          durMs: 190,
          scaleToX: 225,
          scaleToY: 225,
          fadeFraction: 0.96,
        }),
        ...buildTransientEffectPars(ids, {
          spid: flashId,
          grpId: 1,
          enterDelay: b.delay,
          enterDur: 110,
          holdMs: 30,
          exitDur: 160,
        })
      );
    }
  });

  return pars;
}

/**
 * 5. Angled Wind Ribbon Domino Peel (`wind` / 狂风卷条斜剥):
 */
export function addWindRibbonsOpeningRig({
  shapes,
  buildSpids,
  ids,
  getSp,
  theme = "obsidian-gold",
  coverMediaRid = null,
  ribbonPalettes = null,
  edgeHex = null,
  gustColors = null,
  autoDelay = 80,
}) {
  const T = resolveTheme(theme);
  const rPals = ribbonPalettes || T.ribbonPalettes;
  const eHex = edgeHex || T.edgeHex;
  const gColors = gustColors || T.gustColors;

  const numStrips = 7;
  const skewX = -240;
  const stepW = 290;
  const stripDefs = [];

  for (let k = 0; k < numStrips; k++) {
    const xTopL = -80 + k * stepW;
    const xTopR = xTopL + stepW + 18;
    const pts = [
      [xTopL, -20],
      [xTopR, -20],
      [xTopR + skewX, 920],
      [xTopL + skewX, 920],
    ];
    const geom = polyFromWorldPts(pts);
    const sid = getSp();
    shapes.push(
      customPolyXml({
        id: sid,
        name: `rig_wind_strip_${k + 1}`,
        x: geom.x,
        y: geom.y,
        w: geom.w,
        h: geom.h,
        ptsNorm: geom.ptsNorm,
        blipRid: coverMediaRid,
        srcRect: coverMediaRid ? calcSrcRect(geom.x, geom.y, geom.w, geom.h) : null,
        gradStops: coverMediaRid ? null : rPals[k % rPals.length],
        gradAngle: 2700000,
        borderHex: k % 2 === 1 ? eHex : T.borderHex,
        borderAlpha: k % 2 === 1 ? 82000 : 50000,
        borderW: k % 2 === 1 ? 2.0 : 1,
      })
    );
    stripDefs.push({ sid, k });
  }

  const pars = [];
  stripDefs.forEach(({ sid, k }) => {
    const twistDir = k % 2 === 0 ? 1 : -1;
    pars.push(
      buildExitEffectPar(ids, {
        spid: sid,
        nodeType: k === 0 ? "afterEffect" : "withEffect",
        grpId: 1,
        delayMs: autoDelay + k * 72,
        durMs: 740,
        pathStr: `M 0 0 C 0.24 -0.06 0.60 -0.25 1.18 -0.62 E`,
        ptsTypes: "AFFA",
        rotByDeg: twistDir * (18 + (k % 3) * 9),
        scaleToX: 52,
        scaleToY: 32,
        fadeFraction: 0.36,
        accel: 64000,
        decel: 8000,
      })
    );
  });

  for (let i = 0; i < 9; i++) {
    const gid = getSp();
    buildSpids.push(gid);
    const gy = 140 + i * 82;
    const gx = -320 - (i % 3) * 110;
    const gw = 260 + (i % 3) * 95;
    shapes.push(
      rectShapeXml({
        id: gid,
        name: `rig_wind_streak_${i + 1}`,
        x: gx,
        y: gy,
        w: gw,
        h: i % 3 === 0 ? 6 : 3.5,
        fillHex: gColors[i % gColors.length],
        fillAlpha: i % 3 === 0 ? 92000 : 75000,
        radius: 50000,
        rotDeg: -19,
      })
    );
    const d = autoDelay + (i % 5) * 70;
    pars.push(
      buildEntrEffectPar(ids, {
        spid: gid,
        nodeType: "withEffect",
        grpId: 1,
        delayMs: d,
        durMs: 720,
        fadeMs: 90,
        pathStr: "M 0 0 C 0.42 -0.15 0.88 -0.32 1.48 -0.52 E",
        ptsTypes: "AFFA",
        accel: 18000,
        decel: 12000,
      }),
      buildExitEffectPar(ids, {
        spid: gid,
        nodeType: "withEffect",
        grpId: 1,
        delayMs: d + 540,
        durMs: 180,
        fadeFraction: 0.95,
      })
    );
  }

  return pars;
}

/**
 * 6. Mechanical Optical Shutter Iris (`iris` / 机械快门光圈·墨玉月洞门开合):
 */
export function addShutterIrisOpeningRig({
  shapes,
  buildSpids,
  ids,
  getSp,
  theme = "obsidian-gold",
  coverMediaRid = null,
  bladeStopsA = null,
  bladeStopsB = null,
  accentHex = null,
  autoDelay = 80,
}) {
  const T = resolveTheme(theme);
  const aHex = accentHex || T.accentHex;
  const sA = bladeStopsA || T.irisStopsA;
  const sB = bladeStopsB || T.irisStopsB;

  const CX = 800;
  const CY = 450;
  const R_OUT = 1140;
  const pars = [];

  for (let k = 0; k < 8; k++) {
    const baseDeg = k * 45;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const pt = (r, deg) => [CX + r * Math.cos(toRad(deg)), CY + r * Math.sin(toRad(deg))];

    const pts = [
      [CX, CY],
      pt(240, baseDeg - 12),
      pt(R_OUT, baseDeg - 10),
      pt(R_OUT + 40, baseDeg + 23),
      pt(R_OUT, baseDeg + 56),
      pt(420, baseDeg + 52),
      pt(210, baseDeg + 30),
    ];
    const geom = polyFromWorldPts(pts);
    const bid = getSp();
    shapes.push(
      customPolyXml({
        id: bid,
        name: `rig_iris_blade_${k + 1}`,
        x: geom.x,
        y: geom.y,
        w: geom.w,
        h: geom.h,
        ptsNorm: geom.ptsNorm,
        blipRid: coverMediaRid,
        srcRect: coverMediaRid ? calcSrcRect(geom.x, geom.y, geom.w, geom.h) : null,
        gradStops: coverMediaRid ? null : k % 2 === 0 ? sA : sB,
        gradAngle: ((k * 45) % 360) * 60000,
        borderHex: aHex,
        borderAlpha: 72000,
        borderW: 1.8,
      })
    );

    const openRad = toRad(baseDeg + 32);
    const travelPx = 1040;
    const dx = (travelPx * Math.cos(openRad)) / SLIDE_W_PX;
    const dy = (travelPx * Math.sin(openRad)) / SLIDE_H_PX;

    pars.push(
      buildExitEffectPar(ids, {
        spid: bid,
        nodeType: k === 0 ? "afterEffect" : "withEffect",
        grpId: 1,
        delayMs: autoDelay + 120,
        durMs: 820,
        pathStr: `M 0 0 C ${(dx * 0.25).toFixed(2)} ${(dy * 0.25).toFixed(2)} ${(dx * 0.65).toFixed(2)} ${(dy * 0.65).toFixed(2)} ${dx.toFixed(2)} ${dy.toFixed(2)} E`,
        ptsTypes: "AFFA",
        rotByDeg: 38,
        scaleToX: 74,
        scaleToY: 74,
        fadeFraction: 0.32,
        accel: 32000,
        decel: 62000,
      })
    );
  }

  const capId = getSp();
  const capRingId = getSp();
  const reticleId = getSp();
  shapes.push(
    presetGeomShapeXml({
      id: capId,
      name: "rig_iris_center_cap",
      prst: "ellipse",
      x: CX - 135,
      y: CY - 135,
      w: 270,
      h: 270,
      gradStops: [
        { pos: 0, hex: T.surfaceHex },
        { pos: 100000, hex: T.bgHex },
      ],
      borderHex: aHex,
      borderAlpha: 85000,
      borderW: 2.2,
    }),
    presetGeomShapeXml({
      id: capRingId,
      name: "rig_iris_cap_ring",
      prst: "donut",
      adjVal: 5500,
      x: CX - 170,
      y: CY - 170,
      w: 340,
      h: 340,
      fillHex: aHex,
      fillAlpha: 82000,
    }),
    presetGeomShapeXml({
      id: reticleId,
      name: "rig_iris_reticle",
      prst: "donut",
      adjVal: 3200,
      x: CX - 245,
      y: CY - 245,
      w: 490,
      h: 490,
      fillHex: T.titleHex,
      fillAlpha: 60000,
    })
  );

  pars.push(
    buildExitEffectPar(ids, {
      spid: capId,
      nodeType: "withEffect",
      grpId: 1,
      delayMs: autoDelay + 30,
      durMs: 320,
      rotByDeg: -65,
      scaleToX: 10,
      scaleToY: 10,
      fadeFraction: 0.65,
      accel: 50000,
    }),
    buildExitEffectPar(ids, {
      spid: capRingId,
      nodeType: "withEffect",
      grpId: 1,
      delayMs: autoDelay,
      durMs: 440,
      scaleToX: 165,
      scaleToY: 165,
      fadeFraction: 0.85,
      decel: 72000,
    }),
    buildExitEffectPar(ids, {
      spid: reticleId,
      nodeType: "withEffect",
      grpId: 1,
      delayMs: autoDelay + 20,
      durMs: 520,
      scaleToX: 185,
      scaleToY: 185,
      fadeFraction: 0.88,
      decel: 75000,
    })
  );

  return pars;
}

/**
 * 7. Ember Burn Outward Dissolve (`fire` / 余烬焚纸·原生高还原近似版):
 * Concentric irregular charred paper sectors fade/recede outward from center as a textured fiery
 * splash ring (`splashMediaRid`) expands rapidly and 18 ember spark motes float upward.
 */
export function addEmberDissolveOpeningRig({
  shapes,
  buildSpids,
  ids,
  getSp,
  theme = "obsidian-gold",
  coverMediaRid = null,
  splashMediaRid = null,
  autoDelay = 80,
}) {
  const T = resolveTheme(theme);

  // Inner circle cover + 4 irregular quadrant sectors over exact [0..1600, 0..900] -> 100% sealed at t=0
  const quads = [
    [
      [0, 0],
      [840, 0],
      [790, 460],
      [0, 490],
    ],
    [
      [830, 0],
      [1600, 0],
      [1600, 440],
      [785, 465],
    ],
    [
      [0, 480],
      [805, 450],
      [860, 900],
      [0, 900],
    ],
    [
      [785, 450],
      [1600, 435],
      [1600, 900],
      [850, 900],
    ],
  ];

  const pars = [];
  quads.forEach((pts, idx) => {
    const geom = polyFromWorldPts(pts);
    const qid = getSp();
    shapes.push(
      customPolyXml({
        id: qid,
        name: `rig_fire_veil_${idx + 1}`,
        x: geom.x,
        y: geom.y,
        w: geom.w,
        h: geom.h,
        ptsNorm: geom.ptsNorm,
        blipRid: coverMediaRid,
        srcRect: coverMediaRid ? calcSrcRect(geom.x, geom.y, geom.w, geom.h) : null,
        fillHex: coverMediaRid ? null : T.fireOuterHex,
        borderHex: T.fireEmberHex,
        borderAlpha: 60000,
        borderW: 1.5,
      })
    );

    const outDirs = [
      { dx: -0.06, dy: -0.05 },
      { dx: 0.06, dy: -0.05 },
      { dx: -0.06, dy: 0.05 },
      { dx: 0.06, dy: 0.05 },
    ];
    const dir = outDirs[idx];
    pars.push(
      buildExitEffectPar(ids, {
        spid: qid,
        nodeType: idx === 0 ? "afterEffect" : "withEffect",
        grpId: 1,
        delayMs: autoDelay + 140 + idx * 55,
        durMs: 680,
        pathStr: `M 0 0 L ${dir.dx} ${dir.dy} E`,
        ptsTypes: "AA",
        fadeFraction: 0.85,
        accel: 18000,
        decel: 50000,
      })
    );
  });

  // Expanding atmospheric mist blooms (or ember waves when softMode is disabled) from screen center (800, 450)
  const isSoft = Boolean(T.softMode);
  for (let w = 0; w < 2; w++) {
    const eid = getSp();
    buildSpids.push(eid);
    if (splashMediaRid) {
      const sz = isSoft ? 620 : 480;
      const off = sz / 2;
      shapes.push(
        picXml({
          id: eid,
          name: `rig_fire_ember_ring_${w + 1}`,
          rId: splashMediaRid,
          x: 800 - off,
          y: 450 - off,
          w: sz,
          h: sz,
          rotDeg: w * 55,
          alpha: isSoft ? (w === 0 ? 88000 : 68000) : w === 0 ? 96000 : 80000,
        })
      );
    } else {
      shapes.push(
        presetGeomShapeXml({
          id: eid,
          name: `rig_fire_ember_ring_${w + 1}`,
          prst: "donut",
          adjVal: isSoft ? 1400 : 6000,
          x: 610,
          y: 260,
          w: 380,
          h: 380,
          fillHex: w === 0 ? (isSoft ? T.fireGoldHex : T.fireEmberHex) : isSoft ? T.fireEmberHex : T.fireGoldHex,
          fillAlpha: isSoft ? 36000 : 92000,
        })
      );
    }

    const d = autoDelay + w * (isSoft ? 190 : 130);
    pars.push(
      buildEntrEffectPar(ids, {
        spid: eid,
        nodeType: "withEffect",
        grpId: 1,
        delayMs: d,
        durMs: isSoft ? 660 : 460,
        fadeMs: isSoft ? 220 : 100,
        scaleFromX: isSoft ? 56 : 12,
        scaleFromY: isSoft ? 56 : 12,
        scaleToX: isSoft ? 138 : 185,
        scaleToY: isSoft ? 138 : 185,
        scaleDurMs: isSoft ? 660 : 460,
        rotByDeg: isSoft ? (w === 0 ? 8 : -10) : w === 0 ? 15 : -20,
      }),
      buildExitEffectPar(ids, {
        spid: eid,
        nodeType: "withEffect",
        grpId: 1,
        delayMs: d + (isSoft ? 420 : 320),
        durMs: isSoft ? 540 : 360,
        scaleToX: isSoft ? 168 : 280,
        scaleToY: isSoft ? 168 : 280,
        fadeFraction: 0.94,
      })
    );
  }

  // 16 floating gold leaf dust motes (or ember sparks) drifting upward across stage
  for (let s = 0; s < 16; s++) {
    const sid = getSp();
    buildSpids.push(sid);
    const sx = 240 + ((s * 83) % 1120);
    const sy = 420 + ((s * 67) % 340);
    const sz = isSoft ? (s % 3 === 0 ? 10 : 6) : s % 3 === 0 ? 16 : 11;
    shapes.push(
      presetGeomShapeXml({
        id: sid,
        name: `rig_fire_spark_${s + 1}`,
        prst: "diamond",
        x: sx,
        y: sy,
        w: sz,
        h: sz,
        fillHex: s % 2 === 0 ? T.fireGoldHex : T.fireEmberHex,
        fillAlpha: isSoft ? 68000 : 94000,
      })
    );
    const driftX = ((s % 5) - 2) * 0.04;
    const driftY = -0.34 - (s % 4) * 0.09;
    pars.push(
      ...buildTransientEffectPars(ids, {
        spid: sid,
        grpId: 1,
        enterDelay: autoDelay + 120 + (s % 6) * 65,
        enterDur: isSoft ? 380 : 240,
        holdMs: isSoft ? 220 : 90,
        exitDur: isSoft ? 760 : 560,
        exitPathStr: `M 0 0 C ${(driftX * 0.6).toFixed(2)} ${(driftY * 0.3).toFixed(2)} ${driftX.toFixed(2)} ${(driftY * 0.7).toFixed(2)} ${(driftX * 1.2).toFixed(2)} ${driftY.toFixed(2)} E`,
        exitPtsTypes: "AFFA",
      })
    );
  }

  return pars;
}

/**
 * 8. Two-Stage Origami Paper Crumple & Parabolic Toss (`crumple` / 揉团抛飞开场):
 * Smoothly pinches full-bleed cover sheet inward toward center (800, 450), hands off seamlessly to a
 * 14-facet rigid-body crumpled paper ball that tightens and launches along a spinning parabolic arc off-screen.
 */
export function addPaperCrumpleTossOpeningRig({
  shapes,
  buildSpids,
  ids,
  getSp,
  theme = "daiqing-ink-gold",
  coverMediaRid = null,
  autoDelay = 80,
}) {
  const T = resolveTheme(theme);
  const sheetId = getSp();

  // Stage 0..1: Intact full-bleed cover rapidly scrunches toward center (800, 450)
  shapes.push(
    rectShapeXml({
      id: sheetId,
      name: "rig_crumple_sheet",
      x: 0,
      y: 0,
      w: SLIDE_W_PX,
      h: SLIDE_H_PX,
      blipRid: coverMediaRid,
      gradStops: coverMediaRid ? null : T.veilStops,
      gradAngle: 5400000,
    })
  );

  const pars = [
    buildExitEffectPar(ids, {
      spid: sheetId,
      nodeType: "afterEffect",
      grpId: 1,
      delayMs: autoDelay,
      durMs: 300,
      rotByDeg: -38,
      scaleToX: 13,
      scaleToY: 18,
      fadeFraction: 0.28,
      accel: 55000,
      decel: 15000,
    }),
  ];

  // Stage 2..3: 14-facet watertight jagged origami crumpled wad (shared bbox guarantees zero drift across transforms!)
  const bx = 665;
  const by = 325;
  const bw = 270;
  const bh = 250;

  const V0 = [2900, 450];
  const V1 = [5400, 100];
  const V2 = [7350, 2150];
  const V3 = [9850, 3250];
  const V4 = [8050, 6150];
  const V5 = [8950, 8850];
  const V6 = [5150, 9850];
  const V7 = [2250, 7950];
  const V8 = [150, 5650];
  const V9 = [1950, 2250];
  const C1 = [3650, 3750];
  const C2 = [6450, 4050];
  const C3 = [4950, 6800];

  const BALL_FACETS = [
    { pts: [V0, V1, C1], tone: T.ribbonPalettes?.[1]?.[0]?.hex || "253C5E" },
    { pts: [V1, V2, C2], tone: T.ribbonPalettes?.[1]?.[1]?.hex || "314F7A" },
    { pts: [V1, C2, C1], tone: T.curtainDark || "0E192A" },
    { pts: [V2, V3, C2], tone: T.secondaryHex || "6B98B3" },
    { pts: [V3, V4, C2], tone: T.surfaceHex || "1B2E4B" },
    { pts: [C2, V4, C3], tone: T.bgHex || "121E30" },
    { pts: [V4, V5, C3], tone: T.ribbonPalettes?.[0]?.[1]?.hex || "213654" },
    { pts: [V5, V6, C3], tone: T.curtainDark || "0D1624" },
    { pts: [V6, V7, C3], tone: T.ribbonPalettes?.[0]?.[0]?.hex || "17263D" },
    { pts: [C1, C2, C3], tone: T.accentHex || "DFC07A", isFoil: true },
    { pts: [V7, C3, C1], tone: T.bgHex || "101B2D" },
    { pts: [V7, C1, V8], tone: T.ribbonPalettes?.[1]?.[0]?.hex || "233A59" },
    { pts: [V8, C1, V9], tone: T.surfaceHex || "1A2C47" },
    { pts: [V9, C1, V0], tone: T.ribbonPalettes?.[1]?.[1]?.hex || "2F4C75" },
  ];

  const squeezeDelay = autoDelay + 230;
  const squeezeDur = 190;
  const tossDelay = squeezeDelay + squeezeDur;

  BALL_FACETS.forEach((f, fi) => {
    const fid = getSp();
    buildSpids.push(fid);
    shapes.push(
      customPolyXml({
        id: fid,
        name: `rig_crumple_ball_${fi + 1}`,
        x: bx,
        y: by,
        w: bw,
        h: bh,
        ptsNorm: f.pts,
        fillHex: f.tone,
        fillAlpha: f.isFoil ? 88000 : 97000,
        borderHex: T.accentHex,
        borderAlpha: f.isFoil ? 78000 : 42000,
        borderW: f.isFoil ? 1.15 : 0.75,
      })
    );

    pars.push(
      buildEntrEffectPar(ids, {
        spid: fid,
        nodeType: "withEffect",
        grpId: 1,
        delayMs: squeezeDelay,
        durMs: squeezeDur,
        fadeMs: 65,
        rotByDeg: -16,
        rotDurMs: squeezeDur,
        scaleFromX: 130,
        scaleFromY: 130,
        scaleToX: 94,
        scaleToY: 94,
        scaleDurMs: squeezeDur,
        decel: 72000,
      }),
      buildExitEffectPar(ids, {
        spid: fid,
        nodeType: "withEffect",
        grpId: 1,
        delayMs: tossDelay,
        durMs: 640,
        pathStr: "M 0 0 C 0.16 -0.26 0.42 -0.32 0.72 -0.10 E",
        ptsTypes: "AFFA",
        rotByDeg: 335,
        scaleToX: 44,
        scaleToY: 44,
        fadeFraction: 0.25,
        accel: 32000,
        decel: 16000,
      })
    );
  });

  // 6 soft floating dust flecks left behind as the ball flies off frame
  for (let i = 0; i < 6; i++) {
    const did = getSp();
    buildSpids.push(did);
    const sx = 735 + ((i * 53) % 160);
    const sy = 395 + ((i * 41) % 120);
    const sz = i % 2 === 0 ? 8 : 6;
    shapes.push(
      presetGeomShapeXml({
        id: did,
        name: `rig_crumple_fleck_${i + 1}`,
        prst: "diamond",
        x: sx,
        y: sy,
        w: sz,
        h: sz,
        fillHex: i % 2 === 0 ? T.accentHex : T.secondaryHex,
        fillAlpha: 58000,
      })
    );
    const dx = 0.08 + (i % 3) * 0.05;
    const dy = -0.12 - (i % 2) * 0.06;
    pars.push(
      ...buildTransientEffectPars(ids, {
        spid: did,
        grpId: 1,
        enterDelay: tossDelay + 20 + i * 35,
        enterDur: 220,
        holdMs: 80,
        exitDur: 460,
        exitPathStr: `M 0 0 L ${dx.toFixed(2)} ${dy.toFixed(2)} E`,
        exitPtsTypes: "AA",
      })
    );
  }

  return pars;
}

// ---------- Universal OOXML Slide & Media Packager ----------
export function packagePptx({
  outPath,
  slides,
  themeName = "KineticTheme",
  bgSchemeHex = "07090D",
  darkHex = "111827",
  lightHex = "F5EFE4",
}) {
  // Deduplicate all referenced media files globally across all slides -> ppt/media/media1.*
  const mediaMap = new Map(); // absPath -> { zipPath, buf, ext }
  const usedExts = new Set();
  let mediaCounter = 1;

  for (const s of slides) {
    if (!s.mediaPaths) continue;
    for (const mp of s.mediaPaths) {
      if (!mediaMap.has(mp)) {
        const ext = path.extname(mp).toLowerCase().replace(".", "") || "png";
        usedExts.add(ext === "jpeg" ? "jpg" : ext);
        const zipName = `media${mediaCounter++}.${ext === "jpeg" ? "jpg" : ext}`;
        mediaMap.set(mp, { zipPath: `ppt/media/${zipName}`, relTarget: `../media/${zipName}`, buf: fs.readFileSync(mp) });
      }
    }
  }

  const slideShell = (s) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
       xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="${s.bgColor || bgSchemeHex}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${s.shapesXml}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
  ${s.transitionXml || ""}
  ${s.timingXml || ""}
</p:sld>`;

  const imgDefaults = [];
  if (usedExts.has("png")) imgDefaults.push(`<Default Extension="png" ContentType="image/png"/>`);
  if (usedExts.has("jpg")) imgDefaults.push(`<Default Extension="jpg" ContentType="image/jpeg"/>`);

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${imgDefaults.join("\n  ")}
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>
  <Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>
  <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
  ${slides
    .map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`)
    .join("\n  ")}
</Types>`;

  const entries = [
    { name: "[Content_Types].xml", data: contentTypesXml },
    {
      name: "_rels/.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`,
    },
    {
      name: "ppt/presentation.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join("")}</p:sldIdLst>
  <p:sldSz cx="${SLIDE_W}" cy="${SLIDE_H}"/>
  <p:notesSz cx="${SLIDE_H}" cy="${SLIDE_W}"/>
  <p:defaultTextStyle><a:defPPr><a:defRPr lang="zh-CN"/></a:defPPr></p:defaultTextStyle>
</p:presentation>`,
    },
    {
      name: "ppt/_rels/presentation.xml.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  ${slides
    .map((_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`)
    .join("\n  ")}
  <Relationship Id="rId${slides.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/>
  <Relationship Id="rId${slides.length + 3}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps" Target="viewProps.xml"/>
  <Relationship Id="rId${slides.length + 4}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
  <Relationship Id="rId${slides.length + 5}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/>
</Relationships>`,
    },
    { name: "ppt/presProps.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentationPr xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>` },
    {
      name: "ppt/viewProps.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:viewPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr></p:viewPr>`,
    },
    {
      name: "ppt/tableStyles.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`,
    },
    {
      name: "ppt/slideMasters/slideMaster1.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`,
    },
    {
      name: "ppt/slideMasters/_rels/slideMaster1.xml.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`,
    },
    {
      name: "ppt/slideLayouts/slideLayout1.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`,
    },
    {
      name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`,
    },
    {
      name: "ppt/theme/theme1.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="${esc(themeName)}"><a:themeElements><a:clrScheme name="${esc(themeName)}"><a:dk1><a:srgbClr val="${darkHex}"/></a:dk1><a:lt1><a:srgbClr val="${lightHex}"/></a:lt1><a:dk2><a:srgbClr val="${darkHex}"/></a:dk2><a:lt2><a:srgbClr val="${lightHex}"/></a:lt2><a:accent1><a:srgbClr val="E6C27A"/></a:accent1><a:accent2><a:srgbClr val="C83228"/></a:accent2><a:accent3><a:srgbClr val="38BDF8"/></a:accent3><a:accent4><a:srgbClr val="1D4ED8"/></a:accent4><a:accent5><a:srgbClr val="10B981"/></a:accent5><a:accent6><a:srgbClr val="F59E0B"/></a:accent6><a:hlink><a:srgbClr val="E6C27A"/></a:hlink><a:folHlink><a:srgbClr val="94A3B8"/></a:folHlink></a:clrScheme><a:fontScheme name="ModernFonts"><a:majorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Microsoft YaHei"/></a:majorFont><a:minorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Microsoft YaHei"/></a:minorFont></a:fontScheme><a:fmtScheme name="ModernFmt"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`,
    },
  ];

  // Write packaged media buffers once
  for (const [, m] of mediaMap) {
    entries.push({ name: m.zipPath, data: m.buf });
  }

  slides.forEach((s, i) => {
    entries.push({ name: `ppt/slides/slide${i + 1}.xml`, data: slideShell(s) });
    const mediaRels = (s.mediaPaths || [])
      .map((mp, idx) => {
        const m = mediaMap.get(mp);
        return `<Relationship Id="rId${idx + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${m.relTarget}"/>`;
      })
      .join("\n  ");

    entries.push({
      name: `ppt/slides/_rels/slide${i + 1}.xml.rels`,
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  ${mediaRels}
</Relationships>`,
    });
  });

  const buf = buildZip(entries);
  fs.writeFileSync(outPath, buf);
  return { outPath, bytes: buf.length, slidesCount: slides.length, mediaCount: mediaMap.size };
}
