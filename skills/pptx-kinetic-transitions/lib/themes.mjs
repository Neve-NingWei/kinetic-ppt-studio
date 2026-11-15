/**
 * Pluggable Theme Presets for Native PPTX Kinetic Transitions
 * Decouples visual skins (colors, typography, rig textures/palettes) from physics & timing.
 * Open-source developers can pick a named preset OR pass partial overrides:
 *   resolveTheme({ preset: "obsidian-gold", accentHex: "D4AF37" })
 */

export const THEME_PRESETS = {
  "daiqing-ink-gold": {
    name: "DaiqingInkGold",
    label: "黛青墨夜 · 柔金微光",
    softMode: true,
    bgHex: "111C2D",
    surfaceHex: "192942",
    surfaceAlpha: 72000,
    borderHex: "4B6B8A",
    titleHex: "F7F1E3",
    bodyHex: "DCE4EE",
    mutedHex: "9EB2C7",
    accentHex: "DFC07A",
    secondaryHex: "6B98B3",
    crimsonHex: "8A4F5A",
    bladeTopStops: [
      { pos: 0, hex: "142238" },
      { pos: 100000, hex: "1F3352" },
    ],
    bladeBotStops: [
      { pos: 0, hex: "192A44" },
      { pos: 100000, hex: "101B2D" },
    ],
    curtainDark: "0F1B2E",
    curtainMid: "192C47",
    curtainHi: "243E63",
    curtainTrim: "DFC07A",
    veilStops: [
      { pos: 0, hex: "16243A" },
      { pos: 100000, hex: "223756" },
    ],
    veilBorderHex: "DFC07A",
    veilAccentHex: "9B3D36",
    cranePalettes: [
      { farWing: "26415E", body: "3B6287", neck: "6894B8", nearWing: "BFD6E6", edge: "1A2E44" },
      { farWing: "9E803F", body: "C7A355", neck: "DFC07A", nearWing: "F2E1B3", edge: "785F2C" },
      { farWing: "2B5359", body: "3F737A", neck: "6CA0A6", nearWing: "B8DCDE", edge: "1D3A3E" },
    ],
    shardPalettes: [
      [
        { pos: 0, hex: "152338" },
        { pos: 100000, hex: "213554" },
      ],
      [
        { pos: 0, hex: "192942" },
        { pos: 100000, hex: "284062" },
      ],
      [
        { pos: 0, hex: "111D2F" },
        { pos: 100000, hex: "1C2E49" },
      ],
    ],
    shockColors: ["DFC07A", "7AA4BD", "D4DEE8"],
    seamHex: "DFC07A",
    ribbonPalettes: [
      [
        { pos: 0, hex: "152338" },
        { pos: 100000, hex: "223757" },
      ],
      [
        { pos: 0, hex: "1B2D47" },
        { pos: 100000, hex: "294266" },
      ],
    ],
    edgeHex: "DFC07A",
    gustColors: ["DFC07A", "7AA4BD", "DCE6F0"],
    irisStopsA: [
      { pos: 0, hex: "142136" },
      { pos: 100000, hex: "223654" },
    ],
    irisStopsB: [
      { pos: 0, hex: "1A2B45" },
      { pos: 100000, hex: "2A4268" },
    ],
    fireOuterHex: "152236",
    fireMidHex: "233856",
    fireEmberHex: "7AA4BD",
    fireGoldHex: "DFC07A",
    fontTitle: "Microsoft YaHei",
    fontBody: "Microsoft YaHei",
  },

  "obsidian-gold": {
    name: "ObsidianGold",
    label: "玄黑墨金 · 漆绝",
    bgHex: "07090D",
    surfaceHex: "0E131D",
    surfaceAlpha: 90000,
    borderHex: "5C4A28",
    titleHex: "F5EFE4",
    bodyHex: "C9C2B6",
    mutedHex: "8A8273",
    accentHex: "E6C27A",
    secondaryHex: "CFA042",
    crimsonHex: "C83228",
    bladeTopStops: [
      { pos: 0, hex: "05070B" },
      { pos: 100000, hex: "141923" },
    ],
    bladeBotStops: [
      { pos: 0, hex: "101520" },
      { pos: 100000, hex: "040508" },
    ],
    curtainDark: "0B0D14",
    curtainMid: "191E2A",
    curtainHi: "2A3142",
    curtainTrim: "E6C27A",
    veilStops: [
      { pos: 0, hex: "090C12" },
      { pos: 100000, hex: "161C28" },
    ],
    veilBorderHex: "5C4A28",
    veilAccentHex: "C83228",
    cranePalettes: [
      { farWing: "8E6920", body: "C89836", neck: "E6C27A", nearWing: "F6DFAC", edge: "664A12" },
      { farWing: "7E1B16", body: "B92920", neck: "D9483B", nearWing: "EE7564", edge: "59100C" },
      { farWing: "1B222D", body: "2D3748", neck: "4A5568", nearWing: "A0AEC0", edge: "0B0F17" },
    ],
    shardPalettes: [
      [
        { pos: 0, hex: "0A0D14" },
        { pos: 100000, hex: "181E2C" },
      ],
      [
        { pos: 0, hex: "0F131C" },
        { pos: 100000, hex: "222838" },
      ],
      [
        { pos: 0, hex: "07090F" },
        { pos: 100000, hex: "121722" },
      ],
    ],
    shockColors: ["E6C27A", "C83228", "F5EFE4"],
    seamHex: "E6C27A",
    ribbonPalettes: [
      [
        { pos: 0, hex: "0A0D13" },
        { pos: 100000, hex: "191F2C" },
      ],
      [
        { pos: 0, hex: "10141D" },
        { pos: 100000, hex: "242B3A" },
      ],
    ],
    edgeHex: "E6C27A",
    gustColors: ["E6C27A", "C83228", "F5EFE4"],
    irisStopsA: [
      { pos: 0, hex: "070A10" },
      { pos: 100000, hex: "161D29" },
    ],
    irisStopsB: [
      { pos: 0, hex: "0C1018" },
      { pos: 100000, hex: "1F2737" },
    ],
    fireOuterHex: "08090D",
    fireMidHex: "3A140E",
    fireEmberHex: "D9481E",
    fireGoldHex: "F5B841",
    fontTitle: "Microsoft YaHei",
    fontBody: "Microsoft YaHei",
  },

  "xuan-splash": {
    name: "XuanSplash",
    label: "暖白宣纸 · 青墨山水",
    bgHex: "FBF7EE",
    surfaceHex: "FFFFFF",
    surfaceAlpha: 86000,
    borderHex: "D6C7AE",
    titleHex: "171D26",
    bodyHex: "475569",
    mutedHex: "78716C",
    accentHex: "C83228",
    secondaryHex: "B8862D",
    crimsonHex: "C83228",
    bladeTopStops: [
      { pos: 0, hex: "F5EFE3" },
      { pos: 100000, hex: "E6DBC6" },
    ],
    bladeBotStops: [
      { pos: 0, hex: "EAE0CC" },
      { pos: 100000, hex: "D8C9AE" },
    ],
    curtainDark: "591015",
    curtainMid: "9E241E",
    curtainHi: "C83228",
    curtainTrim: "CFA042",
    veilStops: [
      { pos: 0, hex: "F5EFE3" },
      { pos: 100000, hex: "E7DBC5" },
    ],
    veilBorderHex: "D6C7AE",
    veilAccentHex: "C83228",
    cranePalettes: [
      { farWing: "9E241E", body: "C83228", neck: "DF5A3F", nearWing: "F27457", edge: "821B16" },
      { farWing: "9E7322", body: "C89836", neck: "E4BD62", nearWing: "F4DA92", edge: "855F19" },
      { farWing: "1F2937", body: "334155", neck: "64748B", nearWing: "CBD5E1", edge: "0F172A" },
    ],
    shardPalettes: [
      [
        { pos: 0, hex: "EDE5D5" },
        { pos: 100000, hex: "DFD3BC" },
      ],
      [
        { pos: 0, hex: "F3ECE0" },
        { pos: 100000, hex: "E5DAC6" },
      ],
      [
        { pos: 0, hex: "E2D6C1" },
        { pos: 100000, hex: "D2C3A8" },
      ],
    ],
    shockColors: ["C83228", "B8862D", "334155"],
    seamHex: "B8862D",
    ribbonPalettes: [
      [
        { pos: 0, hex: "EFE7D7" },
        { pos: 100000, hex: "DFD2BB" },
      ],
      [
        { pos: 0, hex: "F5EFE2" },
        { pos: 100000, hex: "E6DAC4" },
      ],
    ],
    edgeHex: "C83228",
    gustColors: ["C83228", "B8862D", "334155"],
    irisStopsA: [
      { pos: 0, hex: "26303D" },
      { pos: 100000, hex: "171D26" },
    ],
    irisStopsB: [
      { pos: 0, hex: "323E4E" },
      { pos: 100000, hex: "1E2632" },
    ],
    fireOuterHex: "EFE6D4",
    fireMidHex: "5C3A21",
    fireEmberHex: "C83228",
    fireGoldHex: "CFA042",
    fontTitle: "Microsoft YaHei",
    fontBody: "Microsoft YaHei",
  },

  "keynote-slate": {
    name: "KeynoteSlate",
    label: "深空光学 · Keynote",
    bgHex: "04070E",
    surfaceHex: "0E1729",
    surfaceAlpha: 90000,
    borderHex: "1E3A5F",
    titleHex: "F8FAFC",
    bodyHex: "CBD5E1",
    mutedHex: "94A3B8",
    accentHex: "38BDF8",
    secondaryHex: "818CF8",
    crimsonHex: "38BDF8",
    bladeTopStops: [
      { pos: 0, hex: "05080F" },
      { pos: 100000, hex: "0F172A" },
    ],
    bladeBotStops: [
      { pos: 0, hex: "0B1220" },
      { pos: 100000, hex: "04060B" },
    ],
    curtainDark: "0B1325",
    curtainMid: "162447",
    curtainHi: "1F4068",
    curtainTrim: "38BDF8",
    veilStops: [
      { pos: 0, hex: "070C17" },
      { pos: 100000, hex: "111D33" },
    ],
    veilBorderHex: "1E3A5F",
    veilAccentHex: "38BDF8",
    cranePalettes: [
      { farWing: "0284C7", body: "0EA5E9", neck: "38BDF8", nearWing: "BAE6FD", edge: "0369A1" },
      { farWing: "4F46E5", body: "6366F1", neck: "818CF8", nearWing: "C7D2FE", edge: "3730A3" },
      { farWing: "1E293B", body: "334155", neck: "64748B", nearWing: "E2E8F0", edge: "0F172A" },
    ],
    shardPalettes: [
      [
        { pos: 0, hex: "0B1120" },
        { pos: 100000, hex: "16223B" },
      ],
      [
        { pos: 0, hex: "0F172A" },
        { pos: 100000, hex: "1E293B" },
      ],
      [
        { pos: 0, hex: "060A13" },
        { pos: 100000, hex: "10192B" },
      ],
    ],
    shockColors: ["38BDF8", "818CF8", "F8FAFC"],
    seamHex: "38BDF8",
    ribbonPalettes: [
      [
        { pos: 0, hex: "09101E" },
        { pos: 100000, hex: "13203A" },
      ],
      [
        { pos: 0, hex: "0D172B" },
        { pos: 100000, hex: "1B2D4F" },
      ],
    ],
    edgeHex: "38BDF8",
    gustColors: ["38BDF8", "818CF8", "E0F2FE"],
    irisStopsA: [
      { pos: 0, hex: "0D131F" },
      { pos: 100000, hex: "1A2438" },
    ],
    irisStopsB: [
      { pos: 0, hex: "111927" },
      { pos: 100000, hex: "223047" },
    ],
    fireOuterHex: "050912",
    fireMidHex: "0E2A47",
    fireEmberHex: "38BDF8",
    fireGoldHex: "818CF8",
    fontTitle: "Microsoft YaHei",
    fontBody: "Microsoft YaHei",
  },

  "swiss-architect": {
    name: "SwissArchitect",
    label: "极简瑞士建筑构成",
    bgHex: "F2EFE9",
    surfaceHex: "FFFFFF",
    surfaceAlpha: 78000,
    borderHex: "D4CDC0",
    titleHex: "111315",
    bodyHex: "334155",
    mutedHex: "64748B",
    accentHex: "DC2626",
    secondaryHex: "111315",
    crimsonHex: "DC2626",
    bladeTopStops: [
      { pos: 0, hex: "1E2228" },
      { pos: 100000, hex: "2E343D" },
    ],
    bladeBotStops: [
      { pos: 0, hex: "282D35" },
      { pos: 100000, hex: "171A1F" },
    ],
    curtainDark: "7F1D1D",
    curtainMid: "B91C1C",
    curtainHi: "DC2626",
    curtainTrim: "F8FAFC",
    veilStops: [
      { pos: 0, hex: "E7E2D8" },
      { pos: 100000, hex: "D5CFC2" },
    ],
    veilBorderHex: "111315",
    veilAccentHex: "DC2626",
    cranePalettes: [
      { farWing: "991B1B", body: "DC2626", neck: "EF4444", nearWing: "FCA5A5", edge: "7F1D1D" },
      { farWing: "111315", body: "334155", neck: "475569", nearWing: "94A3B8", edge: "000000" },
      { farWing: "B45309", body: "D97706", neck: "F59E0B", nearWing: "FDE68A", edge: "78350F" },
    ],
    shardPalettes: [
      [
        { pos: 0, hex: "181B20" },
        { pos: 100000, hex: "262B33" },
      ],
      [
        { pos: 0, hex: "20242B" },
        { pos: 100000, hex: "323842" },
      ],
    ],
    shockColors: ["DC2626", "111315", "FFFFFF"],
    seamHex: "DC2626",
    ribbonPalettes: [
      [
        { pos: 0, hex: "1E2228" },
        { pos: 100000, hex: "2E343D" },
      ],
      [
        { pos: 0, hex: "282D35" },
        { pos: 100000, hex: "39414C" },
      ],
    ],
    edgeHex: "DC2626",
    gustColors: ["DC2626", "F8FAFC", "94A3B8"],
    irisStopsA: [
      { pos: 0, hex: "1C1F24" },
      { pos: 100000, hex: "2C313A" },
    ],
    irisStopsB: [
      { pos: 0, hex: "252A32" },
      { pos: 100000, hex: "373E49" },
    ],
    fireOuterHex: "1C1F24",
    fireMidHex: "7F1D1D",
    fireEmberHex: "DC2626",
    fireGoldHex: "F59E0B",
    fontTitle: "Microsoft YaHei",
    fontBody: "Microsoft YaHei",
  },

  "street-neon": {
    name: "StreetNeon",
    label: "街头工业霓虹",
    bgHex: "0A0C12",
    surfaceHex: "111622",
    surfaceAlpha: 94000,
    borderHex: "2A3347",
    titleHex: "F8FAFC",
    bodyHex: "CBD5E1",
    mutedHex: "94A3B8",
    accentHex: "FACC15",
    secondaryHex: "00F5D4",
    crimsonHex: "FF2E63",
    bladeTopStops: [
      { pos: 0, hex: "141821" },
      { pos: 100000, hex: "1E2636" },
    ],
    bladeBotStops: [
      { pos: 0, hex: "191F2C" },
      { pos: 100000, hex: "0E1219" },
    ],
    curtainDark: "58102A",
    curtainMid: "B91C4A",
    curtainHi: "FF2E63",
    curtainTrim: "FACC15",
    veilStops: [
      { pos: 0, hex: "121620" },
      { pos: 100000, hex: "1E2536" },
    ],
    veilBorderHex: "FACC15",
    veilAccentHex: "FF2E63",
    cranePalettes: [
      { farWing: "B45309", body: "EAB308", neck: "FACC15", nearWing: "FEF08A", edge: "78350F" },
      { farWing: "9D174D", body: "E11D48", neck: "FF2E63", nearWing: "FDA4AF", edge: "881337" },
      { farWing: "0F766E", body: "0D9488", neck: "00F5D4", nearWing: "99F6E4", edge: "134E4A" },
    ],
    shardPalettes: [
      [
        { pos: 0, hex: "141821" },
        { pos: 100000, hex: "1E2636" },
      ],
      [
        { pos: 0, hex: "191F2C" },
        { pos: 100000, hex: "263044" },
      ],
      [
        { pos: 0, hex: "0E1219" },
        { pos: 100000, hex: "171D28" },
      ],
    ],
    shockColors: ["FACC15", "FF2E63", "00F5D4"],
    seamHex: "FACC15",
    ribbonPalettes: [
      [
        { pos: 0, hex: "141821" },
        { pos: 100000, hex: "20283A" },
      ],
      [
        { pos: 0, hex: "1B2130" },
        { pos: 100000, hex: "2B3448" },
      ],
    ],
    edgeHex: "FF2E63",
    gustColors: ["FACC15", "00F5D4", "FF2E63"],
    irisStopsA: [
      { pos: 0, hex: "10141D" },
      { pos: 100000, hex: "1D2536" },
    ],
    irisStopsB: [
      { pos: 0, hex: "171D2A" },
      { pos: 100000, hex: "273247" },
    ],
    fireOuterHex: "0D1017",
    fireMidHex: "7F1D1D",
    fireEmberHex: "FF2E63",
    fireGoldHex: "FACC15",
    fontTitle: "Microsoft YaHei",
    fontBody: "Microsoft YaHei",
  },
};

export function resolveTheme(themeOrPreset = "obsidian-gold") {
  if (typeof themeOrPreset === "string") {
    return THEME_PRESETS[themeOrPreset] || THEME_PRESETS["obsidian-gold"];
  }
  const base = THEME_PRESETS[themeOrPreset?.preset || "obsidian-gold"] || THEME_PRESETS["obsidian-gold"];
  return { ...base, ...themeOrPreset };
}
