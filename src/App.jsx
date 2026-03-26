//V1.08
// adding the shop drawing tool for notes when adding a not on the right face of a cabinet box where you click is horizonally inverse (ie click absolute left top it places at absolute right top)



import React, { useEffect, useMemo, useRef, useState } from "react";
import cabinetkitLogoDark from "./assets/cabinetkit_logo_DarkMode.png";
import cabinetkitLogoLight from "./assets/cabinetkit_logo_Normal.png";

// ==================================================
// CabinetKit Studio Next
// Fresh rebuild with the viewport as the full background.
// This is the clean foundation app we can build on.
// ==================================================

const IDLE_AUTO_ROTATE_DELAY_MS = 60000;
const IDLE_AUTO_ROTATE_SPEED_DEG_PER_MS = 0.009;

const LIGHT_THEME_VARS = {
  "--app-bg": "#e4e7ec",
  "--text-main": "#18181b",
  "--text-soft": "#3f3f46",
  "--text-muted": "#71717a",
  "--glass-bg": "rgba(255,255,255,0.68)",
  "--glass-border": "rgba(255,255,255,0.72)",
  "--glass-shadow": "0 18px 50px rgba(15,23,42,0.12)",
  "--panel-bg": "rgba(255,255,255,0.58)",
  "--panel-border": "rgba(100,116,139,0.34)",
  "--control-bg": "rgba(255,255,255,0.62)",
  "--control-border": "rgba(100,116,139,0.38)",
  "--accent-bg": "rgba(148,163,184,0.16)",
  "--accent-border": "rgba(100,116,139,0.36)",
  "--accent-text": "#334155",
  "--viewport-bg": "radial-gradient(circle at top, rgba(255,255,255,0.98), rgba(236,240,246,0.96) 34%, rgba(223,229,236,1) 100%)",
  "--plane-floor": "linear-gradient(180deg,rgba(239,243,247,0.94),rgba(224,229,236,0.96))",
  "--plane-floor-border": "rgba(125,211,252,0.28)",
  "--plane-back": "linear-gradient(180deg,rgba(236,243,241,0.82),rgba(229,236,235,0.70))",
  "--plane-back-border": "rgba(52,211,153,0.22)",
  "--plane-side": "linear-gradient(180deg,rgba(245,247,249,0.72),rgba(232,236,241,0.62))",
  "--plane-side-border": "rgba(100,116,139,0.24)",
  "--move-grid-major": "rgba(37,99,235,0.34)",
  "--move-grid-minor": "rgba(59,130,246,0.18)",
  "--move-grid-border": "rgba(37,99,235,0.42)",
};

const DARK_THEME_VARS = {
  "--app-bg": "#09090b",
  "--text-main": "#f4f4f5",
  "--text-soft": "#d4d4d8",
  "--text-muted": "#a1a1aa",
  "--glass-bg": "rgba(24,24,27,0.68)",
  "--glass-border": "rgba(255,255,255,0.08)",
  "--glass-shadow": "0 18px 50px rgba(0,0,0,0.34)",
  "--panel-bg": "rgba(255,255,255,0.05)",
  "--panel-border": "rgba(255,255,255,0.12)",
  "--control-bg": "rgba(255,255,255,0.04)",
  "--control-border": "rgba(255,255,255,0.14)",
  "--accent-bg": "rgba(161,161,170,0.14)",
  "--accent-border": "rgba(161,161,170,0.22)",
  "--accent-text": "#e4e4e7",
  "--viewport-bg": "radial-gradient(circle at top, rgba(39,39,42,0.98), rgba(24,24,27,0.98) 34%, rgba(9,9,11,1) 100%)",
  "--plane-floor": "linear-gradient(180deg,rgba(39,39,42,0.94),rgba(24,24,27,0.96))",
  "--plane-floor-border": "rgba(161,161,170,0.16)",
  "--plane-back": "linear-gradient(180deg,rgba(39,39,42,0.82),rgba(24,24,27,0.78))",
  "--plane-back-border": "rgba(161,161,170,0.12)",
  "--plane-side": "linear-gradient(180deg,rgba(39,39,42,0.62),rgba(24,24,27,0.58))",
  "--plane-side-border": "rgba(161,161,170,0.10)",
  "--hover-front-bg": "#ffffff",
  "--hover-front-text": "#111827",
  "--hover-spec-bg": "rgba(255,255,255,0.88)",
  "--hover-spec-border": "rgba(255,255,255,0.18)",
  "--hover-spec-label": "#334155",
  "--hover-spec-text": "#111827",
  "--move-grid-major": "rgba(255,255,255,0.34)",
  "--move-grid-minor": "rgba(255,255,255,0.18)",
  "--move-grid-border": "rgba(255,255,255,0.42)",
};

const UI_SETTINGS_STORAGE_KEY = "cabinetkit-ui-settings-v1";
const DEFAULT_UI_PREFS = {
  spacingMode: "standard",
  activeEditorMode: "medium",
  largeFont: false,
  highContrast: false,
};

const SPACING_PRESETS = {
  compact: {
    density: 0.8,
    fontScale: 0.94,
  },
  standard: {
    density: 1,
    fontScale: 1,
  },
  cozy: {
    density: 1.12,
    fontScale: 1.03,
  },
};

const ACTIVE_EDITOR_PRESETS = {
  low: {
    collapsedWidthRatio: 0.22,
    expandedHeightRatio: 0.25,
    contentHeightRatio: 0.18,
  },
  medium: {
    collapsedWidthRatio: 0.21,
    expandedHeightRatio: 0.46,
    contentHeightRatio: 0.31,
  },
  large: {
    collapsedWidthRatio: 0.21,
    expandedHeightRatio: 0.78,
    contentHeightRatio: 0.65,
  },
};

const ACTIVE_EDITOR_MODE_ORDER = ["low", "medium", "large"];

const CAMERA_VIEW_PRESETS = {
  top: { label: "Top", orbit: 0, tilt: -89.5, panX: 0, panY: 0 },
  front: { label: "Front", orbit: 0, tilt: 0, panX: 0, panY: 0 },
  right: { label: "Right", orbit: -90, tilt: 0, panX: 0, panY: 0 },
  isoLeft: { label: "Iso Left", orbit: -34, tilt: -18, panX: 0, panY: 0 },
  isoRight: { label: "Iso Right", orbit: 34, tilt: -18, panX: 0, panY: 0 },
};

const APP_NAME = "CabinetKit Studio";
const APP_FILE_TYPE = "cabinetkit-studio-project";
const APP_FILE_VERSION = "1.0";
const COUNTERTOP_SINGLE_PIECE_MAX_LONG_IN = 144;
const COUNTERTOP_SINGLE_PIECE_MAX_SHORT_IN = 60;

function getNextActiveEditorMode(mode = "medium") {
  const currentIndex = ACTIVE_EDITOR_MODE_ORDER.indexOf(mode);
  if (currentIndex === -1) return "medium";
  return ACTIVE_EDITOR_MODE_ORDER[(currentIndex + 1) % ACTIVE_EDITOR_MODE_ORDER.length];
}

function getHighContrastThemeVars(themeVars, isDark) {
  return {
    ...themeVars,
    "--text-main": isDark ? "#ffffff" : "#09090b",
    "--text-soft": isDark ? "#f4f4f5" : "#18181b",
    "--text-muted": isDark ? "#e4e4e7" : "#27272a",
    "--glass-border": isDark ? "rgba(255,255,255,0.24)" : "rgba(15,23,42,0.24)",
    "--panel-border": isDark ? "rgba(255,255,255,0.26)" : "rgba(15,23,42,0.34)",
    "--control-border": isDark ? "rgba(255,255,255,0.32)" : "rgba(15,23,42,0.40)",
    "--accent-border": isDark ? "rgba(255,255,255,0.42)" : "rgba(15,23,42,0.48)",
    "--accent-bg": isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.10)",
  };
}

const DEFAULTS = {
  projectName: "My Kit",
  roomWidth: 144,
  roomDepth: 144,
  roomHeight: 108,
  toeKickHeight: 3,
  cameraMode: "perspective",
  viewportWall: 1,
  zoom: 1,
  panX: 0,
  panY: 0,
  orbit: -34,
  tilt: -18,
  dragMode: "orbit",
  walls: [1],
  sectionDefaults: {
    width: 15,
    height: 29.75,
    depth: 23,
    kickEnabled: true,
    toeKickHeight: 3,
    toeKickDepth: 3,
    aboveFloor: 0,
    shelfCount: 1,
    adjustableShelves: true,
    pinHoleSpacing: 1.25,
    doorsEnabled: true,
    doorStyle: "auto",
    doorGap: 0.125,
    doorOpen: false,
    doorHand: "left",
    doorKind: "flat",
    doorMount: "overlay",
    doorInsetDepth: 0,
    doorProfile: 2.25,
    shakerSlim: false,
    continuousSidePanel: false,
    ponyWallCoreType: "2x4",
    ponyWallDrywallThickness: 0.5,
    ponyWallDrywallSides: 2,
    fillerView: "front",
    fillerPlacement: "left",
    fillerThickness: 0.75,
    fillerFlushTarget: "box",
    drawerMode: "none",
    drawerCount: 3,
    topDrawerHeight: 6,
    drawerOpen: false,
    drawerSlideType: "undermount",
    drawerSoftClose: true,
    drawerSideWallThickness: 0.5,
    drawerOpenStates: [false, false, false, false, false],
    faceFinishType: "paint",
    faceFinishTone: "white",
    faceFinishSupplier: "",
    faceFinishCode: "",
    faceFinishCustomHex: "#d8ccb7",
    rotationDeg: 0,
    activeWall: "back",
    type: "cabinet",
  },
  cabinet: {
    width: 15,
    height: 29.75,
    depth: 23,
    type: "cabinet",
    kickEnabled: true,
    toeKickHeight: 3,
    toeKickDepth: 3,
    aboveFloor: 0,
    shelfCount: 1,
    adjustableShelves: true,
    pinHoleSpacing: 1.25,
    doorsEnabled: true,
    doorStyle: "auto",
    doorGap: 0.125,
    doorOpen: false,
    doorHand: "left",
    doorKind: "flat",
    doorMount: "overlay",
    doorInsetDepth: 0,
    doorProfile: 2.25,
    shakerSlim: false,
    continuousSidePanel: false,
    ponyWallCoreType: "2x4",
    ponyWallDrywallThickness: 0.5,
    ponyWallDrywallSides: 2,
    fillerView: "front",
    fillerPlacement: "left",
    fillerThickness: 0.75,
    fillerFlushTarget: "box",
    drawerMode: "none",
    drawerCount: 3,
    topDrawerHeight: 6,
    drawerOpen: false,
    drawerSlideType: "undermount",
    drawerSoftClose: true,
    drawerSideWallThickness: 0.5,
    drawerOpenStates: [false, false, false, false, false],
    faceFinishType: "paint",
    faceFinishTone: "white",
    faceFinishSupplier: "",
    faceFinishCode: "",
    faceFinishCustomHex: "#d8ccb7",
    widthLocked: false,
    positionLocked: false,
    positionX: null,
    positionZ: null,
    rotationDeg: 0,
    activeWall: "back",
  },
  lowerBoxes: [
    {
      /* starter lower box */
      width: 15,
      height: 29.75,
      depth: 23,
      type: "cabinet",
      kickEnabled: true,
      toeKickHeight: 3,
      toeKickDepth: 3,
      aboveFloor: 0,
      shelfCount: 1,
      adjustableShelves: true,
      pinHoleSpacing: 1.25,
      doorsEnabled: true,
    doorStyle: "auto",
    doorGap: 0.125,
    doorOpen: false,
    doorHand: "left",
    doorKind: "flat",
    doorMount: "overlay",
    doorInsetDepth: 0,
    doorProfile: 2.25,
    shakerSlim: false,
    continuousSidePanel: false,
    ponyWallCoreType: "2x4",
    ponyWallDrywallThickness: 0.5,
    ponyWallDrywallSides: 2,
    fillerView: "front",
    fillerPlacement: "left",
    fillerThickness: 0.75,
    fillerFlushTarget: "box",
    drawerMode: "none",
    drawerCount: 3,
    topDrawerHeight: 6,
    drawerOpen: false,
    drawerSlideType: "undermount",
    drawerSoftClose: true,
    drawerSideWallThickness: 0.5,
    drawerOpenStates: [false, false, false, false, false],
    faceFinishType: "paint",
    faceFinishTone: "white",
    faceFinishSupplier: "",
    faceFinishCode: "",
    faceFinishCustomHex: "#d8ccb7",
      widthLocked: false,
      positionLocked: false,
      positionX: null,
      positionZ: null,
      rotationDeg: 0,
      activeWall: "back",
    },
  ],
  countertopDefaults: {
    material: "solid-surface",
    edgeProfile: "eased",
    thickness: 0.75,
    leftOverhang: 0.7,
    rightOverhang: 0.7,
    frontOverhang: 1.2,
    backOverhang: 0,
  },
  countertop: false,
  countertopItem: {
    type: "countertop",
    material: "solid-surface",
    edgeProfile: "eased",
    leftOverhang: 0.7,
    rightOverhang: 0.7,
    frontOverhang: 1.2,
    backOverhang: 0,
    thickness: 0.75,
    targetLowerIds: [],
  },
  uppers: false,
  upper: {
    width: 15,
    height: 18,
    depth: 14,
    shelfCount: 1,
    adjustableShelves: true,
    pinHoleSpacing: 1.25,
    doorsEnabled: true,
    doorStyle: "auto",
    doorGap: 0.125,
    doorOpen: false,
    doorHand: "left",
    doorKind: "flat",
    doorMount: "overlay",
    doorInsetDepth: 0,
    doorProfile: 2.25,
    shakerSlim: false,
    continuousSidePanel: false,
    ponyWallCoreType: "2x4",
    ponyWallDrywallThickness: 0.5,
    ponyWallDrywallSides: 2,
    fillerView: "front",
    fillerPlacement: "left",
    fillerThickness: 0.75,
    fillerFlushTarget: "box",
    drawerMode: "none",
    drawerCount: 3,
    topDrawerHeight: 6,
    drawerOpen: false,
    drawerSlideType: "undermount",
    drawerSoftClose: true,
    drawerSideWallThickness: 0.5,
    drawerOpenStates: [false, false, false, false, false],
    faceFinishType: "paint",
    faceFinishTone: "white",
    faceFinishSupplier: "",
    faceFinishCode: "",
    faceFinishCustomHex: "#d8ccb7",
    rotationDeg: 0,
    activeWall: "back",
    type: "cabinet",
  },
};

function sanitizeProjectFileName(name = "My Kit") {
  const base = String(name || "My Kit")
    .trim()
    .replace(/[^a-z0-9 _-]+/gi, "-")
    .replace(/ +/g, " ")
    .slice(0, 80);
  return base || "My Kit";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildProjectFilePayload({ state, isDarkMode = false, uiPrefs = DEFAULT_UI_PREFS }) {
  return {
    appName: APP_NAME,
    fileType: APP_FILE_TYPE,
    version: APP_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    state,
    ui: {
      isDarkMode,
      uiPrefs,
    },
  };
}

function parseProjectFilePayload(raw) {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid project file.");
  }

  if (parsed.fileType !== APP_FILE_TYPE || !parsed.state) {
    throw new Error("Only .ckit CabinetKit Studio project files are supported.");
  }

  return {
    state: parsed.state,
    isDarkMode: Boolean(parsed.ui?.isDarkMode ?? false),
    uiPrefs: { ...DEFAULT_UI_PREFS, ...(parsed.ui?.uiPrefs || {}) },
  };
}

function formatInches(value) {
  return Number(value || 0).toFixed(3).replace(/\.000$/, "");
}

function getCameraDollyFromZoom(zoom) {
  const safeZoom = clamp(Number(zoom) || 1, 0.12, 3.25);
  if (safeZoom >= 1) {
    return (safeZoom - 1) * 900;
  }
  return -(1 - safeZoom) * 1800;
}

function numberToWord(value) {
  const words = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
  return words[value] || String(value);
}

function makeItemId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getCountertopSettings(countertopItem = {}) {
  return {
    leftOverhang: clamp(Number(countertopItem.leftOverhang ?? 0.7), 0, 24),
    rightOverhang: clamp(Number(countertopItem.rightOverhang ?? 0.7), 0, 24),
    frontOverhang: clamp(Number(countertopItem.frontOverhang ?? 1.2), 0, 24),
    backOverhang: clamp(Number(countertopItem.backOverhang ?? 0), 0, 24),
    thickness: clamp(Number(countertopItem.thickness ?? 0.8), 0.5, 4),
  };
}

function getCountertopTargetLowerIds(projectState) {
  const lowerBoxes = projectState?.lowerBoxes?.length
    ? projectState.lowerBoxes
    : (projectState?.cabinet ? [projectState.cabinet] : []);
  const lowerIds = lowerBoxes.map((box) => box?.id).filter(Boolean);
  const availableIdSet = new Set(lowerIds);
  const requestedIds = Array.isArray(projectState?.countertopItem?.targetLowerIds)
    ? projectState.countertopItem.targetLowerIds.filter((id) => availableIdSet.has(id))
    : [];
  return requestedIds.length ? requestedIds : lowerIds;
}

function getCountertopTargetLowerBoxes(projectState) {
  const lowerBoxes = projectState?.lowerBoxes?.length
    ? projectState.lowerBoxes
    : (projectState?.cabinet ? [projectState.cabinet] : []);
  const targetIdSet = new Set(getCountertopTargetLowerIds(projectState));
  const targetBoxes = lowerBoxes.filter((box) => targetIdSet.has(box?.id));
  return targetBoxes.length ? targetBoxes : lowerBoxes;
}

function getCountertopRunMetrics(projectState, pxPerInch = 10) {
  const lowerBoxes = projectState?.lowerBoxes?.length
    ? projectState.lowerBoxes
    : (projectState?.cabinet ? [projectState.cabinet] : []);

  if (!lowerBoxes.length) {
    return {
      boxes: [],
      bounds: { left: 0, right: 0, zMin: 0, zMax: 0 },
      widthPx: 0,
      depthPx: 0,
      maxHeightPx: 0,
    };
  }

  const targetIdSet = new Set(getCountertopTargetLowerIds(projectState));
  const renderBoxes = getLowerRenderLayout(lowerBoxes, pxPerInch, (Number(projectState?.roomDepth) || 0) * pxPerInch);
  const targetRenderBoxes = renderBoxes.filter((box) => targetIdSet.has(box?.id));
  const countertopBoxes = targetRenderBoxes.length ? targetRenderBoxes : renderBoxes;

  if (!countertopBoxes.length) {
    return {
      boxes: [],
      bounds: { left: 0, right: 0, zMin: 0, zMax: 0 },
      widthPx: 0,
      depthPx: 0,
      maxHeightPx: 0,
    };
  }

  const bounds = countertopBoxes.reduce((acc, box) => {
    const boxBounds = getBoxBounds(box.renderX, box.renderZ, box.widthPx, box.depthPx, box.renderRotationDeg);
    return {
      left: Math.min(acc.left, boxBounds.left),
      right: Math.max(acc.right, boxBounds.right),
      zMin: Math.min(acc.zMin, boxBounds.zMin),
      zMax: Math.max(acc.zMax, boxBounds.zMax),
    };
  }, { left: Infinity, right: -Infinity, zMin: Infinity, zMax: -Infinity });

  return {
    boxes: countertopBoxes,
    bounds,
    widthPx: Math.max(0, bounds.right - bounds.left),
    depthPx: Math.max(0, bounds.zMax - bounds.zMin),
    maxHeightPx: countertopBoxes.reduce((max, box) => Math.max(max, Number(box.heightPx || 0)), 0),
  };
}

function normalizeCountertopPieceSize(widthIn = 0, depthIn = 0) {
  const safeWidth = Math.max(0, Number(widthIn) || 0);
  const safeDepth = Math.max(0, Number(depthIn) || 0);
  return {
    longSideIn: Math.max(safeWidth, safeDepth),
    shortSideIn: Math.min(safeWidth, safeDepth),
  };
}

function isCountertopSinglePieceSizeValid(widthIn = 0, depthIn = 0) {
  const normalized = normalizeCountertopPieceSize(widthIn, depthIn);
  return normalized.longSideIn <= COUNTERTOP_SINGLE_PIECE_MAX_LONG_IN && normalized.shortSideIn <= COUNTERTOP_SINGLE_PIECE_MAX_SHORT_IN;
}

function getCountertopPieceSizeIn(projectState, settingsOverride = null) {
  const countertopMetrics = getCountertopRunMetrics(projectState, 10);
  const countertopSettings = settingsOverride
    ? getCountertopSettings(settingsOverride)
    : getCountertopSettings(projectState?.countertopItem || {});

  return {
    widthIn: countertopMetrics.widthPx / 10 + countertopSettings.leftOverhang + countertopSettings.rightOverhang,
    depthIn: countertopMetrics.depthPx / 10 + countertopSettings.frontOverhang + countertopSettings.backOverhang,
  };
}

function getCountertopAxisMaxSizeIn(otherAxisIn = 0) {
  const safeOtherAxis = Math.max(0, Number(otherAxisIn) || 0);
  if (safeOtherAxis <= COUNTERTOP_SINGLE_PIECE_MAX_SHORT_IN) return COUNTERTOP_SINGLE_PIECE_MAX_LONG_IN;
  if (safeOtherAxis <= COUNTERTOP_SINGLE_PIECE_MAX_LONG_IN) return COUNTERTOP_SINGLE_PIECE_MAX_SHORT_IN;
  return 0;
}

function enforceCountertopSinglePieceLimit(projectState, nextSettings = {}, drivingField = null) {
  const safeSettings = getCountertopSettings(nextSettings);
  const countertopMetrics = getCountertopRunMetrics(projectState, 10);
  const baseWidthIn = countertopMetrics.widthPx / 10;
  const baseDepthIn = countertopMetrics.depthPx / 10;

  let limited = {
    ...safeSettings,
  };

  for (let pass = 0; pass < 2; pass += 1) {
    const totalWidthIn = baseWidthIn + limited.leftOverhang + limited.rightOverhang;
    const totalDepthIn = baseDepthIn + limited.frontOverhang + limited.backOverhang;

    const maxWidthIn = getCountertopAxisMaxSizeIn(totalDepthIn);
    if (totalWidthIn > maxWidthIn) {
      const excess = totalWidthIn - maxWidthIn;
      if (drivingField === "leftOverhang") {
        limited.leftOverhang = Math.max(0, limited.leftOverhang - excess);
      } else if (drivingField === "rightOverhang") {
        limited.rightOverhang = Math.max(0, limited.rightOverhang - excess);
      } else {
        const split = excess / 2;
        limited.leftOverhang = Math.max(0, limited.leftOverhang - split);
        limited.rightOverhang = Math.max(0, limited.rightOverhang - (excess - split));
      }
    }

    const recomputedWidthIn = baseWidthIn + limited.leftOverhang + limited.rightOverhang;
    const maxDepthIn = getCountertopAxisMaxSizeIn(recomputedWidthIn);
    const recomputedDepthIn = baseDepthIn + limited.frontOverhang + limited.backOverhang;
    if (recomputedDepthIn > maxDepthIn) {
      const excess = recomputedDepthIn - maxDepthIn;
      if (drivingField === "frontOverhang") {
        limited.frontOverhang = Math.max(0, limited.frontOverhang - excess);
      } else if (drivingField === "backOverhang") {
        limited.backOverhang = Math.max(0, limited.backOverhang - excess);
      } else {
        const split = excess / 2;
        limited.frontOverhang = Math.max(0, limited.frontOverhang - split);
        limited.backOverhang = Math.max(0, limited.backOverhang - (excess - split));
      }
    }
  }

  return {
    ...limited,
    leftOverhang: roundToNearestSixteenth(limited.leftOverhang),
    rightOverhang: roundToNearestSixteenth(limited.rightOverhang),
    frontOverhang: roundToNearestSixteenth(limited.frontOverhang),
    backOverhang: roundToNearestSixteenth(limited.backOverhang),
  };
}

function getItemTypeKey(item = {}, source = "lower") {
  if (source === "upper") return "upper-cabinet";
  if (source === "countertop") return "countertop";
  const type = item?.type ?? "cabinet";
  if (type === "pony-wall") return "pony-wall";
  if (type === "filler-panel") return "filler-panel";
  if (type === "equipment-gap") return "equipment-gap";
  return "lower-cabinet";
}

function getItemTypeLabel(typeKey = "item") {
  if (typeKey === "lower-cabinet") return "Lower Cabinet";
  if (typeKey === "upper-cabinet") return "Upper Cabinet";
  if (typeKey === "pony-wall") return "Pony Wall";
  if (typeKey === "filler-panel") return "Filler Panel";
  if (typeKey === "equipment-gap") return "Equipment Gap";
  if (typeKey === "countertop") return "Countertop";
  return "Item";
}

function getItemTypeCode(typeKey = "item") {
  if (typeKey === "lower-cabinet") return "LC";
  if (typeKey === "upper-cabinet") return "UC";
  if (typeKey === "pony-wall") return "PW";
  if (typeKey === "filler-panel") return "FP";
  if (typeKey === "equipment-gap") return "EG";
  if (typeKey === "countertop") return "CT";
  return "IT";
}

function ensureStateItemIds(projectState) {
  if (!projectState || typeof projectState !== "object") return projectState;

  let didChange = false;
  const nextLowerBoxes = (projectState.lowerBoxes?.length ? projectState.lowerBoxes : []).map((box) => {
    if (box?.id) return box;
    didChange = true;
    return { ...box, id: makeItemId() };
  });

  const firstLowerId = nextLowerBoxes[0]?.id;
  const nextCabinet = projectState.cabinet?.id
    ? projectState.cabinet
    : { ...(projectState.cabinet || {}), id: firstLowerId || makeItemId() };
  if (!projectState.cabinet?.id) didChange = true;

  const nextUpper = projectState.upper?.id
    ? projectState.upper
    : { ...(projectState.upper || {}), id: makeItemId() };
  if (!projectState.upper?.id) didChange = true;

  const nextCountertopItem = {
    type: "countertop",
    material: "solid-surface",
    edgeProfile: "eased",
    leftOverhang: 0.7,
    rightOverhang: 0.7,
    frontOverhang: 1.2,
    backOverhang: 0,
    thickness: 0.75,
    targetLowerIds: [],
    ...(projectState.countertopItem || {}),
    id: projectState.countertopItem?.id || makeItemId(),
  };
  if (!projectState.countertopItem?.id) didChange = true;

  if (!didChange) return projectState;

  return {
    ...projectState,
    lowerBoxes: nextLowerBoxes,
    cabinet: nextCabinet,
    upper: nextUpper,
    countertopItem: nextCountertopItem,
  };
}

function buildItemSchedule(projectState) {
  const rows = [];
  const typeCounts = new Map();

  const nextTypeNumber = (typeKey) => {
    const nextValue = (typeCounts.get(typeKey) || 0) + 1;
    typeCounts.set(typeKey, nextValue);
    return nextValue;
  };

  const pushRow = ({ source, sourceIndex, item, width, height, depth }) => {
    const typeKey = getItemTypeKey(item, source);
    const typeNumber = nextTypeNumber(typeKey);
    rows.push({
      id: item?.id || makeItemId(),
      source,
      sourceIndex,
      typeKey,
      typeNumber,
      typeLabel: getItemTypeLabel(typeKey),
      scheduleCode: `${getItemTypeCode(typeKey)}-${typeNumber}`,
      displayLabel: `${getItemTypeLabel(typeKey)} ${numberToWord(typeNumber)}`,
      width: Number(width) || 0,
      height: Number(height) || 0,
      depth: Number(depth) || 0,
    });
  };

  const lowerBoxes = projectState?.lowerBoxes?.length
    ? projectState.lowerBoxes
    : (projectState?.cabinet ? [projectState.cabinet] : []);

  lowerBoxes.forEach((box, index) => {
    pushRow({
      source: "lower",
      sourceIndex: index,
      item: box,
      width: box?.width,
      height: box?.height,
      depth: box?.depth,
    });
  });

  if (projectState?.uppers) {
    pushRow({
      source: "upper",
      sourceIndex: 0,
      item: projectState.upper,
      width: projectState.upper?.width,
      height: projectState.upper?.height,
      depth: projectState.upper?.depth,
    });
  }

  if (projectState?.countertop) {
    const countertopSettings = getCountertopSettings(projectState.countertopItem || {});
    const countertopMetrics = getCountertopRunMetrics(projectState, 10);
    pushRow({
      source: "countertop",
      sourceIndex: 0,
      item: projectState.countertopItem || { type: "countertop" },
      width: countertopMetrics.widthPx / 10 + countertopSettings.leftOverhang + countertopSettings.rightOverhang,
      height: countertopSettings.thickness,
      depth: countertopMetrics.depthPx / 10 + countertopSettings.frontOverhang + countertopSettings.backOverhang,
    });
  }

  return rows.map((row, orderIndex) => ({
    ...row,
    orderIndex: orderIndex + 1,
  }));
}

function cloneCabinetClipboardPayload(payload) {
  return JSON.parse(JSON.stringify(payload));
}

function resetInteractiveBoxState(box) {
  return {
    ...box,
    doorOpen: false,
    doorOpenAmount: 0,
    drawerOpen: false,
    drawerOpenAmount: 0,
    drawerOpenStates: [false, false, false, false, false],
    drawerOpenAmounts: [0, 0, 0, 0, 0],
  };
}

function getLowerMultiEditMirrorPatch(sourceBox = {}) {
  return {
    width: sourceBox.width,
    height: sourceBox.height,
    depth: sourceBox.depth,
    type: sourceBox.type,
    kickEnabled: sourceBox.kickEnabled,
    toeKickHeight: sourceBox.toeKickHeight,
    toeKickDepth: sourceBox.toeKickDepth,
    aboveFloor: sourceBox.aboveFloor,
    shelfCount: sourceBox.shelfCount,
    adjustableShelves: sourceBox.adjustableShelves,
    pinHoleSpacing: sourceBox.pinHoleSpacing,
    doorsEnabled: sourceBox.doorsEnabled,
    doorStyle: sourceBox.doorStyle,
    doorGap: sourceBox.doorGap,
    doorOpen: sourceBox.doorOpen,
    doorOpenAmount: sourceBox.doorOpenAmount,
    doorHand: sourceBox.doorHand,
    doorKind: sourceBox.doorKind,
    doorMount: sourceBox.doorMount,
    doorInsetDepth: sourceBox.doorInsetDepth,
    doorProfile: sourceBox.doorProfile,
    shakerSlim: sourceBox.shakerSlim,
    continuousSidePanel: sourceBox.continuousSidePanel,
    fillerView: sourceBox.fillerView,
    fillerPlacement: sourceBox.fillerPlacement,
    fillerThickness: sourceBox.fillerThickness,
    fillerFlushTarget: sourceBox.fillerFlushTarget,
    drawerMode: sourceBox.drawerMode,
    drawerCount: sourceBox.drawerCount,
    topDrawerHeight: sourceBox.topDrawerHeight,
    drawerOpen: sourceBox.drawerOpen,
    drawerOpenAmount: sourceBox.drawerOpenAmount,
    drawerSlideType: sourceBox.drawerSlideType,
    drawerSoftClose: sourceBox.drawerSoftClose,
    drawerSideWallThickness: sourceBox.drawerSideWallThickness,
    drawerOpenStates: sourceBox.drawerOpenStates,
    drawerOpenAmounts: sourceBox.drawerOpenAmounts,
    faceFinishType: sourceBox.faceFinishType,
    faceFinishTone: sourceBox.faceFinishTone,
    faceFinishSupplier: sourceBox.faceFinishSupplier,
    faceFinishCode: sourceBox.faceFinishCode,
    faceFinishCustomHex: sourceBox.faceFinishCustomHex,
    widthLocked: sourceBox.widthLocked,
    positionLocked: sourceBox.positionLocked,
  };
}

function getStoredDoorOpenAmount(box) {
  return clamp(Number(box?.doorOpenAmount ?? box?.effectiveDoorOpenAmount ?? (box?.doorOpen ? 1 : 0)), 0, 1);
}

function getStoredDrawerOpenAmount(box) {
  return clamp(Number(box?.drawerOpenAmount ?? box?.effectiveDrawerOpenAmount ?? (box?.drawerOpen ? 1 : 0)), 0, 1);
}

function getStoredDrawerOpenAmounts(box) {
  const source = Array.isArray(box?.drawerOpenAmounts)
    ? box.drawerOpenAmounts
    : Array.isArray(box?.effectiveDrawerOpenAmounts)
      ? box.effectiveDrawerOpenAmounts
      : Array.isArray(box?.drawerOpenStates)
        ? box.drawerOpenStates.map((value) => (value ? 1 : 0))
        : [0, 0, 0, 0, 0];
  return Array.from({ length: 5 }, (_, index) => clamp(Number(source[index] ?? 0), 0, 1));
}

function isEditableElement(target) {
  if (!target || typeof target.closest !== "function") return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function getRunLayout(boxes, pxPerInch) {
  const widthsPx = boxes.map((box) => (Number(box.width) || 0) * pxPerInch);
  const totalWidthPx = widthsPx.reduce((sum, width) => sum + width, 0);
  let cursor = -totalWidthPx / 2;

  return boxes.map((box, index) => {
    const widthPx = widthsPx[index];
    const centerX = cursor + widthPx / 2;
    cursor += widthPx;
    return {
      ...box,
      widthPx,
      heightPx: (Number(box.height) || 0) * pxPerInch,
      depthPx: (Number(box.depth) || 0) * pxPerInch,
      centerX,
    };
  });
}

function getLowerRenderLayout(boxes, pxPerInch, roomDepthPx) {
  return getRunLayout(boxes, pxPerInch).map((box) => {
    const hasManualX = box.positionX != null && box.positionX !== "";
    const hasManualZ = box.positionZ != null && box.positionZ !== "";
    const autoZ = -roomDepthPx / 2 + box.depthPx / 2 + 40;
    return {
      ...box,
      renderX: hasManualX ? Number(box.positionX) * pxPerInch : box.centerX,
      renderZ: hasManualZ ? Number(box.positionZ) * pxPerInch : autoZ,
      renderRotationDeg: Number(box.rotationDeg) || 0,
    };
  });
}

function getLowerSelectionGroupSnapshot(boxes, selectedIndices, roomDepthPx, pxPerInch = 10) {
  const safeBoxes = Array.isArray(boxes) && boxes.length ? boxes : [];
  const safeIndices = [...new Set((selectedIndices || []).filter((idx) => idx >= 0 && idx < safeBoxes.length))].sort((a, b) => a - b);
  if (!safeIndices.length) return null;

  const renderBoxes = getLowerRenderLayout(safeBoxes, pxPerInch, roomDepthPx);
  const members = safeIndices
    .map((idx) => {
      const box = renderBoxes[idx];
      if (!box) return null;
      const bounds = getBoxBounds(box.renderX, box.renderZ, box.widthPx, box.depthPx, box.renderRotationDeg);
      return {
        index: idx,
        box,
        renderX: Number(box.renderX || 0),
        renderZ: Number(box.renderZ || 0),
        widthPx: Number(box.widthPx || 0),
        depthPx: Number(box.depthPx || 0),
        heightPx: Number(box.heightPx || 0),
        rotationDeg: Number(box.renderRotationDeg || 0),
        ...bounds,
      };
    })
    .filter(Boolean);

  if (!members.length) return null;

  const bounds = members.reduce((acc, member) => ({
    left: Math.min(acc.left, member.left),
    right: Math.max(acc.right, member.right),
    zMin: Math.min(acc.zMin, member.zMin),
    zMax: Math.max(acc.zMax, member.zMax),
  }), { left: Infinity, right: -Infinity, zMin: Infinity, zMax: -Infinity });

  const anchor = members[0];
  return {
    members: members.map((member) => ({
      ...member,
      relativeX: member.renderX - anchor.renderX,
      relativeZ: member.renderZ - anchor.renderZ,
    })),
    anchorIndex: anchor.index,
    anchorX: anchor.renderX,
    anchorZ: anchor.renderZ,
    bounds,
    widthPx: bounds.right - bounds.left,
    depthPx: bounds.zMax - bounds.zMin,
    centerX: (bounds.left + bounds.right) / 2,
    centerZ: (bounds.zMin + bounds.zMax) / 2,
  };
}

function getFloorPlaneDragDelta(screenDx, screenDy, orbitDeg, tiltDeg) {
  const orbit = (Number(orbitDeg) || 0) * Math.PI / 180;
  const tilt = (Number(tiltDeg) || 0) * Math.PI / 180;

  const applyRotation = (vector) => {
    const cosY = Math.cos(orbit);
    const sinY = Math.sin(orbit);
    const x1 = vector.x * cosY + vector.z * sinY;
    const z1 = -vector.x * sinY + vector.z * cosY;
    const y1 = vector.y;

    const cosX = Math.cos(tilt);
    const sinX = Math.sin(tilt);
    return {
      x: x1,
      y: y1 * cosX - z1 * sinX,
      z: y1 * sinX + z1 * cosX,
    };
  };

  const xBasis = applyRotation({ x: 1, y: 0, z: 0 });
  const zBasis = applyRotation({ x: 0, y: 0, z: 1 });
  const determinant = xBasis.x * zBasis.y - xBasis.y * zBasis.x;

  if (Math.abs(determinant) < 0.0001) {
    return { worldDx: screenDx, worldDz: screenDy };
  }

  return {
    worldDx: (screenDx * zBasis.y - screenDy * zBasis.x) / determinant,
    worldDz: (xBasis.x * screenDy - xBasis.y * screenDx) / determinant,
  };
}

function normalizeRotationDeg(angle = 0) {
  let normalized = Number(angle) || 0;
  normalized %= 360;
  if (normalized > 180) normalized -= 360;
  if (normalized <= -180) normalized += 360;
  return normalized;
}

function inferActiveWallFromRotationDeg(rotationDeg = 0) {
  const normalized = normalizeRotationDeg(rotationDeg);
  if (normalized >= -45 && normalized < 45) return "back";
  if (normalized >= 45 && normalized < 135) return "left";
  if (normalized >= -135 && normalized < -45) return "right";
  return "front";
}

function getWallSnapPositionForBox({ box, roomWidthPx, roomDepthPx, fallbackX = 0, fallbackZ = 0 }) {
  const activeWall = box?.activeWall || inferActiveWallFromRotationDeg(box?.rotationDeg ?? box?.renderRotationDeg ?? 0);
  const widthPx = Number(box?.widthPx ?? 0);
  const depthPx = Number(box?.depthPx ?? 0);
  const xPx = Number(box?.xPx ?? fallbackX);
  const zPx = Number(box?.zPx ?? fallbackZ);
  const bounds = getBoxBounds(xPx, zPx, widthPx, depthPx, Number(box?.rotationDeg ?? box?.renderRotationDeg) || 0);

  if (activeWall === "front") {
    return { xPx, zPx: roomDepthPx / 2 - (bounds.zMax - zPx), wall: "front" };
  }
  if (activeWall === "left") {
    return { xPx: -roomWidthPx / 2 + (xPx - bounds.left), zPx, wall: "left" };
  }
  if (activeWall === "right") {
    return { xPx: roomWidthPx / 2 - (bounds.right - xPx), zPx, wall: "right" };
  }
  return { xPx, zPx: -roomDepthPx / 2 + (zPx - bounds.zMin), wall: "back" };
}

function getBoxBounds(xPx, zPx, widthPx, depthPx, rotationDeg = 0) {
  const radians = (Number(rotationDeg) || 0) * Math.PI / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const halfWidth = (widthPx * cos + depthPx * sin) / 2;
  const halfDepth = (widthPx * sin + depthPx * cos) / 2;
  return {
    left: xPx - halfWidth,
    right: xPx + halfWidth,
    zMin: zPx - halfDepth,
    zMax: zPx + halfDepth,
  };
}

function getRangeGap(minA, maxA, minB, maxB) {
  if (maxA < minB) return minB - maxA;
  if (maxB < minA) return minA - maxB;
  return 0;
}

function getLowerBoxFrontPlaneOffsetPx(box) {
  const depthPx = Number(box.depthPx ?? ((Number(box.depth) || 0) * 10));

  if ((box.type ?? "cabinet") === "filler-panel") {
    const usesDoorPlane = (box.fillerFlushTarget ?? "box") === "door";
    const doorMount = box.doorMount ?? "overlay";
    const doorInsetPx = clamp((Number(box.doorInsetDepth ?? 0) || 0) * 10, 0, 7.5);
    const doorFrontPlanePx = doorMount === "inset"
      ? depthPx / 2 - doorInsetPx
      : depthPx / 2 + 7.5 + (doorMount === "full-overlay" ? 1.5 : 0.75);
    return usesDoorPlane ? doorFrontPlanePx : depthPx / 2;
  }

  if ((box.type ?? "cabinet") === "cabinet") {
    const doorsEnabled = box.doorsEnabled ?? true;
    if (!doorsEnabled) return depthPx / 2;
    const doorMount = box.doorMount ?? "overlay";
    const doorInsetPx = clamp((Number(box.doorInsetDepth ?? 0) || 0) * 10, 0, 7.5);
    return doorMount === "inset"
      ? depthPx / 2 - doorInsetPx
      : depthPx / 2 + 7.5 + (doorMount === "full-overlay" ? 1.5 : 0.75);
  }

  return depthPx / 2;
}

function getOrientedBoxCorners(box = {}) {
  const xPx = Number(box.xPx ?? box.renderX ?? 0);
  const zPx = Number(box.zPx ?? box.renderZ ?? 0);
  const widthPx = Number(box.widthPx ?? 0);
  const depthPx = Number(box.depthPx ?? 0);
  const rotationDeg = Number(box.rotationDeg ?? box.renderRotationDeg) || 0;
  const halfW = widthPx / 2;
  const halfD = depthPx / 2;

  const localCorners = [
    { x: -halfW, z: -halfD },
    { x: halfW, z: -halfD },
    { x: halfW, z: halfD },
    { x: -halfW, z: halfD },
  ];

  return localCorners.map((corner) => {
    const rotated = rotatePoint2D(corner.x, corner.z, rotationDeg);
    return {
      x: xPx + rotated.x,
      z: zPx + rotated.z,
    };
  });
}

function getPolygonAxes(points = []) {
  const axes = [];
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const edgeX = next.x - current.x;
    const edgeZ = next.z - current.z;
    const axisX = -edgeZ;
    const axisZ = edgeX;
    const length = Math.hypot(axisX, axisZ);
    if (length > 0.0001) {
      axes.push({ x: axisX / length, z: axisZ / length });
    }
  }
  return axes;
}

function projectPolygonOntoAxis(points = [], axis = { x: 1, z: 0 }) {
  let min = Infinity;
  let max = -Infinity;
  points.forEach((point) => {
    const projection = point.x * axis.x + point.z * axis.z;
    min = Math.min(min, projection);
    max = Math.max(max, projection);
  });
  return { min, max };
}

function orientedBoxesOverlap(a, b, clearancePx = 2) {
  const aCorners = getOrientedBoxCorners(a);
  const bCorners = getOrientedBoxCorners(b);
  const axes = [...getPolygonAxes(aCorners), ...getPolygonAxes(bCorners)];

  for (const axis of axes) {
    const aProjection = projectPolygonOntoAxis(aCorners, axis);
    const bProjection = projectPolygonOntoAxis(bCorners, axis);
    if (aProjection.max <= bProjection.min + clearancePx || bProjection.max <= aProjection.min + clearancePx) {
      return false;
    }
  }

  return true;
}

function boxesOverlap(a, b, clearancePx = 2) {
  return orientedBoxesOverlap(a, b, clearancePx);
}

function getWallAlignedFrontPlanePx(box = {}) {
  const activeWall = box?.activeWall || inferActiveWallFromRotationDeg(box?.rotationDeg ?? box?.renderRotationDeg ?? 0);
  const bounds = getBoxBounds(
    Number(box?.xPx ?? box?.renderX ?? 0),
    Number(box?.zPx ?? box?.renderZ ?? 0),
    Number(box?.widthPx ?? 0),
    Number(box?.depthPx ?? 0),
    Number(box?.rotationDeg ?? box?.renderRotationDeg) || 0,
  );

  if (activeWall === "front") return bounds.zMax;
  if (activeWall === "back") return bounds.zMin;
  if (activeWall === "left") return bounds.left;
  if (activeWall === "right") return bounds.right;
  return bounds.zMin;
}

function getNeighborQuickSnap({ movingBoxes = [], otherBoxes, thresholdPx = 40, zTolerancePx = 40 }) {
  let best = null;

  movingBoxes.forEach((movingBox) => {
    const movingActiveWall = movingBox.activeWall || inferActiveWallFromRotationDeg(movingBox.rotationDeg ?? 0);
    const movingFrontPlanePx = getWallAlignedFrontPlanePx(movingBox);
    const movingIsPonyWall = (movingBox.type ?? "cabinet") === "pony-wall";

    otherBoxes.forEach((box) => {
      const targetActiveWall = box.activeWall || inferActiveWallFromRotationDeg(box.rotationDeg ?? 0);
      const targetFrontPlanePx = getWallAlignedFrontPlanePx(box);
      const frontPlaneGap = Math.abs(targetFrontPlanePx - movingFrontPlanePx);
      if (frontPlaneGap > zTolerancePx) return;

      const targetIsPonyWall = (box.type ?? "cabinet") === "pony-wall";

      const pushBest = (candidate) => {
        if (!candidate) return;
        if (!best || candidate.distance < best.distance || (candidate.distance === best.distance && candidate.frontPlaneGap < best.frontPlaneGap)) {
          best = candidate;
        }
      };

      if (movingActiveWall === targetActiveWall) {
        const candidatePairs = [
          { movingSide: "right", targetSide: "left", snapSide: "right-to-left" },
          { movingSide: "left", targetSide: "right", snapSide: "left-to-right" },
        ];

        candidatePairs.forEach((pair) => {
          const movingSideCenter = getBoxSideCenterWorld(
            movingBox.xPx,
            movingBox.zPx,
            movingBox.widthPx,
            movingBox.rotationDeg ?? 0,
            pair.movingSide,
          );
          const targetSideCenter = getBoxSideCenterWorld(
            box.xPx,
            box.zPx,
            box.widthPx,
            box.rotationDeg ?? 0,
            pair.targetSide,
          );

          const offsetX = targetSideCenter.x - movingSideCenter.x;
          const offsetZ = targetSideCenter.z - movingSideCenter.z;
          const distance = Math.hypot(offsetX, offsetZ);
          if (distance > thresholdPx) return;

          pushBest({
            offsetX,
            offsetZ,
            targetIndex: box.index,
            snapSide: pair.snapSide,
            key: `${box.index}-${pair.snapSide}`,
            distance,
            frontPlaneGap,
            mode: "side-align",
          });
        });
      }

      if (movingIsPonyWall !== targetIsPonyWall) {
        const movingFrontCenter = { x: movingBox.xPx, z: movingFrontPlanePx };
        const targetFrontCenter = { x: box.xPx, z: targetFrontPlanePx };
        const frontOffsetX = targetFrontCenter.x - movingFrontCenter.x;
        const frontOffsetZ = targetFrontCenter.z - movingFrontCenter.z;
        const frontDistance = Math.hypot(frontOffsetX, frontOffsetZ);
        if (frontDistance <= thresholdPx) {
          pushBest({
            offsetX: frontOffsetX,
            offsetZ: frontOffsetZ,
            targetIndex: box.index,
            snapSide: "front-plane-align",
            key: `${box.index}-front-plane-align`,
            distance: frontDistance,
            frontPlaneGap,
            mode: "front-plane-align",
          });
        }
      }
    });
  });

  return best;
}

function getBoxSideCenterWorld(xPx, zPx, widthPx, rotationDeg = 0, side = "right") {
  const sideOffsetX = side === "right" ? widthPx / 2 : -widthPx / 2;
  const rotated = rotatePoint2D(sideOffsetX, 0, rotationDeg);
  return {
    x: xPx + rotated.x,
    z: zPx + rotated.z,
  };
}

function getExactNeighborSnapPosition({
  movingXPx,
  movingZPx,
  movingWidthPx,
  movingRotationDeg = 0,
  targetXPx,
  targetZPx,
  targetWidthPx,
  targetRotationDeg = 0,
  snapSide = "right-to-left",
}) {
  if (snapSide === "front-plane-align") {
    return {
      xPx: targetXPx,
      zPx: targetZPx,
    };
  }

  const movingSide = snapSide === "right-to-left" ? "right" : "left";
  const targetSide = snapSide === "right-to-left" ? "left" : "right";
  const movingSideCenter = getBoxSideCenterWorld(movingXPx, movingZPx, movingWidthPx, movingRotationDeg, movingSide);
  const targetSideCenter = getBoxSideCenterWorld(targetXPx, targetZPx, targetWidthPx, targetRotationDeg, targetSide);
  return {
    xPx: movingXPx + (targetSideCenter.x - movingSideCenter.x),
    zPx: movingZPx + (targetSideCenter.z - movingSideCenter.z),
  };
}

function areAnyBoxesOverlapping(boxes, clearancePx = 2) {
  for (let index = 0; index < boxes.length; index += 1) {
    for (let compareIndex = index + 1; compareIndex < boxes.length; compareIndex += 1) {
      if (boxesOverlap(boxes[index], boxes[compareIndex], clearancePx)) {
        return true;
      }
    }
  }
  return false;
}

function findAvailableLowerPastePlacement({ clipboardBoxes, existingBoxes, roomWidthIn, roomDepthIn, pxPerInch = 10 }) {
  if (!Array.isArray(clipboardBoxes) || !clipboardBoxes.length) return null;

  const roomWidthPx = (Number(roomWidthIn) || 0) * pxPerInch;
  const roomDepthPx = (Number(roomDepthIn) || 0) * pxPerInch;
  const roomLeft = -roomWidthPx / 2;
  const roomRight = roomWidthPx / 2;
  const roomBack = -roomDepthPx / 2;
  const roomFront = roomDepthPx / 2;

  const sourceBoxes = clipboardBoxes.map((box, index) => {
    const widthPx = Math.max(1, (Number(box.width) || 0) * pxPerInch);
    const depthPx = Math.max(1, (Number(box.depth) || 0) * pxPerInch);
    const heightPx = Math.max(1, (Number(box.height) || 0) * pxPerInch);
    const rotationDeg = Number(box.rotationDeg) || 0;
    const xPx = Number.isFinite(Number(box.clipboardRenderX)) ? Number(box.clipboardRenderX) : 0;
    const zPx = Number.isFinite(Number(box.clipboardRenderZ)) ? Number(box.clipboardRenderZ) : (-roomDepthPx / 2 + depthPx / 2 + 40);
    return {
      index,
      widthPx,
      depthPx,
      heightPx,
      rotationDeg,
      xPx,
      zPx,
      relativeX: Number.isFinite(Number(box.clipboardRelativeX)) ? Number(box.clipboardRelativeX) : null,
      relativeZ: Number.isFinite(Number(box.clipboardRelativeZ)) ? Number(box.clipboardRelativeZ) : null,
      groupAnchorX: Number.isFinite(Number(box.clipboardGroupAnchorX)) ? Number(box.clipboardGroupAnchorX) : null,
      groupAnchorZ: Number.isFinite(Number(box.clipboardGroupAnchorZ)) ? Number(box.clipboardGroupAnchorZ) : null,
    };
  });

  const anchorBox = sourceBoxes[0];
  const fallbackAnchorX = anchorBox.groupAnchorX ?? anchorBox.xPx;
  const fallbackAnchorZ = anchorBox.groupAnchorZ ?? anchorBox.zPx;
  const relativeBoxes = sourceBoxes.map((box) => ({
    ...box,
    relativeX: box.relativeX != null ? box.relativeX : (box.xPx - fallbackAnchorX),
    relativeZ: box.relativeZ != null ? box.relativeZ : (box.zPx - fallbackAnchorZ),
  }));

  const existingPlacedBoxes = (existingBoxes || []).map((box) => ({
    xPx: box.renderX,
    zPx: box.renderZ,
    widthPx: box.widthPx,
    depthPx: box.depthPx,
    rotationDeg: Number(box.renderRotationDeg ?? box.rotationDeg) || 0,
    ...getBoxBounds(box.renderX, box.renderZ, box.widthPx, box.depthPx, Number(box.renderRotationDeg ?? box.rotationDeg) || 0),
  }));

  const buildCandidateBoxes = (anchorX, anchorZ) => relativeBoxes.map((box) => {
    const xPx = anchorX + Number(box.relativeX || 0);
    const zPx = anchorZ + Number(box.relativeZ || 0);
    return {
      index: box.index,
      xPx,
      zPx,
      widthPx: box.widthPx,
      depthPx: box.depthPx,
      heightPx: box.heightPx,
      rotationDeg: box.rotationDeg,
      ...getBoxBounds(xPx, zPx, box.widthPx, box.depthPx, box.rotationDeg),
    };
  });

  const candidateIsValid = (candidateBoxes) => {
    const fitsInsideRoom = candidateBoxes.every((box) => (
      box.left >= roomLeft &&
      box.right <= roomRight &&
      box.zMin >= roomBack &&
      box.zMax <= roomFront
    ));
    if (!fitsInsideRoom) return false;
    if (areAnyBoxesOverlapping(candidateBoxes, 2)) return false;
    return !candidateBoxes.some((candidate) => (
      existingPlacedBoxes.some((existing) => boxesOverlap(candidate, existing, 2))
    ));
  };

  const stepPx = 10;
  const preferredAnchorX = Math.round((fallbackAnchorX + 60) / stepPx) * stepPx;
  const preferredAnchorZ = Math.round((fallbackAnchorZ + 60) / stepPx) * stepPx;
  const preferredCandidate = buildCandidateBoxes(preferredAnchorX, preferredAnchorZ);
  if (candidateIsValid(preferredCandidate)) {
    return preferredCandidate;
  }

  const seenCandidates = new Set([`${preferredAnchorX}:${preferredAnchorZ}`]);
  const maxRadiusSteps = Math.ceil(Math.max(roomWidthPx, roomDepthPx) / stepPx) + 8;

  for (let radius = 1; radius <= maxRadiusSteps; radius += 1) {
    for (let xStep = -radius; xStep <= radius; xStep += 1) {
      for (let zStep = -radius; zStep <= radius; zStep += 1) {
        if (Math.abs(xStep) !== radius && Math.abs(zStep) !== radius) continue;
        const anchorX = preferredAnchorX + xStep * stepPx;
        const anchorZ = preferredAnchorZ + zStep * stepPx;
        const key = `${anchorX}:${anchorZ}`;
        if (seenCandidates.has(key)) continue;
        seenCandidates.add(key);

        const candidate = buildCandidateBoxes(anchorX, anchorZ);
        if (candidateIsValid(candidate)) {
          return candidate;
        }
      }
    }
  }

  return preferredCandidate;
}

function getResolvedDoorStyle(widthPx, doorStyle = "auto") {
  if (doorStyle === "auto") {
    return widthPx >= 24 * 10 ? "double" : "single";
  }
  if (doorStyle === "single-left" || doorStyle === "single-right") {
    return "single";
  }
  return doorStyle;
}

function getDrawerSlideLengthInches(cabinetDepthIn, slideType = "undermount") {
  const reserve = slideType === "undermount" ? 1.5 : 1.0;
  const usableDepth = Math.max(10, (Number(cabinetDepthIn) || 0) - reserve);
  const snapped = Math.floor(usableDepth / 2) * 2;
  return clamp(snapped, 10, 28);
}

function getDrawerBoxDepthInches(cabinetDepthIn, slideType = "undermount") {
  const slideLength = getDrawerSlideLengthInches(cabinetDepthIn, slideType);
  return slideLength;
}

function getFinishLibrary() {
  return {
    paint: {
      white: { label: "White Paint", code: "Standard", color: "#f5f5f4", edge: "#bdb7af", group: "basic" },
      accessibleBeige: { label: "Accessible Beige", code: "SW 7036", color: "#cdbca7", edge: "#a48e76", group: "beige" },
      balancedBeige: { label: "Balanced Beige", code: "SW 7037", color: "#c3ad92", edge: "#9b8065", group: "beige" },
      kilimBeige: { label: "Kilim Beige", code: "SW 6106", color: "#ccb49a", edge: "#a48669", group: "beige" },
      manchesterTan: { label: "Manchester Tan", code: "HC-81", color: "#ccb693", edge: "#a18967", group: "beige" },
      muslin: { label: "Muslin", code: "OC-12", color: "#d9ccb8", edge: "#b8a58b", group: "beige" },
      haleNavy: { label: "Hale Navy", code: "HC-154", color: "#38455b", edge: "#1f2937", group: "accent" },
      ironOre: { label: "Iron Ore", code: "SW 7069", color: "#43454a", edge: "#27272a", group: "accent" },
      urbaneBronze: { label: "Urbane Bronze", code: "SW 7048", color: "#5f574d", edge: "#3f3a33", group: "accent" },
      seaSalt: { label: "Sea Salt", code: "SW 6204", color: "#c6d0c8", edge: "#8f9b93", group: "accent" },
      custom: { label: "Custom Paint", code: "Custom", color: "#d8ccb7", edge: "#b29c82", group: "custom" },
    },
    laminate: {
      white: { label: "White Laminate", code: "Laminate", color: "#f8fafc", edge: "#cbd5e1", group: "standard" },
      graphite: { label: "Graphite Laminate", code: "Laminate", color: "#52525b", edge: "#3f3f46", group: "standard" },
      sand: { label: "Sand Laminate", code: "Laminate", color: "#d6d3d1", edge: "#a8a29e", group: "standard" },
      almond: { label: "Almond Laminate", code: "Laminate", color: "#ddd6c7", edge: "#b4a999", group: "standard" },
    },
    veneer: {
      whiteOak: { label: "White Oak Veneer", code: "Veneer", color: "#c8b08a", edge: "#92785b", group: "standard" },
      walnut: { label: "Walnut Veneer", code: "Veneer", color: "#6f4e37", edge: "#4b2e1f", group: "standard" },
      riftOak: { label: "Rift Oak Veneer", code: "Veneer", color: "#b89a70", edge: "#866947", group: "standard" },
      smokedOak: { label: "Smoked Oak Veneer", code: "Veneer", color: "#7a6752", edge: "#5b4a38", group: "standard" },
    },
  };
}

function getFaceFinishAppearance(finishType = "paint", finishTone = "white", custom = {}) {
  const library = getFinishLibrary();
  const safeType = library[finishType] ? finishType : "paint";
  const toneMap = library[safeType];
  const safeTone = toneMap[finishTone] ? finishTone : Object.keys(toneMap)[0];

  if (safeType === "paint" && safeTone === "custom") {
    const supplier = String(custom.supplier ?? "").trim();
    const code = String(custom.code ?? "").trim();
    const customLabel = [supplier, code].filter(Boolean).join(" · ") || "Custom Paint";
    return {
      type: safeType,
      tone: safeTone,
      label: customLabel,
      code: code || "Custom",
      color: custom.customHex || toneMap.custom.color,
      edge: "#8a7866",
      group: "custom",
    };
  }

  return {
    type: safeType,
    tone: safeTone,
    ...toneMap[safeTone],
  };
}

function getFinishToneOptions(finishType = "paint") {
  const library = getFinishLibrary();
  const safeType = library[finishType] ? finishType : "paint";
  return Object.entries(library[safeType]).map(([value, option]) => ({ value, ...option }));
}

function getPonyWallDepthInches(coreType = "2x4", drywallThickness = 0.5, drywallSides = 2) {
  if (coreType === "plywood") return 2.25;
  const framingDepth = coreType === "2x6" ? 5.5 : 3.5;
  const safeDrywallThickness = clamp(Number(drywallThickness) || 0.5, 0.25, 1);
  const safeSides = Number(drywallSides) === 1 ? 1 : 2;
  return framingDepth + safeDrywallThickness * safeSides;
}

function rotatePoint2D(x, z, angleDeg = 0) {
  const radians = (Number(angleDeg) || 0) * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: x * cos + z * sin,
    z: -x * sin + z * cos,
  };
}

function rotatePoint3DForCamera(x, y, z, orbitDeg = 0, tiltDeg = 0) {
  const orbit = (Number(orbitDeg) || 0) * Math.PI / 180;
  const tilt = (Number(tiltDeg) || 0) * Math.PI / 180;
  const cosY = Math.cos(orbit);
  const sinY = Math.sin(orbit);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;
  const y1 = y;
  const cosX = Math.cos(tilt);
  const sinX = Math.sin(tilt);
  return {
    x: x1,
    y: y1 * cosX - z1 * sinX,
    z: y1 * sinX + z1 * cosX,
  };
}

function projectParallelWorldPointToViewport({ x, y, z, orbitDeg = 0, tiltDeg = 0, panX = 0, panY = 0, zoom = 1, viewportWidth = 1440, viewportHeight = 900 }) {
  const rotated = rotatePoint3DForCamera(x, y, z, orbitDeg, tiltDeg);
  const scale = clamp(Number(zoom) || 1, 0.12, 3.25);
  return {
    x: viewportWidth / 2 + Number(panX || 0) + rotated.x * scale,
    y: viewportHeight / 2 + Number(panY || 0) + rotated.y * scale,
    depth: rotated.z,
  };
}

function transformWorldPointToView({ x, y, z, orbitDeg = 0, tiltDeg = 0, panX = 0, panY = 0, cameraDollyZ = 0 }) {
  const rotated = rotatePoint3DForCamera(x, y, z, orbitDeg, tiltDeg);
  return {
    x: rotated.x + Number(panX || 0),
    y: rotated.y + Number(panY || 0),
    z: rotated.z + Number(cameraDollyZ || 0),
  };
}

function projectWorldPointToViewport({
  x,
  y,
  z,
  cameraMode = "parallel",
  orbitDeg = 0,
  tiltDeg = 0,
  panX = 0,
  panY = 0,
  zoom = 1,
  cameraDollyZ = 0,
  perspectivePx = 950,
  viewportWidth = 1440,
  viewportHeight = 900,
}) {
  if (cameraMode !== "perspective") {
    return projectParallelWorldPointToViewport({
      x,
      y,
      z,
      orbitDeg,
      tiltDeg,
      panX,
      panY,
      zoom,
      viewportWidth,
      viewportHeight,
    });
  }

  const view = transformWorldPointToView({ x, y, z, orbitDeg, tiltDeg, panX, panY, cameraDollyZ });
  const perspective = Math.max(1, Number(perspectivePx) || 950);
  const denom = perspective - view.z;
  const scale = Math.abs(denom) < 0.001 ? 1000 : perspective / denom;

  return {
    x: viewportWidth / 2 + view.x * scale,
    y: viewportHeight / 2 + view.y * scale,
    depth: view.z,
    scale,
  };
}

function roundToNearestSixteenth(value = 0) {
  return Math.round((Number(value) || 0) * 16) / 16;
}

function formatArchitecturalInches(valueIn = 0) {
  const sign = valueIn < 0 ? "-" : "";
  const absoluteValue = Math.abs(roundToNearestSixteenth(valueIn));
  const totalSixteenths = Math.round(absoluteValue * 16);
  const feet = Math.floor(totalSixteenths / 192);
  const remainingSixteenths = totalSixteenths - feet * 192;
  const inches = Math.floor(remainingSixteenths / 16);
  let fractionSixteenths = remainingSixteenths % 16;

  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  let fractionText = "";
  if (fractionSixteenths > 0) {
    const divisor = gcd(fractionSixteenths, 16);
    fractionText = `${fractionSixteenths / divisor}/${16 / divisor}`;
  }

  if (feet > 0) {
    return `${sign}${feet}'-${inches}${fractionText ? ` ${fractionText}` : ""}\"`;
  }

  if (inches === 0 && fractionText) {
    return `${sign}${fractionText}\"`;
  }

  return `${sign}${inches}${fractionText ? ` ${fractionText}` : ""}\"`;
}

function getDimensionScreenGeometry(startPoint, endPoint, offsetPx = 24) {
  const dx = (endPoint?.x ?? 0) - (startPoint?.x ?? 0);
  const dy = (endPoint?.y ?? 0) - (startPoint?.y ?? 0);
  const length = Math.max(1, Math.hypot(dx, dy));
  let normalX = -dy / length;
  let normalY = dx / length;

  if (normalY > 0) {
    normalX *= -1;
    normalY *= -1;
  }

  const offsetStart = {
    x: (startPoint?.x ?? 0) + normalX * offsetPx,
    y: (startPoint?.y ?? 0) + normalY * offsetPx,
  };
  const offsetEnd = {
    x: (endPoint?.x ?? 0) + normalX * offsetPx,
    y: (endPoint?.y ?? 0) + normalY * offsetPx,
  };
  const dimensionDx = offsetEnd.x - offsetStart.x;
  const dimensionDy = offsetEnd.y - offsetStart.y;
  const dimensionLength = Math.max(1, Math.hypot(dimensionDx, dimensionDy));
  const angleDeg = Math.atan2(dimensionDy, dimensionDx) * 180 / Math.PI;

  return {
    offsetStart,
    offsetEnd,
    normalX,
    normalY,
    angleDeg,
    dimensionLength,
    labelX: (offsetStart.x + offsetEnd.x) / 2 + normalX * 14,
    labelY: (offsetStart.y + offsetEnd.y) / 2 + normalY * 14,
  };
}

function renderDimensionTicks(start, end, tickLength = 10) {
  const dx = (end?.x ?? 0) - (start?.x ?? 0);
  const dy = (end?.y ?? 0) - (start?.y ?? 0);
  const length = Math.max(1, Math.hypot(dx, dy));
  const normalX = -dy / length;
  const normalY = dx / length;
  return {
    startA: { x: start.x + normalX * tickLength / 2, y: start.y + normalY * tickLength / 2 },
    startB: { x: start.x - normalX * tickLength / 2, y: start.y - normalY * tickLength / 2 },
    endA: { x: end.x + normalX * tickLength / 2, y: end.y + normalY * tickLength / 2 },
    endB: { x: end.x - normalX * tickLength / 2, y: end.y - normalY * tickLength / 2 },
  };
}

function solveParallelScreenPointToWorldOnPlane({
  clientX,
  clientY,
  planeOrigin = { x: 0, y: 0, z: 0 },
  axisU = { x: 10, y: 0, z: 0 },
  axisV = { x: 0, y: 10, z: 0 },
  orbitDeg = 0,
  tiltDeg = 0,
  panX = 0,
  panY = 0,
  zoom = 1,
  viewportWidth = 1440,
  viewportHeight = 900,
}) {
  const originProjected = projectWorldPointToViewport({
    x: planeOrigin.x,
    y: planeOrigin.y,
    z: planeOrigin.z,
    orbitDeg,
    tiltDeg,
    panX,
    panY,
    zoom,
    viewportWidth,
    viewportHeight,
  });
  const uProjected = projectWorldPointToViewport({
    x: planeOrigin.x + axisU.x,
    y: planeOrigin.y + axisU.y,
    z: planeOrigin.z + axisU.z,
    orbitDeg,
    tiltDeg,
    panX,
    panY,
    zoom,
    viewportWidth,
    viewportHeight,
  });
  const vProjected = projectWorldPointToViewport({
    x: planeOrigin.x + axisV.x,
    y: planeOrigin.y + axisV.y,
    z: planeOrigin.z + axisV.z,
    orbitDeg,
    tiltDeg,
    panX,
    panY,
    zoom,
    viewportWidth,
    viewportHeight,
  });

  const ux = uProjected.x - originProjected.x;
  const uy = uProjected.y - originProjected.y;
  const vx = vProjected.x - originProjected.x;
  const vy = vProjected.y - originProjected.y;
  const det = ux * vy - uy * vx;

  if (Math.abs(det) < 0.0001) {
    return { ...planeOrigin };
  }

  const dx = clientX - originProjected.x;
  const dy = clientY - originProjected.y;
  const u = (dx * vy - dy * vx) / det;
  const v = (ux * dy - uy * dx) / det;

  return {
    x: planeOrigin.x + axisU.x * u + axisV.x * v,
    y: planeOrigin.y + axisU.y * u + axisV.y * v,
    z: planeOrigin.z + axisU.z * u + axisV.z * v,
  };
}

function solveScreenPointToWorldOnPlane({
  clientX,
  clientY,
  planeOrigin = { x: 0, y: 0, z: 0 },
  axisU = { x: 10, y: 0, z: 0 },
  axisV = { x: 0, y: 10, z: 0 },
  cameraMode = "parallel",
  orbitDeg = 0,
  tiltDeg = 0,
  panX = 0,
  panY = 0,
  zoom = 1,
  cameraDollyZ = 0,
  perspectivePx = 950,
  viewportWidth = 1440,
  viewportHeight = 900,
}) {
  if (cameraMode !== "perspective") {
    return solveParallelScreenPointToWorldOnPlane({
      clientX,
      clientY,
      planeOrigin,
      axisU,
      axisV,
      orbitDeg,
      tiltDeg,
      panX,
      panY,
      zoom,
      viewportWidth,
      viewportHeight,
    });
  }

  const originView = transformWorldPointToView({
    x: planeOrigin.x,
    y: planeOrigin.y,
    z: planeOrigin.z,
    orbitDeg,
    tiltDeg,
    panX,
    panY,
    cameraDollyZ,
  });
  const uPointView = transformWorldPointToView({
    x: planeOrigin.x + axisU.x,
    y: planeOrigin.y + axisU.y,
    z: planeOrigin.z + axisU.z,
    orbitDeg,
    tiltDeg,
    panX,
    panY,
    cameraDollyZ,
  });
  const vPointView = transformWorldPointToView({
    x: planeOrigin.x + axisV.x,
    y: planeOrigin.y + axisV.y,
    z: planeOrigin.z + axisV.z,
    orbitDeg,
    tiltDeg,
    panX,
    panY,
    cameraDollyZ,
  });

  const planeU = {
    x: uPointView.x - originView.x,
    y: uPointView.y - originView.y,
    z: uPointView.z - originView.z,
  };
  const planeV = {
    x: vPointView.x - originView.x,
    y: vPointView.y - originView.y,
    z: vPointView.z - originView.z,
  };
  const normal = {
    x: planeU.y * planeV.z - planeU.z * planeV.y,
    y: planeU.z * planeV.x - planeU.x * planeV.z,
    z: planeU.x * planeV.y - planeU.y * planeV.x,
  };

  const perspective = Math.max(1, Number(perspectivePx) || 950);
  const eye = { x: 0, y: 0, z: perspective };
  const projectionPlanePoint = {
    x: clientX - viewportWidth / 2,
    y: clientY - viewportHeight / 2,
    z: 0,
  };
  const rayDir = {
    x: projectionPlanePoint.x - eye.x,
    y: projectionPlanePoint.y - eye.y,
    z: projectionPlanePoint.z - eye.z,
  };
  const denom = normal.x * rayDir.x + normal.y * rayDir.y + normal.z * rayDir.z;

  if (Math.abs(denom) < 0.000001) {
    return { ...planeOrigin };
  }

  const originToEye = {
    x: originView.x - eye.x,
    y: originView.y - eye.y,
    z: originView.z - eye.z,
  };
  const t = (normal.x * originToEye.x + normal.y * originToEye.y + normal.z * originToEye.z) / denom;
  const hitView = {
    x: eye.x + rayDir.x * t,
    y: eye.y + rayDir.y * t,
    z: eye.z + rayDir.z * t,
  };
  const delta = {
    x: hitView.x - originView.x,
    y: hitView.y - originView.y,
    z: hitView.z - originView.z,
  };

  const candidates = [
    {
      det: planeU.x * planeV.y - planeU.y * planeV.x,
      solve: () => ({
        u: (delta.x * planeV.y - delta.y * planeV.x) / (planeU.x * planeV.y - planeU.y * planeV.x),
        v: (planeU.x * delta.y - planeU.y * delta.x) / (planeU.x * planeV.y - planeU.y * planeV.x),
      }),
    },
    {
      det: planeU.x * planeV.z - planeU.z * planeV.x,
      solve: () => ({
        u: (delta.x * planeV.z - delta.z * planeV.x) / (planeU.x * planeV.z - planeU.z * planeV.x),
        v: (planeU.x * delta.z - planeU.z * delta.x) / (planeU.x * planeV.z - planeU.z * planeV.x),
      }),
    },
    {
      det: planeU.y * planeV.z - planeU.z * planeV.y,
      solve: () => ({
        u: (delta.y * planeV.z - delta.z * planeV.y) / (planeU.y * planeV.z - planeU.z * planeV.y),
        v: (planeU.y * delta.z - planeU.z * delta.y) / (planeU.y * planeV.z - planeU.z * planeV.y),
      }),
    },
  ].sort((a, b) => Math.abs(b.det) - Math.abs(a.det));

  const best = candidates[0];
  if (!best || Math.abs(best.det) < 0.000001) {
    return { ...planeOrigin };
  }

  const solved = best.solve();
  return {
    x: planeOrigin.x + axisU.x * solved.u + axisV.x * solved.v,
    y: planeOrigin.y + axisU.y * solved.u + axisV.y * solved.v,
    z: planeOrigin.z + axisU.z * solved.u + axisV.z * solved.v,
  };
}

function getLowerBoxFrontInteractionSpecs(box) {
  if (!box || (box.type ?? "cabinet") !== "cabinet") {
    return { doors: [], drawers: [] };
  }

  const widthPx = Number(box.widthPx ?? ((Number(box.width) || 0) * 10));
  const depthPx = Number(box.depthPx ?? ((Number(box.depth) || 0) * 10));
  const heightPx = Number(box.heightPx ?? ((Number(box.height) || 0) * 10));
  const rotationDeg = Number(box.renderRotationDeg ?? box.rotationDeg) || 0;
  const boxX = Number(box.renderX) || 0;
  const boxZ = Number(box.renderZ) || 0;
  const thicknessPx = 8;
  const drawerFrontThicknessPx = 7.5;
  const doorThicknessPx = 7.5;
  const doorsEnabled = box.doorsEnabled ?? true;
  const drawerMode = box.drawerMode ?? "none";
  const showDrawerBank = drawerMode === "drawer-bank";
  const showTopDrawer = drawerMode === "top-drawer";
  const doorHand = box.doorHand === "right" ? "right" : "left";
  const doorMount = box.doorMount ?? "overlay";
  const usesInsetMount = doorMount === "inset";
  const doorGapPx = clamp(Number(box.doorGap ?? 0.125) * 10, 1, 10);
  const insetMarginPx = 7.5;
  const overlayBumpPx = doorMount === "full-overlay" ? 7 : 0;
  const insetDepthPx = clamp((Number(box.doorInsetDepth ?? 0) || 0) * 10, 0, doorThicknessPx);
  const centerGapPx = usesInsetMount ? 2 : doorGapPx;
  const hingeAnchorInsetPx = usesInsetMount ? insetMarginPx : (doorMount === "full-overlay" ? 1.5 : doorGapPx);
  const doorFaceHeight = usesInsetMount
    ? Math.max(18, heightPx - insetMarginPx * 2)
    : Math.max(18, heightPx - doorGapPx * 2 + overlayBumpPx * 2);
  const singleDoorWidth = usesInsetMount
    ? Math.max(18, widthPx - insetMarginPx * 2)
    : Math.max(18, widthPx - doorGapPx * 2 + overlayBumpPx * 2);
  const doubleDoorWidth = usesInsetMount
    ? Math.max(12, (widthPx - insetMarginPx * 2 - centerGapPx) / 2)
    : Math.max(12, (widthPx - doorGapPx * 2 - centerGapPx + overlayBumpPx * 2) / 2);
  const doorFaceZ = usesInsetMount
    ? depthPx / 2 - doorThicknessPx / 2 - insetDepthPx
    : depthPx / 2 + doorThicknessPx / 2 + (doorMount === "full-overlay" ? 1.5 : 0.75);
  const resolvedDoorStyle = getResolvedDoorStyle(widthPx, box.doorStyle ?? "auto");
  const topDrawerHeightPx = clamp(Number(box.topDrawerHeight ?? 6) * 10, 35, Math.max(35, doorFaceHeight - 24));
  const drawerBankGapPx = Math.max(2, doorGapPx);
  const drawerCount = clamp(Math.round(Number(box.drawerCount ?? 3) || 3), 1, 5);
  const drawerBankHeightPx = Math.max(18, (doorFaceHeight - drawerBankGapPx * (drawerCount - 1)) / drawerCount);
  const frontTopEdgeY = -(doorFaceHeight / 2);
  const frontWidthPx = singleDoorWidth;
  const drawerBoxDepthPx = getDrawerBoxDepthInches(depthPx / 10, box.drawerSlideType ?? "undermount") * 10;
  const drawerTravelPx = Math.max(24, Math.min(drawerBoxDepthPx * 0.92, depthPx * 0.82));
  const lowerDoorHeightPx = Math.max(18, doorFaceHeight - topDrawerHeightPx - drawerBankGapPx);
  const lowerDoorCenterY = frontTopEdgeY + topDrawerHeightPx + drawerBankGapPx + lowerDoorHeightPx / 2;

  const doors = [];
  if (doorsEnabled && !showDrawerBank) {
    const doorOpenAmount = getStoredDoorOpenAmount(box);
    const addDoorSpec = ({ hingeX, leafWidth, hinge, centerY, faceHeight }) => {
      if (doorOpenAmount <= 0.001) return;
      const swingDeg = (hinge === "left" ? -105 : 105) * doorOpenAmount;
      const offsetX = hinge === "left" ? leafWidth / 2 : -leafWidth / 2;
      const rotatedCenter = rotatePoint2D(offsetX, 0, swingDeg);
      const localCenter = {
        x: hingeX + rotatedCenter.x,
        z: doorFaceZ + rotatedCenter.z,
      };
      const worldCenter = rotatePoint2D(localCenter.x, localCenter.z, rotationDeg);
      doors.push({
        type: "door",
        boxIndex: box.boxIndex,
        centerY,
        faceHeight,
        centerX: boxX + worldCenter.x,
        centerZ: boxZ + worldCenter.z,
        widthPx: leafWidth,
        depthPx: doorThicknessPx,
        rotationDeg: rotationDeg + swingDeg,
      });
    };

    if (resolvedDoorStyle === "double") {
      addDoorSpec({
        hingeX: -widthPx / 2 + hingeAnchorInsetPx,
        leafWidth: doubleDoorWidth,
        hinge: "left",
        centerY: showTopDrawer ? lowerDoorCenterY : 0,
        faceHeight: showTopDrawer ? lowerDoorHeightPx : doorFaceHeight,
      });
      addDoorSpec({
        hingeX: widthPx / 2 - hingeAnchorInsetPx,
        leafWidth: doubleDoorWidth,
        hinge: "right",
        centerY: showTopDrawer ? lowerDoorCenterY : 0,
        faceHeight: showTopDrawer ? lowerDoorHeightPx : doorFaceHeight,
      });
    } else {
      addDoorSpec({
        hingeX: doorHand === "right" ? widthPx / 2 - hingeAnchorInsetPx : -widthPx / 2 + hingeAnchorInsetPx,
        leafWidth: singleDoorWidth,
        hinge: doorHand,
        centerY: showTopDrawer ? lowerDoorCenterY : 0,
        faceHeight: showTopDrawer ? lowerDoorHeightPx : doorFaceHeight,
      });
    }
  }

  const drawers = [];
  const addDrawerSpec = ({ openAmount, centerY, faceHeight }) => {
    if (openAmount <= 0.001) return;
    const localCenter = {
      x: 0,
      z: doorFaceZ + (drawerTravelPx * openAmount) / 2,
    };
    const worldCenter = rotatePoint2D(localCenter.x, localCenter.z, rotationDeg);
    drawers.push({
      type: "drawer",
      boxIndex: box.boxIndex,
      centerY,
      faceHeight,
      centerX: boxX + worldCenter.x,
      centerZ: boxZ + worldCenter.z,
      widthPx: frontWidthPx,
      depthPx: drawerFrontThicknessPx + drawerTravelPx * openAmount,
      rotationDeg,
    });
  };

  if (showDrawerBank) {
    const drawerOpenStates = getStoredDrawerOpenAmounts(box);
    Array.from({ length: drawerCount }, (_, drawerIndex) => {
      const drawerY = frontTopEdgeY + drawerBankHeightPx / 2 + drawerIndex * (drawerBankHeightPx + drawerBankGapPx);
      addDrawerSpec({ openAmount: clamp(Number(drawerOpenStates[drawerIndex] ?? 0), 0, 1), centerY: drawerY, faceHeight: drawerBankHeightPx });
      return null;
    });
  } else if (showTopDrawer) {
    addDrawerSpec({
      openAmount: getStoredDrawerOpenAmount(box),
      centerY: frontTopEdgeY + topDrawerHeightPx / 2,
      faceHeight: topDrawerHeightPx,
    });
  }

  return { doors, drawers };
}

function aabbsIntersect(a, b, clearancePx = 2) {
  return boxesOverlap(
    {
      xPx: a.centerX,
      zPx: a.centerZ,
      widthPx: a.widthPx,
      depthPx: a.depthPx,
      rotationDeg: a.rotationDeg,
    },
    {
      xPx: b.centerX,
      zPx: b.centerZ,
      widthPx: b.widthPx,
      depthPx: b.depthPx,
      rotationDeg: b.rotationDeg,
    },
    clearancePx,
  );
}

function resolveLowerFrontInteractions(lowerRun) {
  const resolved = lowerRun.map((box, index) => ({
    ...box,
    boxIndex: index,
    effectiveDoorOpenAmount: getStoredDoorOpenAmount(box),
    effectiveDrawerOpenAmount: getStoredDrawerOpenAmount(box),
    effectiveDrawerOpenAmounts: getStoredDrawerOpenAmounts(box),
  }));

  for (let pass = 0; pass < 2; pass += 1) {
    for (let index = 0; index < resolved.length; index += 1) {
      for (let compareIndex = index + 1; compareIndex < resolved.length; compareIndex += 1) {
        const a = resolved[index];
        const b = resolved[compareIndex];
        const aSpecs = getLowerBoxFrontInteractionSpecs(a);
        const bSpecs = getLowerBoxFrontInteractionSpecs(b);

        const drawerDoorConflict = [
          ...aSpecs.drawers.flatMap((drawer) => bSpecs.doors.map((door) => ({ drawer, door, drawerBox: a, doorBox: b }))),
          ...bSpecs.drawers.flatMap((drawer) => aSpecs.doors.map((door) => ({ drawer, door, drawerBox: b, doorBox: a }))),
        ].some(({ drawer, door }) => aabbsIntersect(drawer, door, 2));

        if (drawerDoorConflict) {
          if ((a.drawerMode ?? "none") !== "none") {
            if ((a.drawerMode ?? "none") === "drawer-bank") {
              a.effectiveDrawerOpenAmounts = a.effectiveDrawerOpenAmounts.map((value) => (value > 0 ? Math.min(value, 0.9) : value));
            } else {
              a.effectiveDrawerOpenAmount = a.effectiveDrawerOpenAmount > 0 ? Math.min(a.effectiveDrawerOpenAmount, 0.9) : a.effectiveDrawerOpenAmount;
            }
          }
          if ((b.drawerMode ?? "none") !== "none") {
            if ((b.drawerMode ?? "none") === "drawer-bank") {
              b.effectiveDrawerOpenAmounts = b.effectiveDrawerOpenAmounts.map((value) => (value > 0 ? Math.min(value, 0.9) : value));
            } else {
              b.effectiveDrawerOpenAmount = b.effectiveDrawerOpenAmount > 0 ? Math.min(b.effectiveDrawerOpenAmount, 0.9) : b.effectiveDrawerOpenAmount;
            }
          }
          a.effectiveDoorOpenAmount = a.effectiveDoorOpenAmount > 0 ? Math.min(a.effectiveDoorOpenAmount, 0.75) : a.effectiveDoorOpenAmount;
          b.effectiveDoorOpenAmount = b.effectiveDoorOpenAmount > 0 ? Math.min(b.effectiveDoorOpenAmount, 0.75) : b.effectiveDoorOpenAmount;
        }

        const doorDoorConflict = aSpecs.doors.some((doorA) => bSpecs.doors.some((doorB) => aabbsIntersect(doorA, doorB, 2)));
        if (doorDoorConflict) {
          a.effectiveDoorOpenAmount = a.effectiveDoorOpenAmount > 0 ? Math.min(a.effectiveDoorOpenAmount, 0.82) : a.effectiveDoorOpenAmount;
          b.effectiveDoorOpenAmount = b.effectiveDoorOpenAmount > 0 ? Math.min(b.effectiveDoorOpenAmount, 0.82) : b.effectiveDoorOpenAmount;
        }
      }
    }
  }

  return resolved;
}

function persistResolvedLowerFrontStates(boxes, roomDepthIn, pxPerInch = 10) {
  const renderBoxes = getLowerRenderLayout(boxes, pxPerInch, (Number(roomDepthIn) || 0) * pxPerInch);
  const resolvedBoxes = resolveLowerFrontInteractions(renderBoxes);
  let didChange = false;

  const nextBoxes = boxes.map((box, index) => {
    const resolved = resolvedBoxes[index];
    if (!resolved) return box;

    const nextDoorOpenAmount = clamp(Number(resolved.effectiveDoorOpenAmount ?? 0), 0, 1);
    const nextDrawerOpenAmount = clamp(Number(resolved.effectiveDrawerOpenAmount ?? 0), 0, 1);
    const nextDrawerOpenAmounts = Array.from({ length: 5 }, (_, drawerIndex) => clamp(Number(resolved.effectiveDrawerOpenAmounts?.[drawerIndex] ?? 0), 0, 1));

    const doorChanged = Math.abs(getStoredDoorOpenAmount(box) - nextDoorOpenAmount) > 0.001;
    const drawerChanged = Math.abs(getStoredDrawerOpenAmount(box) - nextDrawerOpenAmount) > 0.001;
    const drawerArrayChanged = nextDrawerOpenAmounts.some((value, drawerIndex) => Math.abs(getStoredDrawerOpenAmounts(box)[drawerIndex] - value) > 0.001);

    if (!doorChanged && !drawerChanged && !drawerArrayChanged) return box;

    didChange = true;
    return {
      ...box,
      doorOpenAmount: nextDoorOpenAmount,
      drawerOpenAmount: nextDrawerOpenAmount,
      drawerOpenAmounts: nextDrawerOpenAmounts,
      doorOpen: nextDoorOpenAmount > 0.001,
      drawerOpen: nextDrawerOpenAmount > 0.001,
      drawerOpenStates: nextDrawerOpenAmounts.map((value) => value > 0.001),
    };
  });

  return didChange ? nextBoxes : boxes;
}

function getRectPrismFaceAnchors({ widthPx, heightPx, depthPx, centerY = 0 }) {
  const safeWidth = Math.max(1, Number(widthPx) || 0);
  const safeHeight = Math.max(1, Number(heightPx) || 0);
  const safeDepth = Math.max(1, Number(depthPx) || 0);
  const halfW = safeWidth / 2;
  const halfH = safeHeight / 2;
  const halfD = safeDepth / 2;
  const topY = centerY - halfH;
  const bottomY = centerY + halfH;

  const corners = {
    frontTopLeft: { id: "front-top-left", localX: -halfW, localY: topY, localZ: halfD },
    frontTopRight: { id: "front-top-right", localX: halfW, localY: topY, localZ: halfD },
    frontBottomLeft: { id: "front-bottom-left", localX: -halfW, localY: bottomY, localZ: halfD },
    frontBottomRight: { id: "front-bottom-right", localX: halfW, localY: bottomY, localZ: halfD },
    backTopLeft: { id: "back-top-left", localX: -halfW, localY: topY, localZ: -halfD },
    backTopRight: { id: "back-top-right", localX: halfW, localY: topY, localZ: -halfD },
    backBottomLeft: { id: "back-bottom-left", localX: -halfW, localY: bottomY, localZ: -halfD },
    backBottomRight: { id: "back-bottom-right", localX: halfW, localY: bottomY, localZ: -halfD },
  };

  return {
    front: [
      { ...corners.frontTopLeft, face: "front" },
      { ...corners.frontTopRight, face: "front" },
      { ...corners.frontBottomLeft, face: "front" },
      { ...corners.frontBottomRight, face: "front" },
      { id: "front-center", face: "front", localX: 0, localY: centerY, localZ: halfD },
    ],
    back: [
      { ...corners.backTopLeft, face: "back" },
      { ...corners.backTopRight, face: "back" },
      { ...corners.backBottomLeft, face: "back" },
      { ...corners.backBottomRight, face: "back" },
      { id: "back-center", face: "back", localX: 0, localY: centerY, localZ: -halfD },
    ],
    left: [
      { ...corners.frontTopLeft, face: "left" },
      { ...corners.backTopLeft, face: "left" },
      { ...corners.frontBottomLeft, face: "left" },
      { ...corners.backBottomLeft, face: "left" },
      { id: "left-center", face: "left", localX: -halfW, localY: centerY, localZ: 0 },
    ],
    right: [
      { ...corners.frontTopRight, face: "right" },
      { ...corners.backTopRight, face: "right" },
      { ...corners.frontBottomRight, face: "right" },
      { ...corners.backBottomRight, face: "right" },
      { id: "right-center", face: "right", localX: halfW, localY: centerY, localZ: 0 },
    ],
    top: [
      { ...corners.frontTopLeft, face: "top" },
      { ...corners.frontTopRight, face: "top" },
      { ...corners.backTopLeft, face: "top" },
      { ...corners.backTopRight, face: "top" },
      { id: "top-center", face: "top", localX: 0, localY: topY, localZ: 0 },
    ],
    bottom: [
      { ...corners.frontBottomLeft, face: "bottom" },
      { ...corners.frontBottomRight, face: "bottom" },
      { ...corners.backBottomLeft, face: "bottom" },
      { ...corners.backBottomRight, face: "bottom" },
      { id: "bottom-center", face: "bottom", localX: 0, localY: bottomY, localZ: 0 },
    ],
  };
}

function projectLocalAnchorToViewport({
  anchor,
  originX = 0,
  originY = 0,
  originZ = 0,
  rotationDeg = 0,
  orbitDeg = 0,
  tiltDeg = 0,
  panX = 0,
  panY = 0,
  zoom = 1,
  viewportWidth = 1440,
  viewportHeight = 900,
}) {
  const rotated = rotatePoint2D(anchor.localX, anchor.localZ, rotationDeg);
  const worldX = originX + rotated.x;
  const worldY = originY + anchor.localY;
  const worldZ = originZ + rotated.z;
  const projected = projectWorldPointToViewport({
    x: worldX,
    y: worldY,
    z: worldZ,
    orbitDeg,
    tiltDeg,
    panX,
    panY,
    zoom,
    viewportWidth,
    viewportHeight,
  });

  return {
    ...anchor,
    worldX,
    worldY,
    worldZ,
    screenX: projected.x,
    screenY: projected.y,
    screenDepth: projected.depth,
  };
}

function pickProjectedFaceAnchorFromClick({
  clientX,
  clientY,
  anchors,
  originX = 0,
  originY = 0,
  originZ = 0,
  rotationDeg = 0,
  orbitDeg = 0,
  tiltDeg = 0,
  panX = 0,
  panY = 0,
  zoom = 1,
  viewportWidth = 1440,
  viewportHeight = 900,
}) {
  if (!Array.isArray(anchors) || !anchors.length) return null;

  return anchors
    .map((anchor) => projectLocalAnchorToViewport({
      anchor,
      originX,
      originY,
      originZ,
      rotationDeg,
      orbitDeg,
      tiltDeg,
      panX,
      panY,
      zoom,
      viewportWidth,
      viewportHeight,
    }))
    .reduce((best, anchor) => {
      const distance = Math.hypot(clientX - anchor.screenX, clientY - anchor.screenY);
      if (!best || distance < best.distance) {
        return { ...anchor, distance };
      }
      return best;
    }, null);
}

function resolveLowerFaceAnchorFromClick({
  box,
  face = "front",
  clientX,
  clientY,
  lowerY,
  orbitDeg = 0,
  tiltDeg = 0,
  panX = 0,
  panY = 0,
  zoom = 1,
  viewportWidth = 1440,
  viewportHeight = 900,
}) {
  const type = box?.type ?? "cabinet";
  const kickEnabled = type === "cabinet" ? (box?.kickEnabled ?? true) : false;
  const heightPx = Number(box?.heightPx ?? ((Number(box?.height) || 0) * 10));
  const aboveFloorPx = kickEnabled ? 0 : Math.max(0, Number(box?.aboveFloor ?? 0) * 10);
  const visibleBoxHeightPx = Math.max(20, heightPx - aboveFloorPx);
  const toeKickHeightPx = kickEnabled ? Math.max(0, (Number(box?.toeKickHeight ?? 3) || 3) * 10) : 0;
  const anchorHeightPx = type === "cabinet"
    ? Math.max(20, visibleBoxHeightPx - toeKickHeightPx)
    : visibleBoxHeightPx;
  const anchorCenterY = type === "cabinet" ? -(toeKickHeightPx / 2) : 0;
  const anchorMap = getRectPrismFaceAnchors({
    widthPx: Number(box?.widthPx ?? ((Number(box?.width) || 0) * 10)),
    heightPx: anchorHeightPx,
    depthPx: Number(box?.depthPx ?? ((Number(box?.depth) || 0) * 10)),
    centerY: anchorCenterY,
  });
  const chosen = pickProjectedFaceAnchorFromClick({
    clientX,
    clientY,
    anchors: anchorMap[face] ?? anchorMap.front,
    originX: Number(box?.renderX ?? 0),
    originY: Number(lowerY ?? 0),
    originZ: Number(box?.renderZ ?? 0),
    rotationDeg: Number(box?.renderRotationDeg ?? box?.rotationDeg) || 0,
    orbitDeg,
    tiltDeg,
    panX,
    panY,
    zoom,
    viewportWidth,
    viewportHeight,
  });

  return chosen
    ? { localX: chosen.localX, localY: chosen.localY, localZ: chosen.localZ, face: chosen.face, anchorId: chosen.id }
    : { localX: 0, localY: anchorCenterY, localZ: Number(box?.depthPx ?? 0) / 2, face, anchorId: `${face}-center` };
}

function resolveUpperFaceAnchorFromClick({
  box,
  face = "front",
  clientX,
  clientY,
  upperY,
  upperZ,
  orbitDeg = 0,
  tiltDeg = 0,
  panX = 0,
  panY = 0,
  zoom = 1,
  viewportWidth = 1440,
  viewportHeight = 900,
}) {
  const widthPx = Number(box?.widthPx ?? ((Number(box?.width) || 0) * 10));
  const heightPx = Number(box?.heightPx ?? ((Number(box?.height) || 0) * 10));
  const depthPx = Number(box?.depthPx ?? ((Number(box?.depth) || 0) * 10));
  const anchorMap = getRectPrismFaceAnchors({ widthPx, heightPx, depthPx, centerY: 0 });
  const chosen = pickProjectedFaceAnchorFromClick({
    clientX,
    clientY,
    anchors: anchorMap[face] ?? anchorMap.front,
    originX: 0,
    originY: Number(upperY ?? 0),
    originZ: Number(upperZ ?? 0),
    rotationDeg: 0,
    orbitDeg,
    tiltDeg,
    panX,
    panY,
    zoom,
    viewportWidth,
    viewportHeight,
  });

  return chosen
    ? { localX: chosen.localX, localY: chosen.localY, localZ: chosen.localZ, face: chosen.face, anchorId: chosen.id }
    : { localX: 0, localY: 0, localZ: depthPx / 2, face, anchorId: `${face}-center` };
}

function resolveCountertopFaceAnchorFromClick({
  face = "top",
  clientX,
  clientY,
  runWidthPx,
  depthPx,
  slabHeightPx,
  countertopY,
  countertopZ,
  orbitDeg = 0,
  tiltDeg = 0,
  panX = 0,
  panY = 0,
  zoom = 1,
  viewportWidth = 1440,
  viewportHeight = 900,
}) {
  const anchorMap = getRectPrismFaceAnchors({
    widthPx: runWidthPx,
    heightPx: slabHeightPx,
    depthPx,
    centerY: 0,
  });
  const chosen = pickProjectedFaceAnchorFromClick({
    clientX,
    clientY,
    anchors: anchorMap[face] ?? anchorMap.top,
    originX: 0,
    originY: Number(countertopY ?? 0),
    originZ: Number(countertopZ ?? 0),
    rotationDeg: 0,
    orbitDeg,
    tiltDeg,
    panX,
    panY,
    zoom,
    viewportWidth,
    viewportHeight,
  });

  return chosen
    ? { localX: chosen.localX, localY: chosen.localY, localZ: chosen.localZ, face: chosen.face, anchorId: chosen.id }
    : { localX: 0, localY: -Number(slabHeightPx ?? 0) / 2, localZ: 0, face, anchorId: `${face}-center` };
}

function getPaintFinishGroups() {
  const paintOptions = getFinishToneOptions("paint");
  return {
    beige: paintOptions.filter((option) => option.group === "beige"),
    accent: paintOptions.filter((option) => option.group === "accent"),
  };
}

function resolveClosedLowerFrontNoteAnchor(box, xRatio = 0.5, yRatio = 0.5) {
  const widthPx = Number(box?.widthPx ?? ((Number(box?.width) || 0) * 10));
  const heightPx = Number(box?.heightPx ?? ((Number(box?.height) || 0) * 10));
  const frontPlaneZ = getLowerBoxFrontPlaneOffsetPx(box);
  const rawX = (clamp(Number(xRatio) || 0.5, 0, 1) - 0.5) * widthPx;
  const rawY = (clamp(Number(yRatio) || 0.5, 0, 1) - 0.5) * heightPx;
  const type = box?.type ?? "cabinet";

  if (type !== "cabinet") {
    const snapped = getFaceAnchorPoint2D(rawX, rawY, 0, 0, widthPx, heightPx, {
      edgeInsetPx: 1,
      snapThresholdPx: 12,
      centerSnapRadiusPx: 18,
    });
    return {
      localX: snapped?.x ?? rawX,
      localY: snapped?.y ?? rawY,
      localZ: frontPlaneZ,
      corner: snapped?.anchor ?? "center",
    };
  }

  const kickEnabled = box?.kickEnabled ?? true;
  const toeKickHeightPx = kickEnabled ? Math.max(0, (Number(box?.toeKickHeight ?? 3) || 3) * 10) : 0;
  const bodyHeight = Math.max(20, heightPx - toeKickHeightPx);
  const bodyCenterY = -(toeKickHeightPx / 2);
  const bodyTopY = bodyCenterY - bodyHeight / 2;
  const bodyBottomY = bodyCenterY + bodyHeight / 2;
  const clampedBodyY = clamp(rawY, bodyTopY + 1, bodyBottomY - 1);
  const doorsEnabled = box?.doorsEnabled ?? true;

  if (!doorsEnabled) {
    const snapped = getFaceAnchorPoint2D(rawX, clampedBodyY, 0, bodyCenterY, widthPx, bodyHeight, {
      edgeInsetPx: 1,
      snapThresholdPx: 12,
      centerSnapRadiusPx: 18,
    });
    return {
      localX: snapped?.x ?? rawX,
      localY: snapped?.y ?? clampedBodyY,
      localZ: frontPlaneZ,
      corner: snapped?.anchor ?? "center",
    };
  }

  const doorMount = box?.doorMount ?? "overlay";
  const usesInsetMount = doorMount === "inset";
  const doorGapPx = clamp((Number(box?.doorGap ?? 0.125) || 0.125) * 10, 1, 10);
  const insetMarginPx = 7.5;
  const overlayBumpPx = doorMount === "full-overlay" ? 7 : 0;
  const centerGapPx = usesInsetMount ? 2 : doorGapPx;
  const hingeAnchorInsetPx = usesInsetMount ? insetMarginPx : (doorMount === "full-overlay" ? 1.5 : doorGapPx);
  const doorFaceHeight = usesInsetMount
    ? Math.max(18, bodyHeight - insetMarginPx * 2)
    : Math.max(18, bodyHeight - doorGapPx * 2 + overlayBumpPx * 2);
  const singleDoorWidth = usesInsetMount
    ? Math.max(18, widthPx - insetMarginPx * 2)
    : Math.max(18, widthPx - doorGapPx * 2 + overlayBumpPx * 2);
  const doubleDoorWidth = usesInsetMount
    ? Math.max(12, (widthPx - insetMarginPx * 2 - centerGapPx) / 2)
    : Math.max(12, (widthPx - doorGapPx * 2 - centerGapPx + overlayBumpPx * 2) / 2);
  const resolvedDoorStyle = getResolvedDoorStyle(widthPx, box?.doorStyle ?? "auto");
  const drawerMode = box?.drawerMode ?? "none";
  const showDrawerBank = drawerMode === "drawer-bank";
  const showTopDrawer = drawerMode === "top-drawer";
  const frontTopEdgeY = bodyCenterY - doorFaceHeight / 2;
  const drawerBankGapPx = Math.max(2, doorGapPx);
  const drawerCount = clamp(Math.round(Number(box?.drawerCount ?? 3) || 3), 1, 5);
  const drawerBankHeightPx = Math.max(18, (doorFaceHeight - drawerBankGapPx * (drawerCount - 1)) / drawerCount);
  const topDrawerHeightPx = clamp((Number(box?.topDrawerHeight ?? 6) || 6) * 10, 35, Math.max(35, doorFaceHeight - 24));
  const lowerDoorHeightPx = Math.max(18, doorFaceHeight - topDrawerHeightPx - drawerBankGapPx);
  const lowerDoorCenterY = frontTopEdgeY + topDrawerHeightPx + drawerBankGapPx + lowerDoorHeightPx / 2;

  if (showDrawerBank) {
    const drawerCenters = Array.from({ length: drawerCount }, (_, drawerIndex) => frontTopEdgeY + drawerBankHeightPx / 2 + drawerIndex * (drawerBankHeightPx + drawerBankGapPx));
    const nearestIndex = drawerCenters.reduce((bestIndex, centerY, drawerIndex) => (
      Math.abs(clampedBodyY - centerY) < Math.abs(clampedBodyY - drawerCenters[bestIndex]) ? drawerIndex : bestIndex
    ), 0);
    const centerY = drawerCenters[nearestIndex];
    const snapped = getFaceAnchorPoint2D(rawX, clampedBodyY, 0, centerY, singleDoorWidth, drawerBankHeightPx, {
      edgeInsetPx: 1,
      snapThresholdPx: 12,
      centerSnapRadiusPx: 18,
    });
    return {
      localX: snapped?.x ?? rawX,
      localY: snapped?.y ?? clampedBodyY,
      localZ: frontPlaneZ,
      corner: snapped?.anchor ?? "center",
    };
  }

  if (showTopDrawer) {
    const drawerBottomY = frontTopEdgeY + topDrawerHeightPx;
    if (clampedBodyY <= drawerBottomY) {
      const drawerCenterY = frontTopEdgeY + topDrawerHeightPx / 2;
      const snapped = getFaceAnchorPoint2D(rawX, clampedBodyY, 0, drawerCenterY, singleDoorWidth, topDrawerHeightPx, {
        edgeInsetPx: 1,
        snapThresholdPx: 12,
        centerSnapRadiusPx: 18,
      });
      return {
        localX: snapped?.x ?? rawX,
        localY: snapped?.y ?? clampedBodyY,
        localZ: frontPlaneZ,
        corner: snapped?.anchor ?? "center",
      };
    }
  }

  if (resolvedDoorStyle === "double") {
    const isRightDoor = rawX > 0;
    const faceWidth = doubleDoorWidth;
    const centerX = isRightDoor
      ? widthPx / 2 - hingeAnchorInsetPx - faceWidth / 2
      : -widthPx / 2 + hingeAnchorInsetPx + faceWidth / 2;
    const centerY = showTopDrawer ? lowerDoorCenterY : bodyCenterY;
    const faceHeight = showTopDrawer ? lowerDoorHeightPx : doorFaceHeight;
    const snapped = getFaceAnchorPoint2D(rawX, clampedBodyY, centerX, centerY, faceWidth, faceHeight, {
      edgeInsetPx: 1,
      snapThresholdPx: 12,
      centerSnapRadiusPx: 18,
    });
    return {
      localX: snapped?.x ?? rawX,
      localY: snapped?.y ?? clampedBodyY,
      localZ: frontPlaneZ,
      corner: snapped?.anchor ?? "center",
    };
  }

  const doorHand = box?.doorHand === "right" ? "right" : "left";
  const faceWidth = singleDoorWidth;
  const centerX = doorHand === "right"
    ? widthPx / 2 - hingeAnchorInsetPx - faceWidth / 2
    : -widthPx / 2 + hingeAnchorInsetPx + faceWidth / 2;
  const centerY = showTopDrawer ? lowerDoorCenterY : bodyCenterY;
  const faceHeight = showTopDrawer ? lowerDoorHeightPx : doorFaceHeight;
  const snapped = getFaceAnchorPoint2D(rawX, clampedBodyY, centerX, centerY, faceWidth, faceHeight, {
    edgeInsetPx: 1,
    snapThresholdPx: 12,
    centerSnapRadiusPx: 18,
  });
  return {
    localX: snapped?.x ?? rawX,
    localY: snapped?.y ?? clampedBodyY,
    localZ: frontPlaneZ,
    corner: snapped?.anchor ?? "center",
  };
}

function getAxisSnapStops(center, length, insetPx = 1) {
  const safeLength = Math.max(2, Number(length) || 0);
  const safeInset = clamp(Number(insetPx) || 0, 0, safeLength / 2 - 1);
  const start = center - safeLength / 2 + safeInset;
  const end = center + safeLength / 2 - safeInset;
  const usable = Math.max(0, end - start);
  const fractions = [0, 1 / 3, 1 / 2, 2 / 3, 1];
  return fractions.map((fraction, index) => ({
    value: start + usable * fraction,
    fraction,
    index,
  }));
}

function snapValueToStops(value, stops, thresholdPx = 12) {
  if (!Array.isArray(stops) || !stops.length) {
    return { value, snapped: false, index: null, fraction: null };
  }

  const nearest = stops.reduce((best, stop) => {
    const distance = Math.abs(value - stop.value);
    if (!best || distance < best.distance) {
      return { ...stop, distance };
    }
    return best;
  }, null);

  if (nearest && nearest.distance <= thresholdPx) {
    return {
      value: nearest.value,
      snapped: true,
      index: nearest.index,
      fraction: nearest.fraction,
    };
  }

  const min = Math.min(...stops.map((stop) => stop.value));
  const max = Math.max(...stops.map((stop) => stop.value));
  return {
    value: clamp(value, min, max),
    snapped: false,
    index: null,
    fraction: null,
  };
}

function snapDimensionAxisValueToCorners(rawValue, minValue, maxValue, thresholdPx = 12) {
  return snapValueToStops(rawValue, [
    { value: minValue, index: 0, fraction: 0 },
    { value: maxValue, index: 4, fraction: 1 },
  ], thresholdPx).value;
}

function getLowerBoxDimensionAnchors(box, floorY = 260, pxPerInch = 10) {
  if (!box) return [];

  const widthPx = Number(box.widthPx ?? ((Number(box.width) || 0) * pxPerInch));
  const depthPx = Number(box.depthPx ?? ((Number(box.depth) || 0) * pxPerInch));
  const heightPx = Number(box.heightPx ?? ((Number(box.height) || 0) * pxPerInch));
  const renderX = Number(box.renderX ?? 0);
  const renderZ = Number(box.renderZ ?? 0);
  const kickEnabled = box.kickEnabled ?? true;
  const toeKickHeightPx = kickEnabled ? Math.max(0, Number(box.toeKickHeight ?? 3) * pxPerInch) : 0;
  const toeKickDepthPx = kickEnabled ? clamp(Number(box.toeKickDepth ?? 3) * pxPerInch, 0, Math.max(0, depthPx - 2)) : 0;
  const aboveFloorPx = kickEnabled ? 0 : Math.max(0, Number(box.aboveFloor ?? 0) * pxPerInch);
  const visibleBoxHeightPx = Math.max(0, heightPx - aboveFloorPx);
  const lowerY = floorY - heightPx / 2 - aboveFloorPx / 2;
  const topY = lowerY - visibleBoxHeightPx / 2;
  const bottomY = topY + visibleBoxHeightPx;
  const bodyBottomY = kickEnabled && toeKickHeightPx > 0 ? bottomY - toeKickHeightPx : bottomY;
  const leftX = renderX - widthPx / 2;
  const rightX = renderX + widthPx / 2;
  const backZ = renderZ - depthPx / 2;
  const frontZ = renderZ + depthPx / 2;
  const kickFrontZ = kickEnabled && toeKickDepthPx > 0 ? frontZ - toeKickDepthPx : frontZ;
  const anchors = [];
  const push = (id, worldX, worldY, worldZ) => anchors.push({ id, worldX, worldY, worldZ });

  push("back-top-left", leftX, topY, backZ);
  push("back-top-right", rightX, topY, backZ);
  push("front-top-left", leftX, topY, frontZ);
  push("front-top-right", rightX, topY, frontZ);

  if (!kickEnabled || toeKickHeightPx <= 0 || toeKickDepthPx <= 0) {
    push("back-bottom-left", leftX, bottomY, backZ);
    push("back-bottom-right", rightX, bottomY, backZ);
    push("front-bottom-left", leftX, bottomY, frontZ);
    push("front-bottom-right", rightX, bottomY, frontZ);
    return anchors;
  }

  push("back-body-bottom-left", leftX, bodyBottomY, backZ);
  push("back-body-bottom-right", rightX, bodyBottomY, backZ);
  push("front-body-bottom-left", leftX, bodyBottomY, frontZ);
  push("front-body-bottom-right", rightX, bodyBottomY, frontZ);
  push("kick-top-left", leftX, bodyBottomY, kickFrontZ);
  push("kick-top-right", rightX, bodyBottomY, kickFrontZ);
  push("kick-bottom-left", leftX, bottomY, kickFrontZ);
  push("kick-bottom-right", rightX, bottomY, kickFrontZ);

  return anchors;
}

function getFaceAnchorPoint2D(pointX, pointY, centerX, centerY, width, height, options = {}) {
  const edgeInsetPx = clamp(Number(options.edgeInsetPx ?? 1) || 1, 0, Math.min(width, height) / 2 - 1);
  const snapThresholdPx = Math.max(4, Number(options.snapThresholdPx ?? 12) || 12);
  const centerSnapRadiusPx = Math.max(6, Number(options.centerSnapRadiusPx ?? 18) || 18);

  const halfW = width / 2;
  const halfH = height / 2;
  const minX = centerX - halfW + edgeInsetPx;
  const maxX = centerX + halfW - edgeInsetPx;
  const minY = centerY - halfH + edgeInsetPx;
  const maxY = centerY + halfH - edgeInsetPx;
  const clampedX = clamp(pointX, minX, maxX);
  const clampedY = clamp(pointY, minY, maxY);

  const centerDistance = Math.hypot(clampedX - centerX, clampedY - centerY);
  if (centerDistance <= centerSnapRadiusPx) {
    return {
      x: centerX,
      y: centerY,
      anchor: "center",
      row: 2,
      col: 2,
      xFraction: 0.5,
      yFraction: 0.5,
    };
  }

  const edgeDistances = [
    { edge: "left", distance: Math.abs(clampedX - minX) },
    { edge: "right", distance: Math.abs(maxX - clampedX) },
    { edge: "top", distance: Math.abs(clampedY - minY) },
    { edge: "bottom", distance: Math.abs(maxY - clampedY) },
  ].sort((a, b) => a.distance - b.distance);

  const chosenEdge = edgeDistances[0]?.edge ?? "right";
  const xStops = getAxisSnapStops(centerX, width, edgeInsetPx);
  const yStops = getAxisSnapStops(centerY, height, edgeInsetPx);

  if (chosenEdge === "left" || chosenEdge === "right") {
    const snappedY = snapValueToStops(clampedY, yStops, snapThresholdPx);
    return {
      x: chosenEdge === "left" ? minX : maxX,
      y: snappedY.value,
      anchor: chosenEdge,
      row: snappedY.index,
      col: chosenEdge === "left" ? 0 : 4,
      xFraction: chosenEdge === "left" ? 0 : 1,
      yFraction: snappedY.fraction,
    };
  }

  const snappedX = snapValueToStops(clampedX, xStops, snapThresholdPx);
  return {
    x: snappedX.value,
    y: chosenEdge === "top" ? minY : maxY,
    anchor: chosenEdge,
    row: chosenEdge === "top" ? 0 : 4,
    col: snappedX.index,
    xFraction: snappedX.fraction,
    yFraction: chosenEdge === "top" ? 0 : 1,
  };
}

function getNearestCornerPoint2D(pointX, pointY, centerX, centerY, width, height, insetPx = 1) {
  return getFaceAnchorPoint2D(pointX, pointY, centerX, centerY, width, height, {
    edgeInsetPx: insetPx,
    snapThresholdPx: 12,
    centerSnapRadiusPx: 18,
  });
}

function snapTopFaceAnchorToCorner(localX, localZ, width, depth, insetPx = 1) {
  const snapped = getFaceAnchorPoint2D(localX, localZ, 0, 0, width, depth, {
    edgeInsetPx: insetPx,
    snapThresholdPx: 12,
    centerSnapRadiusPx: 18,
  });
  return {
    localX: snapped?.x ?? 0,
    localZ: snapped?.y ?? 0,
    row: snapped?.row ?? 2,
    col: snapped?.col ?? 2,
  };
}

function getSideFaceXRatio(face, xRatio = 0.5) {
  const safeRatio = clamp(Number(xRatio) || 0.5, 0, 1);
  return face === "right" ? 1 - safeRatio : safeRatio;
}

function resolveLowerSideOrBackNoteAnchor(box, face = "back", xRatio = 0.5, yRatio = 0.5) {
  const widthPx = Number(box?.widthPx ?? ((Number(box?.width) || 0) * 10));
  const depthPx = Number(box?.depthPx ?? ((Number(box?.depth) || 0) * 10));
  const heightPx = Number(box?.heightPx ?? ((Number(box?.height) || 0) * 10));
  const kickEnabled = box?.kickEnabled ?? true;
  const toeKickHeightPx = kickEnabled ? Math.max(0, (Number(box?.toeKickHeight ?? 3) || 3) * 10) : 0;
  const visibleBoxHeightPx = Math.max(20, heightPx - Math.max(0, Number(box?.aboveFloor ?? 0) * 10));
  const bodyCenterY = -(toeKickHeightPx / 2);
  const rawY = bodyCenterY + (clamp(Number(yRatio) || 0.5, 0, 1) - 0.5) * visibleBoxHeightPx;

  if (face === "back") {
    const mirroredXRatio = 1 - clamp(Number(xRatio) || 0.5, 0, 1);
    const rawX = (mirroredXRatio - 0.5) * widthPx;
    const snapped = getFaceAnchorPoint2D(rawX, rawY, 0, bodyCenterY, widthPx, visibleBoxHeightPx, {
      edgeInsetPx: 1,
      snapThresholdPx: 12,
      centerSnapRadiusPx: 18,
    });
    return {
      localX: snapped?.x ?? rawX,
      localY: snapped?.y ?? rawY,
      localZ: -depthPx / 2,
    };
  }

  const resolvedSideXRatio = getSideFaceXRatio(face, xRatio);
  const rawZ = (resolvedSideXRatio - 0.5) * depthPx;
  const snapped = getFaceAnchorPoint2D(rawZ, rawY, 0, bodyCenterY, depthPx, visibleBoxHeightPx, {
    edgeInsetPx: 1,
    snapThresholdPx: 12,
    centerSnapRadiusPx: 18,
  });
  return {
    localX: face === "right" ? widthPx / 2 : -widthPx / 2,
    localY: snapped?.y ?? rawY,
    localZ: snapped?.x ?? rawZ,
  };
}

function resolveUpperFaceNoteAnchor(box, face = "front", xRatio = 0.5, yRatio = 0.5) {
  const widthPx = Number(box?.widthPx ?? ((Number(box?.width) || 0) * 10));
  const depthPx = Number(box?.depthPx ?? ((Number(box?.depth) || 0) * 10));
  const heightPx = Number(box?.heightPx ?? ((Number(box?.height) || 0) * 10));

  if (face === "front") {
    return resolveUpperFrontNoteAnchor(box, xRatio, yRatio);
  }

  const rawY = (clamp(Number(yRatio) || 0.5, 0, 1) - 0.5) * heightPx;

  if (face === "back") {
    const mirroredXRatio = 1 - clamp(Number(xRatio) || 0.5, 0, 1);
    const rawX = (mirroredXRatio - 0.5) * widthPx;
    const snapped = getFaceAnchorPoint2D(rawX, rawY, 0, 0, widthPx, heightPx, {
      edgeInsetPx: 1,
      snapThresholdPx: 12,
      centerSnapRadiusPx: 18,
    });
    return {
      localX: snapped?.x ?? rawX,
      localY: snapped?.y ?? rawY,
      localZ: -depthPx / 2,
    };
  }

  const resolvedSideXRatio = getSideFaceXRatio(face, xRatio);
  const rawZ = (resolvedSideXRatio - 0.5) * depthPx;
  const snapped = getFaceAnchorPoint2D(rawZ, rawY, 0, 0, depthPx, heightPx, {
    edgeInsetPx: 1,
    snapThresholdPx: 12,
    centerSnapRadiusPx: 18,
  });
  return {
    localX: face === "right" ? widthPx / 2 : -widthPx / 2,
    localY: snapped?.y ?? rawY,
    localZ: snapped?.x ?? rawZ,
  };
}

function resolveCountertopFaceNoteAnchor({ face = "top", runWidthPx, depthPx, slabHeightPx, xRatio = 0.5, yRatio = 0.5, insetPx = 1 }) {
  if (face === "top") {
    const snapped = snapTopFaceAnchorToCorner(
      (clamp(Number(xRatio) || 0.5, 0, 1) - 0.5) * runWidthPx,
      (clamp(Number(yRatio) || 0.5, 0, 1) - 0.5) * depthPx,
      runWidthPx,
      depthPx,
      insetPx,
    );
    return {
      localX: snapped.localX,
      localY: -slabHeightPx / 2,
      localZ: snapped.localZ,
    };
  }

  const rawY = (clamp(Number(yRatio) || 0.5, 0, 1) - 0.5) * slabHeightPx;

  if (face === "front" || face === "back") {
    const resolvedXRatio = face === "back"
      ? 1 - clamp(Number(xRatio) || 0.5, 0, 1)
      : clamp(Number(xRatio) || 0.5, 0, 1);
    const rawX = (resolvedXRatio - 0.5) * runWidthPx;
    const snapped = getFaceAnchorPoint2D(rawX, rawY, 0, 0, runWidthPx, slabHeightPx, {
      edgeInsetPx: 1,
      snapThresholdPx: 12,
      centerSnapRadiusPx: 18,
    });
    return {
      localX: snapped?.x ?? rawX,
      localY: snapped?.y ?? rawY,
      localZ: face === "front" ? depthPx / 2 : -depthPx / 2,
    };
  }

  const resolvedSideXRatio = getSideFaceXRatio(face, xRatio);
  const rawZ = (resolvedSideXRatio - 0.5) * depthPx;
  const snapped = getFaceAnchorPoint2D(rawZ, rawY, 0, 0, depthPx, slabHeightPx, {
    edgeInsetPx: 1,
    snapThresholdPx: 12,
    centerSnapRadiusPx: 18,
  });
  return {
    localX: face === "right" ? runWidthPx / 2 : -runWidthPx / 2,
    localY: snapped?.y ?? rawY,
    localZ: snapped?.x ?? rawZ,
  };
}

function resolveUpperFrontNoteAnchor(box, xRatio = 0.5, yRatio = 0.5) {
  const widthPx = Number(box?.widthPx ?? ((Number(box?.width) || 0) * 10));
  const heightPx = Number(box?.heightPx ?? ((Number(box?.height) || 0) * 10));
  const frontPlaneZ = getLowerBoxFrontPlaneOffsetPx(box);
  const rawX = (clamp(Number(xRatio) || 0.5, 0, 1) - 0.5) * widthPx;
  const rawY = (clamp(Number(yRatio) || 0.5, 0, 1) - 0.5) * heightPx;
  const snapped = getFaceAnchorPoint2D(rawX, rawY, 0, 0, widthPx, heightPx, {
    edgeInsetPx: 1,
    snapThresholdPx: 12,
    centerSnapRadiusPx: 18,
  });
  return {
    localX: snapped?.x ?? rawX,
    localY: snapped?.y ?? rawY,
    localZ: frontPlaneZ,
    corner: snapped?.anchor ?? "center",
  };
}

// ==================================================
// Small glass card wrapper
// Reused by every floating panel.
// ==================================================
function GlassCard({ className = "", children }) {
  return (
    <div
      className={[
        "ck-glass rounded-[28px] border backdrop-blur-2xl",
        className,
      ].join(" ")}
      style={{
        borderColor: "var(--glass-border)",
        background: "var(--glass-bg)",
        boxShadow: "var(--glass-shadow)",
      }}
    >
      {children}
    </div>
  );
}

// ==================================================
// Pill button
// Shared floating control button styling.
// ==================================================
function PillButton({ active = false, children, ...props }) {
  return (
    <button
      type="button"
      className="ck-pill rounded-2xl border text-sm font-medium transition hover:opacity-90"
      style={active ? {
        borderColor: "var(--accent-border)",
        background: "var(--accent-bg)",
        color: "var(--accent-text)",
      } : {
        borderColor: "var(--control-border)",
        background: "var(--control-bg)",
        color: "var(--text-soft)",
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function IconPillButton({ active = false, icon, children, ...props }) {
  return (
    <PillButton active={active} {...props}>
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex h-4 w-4 items-center justify-center">{icon}</span>
        <span>{children}</span>
      </span>
    </PillButton>
  );
}

function IconOnlyPillButton({ active = false, icon, ...props }) {
  return (
    <button
      type="button"
      className="ck-icon-pill inline-flex shrink-0 items-center justify-center rounded-2xl border transition hover:opacity-90"
      style={active ? {
        borderColor: "var(--accent-border)",
        background: "var(--accent-bg)",
        color: "var(--accent-text)",
      } : {
        borderColor: "var(--control-border)",
        background: "var(--control-bg)",
        color: "var(--text-soft)",
      }}
      {...props}
    >
      <span className="inline-flex h-4 w-4 items-center justify-center">{icon}</span>
    </button>
  );
}

// ==================================================
// Toggle row
// Compact checkbox row for floating tools.
// ==================================================
function ToggleRow({ label, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange({ target: { checked: !checked } })}
      className="ck-toggle flex w-full items-center justify-between gap-3 rounded-2xl border text-sm text-left transition hover:opacity-90"
      style={{
        borderColor: "var(--panel-border)",
        background: "var(--panel-bg)",
        color: "var(--text-soft)",
      }}
    >
      <span>{label}</span>
      <span
        className="relative flex h-6 w-6 items-center justify-center rounded-full border transition"
        style={{
          borderColor: checked ? "var(--accent-border)" : "var(--control-border)",
          background: checked ? "var(--accent-bg)" : "transparent",
          boxShadow: checked ? "0 0 0 1px rgba(255,255,255,0.04) inset" : "none",
        }}
      >
        <span
          className={`block h-3.5 w-3.5 rounded-full transition-all duration-200 ${checked ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
          style={{ background: "var(--accent-text)" }}
        />
      </span>
    </button>
  );
}

// ==================================================
// Numeric field
// Common labeled numeric input.
// ==================================================
function NumberField({ label, value, onChange, min, max, step = 0.125, beforeChange, onBlur }) {
  const [draft, setDraft] = useState(String(value ?? ""));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraft(String(value ?? ""));
    }
  }, [value, isEditing]);

  const commitDraft = () => {
    const trimmed = String(draft ?? "").trim();
    const parsed = Number(trimmed);

    if (!Number.isFinite(parsed)) {
      setDraft(String(value ?? ""));
      if (onBlur) onBlur();
      setIsEditing(false);
      return;
    }

    if (beforeChange && beforeChange() === false) {
      setDraft(String(value ?? ""));
      if (onBlur) onBlur();
      setIsEditing(false);
      return;
    }

    const clamped = clamp(parsed, min ?? -Infinity, max ?? Infinity);
    const rounded = Math.round(clamped * 1000) / 1000;
    setDraft(String(rounded));
    onChange({ target: { value: String(rounded) } });
    if (onBlur) onBlur();
    setIsEditing(false);
  };

  const nudgeValue = (direction) => {
    if (beforeChange && beforeChange() === false) return;
    const current = Number.isFinite(Number(draft)) ? Number(draft) : Number(value) || 0;
    const next = clamp(current + direction * step, min ?? -Infinity, max ?? Infinity);
    const rounded = Math.round(next * 1000) / 1000;
    setDraft(String(rounded));
    onChange({ target: { value: String(rounded) } });
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>

      <div className="relative">
        <input
          className="ck-number-input w-full rounded-2xl border pr-12 text-sm outline-none"
          style={{
            borderColor: "var(--panel-border)",
            background: "var(--panel-bg)",
            color: "var(--text-main)",
          }}
          type="text"
          inputMode="decimal"
          value={draft}
          onFocus={() => setIsEditing(true)}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              setDraft(String(value ?? ""));
              setIsEditing(false);
              if (onBlur) onBlur();
              event.currentTarget.blur();
            }
          }}
        />

        <div className="absolute inset-y-1.5 right-1.5 flex w-8 flex-col overflow-hidden rounded-xl border" style={{ borderColor: "var(--panel-border)", background: "var(--control-bg)" }}>
          <button
            type="button"
            className="flex flex-1 items-center justify-center transition hover:opacity-90"
            style={{ color: "var(--text-soft)" }}
            onClick={() => nudgeValue(1)}
            aria-label={`Increase ${label}`}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 14l6-6 6 6" />
            </svg>
          </button>

          <div style={{ height: "1px", background: "var(--panel-border)" }} />

          <button
            type="button"
            className="flex flex-1 items-center justify-center transition hover:opacity-90"
            style={{ color: "var(--text-soft)" }}
            onClick={() => nudgeValue(-1)}
            aria-label={`Decrease ${label}`}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 10l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemeSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex items-center gap-3 rounded-full border px-3 py-2 transition hover:opacity-90"
      style={{
        borderColor: "var(--control-border)",
        background: "var(--control-bg)",
        color: "var(--text-soft)",
      }}
      aria-label="Toggle dark mode"
    >
      <span className="text-sm font-medium">Dark Mode</span>
      <span
        className="relative inline-flex h-6 w-11 rounded-full transition"
        style={{ background: checked ? "var(--accent-border)" : "var(--panel-border)" }}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0.5"}`}
          style={{ background: "var(--text-main)" }}
        />
      </span>
    </button>
  );
}

function EditorTabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ck-tab rounded-t-2xl border border-b-0 text-xs font-semibold uppercase tracking-[0.12em] transition hover:opacity-90"
      style={active ? {
        borderColor: "var(--panel-border)",
        background: "var(--panel-bg)",
        color: "var(--text-main)",
      } : {
        borderColor: "var(--control-border)",
        background: "transparent",
        color: "var(--text-muted)",
      }}
    >
      {label}
    </button>
  );
}

// ==================================================
// 3D face helper
// Used to build simple cuboids in CSS 3D.
// ==================================================
function Face({ style = {} }) {
  return (
    <div
      className="absolute border"
      style={{
        ...style,
        borderColor: style.borderColor ?? "var(--panel-border)",
        borderStyle: style.borderStyle ?? (style.borderColor === "transparent" ? "none" : undefined),
      }}
    />
  );
}

// ==================================================
// Panel3D helper
// One rectangular panel placed in 3D space.
// This comes from the last working 3D cabinet approach.
// ==================================================
function Panel3D({ width, height, depth, x = 0, y = 0, z = 0, color = "#d6d3d1", edge = "#a8a29e", borderColor = null }) {
  const panelStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    transformStyle: "preserve-3d",
    transform: `translate3d(${x}px, ${y}px, ${z}px)`,
  };
  const frontBackBase = {
    width: `${width}px`,
    height: `${height}px`,
    left: `${-width / 2}px`,
    top: `${-height / 2}px`,
    backfaceVisibility: "hidden",
  };
  const sideBase = {
    width: `${depth}px`,
    height: `${height}px`,
    left: `${-depth / 2}px`,
    top: `${-height / 2}px`,
    backfaceVisibility: "hidden",
  };
  const topBase = {
    width: `${width}px`,
    height: `${depth}px`,
    left: `${-width / 2}px`,
    top: `${-depth / 2}px`,
    backfaceVisibility: "hidden",
  };

  return (
    <div style={panelStyle}>
      <Face style={{ ...frontBackBase, transform: `translateZ(${depth / 2}px)`, backgroundColor: color, borderColor }} />
      <Face style={{ ...frontBackBase, transform: `rotateY(180deg) translateZ(${depth / 2}px)`, backgroundColor: color, borderColor }} />
      <Face style={{ ...sideBase, transform: `rotateY(90deg) translateZ(${width / 2}px)`, backgroundColor: edge, borderColor }} />
      <Face style={{ ...sideBase, transform: `rotateY(-90deg) translateZ(${width / 2}px)`, backgroundColor: edge, borderColor }} />
      <Face style={{ ...topBase, transform: `rotateX(90deg) translateZ(${height / 2}px)`, backgroundColor: color, borderColor }} />
      <Face style={{ ...topBase, transform: `rotateX(-90deg) translateZ(${height / 2}px)`, backgroundColor: edge, borderColor }} />
    </div>
  );
}

function DoorLeaf({
  hingeX = 0,
  y = 0,
  z = 0,
  width,
  height,
  thickness,
  hinge = "left",
  open = false,
  openAmount = null,
  kind = "flat",
  profileWidth = 2.25,
  shakerSlim = false,
  color = "#f5f5f4",
  edge = "#bdb7af",
  interactionLabel = "Toggle door",
  moveToolActive = false,
  rotateToolActive = false,
  interactionLocked = false,
  onFaceClick,
  onFaceMouseDown,
  onFaceMouseEnter,
  onFaceMouseLeave,
}) {
  const resolvedOpenAmount = clamp(openAmount == null ? (open ? 1 : 0) : Number(openAmount), 0, 1);
  const rotation = hinge === "left" ? (-105 * resolvedOpenAmount) : (105 * resolvedOpenAmount);
  const panelOffset = hinge === "left" ? width / 2 : -width / 2;
  const transformOrigin = hinge === "left" ? "0% 50%" : "100% 50%";
  const frameInsetPx = kind === "flat" || kind === "top-rail" ? 0 : clamp((shakerSlim ? 0.75 : profileWidth) * 10, 6, Math.min(width, height) / 3);
  const topRailHeightPx = clamp((shakerSlim ? 0.75 : profileWidth) * 10, 6, Math.min(width, height) / 3);
  const innerWidth = Math.max(12, width - frameInsetPx * 2);
  const innerHeight = Math.max(12, height - frameInsetPx * 2);
  const cursor = interactionLocked ? "default" : moveToolActive ? "grab" : rotateToolActive ? "ew-resize" : "pointer";

  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        transformStyle: "preserve-3d",
        transform: `translate3d(${hingeX}px, ${y}px, ${z}px)`,
      }}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transformOrigin,
          transform: `rotateY(${rotation}deg)`,
          transition: "transform 360ms cubic-bezier(0.2, 0.92, 0.18, 1.06)",
        }}
      >
        <Panel3D width={width} height={height} depth={thickness} x={panelOffset} color={color} edge={edge} borderColor="rgba(120,113,108,0.22)" />

        <button
          type="button"
          aria-label={interactionLabel}
          onClick={(event) => {
            event.stopPropagation();
            onFaceClick?.(event);
          }}
          onMouseDown={(event) => {
            event.stopPropagation();
            onFaceMouseDown?.(event);
          }}
          onMouseEnter={onFaceMouseEnter}
          onMouseLeave={onFaceMouseLeave}
          className="absolute"
          style={{
            left: `${panelOffset - width / 2}px`,
            top: `${-height / 2}px`,
            width: `${width}px`,
            height: `${height}px`,
            transform: `translateZ(${thickness / 2 + 10}px)`,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor,
            pointerEvents: interactionLocked ? "none" : "auto",
          }}
        />
        <button
          type="button"
          aria-label={interactionLabel}
          onClick={(event) => {
            event.stopPropagation();
            onFaceClick?.(event);
          }}
          onMouseDown={(event) => {
            event.stopPropagation();
            onFaceMouseDown?.(event);
          }}
          onMouseEnter={onFaceMouseEnter}
          onMouseLeave={onFaceMouseLeave}
          className="absolute"
          style={{
            left: `${panelOffset - width / 2}px`,
            top: `${-height / 2}px`,
            width: `${width}px`,
            height: `${height}px`,
            transform: `rotateY(180deg) translateZ(${thickness / 2 + 10}px)`,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor,
            pointerEvents: interactionLocked ? "none" : "auto",
          }}
        />

        {kind === "shaker" && (
          <div
            className="absolute border"
            style={{
              left: `${panelOffset - innerWidth / 2}px`,
              top: `${-innerHeight / 2}px`,
              width: `${innerWidth}px`,
              height: `${innerHeight}px`,
              transform: `translateZ(${thickness / 2 + 1}px)`,
              borderColor: "rgba(120,113,108,0.34)",
              background: "rgba(120,113,108,0.04)",
              pointerEvents: "none",
            }}
          />
        )}
        {(kind === "raised-panel" || kind === "recessed-panel") && (
          <div
            className="absolute border"
            style={{
              left: `${panelOffset - innerWidth / 2}px`,
              top: `${-innerHeight / 2}px`,
              width: `${innerWidth}px`,
              height: `${innerHeight}px`,
              transform: `translateZ(${thickness / 2 + 1}px)`,
              borderColor: "rgba(120,113,108,0.34)",
              background: kind === "raised-panel" ? "rgba(255,255,255,0.10)" : "rgba(120,113,108,0.04)",
              pointerEvents: "none",
            }}
          />
        )}
        {kind === "top-rail" && (
          <div
            className="absolute border"
            style={{
              left: `${panelOffset - width / 2}px`,
              top: `${-height / 2}px`,
              width: `${width}px`,
              height: `${topRailHeightPx}px`,
              transform: `translateZ(${thickness / 2 + 1}px)`,
              borderColor: "rgba(120,113,108,0.34)",
              background: "rgba(120,113,108,0.06)",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}

function DrawerAssembly({
  openingWidth,
  frontWidth,
  frontHeight,
  y = 0,
  z = 0,
  frontThickness = 7.5,
  boxDepth = 180,
  boxHeight = 56,
  slideType = "undermount",
  slideLengthIn = 18,
  sideWallThicknessIn = 0.5,
  open = false,
  openAmount = null,
  softClose = true,
  color = "#f5f5f4",
  edge = "#bdb7af",
  cabinetDepth = 230,
  interactionLabel = "Toggle drawer",
  moveToolActive = false,
  rotateToolActive = false,
  interactionLocked = false,
  onFaceClick,
  onFaceMouseDown,
  onFaceMouseEnter,
  onFaceMouseLeave,
}) {
  const slideLengthPx = (Number(slideLengthIn) || 18) * 10;
  const resolvedOpenAmount = clamp(openAmount == null ? (open ? 1 : 0) : Number(openAmount), 0, 1);
  const maxTravel = Math.max(24, Math.min(slideLengthPx * 0.96, cabinetDepth * 0.82));
  const extensionPx = maxTravel * resolvedOpenAmount;
  const drawerSideThickness = Math.max(5, (Number(sideWallThicknessIn) || 0.5) * 10);
  const sideMountClearancePerSide = 5.625;
  const blumUndermountOutsideDeduction = 39.4;
  const boxWidth = Math.max(24, slideType === "side-mount"
    ? openingWidth - sideMountClearancePerSide * 2
    : openingWidth - blumUndermountOutsideDeduction);
  const bottomThickness = slideType === "side-mount" ? 2.5 : 7.5;
  const boxCenterY = 0;
  const boxCenterZ = -(frontThickness / 2 + boxDepth / 2 + 2);
  const railHeight = slideType === "side-mount" ? 9 : 3;
  const railZ = boxCenterZ + Math.max(10, boxDepth / 2 - slideLengthPx / 2);
  const travelTransition = softClose
    ? "transform 620ms cubic-bezier(0.16, 1, 0.26, 1.04)"
    : "transform 260ms cubic-bezier(0.2, 0.9, 0.2, 1.02)";
  const cursor = interactionLocked ? "default" : moveToolActive ? "grab" : rotateToolActive ? "ew-resize" : "pointer";

  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        transformStyle: "preserve-3d",
        transform: `translate3d(0px, ${y}px, ${z}px)`,
      }}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: `translate3d(0px, 0px, ${extensionPx}px)`,
          transition: travelTransition,
        }}
      >
        <Panel3D width={frontWidth} height={frontHeight} depth={frontThickness} color={color} edge={edge} borderColor="rgba(120,113,108,0.28)" />

        <button
          type="button"
          aria-label={interactionLabel}
          onClick={(event) => {
            event.stopPropagation();
            onFaceClick?.(event);
          }}
          onMouseDown={(event) => {
            event.stopPropagation();
            onFaceMouseDown?.(event);
          }}
          onMouseEnter={onFaceMouseEnter}
          onMouseLeave={onFaceMouseLeave}
          className="absolute"
          style={{
            left: `${-frontWidth / 2}px`,
            top: `${-frontHeight / 2}px`,
            width: `${frontWidth}px`,
            height: `${frontHeight}px`,
            transform: `translateZ(${frontThickness / 2 + 10}px)`,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor,
            pointerEvents: interactionLocked ? "none" : "auto",
          }}
        />
        <button
          type="button"
          aria-label={interactionLabel}
          onClick={(event) => {
            event.stopPropagation();
            onFaceClick?.(event);
          }}
          onMouseDown={(event) => {
            event.stopPropagation();
            onFaceMouseDown?.(event);
          }}
          onMouseEnter={onFaceMouseEnter}
          onMouseLeave={onFaceMouseLeave}
          className="absolute"
          style={{
            left: `${-frontWidth / 2}px`,
            top: `${-frontHeight / 2}px`,
            width: `${frontWidth}px`,
            height: `${frontHeight}px`,
            transform: `rotateY(180deg) translateZ(${frontThickness / 2 + 10}px)`,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor,
            pointerEvents: interactionLocked ? "none" : "auto",
          }}
        />

        <Panel3D width={boxWidth} height={bottomThickness} depth={boxDepth} y={boxCenterY + boxHeight / 2 - bottomThickness / 2} z={boxCenterZ} color="#ece7e1" edge="#b6ada3" borderColor="rgba(120,113,108,0.12)" />
        <Panel3D width={drawerSideThickness} height={boxHeight} depth={boxDepth} x={-(boxWidth / 2) + drawerSideThickness / 2} y={boxCenterY} z={boxCenterZ} color="#e7e5e4" edge="#b6ada3" borderColor="rgba(120,113,108,0.16)" />
        <Panel3D width={drawerSideThickness} height={boxHeight} depth={boxDepth} x={(boxWidth / 2) - drawerSideThickness / 2} y={boxCenterY} z={boxCenterZ} color="#e7e5e4" edge="#b6ada3" borderColor="rgba(120,113,108,0.16)" />
        <Panel3D width={boxWidth} height={boxHeight} depth={drawerSideThickness} y={boxCenterY} z={boxCenterZ - boxDepth / 2 + drawerSideThickness / 2} color="#e7e5e4" edge="#b6ada3" borderColor="rgba(120,113,108,0.16)" />

        {slideType === "side-mount" ? (
          [-1, 1].map((dir) => (
            <Panel3D
              key={`drawer-rail-${dir}`}
              width={6}
              height={railHeight}
              depth={Math.max(40, slideLengthPx - 24)}
              x={dir * (openingWidth / 2 - 6)}
              y={boxCenterY + boxHeight / 2 - railHeight / 2 - 6}
              z={railZ}
              color="#d4d4d8"
              edge="#a1a1aa"
              borderColor="rgba(82,82,91,0.16)"
            />
          ))
        ) : (
          <>
            <Panel3D width={10} height={railHeight} depth={Math.max(40, slideLengthPx - 8)} x={-(boxWidth / 2) + 14} y={boxCenterY + boxHeight / 2 + 1.5} z={railZ} color="#d4d4d8" edge="#a1a1aa" borderColor="rgba(63,63,70,0.14)" />
            <Panel3D width={10} height={railHeight} depth={Math.max(40, slideLengthPx - 8)} x={(boxWidth / 2) - 14} y={boxCenterY + boxHeight / 2 + 1.5} z={railZ} color="#d4d4d8" edge="#a1a1aa" borderColor="rgba(63,63,70,0.14)" />
          </>
        )}
      </div>
    </div>
  );
}

// ==================================================
// Single cabinet helper
// Real cabinet box built from side panels, top, bottom, back, and toe kick.
// This avoids the flattened look from the simple cuboid.
// ==================================================
function SingleCabinet({
  widthPx,
  bodyHeight,
  toeKickHeightPx,
  toeKickDepth,
  toeKickZ,
  cabinet,
  isMoving = false,
  invalidPlacement = false,
  dimmed = false,
  isEquipmentGap = false,
  onToggleDoors,
  onToggleDrawers,
  onSelectSelf,
  onHoverStart,
  onHoverEnd,
  moveToolActive = false,
  rotateToolActive = false,
  interactionLocked = false,
  onMovePointerDown,
  onRotatePointerDown,
}) {
  const topBottomWidth = widthPx - cabinet.thickness * 2;
  const backWidth = widthPx - cabinet.thickness * 2;
  const backHeight = bodyHeight - cabinet.thickness * 2;
  const bodyCenterY = -(cabinet.toeKickHeight / 2);
  const continuousSidePanel = Boolean(cabinet.continuousSidePanel) && !isEquipmentGap && toeKickHeightPx > 0;
  const sidePanelHeight = continuousSidePanel ? bodyHeight + toeKickHeightPx : bodyHeight;
  const sidePanelCenterY = continuousSidePanel ? toeKickHeightPx / 2 : 0;
  const sidePanelDepth = cabinet.depth;
  const sidePanelFrontZ = 0;
  const toeKickCenterY = bodyHeight / 2;
  const liftY = isMoving ? -28 : 0;
  const shrink = isMoving ? 0.92 : 1;
  const opacity = dimmed ? 0.55 : 1;
  const cabinetColor = isEquipmentGap ? "rgba(214,211,209,0.12)" : invalidPlacement ? "#fecaca" : isMoving ? "#cbd5e1" : "#d6d3d1";
  const cabinetEdge = isEquipmentGap ? "rgba(168,162,158,0.25)" : invalidPlacement ? "#dc2626" : isMoving ? "#94a3b8" : "#a8a29e";
  const toeColor = isEquipmentGap ? "rgba(207,200,191,0.12)" : invalidPlacement ? "#fecaca" : isMoving ? "#bbf7d0" : "#cfc8bf";
  const toeEdge = isEquipmentGap ? "rgba(159,150,141,0.2)" : invalidPlacement ? "#dc2626" : isMoving ? "#16a34a" : "#9f968d";
  const continuousToeKickInsetPerSidePx = cabinet.thickness;
  const continuousToeKickWidthPx = Math.max(12, widthPx - continuousToeKickInsetPerSidePx * 2);
  const shelfCount = clamp(Math.round(Number(cabinet.shelfCount ?? 0) || 0), 0, 12);
  const adjustableShelves = cabinet.adjustableShelves ?? true;
  const pinHoleSpacingPx = Math.max(6, Number(cabinet.pinHoleSpacing ?? 1.25) * 10);
  const interiorHeight = Math.max(0, bodyHeight - cabinet.thickness * 2);
  const insetDoorReduction = cabinet.doorMount === "inset"
    ? 8 + Number(cabinet.doorInsetDepth ?? 0) * 10
    : 0;
  const shelfPanelDepth = Math.max(12, cabinet.depth - cabinet.thickness * 2 - insetDoorReduction);
  const shelfPanelWidth = Math.max(12, widthPx - cabinet.thickness * 2);
  let shelfPositions = [];
  let pinHolePositions = [];
  const doorsEnabled = !isEquipmentGap && (cabinet.doorsEnabled ?? true);
  const storedDoorOpenAmount = getStoredDoorOpenAmount(cabinet);
  const doorsOpen = !isEquipmentGap && storedDoorOpenAmount > 0.001;
  const doorHand = cabinet.doorHand === "right" ? "right" : "left";
  const doorKind = cabinet.doorKind ?? "flat";
  const doorInsetDepth = Number(cabinet.doorInsetDepth ?? 0) || 0;
  const doorProfile = Number(cabinet.doorProfile ?? 2.25) || 2.25;
  const shakerSlim = Boolean(cabinet.shakerSlim);
  const doorMount = cabinet.doorMount ?? "overlay";
  const resolvedDoorStyle = getResolvedDoorStyle(widthPx, cabinet.doorStyle ?? "auto");
  const usesInsetMount = doorMount === "inset";
  const doorGapPx = clamp(Number(cabinet.doorGap ?? 0.125) * 10, 1, 10);
  const insetMarginPx = 7.5;
  const doorThicknessPx = 7.5;
  const insetDepthPx = clamp(doorInsetDepth * 10, 0, doorThicknessPx);
  const overlayBumpPx = doorMount === "full-overlay" ? 7 : 0;
  const centerGapPx = usesInsetMount ? 2 : doorGapPx;
  const hingeAnchorInsetPx = usesInsetMount ? insetMarginPx : (doorMount === "full-overlay" ? 1.5 : doorGapPx);
  const doorFaceHeight = usesInsetMount
    ? Math.max(18, bodyHeight - insetMarginPx * 2)
    : Math.max(18, bodyHeight - doorGapPx * 2 + overlayBumpPx * 2);
  const singleDoorWidth = usesInsetMount
    ? Math.max(18, widthPx - insetMarginPx * 2)
    : Math.max(18, widthPx - doorGapPx * 2 + overlayBumpPx * 2);
  const doubleDoorWidth = usesInsetMount
    ? Math.max(12, (widthPx - insetMarginPx * 2 - centerGapPx) / 2)
    : Math.max(12, (widthPx - doorGapPx * 2 - centerGapPx + overlayBumpPx * 2) / 2);
  const doorFaceZ = usesInsetMount
    ? cabinet.depth / 2 - doorThicknessPx / 2 - insetDepthPx
    : cabinet.depth / 2 + doorThicknessPx / 2 + (doorMount === "full-overlay" ? 1.5 : 0.75);
  const isFillerPanel = cabinet.type === "filler-panel";
  const isPonyWall = cabinet.type === "pony-wall";
  const fillerView = cabinet.fillerView ?? "front";
  const fillerPlacement = cabinet.fillerPlacement === "right" ? "right" : "left";
  const fillerThicknessPx = clamp(Number(cabinet.fillerThickness ?? 0.75) * 10, 4, 20);
  const fillerFlushTarget = cabinet.fillerFlushTarget === "door" ? "door" : "box";
  const boxFrontPlanePx = cabinet.depth / 2;
  const doorFrontPlanePx = usesInsetMount
    ? cabinet.depth / 2 - insetDepthPx
    : cabinet.depth / 2 + doorThicknessPx + (doorMount === "full-overlay" ? 1.5 : 0.75);
  const fillerTargetFrontPlanePx = fillerFlushTarget === "door" ? doorFrontPlanePx : boxFrontPlanePx;
  const fillerFrontCenterZ = fillerTargetFrontPlanePx - fillerThicknessPx / 2;
  const fillerSideDepthPx = Math.max(fillerThicknessPx, cabinet.depth + (fillerTargetFrontPlanePx - boxFrontPlanePx));
  const fillerSideCenterZ = -cabinet.depth / 2 + fillerSideDepthPx / 2;
  const fillerFullHeight = bodyHeight + toeKickHeightPx;
  const drawerMode = cabinet.drawerMode ?? "none";
  const drawerCount = clamp(Math.round(Number(cabinet.drawerCount ?? 3) || 3), 1, 5);
  const storedDrawerOpenAmount = getStoredDrawerOpenAmount(cabinet);
  const storedDrawerOpenAmounts = getStoredDrawerOpenAmounts(cabinet);
  const drawerOpen = storedDrawerOpenAmount > 0.001;
  const drawerOpenStates = storedDrawerOpenAmounts.map((value) => value > 0.001);
  const drawerSlideType = cabinet.drawerSlideType ?? "undermount";
  const drawerSoftClose = cabinet.drawerSoftClose ?? true;
  const drawerSlideLengthIn = getDrawerSlideLengthInches(cabinet.depth / 10, drawerSlideType);
  const topDrawerHeightPx = clamp(Number(cabinet.topDrawerHeight ?? 6) * 10, 35, Math.max(35, doorFaceHeight - 24));
  const frontTopEdgeY = bodyCenterY - doorFaceHeight / 2;
  const frontWidthPx = singleDoorWidth;
  const drawerFrontZ = doorFaceZ;
  const frontInteractionZ = Math.max(cabinet.depth / 2 + 8, doorFaceZ + 10);
  const canUseFrontInteractiveOverlays = !interactionLocked && !moveToolActive && !rotateToolActive && !isEquipmentGap;
  const drawerOpeningWidthPx = Math.max(24, widthPx - cabinet.thickness * 2);
  const drawerBoxDepthPx = getDrawerBoxDepthInches(cabinet.depth / 10, drawerSlideType) * 10;
  const drawerTravelPx = Math.max(24, Math.min(drawerBoxDepthPx * 0.92, cabinet.depth * 0.82));
  const showDrawerBank = drawerMode === "drawer-bank";
  const showTopDrawer = drawerMode === "top-drawer";
  const drawerBankGapPx = Math.max(2, doorGapPx);
  const drawerBankHeightPx = Math.max(18, (doorFaceHeight - drawerBankGapPx * (drawerCount - 1)) / drawerCount);
  const drawerBankBoxHeightPx = Math.max(24, drawerBankHeightPx - 14);
  const drawerSideWallThicknessIn = Number(cabinet.drawerSideWallThickness ?? 0.5) || 0.5;
  const baseFaceAppearance = getFaceFinishAppearance(cabinet.faceFinishType ?? "paint", cabinet.faceFinishTone ?? "white", {
    supplier: cabinet.faceFinishSupplier,
    code: cabinet.faceFinishCode,
    customHex: cabinet.faceFinishCustomHex,
  });
  const faceAppearance = invalidPlacement
    ? { ...baseFaceAppearance, color: "#fecaca", edge: "#dc2626" }
    : isMoving
      ? { ...baseFaceAppearance, color: "#f1f5f9", edge: "#94a3b8" }
      : baseFaceAppearance;
  const topDrawerBoxHeightPx = Math.max(24, topDrawerHeightPx - 14);
  const shelfBlockedTopPx = showDrawerBank
    ? interiorHeight
    : showTopDrawer
      ? Math.min(interiorHeight, topDrawerHeightPx + drawerBankGapPx)
      : 0;
  const shelfZoneTopY = -bodyHeight / 2 + cabinet.thickness + shelfBlockedTopPx;
  const shelfZoneHeight = Math.max(0, interiorHeight - shelfBlockedTopPx);
  shelfPositions = showDrawerBank
    ? []
    : Array.from({ length: shelfCount }, (_, index) => {
        const gap = shelfZoneHeight / (shelfCount + 1);
        return shelfZoneTopY + gap * (index + 1);
      });
  const pinHoleRows = adjustableShelves && !showDrawerBank ? Math.max(0, Math.floor(shelfZoneHeight / pinHoleSpacingPx)) : 0;
  pinHolePositions = Array.from({ length: pinHoleRows }, (_, index) => shelfZoneTopY + pinHoleSpacingPx * (index + 0.75));
  const lowerDoorHeightPx = Math.max(18, doorFaceHeight - topDrawerHeightPx - drawerBankGapPx);
  const lowerDoorCenterY = frontTopEdgeY + topDrawerHeightPx + drawerBankGapPx + lowerDoorHeightPx / 2;

  if (isPonyWall) {
    return (
      <div style={{ transformStyle: "preserve-3d", transform: `translate3d(0px, ${liftY}px, 0px) scale(${shrink})`, opacity }}>
        <Panel3D
          width={widthPx}
          height={bodyHeight}
          depth={cabinet.depth}
          color={faceAppearance.color}
          edge={faceAppearance.edge}
          borderColor={invalidPlacement ? "rgba(220,38,38,0.9)" : "rgba(120,113,108,0.22)"}
        />
      </div>
    );
  }

  if (isFillerPanel) {
    return (
      <div style={{ transformStyle: "preserve-3d", transform: `translate3d(0px, ${liftY}px, 0px) scale(${shrink})`, opacity }}>
        {fillerView === "front" ? (
          <div style={{ transformStyle: "preserve-3d", transform: `translate3d(0px, 0px, ${fillerFrontCenterZ}px)` }}>
            <Panel3D width={widthPx} height={fillerFullHeight} depth={fillerThicknessPx} color={faceAppearance.color} edge={faceAppearance.edge} />
          </div>
        ) : (
          <div style={{ transformStyle: "preserve-3d", transform: `translate3d(${fillerPlacement === "right" ? widthPx / 2 - fillerThicknessPx / 2 : -widthPx / 2 + fillerThicknessPx / 2}px, 0px, ${fillerSideCenterZ}px)` }}>
            <Panel3D width={fillerThicknessPx} height={fillerFullHeight} depth={fillerSideDepthPx} color={faceAppearance.color} edge={faceAppearance.edge} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ transformStyle: "preserve-3d", transform: `translate3d(0px, ${liftY}px, 0px) scale(${shrink})`, opacity }}>
      <div style={{ transformStyle: "preserve-3d", transform: `translate3d(0px, ${bodyCenterY}px, 0px)` }}>
        <Panel3D width={cabinet.thickness} height={sidePanelHeight} depth={sidePanelDepth} y={sidePanelCenterY} z={sidePanelFrontZ} x={-(widthPx / 2) + cabinet.thickness / 2} color={cabinetColor} edge={cabinetEdge} />
        <Panel3D width={cabinet.thickness} height={sidePanelHeight} depth={sidePanelDepth} y={sidePanelCenterY} z={sidePanelFrontZ} x={(widthPx / 2) - cabinet.thickness / 2} color={cabinetColor} edge={cabinetEdge} />
        <Panel3D width={topBottomWidth} height={cabinet.thickness} depth={cabinet.depth} y={-(bodyHeight / 2) + cabinet.thickness / 2} color={cabinetColor} edge={cabinetEdge} />
        <Panel3D width={topBottomWidth} height={cabinet.thickness} depth={cabinet.depth} y={(bodyHeight / 2) - cabinet.thickness / 2} color={cabinetColor} edge={cabinetEdge} />
        {!isEquipmentGap && (
          <Panel3D width={backWidth} height={backHeight} depth={cabinet.thickness} z={-(cabinet.depth / 2) + cabinet.thickness / 2} color="#e7e5e4" edge="#bdb7af" />
        )}
      </div>

      {!isEquipmentGap && shelfPositions.map((shelfY, index) => (
        <div key={`shelf-${index}`} style={{ transformStyle: "preserve-3d", transform: `translate3d(0px, ${bodyCenterY + shelfY}px, 0px)` }}>
          <Panel3D width={shelfPanelWidth} height={cabinet.thickness} depth={shelfPanelDepth} color="#ece7e1" edge="#b6ada3" />
        </div>
      ))}

      {!isEquipmentGap && adjustableShelves && pinHolePositions.map((holeY, index) => {
        const sideXLeft = -widthPx / 2 + cabinet.thickness + 1.5;
        const sideXRight = widthPx / 2 - cabinet.thickness - 1.5;
        const frontRowZ = cabinet.depth / 2 - cabinet.thickness - 22;
        const backRowZ = -cabinet.depth / 2 + cabinet.thickness + 22;

        return (
          <React.Fragment key={`pin-row-${index}`}>
            {[sideXLeft, sideXRight].flatMap((holeX) => [frontRowZ, backRowZ].map((holeZ, holeOffsetIndex) => (
              <div
                key={`pin-${index}-${holeX}-${holeOffsetIndex}`}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: "4px",
                  height: "4px",
                  borderRadius: "999px",
                  background: "rgba(120,113,108,0.65)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.18)",
                  transform: `translate(-50%, -50%) translate3d(${holeX}px, ${bodyCenterY + holeY}px, ${holeZ}px) rotateY(90deg)`,
                  pointerEvents: "none",
                }}
              />
            )))}
          </React.Fragment>
        );
      })}

      {showDrawerBank && Array.from({ length: drawerCount }, (_, drawerIndex) => {
        const drawerY = frontTopEdgeY + drawerBankHeightPx / 2 + drawerIndex * (drawerBankHeightPx + drawerBankGapPx);
        return (
          <React.Fragment key={`drawer-bank-${drawerIndex}`}>
            <DrawerAssembly
              openingWidth={drawerOpeningWidthPx}
              frontWidth={frontWidthPx}
              frontHeight={drawerBankHeightPx}
              y={drawerY}
              z={drawerFrontZ}
              frontThickness={doorThicknessPx}
              boxDepth={drawerBoxDepthPx}
              boxHeight={drawerBankBoxHeightPx}
              slideType={drawerSlideType}
              slideLengthIn={drawerSlideLengthIn}
              sideWallThicknessIn={drawerSideWallThicknessIn}
              open={Boolean(drawerOpenStates[drawerIndex])}
              openAmount={clamp(Number(cabinet.effectiveDrawerOpenAmounts?.[drawerIndex] ?? storedDrawerOpenAmounts[drawerIndex] ?? 0), 0, 1)}
              softClose={drawerSoftClose}
              cabinetDepth={cabinet.depth}
              color={isMoving ? "#f1f5f9" : faceAppearance.color}
              edge={isMoving ? "#94a3b8" : faceAppearance.edge}
              interactionLabel={`Toggle drawer ${drawerIndex + 1}`}
              moveToolActive={moveToolActive}
              rotateToolActive={rotateToolActive}
              interactionLocked={interactionLocked}
              onFaceClick={(event) => {
                event.stopPropagation();
                if (event.metaKey || event.ctrlKey) {
                  onSelectSelf?.(event);
                  return;
                }
                if (moveToolActive || rotateToolActive) return;
                onToggleDrawers?.(drawerIndex);
              }}
              onFaceMouseDown={(event) => {
                event.stopPropagation();
                if (event.metaKey || event.ctrlKey) return;
                if (moveToolActive) {
                  event.preventDefault();
                  onMovePointerDown?.(event);
                  return;
                }
                if (rotateToolActive) {
                  event.preventDefault();
                  onRotatePointerDown?.(event);
                }
              }}
              onFaceMouseEnter={() => onHoverStart?.()}
              onFaceMouseLeave={() => onHoverEnd?.()}
            />
            {canUseFrontInteractiveOverlays && (
              <button
                type="button"
                aria-label={`Toggle drawer ${drawerIndex + 1}`}
                className="absolute"
                style={{
                  left: `${-frontWidthPx / 2}px`,
                  top: `${drawerY - drawerBankHeightPx / 2}px`,
                  width: `${frontWidthPx}px`,
                  height: `${drawerBankHeightPx}px`,
                  transform: `translateZ(${frontInteractionZ}px)`,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  zIndex: 8,
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleDrawers?.(drawerIndex);
                }}
                onMouseEnter={() => onHoverStart?.()}
                onMouseLeave={() => onHoverEnd?.()}
              />
            )}
          </React.Fragment>
        );
      })}

      {showTopDrawer && (
        <>
          <DrawerAssembly
            openingWidth={drawerOpeningWidthPx}
            frontWidth={frontWidthPx}
            frontHeight={topDrawerHeightPx}
            y={frontTopEdgeY + topDrawerHeightPx / 2}
            z={drawerFrontZ}
            frontThickness={doorThicknessPx}
            boxDepth={drawerBoxDepthPx}
            boxHeight={topDrawerBoxHeightPx}
            slideType={drawerSlideType}
            open={drawerOpen}
            openAmount={clamp(Number(cabinet.effectiveDrawerOpenAmount ?? storedDrawerOpenAmount), 0, 1)}
            softClose={drawerSoftClose}
            cabinetDepth={cabinet.depth}
            color={isMoving ? "#f1f5f9" : faceAppearance.color}
            edge={isMoving ? "#94a3b8" : faceAppearance.edge}
            interactionLabel="Toggle top drawer"
            moveToolActive={moveToolActive}
              rotateToolActive={rotateToolActive}
              interactionLocked={interactionLocked}
            onFaceClick={(event) => {
              event.stopPropagation();
              if (event.metaKey || event.ctrlKey) {
                onSelectSelf?.(event);
                return;
              }
              if (moveToolActive || rotateToolActive) return;
              onToggleDrawers?.();
            }}
            onFaceMouseDown={(event) => {
              if (event.metaKey || event.ctrlKey) return;
              if (moveToolActive) {
                event.stopPropagation();
                onMovePointerDown?.(event);
                return;
              }
              if (rotateToolActive) {
                event.stopPropagation();
                onRotatePointerDown?.(event);
              }
            }}
            onFaceMouseEnter={() => onHoverStart?.()}
            onFaceMouseLeave={() => onHoverEnd?.()}
          />
          {canUseFrontInteractiveOverlays && (
            <button
              type="button"
              aria-label="Toggle top drawer"
              className="absolute"
              style={{
                left: `${-frontWidthPx / 2}px`,
                top: `${frontTopEdgeY}px`,
                width: `${frontWidthPx}px`,
                height: `${topDrawerHeightPx}px`,
                transform: `translateZ(${frontInteractionZ}px)`,
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                zIndex: 8,
              }}
              onClick={(event) => {
                event.stopPropagation();
                onToggleDrawers?.();
              }}
              onMouseEnter={() => onHoverStart?.()}
              onMouseLeave={() => onHoverEnd?.()}
            />
          )}
        </>
      )}

      {!showDrawerBank && doorsEnabled && resolvedDoorStyle === "double" && (
        <>
          <DoorLeaf
            hingeX={-widthPx / 2 + hingeAnchorInsetPx}
            y={showTopDrawer ? lowerDoorCenterY : bodyCenterY}
            z={doorFaceZ}
            width={doubleDoorWidth}
            height={showTopDrawer ? lowerDoorHeightPx : doorFaceHeight}
            thickness={doorThicknessPx}
            hinge="left"
            open={doorsOpen}
            openAmount={clamp(Number(cabinet.effectiveDoorOpenAmount ?? storedDoorOpenAmount), 0, 1)}
            kind={doorKind}
            profileWidth={doorProfile}
            shakerSlim={shakerSlim}
            color={isMoving ? "#f1f5f9" : faceAppearance.color}
            edge={isMoving ? "#94a3b8" : faceAppearance.edge}
            interactionLabel="Toggle left door"
            moveToolActive={moveToolActive}
              rotateToolActive={rotateToolActive}
              interactionLocked={interactionLocked}
            onFaceClick={(event) => {
              event.stopPropagation();
              if (event.metaKey || event.ctrlKey) {
                onSelectSelf?.(event);
                return;
              }
              if (moveToolActive || rotateToolActive) return;
              onToggleDoors?.();
            }}
            onFaceMouseDown={(event) => {
              if (event.metaKey || event.ctrlKey) return;
              if (moveToolActive) {
                event.stopPropagation();
                onMovePointerDown?.(event);
                return;
              }
              if (rotateToolActive) {
                event.stopPropagation();
                onRotatePointerDown?.(event);
              }
            }}
            onFaceMouseEnter={() => onHoverStart?.()}
            onFaceMouseLeave={() => onHoverEnd?.()}
          />
          <DoorLeaf
            hingeX={widthPx / 2 - hingeAnchorInsetPx}
            y={showTopDrawer ? lowerDoorCenterY : bodyCenterY}
            z={doorFaceZ}
            width={doubleDoorWidth}
            height={showTopDrawer ? lowerDoorHeightPx : doorFaceHeight}
            thickness={doorThicknessPx}
            hinge="right"
            open={doorsOpen}
            openAmount={clamp(Number(cabinet.effectiveDoorOpenAmount ?? storedDoorOpenAmount), 0, 1)}
            kind={doorKind}
            profileWidth={doorProfile}
            shakerSlim={shakerSlim}
            color={isMoving ? "#f1f5f9" : faceAppearance.color}
            edge={isMoving ? "#94a3b8" : faceAppearance.edge}
            interactionLabel="Toggle right door"
            moveToolActive={moveToolActive}
              rotateToolActive={rotateToolActive}
              interactionLocked={interactionLocked}
            onFaceClick={(event) => {
              event.stopPropagation();
              if (event.metaKey || event.ctrlKey) {
                onSelectSelf?.(event);
                return;
              }
              if (moveToolActive || rotateToolActive) return;
              onToggleDoors?.();
            }}
            onFaceMouseDown={(event) => {
              if (event.metaKey || event.ctrlKey) return;
              if (moveToolActive) {
                event.stopPropagation();
                onMovePointerDown?.(event);
                return;
              }
              if (rotateToolActive) {
                event.stopPropagation();
                onRotatePointerDown?.(event);
              }
            }}
            onFaceMouseEnter={() => onHoverStart?.()}
            onFaceMouseLeave={() => onHoverEnd?.()}
          />
        </>
      )}

      {!showDrawerBank && doorsEnabled && resolvedDoorStyle !== "double" && (
        <>
          <DoorLeaf
            hingeX={doorHand === "right" ? widthPx / 2 - hingeAnchorInsetPx : -widthPx / 2 + hingeAnchorInsetPx}
            y={showTopDrawer ? lowerDoorCenterY : bodyCenterY}
            z={doorFaceZ}
            width={singleDoorWidth}
            height={showTopDrawer ? lowerDoorHeightPx : doorFaceHeight}
            thickness={doorThicknessPx}
            hinge={doorHand}
            open={doorsOpen}
            openAmount={clamp(Number(cabinet.effectiveDoorOpenAmount ?? storedDoorOpenAmount), 0, 1)}
            kind={doorKind}
            profileWidth={doorProfile}
            shakerSlim={shakerSlim}
            color={isMoving ? "#f1f5f9" : faceAppearance.color}
            edge={isMoving ? "#94a3b8" : faceAppearance.edge}
            interactionLabel="Toggle door"
            moveToolActive={moveToolActive}
              rotateToolActive={rotateToolActive}
              interactionLocked={interactionLocked}
            onFaceClick={(event) => {
              event.stopPropagation();
              if (event.metaKey || event.ctrlKey) {
                onSelectSelf?.(event);
                return;
              }
              if (moveToolActive || rotateToolActive) return;
              onToggleDoors?.();
            }}
            onFaceMouseDown={(event) => {
              if (event.metaKey || event.ctrlKey) return;
              if (moveToolActive) {
                event.stopPropagation();
                onMovePointerDown?.(event);
                return;
              }
              if (rotateToolActive) {
                event.stopPropagation();
                onRotatePointerDown?.(event);
              }
            }}
            onFaceMouseEnter={() => onHoverStart?.()}
            onFaceMouseLeave={() => onHoverEnd?.()}
          />
        </>
      )}

      {!isEquipmentGap && toeKickHeightPx > 0 && (
        <div style={{ transformStyle: "preserve-3d", transform: `translate3d(0px, ${toeKickCenterY}px, ${toeKickZ}px)` }}>
          <Panel3D
            width={continuousSidePanel ? continuousToeKickWidthPx : Math.max(12, widthPx)}
            height={toeKickHeightPx}
            depth={Math.max(8, toeKickDepth)}
            color={toeColor}
            edge={toeEdge}
          />
        </div>
      )}

      {isEquipmentGap && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: `${Math.max(10, widthPx - 6)}px`,
            height: `${Math.max(10, bodyHeight - 6)}px`,
            transform: `translate(-50%, -50%) translate3d(0px, ${bodyCenterY}px, ${cabinet.depth / 2 + 1}px)`,
            border: "2px dashed rgba(107,114,128,0.45)",
            background: "rgba(255,255,255,0.14)",
            color: "rgba(82,82,91,0.8)",
            fontSize: "11px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          equipment gap
        </div>
      )}
    </div>
  );
}

// ==================================================
// Cuboid helper
// Simple solid used for countertop slabs and other plain boxes.
// ==================================================
function Cuboid({
  x = 0,
  y = 0,
  z = 0,
  width,
  height,
  depth,
  color = "#e7e5e4",
  edge = "#a8a29e",
  selected = false,
  selectionColor = null,
  dataId,
  onClick,
  onMouseEnter,
  onMouseLeave,
  showFrontDetail = true,
  toeKickHeight = 0,
  showTopDirectionArrow = false,
}) {
  const accentBorder = selected ? (selectionColor || "rgba(47,78,161,0.82)") : edge;
  const frontBackBase = {
    width: `${width}px`,
    height: `${height}px`,
    left: `${-width / 2}px`,
    top: `${-height / 2}px`,
    borderColor: accentBorder,
    backfaceVisibility: "hidden",
  };
  const sideBase = {
    width: `${depth}px`,
    height: `${height}px`,
    left: `${-depth / 2}px`,
    top: `${-height / 2}px`,
    borderColor: accentBorder,
    backfaceVisibility: "hidden",
  };
  const topBase = {
    width: `${width}px`,
    height: `${depth}px`,
    left: `${-width / 2}px`,
    top: `${-depth / 2}px`,
    borderColor: accentBorder,
    backfaceVisibility: "hidden",
  };

  const detailWidth = Math.max(24, width - 18);
  const detailHeight = Math.max(24, height - 18);
  const topArrowWidth = Math.min(Math.max(26, width * 0.18), Math.max(26, width - 20));
  const topArrowDepth = Math.min(Math.max(48, depth * 0.6), Math.max(48, depth - 14));

  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        transformStyle: "preserve-3d",
        transform: `translate3d(${x}px, ${y}px, ${z}px)`,
      }}
    >
      <div style={{ transformStyle: "preserve-3d" }}>
        <Face style={{ ...frontBackBase, transform: `translateZ(${depth / 2}px)`, background: color }} />
        <Face style={{ ...frontBackBase, transform: `rotateY(180deg) translateZ(${depth / 2}px)`, background: color }} />
        <Face style={{ ...sideBase, transform: `rotateY(90deg) translateZ(${width / 2}px)`, background: edge }} />
        <Face style={{ ...sideBase, transform: `rotateY(-90deg) translateZ(${width / 2}px)`, background: edge }} />
        <Face style={{ ...topBase, transform: `rotateX(90deg) translateZ(${height / 2}px)`, background: "#f5f5f4" }} />
        <Face style={{ ...topBase, transform: `rotateX(-90deg) translateZ(${height / 2}px)`, background: edge }} />

        {showTopDirectionArrow && (
          <div
            className="absolute"
            style={{
              width: `${topArrowWidth}px`,
              height: `${topArrowDepth}px`,
              left: `${-topArrowWidth / 2}px`,
              top: `${-topArrowDepth / 2}px`,
              transform: `rotateX(90deg) translateZ(${height / 2 + 1}px)`,
              pointerEvents: "none",
            }}
          >
            <svg viewBox={`0 0 ${topArrowWidth} ${topArrowDepth}`} width="100%" height="100%" aria-hidden="true">
              <path
                d={`M ${topArrowWidth / 2} 8 L ${topArrowWidth / 2} ${topArrowDepth - 16}`}
                stroke={selected ? "rgba(30,64,175,0.88)" : "rgba(15,23,42,0.72)"}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d={`M ${topArrowWidth / 2} ${topArrowDepth - 8} L ${topArrowWidth / 2 - 7} ${topArrowDepth - 20} L ${topArrowWidth / 2 + 7} ${topArrowDepth - 20} Z`}
                fill={selected ? "rgba(30,64,175,0.88)" : "rgba(15,23,42,0.72)"}
              />
            </svg>
          </div>
        )}

        {showFrontDetail && (
          <>
            <div
              className="absolute rounded-[8px] border"
              style={{
                width: `${detailWidth}px`,
                height: `${detailHeight}px`,
                left: `${-detailWidth / 2}px`,
                top: `${-detailHeight / 2}px`,
                transform: `translateZ(${depth / 2 + 1}px)`,
                borderColor: selected ? "rgba(47,78,161,0.45)" : "rgba(120,113,108,0.46)",
                background: "rgba(255,255,255,0.08)",
              }}
            />
            {toeKickHeight > 0 && (
              <div
                className="absolute rounded-b-[6px] border-t"
                style={{
                  width: `${Math.max(18, width - 10)}px`,
                  height: `${toeKickHeight}px`,
                  left: `${-Math.max(18, width - 10) / 2}px`,
                  top: `${height / 2 - toeKickHeight}px`,
                  transform: `translateZ(${depth / 2 + 1}px)`,
                  borderColor: "rgba(120,113,108,0.55)",
                  background: "rgba(168,162,158,0.26)",
                }}
              />
            )}
          </>
        )}
      </div>

      <button
        type="button"
        data-cabinet={dataId}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent"
        style={{ width: `${width + depth}px`, height: `${height + depth}px` }}
        aria-label={dataId}
      />
    </div>
  );
}

function MoveSnapPreviewOverlay({ moveToolActive, moveSnapPreview, floorY, roomDepthPx }) {
  if (!moveToolActive || !moveSnapPreview.length) return null;

  return moveSnapPreview.map((preview) => {
    const ghostY = floorY - preview.heightPx / 2;
    const invalidPlacement = Boolean(preview.invalidPlacement);
    return (
      <React.Fragment key={`snap-preview-${preview.index}`}>
        {preview.neighborSnap && (
          <>
            <div
              className="absolute rounded-[10px]"
              style={{
                width: `${preview.widthPx}px`,
                height: `${preview.heightPx}px`,
                left: `${-preview.widthPx / 2}px`,
                top: `${-preview.heightPx / 2}px`,
                transformStyle: "preserve-3d",
                transform: `translate3d(${preview.xPx}px, ${ghostY}px, ${preview.zPx + preview.depthPx / 2 + 1}px)`,
                background: "rgba(59,130,246,0.08)",
                border: "1.5px dashed rgba(59,130,246,0.55)",
                boxShadow: "0 0 18px rgba(59,130,246,0.14)",
                pointerEvents: "none",
              }}
            />
            <div
              className="absolute"
              style={{
                width: `${preview.depthPx}px`,
                height: `${preview.heightPx}px`,
                left: `${-preview.depthPx / 2}px`,
                top: `${-preview.heightPx / 2}px`,
                transformStyle: "preserve-3d",
                transform: `translate3d(${preview.xPx + preview.widthPx / 2}px, ${ghostY}px, ${preview.zPx}px) rotateY(90deg)`,
                background: "rgba(59,130,246,0.05)",
                border: "1.5px dashed rgba(59,130,246,0.35)",
                pointerEvents: "none",
              }}
            />
          </>
        )}

        <div
          className="absolute rounded-[10px]"
          style={{
            width: `${preview.widthPx}px`,
            height: `${preview.depthPx}px`,
            left: `${-preview.widthPx / 2}px`,
            top: `${-preview.depthPx / 2}px`,
            transformStyle: "preserve-3d",
            transform: `translate3d(${preview.xPx}px, ${floorY - 1}px, ${preview.zPx}px) rotateY(${Number(preview.rotationDeg) || 0}deg) rotateX(90deg)`,
            background: invalidPlacement ? "rgba(239,68,68,0.10)" : "rgba(59,130,246,0.10)",
            border: invalidPlacement ? "2px solid rgba(239,68,68,0.9)" : "2px solid rgba(59,130,246,0.9)",
            boxShadow: invalidPlacement ? "0 0 0 1px rgba(255,255,255,0.16) inset, 0 0 18px rgba(239,68,68,0.22)" : "0 0 0 1px rgba(255,255,255,0.16) inset, 0 0 18px rgba(59,130,246,0.18)",
            pointerEvents: "none",
          }}
        />
        {preview.backWallSnap && (
          <div
            className="absolute"
            style={{
              width: `${preview.widthPx}px`,
              height: "14px",
              left: `${-preview.widthPx / 2}px`,
              top: "-14px",
              transformStyle: "preserve-3d",
              transform: `translate3d(${preview.xPx}px, ${floorY}px, ${-roomDepthPx / 2 + 1}px) rotateY(${Number(preview.rotationDeg) || 0}deg)`,
              background: invalidPlacement ? "rgba(239,68,68,0.82)" : "rgba(59,130,246,0.82)",
              boxShadow: invalidPlacement ? "0 0 18px rgba(239,68,68,0.24)" : "0 0 18px rgba(59,130,246,0.18)",
              pointerEvents: "none",
            }}
          />
        )}
      </React.Fragment>
    );
  });
}

function RotationIndicatorBadge({ angleDeg = 0, widthPx = 44, yPx = 0, zPx = 0 }) {
  const safeAngle = Math.round(Number(angleDeg) || 0);

  return (
    <div
      className="absolute"
      style={{
        width: `${widthPx}px`,
        height: `${widthPx}px`,
        left: `${-widthPx / 2}px`,
        top: `${-widthPx / 2}px`,
        transformStyle: "preserve-3d",
        transform: `translate3d(0px, ${yPx}px, ${zPx}px) rotateY(${-safeAngle}deg)`,
        pointerEvents: "none",
        zIndex: 45,
      }}
    >
      <div
        className="absolute inset-0 rounded-full border"
        style={{
          borderColor: "rgba(245,158,11,0.72)",
          background: "rgba(255,255,255,0.86)",
          boxShadow: "0 8px 18px rgba(15,23,42,0.12)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          className="absolute left-1/2 top-[4px] -translate-x-1/2"
          style={{
            width: "2px",
            height: "8px",
            borderRadius: "999px",
            background: "#b45309",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.65)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: "2px",
            height: `${Math.max(12, widthPx * 0.34)}px`,
            background: "#dc2626",
            borderRadius: "999px",
            transformOrigin: "50% calc(100% - 1px)",
            transform: `translate(-50%, calc(-100% + 3px)) rotate(${safeAngle}deg)`,
            boxShadow: "0 0 8px rgba(220,38,38,0.24)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "#f59e0b", boxShadow: "0 0 0 2px rgba(255,255,255,0.92)" }}
        />
        <div
          className="absolute left-1/2 bottom-[5px] -translate-x-1/2 rounded-full border px-1.5 py-[1px] text-[9px] font-semibold leading-none"
          style={{
            borderColor: "rgba(245,158,11,0.40)",
            background: "rgba(255,255,255,0.92)",
            color: "#92400e",
          }}
        >
          {safeAngle}°
        </div>
      </div>
    </div>
  );
}

// ==================================================
// Full background viewport
// Real 3D stage with room planes and cabinet cuboids.
// ==================================================
function ViewportBackground({
  state,
  selectedElement,
  selectedLowerIndex,
  selectedLowerIndices,
  setSelectedElement,
  setHoveredElement,
  setHoveredLowerIndex,
  onSelectLower,
  onToggleLowerDoors,
  onToggleLowerDrawers,
  onToggleUpperDoors,
  moveToolActive,
  rotateToolActive,
  pushPullToolActive,
  moveSnapPreview,
  onStartMoveLower,
  onStartRotateLower,
  onStartPushPullLower,
  onStartPushPullCountertop,
  pushPullDraft,
  countertopPushPullDraft,
  onViewportMouseDown,
  onViewportMouseMove,
  onViewportMouseUp,
  onViewportWheel,
  toolTab,
  shopDrawingNotes,
  shopDrawingNoteMode,
  shopDrawingDimensions,
  shopDrawingAutoDimensionsEnabled,
  shopDrawingDimensionMode,
  shopDrawingEraseMode,
  onAddShopDrawingNote,
  onAddShopDrawingDimension,
  onRemoveShopDrawingDimension,
  viewportSize,
}) {
  const dimensionDragRef = useRef({
    active: false,
    axis: "x",
    offsetSign: 1,
    startValue: 0,
    fixedX: 0,
    fixedY: 0,
    fixedZ: 0,
    minValue: 0,
    maxValue: 0,
    startClientX: 0,
    startClientY: 0,
  });
  const [dimensionDraft, setDimensionDraft] = useState(null);
  const [pendingDimensionSeed, setPendingDimensionSeed] = useState(null);
  const pxPerInch = 10;
  const roomWidthPx = state.roomWidth * pxPerInch;
  const roomDepthPx = state.roomDepth * pxPerInch;
  const roomHeightPx = state.roomHeight * pxPerInch;
  const lowerBoxes = state.lowerBoxes?.length ? state.lowerBoxes : [state.cabinet];
  const lowerRunBase = getLowerRenderLayout(lowerBoxes, pxPerInch, roomDepthPx);
  const lowerRun = resolveLowerFrontInteractions(lowerRunBase);
  const runWidthPx = lowerRun.reduce((sum, box) => sum + box.widthPx, 0);
  const maxLowerHeightPx = lowerRun.reduce((max, box) => {
    return Math.max(max, box.heightPx);
  }, 0);
  const maxLowerDepthPx = lowerRun.reduce((max, box) => Math.max(max, box.depthPx), 0);
  const upperWidthPx = state.upper.width * pxPerInch;
  const upperHeightPx = state.upper.height * pxPerInch;
  const upperDepthPx = state.upper.depth * pxPerInch;
  const floorY = 260;
  const countertopSettings = getCountertopSettings(state.countertopItem || {});
  const countertopPieceSize = getCountertopPieceSizeIn(state, state.countertopItem || {});
  const countertopSinglePieceValid = isCountertopSinglePieceSizeValid(countertopPieceSize.widthIn, countertopPieceSize.depthIn);
  const countertopHeightPx = countertopSettings.thickness * pxPerInch;
  const countertopTargetIdSet = new Set(Array.isArray(state.countertopItem?.targetLowerIds) ? state.countertopItem.targetLowerIds.filter(Boolean) : []);
  const targetLowerRun = countertopTargetIdSet.size ? lowerRun.filter((box) => countertopTargetIdSet.has(box.id)) : lowerRun;
  const countertopRun = targetLowerRun.length ? targetLowerRun : lowerRun;
  const countertopRunBounds = countertopRun.length
    ? countertopRun.reduce((acc, box) => {
        const bounds = getBoxBounds(box.renderX, box.renderZ, box.widthPx, box.depthPx, box.renderRotationDeg);
        return {
          left: Math.min(acc.left, bounds.left),
          right: Math.max(acc.right, bounds.right),
          zMin: Math.min(acc.zMin, bounds.zMin),
          zMax: Math.max(acc.zMax, bounds.zMax),
        };
      }, { left: Infinity, right: -Infinity, zMin: Infinity, zMax: -Infinity })
    : { left: -runWidthPx / 2, right: runWidthPx / 2, zMin: -maxLowerDepthPx / 2, zMax: maxLowerDepthPx / 2 };
  const targetMaxLowerHeightPx = countertopRun.reduce((max, box) => Math.max(max, Number(box.heightPx || 0)), 0);
  const countertopLeftX = countertopRunBounds.left - countertopSettings.leftOverhang * pxPerInch;
  const countertopRightX = countertopRunBounds.right + countertopSettings.rightOverhang * pxPerInch;
  const countertopBackZ = countertopRunBounds.zMin - countertopSettings.backOverhang * pxPerInch;
  const countertopFrontZ = countertopRunBounds.zMax + countertopSettings.frontOverhang * pxPerInch;
  const countertopWidthPx = Math.max(20, countertopRightX - countertopLeftX);
  const countertopDepthPx = Math.max(20, countertopFrontZ - countertopBackZ);
  const countertopX = (countertopLeftX + countertopRightX) / 2;
  const countertopZ = (countertopBackZ + countertopFrontZ) / 2;
  const countertopY = floorY - targetMaxLowerHeightPx - countertopHeightPx / 2;
  const upperY = floorY - maxLowerHeightPx - 40 - upperHeightPx / 2;
  const upperZ = -roomDepthPx / 2 + upperDepthPx / 2 + 40;
  const upperFillerThicknessPx = clamp(Number(state.upper.fillerThickness ?? 0.75) * pxPerInch, 4, 20);
  const upperUsesDoorPlane = (state.upper.fillerFlushTarget ?? "box") === "door";
  const upperDoorInsetPx = clamp((Number(state.upper.doorInsetDepth ?? 0) || 0) * pxPerInch, 0, 7.5);
  const upperDoorMount = state.upper.doorMount ?? "overlay";
  const upperDoorFrontPlanePx = upperDoorMount === "inset"
    ? upperDepthPx / 2 - upperDoorInsetPx
    : upperDepthPx / 2 + 7.5 + (upperDoorMount === "full-overlay" ? 1.5 : 0.75);
  const upperFrontPlanePx = upperUsesDoorPlane ? upperDoorFrontPlanePx : upperDepthPx / 2;
  const upperFillerIsSide = state.upper.type === "filler-panel" && (state.upper.fillerView ?? "front") === "side";
  const upperHitboxWidthPx = state.upper.type === "filler-panel"
    ? (upperFillerIsSide ? Math.max(24, upperFillerThicknessPx + 12) : Math.max(24, upperWidthPx + 12))
    : upperWidthPx;
  const upperHitboxHeightPx = state.upper.type === "filler-panel" ? Math.max(36, upperHeightPx) : upperHeightPx;
  const upperNoteFrontHitboxWidthPx = state.upper.type === "filler-panel"
    ? Math.max(upperHitboxWidthPx + 14, 38)
    : Math.max(upperHitboxWidthPx + 20, 44);
  const upperNoteFrontHitboxHeightPx = Math.max(upperHitboxHeightPx + 20, 44);
  const upperHitboxOffsetXPx = state.upper.type === "filler-panel" && upperFillerIsSide
    ? ((state.upper.fillerPlacement ?? "left") === "right"
        ? upperWidthPx / 2 - upperHitboxWidthPx / 2
        : -upperWidthPx / 2 + upperHitboxWidthPx / 2)
    : 0;
  const upperHitboxZPx = state.upper.type === "filler-panel" ? upperFrontPlanePx + 10 : upperDepthPx / 2 + 2;
  const perspectivePx = 950;
  const perspectiveValue = state.cameraMode === "parallel" ? "999999px" : `${perspectivePx}px`;
  const cameraDollyZ = getCameraDollyFromZoom(state.zoom);
  const parallelZoomScale = state.cameraMode === "parallel" ? clamp(Number(state.zoom) || 1, 0.12, 3.25) : 1;
  const stageTransform = state.cameraMode === "parallel"
    ? `translate(-50%, -50%) translate3d(${state.panX}px, ${state.panY}px, 0px) scale(${parallelZoomScale}) rotateX(${state.tilt}deg) rotateY(${state.orbit}deg)`
    : `translate(-50%, -50%) translate3d(${state.panX}px, ${state.panY}px, ${cameraDollyZ}px) rotateX(${state.tilt}deg) rotateY(${state.orbit}deg)`;
  const snapTargetIndexSet = new Set(moveSnapPreview.map((preview) => preview.targetIndex).filter((index) => Number.isInteger(index)));
  const movePreviewByIndex = new Map(moveSnapPreview.map((preview) => [preview.index, preview]));
  const movingPreviewIndexSet = new Set(moveSnapPreview.map((preview) => preview.index));
  const transformToolGridActive = moveToolActive || rotateToolActive || pushPullToolActive;
  const shopDrawingMode = toolTab === "shopDrawing";
  const orbitRad = (Number(state.orbit) || 0) * Math.PI / 180;
  const tiltRad = (Number(state.tilt) || 0) * Math.PI / 180;
  const cameraDirX = -Math.sin(orbitRad);
  const cameraDirZ = Math.cos(orbitRad);
  const topViewFactor = clamp((Math.abs(Math.sin(tiltRad)) - 0.72) / 0.28, 0, 1);
  const getWallOpacity = (nearFactor) => clamp(((0.92 - nearFactor * 0.88) * (1 - topViewFactor)) + (0.58 * topViewFactor), 0.03, 0.92);
  const frontWallOpacity = getWallOpacity(Math.max(cameraDirZ, 0));
  const backWallOpacity = getWallOpacity(Math.max(-cameraDirZ, 0));
  const rightWallOpacity = getWallOpacity(Math.max(cameraDirX, 0));
  const leftWallOpacity = getWallOpacity(Math.max(-cameraDirX, 0));
  const showTopNoteHitAreas = false;
  const noteVerticalFaceScores = {
    front: Math.max(cameraDirZ, 0) * (1 - topViewFactor),
    back: Math.max(-cameraDirZ, 0) * (1 - topViewFactor),
    right: Math.max(cameraDirX, 0) * (1 - topViewFactor),
    left: Math.max(-cameraDirX, 0) * (1 - topViewFactor),
  };
  const notePrimaryVerticalFace = Object.entries(noteVerticalFaceScores)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "front";
  const dimensionCornerModeActive = shopDrawingMode && shopDrawingDimensionMode && !shopDrawingEraseMode && selectedElement === "lower";

  const lowerRunDimensionBounds = lowerRun.length
    ? lowerRun.reduce((acc, box) => {
        const kickEnabled = box.kickEnabled ?? true;
        const aboveFloorPx = kickEnabled ? 0 : Math.max(0, Number(box.aboveFloor ?? 0) * pxPerInch);
        const visibleBoxHeightPx = Math.max(0, box.heightPx - aboveFloorPx);
        const lowerY = floorY - box.heightPx / 2 - aboveFloorPx / 2;
        const topY = lowerY - visibleBoxHeightPx / 2;
        const frontZ = box.renderZ + getLowerBoxFrontPlaneOffsetPx(box);
        return {
          leftX: Math.min(acc.leftX, box.renderX - box.widthPx / 2),
          rightX: Math.max(acc.rightX, box.renderX + box.widthPx / 2),
          topY: Math.min(acc.topY, topY),
          frontZ: Math.max(acc.frontZ, frontZ),
        };
      }, { leftX: Infinity, rightX: -Infinity, topY: Infinity, frontZ: -Infinity })
    : null;

  const autoShopDrawingDimensions = shopDrawingMode && shopDrawingAutoDimensionsEnabled
    ? [
        ...lowerRun.map((box) => {
          const kickEnabled = box.kickEnabled ?? true;
          const aboveFloorPx = kickEnabled ? 0 : Math.max(0, Number(box.aboveFloor ?? 0) * pxPerInch);
          const visibleBoxHeightPx = Math.max(0, box.heightPx - aboveFloorPx);
          const lowerY = floorY - box.heightPx / 2 - aboveFloorPx / 2;
          const topY = lowerY - visibleBoxHeightPx / 2;
          const frontZ = box.renderZ + getLowerBoxFrontPlaneOffsetPx(box);
          return {
            id: `auto-dim-box-${box.boxIndex}`,
            kind: "auto-box",
            text: formatArchitecturalInches(box.widthPx / pxPerInch),
            startWorld: { x: box.renderX - box.widthPx / 2, y: topY, z: frontZ },
            endWorld: { x: box.renderX + box.widthPx / 2, y: topY, z: frontZ },
            offsetPx: 24,
          };
        }),
        ...(lowerRunDimensionBounds ? [{
          id: "auto-dim-run-total",
          kind: "auto-total",
          text: formatArchitecturalInches((lowerRunDimensionBounds.rightX - lowerRunDimensionBounds.leftX) / pxPerInch),
          startWorld: { x: lowerRunDimensionBounds.leftX, y: lowerRunDimensionBounds.topY, z: lowerRunDimensionBounds.frontZ },
          endWorld: { x: lowerRunDimensionBounds.rightX, y: lowerRunDimensionBounds.topY, z: lowerRunDimensionBounds.frontZ },
          offsetPx: 58,
        }] : []),
      ]
    : [];

  const projectedShopDrawingNotes = [];
  const projectedShopDrawingDimensions = shopDrawingMode
    ? [...autoShopDrawingDimensions, ...(shopDrawingDimensions || []), ...(dimensionDraft ? [dimensionDraft] : [])]
        .map((dimension) => {
          const startProjected = projectWorldPointToViewport({
            x: Number(dimension.startWorld?.x ?? 0),
            y: Number(dimension.startWorld?.y ?? 0),
            z: Number(dimension.startWorld?.z ?? 0),
            orbitDeg: state.orbit,
            tiltDeg: state.tilt,
            panX: state.panX,
            panY: state.panY,
            zoom: state.zoom,
      cameraMode: state.cameraMode,
      cameraDollyZ,
      perspectivePx,
      viewportWidth: viewportSize?.width || 1440,
            viewportHeight: viewportSize?.height || 900,
          });
          const endProjected = projectWorldPointToViewport({
            x: Number(dimension.endWorld?.x ?? 0),
            y: Number(dimension.endWorld?.y ?? 0),
            z: Number(dimension.endWorld?.z ?? 0),
            orbitDeg: state.orbit,
            tiltDeg: state.tilt,
            panX: state.panX,
            panY: state.panY,
            zoom: state.zoom,
      cameraMode: state.cameraMode,
      cameraDollyZ,
      perspectivePx,
      viewportWidth: viewportSize?.width || 1440,
            viewportHeight: viewportSize?.height || 900,
          });
          return {
            ...dimension,
            startProjected,
            endProjected,
            geometry: getDimensionScreenGeometry(startProjected, endProjected, Number(dimension.offsetPx ?? 24)),
          };
        })
    : [];

  const dimensionOverlayPoints = lowerRunDimensionBounds
    ? {
        start: projectWorldPointToViewport({
          x: lowerRunDimensionBounds.leftX,
          y: lowerRunDimensionBounds.topY,
          z: lowerRunDimensionBounds.frontZ,
          orbitDeg: state.orbit,
          tiltDeg: state.tilt,
          panX: state.panX,
          panY: state.panY,
          zoom: state.zoom,
      cameraMode: state.cameraMode,
      cameraDollyZ,
      perspectivePx,
      viewportWidth: viewportSize?.width || 1440,
          viewportHeight: viewportSize?.height || 900,
        }),
        end: projectWorldPointToViewport({
          x: lowerRunDimensionBounds.rightX,
          y: lowerRunDimensionBounds.topY,
          z: lowerRunDimensionBounds.frontZ,
          orbitDeg: state.orbit,
          tiltDeg: state.tilt,
          panX: state.panX,
          panY: state.panY,
          zoom: state.zoom,
      cameraMode: state.cameraMode,
      cameraDollyZ,
      perspectivePx,
      viewportWidth: viewportSize?.width || 1440,
          viewportHeight: viewportSize?.height || 900,
        }),
      }
    : null;

  const selectedLowerDimensionAnchors = dimensionCornerModeActive && lowerRun[selectedLowerIndex]
    ? getLowerBoxDimensionAnchors(lowerRun[selectedLowerIndex], floorY, pxPerInch)
        .map((anchor) => {
          const projected = projectWorldPointToViewport({
            x: anchor.worldX,
            y: anchor.worldY,
            z: anchor.worldZ,
            orbitDeg: state.orbit,
            tiltDeg: state.tilt,
            panX: state.panX,
            panY: state.panY,
            zoom: state.zoom,
            cameraMode: state.cameraMode,
            cameraDollyZ,
            perspectivePx,
            viewportWidth: viewportSize?.width || 1440,
            viewportHeight: viewportSize?.height || 900,
          });
          return {
            ...anchor,
            screenX: projected.x,
            screenY: projected.y,
            screenDepth: projected.depth,
          };
        })
        .sort((a, b) => Number(a.screenDepth ?? 0) - Number(b.screenDepth ?? 0))
    : [];

  const handleDimensionAnchorClick = (event, anchor) => {
    if (!dimensionCornerModeActive || !anchor) return;
    event.stopPropagation();

    if (!pendingDimensionSeed) {
      setPendingDimensionSeed({
        anchorId: anchor.id,
        startWorld: { x: anchor.worldX, y: anchor.worldY, z: anchor.worldZ },
        startScreen: { x: anchor.screenX, y: anchor.screenY },
      });
      return;
    }

    if (pendingDimensionSeed.anchorId === anchor.id) {
      setPendingDimensionSeed(null);
      setDimensionDraft(null);
      return;
    }

    const dx = Number(anchor.worldX ?? 0) - Number(pendingDimensionSeed.startWorld?.x ?? 0);
    const dy = Number(anchor.worldY ?? 0) - Number(pendingDimensionSeed.startWorld?.y ?? 0);
    const dz = Number(anchor.worldZ ?? 0) - Number(pendingDimensionSeed.startWorld?.z ?? 0);
    const lengthIn = Math.sqrt(dx * dx + dy * dy + dz * dz) / pxPerInch;

    if (lengthIn >= 0.125) {
      onAddShopDrawingDimension?.({
        kind: "manual",
        text: formatArchitecturalInches(lengthIn),
        startWorld: pendingDimensionSeed.startWorld,
        endWorld: { x: anchor.worldX, y: anchor.worldY, z: anchor.worldZ },
        offsetPx: 28,
      });
    }

    setPendingDimensionSeed(null);
    setDimensionDraft(null);
  };

  useEffect(() => {
    if (!shopDrawingMode || !shopDrawingDimensionMode || selectedElement !== "lower") {
      setPendingDimensionSeed(null);
      setDimensionDraft(null);
    }
  }, [shopDrawingMode, shopDrawingDimensionMode, selectedElement]);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onDragStart={(event) => event.preventDefault()}
      onMouseDown={onViewportMouseDown}
      onMouseMove={onViewportMouseMove}
      onMouseUp={onViewportMouseUp}
      onMouseLeave={onViewportMouseUp}
      onWheel={onViewportWheel}
      style={{ overscrollBehavior: "contain", background: "var(--viewport-bg)" }}
    >
      {false && (
        <div
          className="absolute inset-0 z-[80]"
          style={{ cursor: "copy" }}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            const rect = event.currentTarget.getBoundingClientRect();
            const xRatio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5;
            const yRatio = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5;
            const anchorWorld = resolveShopDrawingWorldAnchor(event.clientX, event.clientY);
            const viewportMidX = (viewportSize?.width || 1440) / 2;
            const viewportMidY = (viewportSize?.height || 900) / 2;
            onAddShopDrawingNote?.({
              xRatio,
              yRatio,
              anchorWorld,
              labelOffsetX: event.clientX < viewportMidX ? 56 : -56,
              labelOffsetY: event.clientY < viewportMidY ? -36 : 36,
            });
          }}
        />
      )}

      {shopDrawingMode && projectedShopDrawingNotes.length > 0 && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {projectedShopDrawingNotes.map((note) => {
            const vectorX = (note.labelX ?? 0) - (note.projected?.x ?? 0);
            const vectorY = (note.labelY ?? 0) - (note.projected?.y ?? 0);
            const vectorLength = Math.max(1, Math.hypot(vectorX, vectorY));
            const unitX = vectorX / vectorLength;
            const unitY = vectorY / vectorLength;
            const leaderLength = Math.max(24, vectorLength - 10);
            const lineAngle = Math.atan2(unitY, unitX) * 180 / Math.PI;
            const labelOffsetX = vectorX;
            const labelOffsetY = vectorY;
            return (
              <div
                key={note.id}
                className="absolute"
                style={{
                  left: `${note.projected.x}px`,
                  top: `${note.projected.y}px`,
                  width: "0px",
                  height: "0px",
                }}
              >
                <div
                  className="absolute h-2.5 w-2.5 rounded-full"
                  style={{
                    left: 0,
                    top: 0,
                    transform: "translate(-50%, -50%)",
                    background: "#ef4444",
                    boxShadow: "0 0 0 2px rgba(255,255,255,0.92)",
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    left: 0,
                    top: 0,
                    width: `${leaderLength}px`,
                    height: "2px",
                    background: "#ef4444",
                    transformOrigin: "0 50%",
                    transform: `translateY(-50%) rotate(${lineAngle}deg)`,
                  }}
                />
                <div
                  className="absolute rounded-2xl border px-3 py-2 text-sm font-medium whitespace-nowrap"
                  style={{
                    left: `${labelOffsetX}px`,
                    top: `${labelOffsetY}px`,
                    transform: unitX < 0 ? "translate(-100%, -50%)" : "translate(0, -50%)",
                    borderColor: "rgba(239,68,68,0.28)",
                    background: "rgba(255,255,255,0.96)",
                    color: "#111827",
                    boxShadow: "0 12px 24px rgba(15,23,42,0.12)",
                  }}
                >
                  {note.text}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {shopDrawingMode && projectedShopDrawingDimensions.length > 0 && (
        <div className="absolute inset-0 z-[70] pointer-events-none">
          <svg className="absolute inset-0 overflow-visible" width="100%" height="100%">
            {projectedShopDrawingDimensions.map((dimension) => {
              const geometry = dimension.geometry;
              if (!geometry) return null;
              const tickLength = dimension.kind === "auto-total" ? 12 : 10;
              const ticks = renderDimensionTicks(geometry.offsetStart, geometry.offsetEnd, tickLength);
              return (
                <g key={dimension.id}>
                  <line x1={dimension.startProjected.x} y1={dimension.startProjected.y} x2={geometry.offsetStart.x} y2={geometry.offsetStart.y} stroke="rgba(17,24,39,0.78)" strokeWidth="1.1" />
                  <line x1={dimension.endProjected.x} y1={dimension.endProjected.y} x2={geometry.offsetEnd.x} y2={geometry.offsetEnd.y} stroke="rgba(17,24,39,0.78)" strokeWidth="1.1" />
                  <line x1={geometry.offsetStart.x} y1={geometry.offsetStart.y} x2={geometry.offsetEnd.x} y2={geometry.offsetEnd.y} stroke="rgba(17,24,39,0.94)" strokeWidth="1.2" />
                  <line x1={ticks.startA.x} y1={ticks.startA.y} x2={ticks.startB.x} y2={ticks.startB.y} stroke="rgba(17,24,39,0.94)" strokeWidth="1.2" />
                  <line x1={ticks.endA.x} y1={ticks.endA.y} x2={ticks.endB.x} y2={ticks.endB.y} stroke="rgba(17,24,39,0.94)" strokeWidth="1.2" />
                </g>
              );
            })}
          </svg>
          {projectedShopDrawingDimensions.map((dimension) => {
            const geometry = dimension.geometry;
            if (!geometry) return null;
            return (
              <div
                key={`${dimension.id}-label`}
                className="absolute border px-2 py-1 text-[11px] font-semibold whitespace-nowrap"
                style={{
                  left: `${geometry.labelX}px`,
                  top: `${geometry.labelY}px`,
                  transform: "translate(-50%, -50%)",
                  borderColor: "rgba(17,24,39,0.22)",
                  background: "rgba(255,255,255,0.98)",
                  color: "#111827",
                  boxShadow: "0 6px 14px rgba(15,23,42,0.08)",
                }}
              >
                {dimension.text}
              </div>
            );
          })}
        </div>
      )}

      {shopDrawingMode && shopDrawingEraseMode && projectedShopDrawingDimensions.some((dimension) => dimension.kind === "manual") && (
        <div className="absolute inset-0 z-[71] pointer-events-none">
          <svg className="absolute inset-0 overflow-visible" width="100%" height="100%">
            {projectedShopDrawingDimensions.map((dimension) => {
              if (dimension.kind !== "manual") return null;
              const geometry = dimension.geometry;
              if (!geometry) return null;
              return (
                <line
                  key={`${dimension.id}-erase-line`}
                  x1={geometry.offsetStart.x}
                  y1={geometry.offsetStart.y}
                  x2={geometry.offsetEnd.x}
                  y2={geometry.offsetEnd.y}
                  stroke="rgba(239,68,68,0.001)"
                  strokeWidth="24"
                  style={{ pointerEvents: "stroke", cursor: "pointer" }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveShopDrawingDimension?.(dimension.id);
                  }}
                />
              );
            })}
          </svg>
          {projectedShopDrawingDimensions.map((dimension) => {
            if (dimension.kind !== "manual") return null;
            const geometry = dimension.geometry;
            if (!geometry) return null;
            return (
              <button
                key={`${dimension.id}-erase-label`}
                type="button"
                className="absolute border px-2 py-1 text-[11px] font-semibold whitespace-nowrap"
                style={{
                  left: `${geometry.labelX}px`,
                  top: `${geometry.labelY}px`,
                  transform: "translate(-50%, -50%)",
                  borderColor: "rgba(239,68,68,0.28)",
                  background: "rgba(255,255,255,0.98)",
                  color: "#b91c1c",
                  boxShadow: "0 6px 14px rgba(15,23,42,0.08)",
                  pointerEvents: "auto",
                  cursor: "pointer",
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onRemoveShopDrawingDimension?.(dimension.id);
                }}
              >
                {dimension.text} ×
              </button>
            );
          })}
        </div>
      )}

      {dimensionCornerModeActive && selectedLowerDimensionAnchors.length > 0 && (
        <div className="absolute inset-0 z-[65]" style={{ pointerEvents: "none" }}>
          {selectedLowerDimensionAnchors.map((anchor) => {
            const isPending = pendingDimensionSeed?.anchorId === anchor.id;
            return (
              <button
                key={anchor.id}
                type="button"
                className="absolute rounded-full"
                style={{
                  left: `${anchor.screenX}px`,
                  top: `${anchor.screenY}px`,
                  width: isPending ? "16px" : "12px",
                  height: isPending ? "16px" : "12px",
                  transform: "translate(-50%, -50%)",
                  background: isPending ? "#111827" : "rgba(255,255,255,0.96)",
                  border: isPending ? "2px solid rgba(255,255,255,0.96)" : "2px solid rgba(17,24,39,0.82)",
                  boxShadow: "0 6px 16px rgba(15,23,42,0.18)",
                  cursor: "crosshair",
                  pointerEvents: "auto",
                  zIndex: isPending ? 3 : 2,
                }}
                onClick={(event) => handleDimensionAnchorClick(event, anchor)}
              />
            );
          })}
          {pendingDimensionSeed && (
            <div
              className="absolute rounded-full border px-3 py-1 text-[11px] font-semibold whitespace-nowrap"
              style={{
                left: `${pendingDimensionSeed.startScreen.x + 16}px`,
                top: `${pendingDimensionSeed.startScreen.y - 18}px`,
                borderColor: "rgba(17,24,39,0.18)",
                background: "rgba(255,255,255,0.98)",
                color: "#111827",
                boxShadow: "0 6px 14px rgba(15,23,42,0.08)",
                pointerEvents: "none",
                transform: "translate(0, -50%)",
              }}
            >
              Pick second corner
            </div>
          )}
        </div>
      )}

      <div className="absolute inset-0" style={{ perspective: perspectiveValue, perspectiveOrigin: "50% 34%" }}>
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transformStyle: "preserve-3d",
            transform: stageTransform,
          }}
        >
          <div
            className="absolute rounded-[18px] border"
            style={{
              width: `${roomWidthPx}px`,
              height: `${roomDepthPx}px`,
              left: `${-roomWidthPx / 2}px`,
              top: `${-roomDepthPx / 2}px`,
              transformStyle: "preserve-3d",
              transform: `translate3d(0px, ${floorY}px, 0px) rotateX(90deg)`,
              background: transformToolGridActive
                ? `repeating-linear-gradient(to right, var(--move-grid-major) 0px, var(--move-grid-major) 2px, transparent 2px, transparent 120px), repeating-linear-gradient(to bottom, var(--move-grid-major) 0px, var(--move-grid-major) 2px, transparent 2px, transparent 120px), repeating-linear-gradient(to right, var(--move-grid-minor) 0px, var(--move-grid-minor) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(to bottom, var(--move-grid-minor) 0px, var(--move-grid-minor) 1px, transparent 1px, transparent 10px), var(--plane-floor)`
                : "var(--plane-floor)",
              borderColor: transformToolGridActive ? "var(--move-grid-border)" : "var(--plane-floor-border)",
              boxShadow: transformToolGridActive ? "inset 0 0 0 1px var(--move-grid-minor), inset 0 1px 0 rgba(255,255,255,0.12)" : "inset 0 1px 0 rgba(255,255,255,0.12)",
              pointerEvents: "none",
            }}
          />

          <MoveSnapPreviewOverlay
            moveToolActive={transformToolGridActive}
            moveSnapPreview={moveSnapPreview}
            floorY={floorY}
            roomDepthPx={roomDepthPx}
          />

          <div
            className="absolute rounded-[18px] border"
            style={{
              width: `${roomWidthPx}px`,
              height: `${roomHeightPx}px`,
              left: `${-roomWidthPx / 2}px`,
              top: `${-roomHeightPx}px`,
              transformStyle: "preserve-3d",
              transform: `translate3d(0px, ${floorY}px, ${roomDepthPx / 2}px)`,
              background: "var(--plane-back)",
              borderColor: "var(--plane-back-border)",
              opacity: frontWallOpacity,
              pointerEvents: "none",
            }}
          />

          <div
            className="absolute rounded-[18px] border"
            style={{
              width: `${roomWidthPx}px`,
              height: `${roomHeightPx}px`,
              left: `${-roomWidthPx / 2}px`,
              top: `${-roomHeightPx}px`,
              transformStyle: "preserve-3d",
              transform: `translate3d(0px, ${floorY}px, ${-roomDepthPx / 2}px)`,
              background: "var(--plane-back)",
              borderColor: "var(--plane-back-border)",
              opacity: backWallOpacity,
              pointerEvents: "none",
            }}
          />

          <div
            className="absolute rounded-[18px] border"
            style={{
              width: `${roomDepthPx}px`,
              height: `${roomHeightPx}px`,
              left: `${-roomDepthPx / 2}px`,
              top: `${-roomHeightPx}px`,
              transformStyle: "preserve-3d",
              transform: `translate3d(${-roomWidthPx / 2}px, ${floorY}px, 0px) rotateY(90deg)`,
              background: "var(--plane-side)",
              borderColor: "var(--plane-side-border)",
              opacity: leftWallOpacity,
              pointerEvents: "none",
            }}
          />

          <div
            className="absolute rounded-[18px] border"
            style={{
              width: `${roomDepthPx}px`,
              height: `${roomHeightPx}px`,
              left: `${-roomDepthPx / 2}px`,
              top: `${-roomHeightPx}px`,
              transformStyle: "preserve-3d",
              transform: `translate3d(${roomWidthPx / 2}px, ${floorY}px, 0px) rotateY(90deg)`,
              background: "var(--plane-side)",
              borderColor: "var(--plane-side-border)",
              opacity: rightWallOpacity,
              pointerEvents: "none",
            }}
          />

          {lowerRun.map((box, index) => {
            const kickEnabled = box.kickEnabled ?? state.sectionDefaults?.kickEnabled ?? true;
            const aboveFloorPx = kickEnabled ? 0 : Math.max(0, Number(box.aboveFloor ?? state.sectionDefaults?.aboveFloor ?? 0) * pxPerInch);
            const finishedHeightPx = box.heightPx;
            const visibleBoxHeightPx = Math.max(0, finishedHeightPx - aboveFloorPx);
            const lowerY = floorY - finishedHeightPx / 2 - aboveFloorPx / 2;
            const lowerZ = box.renderZ;
            const isSelected = selectedElement === "lower" && selectedLowerIndices.includes(index);
            const isSnapTarget = snapTargetIndexSet.has(index);
            const toeKickHeightPx = kickEnabled ? Math.max(0, Number(box.toeKickHeight ?? state.sectionDefaults?.toeKickHeight ?? state.toeKickHeight ?? 3) * pxPerInch) : 0;
            const toeKickSetbackPx = kickEnabled ? clamp(Number(box.toeKickDepth ?? state.sectionDefaults?.toeKickDepth ?? 3) * pxPerInch, 0, Math.max(0, box.depthPx - 2)) : 0;
            const toeKickPanelDepthPx = Math.max(0, box.depthPx - toeKickSetbackPx);
            const toeKickZ = -(toeKickSetbackPx / 2);
            const fillerThicknessPx = clamp(Number(box.fillerThickness ?? 0.75) * pxPerInch, 4, 20);
            const fillerUsesDoorPlane = (box.fillerFlushTarget ?? "box") === "door";
            const fillerDoorMount = box.doorMount ?? "overlay";
            const fillerDoorInsetPx = clamp((Number(box.doorInsetDepth ?? 0) || 0) * pxPerInch, 0, 7.5);
            const fillerDoorFrontPlanePx = fillerDoorMount === "inset"
              ? box.depthPx / 2 - fillerDoorInsetPx
              : box.depthPx / 2 + 7.5 + (fillerDoorMount === "full-overlay" ? 1.5 : 0.75);
            const fillerFrontPlanePx = fillerUsesDoorPlane ? fillerDoorFrontPlanePx : box.depthPx / 2;
            const fillerIsSide = box.type === "filler-panel" && (box.fillerView ?? "front") === "side";
            const hitboxWidthPx = box.type === "filler-panel"
              ? (fillerIsSide ? Math.max(24, fillerThicknessPx + 12) : Math.max(24, box.widthPx + 12))
              : box.widthPx;
            const hitboxHeightPx = box.type === "filler-panel" ? Math.max(36, visibleBoxHeightPx) : visibleBoxHeightPx;
            const noteFrontHitboxWidthPx = box.type === "filler-panel"
              ? Math.max(hitboxWidthPx + 14, 38)
              : Math.max(hitboxWidthPx + 20, 44);
            const noteFrontHitboxHeightPx = Math.max(hitboxHeightPx + 20, 44);
            const hitboxOffsetXPx = box.type === "filler-panel" && fillerIsSide
              ? ((box.fillerPlacement ?? "left") === "right"
                  ? box.widthPx / 2 - hitboxWidthPx / 2
                  : -box.widthPx / 2 + hitboxWidthPx / 2)
              : 0;
            const hitboxZPx = box.type === "filler-panel"
              ? fillerFrontPlanePx + 10
              : box.depthPx / 2 + 2;
            const rotateTopHitboxWidthPx = Math.max(24, box.widthPx);
            const rotateTopHitboxDepthPx = Math.max(24, box.depthPx);
            const rotateTopHitboxY = -visibleBoxHeightPx / 2 - 2;
            const moveTopHitboxWidthPx = Math.max(24, box.widthPx);
            const moveTopHitboxDepthPx = Math.max(24, box.depthPx);
            const moveTopHitboxY = -visibleBoxHeightPx / 2 - 2;
            const showRotationIndicator = rotateToolActive && isSelected;
            const rotationIndicatorY = rotateTopHitboxY - 34;
            const rotationIndicatorZ = box.depthPx / 2 + 26;

            return (
              <div
                key={`lower-${index}`}
                className="absolute left-1/2 top-1/2"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `translate3d(${box.renderX}px, ${lowerY}px, ${lowerZ}px) rotateY(${box.renderRotationDeg}deg)`,
                }}
              >
                <div
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: `${false ? noteFrontHitboxWidthPx : hitboxWidthPx}px`,
                    height: `${false ? noteFrontHitboxHeightPx : hitboxHeightPx}px`,
                    transform: `translate(-50%, -50%) translate3d(${hitboxOffsetXPx}px, 0px, ${false ? hitboxZPx + 10 : hitboxZPx}px)`,
                    cursor: moveToolActive ? "grab" : rotateToolActive ? "ew-resize" : "pointer",
                    background: isSnapTarget ? "rgba(239,68,68,0.10)" : isSelected ? "rgba(47,78,161,0.12)" : "rgba(59,130,246,0.04)",
                    border: isSnapTarget ? "2px solid rgba(239,68,68,0.9)" : isSelected ? "2px solid rgba(47,78,161,0.82)" : "1px solid rgba(59,130,246,0.18)",
                    boxShadow: isSnapTarget ? "0 0 0 2px rgba(239,68,68,0.16), 0 10px 24px rgba(239,68,68,0.14)" : isSelected ? "0 0 0 2px rgba(47,78,161,0.14), 0 10px 24px rgba(47,78,161,0.14)" : "0 6px 16px rgba(15,23,42,0.06)",
                    zIndex: 30,
                    pointerEvents: shopDrawingMode ? "none" : (rotateToolActive ? "none" : (isSelected && !transformToolGridActive ? "none" : "auto")),
                  }}
                  onClick={(event) => {
                    if (false) {
                      event.stopPropagation();
                      const anchor = resolveLowerFaceAnchorFromClick({
                        box,
                        face: "front",
                        clientX: event.clientX,
                        clientY: event.clientY,
                        lowerY,
                        orbitDeg: state.orbit,
                        tiltDeg: state.tilt,
                        panX: state.panX,
                        panY: state.panY,
                        zoom: state.zoom,
      cameraMode: state.cameraMode,
      cameraDollyZ,
      perspectivePx,
      viewportWidth: viewportSize?.width || 1440,
                        viewportHeight: viewportSize?.height || 900,
                      });
                      onAddShopDrawingNote?.({
                        targetType: "lower",
                        targetIndex: index,
                        face: "front",
                        localX: anchor.localX,
                        localY: anchor.localY,
                        localZ: anchor.localZ,
                      });
                      return;
                    }
                    onSelectLower(index, { toggle: event.metaKey || event.ctrlKey });
                  }}
                  onMouseDown={(event) => {
                    if (event.metaKey || event.ctrlKey) return;
                    if (moveToolActive || rotateToolActive) {
                      event.preventDefault();
                    }
                    if (moveToolActive) {
                      event.stopPropagation();
                      onStartMoveLower?.(index, event);
                    }
                  }}
                  onMouseEnter={() => {
                    setHoveredElement("lower");
                    setHoveredLowerIndex(index);
                  }}
                  onMouseLeave={() => {
                    setHoveredElement(null);
                    setHoveredLowerIndex(null);
                  }}
                />
                {moveToolActive && !shopDrawingMode && (
                  <div
                    className="absolute"
                    style={{
                      left: "50%",
                      top: "50%",
                      width: `${moveTopHitboxWidthPx}px`,
                      height: `${moveTopHitboxDepthPx}px`,
                      transform: `translate(-50%, -50%) translate3d(0px, ${moveTopHitboxY}px, 0px) rotateX(90deg)`,
                      cursor: "grab",
                      background: "rgba(37,99,235,0.08)",
                      border: "1.5px dashed rgba(37,99,235,0.55)",
                      boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset",
                      zIndex: 31,
                      pointerEvents: "auto",
                    }}
                    onClick={(event) => onSelectLower(index, { toggle: event.metaKey || event.ctrlKey })}
                    onMouseDown={(event) => {
                      if (event.metaKey || event.ctrlKey) return;
                      event.preventDefault();
                      event.stopPropagation();
                      onStartMoveLower?.(index, event);
                    }}
                    onMouseEnter={() => {
                      setHoveredElement("lower");
                      setHoveredLowerIndex(index);
                    }}
                    onMouseLeave={() => {
                      setHoveredElement(null);
                      setHoveredLowerIndex(null);
                    }}
                  />
                )}
                {rotateToolActive && !shopDrawingMode && (
                  <div
                    className="absolute"
                    style={{
                      left: "50%",
                      top: "50%",
                      width: `${rotateTopHitboxWidthPx}px`,
                      height: `${rotateTopHitboxDepthPx}px`,
                      transform: `translate(-50%, -50%) translate3d(0px, ${rotateTopHitboxY}px, 0px) rotateX(90deg)`,
                      cursor: "ew-resize",
                      background: "rgba(245,158,11,0.08)",
                      border: "1.5px dashed rgba(245,158,11,0.60)",
                      boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset",
                      zIndex: 32,
                      pointerEvents: "auto",
                    }}
                    onClick={(event) => onSelectLower(index, { toggle: event.metaKey || event.ctrlKey })}
                    onMouseDown={(event) => {
                      if (event.metaKey || event.ctrlKey) return;
                      event.preventDefault();
                      event.stopPropagation();
                      onStartRotateLower?.(index, event);
                    }}
                    onMouseEnter={() => {
                      setHoveredElement("lower");
                      setHoveredLowerIndex(index);
                    }}
                    onMouseLeave={() => {
                      setHoveredElement(null);
                      setHoveredLowerIndex(null);
                    }}
                  />
                )}
                {pushPullToolActive && !shopDrawingMode && isSelected && (
                  <>
                    {["left", "right", "front", "back"].map((face) => {
                      const isSide = face === "left" || face === "right";
                      const offsetX = face === "left" ? -box.widthPx / 2 - 8 : face === "right" ? box.widthPx / 2 + 8 : 0;
                      const offsetZ = face === "front" ? box.depthPx / 2 + 8 : face === "back" ? -box.depthPx / 2 - 8 : 0;
                      const handleWidth = isSide ? Math.max(18, box.depthPx * 0.45) : Math.max(18, box.widthPx * 0.45);
                      const handleHeight = Math.max(18, visibleBoxHeightPx * 0.4);
                      return (
                        <div
                          key={`pushpull-${index}-${face}`}
                          className="absolute"
                          style={{
                            left: "50%",
                            top: "50%",
                            width: `${handleWidth}px`,
                            height: `${handleHeight}px`,
                            transform: `translate(-50%, -50%) translate3d(${offsetX}px, 0px, ${offsetZ}px)${isSide ? " rotateY(90deg)" : ""}`,
                            cursor: isSide ? "ew-resize" : "ns-resize",
                            background: "rgba(16,185,129,0.08)",
                            border: "1.5px dashed rgba(16,185,129,0.65)",
                            boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset",
                            zIndex: 34,
                            pointerEvents: "auto",
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onMouseEnter={() => {
                            setHoveredElement("lower");
                            setHoveredLowerIndex(index);
                          }}
                          onMouseLeave={() => {
                            setHoveredElement(null);
                            setHoveredLowerIndex(null);
                          }}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onStartPushPullLower?.(index, face, event);
                          }}
                        />
                      );
                    })}
                    {pushPullDraft?.active && pushPullDraft.index === index && pushPullDraft.draft && (
                      (() => {
                        const draft = pushPullDraft.draft;
                        const widthText = formatArchitecturalInches(draft.width);
                        const depthText = formatArchitecturalInches(draft.depth);
                        return (
                          <>
                            <div
                              className="absolute rounded-full border px-2 py-1 text-[11px] font-semibold whitespace-nowrap"
                              style={{
                                left: "50%",
                                top: "50%",
                                transform: `translate(-50%, -50%) translate3d(0px, ${-visibleBoxHeightPx / 2 - 28}px, 0px)`,
                                borderColor: "rgba(17,24,39,0.18)",
                                background: "rgba(255,255,255,0.98)",
                                color: "#111827",
                                boxShadow: "0 6px 14px rgba(15,23,42,0.08)",
                                zIndex: 36,
                                pointerEvents: "none",
                              }}
                            >
                              W {widthText} · D {depthText}
                            </div>
                            <div
                              className="absolute rounded-full border px-2 py-1 text-[11px] font-semibold whitespace-nowrap"
                              style={{
                                left: "50%",
                                top: "50%",
                                transform: `translate(-50%, -50%) translate3d(0px, ${visibleBoxHeightPx / 2 + 28}px, ${box.depthPx / 2 + 6}px)`,
                                borderColor: "rgba(17,24,39,0.18)",
                                background: "rgba(255,255,255,0.98)",
                                color: "#111827",
                                boxShadow: "0 6px 14px rgba(15,23,42,0.08)",
                                zIndex: 36,
                                pointerEvents: "none",
                              }}
                            >
                              {pushPullDraft.face === "left" || pushPullDraft.face === "right" ? `Width ${widthText}` : `Depth ${depthText}`}
                            </div>
                          </>
                        );
                      })()
                    )}
                  </>
                )}
                {showRotationIndicator && (
                  <RotationIndicatorBadge
                    angleDeg={box.renderRotationDeg}
                    widthPx={46}
                    yPx={rotationIndicatorY}
                    zPx={rotationIndicatorZ}
                  />
                )}
                {false && notePrimaryVerticalFace === "front" && (
                  <div
                    className="absolute"
                    style={{
                      left: "50%",
                      top: "50%",
                      width: `${noteFrontHitboxWidthPx}px`,
                      height: `${noteFrontHitboxHeightPx}px`,
                      transform: `translate(-50%, -50%) translate3d(${hitboxOffsetXPx}px, 0px, ${hitboxZPx + 10}px)`,
                      cursor: "copy",
                      background: "rgba(239,68,68,0.04)",
                      border: "1.5px dashed rgba(239,68,68,0.35)",
                      boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset",
                      zIndex: 33,
                      pointerEvents: "auto",
                    }}
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      const rect = event.currentTarget.getBoundingClientRect();
                      const xRatio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5;
                      const yRatio = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5;
                      const anchor = resolveClosedLowerFrontNoteAnchor(box, xRatio, yRatio);
                      onAddShopDrawingNote?.({
                        targetType: "lower",
                        targetIndex: index,
                        face: "front",
                        localX: anchor.localX,
                        localY: anchor.localY,
                        localZ: anchor.localZ,
                      });
                    }}
                    onMouseEnter={() => {
                      setHoveredElement("lower");
                      setHoveredLowerIndex(index);
                    }}
                    onMouseLeave={() => {
                      setHoveredElement(null);
                      setHoveredLowerIndex(null);
                    }}
                  />
                )}
                {false && notePrimaryVerticalFace === "back" && (
                  <div
                    className="absolute"
                    style={{
                      left: "50%",
                      top: "50%",
                      width: `${noteFrontHitboxWidthPx}px`,
                      height: `${noteFrontHitboxHeightPx}px`,
                      transform: `translate(-50%, -50%) translate3d(0px, 0px, ${-box.depthPx / 2 - 10}px)`,
                      cursor: "copy",
                      background: "rgba(239,68,68,0.04)",
                      border: "1.5px dashed rgba(239,68,68,0.35)",
                      boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset",
                      zIndex: 33,
                      pointerEvents: "auto",
                    }}
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      const anchor = resolveLowerFaceAnchorFromClick({
                        box,
                        face: "back",
                        clientX: event.clientX,
                        clientY: event.clientY,
                        lowerY,
                        orbitDeg: state.orbit,
                        tiltDeg: state.tilt,
                        panX: state.panX,
                        panY: state.panY,
                        zoom: state.zoom,
      cameraMode: state.cameraMode,
      cameraDollyZ,
      perspectivePx,
      viewportWidth: viewportSize?.width || 1440,
                        viewportHeight: viewportSize?.height || 900,
                      });
                      onAddShopDrawingNote?.({
                        targetType: "lower",
                        targetIndex: index,
                        face: "back",
                        localX: anchor.localX,
                        localY: anchor.localY,
                        localZ: anchor.localZ,
                      });
                    }}
                    onMouseEnter={() => {
                      setHoveredElement("lower");
                      setHoveredLowerIndex(index);
                    }}
                    onMouseLeave={() => {
                      setHoveredElement(null);
                      setHoveredLowerIndex(null);
                    }}
                  />
                )}
                {false && (notePrimaryVerticalFace === "left" || notePrimaryVerticalFace === "right") && (
                  <div
                    className="absolute"
                    style={{
                      left: "50%",
                      top: "50%",
                      width: `${Math.max(32, box.depthPx + 12)}px`,
                      height: `${noteFrontHitboxHeightPx}px`,
                      transform: `translate(-50%, -50%) translate3d(${notePrimaryVerticalFace === "right" ? box.widthPx / 2 + 10 : -box.widthPx / 2 - 10}px, 0px, 0px) rotateY(90deg)`,
                      cursor: "copy",
                      background: "rgba(239,68,68,0.04)",
                      border: "1.5px dashed rgba(239,68,68,0.35)",
                      boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset",
                      zIndex: 33,
                      pointerEvents: "auto",
                    }}
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      const anchor = resolveLowerFaceAnchorFromClick({
                        box,
                        face: notePrimaryVerticalFace,
                        clientX: event.clientX,
                        clientY: event.clientY,
                        lowerY,
                        orbitDeg: state.orbit,
                        tiltDeg: state.tilt,
                        panX: state.panX,
                        panY: state.panY,
                        zoom: state.zoom,
      cameraMode: state.cameraMode,
      cameraDollyZ,
      perspectivePx,
      viewportWidth: viewportSize?.width || 1440,
                        viewportHeight: viewportSize?.height || 900,
                      });
                      onAddShopDrawingNote?.({
                        targetType: "lower",
                        targetIndex: index,
                        face: notePrimaryVerticalFace,
                        localX: anchor.localX,
                        localY: anchor.localY,
                        localZ: anchor.localZ,
                      });
                    }}
                    onMouseEnter={() => {
                      setHoveredElement("lower");
                      setHoveredLowerIndex(index);
                    }}
                    onMouseLeave={() => {
                      setHoveredElement(null);
                      setHoveredLowerIndex(null);
                    }}
                  />
                )}
                {false && notePrimaryVerticalFace === "front" && (
                <div
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: `${upperNoteFrontHitboxWidthPx}px`,
                    height: `${upperNoteFrontHitboxHeightPx}px`,
                    transform: `translate(-50%, -50%) translate3d(${upperHitboxOffsetXPx}px, 0px, ${upperHitboxZPx + 10}px)`,
                    cursor: "copy",
                    background: "rgba(239,68,68,0.04)",
                    border: "1.5px dashed rgba(239,68,68,0.35)",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset",
                    zIndex: 33,
                    pointerEvents: "auto",
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    const anchor = resolveUpperFaceAnchorFromClick({
                      box: { ...state.upper, widthPx: upperWidthPx, heightPx: upperHeightPx, depthPx: upperDepthPx },
                      face: "front",
                      clientX: event.clientX,
                      clientY: event.clientY,
                      upperY,
                      upperZ,
                      orbitDeg: state.orbit,
                      tiltDeg: state.tilt,
                      panX: state.panX,
                      panY: state.panY,
                      zoom: state.zoom,
      cameraMode: state.cameraMode,
      cameraDollyZ,
      perspectivePx,
      viewportWidth: viewportSize?.width || 1440,
                      viewportHeight: viewportSize?.height || 900,
                    });
                    onAddShopDrawingNote?.({
                      targetType: "upper",
                      targetIndex: 0,
                      face: "front",
                      localX: anchor.localX,
                      localY: anchor.localY,
                      localZ: anchor.localZ,
                    });
                  }}
                  onMouseEnter={() => setHoveredElement("upper")}
                  onMouseLeave={() => setHoveredElement(null)}
                />
              )}
              {false && notePrimaryVerticalFace === "back" && (
                <div
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: `${upperNoteFrontHitboxWidthPx}px`,
                    height: `${upperNoteFrontHitboxHeightPx}px`,
                    transform: `translate(-50%, -50%) translate3d(0px, 0px, ${-upperDepthPx / 2 - 10}px)`,
                    cursor: "copy",
                    background: "rgba(239,68,68,0.04)",
                    border: "1.5px dashed rgba(239,68,68,0.35)",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset",
                    zIndex: 33,
                    pointerEvents: "auto",
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    const anchor = resolveUpperFaceAnchorFromClick({
                      box: { ...state.upper, widthPx: upperWidthPx, heightPx: upperHeightPx, depthPx: upperDepthPx },
                      face: "back",
                      clientX: event.clientX,
                      clientY: event.clientY,
                      upperY,
                      upperZ,
                      orbitDeg: state.orbit,
                      tiltDeg: state.tilt,
                      panX: state.panX,
                      panY: state.panY,
                      zoom: state.zoom,
      cameraMode: state.cameraMode,
      cameraDollyZ,
      perspectivePx,
      viewportWidth: viewportSize?.width || 1440,
                      viewportHeight: viewportSize?.height || 900,
                    });
                    onAddShopDrawingNote?.({
                      targetType: "upper",
                      targetIndex: 0,
                      face: "back",
                      localX: anchor.localX,
                      localY: anchor.localY,
                      localZ: anchor.localZ,
                    });
                  }}
                  onMouseEnter={() => setHoveredElement("upper")}
                  onMouseLeave={() => setHoveredElement(null)}
                />
              )}
              {false && (notePrimaryVerticalFace === "left" || notePrimaryVerticalFace === "right") && (
                <div
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: `${Math.max(32, upperDepthPx + 12)}px`,
                    height: `${upperNoteFrontHitboxHeightPx}px`,
                    transform: `translate(-50%, -50%) translate3d(${notePrimaryVerticalFace === "right" ? upperWidthPx / 2 + 10 : -upperWidthPx / 2 - 10}px, 0px, 0px) rotateY(90deg)`,
                    cursor: "copy",
                    background: "rgba(239,68,68,0.04)",
                    border: "1.5px dashed rgba(239,68,68,0.35)",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset",
                    zIndex: 33,
                    pointerEvents: "auto",
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    const anchor = resolveUpperFaceAnchorFromClick({
                      box: { ...state.upper, widthPx: upperWidthPx, heightPx: upperHeightPx, depthPx: upperDepthPx },
                      face: notePrimaryVerticalFace,
                      clientX: event.clientX,
                      clientY: event.clientY,
                      upperY,
                      upperZ,
                      orbitDeg: state.orbit,
                      tiltDeg: state.tilt,
                      panX: state.panX,
                      panY: state.panY,
                      zoom: state.zoom,
      cameraMode: state.cameraMode,
      cameraDollyZ,
      perspectivePx,
      viewportWidth: viewportSize?.width || 1440,
                      viewportHeight: viewportSize?.height || 900,
                    });
                    onAddShopDrawingNote?.({
                      targetType: "upper",
                      targetIndex: 0,
                      face: notePrimaryVerticalFace,
                      localX: anchor.localX,
                      localY: anchor.localY,
                      localZ: anchor.localZ,
                    });
                  }}
                  onMouseEnter={() => setHoveredElement("upper")}
                  onMouseLeave={() => setHoveredElement(null)}
                />
              )}
              {showTopNoteHitAreas && (
                <div
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: `${Math.max(24, upperWidthPx)}px`,
                    height: `${Math.max(24, upperDepthPx)}px`,
                    transform: `translate(-50%, -50%) translate3d(0px, ${-upperHeightPx / 2 - 2}px, 0px) rotateX(90deg)`,
                    cursor: "copy",
                    background: "rgba(239,68,68,0.04)",
                    border: "1.5px dashed rgba(239,68,68,0.35)",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset",
                    zIndex: 33,
                    pointerEvents: "auto",
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    const anchor = resolveUpperFaceAnchorFromClick({
                      box: { ...state.upper, widthPx: upperWidthPx, heightPx: upperHeightPx, depthPx: upperDepthPx },
                      face: "top",
                      clientX: event.clientX,
                      clientY: event.clientY,
                      upperY,
                      upperZ,
                      orbitDeg: state.orbit,
                      tiltDeg: state.tilt,
                      panX: state.panX,
                      panY: state.panY,
                      zoom: state.zoom,
      cameraMode: state.cameraMode,
      cameraDollyZ,
      perspectivePx,
      viewportWidth: viewportSize?.width || 1440,
                      viewportHeight: viewportSize?.height || 900,
                    });
                    onAddShopDrawingNote?.({
                      targetType: "upper",
                      targetIndex: 0,
                      face: "top",
                      localX: anchor.localX,
                      localY: anchor.localY,
                      localZ: anchor.localZ,
                    });
                  }}
                  onMouseEnter={() => setHoveredElement("upper")}
                  onMouseLeave={() => setHoveredElement(null)}
                />
              )}
                {showTopNoteHitAreas && (
                  <div
                    className="absolute"
                    style={{
                      left: "50%",
                      top: "50%",
                      width: `${Math.max(24, box.widthPx)}px`,
                      height: `${Math.max(24, box.depthPx)}px`,
                      transform: `translate(-50%, -50%) translate3d(0px, ${-visibleBoxHeightPx / 2 - 2}px, 0px) rotateX(90deg)`,
                      cursor: "copy",
                      background: "rgba(239,68,68,0.04)",
                      border: "1.5px dashed rgba(239,68,68,0.35)",
                      boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset",
                      zIndex: 33,
                      pointerEvents: "auto",
                    }}
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      const anchor = resolveLowerFaceAnchorFromClick({
                        box,
                        face: "top",
                        clientX: event.clientX,
                        clientY: event.clientY,
                        lowerY,
                        orbitDeg: state.orbit,
                        tiltDeg: state.tilt,
                        panX: state.panX,
                        panY: state.panY,
                        zoom: state.zoom,
      cameraMode: state.cameraMode,
      cameraDollyZ,
      perspectivePx,
      viewportWidth: viewportSize?.width || 1440,
                        viewportHeight: viewportSize?.height || 900,
                      });
                      onAddShopDrawingNote?.({
                        targetType: "lower",
                        targetIndex: index,
                        face: "top",
                        localX: anchor.localX,
                        localY: anchor.localY,
                        localZ: anchor.localZ,
                      });
                    }}
                    onMouseEnter={() => {
                      setHoveredElement("lower");
                      setHoveredLowerIndex(index);
                    }}
                    onMouseLeave={() => {
                      setHoveredElement(null);
                      setHoveredLowerIndex(null);
                    }}
                  />
                )}
              <SingleCabinet
                  widthPx={box.widthPx}
                  bodyHeight={Math.max(20, visibleBoxHeightPx - toeKickHeightPx)}
                  toeKickHeightPx={toeKickHeightPx}
                  toeKickDepth={toeKickPanelDepthPx}
                  toeKickZ={toeKickZ}
                  cabinet={{
                    depth: box.depthPx,
                    thickness: 8,
                    toeKickHeight: toeKickHeightPx,
                    shelfCount: box.shelfCount,
                    adjustableShelves: box.adjustableShelves,
                    pinHoleSpacing: box.pinHoleSpacing ?? state.sectionDefaults.pinHoleSpacing,
                    type: box.type,
                    doorsEnabled: box.doorsEnabled,
                    doorStyle: box.doorStyle,
                    doorGap: box.doorGap,
                    doorOpen: box.doorOpen,
                    doorHand: box.doorHand,
                    doorKind: box.doorKind,
                    doorMount: box.doorMount,
                    doorInsetDepth: box.doorInsetDepth,
                    doorProfile: box.doorProfile,
                    shakerSlim: box.shakerSlim,
                    continuousSidePanel: box.continuousSidePanel,
                    fillerView: box.fillerView,
                    fillerPlacement: box.fillerPlacement,
                    fillerThickness: box.fillerThickness,
                    fillerFlushTarget: box.fillerFlushTarget,
                    drawerMode: box.drawerMode,
                    drawerCount: box.drawerCount,
                    topDrawerHeight: box.topDrawerHeight,
                    drawerOpen: box.drawerOpen,
                    drawerSlideType: box.drawerSlideType,
                    drawerSoftClose: box.drawerSoftClose,
                    drawerSideWallThickness: box.drawerSideWallThickness,
                    drawerOpenStates: box.drawerOpenStates,
                    effectiveDoorOpenAmount: box.effectiveDoorOpenAmount,
                    effectiveDrawerOpenAmount: box.effectiveDrawerOpenAmount,
                    effectiveDrawerOpenAmounts: box.effectiveDrawerOpenAmounts,
                    faceFinishType: box.faceFinishType,
                    faceFinishTone: box.faceFinishTone,
                    faceFinishSupplier: box.faceFinishSupplier,
                    faceFinishCode: box.faceFinishCode,
                    faceFinishCustomHex: box.faceFinishCustomHex,
                  }}
                  dimmed={movingPreviewIndexSet.has(index)}
                  isEquipmentGap={box.type === "equipment-gap"}
                  onToggleDoors={() => onToggleLowerDoors?.(index)}
                  onToggleDrawers={(drawerIndex) => onToggleLowerDrawers?.(index, drawerIndex)}
                  onSelectSelf={(event) => onSelectLower(index, { toggle: event.metaKey || event.ctrlKey })}
                  onHoverStart={() => {
                    setHoveredElement("lower");
                    setHoveredLowerIndex(index);
                  }}
                  onHoverEnd={() => {
                    setHoveredElement(null);
                    setHoveredLowerIndex(null);
                  }}
                  moveToolActive={shopDrawingMode ? false : moveToolActive}
                  rotateToolActive={shopDrawingMode ? false : rotateToolActive}
                  onMovePointerDown={(event) => onStartMoveLower?.(index, event)}
                  onRotatePointerDown={(event) => onStartRotateLower?.(index, event)}
                  interactionLocked={shopDrawingMode}
                />
              </div>
            );
          })}

          {moveSnapPreview.map((preview) => {
            const box = lowerRun[preview.index];
            if (!box) return null;
            const kickEnabled = box.kickEnabled ?? state.sectionDefaults?.kickEnabled ?? true;
            const aboveFloorPx = kickEnabled ? 0 : Math.max(0, Number(box.aboveFloor ?? state.sectionDefaults?.aboveFloor ?? 0) * pxPerInch);
            const finishedHeightPx = box.heightPx;
            const visibleBoxHeightPx = Math.max(0, finishedHeightPx - aboveFloorPx);
            const lowerY = floorY - finishedHeightPx / 2 - aboveFloorPx / 2;
            const toeKickHeightPx = kickEnabled ? Math.max(0, Number(box.toeKickHeight ?? state.sectionDefaults?.toeKickHeight ?? state.toeKickHeight ?? 3) * pxPerInch) : 0;
            const toeKickSetbackPx = kickEnabled ? clamp(Number(box.toeKickDepth ?? state.sectionDefaults?.toeKickDepth ?? 3) * pxPerInch, 0, Math.max(0, box.depthPx - 2)) : 0;
            const toeKickPanelDepthPx = Math.max(0, box.depthPx - toeKickSetbackPx);
            const toeKickZ = -(toeKickSetbackPx / 2);
            return (
              <div
                key={`move-ghost-${preview.index}`}
                className="absolute left-1/2 top-1/2"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `translate3d(${preview.xPx}px, ${lowerY}px, ${preview.zPx}px) rotateY(${box.renderRotationDeg}deg)`,
                  pointerEvents: "none",
                }}
              >
                <SingleCabinet
                  widthPx={box.widthPx}
                  bodyHeight={Math.max(20, visibleBoxHeightPx - toeKickHeightPx)}
                  toeKickHeightPx={toeKickHeightPx}
                  toeKickDepth={toeKickPanelDepthPx}
                  toeKickZ={toeKickZ}
                  cabinet={{
                    depth: box.depthPx,
                    thickness: 8,
                    toeKickHeight: toeKickHeightPx,
                    shelfCount: box.shelfCount,
                    adjustableShelves: box.adjustableShelves,
                    pinHoleSpacing: box.pinHoleSpacing ?? state.sectionDefaults.pinHoleSpacing,
                    type: box.type,
                    doorsEnabled: box.doorsEnabled,
                    doorStyle: box.doorStyle,
                    doorGap: box.doorGap,
                    doorOpen: box.doorOpen,
                    doorHand: box.doorHand,
                    doorKind: box.doorKind,
                    doorMount: box.doorMount,
                    doorInsetDepth: box.doorInsetDepth,
                    doorProfile: box.doorProfile,
                    shakerSlim: box.shakerSlim,
                    continuousSidePanel: box.continuousSidePanel,
                    fillerView: box.fillerView,
                    fillerPlacement: box.fillerPlacement,
                    fillerThickness: box.fillerThickness,
                    fillerFlushTarget: box.fillerFlushTarget,
                    drawerMode: box.drawerMode,
                    drawerCount: box.drawerCount,
                    topDrawerHeight: box.topDrawerHeight,
                    drawerOpen: box.drawerOpen,
                    drawerSlideType: box.drawerSlideType,
                    drawerSoftClose: box.drawerSoftClose,
                    drawerSideWallThickness: box.drawerSideWallThickness,
                    drawerOpenStates: box.drawerOpenStates,
                    effectiveDoorOpenAmount: box.effectiveDoorOpenAmount,
                    effectiveDrawerOpenAmount: box.effectiveDrawerOpenAmount,
                    effectiveDrawerOpenAmounts: box.effectiveDrawerOpenAmounts,
                    faceFinishType: box.faceFinishType,
                    faceFinishTone: box.faceFinishTone,
                    faceFinishSupplier: box.faceFinishSupplier,
                    faceFinishCode: box.faceFinishCode,
                    faceFinishCustomHex: box.faceFinishCustomHex,
                  }}
                  isMoving={true}
                  invalidPlacement={Boolean(preview.invalidPlacement)}
                  isEquipmentGap={box.type === "equipment-gap"}
                  interactionLocked={true}
                />
              </div>
            );
          })}

          {state.countertop && countertopRun.length > 0 && (
            <>
              {!shopDrawingMode && (
                <>
                  <div
                    className="absolute left-1/2 top-1/2"
                    style={{
                      width: `${countertopWidthPx + 18}px`,
                      height: `${Math.max(28, countertopHeightPx + 20)}px`,
                      transform: `translate(-50%, -50%) translate3d(${countertopX}px, ${countertopY}px, ${countertopFrontZ + 10}px)`,
                      cursor: pushPullToolActive ? "default" : "pointer",
                      background: countertopSinglePieceValid
                        ? (selectedElement === "countertop" ? "rgba(47,78,161,0.12)" : "rgba(59,130,246,0.04)")
                        : (selectedElement === "countertop" ? "rgba(220,38,38,0.12)" : "rgba(239,68,68,0.05)"),
                      border: countertopSinglePieceValid
                        ? (selectedElement === "countertop" ? "2px solid rgba(47,78,161,0.82)" : "1px solid rgba(59,130,246,0.18)")
                        : (selectedElement === "countertop" ? "2px solid rgba(220,38,38,0.88)" : "1px solid rgba(239,68,68,0.28)"),
                      boxShadow: countertopSinglePieceValid
                        ? (selectedElement === "countertop" ? "0 0 0 2px rgba(47,78,161,0.14), 0 10px 24px rgba(47,78,161,0.14)" : "0 6px 16px rgba(15,23,42,0.06)")
                        : (selectedElement === "countertop" ? "0 0 0 2px rgba(220,38,38,0.14), 0 10px 24px rgba(220,38,38,0.16)" : "0 6px 16px rgba(220,38,38,0.08)"),
                      zIndex: 30,
                      pointerEvents: "auto",
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedElement("countertop");
                    }}
                    onMouseEnter={() => setHoveredElement("countertop")}
                    onMouseLeave={() => setHoveredElement(null)}
                  />
                  <div
                    className="absolute left-1/2 top-1/2"
                    style={{
                      width: `${countertopWidthPx}px`,
                      height: `${countertopDepthPx}px`,
                      transform: `translate(-50%, -50%) translate3d(${countertopX}px, ${countertopY - countertopHeightPx / 2 - 2}px, ${countertopZ}px) rotateX(90deg)`,
                      cursor: pushPullToolActive ? "default" : "pointer",
                      background: countertopSinglePieceValid
                        ? (selectedElement === "countertop" ? "rgba(47,78,161,0.08)" : "rgba(59,130,246,0.03)")
                        : (selectedElement === "countertop" ? "rgba(220,38,38,0.08)" : "rgba(239,68,68,0.04)"),
                      border: countertopSinglePieceValid
                        ? (selectedElement === "countertop" ? "1.5px dashed rgba(47,78,161,0.55)" : "1px dashed rgba(59,130,246,0.22)")
                        : (selectedElement === "countertop" ? "1.5px dashed rgba(220,38,38,0.60)" : "1px dashed rgba(239,68,68,0.30)"),
                      boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset",
                      zIndex: 31,
                      pointerEvents: "auto",
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedElement("countertop");
                    }}
                    onMouseEnter={() => setHoveredElement("countertop")}
                    onMouseLeave={() => setHoveredElement(null)}
                  />
                </>
              )}

              {pushPullToolActive && !shopDrawingMode && selectedElement === "countertop" && (
                <>
                  {["left", "right", "front", "back"].map((face) => {
                    const isSide = face === "left" || face === "right";
                    const offsetX = face === "left" ? countertopLeftX - 8 : face === "right" ? countertopRightX + 8 : countertopX;
                    const offsetZ = face === "front" ? countertopFrontZ + 8 : face === "back" ? countertopBackZ - 8 : countertopZ;
                    const handleWidth = isSide ? Math.max(18, countertopDepthPx * 0.45) : Math.max(18, countertopWidthPx * 0.45);
                    const handleHeight = Math.max(18, countertopHeightPx + 10);
                    return (
                      <div
                        key={`countertop-pushpull-${face}`}
                        className="absolute left-1/2 top-1/2"
                        style={{
                          width: `${handleWidth}px`,
                          height: `${handleHeight}px`,
                          transform: `translate(-50%, -50%) translate3d(${offsetX}px, ${countertopY}px, ${offsetZ}px)${isSide ? " rotateY(90deg)" : ""}`,
                          cursor: isSide ? "ew-resize" : "ns-resize",
                          background: "rgba(16,185,129,0.08)",
                          border: "1.5px dashed rgba(16,185,129,0.65)",
                          boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset",
                          zIndex: 34,
                          pointerEvents: "auto",
                        }}
                        onMouseEnter={() => setHoveredElement("countertop")}
                        onMouseLeave={() => setHoveredElement(null)}
                        onMouseDown={(event) => onStartPushPullCountertop?.(face, event)}
                      />
                    );
                  })}

                  {countertopPushPullDraft?.active && countertopPushPullDraft?.draft && (
                    <>
                      <div
                        className="absolute rounded-full border px-2 py-1 text-[11px] font-semibold whitespace-nowrap"
                        style={{
                          left: "50%",
                          top: "50%",
                          transform: `translate(-50%, -50%) translate3d(${countertopX}px, ${countertopY - countertopHeightPx / 2 - 28}px, ${countertopZ}px)`,
                          borderColor: "rgba(17,24,39,0.18)",
                          background: "rgba(255,255,255,0.98)",
                          color: "#111827",
                          boxShadow: "0 6px 14px rgba(15,23,42,0.08)",
                          zIndex: 36,
                          pointerEvents: "none",
                        }}
                      >
                        L {formatArchitecturalInches(countertopPushPullDraft.draft.leftOverhang)} · R {formatArchitecturalInches(countertopPushPullDraft.draft.rightOverhang)} · F {formatArchitecturalInches(countertopPushPullDraft.draft.frontOverhang)} · B {formatArchitecturalInches(countertopPushPullDraft.draft.backOverhang)}
                      </div>
                    </>
                  )}
                </>
              )}

              <Cuboid
                x={countertopX}
                y={countertopY}
                z={countertopZ}
                width={countertopWidthPx}
                height={countertopHeightPx}
                depth={countertopDepthPx}
                color={countertopSinglePieceValid ? "#f5f5f4" : "#fee2e2"}
                edge={countertopSinglePieceValid ? "#bdb7af" : "#dc2626"}
                selected={selectedElement === "countertop"}
                selectionColor={countertopSinglePieceValid ? null : "rgba(220,38,38,0.88)"}
                dataId="countertop"
                showFrontDetail={false}
                onClick={() => setSelectedElement("countertop")}
                onMouseEnter={() => setHoveredElement("countertop")}
                onMouseLeave={() => setHoveredElement(null)}
                showTopDirectionArrow={true}
              />
            </>
          )}

          {state.uppers && (
            <div
              className="absolute left-1/2 top-1/2"
              style={{
                transformStyle: "preserve-3d",
                transform: `translate3d(0px, ${upperY}px, ${upperZ}px)`,
              }}
            >
              <div
                className="absolute"
                style={{
                  left: "50%",
                  top: "50%",
                  width: `${false ? upperNoteFrontHitboxWidthPx : upperHitboxWidthPx}px`,
                  height: `${false ? upperNoteFrontHitboxHeightPx : upperHitboxHeightPx}px`,
                  transform: `translate(-50%, -50%) translate3d(${upperHitboxOffsetXPx}px, 0px, ${false ? upperHitboxZPx + 10 : upperHitboxZPx}px)`,
                  cursor: moveToolActive ? "grab" : rotateToolActive ? "ew-resize" : "pointer",
                  background: selectedElement === "upper" ? "rgba(47,78,161,0.12)" : "rgba(59,130,246,0.04)",
                  border: selectedElement === "upper" ? "2px solid rgba(47,78,161,0.82)" : "1px solid rgba(59,130,246,0.18)",
                  boxShadow: selectedElement === "upper" ? "0 0 0 2px rgba(47,78,161,0.14), 0 10px 24px rgba(47,78,161,0.14)" : "0 6px 16px rgba(15,23,42,0.06)",
                  zIndex: 30,
                  pointerEvents: shopDrawingMode ? "none" : (selectedElement === "upper" ? "none" : "auto"),
                }}
                onClick={(event) => {
                  if (false) {
                    event.stopPropagation();
                    const rect = event.currentTarget.getBoundingClientRect();
                    const xRatio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5;
                    const yRatio = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5;
                    const anchor = resolveUpperFrontNoteAnchor({ ...state.upper, widthPx: upperWidthPx, heightPx: upperHeightPx, depthPx: upperDepthPx }, xRatio, yRatio);
                    onAddShopDrawingNote?.({
                      targetType: "upper",
                      targetIndex: 0,
                      face: "front",
                      localX: anchor.localX,
                      localY: anchor.localY,
                      localZ: anchor.localZ,
                    });
                    return;
                  }
                  setSelectedElement("upper");
                }}
                onMouseEnter={() => setHoveredElement("upper")}
                onMouseLeave={() => setHoveredElement(null)}
              />
              {showTopNoteHitAreas && (
                <div
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: `${Math.max(24, upperWidthPx)}px`,
                    height: `${Math.max(24, upperDepthPx)}px`,
                    transform: `translate(-50%, -50%) translate3d(0px, ${-upperHeightPx / 2 - 2}px, 0px) rotateX(90deg)`,
                    cursor: "copy",
                    background: "rgba(239,68,68,0.04)",
                    border: "1.5px dashed rgba(239,68,68,0.35)",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset",
                    zIndex: 33,
                    pointerEvents: "auto",
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    const rect = event.currentTarget.getBoundingClientRect();
                    const xRatio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5;
                    const zRatio = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5;
                    const snapped = snapTopFaceAnchorToCorner(
                      (xRatio - 0.5) * Math.max(24, upperWidthPx),
                      (zRatio - 0.5) * Math.max(24, upperDepthPx),
                      Math.max(24, upperWidthPx),
                      Math.max(24, upperDepthPx),
                      10,
                    );
                    onAddShopDrawingNote?.({
                      targetType: "upper",
                      targetIndex: 0,
                      face: "top",
                      localX: snapped.localX,
                      localY: -upperHeightPx / 2,
                      localZ: snapped.localZ,
                    });
                  }}
                  onMouseEnter={() => setHoveredElement("upper")}
                  onMouseLeave={() => setHoveredElement(null)}
                />
              )}
              <SingleCabinet
                widthPx={upperWidthPx}
                bodyHeight={upperHeightPx}
                toeKickHeightPx={0}
                toeKickDepth={upperDepthPx}
                toeKickZ={0}
                cabinet={{
                  depth: upperDepthPx,
                  thickness: 8,
                  toeKickHeight: 0,
                  shelfCount: state.upper.shelfCount,
                  adjustableShelves: state.upper.adjustableShelves,
                  pinHoleSpacing: state.upper.pinHoleSpacing,
                  type: state.upper.type,
                  doorsEnabled: state.upper.doorsEnabled,
                  doorStyle: state.upper.doorStyle,
                  doorGap: state.upper.doorGap,
                  doorOpen: state.upper.doorOpen,
                  doorHand: state.upper.doorHand,
                  doorKind: state.upper.doorKind,
                  doorMount: state.upper.doorMount,
                  doorInsetDepth: state.upper.doorInsetDepth,
                  doorProfile: state.upper.doorProfile,
                  shakerSlim: state.upper.shakerSlim,
                  continuousSidePanel: state.upper.continuousSidePanel,
                  fillerView: state.upper.fillerView,
                  fillerPlacement: state.upper.fillerPlacement,
                  fillerThickness: state.upper.fillerThickness,
                  fillerFlushTarget: state.upper.fillerFlushTarget,
                  drawerMode: state.upper.drawerMode,
                  drawerCount: state.upper.drawerCount,
                  topDrawerHeight: state.upper.topDrawerHeight,
                  drawerOpen: state.upper.drawerOpen,
                  drawerSlideType: state.upper.drawerSlideType,
                  drawerSoftClose: state.upper.drawerSoftClose,
                  drawerSideWallThickness: state.upper.drawerSideWallThickness,
                  drawerOpenStates: state.upper.drawerOpenStates,
                  effectiveDoorOpenAmount: state.upper.doorOpen ? 1 : 0,
                  effectiveDrawerOpenAmount: state.upper.drawerOpen ? 1 : 0,
                  effectiveDrawerOpenAmounts: Array.isArray(state.upper.drawerOpenStates) ? state.upper.drawerOpenStates.map((value) => (value ? 1 : 0)) : [0, 0, 0, 0, 0],
                  faceFinishType: state.upper.faceFinishType,
                  faceFinishTone: state.upper.faceFinishTone,
                  faceFinishSupplier: state.upper.faceFinishSupplier,
                  faceFinishCode: state.upper.faceFinishCode,
                  faceFinishCustomHex: state.upper.faceFinishCustomHex,
                }}
                isEquipmentGap={state.upper.type === "equipment-gap"}
                onToggleDoors={onToggleUpperDoors}
                onSelectSelf={() => setSelectedElement("upper")}
                onHoverStart={() => setHoveredElement("upper")}
                onHoverEnd={() => setHoveredElement(null)}
                interactionLocked={shopDrawingMode}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================================================
// App shell
// Top bar + floating tools over the full viewport.
// ==================================================
export default function CabinetKitStudioNextApp() {
  const [state, setState] = useState(() => ensureStateItemIds(JSON.parse(JSON.stringify(DEFAULTS))));
  const [toolTab, setToolTab] = useState("studio");
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedLowerIndex, setSelectedLowerIndex] = useState(0);
  const [selectedLowerIndices, setSelectedLowerIndices] = useState([]);
  const [hoveredElement, setHoveredElement] = useState(null);
  const [hoveredLowerIndex, setHoveredLowerIndex] = useState(null);
  const [showViewportHint, setShowViewportHint] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(typeof document !== "undefined" && document.fullscreenElement));
  const [activeEditorCollapsed, setActiveEditorCollapsed] = useState(false);
  const [wallToolsCollapsed, setWallToolsCollapsed] = useState(false);
  const [clustersCollapsed, setClustersCollapsed] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [uiPrefs, setUiPrefs] = useState(DEFAULT_UI_PREFS);
  const [globalsMenuOpen, setGlobalsMenuOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [layoutComingSoonOpen, setLayoutComingSoonOpen] = useState(false);
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1440,
    height: typeof window !== "undefined" ? window.innerHeight : 900,
  }));
  const [editorTab, setEditorTab] = useState("whd");
  const [quickAddCollapsed, setQuickAddCollapsed] = useState(false);
  const [moveToolActive, setMoveToolActive] = useState(false);
  const [rotateToolActive, setRotateToolActive] = useState(false);
  const [pushPullToolActive, setPushPullToolActive] = useState(false);
  const [quickSnapEnabled, setQuickSnapEnabled] = useState(true);
  const [moveSnapPreview, setMoveSnapPreview] = useState([]);
  const [clipboardLowerBoxes, setClipboardLowerBoxes] = useState([]);
  const [shopDrawingNoteMode, setShopDrawingNoteMode] = useState(false);
  const [shopDrawingDimensionMode, setShopDrawingDimensionMode] = useState(false);
  const [shopDrawingEraseMode, setShopDrawingEraseMode] = useState(false);
  const [shopDrawingAutoDimensionsEnabled, setShopDrawingAutoDimensionsEnabled] = useState(true);
  const [shopDrawingNoteText, setShopDrawingNoteText] = useState("Note callout");
  const [shopDrawingNotes, setShopDrawingNotes] = useState([]);
  const [shopDrawingDimensions, setShopDrawingDimensions] = useState([]);
  const viewportDragRef = useRef({ active: false, mode: "orbit", startX: 0, startY: 0, panX: 0, panY: 0, orbit: 0, tilt: 0 });
  const lowerMoveDragRef = useRef({ active: false, startX: 0, startY: 0, indices: [], startPositions: {}, neighborSnapReleased: false, currentNeighborSnapKey: null, snapReleaseTimer: null, lastPointerX: 0, lastPointerY: 0, previewBoxes: [], invalidPlacement: false });
  const lowerRotateDragRef = useRef({ active: false, startX: 0, indices: [], startAngles: {} });
  const lowerPushPullDragRef = useRef({ active: false, index: null, face: null, startClientX: 0, startClientY: 0, startWidth: 0, startDepth: 0, startPositionX: 0, startPositionZ: 0, startRotationDeg: 0, anchorWorldX: 0, anchorWorldZ: 0, invalidPlacement: false, previousBox: null });
  const countertopPushPullDragRef = useRef({ active: false, face: null, startClientX: 0, startClientY: 0, startSettings: null, draft: null });
  const lastInteractionRef = useRef(typeof performance !== "undefined" ? performance.now() : Date.now());
  const autoRotateFrameRef = useRef(null);
  const autoRotateLastTimeRef = useRef(null);
  const historyPastRef = useRef([]);
  const historyFutureRef = useRef([]);
  const historyInitializedRef = useRef(false);
  const isHistoryRestoreRef = useRef(false);
  const stateSnapshotRef = useRef(JSON.stringify(DEFAULTS));
  const historyCommitTimerRef = useRef(null);
  const pendingHistoryBaseRef = useRef(null);
  const pendingHistoryNextRef = useRef(null);
  const sectionDefaultsEditAuthorizedRef = useRef(false);
  const skipLowerMirrorRef = useRef(false);
  const uploadInputRef = useRef(null);
  const selectedLowerIndicesRef = useRef([]);
  const lowerSelectionChangeRef = useRef(false);

  const lowerBoxes = state.lowerBoxes?.length ? state.lowerBoxes : [state.cabinet];
  const activeData = selectedElement === "upper"
    ? state.upper
    : selectedElement === "countertop"
      ? (state.countertopItem || { type: "countertop" })
      : state.cabinet;
  const countertopSettings = getCountertopSettings(state.countertopItem || {});
  const countertopMetrics = getCountertopRunMetrics(state, 10);
  const countertopEditorWidth = countertopMetrics.widthPx / 10 + countertopSettings.leftOverhang + countertopSettings.rightOverhang;
  const countertopEditorDepth = countertopMetrics.depthPx / 10 + countertopSettings.frontOverhang + countertopSettings.backOverhang;
  const itemSchedule = useMemo(() => buildItemSchedule(state), [state]);
  const countertopPieceSize = useMemo(() => getCountertopPieceSizeIn(state), [state]);
  const countertopSinglePieceValid = isCountertopSinglePieceSizeValid(countertopPieceSize.widthIn, countertopPieceSize.depthIn);
  const itemScheduleLookup = useMemo(() => {
    return itemSchedule.reduce((acc, row) => {
      if (row.source === "lower") acc.lowerByIndex[row.sourceIndex] = row;
      if (row.source === "upper") acc.upper = row;
      if (row.source === "countertop") acc.countertop = row;
      return acc;
    }, { lowerByIndex: {}, upper: null, countertop: null });
  }, [itemSchedule]);
  const lowerSelectionCount = selectedLowerIndices.length;
  const isMultiLowerSelection = selectedElement === "lower" && lowerSelectionCount > 1;
  const interactionLocked = toolTab === "shopDrawing";

  const hoveredInfo = useMemo(() => {
    if (hoveredElement === "lower") {
      const hoveredLowerIndexSafe = hoveredLowerIndex ?? selectedLowerIndex;
      const hoveredLower = lowerBoxes[hoveredLowerIndexSafe] || state.cabinet;
      const hoveredLowerScheduleRow = itemScheduleLookup.lowerByIndex[hoveredLowerIndexSafe];
      return {
        title: `Section One · ${hoveredLowerScheduleRow?.displayLabel || (hoveredLower.type === "pony-wall" ? "Pony Wall One" : "Lower Cabinet One")}`,
        specs: [
          { label: "W", value: `${formatInches(hoveredLower.width)}”` },
          { label: "H", value: `${formatInches(hoveredLower.height)}”` },
          { label: "D", value: `${formatInches(hoveredLower.depth)}”` },
          { label: "T", value: hoveredLower.type === "equipment-gap" ? "Gap" : hoveredLower.type === "filler-panel" ? "Filler" : hoveredLower.type === "pony-wall" ? "Pony wall" : "Cabinet" },
        ],
      };
    }

    if (hoveredElement === "upper") {
      return {
        title: "Section One · Upper Cabinet One",
        specs: [
          { label: "W", value: `${formatInches(state.upper.width)}”` },
          { label: "H", value: `${formatInches(state.upper.height)}”` },
          { label: "D", value: `${formatInches(state.upper.depth)}”` },
          { label: "T", value: state.upper.type === "equipment-gap" ? "Gap" : state.upper.type === "filler-panel" ? "Filler" : "Cabinet" },
        ],
      };
    }

    if (hoveredElement === "countertop") {
      return {
        title: "Section One · Countertop",
        specs: [
          { label: "W", value: `${formatInches(countertopEditorWidth)}”` },
          { label: "D", value: `${formatInches(countertopEditorDepth)}”` },
          { label: "T", value: `${formatInches(countertopSettings.thickness)}”` },
          { label: "Mat", value: (state.countertopItem?.material ?? "solid-surface").replace(/-/g, " ") },
        ],
      };
    }

    return {
      title: "Viewport element info",
      specs: [{ label: "Hover", value: "Move over cabinet, upper, or countertop" }],
    };
  }, [hoveredElement, hoveredLowerIndex, selectedLowerIndex, lowerBoxes, state.cabinet, state.upper, countertopEditorWidth, countertopEditorDepth, countertopSettings]);

  const activeEditorInfo = useMemo(() => {
    const doorKindLabel = (kind, slim = false) => {
      if (kind === "shaker") return slim ? "Slim Shaker" : "Shaker";
      if (kind === "top-rail") return "Frame Only On Top";
      if (kind === "raised-panel") return "Raised Panel";
      if (kind === "recessed-panel") return "Recessed Panel";
      return "Flat Slab";
    };

    if (selectedElement === "lower") {
      if (isMultiLowerSelection) {
        const selectedBoxes = selectedLowerIndices.map((index) => lowerBoxes[index]).filter(Boolean);
        const totalWidth = selectedBoxes.reduce((sum, box) => sum + Number(box.width || 0), 0);
        return {
          title: `Section One · ${lowerSelectionCount} Items Selected`,
          lines: [
            `Count: ${lowerSelectionCount}`,
            `Total width: ${formatInches(totalWidth)}”`,
            `Selection mode: Multi`,
            `WHD edits apply to all selected`,
            `Rotate uses group center`,
          ],
        };
      }

      const box = lowerBoxes[selectedLowerIndex] || state.cabinet;
      const lines = [
        `W: ${formatInches(box.width)}” H: ${formatInches(box.height)}” Depth: ${formatInches(box.depth)}”`,
      ];

      if (box.type === "cabinet") {
        const resolvedDoorStyle = getResolvedDoorStyle((Number(box.width) || 0) * 10, box.doorStyle ?? "auto");
        lines.push(`Doors: ${doorKindLabel(box.doorKind, box.shakerSlim)} · ${resolvedDoorStyle === "double" ? "double" : "single"}`);
        lines.push(`Finish: ${getFaceFinishAppearance(box.faceFinishType ?? "paint", box.faceFinishTone ?? "white", {
          supplier: box.faceFinishSupplier,
          code: box.faceFinishCode,
          customHex: box.faceFinishCustomHex,
        }).label}`);
        if (box.kickEnabled ?? true) {
          lines.push(`Toe kick H: ${formatInches(box.toeKickHeight ?? 3)}” D: ${formatInches(box.toeKickDepth ?? 3)}”`);
        } else {
          lines.push(`Above floor: ${formatInches(box.aboveFloor ?? 0)}”`);
        }
        lines.push(`Shelves: ${Math.round(Number(box.shelfCount ?? 0) || 0)}`);
        lines.push(`Shelf type: ${(box.adjustableShelves ?? true) ? `Adjustable - ${formatInches(box.pinHoleSpacing ?? 1.25)}”` : "Fixed"}`);
      } else if (box.type === "filler-panel") {
        lines.push(`Type: Filler panel`);
        lines.push(`View: ${(box.fillerView ?? "front") === "side" ? "Side" : "Front"}`);
        lines.push(`Thickness: ${formatInches(box.fillerThickness ?? 0.75)}”`);
      } else if (box.type === "pony-wall") {
        lines.push(`Type: Pony wall`);
        lines.push(`Core: ${box.ponyWallCoreType === "plywood" ? "2.25” Plywood" : box.ponyWallCoreType === "2x6" ? "2x6" : "2x4"}`);
        if ((box.ponyWallCoreType ?? "2x4") !== "plywood") {
          lines.push(`Drywall: ${formatInches(box.ponyWallDrywallThickness ?? 0.5)}” · ${Number(box.ponyWallDrywallSides ?? 2) === 1 ? "1 side" : "2 sides"}`);
        }
        lines.push(`Wall thickness: ${formatInches(box.depth ?? getPonyWallDepthInches(box.ponyWallCoreType, box.ponyWallDrywallThickness, box.ponyWallDrywallSides))}”`);
      } else {
        lines.push(`Type: Equipment gap`);
      }

      return {
        title: `Section One · ${itemScheduleLookup.lowerByIndex[selectedLowerIndex]?.displayLabel || (box.type === "pony-wall" ? "Pony Wall One" : "Lower Cabinet One")}`,
        lines,
      };
    }

    if (selectedElement === "upper") {
      const box = state.upper;
      const lines = [
        `W: ${formatInches(box.width)}” H: ${formatInches(box.height)}” Depth: ${formatInches(box.depth)}”`,
      ];

      if (box.type === "cabinet") {
        const resolvedDoorStyle = getResolvedDoorStyle((Number(box.width) || 0) * 10, box.doorStyle ?? "auto");
        lines.push(`Doors: ${doorKindLabel(box.doorKind, box.shakerSlim)} · ${resolvedDoorStyle === "double" ? "double" : "single"}`);
        lines.push(`Finish: ${getFaceFinishAppearance(box.faceFinishType ?? "paint", box.faceFinishTone ?? "white", {
          supplier: box.faceFinishSupplier,
          code: box.faceFinishCode,
          customHex: box.faceFinishCustomHex,
        }).label}`);
        lines.push(`Shelves: ${Math.round(Number(box.shelfCount ?? 0) || 0)}`);
        lines.push(`Shelf type: ${(box.adjustableShelves ?? true) ? `Adjustable - ${formatInches(box.pinHoleSpacing ?? 1.25)}”` : "Fixed"}`);
      } else if (box.type === "filler-panel") {
        lines.push(`Type: Filler panel`);
        lines.push(`View: ${(box.fillerView ?? "front") === "side" ? "Side" : "Front"}`);
        lines.push(`Thickness: ${formatInches(box.fillerThickness ?? 0.75)}”`);
      } else {
        lines.push(`Type: Equipment gap`);
      }

      return {
        title: "Section One · Upper Cabinet One",
        lines,
      };
    }

    if (selectedElement === "countertop") {
      return {
        title: itemScheduleLookup.countertop?.displayLabel || "Countertop One",
        lines: [
          `W: ${formatInches(countertopEditorWidth)}” D: ${formatInches(countertopEditorDepth)}” T: ${formatInches(countertopSettings.thickness)}”`,
          `Overhangs · L ${formatInches(countertopSettings.leftOverhang)}” · R ${formatInches(countertopSettings.rightOverhang)}” · F ${formatInches(countertopSettings.frontOverhang)}” · B ${formatInches(countertopSettings.backOverhang)}”`,
          `Material: ${(state.countertopItem?.material ?? "solid-surface").replace(/-/g, " ")}`,
          `Edge: ${(state.countertopItem?.edgeProfile ?? "eased").replace(/-/g, " ")}`,
          countertopSinglePieceValid ? `Single piece max: 60” x 144”` : `Single piece max exceeded · split into multiple pieces`,
        ],
      };
    }

    return {
      title: "No selection",
      lines: ["Select an item to see its details."],
    };
  }, [selectedElement, selectedLowerIndex, selectedLowerIndices, isMultiLowerSelection, lowerSelectionCount, lowerBoxes, state.cabinet, state.upper, state.countertopItem, itemScheduleLookup, countertopEditorWidth, countertopEditorDepth, countertopSettings, countertopSinglePieceValid]);

  useEffect(() => {
    if (selectedElement === "countertop" && editorTab !== "whd") {
      setEditorTab("whd");
      return;
    }

    if ((selectedElement === "upper" || activeData.type === "pony-wall") && editorTab === "kick") {
      setEditorTab("whd");
      return;
    }

    if (editorTab === "locks" || (selectedElement === "upper" && editorTab === "drawers") || (!(activeData.type === "cabinet" || activeData.type === "filler-panel") && editorTab === "finish") || (activeData.type !== "cabinet" && (editorTab === "doors" || editorTab === "shelves" || editorTab === "drawers"))) {
      setEditorTab("whd");
    }
  }, [selectedElement, editorTab, activeData.type]);

  const handleSelectLower = (index, options = {}) => {
    const shouldToggle = Boolean(options.toggle);
    lowerSelectionChangeRef.current = true;
    skipLowerMirrorRef.current = true;
    setSelectedElement("lower");

    if (!shouldToggle) {
      selectedLowerIndicesRef.current = [index];
      setSelectedLowerIndex(index);
      setSelectedLowerIndices([index]);
      setState((prev) => ({
        ...prev,
        cabinet: { ...(prev.lowerBoxes?.[index] || prev.cabinet) },
      }));
      return;
    }

    setSelectedLowerIndices((prev) => {
      const hasIndex = prev.includes(index);
      let next = hasIndex
        ? prev.filter((value) => value !== index)
        : [...prev, index].sort((a, b) => a - b);

      if (!next.length) {
        next = [index];
      }

      selectedLowerIndicesRef.current = next;
      const nextPrimary = next.includes(selectedLowerIndex) ? selectedLowerIndex : next[0];
      setSelectedLowerIndex(nextPrimary);
      return next;
    });
  };

  const handleToggleLowerDoors = (index) => {
    setSelectedElement("lower");
    setSelectedLowerIndex(index);
    setSelectedLowerIndices([index]);
    setState((prev) => {
      const nextLowerBoxes = [...(prev.lowerBoxes?.length ? prev.lowerBoxes : [prev.cabinet])];
      const current = nextLowerBoxes[index] || prev.cabinet;
      const nextOpenAmount = getStoredDoorOpenAmount(current) > 0.001 ? 0 : 1;
      nextLowerBoxes[index] = {
        ...current,
        doorOpen: nextOpenAmount > 0.001,
        doorOpenAmount: nextOpenAmount,
      };
      const persistedLowerBoxes = persistResolvedLowerFrontStates(nextLowerBoxes, prev.roomDepth, 10);
      return {
        ...prev,
        lowerBoxes: persistedLowerBoxes,
        cabinet: persistedLowerBoxes[index] || nextLowerBoxes[index],
      };
    });
  };

  const handleToggleLowerDrawers = (index, drawerIndex = null) => {
    setSelectedElement("lower");
    setSelectedLowerIndex(index);
    setSelectedLowerIndices([index]);
    setState((prev) => {
      const nextLowerBoxes = [...(prev.lowerBoxes?.length ? prev.lowerBoxes : [prev.cabinet])];
      const current = nextLowerBoxes[index] || prev.cabinet;
      let nextBox;

      if ((current.drawerMode ?? "none") === "drawer-bank" && Number.isInteger(drawerIndex)) {
        const currentAmounts = getStoredDrawerOpenAmounts(current);
        const nextAmount = currentAmounts[drawerIndex] > 0.001 ? 0 : 1;
        const nextAmounts = [...currentAmounts];
        nextAmounts[drawerIndex] = nextAmount;
        nextBox = {
          ...current,
          drawerOpenAmounts: nextAmounts,
          drawerOpenStates: nextAmounts.map((value) => value > 0.001),
        };
      } else {
        const nextOpenAmount = getStoredDrawerOpenAmount(current) > 0.001 ? 0 : 1;
        nextBox = {
          ...current,
          drawerOpen: nextOpenAmount > 0.001,
          drawerOpenAmount: nextOpenAmount,
        };
      }

      nextLowerBoxes[index] = nextBox;
      const persistedLowerBoxes = persistResolvedLowerFrontStates(nextLowerBoxes, prev.roomDepth, 10);
      return {
        ...prev,
        lowerBoxes: persistedLowerBoxes,
        cabinet: persistedLowerBoxes[index] || nextBox,
      };
    });
  };

  const handleToggleUpperDoors = () => {
    setSelectedElement("upper");
    setState((prev) => {
      const nextOpenAmount = getStoredDoorOpenAmount(prev.upper) > 0.001 ? 0 : 1;
      return {
        ...prev,
        upper: { ...prev.upper, doorOpen: nextOpenAmount > 0.001, doorOpenAmount: nextOpenAmount },
      };
    });
  };

  const handleToolTabChange = (nextTab) => {
    setToolTab(nextTab);
    if (nextTab === "shopDrawing") {
      setMoveToolActive(false);
      setRotateToolActive(false);
      setPushPullToolActive(false);
      setMoveSnapPreview([]);
      lowerMoveDragRef.current.active = false;
      lowerRotateDragRef.current.active = false;
      lowerPushPullDragRef.current.active = false;
    lowerPushPullDragRef.current.active = false;
      if (lowerMoveDragRef.current.snapReleaseTimer) {
        clearTimeout(lowerMoveDragRef.current.snapReleaseTimer);
        lowerMoveDragRef.current.snapReleaseTimer = null;
      }
      lowerMoveDragRef.current.currentNeighborSnapKey = null;
      lowerMoveDragRef.current.neighborSnapReleased = false;
      setState((prev) => ({
        ...prev,
        cameraMode: "parallel",
        cabinet: resetInteractiveBoxState(prev.cabinet),
        lowerBoxes: (prev.lowerBoxes?.length ? prev.lowerBoxes : [prev.cabinet]).map((box) => resetInteractiveBoxState(box)),
        upper: resetInteractiveBoxState(prev.upper),
      }));
      setShopDrawingNoteMode(false);
      setShopDrawingEraseMode(false);
      setShopDrawingDimensions([]);
      setShopDrawingNotes([]);
      return;
    }
    setShopDrawingNoteMode(false);
    setShopDrawingEraseMode(false);
  };

  const handleAddShopDrawingNote = ({ xRatio = 0.5, yRatio = 0.5, anchorWorld = null, labelOffsetX = 56, labelOffsetY = -36 }) => {
    setShopDrawingNotes((prev) => [
      ...prev,
      {
        id: `shop-note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        xRatio: clamp(Number(xRatio) || 0.5, 0, 1),
        yRatio: clamp(Number(yRatio) || 0.5, 0, 1),
        anchorWorld: anchorWorld ? {
          x: Number(anchorWorld.x ?? 0),
          y: Number(anchorWorld.y ?? 0),
          z: Number(anchorWorld.z ?? 0),
        } : null,
        labelOffsetX: Number(labelOffsetX ?? 56),
        labelOffsetY: Number(labelOffsetY ?? -36),
        text: String(shopDrawingNoteText || "Note callout").trim() || "Note callout",
      },
    ]);
  };

  const handleSaveKit = () => {
    try {
      const payload = buildProjectFilePayload({ state, isDarkMode, uiPrefs });
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${sanitizeProjectFileName(state.projectName)}.ckit`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Unable to save kit", error);
      window.alert("Unable to save this kit right now.");
    }
  };

  const handleTriggerUploadKit = () => {
    uploadInputRef.current?.click?.();
  };

  const handleUploadKitFile = async (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    try {
      if (!String(file.name || "").toLowerCase().endsWith(".ckit")) {
        throw new Error("Only .ckit CabinetKit Studio project files are supported.");
      }
      const text = await file.text();
      const parsed = parseProjectFilePayload(text);
      pendingHistoryBaseRef.current = null;
      pendingHistoryNextRef.current = null;
      historyPastRef.current = [];
      historyFutureRef.current = [];
      historyInitializedRef.current = false;
      isHistoryRestoreRef.current = false;
      skipLowerMirrorRef.current = true;
      setMoveToolActive(false);
      setRotateToolActive(false);
      setMoveSnapPreview([]);
      setSelectedElement("lower");
      setSelectedLowerIndex(0);
      setSelectedLowerIndices([0]);
      setIsDarkMode(parsed.isDarkMode);
      setUiPrefs({ ...DEFAULT_UI_PREFS, ...(parsed.uiPrefs || {}) });
      const nextLoadedState = ensureStateItemIds(parsed.state);
      setState(nextLoadedState);
      stateSnapshotRef.current = JSON.stringify(nextLoadedState);
    } catch (error) {
      console.error("Unable to load kit", error);
      window.alert(error?.message || "Unable to load that project file.");
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleAddCountertop = () => {
    const currentLowerBoxes = state.lowerBoxes?.length ? state.lowerBoxes : [state.cabinet];
    const selectedTargetIds = selectedElement === "lower"
      ? [...new Set((selectedLowerIndices.length ? selectedLowerIndices : [selectedLowerIndex])
          .map((index) => currentLowerBoxes[index]?.id)
          .filter(Boolean))]
      : [];

    const fallbackTargetIds = selectedTargetIds.length
      ? selectedTargetIds
      : getCountertopTargetLowerIds(state);

    const candidateCountertopItem = {
      ...(state.countertopItem || {}),
      type: "countertop",
      material: state.countertopDefaults?.material ?? state.countertopItem?.material ?? "solid-surface",
      edgeProfile: state.countertopDefaults?.edgeProfile ?? state.countertopItem?.edgeProfile ?? "eased",
      leftOverhang: state.countertopDefaults?.leftOverhang ?? state.countertopItem?.leftOverhang ?? 0.7,
      rightOverhang: state.countertopDefaults?.rightOverhang ?? state.countertopItem?.rightOverhang ?? 0.7,
      frontOverhang: state.countertopDefaults?.frontOverhang ?? state.countertopItem?.frontOverhang ?? 1.2,
      backOverhang: state.countertopDefaults?.backOverhang ?? state.countertopItem?.backOverhang ?? 0,
      thickness: state.countertopDefaults?.thickness ?? state.countertopItem?.thickness ?? 0.75,
      targetLowerIds: fallbackTargetIds,
      id: state.countertopItem?.id || makeItemId(),
    };

    const candidatePieceSize = getCountertopPieceSizeIn({
      ...state,
      countertop: true,
      countertopItem: candidateCountertopItem,
    }, candidateCountertopItem);

    if (!isCountertopSinglePieceSizeValid(candidatePieceSize.widthIn, candidatePieceSize.depthIn)) {
      window.alert("A single countertop piece is limited to 5' x 12'. Reduce the selected run or split it into multiple tops.");
      return;
    }

    setState((prev) => ({
      ...prev,
      countertop: true,
      countertopItem: candidateCountertopItem,
    }));

    setSelectedElement("countertop");
  };

  const updateCountertopItemWithLimit = (patch = {}, drivingField = null) => {
    setState((prev) => {
      const nextItem = enforceCountertopSinglePieceLimit(prev, {
        ...(prev.countertopItem || { type: "countertop" }),
        ...patch,
      }, drivingField);

      return {
        ...prev,
        countertopItem: {
          ...(prev.countertopItem || { type: "countertop" }),
          ...nextItem,
        },
      };
    });
  };

  const handleAddLowerBox = (type = "cabinet") => {
    const nextBox = type === "filler-panel"
      ? {
          id: makeItemId(),
          ...state.sectionDefaults,
          type,
          doorsEnabled: false,
          shelfCount: 0,
          adjustableShelves: false,
          fillerView: "front",
          fillerPlacement: state.sectionDefaults.fillerPlacement ?? "left",
          fillerThickness: 0.75,
          fillerFlushTarget: "box",
        }
      : type === "pony-wall"
        ? {
            id: makeItemId(),
            ...state.sectionDefaults,
            type,
            kickEnabled: false,
            doorsEnabled: false,
            shelfCount: 0,
            adjustableShelves: false,
            drawerMode: "none",
            ponyWallCoreType: state.sectionDefaults.ponyWallCoreType ?? "2x4",
            ponyWallDrywallThickness: state.sectionDefaults.ponyWallDrywallThickness ?? 0.5,
            ponyWallDrywallSides: state.sectionDefaults.ponyWallDrywallSides ?? 2,
            width: Math.min(96, state.sectionDefaults.width ?? 15),
            height: state.sectionDefaults.height ?? 42,
            depth: getPonyWallDepthInches(
              state.sectionDefaults.ponyWallCoreType ?? "2x4",
              state.sectionDefaults.ponyWallDrywallThickness ?? 0.5,
              state.sectionDefaults.ponyWallDrywallSides ?? 2,
            ),
          }
        : {
            id: makeItemId(),
            ...state.sectionDefaults,
            type,
            fillerPlacement: state.sectionDefaults.fillerPlacement ?? "left",
          };
    const insertIndex = selectedLowerIndex + 1;

    setState((prev) => {
      const nextLowerBoxes = [...(prev.lowerBoxes?.length ? prev.lowerBoxes : [prev.cabinet])];
      nextLowerBoxes.splice(insertIndex, 0, nextBox);
      return {
        ...prev,
        lowerBoxes: nextLowerBoxes,
        cabinet: nextBox,
      };
    });

    setSelectedLowerIndex(insertIndex);
    setSelectedLowerIndices([insertIndex]);
    setSelectedElement("lower");
  };

  const handleCopySelectedLowerBoxes = ({ cut = false } = {}) => {
    if (selectedElement === "upper" || selectedElement === "countertop") return;

    const boxes = state.lowerBoxes?.length ? state.lowerBoxes : [state.cabinet];
    const liveSelection = selectedLowerIndicesRef.current?.length ? selectedLowerIndicesRef.current : (selectedLowerIndices.length ? selectedLowerIndices : [selectedLowerIndex]);
    const indices = [...new Set(liveSelection.filter((idx) => idx >= 0 && idx < boxes.length))].sort((a, b) => a - b);
    if (!indices.length) return;

    const groupSnapshot = getLowerSelectionGroupSnapshot(boxes, indices, state.roomDepth * 10, 10);
    if (!groupSnapshot) return;

    const nextClipboard = groupSnapshot.members.map((member) => resetInteractiveBoxState({
      ...cloneCabinetClipboardPayload(boxes[member.index]),
      clipboardRenderX: member.renderX,
      clipboardRenderZ: member.renderZ,
      clipboardRelativeX: member.relativeX,
      clipboardRelativeZ: member.relativeZ,
      clipboardGroupAnchorX: groupSnapshot.anchorX,
      clipboardGroupAnchorZ: groupSnapshot.anchorZ,
      clipboardGroupLeft: groupSnapshot.bounds.left,
      clipboardGroupRight: groupSnapshot.bounds.right,
      clipboardGroupBack: groupSnapshot.bounds.zMin,
      clipboardGroupFront: groupSnapshot.bounds.zMax,
    }));
    setClipboardLowerBoxes(nextClipboard);

    if (!cut || boxes.length === indices.length) return;

    const removalSet = new Set(indices);
    const nextLowerBoxes = boxes.filter((_, idx) => !removalSet.has(idx));
    const nextIndex = clamp(indices[0], 0, nextLowerBoxes.length - 1);

    skipLowerMirrorRef.current = true;
    setSelectedElement("lower");
    setSelectedLowerIndex(nextIndex);
    selectedLowerIndicesRef.current = [nextIndex];
    setSelectedLowerIndices([nextIndex]);
    setState((prev) => ({
      ...prev,
      lowerBoxes: nextLowerBoxes,
      cabinet: nextLowerBoxes[nextIndex] || prev.cabinet,
    }));
  };

  const handlePasteLowerBoxes = () => {
    if (!clipboardLowerBoxes.length) return;

    const liveSelection = selectedLowerIndicesRef.current?.length ? selectedLowerIndicesRef.current : (selectedLowerIndices.length ? selectedLowerIndices : [selectedLowerIndex]);
    const insertIndexBase = selectedElement === "lower"
      ? Math.max(...liveSelection)
      : lowerBoxes.length - 1;

    const nextSelection = clipboardLowerBoxes.map((_, offset) => insertIndexBase + 1 + offset);

    lowerSelectionChangeRef.current = true;
    skipLowerMirrorRef.current = true;
    setSelectedElement("lower");
    setSelectedLowerIndex(nextSelection[0]);
    selectedLowerIndicesRef.current = nextSelection;
    setSelectedLowerIndices(nextSelection);
    setState((prev) => {
      const existingLowerBoxes = [...(prev.lowerBoxes?.length ? prev.lowerBoxes : [prev.cabinet])];
      const existingRenderBoxes = getLowerRenderLayout(existingLowerBoxes, 10, prev.roomDepth * 10);
      const placement = findAvailableLowerPastePlacement({
        clipboardBoxes: clipboardLowerBoxes,
        existingBoxes: existingRenderBoxes,
        roomWidthIn: prev.roomWidth,
        roomDepthIn: prev.roomDepth,
        pxPerInch: 10,
      });

      const pastedBoxes = clipboardLowerBoxes.map((box, index) => {
        const nextBox = {
          ...resetInteractiveBoxState(cloneCabinetClipboardPayload(box)),
          id: makeItemId(),
        };
        const placed = placement?.[index];

        if (placed) {
          nextBox.positionX = placed.xPx / 10;
          nextBox.positionZ = placed.zPx / 10;
        } else if (nextBox.positionX != null || nextBox.positionZ != null) {
          nextBox.positionX = (Number(nextBox.positionX) || 0) + 6 + index * 2;
          nextBox.positionZ = (Number(nextBox.positionZ) || 0) + 6;
        }

        delete nextBox.clipboardRenderX;
        delete nextBox.clipboardRenderZ;
        delete nextBox.clipboardRelativeX;
        delete nextBox.clipboardRelativeZ;
        delete nextBox.clipboardGroupAnchorX;
        delete nextBox.clipboardGroupAnchorZ;
        delete nextBox.clipboardGroupLeft;
        delete nextBox.clipboardGroupRight;
        delete nextBox.clipboardGroupBack;
        delete nextBox.clipboardGroupFront;
        return nextBox;
      });

      const nextLowerBoxes = [...existingLowerBoxes];
      nextLowerBoxes.splice(insertIndexBase + 1, 0, ...pastedBoxes);
      return {
        ...prev,
        lowerBoxes: nextLowerBoxes,
        cabinet: pastedBoxes.length === 1 ? pastedBoxes[0] : prev.cabinet,
      };
    });
  };

  const handleDeleteSelectedBoxes = () => {
    if (!selectedElement) return;
    if (selectedElement === "countertop") {
      setState((prev) => ({ ...prev, countertop: false }));
      setSelectedElement(null);
      return;
    }
    if (selectedElement === "upper") {
      if (!state.uppers) return;
      setState((prev) => ({ ...prev, uppers: false }));
      setSelectedElement("lower");
      return;
    }

    if (selectedElement !== "lower") return;

    const boxes = state.lowerBoxes?.length ? state.lowerBoxes : [state.cabinet];
    const liveSelection = selectedLowerIndicesRef.current?.length ? selectedLowerIndicesRef.current : (selectedLowerIndices.length ? selectedLowerIndices : [selectedLowerIndex]);
    const indices = [...new Set(liveSelection.filter((idx) => idx >= 0 && idx < boxes.length))].sort((a, b) => a - b);
    if (!indices.length) return;
    if (indices.length >= boxes.length) return;

    const removalSet = new Set(indices);
    const nextLowerBoxes = boxes.filter((_, idx) => !removalSet.has(idx));
    const nextIndex = clamp(indices[0], 0, nextLowerBoxes.length - 1);

    skipLowerMirrorRef.current = true;
    setSelectedElement("lower");
    setSelectedLowerIndex(nextIndex);
    selectedLowerIndicesRef.current = [nextIndex];
    setSelectedLowerIndices([nextIndex]);
    setState((prev) => ({
      ...prev,
      lowerBoxes: nextLowerBoxes,
      cabinet: nextLowerBoxes[nextIndex] || prev.cabinet,
    }));
  };

  const getSectionVariantCount = (referenceBox = state.sectionDefaults) => {
    const boxes = state.lowerBoxes?.length ? state.lowerBoxes : [state.cabinet];
    return boxes.filter((box) =>
      Number(box.width || 0) !== Number(referenceBox.width || 0) ||
      Number(box.height || 0) !== Number(referenceBox.height || 0) ||
      Number(box.depth || 0) !== Number(referenceBox.depth || 0) ||
      Boolean(box.kickEnabled ?? true) !== Boolean(referenceBox.kickEnabled ?? true) ||
      Number(box.toeKickHeight || 0) !== Number(referenceBox.toeKickHeight || 0) ||
      Number(box.toeKickDepth || 0) !== Number(referenceBox.toeKickDepth || 0) ||
      Number(box.aboveFloor || 0) !== Number(referenceBox.aboveFloor || 0) ||
      Boolean(box.doorsEnabled ?? true) !== Boolean(referenceBox.doorsEnabled ?? true) ||
      String(box.doorStyle ?? "auto") !== String(referenceBox.doorStyle ?? "auto") ||
      String(box.doorKind ?? "flat") !== String(referenceBox.doorKind ?? "flat") ||
      String(box.doorMount ?? "overlay") !== String(referenceBox.doorMount ?? "overlay") ||
      Number(box.doorInsetDepth ?? 0) !== Number(referenceBox.doorInsetDepth ?? 0) ||
      Number(box.doorProfile ?? 2.25) !== Number(referenceBox.doorProfile ?? 2.25) ||
      Boolean(box.shakerSlim ?? false) !== Boolean(referenceBox.shakerSlim ?? false) ||
      Boolean(box.continuousSidePanel ?? false) !== Boolean(referenceBox.continuousSidePanel ?? false) ||
      String(box.fillerView ?? "front") !== String(referenceBox.fillerView ?? "front") ||
      String(box.fillerPlacement ?? "left") !== String(referenceBox.fillerPlacement ?? "left") ||
      Number(box.fillerThickness ?? 0.75) !== Number(referenceBox.fillerThickness ?? 0.75) ||
      String(box.fillerFlushTarget ?? "box") !== String(referenceBox.fillerFlushTarget ?? "box") ||
      String(box.drawerMode ?? "none") !== String(referenceBox.drawerMode ?? "none") ||
      Number(box.drawerCount ?? 3) !== Number(referenceBox.drawerCount ?? 3) ||
      Number(box.topDrawerHeight ?? 6) !== Number(referenceBox.topDrawerHeight ?? 6) ||
      Boolean(box.drawerOpen ?? false) !== Boolean(referenceBox.drawerOpen ?? false) ||
      String(box.drawerSlideType ?? "undermount") !== String(referenceBox.drawerSlideType ?? "undermount") ||
      Boolean(box.drawerSoftClose ?? true) !== Boolean(referenceBox.drawerSoftClose ?? true) ||
      Number(box.drawerSideWallThickness ?? 0.5) !== Number(referenceBox.drawerSideWallThickness ?? 0.5) ||
      JSON.stringify(box.drawerOpenStates ?? [false, false, false, false, false]) !== JSON.stringify(referenceBox.drawerOpenStates ?? [false, false, false, false, false]) ||
      String(box.faceFinishType ?? "paint") !== String(referenceBox.faceFinishType ?? "paint") ||
      String(box.faceFinishTone ?? "white") !== String(referenceBox.faceFinishTone ?? "white") ||
      String(box.faceFinishSupplier ?? "") !== String(referenceBox.faceFinishSupplier ?? "") ||
      String(box.faceFinishCode ?? "") !== String(referenceBox.faceFinishCode ?? "") ||
      String(box.faceFinishCustomHex ?? "#d8ccb7") !== String(referenceBox.faceFinishCustomHex ?? "#d8ccb7") ||
      Number(box.doorGap ?? 0.125) !== Number(referenceBox.doorGap ?? 0.125)
    ).length;
  };

  const confirmSectionBoxChange = () => {
    if (sectionDefaultsEditAuthorizedRef.current) return true;

    const boxes = state.lowerBoxes?.length ? state.lowerBoxes : [state.cabinet];
    if (boxes.length <= 1) {
      sectionDefaultsEditAuthorizedRef.current = true;
      return true;
    }

    const variantCount = getSectionVariantCount();
    if (!variantCount) {
      sectionDefaultsEditAuthorizedRef.current = true;
      return true;
    }

    const okay = window.confirm(
      `Are you sure you want to make that change? There ${variantCount === 1 ? "is" : "are"} ${variantCount} box${variantCount === 1 ? "" : "es"} different than the default for this section. This will update the section reference for future boxes.`
    );

    if (okay) {
      sectionDefaultsEditAuthorizedRef.current = true;
    }

    return okay;
  };

  const resetSectionBoxEditAuthorization = () => {
    sectionDefaultsEditAuthorizedRef.current = false;
  };

  const updateSectionDefaults = (patch) => {
    setState((prev) => {
      const nextSectionDefaults = { ...prev.sectionDefaults, ...patch };
      const existingBoxes = prev.lowerBoxes?.length ? prev.lowerBoxes : [prev.cabinet];

      if (existingBoxes.length <= 1) {
        const nextBox = { ...(existingBoxes[0] || prev.cabinet), ...patch };
        return {
          ...prev,
          sectionDefaults: nextSectionDefaults,
          cabinet: nextBox,
          lowerBoxes: [nextBox],
        };
      }

      return {
        ...prev,
        sectionDefaults: nextSectionDefaults,
      };
    });
  };

  const flushPendingHistory = () => {
    if (!historyCommitTimerRef.current || pendingHistoryBaseRef.current == null || pendingHistoryNextRef.current == null) {
      return;
    }

    clearTimeout(historyCommitTimerRef.current);
    historyCommitTimerRef.current = null;
    historyPastRef.current.push(pendingHistoryBaseRef.current);
    if (historyPastRef.current.length > 120) historyPastRef.current.shift();
    historyFutureRef.current = [];
    stateSnapshotRef.current = pendingHistoryNextRef.current;
    pendingHistoryBaseRef.current = null;
    pendingHistoryNextRef.current = null;
  };

  const applyHistorySnapshot = (snapshot) => {
    if (!snapshot) return;
    isHistoryRestoreRef.current = true;
    pendingHistoryBaseRef.current = null;
    pendingHistoryNextRef.current = null;
    if (historyCommitTimerRef.current) {
      clearTimeout(historyCommitTimerRef.current);
      historyCommitTimerRef.current = null;
    }
    stateSnapshotRef.current = snapshot;
    setState(JSON.parse(snapshot));
  };

  const handleUndo = () => {
    flushPendingHistory();
    if (!historyPastRef.current.length) return;
    const currentSnapshot = stateSnapshotRef.current;
    const previousSnapshot = historyPastRef.current.pop();
    historyFutureRef.current.push(currentSnapshot);
    applyHistorySnapshot(previousSnapshot);
  };

  const handleRedo = () => {
    flushPendingHistory();
    if (!historyFutureRef.current.length) return;
    const currentSnapshot = stateSnapshotRef.current;
    const nextSnapshot = historyFutureRef.current.pop();
    historyPastRef.current.push(currentSnapshot);
    applyHistorySnapshot(nextSnapshot);
  };

  useEffect(() => {
    if (selectedElement !== "lower") return;
    if (lowerSelectionChangeRef.current) {
      lowerSelectionChangeRef.current = false;
      skipLowerMirrorRef.current = false;
      return;
    }
    if (skipLowerMirrorRef.current) {
      skipLowerMirrorRef.current = false;
      return;
    }

    setState((prev) => {
      const nextLowerBoxes = [...(prev.lowerBoxes?.length ? prev.lowerBoxes : [prev.cabinet])];
      const targetIndices = (selectedLowerIndices.length ? selectedLowerIndices : [selectedLowerIndex]).filter((idx) => nextLowerBoxes[idx]);
      if (!targetIndices.length) return prev;

      let didChange = false;
      const mirrorPatch = getLowerMultiEditMirrorPatch(prev.cabinet);
      targetIndices.forEach((idx) => {
        const current = nextLowerBoxes[idx];
        const mirrored = {
          ...current,
          ...mirrorPatch,
        };
        if (JSON.stringify(current) !== JSON.stringify(mirrored)) {
          nextLowerBoxes[idx] = mirrored;
          didChange = true;
        }
      });

      if (!didChange) return prev;
      return {
        ...prev,
        lowerBoxes: nextLowerBoxes,
      };
    });
  }, [selectedElement, selectedLowerIndex, selectedLowerIndices, state.cabinet]);

  useEffect(() => {
    const nextLowerBoxes = state.lowerBoxes?.length ? state.lowerBoxes : [state.cabinet];
    if (selectedLowerIndex > nextLowerBoxes.length - 1) {
      const clampedIndex = Math.max(0, nextLowerBoxes.length - 1);
      selectedLowerIndicesRef.current = [clampedIndex];
      setSelectedLowerIndex(clampedIndex);
      setSelectedLowerIndices([clampedIndex]);
      return;
    }

    setSelectedLowerIndices((prev) => {
      const filtered = prev.filter((idx) => idx <= nextLowerBoxes.length - 1);
      const next = filtered.length ? filtered : [selectedLowerIndex];
      selectedLowerIndicesRef.current = next;
      return next;
    });
  }, [selectedLowerIndex, state.lowerBoxes, state.cabinet]);

  useEffect(() => {
    const serialized = JSON.stringify(state);

    if (!historyInitializedRef.current) {
      historyInitializedRef.current = true;
      stateSnapshotRef.current = serialized;
      return;
    }

    if (isHistoryRestoreRef.current) {
      isHistoryRestoreRef.current = false;
      stateSnapshotRef.current = serialized;
      return;
    }

    if (serialized === stateSnapshotRef.current) return;

    if (pendingHistoryBaseRef.current == null) {
      pendingHistoryBaseRef.current = stateSnapshotRef.current;
    }

    pendingHistoryNextRef.current = serialized;

    if (historyCommitTimerRef.current) {
      clearTimeout(historyCommitTimerRef.current);
    }

    historyCommitTimerRef.current = window.setTimeout(() => {
      flushPendingHistory();
    }, 140);
  }, [state]);

  const markViewportInteraction = () => {
    lastInteractionRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
    autoRotateLastTimeRef.current = null;
  };

  const handleStartMoveLower = (index, event) => {
    if (!moveToolActive || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    markViewportInteraction();

    const currentBoxes = state.lowerBoxes?.length ? state.lowerBoxes : [state.cabinet];
    const renderBoxes = getLowerRenderLayout(currentBoxes, 10, state.roomDepth * 10);
    const activeIndices = selectedLowerIndices.includes(index) ? selectedLowerIndices : [index];

    if (!selectedLowerIndices.includes(index)) {
      skipLowerMirrorRef.current = true;
      setSelectedElement("lower");
      setSelectedLowerIndex(index);
      setSelectedLowerIndices([index]);
      setState((prev) => ({
        ...prev,
        cabinet: { ...(prev.lowerBoxes?.[index] || prev.cabinet) },
      }));
    }

    lowerMoveDragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      dragDistancePx: 0,
      indices: activeIndices,
      neighborSnapReleased: false,
      currentNeighborSnapKey: null,
      snapReleaseTimer: null,
      lastPointerX: event.clientX,
      lastPointerY: event.clientY,
      previewBoxes: [],
      invalidPlacement: false,
      startPositions: Object.fromEntries(activeIndices.map((idx) => {
        const box = renderBoxes[idx];
        return [idx, {
          xPx: box?.renderX ?? 0,
          zPx: box?.renderZ ?? 0,
          widthPx: box?.widthPx ?? 0,
          depthPx: box?.depthPx ?? 0,
          heightPx: box?.heightPx ?? 0,
        }];
      })),
    };
  };

  const handleStartPushPullLower = (index, face, event) => {
    if (!pushPullToolActive || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    markViewportInteraction();

    const currentBoxes = state.lowerBoxes?.length ? state.lowerBoxes : [state.cabinet];
    const renderBoxes = getLowerRenderLayout(currentBoxes, 10, state.roomDepth * 10);
    const renderBox = renderBoxes[index];
    const sourceBox = currentBoxes[index];
    if (!renderBox || !sourceBox) return;

    const rotationDeg = Number(sourceBox.rotationDeg) || 0;
    const localAnchor = face === "left"
      ? { x: renderBox.widthPx / 2, z: 0 }
      : face === "right"
        ? { x: -renderBox.widthPx / 2, z: 0 }
        : face === "front"
          ? { x: 0, z: -renderBox.depthPx / 2 }
          : { x: 0, z: renderBox.depthPx / 2 };
    const rotatedAnchor = rotatePoint2D(localAnchor.x, localAnchor.z, rotationDeg);

    lowerPushPullDragRef.current = {
      active: true,
      index,
      face,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startWidth: Number(sourceBox.width) || 15,
      startDepth: Number(sourceBox.depth) || 23,
      startPositionX: Number(sourceBox.positionX ?? renderBox.renderX / 10) || 0,
      startPositionZ: Number(sourceBox.positionZ ?? renderBox.renderZ / 10) || 0,
      startRotationDeg: rotationDeg,
      anchorWorldX: renderBox.renderX + rotatedAnchor.x,
      anchorWorldZ: renderBox.renderZ + rotatedAnchor.z,
      invalidPlacement: false,
      previousBox: { ...sourceBox },
    };
  };

  const handleStartPushPullCountertop = (face, event) => {
    if (!pushPullToolActive || !state.countertop || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    markViewportInteraction();
    setSelectedElement("countertop");

    countertopPushPullDragRef.current = {
      active: true,
      face,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startSettings: { ...getCountertopSettings(state.countertopItem || {}) },
      draft: null,
    };
  };

  const handleStartRotateLower = (index, event) => {
    if (!rotateToolActive || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    markViewportInteraction();

    const currentBoxes = state.lowerBoxes?.length ? state.lowerBoxes : [state.cabinet];
    const renderBoxes = getLowerRenderLayout(currentBoxes, 10, state.roomDepth * 10);
    const activeIndices = selectedLowerIndices.includes(index) ? selectedLowerIndices : [index];

    if (!selectedLowerIndices.includes(index)) {
      skipLowerMirrorRef.current = true;
      setSelectedElement("lower");
      setSelectedLowerIndex(index);
      setSelectedLowerIndices([index]);
      setState((prev) => ({
        ...prev,
        cabinet: { ...(prev.lowerBoxes?.[index] || prev.cabinet) },
      }));
    }

    const selectedRenderBoxes = activeIndices
      .map((idx) => ({ idx, box: renderBoxes[idx] }))
      .filter((entry) => Boolean(entry.box));

    const groupBounds = selectedRenderBoxes.reduce((acc, entry) => {
      const box = entry.box;
      const bounds = getBoxBounds(box.renderX, box.renderZ, box.widthPx, box.depthPx, box.renderRotationDeg);
      return {
        left: Math.min(acc.left, bounds.left),
        right: Math.max(acc.right, bounds.right),
        zMin: Math.min(acc.zMin, bounds.zMin),
        zMax: Math.max(acc.zMax, bounds.zMax),
      };
    }, { left: Infinity, right: -Infinity, zMin: Infinity, zMax: -Infinity });

    const groupCenterX = Number.isFinite(groupBounds.left) ? (groupBounds.left + groupBounds.right) / 2 : 0;
    const groupCenterZ = Number.isFinite(groupBounds.zMin) ? (groupBounds.zMin + groupBounds.zMax) / 2 : 0;

    lowerRotateDragRef.current = {
      active: true,
      startX: event.clientX,
      indices: activeIndices,
      groupCenterX,
      groupCenterZ,
      startTransforms: Object.fromEntries(activeIndices.map((idx) => {
        const renderBox = renderBoxes[idx];
        return [idx, {
          xPx: renderBox?.renderX ?? 0,
          zPx: renderBox?.renderZ ?? 0,
          widthPx: renderBox?.widthPx ?? ((Number(currentBoxes[idx]?.width) || 0) * 10),
          depthPx: renderBox?.depthPx ?? ((Number(currentBoxes[idx]?.depth) || 0) * 10),
          rotationDeg: Number(currentBoxes[idx]?.rotationDeg) || 0,
        }];
      })),
    };
  };

  const handleViewportMouseDown = (event) => {
    markViewportInteraction();
    if (event.target?.closest?.("[data-cabinet]")) return;

    if (!event.target?.closest?.("button, input, select, textarea, label")) {
      setSelectedElement(null);
      setSelectedLowerIndices([]);
      selectedLowerIndicesRef.current = [];
    }
    viewportDragRef.current = {
      active: true,
      mode: event.shiftKey || state.dragMode === "pan" ? "pan" : "orbit",
      startX: event.clientX,
      startY: event.clientY,
      panX: state.panX,
      panY: state.panY,
      orbit: state.orbit,
      tilt: state.tilt,
    };
  };

  const handleViewportMouseMove = (event) => {
    if (countertopPushPullDragRef.current.active) {
      const drag = countertopPushPullDragRef.current;
      const dx = event.clientX - drag.startClientX;
      const dy = event.clientY - drag.startClientY;
      const { worldDx, worldDz } = getFloorPlaneDragDelta(dx, dy, state.orbit, state.tilt);
      const startSettings = drag.startSettings || getCountertopSettings(state.countertopItem || {});

      let nextSettings = { ...startSettings };
      if (drag.face === "right") nextSettings.rightOverhang = clamp(roundToNearestSixteenth(startSettings.rightOverhang + worldDx / 10), 0, 24);
      if (drag.face === "left") nextSettings.leftOverhang = clamp(roundToNearestSixteenth(startSettings.leftOverhang - worldDx / 10), 0, 24);
      if (drag.face === "front") nextSettings.frontOverhang = clamp(roundToNearestSixteenth(startSettings.frontOverhang + worldDz / 10), 0, 24);
      if (drag.face === "back") nextSettings.backOverhang = clamp(roundToNearestSixteenth(startSettings.backOverhang - worldDz / 10), 0, 24);

      const drivingField = drag.face === "left"
        ? "leftOverhang"
        : drag.face === "right"
          ? "rightOverhang"
          : drag.face === "front"
            ? "frontOverhang"
            : "backOverhang";
      const limitedSettings = enforceCountertopSinglePieceLimit(state, {
        ...(state.countertopItem || { type: "countertop" }),
        ...nextSettings,
      }, drivingField);

      drag.draft = limitedSettings;
      setState((prev) => ({
        ...prev,
        countertopItem: {
          ...(prev.countertopItem || { type: "countertop" }),
          ...limitedSettings,
        },
      }));
      return;
    }

    if (lowerPushPullDragRef.current.active) {
      const drag = lowerPushPullDragRef.current;
      const dx = event.clientX - drag.startClientX;
      const dy = event.clientY - drag.startClientY;
      const { worldDx, worldDz } = getFloorPlaneDragDelta(dx, dy, state.orbit, state.tilt);
      const rotationDeg = Number(drag.startRotationDeg) || 0;
      const localDelta = rotatePoint2D(worldDx, worldDz, -rotationDeg);
      const minWidth = 0.75;
      const maxWidth = drag.previousBox?.type === "pony-wall" ? 96 : 40;
      const minDepth = drag.previousBox?.type === "pony-wall" ? 2.25 : 2;
      const maxDepth = 96;

      let nextWidth = drag.startWidth;
      let nextDepth = drag.startDepth;
      if (drag.face === "right") nextWidth = clamp(roundToNearestSixteenth(drag.startWidth + localDelta.x / 10), minWidth, maxWidth);
      if (drag.face === "left") nextWidth = clamp(roundToNearestSixteenth(drag.startWidth - localDelta.x / 10), minWidth, maxWidth);
      if (drag.face === "front") nextDepth = clamp(roundToNearestSixteenth(drag.startDepth + localDelta.z / 10), minDepth, maxDepth);
      if (drag.face === "back") nextDepth = clamp(roundToNearestSixteenth(drag.startDepth - localDelta.z / 10), minDepth, maxDepth);

      const nextWidthPx = nextWidth * 10;
      const nextDepthPx = nextDepth * 10;
      const anchorLocal = drag.face === "left"
        ? { x: nextWidthPx / 2, z: 0 }
        : drag.face === "right"
          ? { x: -nextWidthPx / 2, z: 0 }
          : drag.face === "front"
            ? { x: 0, z: -nextDepthPx / 2 }
            : { x: 0, z: nextDepthPx / 2 };
      const rotatedAnchor = rotatePoint2D(anchorLocal.x, anchorLocal.z, rotationDeg);
      const centerXPx = drag.anchorWorldX - rotatedAnchor.x;
      const centerZPx = drag.anchorWorldZ - rotatedAnchor.z;
      const roomWidthPx = state.roomWidth * 10;
      const roomDepthPx = state.roomDepth * 10;
      const candidate = {
        xPx: centerXPx,
        zPx: centerZPx,
        widthPx: nextWidthPx,
        depthPx: nextDepthPx,
        rotationDeg,
        ...getBoxBounds(centerXPx, centerZPx, nextWidthPx, nextDepthPx, rotationDeg),
      };
      const outsideRoom = candidate.left < -roomWidthPx / 2 || candidate.right > roomWidthPx / 2 || candidate.zMin < -roomDepthPx / 2 || candidate.zMax > roomDepthPx / 2;
      const currentBoxes = state.lowerBoxes?.length ? state.lowerBoxes : [state.cabinet];
      const renderBoxes = getLowerRenderLayout(currentBoxes, 10, roomDepthPx);
      const overlaps = renderBoxes.some((box, idx) => idx !== drag.index && boxesOverlap(candidate, {
        xPx: box.renderX,
        zPx: box.renderZ,
        widthPx: box.widthPx,
        depthPx: box.depthPx,
        rotationDeg: Number(box.renderRotationDeg ?? box.rotationDeg) || 0,
      }, 2));
      drag.invalidPlacement = outsideRoom || overlaps;
      drag.draft = {
        width: nextWidth,
        depth: nextDepth,
        centerXPx,
        centerZPx,
      };

      skipLowerMirrorRef.current = true;
      setState((prev) => {
        const nextLowerBoxes = [...(prev.lowerBoxes?.length ? prev.lowerBoxes : [prev.cabinet])];
        if (!nextLowerBoxes[drag.index]) return prev;
        nextLowerBoxes[drag.index] = {
          ...nextLowerBoxes[drag.index],
          width: nextWidth,
          depth: nextDepth,
          positionX: centerXPx / 10,
          positionZ: centerZPx / 10,
        };
        return {
          ...prev,
          lowerBoxes: nextLowerBoxes,
          cabinet: drag.index === selectedLowerIndex ? nextLowerBoxes[drag.index] : prev.cabinet,
        };
      });
      return;
    }

    if (lowerRotateDragRef.current.active) {
      const dx = event.clientX - lowerRotateDragRef.current.startX;
      const rawDelta = dx * 0.6;
      const snappedDeltaDeg = Math.round(rawDelta / 15) * 15;
      const roomWidthPx = state.roomWidth * 10;
      const roomDepthPx = state.roomDepth * 10;

      skipLowerMirrorRef.current = true;
      setState((prev) => {
        const nextLowerBoxes = [...(prev.lowerBoxes?.length ? prev.lowerBoxes : [prev.cabinet])];
        const activeIndices = lowerRotateDragRef.current.indices || [];
        const startTransforms = lowerRotateDragRef.current.startTransforms || {};
        const groupCenterX = Number(lowerRotateDragRef.current.groupCenterX ?? 0);
        const groupCenterZ = Number(lowerRotateDragRef.current.groupCenterZ ?? 0);

        const rotatedCandidates = activeIndices.map((idx) => {
          const startTransform = startTransforms[idx];
          if (!nextLowerBoxes[idx] || !startTransform) return null;

          const relativeX = startTransform.xPx - groupCenterX;
          const relativeZ = startTransform.zPx - groupCenterZ;
          const rotatedOffset = rotatePoint2D(relativeX, relativeZ, snappedDeltaDeg);
          const nextRotationDeg = (Number(startTransform.rotationDeg) || 0) + snappedDeltaDeg;
          const xPx = groupCenterX + rotatedOffset.x;
          const zPx = groupCenterZ + rotatedOffset.z;
          const bounds = getBoxBounds(
            xPx,
            zPx,
            startTransform.widthPx,
            startTransform.depthPx,
            nextRotationDeg,
          );

          return {
            idx,
            xPx,
            zPx,
            nextRotationDeg,
            bounds,
          };
        }).filter(Boolean);

        if (!rotatedCandidates.length) return prev;

        const groupBounds = rotatedCandidates.reduce((acc, candidate) => ({
          left: Math.min(acc.left, candidate.bounds.left),
          right: Math.max(acc.right, candidate.bounds.right),
          zMin: Math.min(acc.zMin, candidate.bounds.zMin),
          zMax: Math.max(acc.zMax, candidate.bounds.zMax),
        }), { left: Infinity, right: -Infinity, zMin: Infinity, zMax: -Infinity });

        let shiftX = 0;
        let shiftZ = 0;

        if (groupBounds.left < -roomWidthPx / 2) {
          shiftX = -roomWidthPx / 2 - groupBounds.left;
        } else if (groupBounds.right > roomWidthPx / 2) {
          shiftX = roomWidthPx / 2 - groupBounds.right;
        }

        if (groupBounds.zMin < -roomDepthPx / 2) {
          shiftZ = -roomDepthPx / 2 - groupBounds.zMin;
        } else if (groupBounds.zMax > roomDepthPx / 2) {
          shiftZ = roomDepthPx / 2 - groupBounds.zMax;
        }

        rotatedCandidates.forEach((candidate) => {
          nextLowerBoxes[candidate.idx] = {
            ...nextLowerBoxes[candidate.idx],
            rotationDeg: candidate.nextRotationDeg,
            activeWall: inferActiveWallFromRotationDeg(candidate.nextRotationDeg),
            positionX: (candidate.xPx + shiftX) / 10,
            positionZ: (candidate.zPx + shiftZ) / 10,
          };
        });

        const nextActiveBox = nextLowerBoxes[selectedLowerIndex] || prev.cabinet;
        return {
          ...prev,
          lowerBoxes: nextLowerBoxes,
          cabinet: selectedLowerIndices.length === 1 ? nextActiveBox : prev.cabinet,
        };
      });
      return;
    }

    if (lowerMoveDragRef.current.active) {
      const dx = event.clientX - lowerMoveDragRef.current.startX;
      const dy = event.clientY - lowerMoveDragRef.current.startY;
      const dragDistancePx = Math.hypot(dx, dy);
      lowerMoveDragRef.current.dragDistancePx = dragDistancePx;
      const snapActivationDistancePx = 8;
      const snapActive = dragDistancePx >= snapActivationDistancePx;
      const { worldDx, worldDz } = getFloorPlaneDragDelta(dx, dy, state.orbit, state.tilt);
      const roomWidthPx = state.roomWidth * 10;
      const roomDepthPx = state.roomDepth * 10;
      const currentBoxes = state.lowerBoxes?.length ? state.lowerBoxes : [state.cabinet];
      const renderBoxes = getLowerRenderLayout(currentBoxes, 10, roomDepthPx);
      const movingIndices = lowerMoveDragRef.current.indices;
      const movingSet = new Set(movingIndices);

      const movedRawBoxes = movingIndices.map((idx) => {
        const dragStart = lowerMoveDragRef.current.startPositions[idx];
        const sourceBox = currentBoxes[idx];
        if (!dragStart || !sourceBox) return null;
        const xPx = dragStart.xPx + worldDx;
        const zPx = dragStart.zPx + worldDz;
        return {
          index: idx,
          xPx,
          zPx,
          widthPx: dragStart.widthPx,
          depthPx: dragStart.depthPx,
          heightPx: dragStart.heightPx,
          type: sourceBox.type,
          frontPlanePx: getWallAlignedFrontPlanePx({
          xPx,
          zPx,
          widthPx: dragStart.widthPx,
          depthPx: dragStart.depthPx,
          rotationDeg: Number(sourceBox.rotationDeg) || 0,
          activeWall: sourceBox.activeWall,
        }),
        activeWall: sourceBox.activeWall || inferActiveWallFromRotationDeg(Number(sourceBox.rotationDeg) || 0),
          ...getBoxBounds(xPx, zPx, dragStart.widthPx, dragStart.depthPx, sourceBox.rotationDeg),
        };
      }).filter(Boolean);

      const groupBounds = movedRawBoxes.reduce((acc, box) => ({
        left: Math.min(acc.left, box.left),
        right: Math.max(acc.right, box.right),
        zMin: Math.min(acc.zMin, box.zMin),
        zMax: Math.max(acc.zMax, box.zMax),
      }), { left: Infinity, right: -Infinity, zMin: Infinity, zMax: -Infinity });

      const otherBoxes = renderBoxes
        .map((box, index) => ({
          index,
          xPx: box.renderX,
          zPx: box.renderZ,
          widthPx: box.widthPx,
          depthPx: box.depthPx,
          type: box.type,
          rotationDeg: Number(box.renderRotationDeg ?? box.rotationDeg) || 0,
          frontPlanePx: getWallAlignedFrontPlanePx({
          xPx: box.renderX,
          zPx: box.renderZ,
          widthPx: box.widthPx,
          depthPx: box.depthPx,
          rotationDeg: Number(box.renderRotationDeg ?? box.rotationDeg) || 0,
          activeWall: box.activeWall,
        }),
          activeWall: box.activeWall || inferActiveWallFromRotationDeg(Number(box.renderRotationDeg ?? box.rotationDeg) || 0),
          ...getBoxBounds(box.renderX, box.renderZ, box.widthPx, box.depthPx, box.renderRotationDeg),
        }))
        .filter((box) => !movingSet.has(box.index));

      let neighborSnap = null;
      if (snapActive && quickSnapEnabled && !lowerMoveDragRef.current.neighborSnapReleased && Number.isFinite(groupBounds.left)) {
        neighborSnap = getNeighborQuickSnap({
          movingBoxes: movedRawBoxes.map((box) => ({
            xPx: box.xPx,
            zPx: box.zPx,
            widthPx: box.widthPx,
            depthPx: box.depthPx,
            rotationDeg: Number(currentBoxes[box.index]?.rotationDeg) || 0,
          })),
          otherBoxes,
          thresholdPx: 40,
          zTolerancePx: 40,
        });
      }

      const pointerMove = Math.hypot(event.clientX - (lowerMoveDragRef.current.lastPointerX ?? event.clientX), event.clientY - (lowerMoveDragRef.current.lastPointerY ?? event.clientY));
      lowerMoveDragRef.current.lastPointerX = event.clientX;
      lowerMoveDragRef.current.lastPointerY = event.clientY;

      if (neighborSnap && quickSnapEnabled && !lowerMoveDragRef.current.neighborSnapReleased) {
        const sameKey = lowerMoveDragRef.current.currentNeighborSnapKey === neighborSnap.key;
        if (!sameKey || pointerMove > 3) {
          if (lowerMoveDragRef.current.snapReleaseTimer) {
            clearTimeout(lowerMoveDragRef.current.snapReleaseTimer);
          }
          lowerMoveDragRef.current.currentNeighborSnapKey = neighborSnap.key;
          lowerMoveDragRef.current.snapReleaseTimer = window.setTimeout(() => {
            lowerMoveDragRef.current.neighborSnapReleased = true;
            lowerMoveDragRef.current.currentNeighborSnapKey = null;
            lowerMoveDragRef.current.snapReleaseTimer = null;
            setMoveSnapPreview((prevPreview) => prevPreview.map((preview) => ({ ...preview, targetIndex: null, neighborSnap: false })));
          }, 2500);
        }
      } else {
        if (lowerMoveDragRef.current.snapReleaseTimer) {
          clearTimeout(lowerMoveDragRef.current.snapReleaseTimer);
          lowerMoveDragRef.current.snapReleaseTimer = null;
        }
        lowerMoveDragRef.current.currentNeighborSnapKey = null;
      }

      const candidateBoxes = movedRawBoxes.map((box) => {
        const gridSnapPx = 10;
        const wallSnapThresholdPx = 10;
        const movingSourceBox = currentBoxes[box.index] || {};
        const targetRenderBox = Number.isInteger(neighborSnap?.targetIndex) ? renderBoxes[neighborSnap.targetIndex] : null;

        let snappedXPx = snapActive
          ? (neighborSnap ? box.xPx + neighborSnap.offsetX : Math.round(box.xPx / gridSnapPx) * gridSnapPx)
          : box.xPx;
        let snappedZPx = snapActive
          ? (neighborSnap ? box.zPx + neighborSnap.offsetZ : Math.round(box.zPx / gridSnapPx) * gridSnapPx)
          : box.zPx;

        if (snapActive && neighborSnap && targetRenderBox && neighborSnap.snapSide && movedRawBoxes.length === 1) {
          const exactSnap = getExactNeighborSnapPosition({
            movingXPx: snappedXPx,
            movingZPx: snappedZPx,
            movingWidthPx: box.widthPx,
            movingRotationDeg: Number(movingSourceBox.rotationDeg) || 0,
            targetXPx: Number(targetRenderBox.renderX ?? 0),
            targetZPx: Number(targetRenderBox.renderZ ?? 0),
            targetWidthPx: Number(targetRenderBox.widthPx ?? 0),
            targetRotationDeg: Number(targetRenderBox.renderRotationDeg ?? targetRenderBox.rotationDeg) || 0,
            snapSide: neighborSnap.snapSide,
          });
          snappedXPx = exactSnap.xPx;
          snappedZPx = exactSnap.zPx;
        }

        const wallSnapTarget = getWallSnapPositionForBox({
          box: {
            ...movingSourceBox,
            xPx: snappedXPx,
            zPx: snappedZPx,
            widthPx: box.widthPx,
            depthPx: box.depthPx,
            rotationDeg: Number(movingSourceBox.rotationDeg) || 0,
            activeWall: movingSourceBox.activeWall,
          },
          roomWidthPx,
          roomDepthPx,
          fallbackX: snappedXPx,
          fallbackZ: snappedZPx,
        });
        const wallSnapDistancePx = Math.hypot(
          Number(wallSnapTarget.xPx ?? snappedXPx) - snappedXPx,
          Number(wallSnapTarget.zPx ?? snappedZPx) - snappedZPx,
        );
        const wallSnapActive = snapActive && !neighborSnap && wallSnapDistancePx <= wallSnapThresholdPx;
        if (wallSnapActive) {
          snappedXPx = wallSnapTarget.xPx;
          snappedZPx = wallSnapTarget.zPx;
        }
        const candidateRotationDeg = Number(currentBoxes[box.index]?.rotationDeg) || 0;
        const candidate = {
          index: box.index,
          xPx: snappedXPx,
          zPx: snappedZPx,
          widthPx: box.widthPx,
          depthPx: box.depthPx,
          heightPx: box.heightPx,
          type: movingSourceBox.type,
          rotationDeg: candidateRotationDeg,
          backWallSnap: wallSnapActive,
          activeWall: wallSnapTarget.wall,
          targetIndex: neighborSnap?.targetIndex ?? null,
          snapSide: neighborSnap?.snapSide ?? null,
          neighborSnap: snapActive && Boolean(neighborSnap),
          ...getBoxBounds(snappedXPx, snappedZPx, box.widthPx, box.depthPx, candidateRotationDeg),
        };
        candidate.outsideRoom = (
          candidate.left < -roomWidthPx / 2 ||
          candidate.right > roomWidthPx / 2 ||
          candidate.zMin < -roomDepthPx / 2 ||
          candidate.zMax > roomDepthPx / 2
        );
        return candidate;
      });

      const blockedByOverlap = candidateBoxes.some((candidate) =>
        otherBoxes.some((other) => boxesOverlap(candidate, other, 2))
      );
      const invalidPlacement = blockedByOverlap || candidateBoxes.some((candidate) => candidate.outsideRoom);

      const nextPreviews = candidateBoxes.map((box) => ({
        index: box.index,
        xPx: box.xPx,
        zPx: box.zPx,
        widthPx: box.widthPx,
        depthPx: box.depthPx,
        heightPx: box.heightPx,
        rotationDeg: box.rotationDeg,
        backWallSnap: box.backWallSnap,
        activeWall: box.activeWall,
        targetIndex: box.targetIndex,
        snapSide: box.snapSide,
        neighborSnap: box.neighborSnap,
        invalidPlacement,
      }));

      lowerMoveDragRef.current.previewBoxes = nextPreviews;
      lowerMoveDragRef.current.invalidPlacement = invalidPlacement;
      setMoveSnapPreview(nextPreviews);
      return;
    }

    if (!viewportDragRef.current.active) return;
    const dx = event.clientX - viewportDragRef.current.startX;
    const dy = event.clientY - viewportDragRef.current.startY;

    if (viewportDragRef.current.mode === "pan") {
      setState((prev) => ({
        ...prev,
        panX: viewportDragRef.current.panX + dx,
        panY: viewportDragRef.current.panY + dy,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      orbit: viewportDragRef.current.orbit + dx * 0.18,
      tilt: clamp(viewportDragRef.current.tilt - dy * 0.14, -80, 80),
    }));
  };

  const handleViewportMouseUp = () => {
    const hadMoveDrag = lowerMoveDragRef.current.active;
    const hadRotateDrag = lowerRotateDragRef.current.active;
    const hadPushPullDrag = lowerPushPullDragRef.current.active;
    const hadCountertopPushPullDrag = countertopPushPullDragRef.current.active;
    const previewBoxes = lowerMoveDragRef.current.previewBoxes || [];
    const moveWasInvalid = Boolean(lowerMoveDragRef.current.invalidPlacement);

    viewportDragRef.current.active = false;
    
    lowerPushPullDragRef.current.active = false;
    countertopPushPullDragRef.current.active = false;
    countertopPushPullDragRef.current.draft = null;
    if (lowerMoveDragRef.current.snapReleaseTimer) {
      clearTimeout(lowerMoveDragRef.current.snapReleaseTimer);
      lowerMoveDragRef.current.snapReleaseTimer = null;
    }
    lowerMoveDragRef.current.currentNeighborSnapKey = null;
    lowerMoveDragRef.current.neighborSnapReleased = false;
    lowerMoveDragRef.current.previewBoxes = [];
    lowerMoveDragRef.current.invalidPlacement = false;
    setMoveSnapPreview([]);

    if (hadMoveDrag && previewBoxes.length && !moveWasInvalid) {
      skipLowerMirrorRef.current = true;
      setState((prev) => {
        const nextLowerBoxes = [...(prev.lowerBoxes?.length ? prev.lowerBoxes : [prev.cabinet])];
        const committedRenderBoxes = getLowerRenderLayout(nextLowerBoxes, 10, prev.roomDepth * 10);
        previewBoxes.forEach((preview) => {
          if (!nextLowerBoxes[preview.index]) return;

          let committedXPx = preview.xPx;
          let committedZPx = preview.zPx;
          if (preview.neighborSnap && Number.isInteger(preview.targetIndex) && preview.snapSide && previewBoxes.length === 1) {
            const movingRender = committedRenderBoxes[preview.index];
            const targetRender = committedRenderBoxes[preview.targetIndex];
            if (movingRender && targetRender) {
              const exactSnap = getExactNeighborSnapPosition({
                movingXPx: preview.xPx,
                movingZPx: preview.zPx,
                movingWidthPx: movingRender.widthPx,
                movingRotationDeg: Number(movingRender.renderRotationDeg ?? movingRender.rotationDeg) || 0,
                targetXPx: targetRender.renderX,
                targetZPx: targetRender.renderZ,
                targetWidthPx: targetRender.widthPx,
                targetRotationDeg: Number(targetRender.renderRotationDeg ?? targetRender.rotationDeg) || 0,
                snapSide: preview.snapSide,
              });
              committedXPx = exactSnap.xPx;
              committedZPx = exactSnap.zPx;
            }
          }

          nextLowerBoxes[preview.index] = {
            ...nextLowerBoxes[preview.index],
            activeWall: preview.activeWall ?? nextLowerBoxes[preview.index]?.activeWall ?? inferActiveWallFromRotationDeg(nextLowerBoxes[preview.index]?.rotationDeg ?? 0),
            positionX: committedXPx / 10,
            positionZ: committedZPx / 10,
          };
        });
        const persistedLowerBoxes = persistResolvedLowerFrontStates(nextLowerBoxes, prev.roomDepth, 10);
        const nextActiveBox = persistedLowerBoxes[selectedLowerIndex] || prev.cabinet;
        return {
          ...prev,
          lowerBoxes: persistedLowerBoxes,
          cabinet: selectedLowerIndices.length === 1 ? nextActiveBox : prev.cabinet,
        };
      });
    }

    if (hadCountertopPushPullDrag) {
      markViewportInteraction();
    }

    if (hadPushPullDrag) {
      const drag = lowerPushPullDragRef.current;
      if (drag.invalidPlacement && drag.index != null && drag.previousBox) {
        skipLowerMirrorRef.current = true;
        setState((prev) => {
          const nextLowerBoxes = [...(prev.lowerBoxes?.length ? prev.lowerBoxes : [prev.cabinet])];
          nextLowerBoxes[drag.index] = { ...drag.previousBox };
          return {
            ...prev,
            lowerBoxes: nextLowerBoxes,
            cabinet: drag.index === selectedLowerIndex ? nextLowerBoxes[drag.index] : prev.cabinet,
          };
        });
      }
    }

    if (hadRotateDrag) {
      skipLowerMirrorRef.current = true;
      setState((prev) => {
        const existingLowerBoxes = [...(prev.lowerBoxes?.length ? prev.lowerBoxes : [prev.cabinet])];
        const persistedLowerBoxes = persistResolvedLowerFrontStates(existingLowerBoxes, prev.roomDepth, 10);
        if (persistedLowerBoxes === existingLowerBoxes) return prev;
        return {
          ...prev,
          lowerBoxes: persistedLowerBoxes,
          cabinet: persistedLowerBoxes[selectedLowerIndex] || prev.cabinet,
        };
      });
    }

    markViewportInteraction();
  };

  const handleViewportWheel = (event) => {
    event.preventDefault();
    event.stopPropagation();
    markViewportInteraction();
    setState((prev) => ({
      ...prev,
      zoom: clamp(prev.zoom - event.deltaY * 0.0015, 0.12, 3.25),
    }));
  };

  useEffect(() => {
    if (hoveredElement === "upper" && !state.uppers) {
      setHoveredElement(null);
    }
    if (hoveredElement === "countertop" && !state.countertop) {
      setHoveredElement(null);
    }
  }, [hoveredElement, state.uppers, state.countertop]);

  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(UI_SETTINGS_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      setUiPrefs((prev) => ({ ...prev, ...parsed }));
    } catch (error) {
      console.warn("Unable to restore UI settings", error);
    }
  }, []);

  useEffect(() => {
    if (toolTab === "shopDrawing") {
      lowerMoveDragRef.current.active = false;
      lowerRotateDragRef.current.active = false;
      lowerPushPullDragRef.current.active = false;
      if (lowerMoveDragRef.current.snapReleaseTimer) {
        clearTimeout(lowerMoveDragRef.current.snapReleaseTimer);
        lowerMoveDragRef.current.snapReleaseTimer = null;
      }
      lowerMoveDragRef.current.currentNeighborSnapKey = null;
      lowerMoveDragRef.current.neighborSnapReleased = false;
      setMoveSnapPreview([]);
      if (moveToolActive) setMoveToolActive(false);
      if (rotateToolActive) setRotateToolActive(false);
      return;
    }

    if (!moveToolActive) {
      lowerMoveDragRef.current.active = false;
      if (lowerMoveDragRef.current.snapReleaseTimer) {
        clearTimeout(lowerMoveDragRef.current.snapReleaseTimer);
        lowerMoveDragRef.current.snapReleaseTimer = null;
      }
      lowerMoveDragRef.current.currentNeighborSnapKey = null;
      lowerMoveDragRef.current.neighborSnapReleased = false;
      setMoveSnapPreview([]);
    }
  }, [moveToolActive, rotateToolActive, toolTab]);

  useEffect(() => {
    if (!rotateToolActive) {
      lowerRotateDragRef.current.active = false;
    }
    if (!pushPullToolActive) {
      lowerPushPullDragRef.current.active = false;
      countertopPushPullDragRef.current.active = false;
      countertopPushPullDragRef.current.draft = null;
    }
  }, [rotateToolActive, pushPullToolActive]);

  useEffect(() => {
    try {
      window.localStorage.setItem(UI_SETTINGS_STORAGE_KEY, JSON.stringify(uiPrefs));
    } catch (error) {
      console.warn("Unable to save UI settings", error);
    }
  }, [uiPrefs]);


  useEffect(() => {
    const onKeyDown = (event) => {
      const key = String(event.key || "").toLowerCase();
      const hasCommandModifier = event.metaKey || event.ctrlKey;

      if (hasCommandModifier && !event.altKey) {
        if (isEditableElement(event.target)) return;

        if (key === "c") {
          event.preventDefault();
          handleCopySelectedLowerBoxes();
          return;
        }

        if (key === "x") {
          event.preventDefault();
          handleCopySelectedLowerBoxes({ cut: true });
          return;
        }

        if (key === "v") {
          event.preventDefault();
          handlePasteLowerBoxes();
          return;
        }

        if (key === "z") {
          event.preventDefault();
          if (event.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          return;
        }

        if (key === "y") {
          event.preventDefault();
          handleRedo();
          return;
        }
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableElement(event.target)) return;
      if (key === "m") {
        event.preventDefault();
        if (toolTab === "shopDrawing") return;
        setMoveToolActive(true);
        setRotateToolActive(false);
        setPushPullToolActive(false);
        return;
      }

      if (key === "r") {
        event.preventDefault();
        if (toolTab === "shopDrawing") return;
        setRotateToolActive(true);
        setMoveToolActive(false);
        setPushPullToolActive(false);
        return;
      }

      if (key === "e") {
        event.preventDefault();
        if (toolTab === "shopDrawing") return;
        setPushPullToolActive(true);
        setMoveToolActive(false);
        setRotateToolActive(false);
        return;
      }

      if (key === "delete" || key === "backspace") {
        event.preventDefault();
        handleDeleteSelectedBoxes();
        return;
      }

      if (key === "p") {
        event.preventDefault();
        setState((prev) => ({ ...prev, dragMode: "pan" }));
        return;
      }

      if (key === "o") {
        event.preventDefault();
        setState((prev) => ({ ...prev, dragMode: "orbit" }));
        return;
      }

      if (key === "q") {
        event.preventDefault();
        setMoveToolActive(false);
        setRotateToolActive(false);
        setPushPullToolActive(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedElement, selectedLowerIndices, selectedLowerIndex, state.lowerBoxes, state.cabinet, state.uppers, toolTab]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!event.target.closest?.("[data-camera-menu]")) {
        setCameraMenuOpen(false);
      }
      if (!event.target.closest?.("[data-view-menu]")) {
        setViewMenuOpen(false);
      }
      if (!event.target.closest?.("[data-help-menu]")) {
        setHelpMenuOpen(false);
      }
      if (!event.target.closest?.("[data-globals-menu]")) {
        setGlobalsMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    const stopDrag = () => {
      viewportDragRef.current.active = false;
      lowerMoveDragRef.current.active = false;
      lowerRotateDragRef.current.active = false;
      lowerPushPullDragRef.current.active = false;
      countertopPushPullDragRef.current.active = false;
      countertopPushPullDragRef.current.draft = null;
      if (lowerMoveDragRef.current.snapReleaseTimer) {
        clearTimeout(lowerMoveDragRef.current.snapReleaseTimer);
        lowerMoveDragRef.current.snapReleaseTimer = null;
      }
      lowerMoveDragRef.current.currentNeighborSnapKey = null;
      lowerMoveDragRef.current.neighborSnapReleased = false;
      setMoveSnapPreview([]);
      markViewportInteraction();
    };

    const handleGlobalInteraction = () => {
      markViewportInteraction();
    };

    const tick = (now) => {
      const idleFor = now - lastInteractionRef.current;
      const canRotate = idleFor >= IDLE_AUTO_ROTATE_DELAY_MS && !viewportDragRef.current.active && !lowerMoveDragRef.current.active && !lowerRotateDragRef.current.active;

      if (canRotate) {
        const last = autoRotateLastTimeRef.current ?? now;
        const delta = now - last;
        autoRotateLastTimeRef.current = now;

        if (delta > 0) {
          setState((prev) => ({
            ...prev,
            orbit: prev.orbit + delta * IDLE_AUTO_ROTATE_SPEED_DEG_PER_MS,
          }));
        }
      } else {
        autoRotateLastTimeRef.current = null;
      }

      autoRotateFrameRef.current = requestAnimationFrame(tick);
    };

    autoRotateFrameRef.current = requestAnimationFrame(tick);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("pointerdown", handleGlobalInteraction);
    window.addEventListener("keydown", handleGlobalInteraction);

    return () => {
      if (historyCommitTimerRef.current) {
        clearTimeout(historyCommitTimerRef.current);
      }
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("pointerdown", handleGlobalInteraction);
      window.removeEventListener("keydown", handleGlobalInteraction);
      if (autoRotateFrameRef.current) {
        cancelAnimationFrame(autoRotateFrameRef.current);
      }
    };
  }, []);

  const spacingPreset = SPACING_PRESETS[uiPrefs.spacingMode] || SPACING_PRESETS.standard;
  const activeEditorBasePreset = ACTIVE_EDITOR_PRESETS[uiPrefs.activeEditorMode] || ACTIVE_EDITOR_PRESETS.medium;
  const viewportWidth = Math.max(1024, viewportSize.width || 1440);
  const viewportHeight = Math.max(720, viewportSize.height || 900);
  const viewportScale = clamp(Math.min(viewportWidth / 1440, viewportHeight / 900), 0.86, 1.18);
  const uiDensityScale = clamp(spacingPreset.density * viewportScale, 0.72, 1.28);
  const compactEditorAdjustment = uiPrefs.spacingMode === "compact" ? 0.88 : uiPrefs.spacingMode === "cozy" ? 1.03 : 1;
  const activeEditorPreset = {
    collapsedWidth: `${Math.round(clamp(viewportWidth * activeEditorBasePreset.collapsedWidthRatio * (uiPrefs.spacingMode === "compact" ? 0.9 : 1), 260, 420))}px`,
    expandedWidth: "calc(100vw - 2rem)",
    expandedMaxHeight: Math.round(clamp(viewportHeight * activeEditorBasePreset.expandedHeightRatio * compactEditorAdjustment, 220, viewportHeight - 150)),
    contentMaxHeight: Math.round(clamp(viewportHeight * activeEditorBasePreset.contentHeightRatio * compactEditorAdjustment, 150, viewportHeight - 240)),
  };
  const isLowProfileActiveEditor = uiPrefs.activeEditorMode === "low";
  const isLargeActiveEditor = uiPrefs.activeEditorMode === "large";
  const baseThemeVars = isDarkMode ? DARK_THEME_VARS : LIGHT_THEME_VARS;
  const themeVars = uiPrefs.highContrast ? getHighContrastThemeVars(baseThemeVars, isDarkMode) : baseThemeVars;
  const uiScaleVars = {
    "--ui-control-pad-x": `${(12 * uiDensityScale).toFixed(1)}px`,
    "--ui-control-pad-y": `${(8 * uiDensityScale).toFixed(1)}px`,
    "--ui-card-pad": `${(16 * uiDensityScale).toFixed(1)}px`,
    "--ui-panel-pad": `${(12 * uiDensityScale).toFixed(1)}px`,
    "--ui-section-gap": `${(16 * uiDensityScale).toFixed(1)}px`,
    "--ui-font-scale": String((uiPrefs.largeFont ? spacingPreset.fontScale * viewportScale * 1.08 : spacingPreset.fontScale * viewportScale).toFixed(3)),
  };

  const applyCameraViewPreset = (presetKey) => {
    const preset = CAMERA_VIEW_PRESETS[presetKey];
    if (!preset) return;
    markViewportInteraction();
    setState((prev) => ({
      ...prev,
      orbit: preset.orbit,
      tilt: preset.tilt,
      panX: preset.panX,
      panY: preset.panY,
    }));
    setViewMenuOpen(false);
  };

  const toggleFullscreen = async () => {
    try {
      if (typeof document === "undefined") return;
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
        return;
      }
      await document.documentElement?.requestFullscreen?.();
    } catch (error) {
      console.warn("Unable to toggle fullscreen", error);
    }
  };

  return (
    <div className="cabinetkit-ui min-h-screen" style={{ ...themeVars, ...uiScaleVars, background: "var(--app-bg)", color: "var(--text-main)", fontSize: `calc(16px * var(--ui-font-scale))`, userSelect: "none", WebkitUserSelect: "none", WebkitUserDrag: "none" }}>
      <style>{`
        .cabinetkit-ui .ck-pill { padding: var(--ui-control-pad-y) var(--ui-control-pad-x); }
        .cabinetkit-ui .ck-icon-pill { width: calc(40px * var(--ui-font-scale)); height: calc(40px * var(--ui-font-scale)); }
        .cabinetkit-ui .ck-toggle { padding: var(--ui-control-pad-y) var(--ui-control-pad-x); }
        .cabinetkit-ui .ck-number-input { padding: var(--ui-control-pad-y) var(--ui-control-pad-x); padding-right: calc(48px * var(--ui-font-scale)); }
        .cabinetkit-ui .ck-tab { padding: calc(var(--ui-control-pad-y) - 1px) var(--ui-control-pad-x); }
        .cabinetkit-ui button, .cabinetkit-ui svg, .cabinetkit-ui img { -webkit-user-drag: none; user-select: none; }
      `}</style>
      {/* Full-screen studio stage */}
      <div className="fixed inset-0">
        <ViewportBackground
          state={state}
          selectedElement={selectedElement}
          selectedLowerIndex={selectedLowerIndex}
          selectedLowerIndices={selectedLowerIndices}
          setSelectedElement={setSelectedElement}
          setHoveredElement={setHoveredElement}
          setHoveredLowerIndex={setHoveredLowerIndex}
          onSelectLower={handleSelectLower}
          onToggleLowerDoors={handleToggleLowerDoors}
          onToggleLowerDrawers={handleToggleLowerDrawers}
          onToggleUpperDoors={handleToggleUpperDoors}
          moveToolActive={moveToolActive}
          rotateToolActive={rotateToolActive}
          pushPullToolActive={pushPullToolActive}
          interactionLocked={interactionLocked}
          moveSnapPreview={moveSnapPreview}
          onStartMoveLower={handleStartMoveLower}
          onStartRotateLower={handleStartRotateLower}
          onStartPushPullLower={handleStartPushPullLower}
          onStartPushPullCountertop={handleStartPushPullCountertop}
          pushPullDraft={lowerPushPullDragRef.current}
          countertopPushPullDraft={countertopPushPullDragRef.current}
          onViewportMouseDown={handleViewportMouseDown}
          onViewportMouseMove={handleViewportMouseMove}
          onViewportMouseUp={handleViewportMouseUp}
          onViewportWheel={handleViewportWheel}
          toolTab={toolTab}
          shopDrawingNotes={shopDrawingNotes}
          shopDrawingNoteMode={shopDrawingNoteMode}
          shopDrawingDimensions={shopDrawingDimensions}
          shopDrawingAutoDimensionsEnabled={shopDrawingAutoDimensionsEnabled}
          shopDrawingDimensionMode={shopDrawingDimensionMode}
          shopDrawingEraseMode={shopDrawingEraseMode}
          onAddShopDrawingNote={handleAddShopDrawingNote}
          onAddShopDrawingDimension={({ kind = "manual", text, startWorld, endWorld, offsetPx = 24 }) => {
            setShopDrawingDimensions((prev) => [
              ...prev,
              {
                id: `shop-dimension-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                kind,
                text,
                startWorld,
                endWorld,
                offsetPx,
              },
            ]);
          }}
          onRemoveShopDrawingDimension={(dimensionId) => {
            setShopDrawingDimensions((prev) => prev.filter((dimension) => dimension.id !== dimensionId));
          }}
          viewportSize={viewportSize}
        />
      </div>

      {/* Fixed top menu bar */}
      <input
        ref={uploadInputRef}
        type="file"
        accept=".ckit"
        className="hidden"
        onChange={handleUploadKitFile}
      />

      <div className="fixed left-4 right-4 top-4 z-40">
        <GlassCard className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 md:h-10 w-[170px] md:w-[210px] overflow-hidden shrink-0 flex items-center">
              <img
                src={isDarkMode ? cabinetkitLogoDark : cabinetkitLogoLight}
                alt="CabinetKit Studio"
                className="h-10 md:h-11 w-auto max-w-none object-contain shrink-0"
                style={{ transform: "scale(2.35)", transformOrigin: "left center" }}
                draggable={false}
              />
            </div>
              <div className="min-w-0">
                <input
                  type="text"
                  value={state.projectName}
                  onChange={(event) => setState((prev) => ({ ...prev, projectName: event.target.value }))}
                  className="w-full min-w-[140px] max-w-[320px] rounded-xl border border-transparent bg-transparent px-2 py-1 text-xl font-semibold outline-none transition"
                  style={{ color: "var(--text-main)" }}
                  placeholder="My Kit"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <PillButton active={layoutComingSoonOpen} onClick={() => setLayoutComingSoonOpen(true)}>Layout</PillButton>
              <PillButton active={toolTab === "studio"} onClick={() => handleToolTabChange("studio")}>Studio</PillButton>
              <PillButton active={toolTab === "shopDrawing"} onClick={() => handleToolTabChange("shopDrawing")}>Drawings</PillButton>
              <div className="mx-1 h-7 w-px" style={{ background: "var(--panel-border)" }} />              <PillButton onClick={handleTriggerUploadKit}>Upload Kit</PillButton>
              <PillButton onClick={handleSaveKit}>Save Your Kit</PillButton>
              <PillButton>Shop Drawing PDF</PillButton>
              <div className="relative ml-auto" data-help-menu>
                <IconOnlyPillButton
                  active={helpMenuOpen}
                  onClick={() => setHelpMenuOpen((prev) => !prev)}
                  aria-label="Help"
                  title="Help"
                  icon={
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4" />
                      <path d="M12 17h.01" />
                    </svg>
                  }
                />
                {helpMenuOpen && (
                  <div
                    className="absolute right-12 top-full z-[9999] mt-2 w-[420px] max-w-[calc(100vw-2rem)] rounded-[24px] border p-4"
                    style={{
                      borderColor: "var(--glass-border)",
                      background: "var(--glass-bg)",
                      boxShadow: "var(--glass-shadow)",
                      backdropFilter: "blur(24px)",
                    }}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>Help</div>
                    <div className="mt-1 text-sm font-semibold" style={{ color: "var(--text-main)" }}>Hints, shortcuts, and viewport tools</div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border p-3" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
                        <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>Shortcuts</div>
                        <div className="mt-2 space-y-1 text-sm" style={{ color: "var(--text-soft)" }}>
                          <div><strong>Cmd/Ctrl + Click</strong> multi-select lower boxes</div>
                          <div><strong>Cmd/Ctrl + C</strong> copy selected lower boxes</div>
                          <div><strong>Cmd/Ctrl + X</strong> cut selected lower boxes</div>
                          <div><strong>Cmd/Ctrl + V</strong> paste after current selection</div>
                          <div><strong>M</strong> enable Move tool</div>
                          <div><strong>R</strong> enable Rotate tool</div>
                          <div><strong>E</strong> enable Push/Pull tool</div>
                          <div><strong>Q</strong> exit active transform tool</div>
                          <div><strong>P</strong> switch to Pan</div>
                          <div><strong>O</strong> switch to Orbit</div>
                          <div><strong>Delete</strong> remove selected lower boxes or upper</div>
                        </div>
                      </div>

                      <div className="rounded-2xl border p-3" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
                        <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>Viewport</div>
                        <div className="mt-2 space-y-1 text-sm" style={{ color: "var(--text-soft)" }}>
                          <div>Drag to orbit</div>
                          <div><strong>Shift + Drag</strong> or <strong>Pan</strong> mode to pan</div>
                          <div>Scroll to zoom</div>
                          <div>Use the cube icon for Top, Front, Right, and Iso views</div>
                          <div>Parallel mode now zooms correctly</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl border p-3" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
                      <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>Move / Rotate tips</div>
                      <div className="mt-2 space-y-1 text-sm" style={{ color: "var(--text-soft)" }}>
                        <div>Move uses a 1” floor grid and can be grabbed from the front or top.</div>
                        <div>Quick Snap magnetizes nearby boxes and aligns front faces.</div>
                        <div>Rotate snaps in 15° increments from the top hit area.</div>
                        <div>Walls fade when they are the near obstructing wall, but stay visible in top view.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative" data-globals-menu>
                <IconOnlyPillButton
                  active={globalsMenuOpen}
                  onClick={() => setGlobalsMenuOpen((prev) => !prev)}
                  aria-label="Globals"
                  title="Globals"
                  icon={
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.92 4.6H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.36.47.56 1.06.6 1.66V11a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  }
                />
                {globalsMenuOpen && (
                  <div
                    className="absolute right-0 top-full z-[9999] mt-2 w-[340px] rounded-[24px] border p-3"
                    style={{
                      borderColor: "var(--glass-border)",
                      background: "var(--glass-bg)",
                      boxShadow: "var(--glass-shadow)",
                      backdropFilter: "blur(24px)",
                    }}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>Globals</div>
                    <div className="mt-1 text-sm font-semibold" style={{ color: "var(--text-main)" }}>Studio interface settings</div>

                    <div className="mt-3 rounded-2xl border p-3" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
                      <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>Spacing</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          { value: "compact", label: "Compact" },
                          { value: "standard", label: "Standard" },
                          { value: "cozy", label: "Cozy" },
                        ].map((option) => (
                          <PillButton
                            key={option.value}
                            active={uiPrefs.spacingMode === option.value}
                            onClick={() => setUiPrefs((prev) => ({ ...prev, spacingMode: option.value }))}
                          >
                            {option.label}
                          </PillButton>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2">
                      <ToggleRow
                        label="Dark mode"
                        checked={isDarkMode}
                        onChange={(e) => setIsDarkMode(e.target.checked)}
                      />
                      <ToggleRow
                        label="Large font"
                        checked={uiPrefs.largeFont}
                        onChange={(e) => setUiPrefs((prev) => ({ ...prev, largeFont: e.target.checked }))}
                      />
                      <ToggleRow
                        label="High contrast"
                        checked={uiPrefs.highContrast}
                        onChange={(e) => setUiPrefs((prev) => ({ ...prev, highContrast: e.target.checked }))}
                      />
                    </div>

                    <div className="mt-3 rounded-2xl border p-3 text-xs" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-muted)" }}>
                      Saved in your browser automatically so the studio opens with your preferred UI settings next time.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Floating viewport controls */}
      <div className="fixed right-4 top-[108px] z-30 max-w-[calc(100vw-2rem)]">
        <GlassCard className="ml-auto w-fit max-w-full p-3" style={{ overflow: "visible" }}>
          <div
            className="flex flex-nowrap items-center gap-2 whitespace-nowrap"
            style={{ overflowX: "visible", overflowY: "visible" }}
          >
            <IconOnlyPillButton
              onClick={handleUndo}
              aria-label="Undo"
              title="Undo"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 7H6V3" />
                  <path d="M6 7c1.8-2.3 4.5-3.5 7.4-3.5 5 0 9 4 9 9" />
                </svg>
              }
            />
            <IconOnlyPillButton
              onClick={handleRedo}
              aria-label="Redo"
              title="Redo"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 7h4V3" />
                  <path d="M18 7c-1.8-2.3-4.5-3.5-7.4-3.5-5 0-9 4-9 9" />
                </svg>
              }
            />
            <PillButton active={state.viewportWall === "all"} onClick={() => setState((prev) => ({ ...prev, viewportWall: "all" }))}>All Walls</PillButton>
            <PillButton active={state.viewportWall === 1} onClick={() => setState((prev) => ({ ...prev, viewportWall: 1 }))}>Section One</PillButton>

            <div className="relative shrink-0" data-camera-menu>
              <PillButton active={cameraMenuOpen} onClick={() => setCameraMenuOpen((prev) => !prev)}>
                <span className="inline-flex items-center gap-2">
                  <span>Camera</span>
                  <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${cameraMenuOpen ? "rotate-180" : "rotate-0"}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </PillButton>

              {cameraMenuOpen && (
                <div
                  className="absolute left-0 top-full z-[9999] mt-2 flex min-w-[170px] flex-col gap-2 rounded-2xl border p-2"
                  style={{
                    borderColor: "var(--glass-border)",
                    background: "var(--glass-bg)",
                    boxShadow: "var(--glass-shadow)",
                    backdropFilter: "blur(24px)",
                  }}
                >
                  <PillButton
                    active={state.cameraMode === "perspective"}
                    onClick={() => {
                      setState((prev) => ({ ...prev, cameraMode: "perspective" }));
                      setCameraMenuOpen(false);
                    }}
                  >
                    Perspective
                  </PillButton>
                  <PillButton
                    active={state.cameraMode === "parallel"}
                    onClick={() => {
                      setState((prev) => ({ ...prev, cameraMode: "parallel" }));
                      setCameraMenuOpen(false);
                    }}
                  >
                    Parallel
                  </PillButton>
                </div>
              )}
            </div>

            <div className="relative shrink-0" data-view-menu>
              <IconOnlyPillButton
                active={viewMenuOpen}
                onClick={() => setViewMenuOpen((prev) => !prev)}
                aria-label="View presets"
                title="View presets"
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
                    <path d="M12 3v18" />
                    <path d="M4 7.5l8 4.5 8-4.5" />
                  </svg>
                }
              />

              {viewMenuOpen && (
                <div
                  className="absolute right-0 top-full z-[9999] mt-2 flex min-w-[170px] flex-col gap-2 rounded-2xl border p-2"
                  style={{
                    borderColor: "var(--glass-border)",
                    background: "var(--glass-bg)",
                    boxShadow: "var(--glass-shadow)",
                    backdropFilter: "blur(24px)",
                  }}
                >
                  <PillButton onClick={() => applyCameraViewPreset("top")}>Top</PillButton>
                  <PillButton onClick={() => applyCameraViewPreset("front")}>Front</PillButton>
                  <PillButton onClick={() => applyCameraViewPreset("right")}>Right Side</PillButton>
                  <PillButton onClick={() => applyCameraViewPreset("isoLeft")}>Iso Left</PillButton>
                  <PillButton onClick={() => applyCameraViewPreset("isoRight")}>Iso Right</PillButton>
                </div>
              )}
            </div>

            <PillButton active={state.dragMode === "pan"} onClick={() => setState((prev) => ({ ...prev, dragMode: "pan" }))} title="Pan (P)">Pan</PillButton>
            <PillButton active={state.dragMode === "orbit"} onClick={() => setState((prev) => ({ ...prev, dragMode: "orbit" }))} title="Orbit (O)">Orbit</PillButton>
            <IconOnlyPillButton
              onClick={() => setState((prev) => ({ ...prev, zoom: clamp(prev.zoom + 0.1, 0.12, 3.25) }))}
              aria-label="Zoom in"
              title="Zoom in"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="6" />
                  <path d="M20 20l-3.5-3.5" />
                  <path d="M11 8v6" />
                  <path d="M8 11h6" />
                </svg>
              }
            />
            <IconOnlyPillButton
              onClick={() => setState((prev) => ({ ...prev, zoom: clamp(prev.zoom - 0.1, 0.12, 3.25) }))}
              aria-label="Zoom out"
              title="Zoom out"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="6" />
                  <path d="M20 20l-3.5-3.5" />
                  <path d="M8 11h6" />
                </svg>
              }
            />
            <IconOnlyPillButton
              active={isFullscreen}
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              icon={
                isFullscreen ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 3H3v6" />
                    <path d="M15 3h6v6" />
                    <path d="M3 15v6h6" />
                    <path d="M21 15v6h-6" />
                    <path d="M8 8 3 3" />
                    <path d="m16 8 5-5" />
                    <path d="m8 16-5 5" />
                    <path d="m16 16 5 5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 3H3v6" />
                    <path d="M15 3h6v6" />
                    <path d="M3 15v6h6" />
                    <path d="M21 15v6h-6" />
                    <path d="M8 8V3H3" />
                    <path d="M16 8V3h5" />
                    <path d="M8 16v5H3" />
                    <path d="M16 16v5h5" />
                  </svg>
                )
              }
            />
            
                      </div>
        </GlassCard>
      </div>

      {/* Floating left side stack */}
      <div className="fixed left-4 top-[108px] z-30 flex max-w-[calc(100vw-2rem)] flex-col gap-6">
        <div
          className="max-w-[calc(100vw-2rem)] transition-[width] duration-360 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: wallToolsCollapsed ? "188px" : "1040px" }}
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => setWallToolsCollapsed((prev) => !prev)}
              aria-label={wallToolsCollapsed ? "Expand wall tools" : "Collapse wall tools"}
              className="absolute -bottom-3 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-2xl transition-all duration-300 hover:opacity-90"
              style={{
                borderColor: "var(--glass-border)",
                background: "var(--glass-bg)",
                color: "var(--text-soft)",
                boxShadow: "var(--glass-shadow)",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 transition-transform duration-300 ${wallToolsCollapsed ? "rotate-180" : "rotate-0"}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 14l6-6 6 6" />
              </svg>
            </button>

            <GlassCard
              className="overflow-hidden px-4 py-4 transition-[max-height,padding] duration-360 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ maxHeight: wallToolsCollapsed ? "72px" : "560px" }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-muted)" }}>
                Section One
              </div>

              <div
                className="transition-[max-height,opacity,transform,margin-top] duration-360 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  maxHeight: wallToolsCollapsed ? "0px" : "492px",
                  opacity: wallToolsCollapsed ? 0 : 1,
                  transform: wallToolsCollapsed ? "translateY(-8px)" : "translateY(0px)",
                  marginTop: wallToolsCollapsed ? "0px" : "16px",
                  overflow: "hidden",
                  pointerEvents: wallToolsCollapsed ? "none" : "auto",
                }}
              >
                <div className="grid gap-4 xl:grid-cols-3">
                  <div
                    className="rounded-2xl border p-3"
                    style={{
                      borderColor: "var(--panel-border)",
                      background: "var(--panel-bg)",
                    }}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                      Lower Cabinets
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <NumberField
                        label="W"
                        value={state.sectionDefaults.width}
                        min={6}
                        max={40}
                        beforeChange={confirmSectionBoxChange}
                        onBlur={resetSectionBoxEditAuthorization}
                        onChange={(e) => {
                          const value = clamp(Number(e.target.value) || 15, 6, 40);
                          updateSectionDefaults({ width: value });
                        }}
                      />
                      <NumberField
                        label="H"
                        value={state.sectionDefaults.height}
                        min={12}
                        max={60}
                        beforeChange={confirmSectionBoxChange}
                        onBlur={resetSectionBoxEditAuthorization}
                        onChange={(e) => {
                          const value = clamp(Number(e.target.value) || 29.75, 12, 60);
                          updateSectionDefaults({ height: value });
                        }}
                      />
                      <NumberField
                        label="D"
                        value={state.sectionDefaults.depth}
                        min={2}
                        max={96}
                        beforeChange={confirmSectionBoxChange}
                        onBlur={resetSectionBoxEditAuthorization}
                        onChange={(e) => {
                          const value = clamp(Number(e.target.value) || 23, 2, 96);
                          updateSectionDefaults({ depth: value });
                        }}
                      />
                    </div>

                    <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--panel-border)" }}>
                      <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                        Kick
                      </div>
                      <div className="mt-3">
                        <ToggleRow
                          label="On"
                          checked={state.sectionDefaults.kickEnabled ?? true}
                          onChange={(e) => {
                            updateSectionDefaults({ kickEnabled: e.target.checked });
                            resetSectionBoxEditAuthorization();
                          }}
                        />
                      </div>
                      {(state.sectionDefaults.kickEnabled ?? true) ? (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <NumberField
                            label="Height"
                            value={state.sectionDefaults.toeKickHeight}
                            min={0}
                            max={12}
                            beforeChange={confirmSectionBoxChange}
                            onBlur={resetSectionBoxEditAuthorization}
                            onChange={(e) => {
                              const value = clamp(Number(e.target.value) || 3, 0, 12);
                              updateSectionDefaults({ toeKickHeight: value });
                            }}
                          />
                          <NumberField
                            label="Depth"
                            value={state.sectionDefaults.toeKickDepth}
                            min={0}
                            max={12}
                            beforeChange={confirmSectionBoxChange}
                            onBlur={resetSectionBoxEditAuthorization}
                            onChange={(e) => {
                              const value = clamp(Number(e.target.value) || 3, 0, 12);
                              updateSectionDefaults({ toeKickDepth: value });
                            }}
                          />
                        </div>
                      ) : (
                        <div className="mt-3 grid grid-cols-1 gap-2">
                          <NumberField
                            label="Above Floor"
                            value={state.sectionDefaults.aboveFloor}
                            min={0}
                            max={96}
                            beforeChange={confirmSectionBoxChange}
                            onBlur={resetSectionBoxEditAuthorization}
                            onChange={(e) => {
                              const value = clamp(Number(e.target.value) || 0, 0, 96);
                              updateSectionDefaults({ aboveFloor: value });
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className="rounded-2xl border p-3"
                    style={{
                      borderColor: "var(--panel-border)",
                      background: "var(--panel-bg)",
                    }}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                      Upper Cabinets
                    </div>

                    <div className="mt-3">
                      <ToggleRow
                        label="Enabled"
                        checked={state.uppers}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setState((prev) => ({ ...prev, uppers: checked }));
                          if (checked) setSelectedElement("upper");
                          if (!checked && selectedElement === "upper") setSelectedElement("lower");
                        }}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <NumberField
                        label="W"
                        value={state.upper.width}
                        min={6}
                        max={40}
                        onChange={(e) => {
                          const value = clamp(Number(e.target.value) || 15, 6, 40);
                          setState((prev) => ({ ...prev, upper: { ...prev.upper, width: value } }));
                        }}
                      />
                      <NumberField
                        label="H"
                        value={state.upper.height}
                        min={12}
                        max={60}
                        onChange={(e) => {
                          const value = clamp(Number(e.target.value) || 18, 12, 60);
                          setState((prev) => ({ ...prev, upper: { ...prev.upper, height: value } }));
                        }}
                      />
                      <NumberField
                        label="D"
                        value={state.upper.depth}
                        min={10}
                        max={36}
                        onChange={(e) => {
                          const value = clamp(Number(e.target.value) || 14, 10, 36);
                          setState((prev) => ({ ...prev, upper: { ...prev.upper, depth: value } }));
                        }}
                      />
                    </div>
                  </div>

                  <div
                    className="rounded-2xl border p-3"
                    style={{
                      borderColor: "var(--panel-border)",
                      background: "var(--panel-bg)",
                    }}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                      Countertop
                    </div>
                    <div className="mt-3 grid gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                          Material
                        </label>
                        <select
                          className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                          style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                          value={state.countertopDefaults?.material ?? "solid-surface"}
                          onChange={(e) => setState((prev) => ({
                            ...prev,
                            countertopDefaults: { ...(prev.countertopDefaults || {}), material: e.target.value },
                          }))}
                        >
                          <option value="solid-surface">Solid Surface</option>
                          <option value="quartz">Quartz</option>
                          <option value="quartzite">Quartzite</option>
                          <option value="laminate">Laminate</option>
                          <option value="butcher-block">Butcher Block</option>
                          <option value="stone-other">Other Stone</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                          Edge Profile
                        </label>
                        <select
                          className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                          style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                          value={state.countertopDefaults?.edgeProfile ?? "eased"}
                          onChange={(e) => setState((prev) => ({
                            ...prev,
                            countertopDefaults: { ...(prev.countertopDefaults || {}), edgeProfile: e.target.value },
                          }))}
                        >
                          <option value="eased">Eased</option>
                          <option value="pencil">Pencil Round</option>
                          <option value="small-bevel">Small Bevel</option>
                          <option value="ogee">Ogee</option>
                          <option value="waterfall">Waterfall Edge</option>
                          <option value="square">Square</option>
                        </select>
                      </div>
                      <NumberField
                        label="Thickness"
                        value={state.countertopDefaults?.thickness ?? 0.75}
                        min={0.5}
                        max={4}
                        step={0.125}
                        onChange={(e) => {
                          const value = clamp(Number(e.target.value) || 0.75, 0.5, 4);
                          setState((prev) => ({
                            ...prev,
                            countertopDefaults: { ...(prev.countertopDefaults || {}), thickness: value },
                          }));
                        }}
                      />
                    </div>
                    <div className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      Use + Add Countertop in Studio Tools to place a countertop from these defaults.
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        <div
          className="max-w-[calc(100vw-2rem)] transition-[width] duration-360 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: clustersCollapsed ? "188px" : "340px" }}
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => setClustersCollapsed((prev) => !prev)}
              aria-label={clustersCollapsed ? "Expand clusters" : "Collapse clusters"}
              className="absolute -bottom-3 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-2xl transition-all duration-300 hover:opacity-90"
              style={{
                borderColor: "var(--glass-border)",
                background: "var(--glass-bg)",
                color: "var(--text-soft)",
                boxShadow: "var(--glass-shadow)",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 transition-transform duration-300 ${clustersCollapsed ? "rotate-180" : "rotate-0"}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 14l6-6 6 6" />
              </svg>
            </button>

            <GlassCard
              className="overflow-hidden px-4 py-4 transition-[max-height,padding] duration-360 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ maxHeight: clustersCollapsed ? "72px" : "420px" }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-muted)" }}>
                Clusters
              </div>

              <div
                className="transition-[max-height,opacity,transform,margin-top] duration-360 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  maxHeight: clustersCollapsed ? "0px" : "360px",
                  opacity: clustersCollapsed ? 0 : 1,
                  transform: clustersCollapsed ? "translateY(-8px)" : "translateY(0px)",
                  marginTop: clustersCollapsed ? "0px" : "16px",
                  overflow: "hidden",
                  pointerEvents: clustersCollapsed ? "none" : "auto",
                }}
              >
                <div className="space-y-4">
                  <div className="rounded-2xl border p-3" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--accent-text)" }}>
                          Saved Clusters
                        </div>
                        <div className="mt-1 text-sm" style={{ color: "var(--text-soft)" }}>
                          Saved grouped box layouts with style and spacing presets.
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <PillButton disabled title="Placeholder">Save Cluster</PillButton>
                        <PillButton disabled title="Placeholder">Apply Cluster</PillButton>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl border border-dashed p-4 text-sm" style={{ borderColor: "var(--panel-border)", color: "var(--text-muted)", background: "rgba(255,255,255,0.04)" }}>
                      No saved clusters yet.
                      <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        Tomorrow this can hold reusable grouped cabinet layouts.
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border p-3" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
                    <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                      Cluster Defaults
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                          Style
                        </label>
                        <select
                          disabled
                          className="w-full rounded-2xl border px-3 py-2 text-sm outline-none opacity-70"
                          style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                          value="section-one"
                          onChange={() => {}}
                        >
                          <option value="section-one">Section One</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                          Spacing
                        </label>
                        <select
                          disabled
                          className="w-full rounded-2xl border px-3 py-2 text-sm outline-none opacity-70"
                          style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                          value="preserve"
                          onChange={() => {}}
                        >
                          <option value="preserve">Preserve Layout</option>
                          <option value="tight">Tight Pack</option>
                          <option value="spread">Spread Evenly</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 rounded-2xl border p-3 text-xs" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-muted)" }}>
                      Placeholder only for now. This is the future home for cluster save/apply behavior, spacing rules, and reusable grouped layout presets.
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Viewport hint anchored to active editor */}
      

      {layoutComingSoonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4" onClick={() => setLayoutComingSoonOpen(false)}>
          <GlassCard className="w-full max-w-md p-5" onClick={(event) => event.stopPropagation()}>
            <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
              Layout
            </div>
            <div className="mt-2 text-xl font-semibold" style={{ color: "var(--text-main)" }}>
              Coming soon
            </div>
            <div className="mt-3 text-sm" style={{ color: "var(--text-soft)" }}>
              The layout workspace is not built yet, but the button is now reserved and ready for it.
            </div>
            <div className="mt-5 flex justify-end">
              <PillButton onClick={() => setLayoutComingSoonOpen(false)}>Close</PillButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Floating bottom active editor */}
      <div className="fixed bottom-4 left-4 right-4 z-30 pointer-events-none">
        <div className="relative">
          <div
            className="absolute right-0 pointer-events-auto transition-all duration-360 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              bottom: activeEditorCollapsed ? "0px" : "calc(100% + 24px)",
            }}
          >
            <div
              className="w-fit rounded-[22px] border px-3 py-2 backdrop-blur-2xl"
              style={{
                borderColor: "var(--hover-spec-border)",
                background: "var(--hover-front-bg)",
                boxShadow: "var(--glass-shadow)",
              }}
            >
              <div className="flex flex-wrap items-center justify-end gap-2 text-sm font-medium" style={{ color: "var(--hover-front-text)" }}>
                <div className="mr-1 text-sm font-medium" style={{ color: "var(--hover-front-text)" }}>
                  {hoveredInfo.title}
                </div>
                {hoveredInfo.specs.map((spec) => (
                  <div
                    key={`${spec.label}-${spec.value}`}
                    className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium"
                    style={{
                      borderColor: "var(--hover-spec-border)",
                      background: "var(--hover-spec-bg)",
                      color: "var(--hover-spec-text)",
                    }}
                  >
                    <span>{spec.label}</span>
                    <span>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="max-w-[calc(100vw-2rem)] pointer-events-auto transition-[width] duration-360 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: activeEditorCollapsed ? activeEditorPreset.collapsedWidth : activeEditorPreset.expandedWidth }}
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setUiPrefs((prev) => ({ ...prev, activeEditorMode: getNextActiveEditorMode(prev.activeEditorMode) }))}
                aria-label={`Active editor size: ${uiPrefs.activeEditorMode}`}
                title={`Active editor size: ${uiPrefs.activeEditorMode}`}
                className="absolute -top-3 right-16 z-40 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-2xl transition-all duration-300 hover:opacity-90"
                style={{
                  borderColor: "var(--glass-border)",
                  background: "var(--glass-bg)",
                  color: "var(--text-soft)",
                  boxShadow: "var(--glass-shadow)",
                }}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  {[0, 1, 2].map((index) => {
                    const lineCount = uiPrefs.activeEditorMode === "low" ? 1 : uiPrefs.activeEditorMode === "medium" ? 2 : 3;
                    const isVisible = index < lineCount;
                    const width = index === 0 ? 12 : index === 1 ? 14 : 16;
                    const x = 12 - width / 2;
                    const y = 7 + index * 5;
                    return (
                      <path
                        key={`editor-size-line-${index}`}
                        d={`M${x} ${y}h${width}`}
                        style={{ opacity: isVisible ? 1 : 0.16 }}
                      />
                    );
                  })}
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setActiveEditorCollapsed((prev) => !prev)}
                aria-label={activeEditorCollapsed ? "Expand active editor" : "Collapse active editor"}
                className="absolute -top-3 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-2xl transition-all duration-300 hover:opacity-90"
                style={{
                  borderColor: "var(--glass-border)",
                  background: "var(--glass-bg)",
                  color: "var(--text-soft)",
                  boxShadow: "var(--glass-shadow)",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`h-5 w-5 transition-transform duration-300 ${activeEditorCollapsed ? "rotate-0" : "rotate-180"}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 14l6-6 6 6" />
                </svg>
              </button>

              <GlassCard
                className="overflow-hidden px-4 py-4 transition-[max-height,padding] duration-360 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ maxHeight: activeEditorCollapsed ? "96px" : `${activeEditorPreset.expandedMaxHeight}px` }}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--accent-text)" }}>
                  {activeEditorCollapsed ? (toolTab === "shopDrawing" ? "Tool Box" : "Active Editor") : ""}
                </div>
                <div className="mt-1 text-sm font-semibold transition-all duration-300" style={{ color: "var(--text-main)" }}>
                  {activeEditorCollapsed ? (toolTab === "shopDrawing" ? "Drawings" : `Section One · ${selectedElement === "upper" ? (itemScheduleLookup.upper?.displayLabel || "Upper Cabinet One") : selectedElement === "countertop" ? (itemScheduleLookup.countertop?.displayLabel || "Countertop One") : isMultiLowerSelection ? `${lowerSelectionCount} Items Selected` : (itemScheduleLookup.lowerByIndex[selectedLowerIndex]?.displayLabel || "Lower Cabinet One")}`) : ""}
                </div>
                <div className="mt-1 text-xs transition-all duration-300" style={{ color: "var(--text-muted)" }}>
                  {activeEditorCollapsed ? "Collapsed. Tap the arrow to reopen." : ""}
                </div>

                {!activeEditorCollapsed && isLowProfileActiveEditor && toolTab !== "shopDrawing" && (
                  <div className="mt-5 grid items-start gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                    <div
                      className="rounded-[22px] border px-4 py-3"
                      style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}
                    >
                      <div className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                        Active Editor: {activeEditorInfo.title}
                      </div>
                    </div>

                    <div
                      className="rounded-2xl border p-3"
                      style={{ borderColor: "var(--accent-border)", background: "var(--accent-bg)" }}
                    >
                      <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--accent-text)" }}>
                        Studio Tools
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <PillButton onClick={() => handleAddLowerBox("cabinet")}>+ Add Box</PillButton>
                        <PillButton onClick={() => handleAddLowerBox("equipment-gap")}>+ Add Equipment Gap</PillButton>
                        <PillButton onClick={() => handleAddLowerBox("filler-panel")}>+ Add Filler</PillButton>
                        <PillButton onClick={() => handleAddLowerBox("pony-wall")}>+ Add Pony Wall</PillButton>
                        <PillButton onClick={handleAddCountertop}>+ Add Countertop</PillButton>
                        <PillButton onClick={() => handleCopySelectedLowerBoxes()}>Copy</PillButton>
                        <PillButton onClick={() => handlePasteLowerBoxes()}>Paste</PillButton>
                        <PillButton onClick={handleDeleteSelectedBoxes}>Delete</PillButton>
                        <PillButton
                          active={moveToolActive}
                          onClick={() => {
                            const next = !moveToolActive;
                            setMoveToolActive(next);
                            if (next) {
                              setRotateToolActive(false);
                              setPushPullToolActive(false);
                            }
                          }}
                        >
                          Move
                        </PillButton>
                        <PillButton
                          active={rotateToolActive}
                          onClick={() => {
                            const next = !rotateToolActive;
                            setRotateToolActive(next);
                            if (next) {
                              setMoveToolActive(false);
                              setPushPullToolActive(false);
                            }
                          }}
                        >
                          Rotate
                        </PillButton>
                        <PillButton
                          active={pushPullToolActive}
                          onClick={() => {
                            const next = !pushPullToolActive;
                            setPushPullToolActive(next);
                            if (next) {
                              setMoveToolActive(false);
                              setRotateToolActive(false);
                            }
                          }}
                        >
                          Push/Pull
                        </PillButton>
                        <PillButton active={quickSnapEnabled} onClick={() => setQuickSnapEnabled((prev) => !prev)}>
                          {quickSnapEnabled ? "Quick Snap On" : "Quick Snap Off"}
                        </PillButton>
                      </div>
                    </div>
                  </div>
                )}

                {!activeEditorCollapsed && (!isLowProfileActiveEditor || toolTab === "shopDrawing") && (
                  <div
                    className="mt-5 space-y-4 overflow-y-auto pr-1"
                    style={{ maxHeight: `${activeEditorPreset.contentMaxHeight}px` }}
                  >
                      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
                        <div
                          className="rounded-[22px] border p-4"
                          style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}
                        >
                          <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--accent-text)" }}>
                            Active Editor
                          </div>
                          <div className="mt-2 text-base font-semibold" style={{ color: "var(--text-main)" }}>
                            {activeEditorInfo.title}
                          </div>
                          <div className="mt-3 space-y-1.5 text-sm" style={{ color: "var(--text-soft)" }}>
                            {activeEditorInfo.lines.map((line, index) => (
                              <div key={`active-editor-line-${index}`}>{line}</div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div
                            className="rounded-2xl border p-3"
                            style={{ borderColor: "var(--accent-border)", background: "var(--accent-bg)" }}
                          >
                            <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--accent-text)" }}>
                              Studio Tools
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <PillButton onClick={() => handleAddLowerBox("cabinet")}>+ Add Box</PillButton>
                              <PillButton onClick={() => handleAddLowerBox("equipment-gap")}>+ Add Equipment Gap</PillButton>
                              <PillButton onClick={() => handleAddLowerBox("filler-panel")}>+ Add Filler</PillButton>
                              <PillButton onClick={() => handleAddLowerBox("pony-wall")}>+ Add Pony Wall</PillButton>
                              <PillButton onClick={handleAddCountertop}>+ Add Countertop</PillButton>
                              <PillButton onClick={() => handleCopySelectedLowerBoxes()}>Copy</PillButton>
                              <PillButton onClick={() => handlePasteLowerBoxes()}>Paste</PillButton>
                              <PillButton onClick={handleDeleteSelectedBoxes}>Delete</PillButton>
                              <PillButton
                                active={moveToolActive}
                                onClick={() => {
                                  const next = !moveToolActive;
                                  setMoveToolActive(next);
                                  if (next) {
                                    setRotateToolActive(false);
                                    setPushPullToolActive(false);
                                  }
                                }}
                              >
                                Move
                              </PillButton>
                              <PillButton
                                active={rotateToolActive}
                                onClick={() => {
                                  const next = !rotateToolActive;
                                  setRotateToolActive(next);
                                  if (next) {
                                    setMoveToolActive(false);
                                    setPushPullToolActive(false);
                                  }
                                }}
                              >
                                Rotate
                              </PillButton>
                              <PillButton
                                active={pushPullToolActive}
                                onClick={() => {
                                  const next = !pushPullToolActive;
                                  setPushPullToolActive(next);
                                  if (next) {
                                    setMoveToolActive(false);
                                    setRotateToolActive(false);
                                  }
                                }}
                              >
                                Push/Pull
                              </PillButton>
                              <PillButton active={quickSnapEnabled} onClick={() => setQuickSnapEnabled((prev) => !prev)}>
                                {quickSnapEnabled ? "Quick Snap On" : "Quick Snap Off"}
                              </PillButton>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-end gap-1.5">
                            <EditorTabButton label="WHD" active={editorTab === "whd"} onClick={() => setEditorTab("whd")} />
                            {selectedElement === "lower" && activeData.type !== "pony-wall" && <EditorTabButton label="Kick" active={editorTab === "kick"} onClick={() => setEditorTab("kick")} />}
                            {activeData.type === "cabinet" && <EditorTabButton label="Doors" active={editorTab === "doors"} onClick={() => setEditorTab("doors")} />}
                            {activeData.type === "cabinet" && <EditorTabButton label="Handles" active={editorTab === "handles"} onClick={() => setEditorTab("handles")} />}
                            {(activeData.type === "cabinet" || activeData.type === "filler-panel") && <EditorTabButton label="Finish" active={editorTab === "finish"} onClick={() => setEditorTab("finish")} />}
                            {selectedElement === "lower" && activeData.type === "cabinet" && <EditorTabButton label="Drawers" active={editorTab === "drawers"} onClick={() => setEditorTab("drawers")} />}
                            {activeData.type === "cabinet" && <EditorTabButton label="Shelves" active={editorTab === "shelves"} onClick={() => setEditorTab("shelves")} />}
                          </div>

                          <div className="rounded-[22px] border p-3" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
                            {editorTab === "whd" && (
                              selectedElement === "countertop" ? (
                                <div className="space-y-3">
                                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                                    <div>
                                      <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                        Width
                                      </label>
                                      <div className="w-full rounded-2xl border px-3 py-2 text-sm" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}>
                                        {formatInches(countertopEditorWidth)}”
                                      </div>
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                        Depth
                                      </label>
                                      <div className="w-full rounded-2xl border px-3 py-2 text-sm" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}>
                                        {formatInches(countertopEditorDepth)}”
                                      </div>
                                    </div>
                                    <NumberField
                                      label="Left Overhang"
                                      value={state.countertopItem?.leftOverhang ?? 0.7}
                                      min={0}
                                      max={24}
                                      step={0.0625}
                                      onChange={(e) => updateCountertopItemWithLimit({ leftOverhang: clamp(Number(e.target.value) || 0, 0, 24) }, "leftOverhang")}
                                    />
                                    <NumberField
                                      label="Right Overhang"
                                      value={state.countertopItem?.rightOverhang ?? 0.7}
                                      min={0}
                                      max={24}
                                      step={0.0625}
                                      onChange={(e) => updateCountertopItemWithLimit({ rightOverhang: clamp(Number(e.target.value) || 0, 0, 24) }, "rightOverhang")}
                                    />
                                    <NumberField
                                      label="Thickness"
                                      value={state.countertopItem?.thickness ?? 0.75}
                                      min={0.5}
                                      max={4}
                                      step={0.0625}
                                      onChange={(e) => setState((prev) => ({ ...prev, countertopItem: { ...(prev.countertopItem || { type: "countertop" }), thickness: clamp(Number(e.target.value) || 0.75, 0.5, 4) } }))}
                                    />
                                    <div>
                                      <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                        Material
                                      </label>
                                      <select
                                        className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                        style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                        value={state.countertopItem?.material ?? "solid-surface"}
                                        onChange={(e) => setState((prev) => ({ ...prev, countertopItem: { ...(prev.countertopItem || { type: "countertop" }), material: e.target.value } }))}
                                      >
                                        <option value="solid-surface">Solid Surface</option>
                                        <option value="quartz">Quartz</option>
                                        <option value="quartzite">Quartzite</option>
                                        <option value="laminate">Laminate</option>
                                        <option value="butcher-block">Butcher Block</option>
                                        <option value="stone-other">Other Stone</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    <NumberField
                                      label="Front Overhang"
                                      value={state.countertopItem?.frontOverhang ?? 1.2}
                                      min={0}
                                      max={24}
                                      step={0.0625}
                                      onChange={(e) => updateCountertopItemWithLimit({ frontOverhang: clamp(Number(e.target.value) || 0, 0, 24) }, "frontOverhang")}
                                    />
                                    <NumberField
                                      label="Back Overhang"
                                      value={state.countertopItem?.backOverhang ?? 0}
                                      min={0}
                                      max={24}
                                      step={0.0625}
                                      onChange={(e) => updateCountertopItemWithLimit({ backOverhang: clamp(Number(e.target.value) || 0, 0, 24) }, "backOverhang")}
                                    />
                                    <div>
                                      <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                        Edge Profile
                                      </label>
                                      <select
                                        className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                        style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                        value={state.countertopItem?.edgeProfile ?? "eased"}
                                        onChange={(e) => setState((prev) => ({ ...prev, countertopItem: { ...(prev.countertopItem || { type: "countertop" }), edgeProfile: e.target.value } }))}
                                      >
                                        <option value="eased">Eased</option>
                                        <option value="pencil">Pencil Round</option>
                                        <option value="small-bevel">Small Bevel</option>
                                        <option value="ogee">Ogee</option>
                                        <option value="waterfall">Waterfall Edge</option>
                                        <option value="square">Square</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                    <NumberField
                                      label="Width"
                                      value={activeData.width}
                                      min={0.75}
                                      max={activeData.type === "pony-wall" ? 96 : 40}
                                      onChange={(e) => {
                                        const value = clamp(Number(e.target.value) || 15, 0.75, activeData.type === "pony-wall" ? 96 : 40);
                                        setState((prev) =>
                                          selectedElement === "upper"
                                            ? { ...prev, upper: { ...prev.upper, width: value } }
                                            : { ...prev, cabinet: { ...prev.cabinet, width: value } }
                                        );
                                      }}
                                    />
                                    <NumberField
                                      label="Height"
                                      value={activeData.height}
                                      min={12}
                                      max={60}
                                      onChange={(e) => {
                                        const value = clamp(Number(e.target.value) || (selectedElement === "upper" ? 18 : 29.75), 12, 60);
                                        setState((prev) =>
                                          selectedElement === "upper"
                                            ? { ...prev, upper: { ...prev.upper, height: value } }
                                            : { ...prev, cabinet: { ...prev.cabinet, height: value } }
                                        );
                                      }}
                                    />
                                    {activeData.type === "pony-wall" ? (
                                      <>
                                        <div>
                                          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                            Wall Build
                                          </label>
                                          <select
                                            className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                            style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                            value={activeData.ponyWallCoreType ?? "2x4"}
                                            onChange={(e) => {
                                              const coreType = e.target.value;
                                              setState((prev) => {
                                                const target = selectedElement === "upper" ? prev.upper : prev.cabinet;
                                                const drywallThickness = target.ponyWallDrywallThickness ?? 0.5;
                                                const drywallSides = target.ponyWallDrywallSides ?? 2;
                                                const depth = getPonyWallDepthInches(coreType, drywallThickness, drywallSides);
                                                return selectedElement === "upper"
                                                  ? { ...prev, upper: { ...prev.upper, ponyWallCoreType: coreType, depth } }
                                                  : { ...prev, cabinet: { ...prev.cabinet, ponyWallCoreType: coreType, depth } };
                                              });
                                            }}
                                          >
                                            <option value="plywood">2.25” Plywood</option>
                                            <option value="2x4">2x4</option>
                                            <option value="2x6">2x6</option>
                                          </select>
                                        </div>
                                        {(activeData.ponyWallCoreType ?? "2x4") !== "plywood" ? (
                                          <>
                                            <div>
                                              <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                                Drywall Thickness
                                              </label>
                                              <select
                                                className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                                style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                                value={String(activeData.ponyWallDrywallThickness ?? 0.5)}
                                                onChange={(e) => {
                                                  const drywallThickness = Number(e.target.value) || 0.5;
                                                  setState((prev) => {
                                                    const target = selectedElement === "upper" ? prev.upper : prev.cabinet;
                                                    const coreType = target.ponyWallCoreType ?? "2x4";
                                                    const drywallSides = target.ponyWallDrywallSides ?? 2;
                                                    const depth = getPonyWallDepthInches(coreType, drywallThickness, drywallSides);
                                                    return selectedElement === "upper"
                                                      ? { ...prev, upper: { ...prev.upper, ponyWallDrywallThickness: drywallThickness, depth } }
                                                      : { ...prev, cabinet: { ...prev.cabinet, ponyWallDrywallThickness: drywallThickness, depth } };
                                                  });
                                                }}
                                              >
                                                <option value="0.5">1/2”</option>
                                                <option value="0.625">5/8”</option>
                                              </select>
                                            </div>
                                            <div>
                                              <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                                Drywall Sides
                                              </label>
                                              <select
                                                className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                                style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                                value={String(activeData.ponyWallDrywallSides ?? 2)}
                                                onChange={(e) => {
                                                  const drywallSides = Number(e.target.value) === 1 ? 1 : 2;
                                                  setState((prev) => {
                                                    const target = selectedElement === "upper" ? prev.upper : prev.cabinet;
                                                    const coreType = target.ponyWallCoreType ?? "2x4";
                                                    const drywallThickness = target.ponyWallDrywallThickness ?? 0.5;
                                                    const depth = getPonyWallDepthInches(coreType, drywallThickness, drywallSides);
                                                    return selectedElement === "upper"
                                                      ? { ...prev, upper: { ...prev.upper, ponyWallDrywallSides: drywallSides, depth } }
                                                      : { ...prev, cabinet: { ...prev.cabinet, ponyWallDrywallSides: drywallSides, depth } };
                                                  });
                                                }}
                                              >
                                                <option value="1">1 side</option>
                                                <option value="2">2 sides</option>
                                              </select>
                                            </div>
                                          </>
                                        ) : (
                                          <div>
                                            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                              Wall Thickness
                                            </label>
                                            <div className="w-full rounded-2xl border px-3 py-2 text-sm" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}>
                                              2.25”
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <NumberField
                                        label="Depth"
                                        value={activeData.depth}
                                        min={selectedElement === "upper" ? 10 : 2}
                                        max={selectedElement === "upper" ? 36 : 96}
                                        onChange={(e) => {
                                          const value = clamp(Number(e.target.value) || (selectedElement === "upper" ? 14 : 23), selectedElement === "upper" ? 10 : 2, selectedElement === "upper" ? 36 : 96);
                                          setState((prev) =>
                                            selectedElement === "upper"
                                              ? { ...prev, upper: { ...prev.upper, depth: value } }
                                              : { ...prev, cabinet: { ...prev.cabinet, depth: value } }
                                          );
                                        }}
                                      />
                                    )}
                                    <div>
                                      <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                        Type
                                      </label>
                                      <select
                                        className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                        style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                        value={activeData.type}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setState((prev) => {
                                            const currentBox = selectedElement === "upper" ? prev.upper : prev.cabinet;
                                            const patch = value === "filler-panel"
                                              ? {
                                                  type: value,
                                                  fillerView: currentBox.fillerView ?? "front",
                                                  fillerPlacement: currentBox.fillerPlacement ?? "left",
                                                  fillerThickness: currentBox.fillerThickness ?? 0.75,
                                                  fillerFlushTarget: currentBox.fillerFlushTarget ?? "box",
                                                  doorsEnabled: false,
                                                  shelfCount: 0,
                                                  adjustableShelves: false,
                                                  drawerMode: "none",
                                                }
                                              : value === "equipment-gap"
                                                ? {
                                                    type: value,
                                                    doorsEnabled: false,
                                                    shelfCount: 0,
                                                    adjustableShelves: false,
                                                    drawerMode: "none",
                                                  }
                                                : value === "pony-wall"
                                                  ? {
                                                      type: value,
                                                      kickEnabled: false,
                                                      doorsEnabled: false,
                                                      shelfCount: 0,
                                                      adjustableShelves: false,
                                                      drawerMode: "none",
                                                      ponyWallCoreType: currentBox.ponyWallCoreType ?? "2x4",
                                                      ponyWallDrywallThickness: currentBox.ponyWallDrywallThickness ?? 0.5,
                                                      ponyWallDrywallSides: currentBox.ponyWallDrywallSides ?? 2,
                                                      depth: getPonyWallDepthInches(
                                                        currentBox.ponyWallCoreType ?? "2x4",
                                                        currentBox.ponyWallDrywallThickness ?? 0.5,
                                                        currentBox.ponyWallDrywallSides ?? 2,
                                                      ),
                                                    }
                                                  : {
                                                      type: value,
                                                      doorsEnabled: currentBox.doorsEnabled ?? true,
                                                      shelfCount: currentBox.shelfCount ?? 1,
                                                      adjustableShelves: currentBox.adjustableShelves ?? true,
                                                    };
                                            return selectedElement === "upper"
                                              ? { ...prev, upper: { ...prev.upper, ...patch } }
                                              : { ...prev, cabinet: { ...prev.cabinet, ...patch } };
                                          });
                                        }}
                                      >
                                        <option value="cabinet">Cabinet</option>
                                        <option value="equipment-gap">Equipment gap</option>
                                        <option value="filler-panel">Filler panel</option>
                                        <option value="pony-wall">Pony wall</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                    <ToggleRow
                                      label="Width Lock"
                                      checked={selectedElement === "upper" ? Boolean(state.upper.widthLocked) : Boolean(state.cabinet.widthLocked)}
                                      onChange={(e) =>
                                        setState((prev) =>
                                          selectedElement === "upper"
                                            ? { ...prev, upper: { ...prev.upper, widthLocked: e.target.checked } }
                                            : { ...prev, cabinet: { ...prev.cabinet, widthLocked: e.target.checked } }
                                        )
                                      }
                                    />
                                    <ToggleRow
                                      label="Position Lock"
                                      checked={selectedElement === "upper" ? Boolean(state.upper.positionLocked) : Boolean(state.cabinet.positionLocked)}
                                      onChange={(e) =>
                                        setState((prev) =>
                                          selectedElement === "upper"
                                            ? { ...prev, upper: { ...prev.upper, positionLocked: e.target.checked } }
                                            : { ...prev, cabinet: { ...prev.cabinet, positionLocked: e.target.checked } }
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              )
                            )}

                            {selectedElement === "lower" && editorTab === "kick" && (
                              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <ToggleRow
                                  label="Kick On"
                                  checked={state.cabinet.kickEnabled ?? true}
                                  onChange={(e) => setState((prev) => ({ ...prev, cabinet: { ...prev.cabinet, kickEnabled: e.target.checked } }))}
                                />
                                {(state.cabinet.kickEnabled ?? true) ? (
                                  <>
                                    <NumberField
                                      label="Kick H"
                                      value={state.cabinet.toeKickHeight ?? 3}
                                      min={0}
                                      max={12}
                                      onChange={(e) => {
                                        const value = clamp(Number(e.target.value) || 3, 0, 12);
                                        setState((prev) => ({ ...prev, cabinet: { ...prev.cabinet, toeKickHeight: value } }));
                                      }}
                                    />
                                    <NumberField
                                      label="Kick D"
                                      value={state.cabinet.toeKickDepth ?? 3}
                                      min={0}
                                      max={12}
                                      onChange={(e) => {
                                        const value = clamp(Number(e.target.value) || 3, 0, 12);
                                        setState((prev) => ({ ...prev, cabinet: { ...prev.cabinet, toeKickDepth: value } }));
                                      }}
                                    />
                                    <ToggleRow
                                      label="Continuous Side Panel"
                                      checked={Boolean(state.cabinet.continuousSidePanel)}
                                      onChange={(e) => setState((prev) => ({ ...prev, cabinet: { ...prev.cabinet, continuousSidePanel: e.target.checked } }))}
                                    />
                                  </>
                                ) : (
                                  <NumberField
                                    label="Above Floor"
                                    value={state.cabinet.aboveFloor ?? 0}
                                    min={0}
                                    max={96}
                                    onChange={(e) => {
                                      const value = clamp(Number(e.target.value) || 0, 0, 96);
                                      setState((prev) => ({ ...prev, cabinet: { ...prev.cabinet, aboveFloor: value } }));
                                    }}
                                  />
                                )}
                              </div>
                            )}

                            {activeData.type === "cabinet" && editorTab === "doors" && (
                              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <ToggleRow
                                  label="Doors On"
                                  checked={selectedElement === "upper" ? (state.upper.doorsEnabled ?? true) : (state.cabinet.doorsEnabled ?? true)}
                                  onChange={(e) =>
                                    setState((prev) =>
                                      selectedElement === "upper"
                                        ? { ...prev, upper: { ...prev.upper, doorsEnabled: e.target.checked } }
                                        : { ...prev, cabinet: { ...prev.cabinet, doorsEnabled: e.target.checked } }
                                    )
                                  }
                                />
                                <ToggleRow
                                  label="Open"
                                  checked={selectedElement === "upper" ? Boolean(state.upper.doorOpen) : Boolean(state.cabinet.doorOpen)}
                                  onChange={(e) =>
                                    setState((prev) =>
                                      selectedElement === "upper"
                                        ? { ...prev, upper: { ...prev.upper, doorOpen: e.target.checked, doorOpenAmount: e.target.checked ? 1 : 0 } }
                                        : { ...prev, cabinet: { ...prev.cabinet, doorOpen: e.target.checked, doorOpenAmount: e.target.checked ? 1 : 0 } }
                                    )
                                  }
                                />
                                <div>
                                  <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                    Layout
                                  </label>
                                  <select
                                    className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                    style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                    value={(selectedElement === "upper" ? state.upper.doorStyle : state.cabinet.doorStyle) ?? "auto"}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setState((prev) =>
                                        selectedElement === "upper"
                                          ? { ...prev, upper: { ...prev.upper, doorStyle: value } }
                                          : { ...prev, cabinet: { ...prev.cabinet, doorStyle: value } }
                                      );
                                    }}
                                  >
                                    <option value="auto">Auto</option>
                                    <option value="single">Single</option>
                                    <option value="double">Double</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                    Hand
                                  </label>
                                  <select
                                    className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                    style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                    value={(selectedElement === "upper" ? state.upper.doorHand : state.cabinet.doorHand) ?? "left"}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setState((prev) =>
                                        selectedElement === "upper"
                                          ? { ...prev, upper: { ...prev.upper, doorHand: value } }
                                          : { ...prev, cabinet: { ...prev.cabinet, doorHand: value } }
                                      );
                                    }}
                                  >
                                    <option value="left">Left</option>
                                    <option value="right">Right</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                    Style
                                  </label>
                                  <select
                                    className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                    style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                    value={(selectedElement === "upper" ? state.upper.doorKind : state.cabinet.doorKind) ?? "flat"}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setState((prev) =>
                                        selectedElement === "upper"
                                          ? { ...prev, upper: { ...prev.upper, doorKind: value } }
                                          : { ...prev, cabinet: { ...prev.cabinet, doorKind: value } }
                                      );
                                    }}
                                  >
                                    <option value="flat">Flat slab</option>
                                    <option value="shaker">Shaker</option>
                                    <option value="top-rail">Frame only on top</option>
                                    <option value="raised-panel">Raised panel</option>
                                    <option value="recessed-panel">Recessed panel</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                    Mount
                                  </label>
                                  <select
                                    className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                    style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                    value={(selectedElement === "upper" ? state.upper.doorMount : state.cabinet.doorMount) ?? "overlay"}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setState((prev) =>
                                        selectedElement === "upper"
                                          ? { ...prev, upper: { ...prev.upper, doorMount: value } }
                                          : { ...prev, cabinet: { ...prev.cabinet, doorMount: value } }
                                      );
                                    }}
                                  >
                                    <option value="overlay">Overlay</option>
                                    <option value="full-overlay">Full overlay</option>
                                    <option value="inset">Inset</option>
                                  </select>
                                </div>
                                <NumberField
                                  label="Inset"
                                  value={selectedElement === "upper" ? (state.upper.doorInsetDepth ?? 0) : (state.cabinet.doorInsetDepth ?? 0)}
                                  min={0}
                                  max={0.75}
                                  step={0.0625}
                                  onChange={(e) => {
                                    const value = clamp(Number(e.target.value) || 0, 0, 0.75);
                                    setState((prev) =>
                                      selectedElement === "upper"
                                        ? { ...prev, upper: { ...prev.upper, doorInsetDepth: value } }
                                        : { ...prev, cabinet: { ...prev.cabinet, doorInsetDepth: value } }
                                    );
                                  }}
                                />
                                <NumberField
                                  label="Reveal"
                                  value={selectedElement === "upper" ? (state.upper.doorGap ?? 0.125) : (state.cabinet.doorGap ?? 0.125)}
                                  min={0.0625}
                                  max={0.5}
                                  step={0.0625}
                                  onChange={(e) => {
                                    const value = clamp(Number(e.target.value) || 0.125, 0.0625, 0.5);
                                    setState((prev) =>
                                      selectedElement === "upper"
                                        ? { ...prev, upper: { ...prev.upper, doorGap: value } }
                                        : { ...prev, cabinet: { ...prev.cabinet, doorGap: value } }
                                    );
                                  }}
                                />
                                {((selectedElement === "upper" ? state.upper.doorKind : state.cabinet.doorKind) ?? "flat") === "shaker" && (
                                  <>
                                    <NumberField
                                      label="Frame Width"
                                      value={selectedElement === "upper" ? (state.upper.doorProfile ?? 2.25) : (state.cabinet.doorProfile ?? 2.25)}
                                      min={0.75}
                                      max={4}
                                      step={0.125}
                                      onChange={(e) => {
                                        const value = clamp(Number(e.target.value) || 2.25, 0.75, 4);
                                        setState((prev) =>
                                          selectedElement === "upper"
                                            ? { ...prev, upper: { ...prev.upper, doorProfile: value } }
                                            : { ...prev, cabinet: { ...prev.cabinet, doorProfile: value } }
                                        );
                                      }}
                                    />
                                    <ToggleRow
                                      label="Slim Shaker"
                                      checked={selectedElement === "upper" ? Boolean(state.upper.shakerSlim) : Boolean(state.cabinet.shakerSlim)}
                                      onChange={(e) =>
                                        setState((prev) =>
                                          selectedElement === "upper"
                                            ? { ...prev, upper: { ...prev.upper, shakerSlim: e.target.checked } }
                                            : { ...prev, cabinet: { ...prev.cabinet, shakerSlim: e.target.checked } }
                                        )
                                      }
                                    />
                                  </>
                                )}
                              </div>
                            )}

                            {activeData.type === "cabinet" && editorTab === "handles" && (
                              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <div>
                                  <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                    Handle Type
                                  </label>
                                  <select
                                    className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                    style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                    value={selectedElement === "upper" ? (state.upper.handleType ?? "none") : (state.cabinet.handleType ?? "none")}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setState((prev) =>
                                        selectedElement === "upper"
                                          ? { ...prev, upper: { ...prev.upper, handleType: value } }
                                          : { ...prev, cabinet: { ...prev.cabinet, handleType: value } }
                                      );
                                    }}
                                  >
                                    <option value="none">None (Push / Touch)</option>
                                    <optgroup label="Integrated">
                                      <option value="integrated-top-rail">Integrated Top Rail</option>
                                      <option value="integrated-full-width">Integrated Full Width Rail</option>
                                      <option value="j-pull">J-Pull (Finger Pull)</option>
                                      <option value="edge-profile">Edge Profile (45° / Bevel)</option>
                                    </optgroup>
                                    <optgroup label="Bar Pulls">
                                      <option value="bar-small">Bar Pull - 96mm</option>
                                      <option value="bar-medium">Bar Pull - 128mm</option>
                                      <option value="bar-large">Bar Pull - 160mm</option>
                                      <option value="bar-appliance">Appliance Pull</option>
                                    </optgroup>
                                    <optgroup label="Knobs">
                                      <option value="knob-round">Round Knob</option>
                                      <option value="knob-square">Square Knob</option>
                                      <option value="knob-tbar">T-Bar Knob</option>
                                    </optgroup>
                                    <optgroup label="Recessed">
                                      <option value="recessed-round">Recessed Round Pull</option>
                                      <option value="recessed-rect">Recessed Rectangular Pull</option>
                                    </optgroup>
                                  </select>
                                </div>
                                <div className="rounded-2xl border p-3 text-xs md:col-span-1 xl:col-span-3" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-muted)" }}>
                                  Handle type is kept separate from door style so pull geometry, finish, and mounting logic can be controlled independently later.
                                </div>
                              </div>
                            )}

                            {(activeData.type === "cabinet" || activeData.type === "filler-panel") && editorTab === "finish" && (
                              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <div>
                                  <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                    Finish Type
                                  </label>
                                  <select
                                    className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                    style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                    value={activeData.faceFinishType ?? "paint"}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setState((prev) =>
                                        selectedElement === "upper"
                                          ? { ...prev, upper: { ...prev.upper, faceFinishType: value, faceFinishTone: getFinishToneOptions(value)[0]?.value ?? "white" } }
                                          : { ...prev, cabinet: { ...prev.cabinet, faceFinishType: value, faceFinishTone: getFinishToneOptions(value)[0]?.value ?? "white" } }
                                      );
                                    }}
                                  >
                                    <option value="paint">Paint</option>
                                    <option value="laminate">Laminate</option>
                                    <option value="veneer">Veneer</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                    Tone
                                  </label>
                                  <select
                                    className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                    style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                    value={activeData.faceFinishTone ?? getFinishToneOptions(activeData.faceFinishType ?? "paint")[0]?.value ?? "white"}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setState((prev) =>
                                        selectedElement === "upper"
                                          ? { ...prev, upper: { ...prev.upper, faceFinishTone: value } }
                                          : { ...prev, cabinet: { ...prev.cabinet, faceFinishTone: value } }
                                      );
                                    }}
                                  >
                                    {getFinishToneOptions(activeData.faceFinishType ?? "paint").map((option) => (
                                      <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                  </select>
                                </div>
                                {(activeData.faceFinishType ?? "paint") === "paint" && (activeData.faceFinishTone ?? "white") === "custom" && (
                                  <>
                                    <div>
                                      <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                        Supplier
                                      </label>
                                      <input
                                        className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                        style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                        value={activeData.faceFinishSupplier ?? ""}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setState((prev) =>
                                            selectedElement === "upper"
                                              ? { ...prev, upper: { ...prev.upper, faceFinishSupplier: value } }
                                              : { ...prev, cabinet: { ...prev.cabinet, faceFinishSupplier: value } }
                                          );
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                        Code
                                      </label>
                                      <input
                                        className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                        style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                        value={activeData.faceFinishCode ?? ""}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setState((prev) =>
                                            selectedElement === "upper"
                                              ? { ...prev, upper: { ...prev.upper, faceFinishCode: value } }
                                              : { ...prev, cabinet: { ...prev.cabinet, faceFinishCode: value } }
                                          );
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                        Custom Color
                                      </label>
                                      <input
                                        className="h-[42px] w-full rounded-2xl border px-2 py-1 outline-none"
                                        type="color"
                                        style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}
                                        value={activeData.faceFinishCustomHex ?? "#d8ccb7"}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setState((prev) =>
                                            selectedElement === "upper"
                                              ? { ...prev, upper: { ...prev.upper, faceFinishCustomHex: value } }
                                              : { ...prev, cabinet: { ...prev.cabinet, faceFinishCustomHex: value } }
                                          );
                                        }}
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            )}

                            {selectedElement === "lower" && activeData.type === "cabinet" && editorTab === "drawers" && (
                              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <div>
                                  <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                    Drawer Mode
                                  </label>
                                  <select
                                    className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                    style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                    value={state.cabinet.drawerMode ?? "none"}
                                    onChange={(e) => setState((prev) => ({ ...prev, cabinet: { ...prev.cabinet, drawerMode: e.target.value } }))}
                                  >
                                    <option value="none">None</option>
                                    <option value="top-drawer">Top drawer</option>
                                    <option value="drawer-bank">Drawer bank</option>
                                  </select>
                                </div>
                                {(state.cabinet.drawerMode ?? "none") === "drawer-bank" && (
                                  <NumberField
                                    label="Drawer Count"
                                    value={state.cabinet.drawerCount ?? 3}
                                    min={1}
                                    max={5}
                                    step={1}
                                    onChange={(e) => {
                                      const value = clamp(Math.round(Number(e.target.value) || 3), 1, 5);
                                      setState((prev) => ({ ...prev, cabinet: { ...prev.cabinet, drawerCount: value } }));
                                    }}
                                  />
                                )}
                                {(state.cabinet.drawerMode ?? "none") === "top-drawer" && (
                                  <NumberField
                                    label="Top Drawer H"
                                    value={state.cabinet.topDrawerHeight ?? 6}
                                    min={3.5}
                                    max={12}
                                    step={0.125}
                                    onChange={(e) => {
                                      const value = clamp(Number(e.target.value) || 6, 3.5, 12);
                                      setState((prev) => ({ ...prev, cabinet: { ...prev.cabinet, topDrawerHeight: value } }));
                                    }}
                                  />
                                )}
                                <div>
                                  <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                    Slide Type
                                  </label>
                                  <select
                                    className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                                    style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)", color: "var(--text-main)" }}
                                    value={state.cabinet.drawerSlideType ?? "undermount"}
                                    onChange={(e) => setState((prev) => ({ ...prev, cabinet: { ...prev.cabinet, drawerSlideType: e.target.value } }))}
                                  >
                                    <option value="undermount">Undermount</option>
                                    <option value="side-mount">Side mount</option>
                                  </select>
                                </div>
                                <NumberField
                                  label="Side Wall"
                                  value={state.cabinet.drawerSideWallThickness ?? 0.5}
                                  min={0.375}
                                  max={0.75}
                                  step={0.125}
                                  onChange={(e) => {
                                    const value = clamp(Number(e.target.value) || 0.5, 0.375, 0.75);
                                    setState((prev) => ({ ...prev, cabinet: { ...prev.cabinet, drawerSideWallThickness: value } }));
                                  }}
                                />
                                <ToggleRow
                                  label="Soft Close"
                                  checked={state.cabinet.drawerSoftClose ?? true}
                                  onChange={(e) => setState((prev) => ({ ...prev, cabinet: { ...prev.cabinet, drawerSoftClose: e.target.checked } }))}
                                />
                              </div>
                            )}

                            {activeData.type === "cabinet" && editorTab === "shelves" && (
                              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <NumberField
                                  label="Shelf Count"
                                  value={selectedElement === "upper" ? (state.upper.shelfCount ?? 1) : (state.cabinet.shelfCount ?? 1)}
                                  min={0}
                                  max={12}
                                  step={1}
                                  onChange={(e) => {
                                    const value = clamp(Math.round(Number(e.target.value) || 0), 0, 12);
                                    setState((prev) =>
                                      selectedElement === "upper"
                                        ? { ...prev, upper: { ...prev.upper, shelfCount: value } }
                                        : { ...prev, cabinet: { ...prev.cabinet, shelfCount: value } }
                                    );
                                  }}
                                />
                                <NumberField
                                  label="Pin Spacing"
                                  value={selectedElement === "upper" ? (state.upper.pinHoleSpacing ?? 1.25) : (state.cabinet.pinHoleSpacing ?? 1.25)}
                                  min={0.5}
                                  max={4}
                                  step={0.125}
                                  onChange={(e) => {
                                    const value = clamp(Number(e.target.value) || 1.25, 0.5, 4);
                                    setState((prev) =>
                                      selectedElement === "upper"
                                        ? { ...prev, upper: { ...prev.upper, pinHoleSpacing: value } }
                                        : { ...prev, cabinet: { ...prev.cabinet, pinHoleSpacing: value } }
                                    );
                                  }}
                                />
                                <ToggleRow
                                  label="Adjustable"
                                  checked={selectedElement === "upper" ? (state.upper.adjustableShelves ?? true) : (state.cabinet.adjustableShelves ?? true)}
                                  onChange={(e) =>
                                    setState((prev) =>
                                      selectedElement === "upper"
                                        ? { ...prev, upper: { ...prev.upper, adjustableShelves: e.target.checked } }
                                        : { ...prev, cabinet: { ...prev.cabinet, adjustableShelves: e.target.checked } }
                                    )
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// End of Cabinet Kit Studio Next App
