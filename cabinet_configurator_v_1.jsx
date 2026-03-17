import React, { useEffect, useMemo, useRef, useState } from "react";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeCabinetWidths(count, widths, defaultWidth = 15) {
  const next = Array.from({ length: count }, (_, index) => widths[index] ?? defaultWidth);
  return next.map((value) => clamp(Number(value) || defaultWidth, 6, 40));
}

function normalizeCabinetTypes(count, types) {
  return Array.from({ length: count }, (_, index) => types?.[index] || "cabinet");
}

function normalizeCabinetLocks(count, locks) {
  return Array.from({ length: count }, (_, index) => Boolean(locks?.[index]));
}

function normalizeCabinetHeights(count, heights, defaultHeight = DEFAULT_CABINET_HEIGHT_IN) {
  return Array.from({ length: count }, (_, index) => clamp(Number(heights?.[index]) || defaultHeight, 20, 60));
}

function normalizeCabinetDepths(count, depths, defaultDepth = DEFAULT_CABINET_DEPTH_IN) {
  return Array.from({ length: count }, (_, index) => clamp(Number(depths?.[index]) || defaultDepth, 12, 36));
}

function moveItem(array, fromIndex, toIndex) {
  const next = [...array];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function movePair(widths, types, locks, positionLocks, heights, depths, fromIndex, toIndex) {
  const nextWidths = moveItem(widths, fromIndex, toIndex);
  const nextTypes = moveItem(types, fromIndex, toIndex);
  const nextLocks = moveItem(locks, fromIndex, toIndex);
  const nextPositionLocks = moveItem(positionLocks, fromIndex, toIndex);
  const nextHeights = moveItem(heights, fromIndex, toIndex);
  const nextDepths = moveItem(depths, fromIndex, toIndex);
  return { nextWidths, nextTypes, nextLocks, nextPositionLocks, nextHeights, nextDepths };
}

function sumWidths(widths) {
  return widths.reduce((sum, width) => sum + Number(width || 0), 0);
}

const WALLS = [1, 2, 3, 4];
const DEFAULT_CABINET_DEPTH_IN = 23;
const DEFAULT_CABINET_HEIGHT_IN = 29.75;
const DEFAULT_UPPER_DEPTH_IN = 14;
const DEFAULT_UPPER_HEIGHT_IN = 18;
const DEFAULT_COUNTERTOP_THICKNESS_IN = 1.25;
const DOOR_HEIGHT_IN = 84;
const DEFAULT_CABINET_WIDTH = 15;
const CABINET_HEIGHT_IN = DEFAULT_CABINET_HEIGHT_IN;

function getWallLengthInches(wallNumber, roomWidth, roomDepth) {
  return wallNumber === 1 || wallNumber === 3 ? roomWidth : roomDepth;
}

function getAdjacentWalls(wallNumber) {
  const map = {
    1: [4, 2],
    2: [1, 3],
    3: [2, 4],
    4: [3, 1],
  };
  return map[wallNumber] || [];
}

function getCornerBlockerForAdjacentWall(adjacentWall, wallDepths, activeWalls) {
  if (!activeWalls.includes(adjacentWall)) return 0;
  return (Number(wallDepths?.[adjacentWall]) || DEFAULT_CABINET_DEPTH_IN) + 4;
}

function computeWallBlockers(wallNumber, activeWalls, wallDepths) {
  const [leftAdjacent, rightAdjacent] = getAdjacentWalls(wallNumber);
  return {
    left: getCornerBlockerForAdjacentWall(leftAdjacent, wallDepths, activeWalls),
    right: getCornerBlockerForAdjacentWall(rightAdjacent, wallDepths, activeWalls),
  };
}

function getDoorZone(opening) {
  if (!opening?.door) return null;
  const start = Math.max(0, Number(opening.doorOffset) || 0);
  const width = Math.max(0, Number(opening.doorWidth) || 0);
  return { start, end: start + width, width };
}

function getWindowZone(opening) {
  if (!opening?.window) return null;
  const start = Math.max(0, Number(opening.windowOffset) || 0);
  const width = Math.max(0, Number(opening.windowWidth) || 0);
  return { start, end: start + width, width };
}

function computeOpeningBlockage(opening) {
  let blocked = 0;
  const door = getDoorZone(opening);
  const windowZone = getWindowZone(opening);
  if (door) blocked += door.width;
  if (windowZone) blocked += windowZone.width;
  return blocked;
}

function computeAvailableWidth(wallNumber, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths) {
  const wallLength = getWallLengthInches(wallNumber, roomWidth, roomDepth);
  const blockers = computeWallBlockers(wallNumber, activeWalls, wallDepths);
  const openings = computeOpeningBlockage(wallOpenings[wallNumber]);
  return Math.max(0, wallLength - blockers.left - blockers.right - openings);
}

function getWallUsableSegments(wallNumber, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths) {
  const wallLength = getWallLengthInches(wallNumber, roomWidth, roomDepth);
  const blockers = computeWallBlockers(wallNumber, activeWalls, wallDepths);
  const opening = wallOpenings[wallNumber] || {};
  const blockedZones = [];
  const door = getDoorZone(opening);
  const windowZone = getWindowZone(opening);

  if (door) blockedZones.push({ start: door.start, end: door.end });
  if (windowZone) blockedZones.push({ start: windowZone.start, end: windowZone.end });

  const minStart = blockers.left;
  const maxEnd = wallLength - blockers.right;

  const normalized = blockedZones
    .map((zone) => ({ start: clamp(zone.start, minStart, maxEnd), end: clamp(zone.end, minStart, maxEnd) }))
    .filter((zone) => zone.end > zone.start)
    .sort((a, b) => a.start - b.start);

  const merged = [];
  normalized.forEach((zone) => {
    const last = merged[merged.length - 1];
    if (!last || zone.start > last.end) {
      merged.push({ ...zone });
    } else {
      last.end = Math.max(last.end, zone.end);
    }
  });

  const segments = [];
  let cursor = minStart;
  merged.forEach((zone) => {
    if (zone.start > cursor) {
      segments.push({ start: cursor, end: zone.start, width: zone.start - cursor });
    }
    cursor = Math.max(cursor, zone.end);
  });
  if (cursor < maxEnd) {
    segments.push({ start: cursor, end: maxEnd, width: maxEnd - cursor });
  }

  return segments.filter((segment) => segment.width > 0);
}

function getPreferredUsableSegment(wallNumber, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths) {
  const segments = getWallUsableSegments(wallNumber, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths);
  if (!segments.length) return null;
  return segments.reduce((best, segment) => (segment.width > best.width ? segment : best), segments[0]);
}

function getAllowedRunOffsetRange(wallNumber, widths, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths) {
  const wallLength = getWallLengthInches(wallNumber, roomWidth, roomDepth);
  const runWidth = sumWidths(widths);
  const blockers = computeWallBlockers(wallNumber, activeWalls, wallDepths);
  const centerMin = -wallLength / 2 + blockers.left + runWidth / 2;
  const centerMax = wallLength / 2 - blockers.right - runWidth / 2;
  return { min: centerMin, max: centerMax };
}

function getSegmentAlignedOffset(segment, runWidth, mode, wallLength) {
  if (!segment) return 0;
  const safeRunWidth = Math.min(runWidth, segment.width);
  const centerBase = -wallLength / 2;
  if (mode === "left") return centerBase + segment.start + safeRunWidth / 2;
  if (mode === "right") return centerBase + segment.end - safeRunWidth / 2;
  return centerBase + segment.start + segment.width / 2;
}

function getRemainingSideSpace(availableWidth, usedWidth, runOffset) {
  const base = Math.max(0, (availableWidth - usedWidth) / 2);
  return {
    left: Math.max(0, base + runOffset),
    right: Math.max(0, base - runOffset),
  };
}

function areRunsCornerAligned(wallA, wallB, sideA, sideB, widthsByWall, offsetsByWall, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths) {
  if (!activeWalls.includes(wallA) || !activeWalls.includes(wallB)) return false;
  const widthsA = widthsByWall?.[wallA] || [];
  const widthsB = widthsByWall?.[wallB] || [];
  if (!widthsA.length || !widthsB.length) return false;

  const rangeA = getAllowedRunOffsetRange(wallA, widthsA, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths);
  const rangeB = getAllowedRunOffsetRange(wallB, widthsB, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths);
  const offsetA = clamp(offsetsByWall?.[wallA] || 0, rangeA.min, rangeA.max);
  const offsetB = clamp(offsetsByWall?.[wallB] || 0, rangeB.min, rangeB.max);
  const tol = 1;
  const alignedA = sideA === "left" ? Math.abs(offsetA - rangeA.min) <= tol : Math.abs(offsetA - rangeA.max) <= tol;
  const alignedB = sideB === "left" ? Math.abs(offsetB - rangeB.min) <= tol : Math.abs(offsetB - rangeB.max) <= tol;
  return alignedA && alignedB;
}

function roundDownToEighth(value) {
  return Math.floor(value / 0.125) * 0.125;
}

function formatInches(value) {
  return Number(value || 0).toFixed(3);
}

function autoAdjustCabinetWidths(count, availableWidth, lockedWidths = [], minWidth = 6, maxWidth = 30) {
  if (count <= 0 || availableWidth <= 0) return [];
  const safeCount = Math.max(1, Math.floor(count));
  const locked = Array.from({ length: safeCount }, (_, index) => Math.max(0, Number(lockedWidths[index]) || 0));
  const lockedTotal = sumWidths(locked);
  const adjustableIndexes = locked.map((value, index) => (value > 0 ? null : index)).filter((value) => value !== null);
  const remainingWidth = Math.max(0, availableWidth - lockedTotal);

  if (!adjustableIndexes.length) {
    return locked.map((width) => roundDownToEighth(width));
  }

  const idealWidth = remainingWidth / adjustableIndexes.length;
  const baseWidth = roundDownToEighth(clamp(idealWidth, minWidth, maxWidth));
  const widths = Array.from({ length: safeCount }, (_, index) => (locked[index] > 0 ? roundDownToEighth(locked[index]) : baseWidth));

  return widths.map((width) => roundDownToEighth(width));
}

function getRunMeasurements(widths, runOffset, wallLength) {
  const usedWidth = sumWidths(widths);
  let cursor = Math.max(0, wallLength / 2 - usedWidth / 2 + runOffset);
  return widths.map((width, index) => {
    const measurement = {
      index,
      width,
      fromLeft: cursor,
      toRight: Math.max(0, wallLength - cursor - width),
    };
    cursor += width;
    return measurement;
  });
}

function resetCabinetWidthsToDefault(count, availableWidth, defaultWidth = DEFAULT_CABINET_WIDTH) {
  const next = [];
  let used = 0;
  for (let i = 0; i < count; i += 1) {
    if (used + defaultWidth > availableWidth) break;
    next.push(defaultWidth);
    used += defaultWidth;
  }
  return next;
}

function DimensionLine({ x1, x2, y, extensionTop = 0, extensionBottom = 18, label, color = "rgba(51,65,85,0.95)", dashed = false }) {
  const left = Math.min(x1, x2);
  const width = Math.abs(x2 - x1);
  const mid = (x1 + x2) / 2;
  const tick = 6;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
      <svg style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <line x1={x1} y1={extensionTop} x2={x1} y2={y + extensionBottom} stroke={color} strokeWidth="1" strokeDasharray={dashed ? "4 3" : undefined} />
        <line x1={x2} y1={extensionTop} x2={x2} y2={y + extensionBottom} stroke={color} strokeWidth="1" strokeDasharray={dashed ? "4 3" : undefined} />
        <line x1={left} y1={y} x2={left + width} y2={y} stroke={color} strokeWidth="1" />
        <line x1={x1} y1={y - tick / 2} x2={x1} y2={y + tick / 2} stroke={color} strokeWidth="1" />
        <line x1={x2} y1={y - tick / 2} x2={x2} y2={y + tick / 2} stroke={color} strokeWidth="1" />
      </svg>
      <div
        style={{
          position: "absolute",
          left: `${mid}px`,
          top: `${y - 18}px`,
          transform: "translateX(-50%)",
          padding: "1px 6px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(148,163,184,0.4)",
          fontSize: "10px",
          color: "#334155",
          whiteSpace: "nowrap",
          lineHeight: 1.2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function VerticalDimensionLine({ x, y1, y2, label, color = "rgba(51,65,85,0.95)", dashed = false }) {
  const top = Math.min(y1, y2);
  const height = Math.abs(y2 - y1);
  const mid = (y1 + y2) / 2;
  const tick = 6;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
      <svg style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <line x1={x} y1={top} x2={x} y2={top + height} stroke={color} strokeWidth="1" strokeDasharray={dashed ? "4 3" : undefined} />
        <line x1={x - tick / 2} y1={y1} x2={x + tick / 2} y2={y1} stroke={color} strokeWidth="1" />
        <line x1={x - tick / 2} y1={y2} x2={x + tick / 2} y2={y2} stroke={color} strokeWidth="1" />
      </svg>
      <div
        style={{
          position: "absolute",
          left: `${x + 10}px`,
          top: `${mid}px`,
          transform: "translateY(-50%)",
          padding: "1px 6px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(148,163,184,0.4)",
          fontSize: "10px",
          color: "#334155",
          whiteSpace: "nowrap",
          lineHeight: 1.2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Face({ style = {}, className = "", children }) {
  return (
    <div className={`absolute flex items-center justify-center border border-black/10 text-[10px] font-medium ${className}`} style={style}>
      {children}
    </div>
  );
}

function Panel3D({ width, height, depth, x = 0, y = 0, z = 0, color = "#d6d3d1", edge = "#a8a29e" }) {
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
      <Face style={{ ...frontBackBase, transform: `translateZ(${depth / 2}px)`, backgroundColor: color }} />
      <Face style={{ ...frontBackBase, transform: `rotateY(180deg) translateZ(${depth / 2}px)`, backgroundColor: color }} />
      <Face style={{ ...sideBase, transform: `rotateY(90deg) translateZ(${width / 2}px)`, backgroundColor: edge }} />
      <Face style={{ ...sideBase, transform: `rotateY(-90deg) translateZ(${width / 2}px)`, backgroundColor: edge }} />
      <Face style={{ ...topBase, transform: `rotateX(90deg) translateZ(${height / 2}px)`, backgroundColor: color }} />
      <Face style={{ ...topBase, transform: `rotateX(-90deg) translateZ(${height / 2}px)`, backgroundColor: edge }} />
    </div>
  );
}

function SingleCabinet({ widthPx, bodyHeight, toeKickHeightPx, toeKickDepth, toeKickZ, cabinet, isMoving, dimmed = false, isEquipmentGap = false }) {
  const topBottomWidth = widthPx - cabinet.thickness * 2;
  const backWidth = widthPx - cabinet.thickness * 2;
  const backHeight = bodyHeight - cabinet.thickness * 2;
  const bodyCenterY = -(cabinet.toeKickHeight / 2);
  const toeKickCenterY = bodyHeight / 2;
  const liftY = isMoving ? -28 : 0;
  const shrink = isMoving ? 0.92 : 1;
  const opacity = dimmed ? 0.55 : 1;
  const cabinetColor = isEquipmentGap ? "rgba(214,211,209,0.12)" : isMoving ? "#cbd5e1" : "#d6d3d1";
  const cabinetEdge = isEquipmentGap ? "rgba(168,162,158,0.25)" : isMoving ? "#94a3b8" : "#a8a29e";
  const toeColor = isEquipmentGap ? "rgba(207,200,191,0.12)" : isMoving ? "#bbf7d0" : "#cfc8bf";
  const toeEdge = isEquipmentGap ? "rgba(159,150,141,0.2)" : isMoving ? "#16a34a" : "#9f968d";

  return (
    <div style={{ transformStyle: "preserve-3d", transform: `translate3d(0px, ${liftY}px, 0px) scale(${shrink})`, opacity }}>
      <div style={{ transformStyle: "preserve-3d", transform: `translate3d(0px, ${bodyCenterY}px, 0px)` }}>
        <Panel3D width={cabinet.thickness} height={bodyHeight} depth={cabinet.depth} x={-(widthPx / 2) + cabinet.thickness / 2} color={cabinetColor} edge={cabinetEdge} />
        <Panel3D width={cabinet.thickness} height={bodyHeight} depth={cabinet.depth} x={(widthPx / 2) - cabinet.thickness / 2} color={cabinetColor} edge={cabinetEdge} />
        <Panel3D width={topBottomWidth} height={cabinet.thickness} depth={cabinet.depth} y={-(bodyHeight / 2) + cabinet.thickness / 2} color={cabinetColor} edge={cabinetEdge} />
        <Panel3D width={topBottomWidth} height={cabinet.thickness} depth={cabinet.depth} y={(bodyHeight / 2) - cabinet.thickness / 2} color={cabinetColor} edge={cabinetEdge} />
        {!isEquipmentGap && <Panel3D width={backWidth} height={backHeight} depth={cabinet.thickness} z={-(cabinet.depth / 2) + cabinet.thickness / 2} color="#e7e5e4" edge="#bdb7af" />}
      </div>
      {!isEquipmentGap && (
        <div style={{ transformStyle: "preserve-3d", transform: `translate3d(0px, ${toeKickCenterY}px, ${toeKickZ}px)` }}>
          <Panel3D width={widthPx} height={toeKickHeightPx} depth={toeKickDepth} color={toeColor} edge={toeEdge} />
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

function WallRun({
  wallNumber,
  cabinet = { overallHeight: CABINET_HEIGHT_IN * 10, depth: DEFAULT_CABINET_DEPTH_IN * 10, toeKickHeight: 30, toeKickInset: 30, thickness: 8, pxPerInch: 10 },
  roomWidth,
  roomDepth,
  roomHeight,
  widths = [],
  types = [],
  upperWidths = [],
  sectionSettings = { lowers: true, uppers: false, upperSyncWidth: true },
  heights = [],
  depths = [],
  positionLocks = [],
  runOffsetInches = 0,
  wallDepths,
  activeWalls,
  wallOpenings,
  hoveredCabinet,
  selectedCabinet,
  movingCabinet,
  dropIndex,
  interactive,
  showAllWalls,
  onCabinetEnter,
  onCabinetLeave,
  onCabinetClick,
  onMoveStart,
  onMoveEnd,
  showDimensions,
  countertopSettings = { enabled: false },
}) {
  const widthPxList = widths.map((width) => width * cabinet.pxPerInch);
  const upperWidthPxList = upperWidths.map((width) => width * cabinet.pxPerInch);
  const totalWidth = widthPxList.reduce((sum, width) => sum + width, 0);
  const wallDepthInches = Number(wallDepths?.[wallNumber]) || DEFAULT_CABINET_DEPTH_IN;
  const cabinetDepthPx = wallDepthInches * cabinet.pxPerInch;
  const availableWidthInches = computeAvailableWidth(wallNumber, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths);
  const availableWidthPx = availableWidthInches * cabinet.pxPerInch;
  const allowedRunOffset = getAllowedRunOffsetRange(wallNumber, widths, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths);
  const clampedRunOffsetInches = clamp(runOffsetInches, allowedRunOffset.min, allowedRunOffset.max);
  const runOffsetPx = clampedRunOffsetInches * cabinet.pxPerInch;
  const doorZone = getDoorZone(wallOpenings[wallNumber]);
  const floorWidthPx = Math.max(roomWidth * cabinet.pxPerInch, 120);
  const floorDepthPx = Math.max(roomDepth * cabinet.pxPerInch, 120);
  const wallLengthPx = wallNumber === 1 || wallNumber === 3 ? floorWidthPx : floorDepthPx;
  const wallHeightPx = Math.max(roomHeight * cabinet.pxPerInch, cabinet.overallHeight + 120);
  const defaultBodyHeight = cabinet.overallHeight - cabinet.toeKickHeight;
  const toeKickDepth = cabinetDepthPx - cabinet.toeKickInset;
  const countertopThicknessPx = DEFAULT_COUNTERTOP_THICKNESS_IN * cabinet.pxPerInch;
  const countertopDepthPx = (wallDepthInches + 1) * cabinet.pxPerInch;
  const toeKickZ = -cabinet.toeKickInset / 2;
  const floorY = cabinet.overallHeight / 2;
  const halfRoomW = floorWidthPx / 2;
  const halfRoomD = floorDepthPx / 2;
  const blockers = computeWallBlockers(wallNumber, activeWalls, wallDepths);
  const blockerLeftPx = blockers.left * cabinet.pxPerInch;
  const blockerRightPx = blockers.right * cabinet.pxPerInch;
  const slotDepth = cabinetDepthPx * 1.1;
  const slotHeight = cabinet.overallHeight * 1.1;
  const sceneByWall = {
    1: { x: 0, z: -halfRoomD + cabinetDepthPx / 2, rotationY: 0 },
    2: { x: halfRoomW - cabinetDepthPx / 2, z: 0, rotationY: -90 },
    3: { x: 0, z: halfRoomD - cabinetDepthPx / 2, rotationY: 180 },
    4: { x: -halfRoomW + cabinetDepthPx / 2, z: 0, rotationY: 90 },
  }[wallNumber];

  let running = -totalWidth / 2 + runOffsetPx;
  const positions = [];
  for (let i = 0; i < widthPxList.length; i += 1) {
    const widthPx = widthPxList[i];
    positions.push(running + widthPx / 2);
    running += widthPx;
  }

  const slots = [];
  const runMeasurements = getRunMeasurements(widths, clampedRunOffsetInches, wallLengthPx / cabinet.pxPerInch);
  const dimensionBaseY = floorY - cabinet.overallHeight - 28;
  const dimensionCabinetIndex = selectedCabinet !== null ? selectedCabinet : 0;
  const dimensionCabinetHeight = (Number(heights[dimensionCabinetIndex]) || (cabinet.overallHeight / cabinet.pxPerInch)) * cabinet.pxPerInch;
  const dimensionCabinetDepth = (Number(depths[dimensionCabinetIndex]) || wallDepthInches) * cabinet.pxPerInch;
  let edge = -totalWidth / 2 + runOffsetPx;
  slots.push(edge);
  for (let i = 0; i < widthPxList.length; i += 1) {
    edge += widthPxList[i];
    slots.push(edge);
  }

  return (
    <div style={{ transformStyle: "preserve-3d", transform: `translate3d(${sceneByWall.x}px, 0px, ${sceneByWall.z}px) rotateY(${sceneByWall.rotationY}deg)` }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: `${wallLengthPx}px`, height: `${wallHeightPx}px`, transformStyle: "preserve-3d", transform: `translate3d(${-wallLengthPx / 2}px, ${floorY - wallHeightPx}px, ${-cabinetDepthPx / 2}px)`, border: interactive ? "2px solid rgba(16,185,129,0.45)" : "2px solid rgba(148,163,184,0.45)", background: interactive ? "rgba(16,185,129,0.06)" : "rgba(148,163,184,0.06)", borderRadius: "12px 12px 0 0", boxShadow: "inset 0 0 0 1px rgba(148,163,184,0.08)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "50%", top: "50%", width: `${availableWidthPx}px`, height: "10px", transformStyle: "preserve-3d", transform: `translate3d(${-availableWidthPx / 2}px, ${floorY + 8}px, ${cabinetDepthPx / 2 + 6}px)`, background: interactive ? "rgba(16,185,129,0.18)" : "rgba(59,130,246,0.08)", border: interactive ? "1px solid rgba(16,185,129,0.45)" : "1px solid rgba(59,130,246,0.2)", borderRadius: "999px", pointerEvents: "none" }} />

      {showDimensions && interactive && doorZone && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: `${wallLengthPx}px`,
            height: "140px",
            transformStyle: "preserve-3d",
            transform: `translate3d(${-wallLengthPx / 2}px, ${dimensionBaseY}px, ${cabinetDepthPx / 2 + 10}px)`,
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          <DimensionLine
            x1={doorZone.start * cabinet.pxPerInch}
            x2={(doorZone.start + doorZone.width) * cabinet.pxPerInch}
            y={34}
            extensionTop={22}
            extensionBottom={12}
            label={`door ${formatInches(doorZone.width)}”`}
            color="rgba(146,64,14,0.95)"
          />
          <DimensionLine
            x1={0}
            x2={doorZone.start * cabinet.pxPerInch}
            y={44}
            extensionTop={0}
            extensionBottom={12}
            label={`${formatInches(doorZone.start)}” from left`}
            color="rgba(146,64,14,0.95)"
            dashed
          />
        </div>
      )}

      {showDimensions && interactive && runMeasurements.length > 0 && (
        <>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "90px",
              height: `${Math.max(dimensionCabinetHeight + 40, 120)}px`,
              transformStyle: "preserve-3d",
              transform: `translate3d(${-wallLengthPx / 2 - 56}px, ${floorY - dimensionCabinetHeight - 14}px, ${cabinetDepthPx / 2 + 8}px)`,
              pointerEvents: "none",
              overflow: "visible",
            }}
          >
            <VerticalDimensionLine
              x={28}
              y1={0}
              y2={dimensionCabinetHeight}
              label={`${formatInches(dimensionCabinetHeight / cabinet.pxPerInch)}” H`}
              color="rgba(51,65,85,0.95)"
            />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: `${Math.max(dimensionCabinetDepth + 40, 100)}px`,
              height: "54px",
              transformStyle: "preserve-3d",
              transform: `translate3d(${-wallLengthPx / 2 - 58}px, ${floorY - dimensionCabinetHeight}px, 0px) rotateY(90deg)`,
              pointerEvents: "none",
              overflow: "visible",
            }}
          >
            <DimensionLine
              x1={0}
              x2={dimensionCabinetDepth}
              y={14}
              extensionTop={20}
              extensionBottom={8}
              label={`${formatInches(dimensionCabinetDepth / cabinet.pxPerInch)}” D`}
              color="rgba(51,65,85,0.95)"
              dashed
            />
          </div>
        </>
      )}

      {doorZone && (
        <div style={{ position: "absolute", left: "50%", top: "50%", width: `${doorZone.width * cabinet.pxPerInch}px`, height: `${DOOR_HEIGHT_IN * cabinet.pxPerInch}px`, transformStyle: "preserve-3d", transform: `translate3d(${-wallLengthPx / 2 + doorZone.start * cabinet.pxPerInch}px, ${floorY - DOOR_HEIGHT_IN * cabinet.pxPerInch}px, ${-cabinetDepthPx / 2 + 2}px)`, background: "rgba(245,158,11,0.12)", border: "2px solid rgba(245,158,11,0.65)", borderRadius: "10px 10px 0 0", pointerEvents: "none" }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", fontSize: "10px", color: "rgba(146,64,14,0.9)", paddingBottom: "4px" }}>door</div>
        </div>
      )}

      {blockerLeftPx > 0 && <div style={{ position: "absolute", left: "50%", top: "50%", width: `${blockerLeftPx}px`, height: `${cabinetDepthPx + 40}px`, transformStyle: "preserve-3d", transform: `translate3d(${-wallLengthPx / 2}px, ${floorY - (cabinetDepthPx + 40)}px, ${-cabinetDepthPx / 2}px)`, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.5)", pointerEvents: "none" }} />}
      {blockerRightPx > 0 && <div style={{ position: "absolute", left: "50%", top: "50%", width: `${blockerRightPx}px`, height: `${cabinetDepthPx + 40}px`, transformStyle: "preserve-3d", transform: `translate3d(${wallLengthPx / 2 - blockerRightPx}px, ${floorY - (cabinetDepthPx + 40)}px, ${-cabinetDepthPx / 2}px)`, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.5)", pointerEvents: "none" }} />}

      {interactive && movingCabinet !== null && slots.map((slotX, index) => (
        <div key={`slot-${wallNumber}-${index}`} style={{ position: "absolute", left: "50%", top: "50%", width: "16px", height: `${slotHeight}px`, transformStyle: "preserve-3d", transform: `translate3d(${slotX - 8}px, ${-slotHeight / 2}px, ${slotDepth / 2 + 6}px)`, background: dropIndex === index ? "rgba(34,197,94,0.45)" : "rgba(34,197,94,0.18)", border: dropIndex === index ? "2px solid rgba(22,163,74,0.95)" : "1px solid rgba(22,163,74,0.45)", borderRadius: "10px", pointerEvents: "none" }} />
      ))}

      {sectionSettings.lowers && countertopSettings?.enabled && widthPxList.length > 0 && (
        <div
          style={{
            transformStyle: "preserve-3d",
            transform: `translate3d(${runOffsetPx}px, ${-(cabinet.overallHeight / 2) - countertopThicknessPx / 2}px, ${(countertopDepthPx - cabinetDepthPx) / 2}px)`,
          }}
        >
          <Panel3D
            width={totalWidth}
            height={countertopThicknessPx}
            depth={countertopDepthPx}
            color="#e7e5e4"
            edge="#bdb7af"
          />
        </div>
      )}

      {sectionSettings.uppers && upperWidthPxList.map((upperWidthPx, index) => {
        const xOffset = positions[index] ?? 0;
        const upperDepthPx = DEFAULT_UPPER_DEPTH_IN * cabinet.pxPerInch;
        const upperOverallHeightPx = DEFAULT_UPPER_HEIGHT_IN * cabinet.pxPerInch;
        const upperBottomGapPx = 18 * cabinet.pxPerInch;
        const upperCenterY = -(cabinet.overallHeight / 2) - upperBottomGapPx - upperOverallHeightPx / 2;
        return (
          <div key={`upper-${wallNumber}-${index}`} style={{ transformStyle: "preserve-3d", transform: `translate3d(${xOffset}px, ${upperCenterY}px, 0px)` }}>
            <SingleCabinet widthPx={upperWidthPx} bodyHeight={upperOverallHeightPx} toeKickHeightPx={0} toeKickDepth={upperDepthPx} toeKickZ={0} cabinet={{ ...cabinet, toeKickHeight: 0, overallHeight: upperOverallHeightPx, depth: upperDepthPx }} isMoving={false} dimmed={!showAllWalls && !interactive} isEquipmentGap={false} />
          </div>
        );
      })}

      {sectionSettings.lowers && widthPxList.map((widthPx, index) => {
        const xOffset = positions[index];
        const type = types[index] || "cabinet";
        const cabinetHeightInches = Number(heights[index]) || (cabinet.overallHeight / cabinet.pxPerInch);
        const cabinetDepthInches = Number(depths[index]) || wallDepthInches;
        const cabinetOverallHeightPx = cabinetHeightInches * cabinet.pxPerInch;
        const cabinetBodyHeightPx = cabinetOverallHeightPx - cabinet.toeKickHeight;
        const cabinetDepthPxForBox = cabinetDepthInches * cabinet.pxPerInch;
        const toeKickDepthPxForBox = cabinetDepthPxForBox - cabinet.toeKickInset;
        const isEquipmentGap = type === "equipment-gap";
        const isHovered = interactive && hoveredCabinet === index;
        const isSelected = interactive && selectedCabinet === index;
        const isMoving = interactive && movingCabinet === index;
        return (
          <div key={`${wallNumber}-${index}`} style={{ transformStyle: "preserve-3d", transform: `translate3d(${xOffset}px, 0px, 0px)`, zIndex: interactive ? 1000 + index : 1 }}>
            <div
              className="absolute"
              style={{
                left: "50%",
                top: "50%",
                width: `${widthPx}px`,
                height: `${cabinetOverallHeightPx}px`,
                transform: `translate(-50%, -50%) translate3d(0px, 0px, ${cabinetDepthPx / 2 + 2}px)`,
                cursor: !interactive ? "default" : isMoving ? "grabbing" : isSelected ? "text" : isHovered ? "pointer" : "default",
                pointerEvents: interactive ? "auto" : "none",
                zIndex: isSelected ? 3000 : isHovered ? 2000 : 1000 + index,
                background: isMoving ? "rgba(34,197,94,0.10)" : isSelected ? "rgba(16,185,129,0.08)" : isHovered ? "rgba(59,130,246,0.05)" : "transparent",
                border: isMoving ? "2px solid rgba(34,197,94,0.75)" : isSelected ? "1px solid rgba(16,185,129,0.45)" : isHovered ? "1px solid rgba(59,130,246,0.35)" : "1px solid transparent",
              }}
              onMouseEnter={() => interactive && onCabinetEnter(index)}
              onMouseMove={() => interactive && onCabinetEnter(index)}
              onMouseLeave={() => interactive && onCabinetLeave(index)}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (interactive && selectedCabinet === index && !positionLocks?.[index]) onMoveStart(index);
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                if (interactive) onMoveEnd();
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (interactive && movingCabinet === null) onCabinetClick(index);
              }}
            />
            <SingleCabinet widthPx={widthPx} bodyHeight={cabinetBodyHeightPx} toeKickHeightPx={cabinet.toeKickHeight} toeKickDepth={toeKickDepthPxForBox} toeKickZ={toeKickZ} cabinet={{ ...cabinet, overallHeight: cabinetOverallHeightPx, depth: cabinetDepthPxForBox }} isMoving={isMoving} dimmed={!showAllWalls && !interactive} isEquipmentGap={isEquipmentGap} />
            {showDimensions && interactive && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: `${Math.max(widthPx, 10)}px`,
                  height: "44px",
                  transform: `translate(-50%, -50%) translate3d(0px, ${-(cabinetOverallHeightPx / 2) - 64}px, ${cabinetDepthPxForBox / 2 + 10}px)`,
                  pointerEvents: "none",
                  overflow: "visible",
                }}
              >
                <DimensionLine
                  x1={0}
                  x2={widthPx}
                  y={16}
                  extensionTop={20}
                  extensionBottom={10}
                  label={`${formatInches(runMeasurements[index]?.width)}”`}
                />
              </div>
            )}
            {showDimensions && interactive && index === 0 && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: `${Math.max((runMeasurements[index]?.fromLeft || 0) * cabinet.pxPerInch, 10)}px`,
                  height: "44px",
                  transform: `translate(-100%, -50%) translate3d(${-(widthPx / 2)}px, ${-(cabinetOverallHeightPx / 2) - 96}px, ${cabinetDepthPxForBox / 2 + 10}px)`,
                  pointerEvents: "none",
                  overflow: "visible",
                }}
              >
                <DimensionLine
                  x1={0}
                  x2={(runMeasurements[index]?.fromLeft || 0) * cabinet.pxPerInch}
                  y={16}
                  extensionTop={20}
                  extensionBottom={10}
                  label={`${formatInches(runMeasurements[index]?.fromLeft)}” from left`}
                  dashed
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Viewport3D(props) {
  const { orbit, tilt, zoom, panX, panY, roomWidth, roomDepth, toeKickHeight, defaultCabinetHeight = DEFAULT_CABINET_HEIGHT_IN, viewportWall, activeWalls, widthsByWall, offsetsByWall, wallOpenings, wallDepths, typesByWall, upperWidthsByWall, sectionSettingsByWall, countertopSettingsByWall } = props;
  const pxPerInch = 10;
  const floorWidthPx = Math.max(roomWidth * pxPerInch, 120);
  const floorDepthPx = Math.max(roomDepth * pxPerInch, 120);
  const bodyHeightPx = (defaultCabinetHeight - toeKickHeight) * pxPerInch;
  const fillerLegPx = 4 * pxPerInch;
  const fillerThicknessPx = 4;
  const fillerDropPx = 0;
  const fillerInsetPx = 0;
  const fillerCorners = [
    { key: "1-2", show: areRunsCornerAligned(1, 2, "right", "left", widthsByWall, offsetsByWall, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths), x: floorWidthPx / 2 - (wallDepths?.[2] || DEFAULT_CABINET_DEPTH_IN) * pxPerInch, z: -floorDepthPx / 2 + (wallDepths?.[1] || DEFAULT_CABINET_DEPTH_IN) * pxPerInch, dx: -1, dz: 1 },
    { key: "2-3", show: areRunsCornerAligned(2, 3, "right", "left", widthsByWall, offsetsByWall, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths), x: floorWidthPx / 2 - (wallDepths?.[2] || DEFAULT_CABINET_DEPTH_IN) * pxPerInch, z: floorDepthPx / 2 - (wallDepths?.[3] || DEFAULT_CABINET_DEPTH_IN) * pxPerInch, dx: -1, dz: -1 },
    { key: "3-4", show: areRunsCornerAligned(3, 4, "right", "left", widthsByWall, offsetsByWall, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths), x: -floorWidthPx / 2 + (wallDepths?.[4] || DEFAULT_CABINET_DEPTH_IN) * pxPerInch, z: floorDepthPx / 2 - (wallDepths?.[3] || DEFAULT_CABINET_DEPTH_IN) * pxPerInch, dx: 1, dz: -1 },
    { key: "4-1", show: areRunsCornerAligned(4, 1, "right", "left", widthsByWall, offsetsByWall, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths), x: -floorWidthPx / 2 + (wallDepths?.[4] || DEFAULT_CABINET_DEPTH_IN) * pxPerInch, z: -floorDepthPx / 2 + (wallDepths?.[1] || DEFAULT_CABINET_DEPTH_IN) * pxPerInch, dx: 1, dz: 1 },
  ];

  const sceneStyle = useMemo(() => ({ transform: `translate(${panX}px, ${panY}px) scale(${zoom}) rotateX(${tilt}deg) rotateY(${orbit}deg)`, transformStyle: "preserve-3d" }), [orbit, tilt, zoom, panX, panY]);

  return (
    <div className="absolute inset-0 flex items-center justify-center [perspective:1400px]">
      <div className="relative h-[640px] w-[1800px]" style={sceneStyle}>
        <div className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d", transform: "translate3d(0px, 40px, 0px)" }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: `${floorWidthPx}px`, height: `${floorDepthPx}px`, transformStyle: "preserve-3d", transformOrigin: "top left", transform: `translate3d(${-floorWidthPx / 2}px, ${(defaultCabinetHeight * pxPerInch) / 2}px, ${-floorDepthPx / 2}px) rotateX(90deg)`, border: "2px solid rgba(59,130,246,0.55)", background: "rgba(59,130,246,0.04)", borderRadius: "12px", boxShadow: "inset 0 0 0 1px rgba(59,130,246,0.08)", pointerEvents: "none" }} />

          {fillerCorners.filter((corner) => corner.show).map((corner) => (
            <div key={corner.key} style={{ position: "absolute", left: "50%", top: "50%", transformStyle: "preserve-3d", transform: `translate3d(${corner.x + corner.dx * fillerInsetPx}px, ${-(toeKickHeight * pxPerInch) / 2 + fillerDropPx}px, ${corner.z + corner.dz * fillerInsetPx}px)`, pointerEvents: "none" }}>
              <Panel3D width={fillerLegPx} height={bodyHeightPx} depth={fillerThicknessPx} x={(corner.dx * fillerLegPx) / 2} z={corner.dz * (fillerThicknessPx / 2)} color="#d6d3d1" edge="#a8a29e" />
              <Panel3D width={fillerThicknessPx} height={bodyHeightPx} depth={fillerLegPx} x={corner.dx * (fillerThicknessPx / 2)} z={(corner.dz * fillerLegPx) / 2} color="#d6d3d1" edge="#a8a29e" />
            </div>
          ))}

          {activeWalls.map((wallNumber) => (
            <WallRun
              key={`wall-run-${wallNumber}`}
              wallNumber={wallNumber}
              interactive={viewportWall === wallNumber}
              showAllWalls={viewportWall === "all"}
              widths={widthsByWall?.[wallNumber] || []}
              types={typesByWall?.[wallNumber] || []}
              upperWidths={upperWidthsByWall?.[wallNumber] || widthsByWall?.[wallNumber] || []}
              sectionSettings={sectionSettingsByWall?.[wallNumber] || { lowers: true, uppers: false, upperSyncWidth: true }}
              countertopSettings={countertopSettingsByWall?.[wallNumber] || { enabled: false }}
              positionLocks={props.positionLocksByWall?.[wallNumber] || []}
              heights={props.heightsByWall?.[wallNumber] || []}
              depths={props.depthsByWall?.[wallNumber] || []}
              runOffsetInches={offsetsByWall?.[wallNumber] || 0}
              showDimensions={props.showDimensions}
              {...props}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function runSelfTests() {
  const wallOpenings = { 1: { door: true, doorWidth: 36, window: true, windowWidth: 24 }, 2: { door: false, doorWidth: 36, window: false, windowWidth: 24 }, 3: { door: false, doorWidth: 36, window: false, windowWidth: 24 }, 4: { door: false, doorWidth: 36, window: false, windowWidth: 24 } };
  const wallDepths = { 1: 23, 2: 23, 3: 23, 4: 23 };
  const results = [
    clamp(0, 1, 20) === 1,
    clamp(25, 1, 20) === 20,
    clamp(5, 1, 20) === 5,
    normalizeCabinetWidths(3, [12], 15).join(",") === "12,15,15",
    normalizeCabinetTypes(3, ["cabinet"]).join(",") === "cabinet,cabinet,cabinet",
    moveItem([1, 2, 3], 0, 2).join(",") === "2,3,1",
    computeAvailableWidth(1, 144, 144, [1, 2], wallOpenings, wallDepths) === 57,
    computeWallBlockers(1, [1, 2, 4], wallDepths).left === 27,
    getDoorZone({ door: true, doorOffset: 12, doorWidth: 36 }).end === 48,
    getRemainingSideSpace(100, 60, 10).left === 30,
    getRemainingSideSpace(100, 60, 10).right === 10,
    autoAdjustCabinetWidths(3, 90).join(",") === "30,30,30",
    autoAdjustCabinetWidths(3, 74.99, [0, 15, 0]).join(",") === "29.875,15,29.875",
    autoAdjustCabinetWidths(3, 75, [0, 15, 0]).join(",") === "30,15,30",
    Math.round(getRunMeasurements([15, 20], 5, 50)[0].fromLeft) === 12,
    resetCabinetWidthsToDefault(4, 45).join(",") === "15,15,15",
    getWallUsableSegments(1, 144, 144, [1], { 1: { door: true, doorOffset: 50, doorWidth: 36 }, 2: {}, 3: {}, 4: {} }, wallDepths).length === 2,
    getPreferredUsableSegment(1, 144, 144, [1], { 1: { door: true, doorOffset: 50, doorWidth: 36 }, 2: {}, 3: {}, 4: {} }, wallDepths).width === 58,
  ];
  return results.every(Boolean);
}

export default function BreakroomConfiguratorV1() {
  const [orbit, setOrbit] = useState(-35);
  const [tilt, setTilt] = useState(-24);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [toeKickHeight, setToeKickHeight] = useState(3);
  const [defaultCabinetWidth, setDefaultCabinetWidth] = useState(DEFAULT_CABINET_WIDTH);
  const [defaultCabinetHeight, setDefaultCabinetHeight] = useState(DEFAULT_CABINET_HEIGHT_IN);
  const [defaultCabinetDepth, setDefaultCabinetDepth] = useState(DEFAULT_CABINET_DEPTH_IN);
  const [roomWidth, setRoomWidth] = useState(144);
  const [roomDepth, setRoomDepth] = useState(144);
  const [roomHeight, setRoomHeight] = useState(108);
  const [activeWalls, setActiveWalls] = useState([1]);
  const [expandedWalls, setExpandedWalls] = useState([1, 2, 3, 4]);
  const [viewportWall, setViewportWall] = useState(1);
  const [wallOpenings, setWallOpenings] = useState({
    1: { door: false, doorOffset: 0, doorWidth: 36, window: false, windowOffset: 0, windowWidth: 48, windowHeight: 36, windowBottom: 36 },
    2: { door: false, doorOffset: 0, doorWidth: 36, window: false, windowOffset: 0, windowWidth: 48, windowHeight: 36, windowBottom: 36 },
    3: { door: false, doorOffset: 0, doorWidth: 36, window: false, windowOffset: 0, windowWidth: 48, windowHeight: 36, windowBottom: 36 },
    4: { door: false, doorOffset: 0, doorWidth: 36, window: false, windowOffset: 0, windowWidth: 48, windowHeight: 36, windowBottom: 36 },
  });
  const [wallCabinets, setWallCabinets] = useState({ 1: [DEFAULT_CABINET_WIDTH], 2: [DEFAULT_CABINET_WIDTH], 3: [DEFAULT_CABINET_WIDTH], 4: [DEFAULT_CABINET_WIDTH] });
  const [wallCabinetTypes, setWallCabinetTypes] = useState({ 1: ["cabinet"], 2: ["cabinet"], 3: ["cabinet"], 4: ["cabinet"] });
  const [wallCabinetLocks, setWallCabinetLocks] = useState({ 1: [false], 2: [false], 3: [false], 4: [false] });
  const [wallCabinetPositionLocks, setWallCabinetPositionLocks] = useState({ 1: [false], 2: [false], 3: [false], 4: [false] });
  const [wallCabinetHeights, setWallCabinetHeights] = useState({ 1: [DEFAULT_CABINET_HEIGHT_IN], 2: [DEFAULT_CABINET_HEIGHT_IN], 3: [DEFAULT_CABINET_HEIGHT_IN], 4: [DEFAULT_CABINET_HEIGHT_IN] });
  const [wallCabinetDepths, setWallCabinetDepths] = useState({ 1: [DEFAULT_CABINET_DEPTH_IN], 2: [DEFAULT_CABINET_DEPTH_IN], 3: [DEFAULT_CABINET_DEPTH_IN], 4: [DEFAULT_CABINET_DEPTH_IN] });
  const [wallOffsets, setWallOffsets] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [wallCabinetSections, setWallCabinetSections] = useState({
    1: { lowers: true, uppers: false, upperSyncWidth: true },
    2: { lowers: true, uppers: false, upperSyncWidth: true },
    3: { lowers: true, uppers: false, upperSyncWidth: true },
    4: { lowers: true, uppers: false, upperSyncWidth: true },
  });
  const [wallUpperWidths, setWallUpperWidths] = useState({ 1: [DEFAULT_CABINET_WIDTH], 2: [DEFAULT_CABINET_WIDTH], 3: [DEFAULT_CABINET_WIDTH], 4: [DEFAULT_CABINET_WIDTH] });
  const [wallCountertops, setWallCountertops] = useState({
    1: { enabled: false },
    2: { enabled: false },
    3: { enabled: false },
    4: { enabled: false },
  });
  const [wallUpperTypes, setWallUpperTypes] = useState({ 1: ["cabinet"], 2: ["cabinet"], 3: ["cabinet"], 4: ["cabinet"] });
  const [wallUpperLocks, setWallUpperLocks] = useState({ 1: [false], 2: [false], 3: [false], 4: [false] });
  const [wallUpperPositionLocks, setWallUpperPositionLocks] = useState({ 1: [false], 2: [false], 3: [false], 4: [false] });
  const [wallUpperHeights, setWallUpperHeights] = useState({ 1: [DEFAULT_UPPER_HEIGHT_IN], 2: [DEFAULT_UPPER_HEIGHT_IN], 3: [DEFAULT_UPPER_HEIGHT_IN], 4: [DEFAULT_UPPER_HEIGHT_IN] });
  const [wallUpperDepths, setWallUpperDepths] = useState({ 1: [DEFAULT_UPPER_DEPTH_IN], 2: [DEFAULT_UPPER_DEPTH_IN], 3: [DEFAULT_UPPER_DEPTH_IN], 4: [DEFAULT_UPPER_DEPTH_IN] });
  const [wallDepths, setWallDepths] = useState({ 1: DEFAULT_CABINET_DEPTH_IN, 2: DEFAULT_CABINET_DEPTH_IN, 3: DEFAULT_CABINET_DEPTH_IN, 4: DEFAULT_CABINET_DEPTH_IN });
  const [showDimensions, setShowDimensions] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [hoveredCabinet, setHoveredCabinet] = useState(null);
  const [hoveredSection, setHoveredSection] = useState("lower");
  const [hoverInfoCabinet, setHoverInfoCabinet] = useState(null);
  const [hoverInfoSection, setHoverInfoSection] = useState("lower");
  const [selectedCabinet, setSelectedCabinet] = useState(null);
  const [selectedSection, setSelectedSection] = useState("lower");
  const [movingCabinet, setMovingCabinet] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);

  const sceneRef = useRef(null);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, orbit: 0, tilt: 0, panX: 0, panY: 0, moveStartX: 0 });
  const lastPointerRef = useRef({ x: 0, y: 0, time: 0 });
  const velocityRef = useRef({ orbit: 0, tilt: 0 });
  const animationFrameRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const hoverTargetRef = useRef(null);

  const testsPassed = runSelfTests();
  const isAllWallsView = viewportWall === "all";
  const currentLowerWidths = wallCabinets[viewportWall] || [];
  const currentLowerTypes = wallCabinetTypes[viewportWall] || [];
  const currentLowerLocks = wallCabinetLocks[viewportWall] || [];
  const currentLowerPositionLocks = wallCabinetPositionLocks[viewportWall] || [];
  const currentLowerHeights = wallCabinetHeights[viewportWall] || [];
  const currentLowerDepths = wallCabinetDepths[viewportWall] || [];
  const currentUpperWidths = wallUpperWidths[viewportWall] || [];
  const currentUpperTypes = wallUpperTypes[viewportWall] || [];
  const currentUpperLocks = wallUpperLocks[viewportWall] || [];
  const currentUpperPositionLocks = wallUpperPositionLocks[viewportWall] || [];
  const currentUpperHeights = wallUpperHeights[viewportWall] || [];
  const currentUpperDepths = wallUpperDepths[viewportWall] || [];
  const currentCabinetWidths = selectedSection === "upper" ? currentUpperWidths : currentLowerWidths;
  const currentCabinetTypes = selectedSection === "upper" ? currentUpperTypes : currentLowerTypes;
  const currentCabinetLocks = selectedSection === "upper" ? currentUpperLocks : currentLowerLocks;
  const currentCabinetPositionLocks = selectedSection === "upper" ? currentUpperPositionLocks : currentLowerPositionLocks;
  const currentCabinetHeights = selectedSection === "upper" ? currentUpperHeights : currentLowerHeights;
  const currentCabinetDepths = selectedSection === "upper" ? currentUpperDepths : currentLowerDepths;
  const currentAvailableWidth = computeAvailableWidth(viewportWall, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths);
  const currentSectionSettings = wallCabinetSections[viewportWall] || { lowers: true, uppers: false, upperSyncWidth: true };
  const currentCountertopSettings = wallCountertops[viewportWall] || { enabled: false };
  const currentUsedWidth = sumWidths(currentLowerWidths);
  const currentRemainingWidth = Math.max(0, currentAvailableWidth - currentUsedWidth);
  const currentAllowedRunOffset = getAllowedRunOffsetRange(viewportWall, currentLowerWidths, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths);
  const currentRunOffset = clamp(wallOffsets[viewportWall] || 0, currentAllowedRunOffset.min, currentAllowedRunOffset.max);
  const currentSideSpace = getRemainingSideSpace(currentAvailableWidth, currentUsedWidth, currentRunOffset);
  const currentPreferredSegment = getPreferredUsableSegment(viewportWall, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths);
  const currentRunMeasurements = getRunMeasurements(currentLowerWidths, currentRunOffset, getWallLengthInches(viewportWall, roomWidth, roomDepth));
  const hasLockedPosition = currentLowerPositionLocks.some(Boolean) || currentUpperPositionLocks.some(Boolean);

  const toggleWall = (wallNumber) => {
    setActiveWalls((prev) => {
      const next = prev.includes(wallNumber) ? prev.filter((wall) => wall !== wallNumber) : [...prev, wallNumber].sort((a, b) => a - b);
      if (!next.length) return [wallNumber];
      return next;
    });
  };

  const toggleExpandedWall = (wallNumber) => {
    setExpandedWalls((prev) => (prev.includes(wallNumber) ? prev.filter((wall) => wall !== wallNumber) : [...prev, wallNumber].sort((a, b) => a - b)));
  };

  const updateWallDepth = (wallNumber, value) => {
    setWallDepths((prev) => ({ ...prev, [wallNumber]: clamp(Number(value) || DEFAULT_CABINET_DEPTH_IN, 12, 36) }));
  };

  const updateWallOpening = (wallNumber, key, value) => {
    setWallOpenings((prev) => ({ ...prev, [wallNumber]: { ...prev[wallNumber], [key]: typeof value === "number" ? Math.max(0, value) : value } }));
  };

  useEffect(() => {
    if (viewportWall !== "all" && !activeWalls.includes(viewportWall)) {
      setViewportWall(activeWalls[0]);
      setHoveredCabinet(null);
      setHoverInfoCabinet(null);
      setSelectedCabinet(null);
      setMovingCabinet(null);
      setDropIndex(null);
    }
  }, [activeWalls, viewportWall]);

  useEffect(() => {
    setWallCabinets((prev) => {
      const next = { ...prev };
      WALLS.forEach((wall) => {
        const existing = normalizeCabinetWidths((prev[wall] || [DEFAULT_CABINET_WIDTH]).length, prev[wall] || [DEFAULT_CABINET_WIDTH]);
        const available = computeAvailableWidth(wall, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths);
        let running = 0;
        next[wall] = existing.filter((width) => {
          if (running + width <= available) {
            running += width;
            return true;
          }
          return false;
        });
        if (!next[wall].length && activeWalls.includes(wall) && available >= 6) next[wall] = [Math.min(defaultCabinetWidth, available)];
      });
      return next;
    });

    setWallCabinetTypes((prev) => {
      const next = { ...prev };
      WALLS.forEach((wall) => {
        const count = (wallCabinets[wall] || [DEFAULT_CABINET_WIDTH]).length;
        next[wall] = normalizeCabinetTypes(count, prev[wall]);
      });
      return next;
    });

    setWallCabinetLocks((prev) => {
      const next = { ...prev };
      WALLS.forEach((wall) => {
        const count = (wallCabinets[wall] || [DEFAULT_CABINET_WIDTH]).length;
        next[wall] = normalizeCabinetLocks(count, prev[wall]);
      });
      return next;
    });

    setWallCabinetPositionLocks((prev) => {
      const next = { ...prev };
      WALLS.forEach((wall) => {
        const count = (wallCabinets[wall] || [DEFAULT_CABINET_WIDTH]).length;
        next[wall] = normalizeCabinetLocks(count, prev[wall]);
      });
      return next;
    });

    setWallCabinetHeights((prev) => {
      const next = { ...prev };
      WALLS.forEach((wall) => {
        const count = (wallCabinets[wall] || [DEFAULT_CABINET_WIDTH]).length;
        next[wall] = normalizeCabinetHeights(count, prev[wall], defaultCabinetHeight);
      });
      return next;
    });

    setWallCabinetDepths((prev) => {
      const next = { ...prev };
      WALLS.forEach((wall) => {
        const count = (wallCabinets[wall] || [DEFAULT_CABINET_WIDTH]).length;
        next[wall] = normalizeCabinetDepths(count, prev[wall], wallDepths[wall] || defaultCabinetDepth);
      });
      return next;
    });
  }, [roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths, defaultCabinetWidth, defaultCabinetHeight, defaultCabinetDepth]);

  useEffect(() => {
    setWallUpperWidths((prev) => {
      const next = { ...prev };
      WALLS.forEach((wall) => {
        const section = wallCabinetSections[wall] || { upperSyncWidth: true };
        if (section.upperSyncWidth) {
          next[wall] = [...(wallCabinets[wall] || [])];
        } else {
          next[wall] = normalizeCabinetWidths((wallCabinets[wall] || []).length, prev[wall] || wallCabinets[wall] || [], DEFAULT_CABINET_WIDTH);
        }
      });
      return next;
    });
  }, [wallCabinets, wallCabinetSections]);

  useEffect(() => {
    setWallCabinetTypes((prev) => {
      const next = { ...prev };
      WALLS.forEach((wall) => {
        next[wall] = normalizeCabinetTypes((wallCabinets[wall] || []).length, prev[wall]);
      });
      return next;
    });
    setWallCabinetLocks((prev) => {
      const next = { ...prev };
      WALLS.forEach((wall) => {
        next[wall] = normalizeCabinetLocks((wallCabinets[wall] || []).length, prev[wall]);
      });
      return next;
    });
    setWallCabinetPositionLocks((prev) => {
      const next = { ...prev };
      WALLS.forEach((wall) => {
        next[wall] = normalizeCabinetLocks((wallCabinets[wall] || []).length, prev[wall]);
      });
      return next;
    });
    setWallCabinetHeights((prev) => {
      const next = { ...prev };
      WALLS.forEach((wall) => {
        next[wall] = normalizeCabinetHeights((wallCabinets[wall] || []).length, prev[wall], defaultCabinetHeight);
      });
      return next;
    });
    setWallCabinetDepths((prev) => {
      const next = { ...prev };
      WALLS.forEach((wall) => {
        next[wall] = normalizeCabinetDepths((wallCabinets[wall] || []).length, prev[wall], wallDepths[wall] || defaultCabinetDepth);
      });
      return next;
    });
  }, [wallCabinets, defaultCabinetHeight, defaultCabinetDepth, wallDepths]);

  useEffect(() => {
    setWallCabinetHeights((prev) => ({
      ...prev,
      [viewportWall]: (prev[viewportWall] || []).map((height, index) => (currentCabinetLocks[index] ? height : defaultCabinetHeight)),
    }));
  }, [viewportWall, defaultCabinetHeight, currentCabinetLocks]);

  useEffect(() => {
    setWallCabinetDepths((prev) => ({
      ...prev,
      [viewportWall]: (prev[viewportWall] || []).map((depth, index) => (currentCabinetLocks[index] ? depth : defaultCabinetDepth)),
    }));
    setWallDepths((prev) => ({ ...prev, [viewportWall]: defaultCabinetDepth }));
  }, [viewportWall, defaultCabinetDepth, currentCabinetLocks]);

  useEffect(() => {
    setWallOffsets((prev) => {
      const next = { ...prev };
      WALLS.forEach((wall) => {
        const allowed = getAllowedRunOffsetRange(wall, wallCabinets[wall] || [], roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths);
        next[wall] = clamp(prev[wall] || 0, allowed.min, allowed.max);
      });
      return next;
    });
  }, [roomWidth, roomDepth, activeWalls, wallOpenings, wallCabinets, wallDepths]);

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const handleCabinetEnter = (index, section = "lower") => {
    if (movingCabinet !== null) return;
    if (hoverTargetRef.current === index && hoveredCabinet === index) return;
    clearHoverTimer();
    hoverTargetRef.current = `${section}-${index}`;
    setHoveredSection(section);
    setHoveredCabinet(index);
    hoverTimerRef.current = setTimeout(() => {
      if (hoverTargetRef.current === `${section}-${index}`) {
        setHoverInfoSection(section);
        setHoverInfoCabinet(index);
      }
    }, 1200);
  };

  const handleCabinetLeave = (index, section = "lower") => {
    if (movingCabinet !== null) return;
    if (hoverTargetRef.current !== `${section}-${index}`) return;
    clearHoverTimer();
    hoverTargetRef.current = null;
    setHoveredCabinet(null);
    if (selectedCabinet === null) setHoverInfoCabinet(null);
  };

  const handleCabinetClick = (index, section = "lower") => {
    setHoverInfoSection(section);
    setHoverInfoCabinet(index);
    setSelectedSection(section);
    setSelectedCabinet(index);
  };

  const handleWidthChange = (value) => {
    if (selectedCabinet === null) return;
    const otherWidths = currentCabinetWidths.filter((_, index) => index !== selectedCabinet);
    const maxWidth = clamp(currentAvailableWidth - sumWidths(otherWidths), 6, 40);
    const nextValue = clamp(Number(value) || defaultCabinetWidth, 6, maxWidth);
    setWallCabinets((prev) => ({ ...prev, [viewportWall]: prev[viewportWall].map((width, index) => (index === selectedCabinet ? nextValue : width)) }));
  };

  const handleTypeChange = (value) => {
    if (selectedCabinet === null) return;
    setWallCabinetTypes((prev) => ({ ...prev, [viewportWall]: prev[viewportWall].map((type, index) => (index === selectedCabinet ? value : type)) }));
  };

  const handleLockWidthChange = (checked) => {
    if (selectedCabinet === null) return;
    setWallCabinetLocks((prev) => ({ ...prev, [viewportWall]: prev[viewportWall].map((locked, index) => (index === selectedCabinet ? checked : locked)) }));
  };

  const handleHeightChange = (value) => {
    if (selectedCabinet === null) return;
    const nextValue = clamp(Number(value) || defaultCabinetHeight, 20, 60);
    setWallCabinetHeights((prev) => ({ ...prev, [viewportWall]: prev[viewportWall].map((height, index) => (index === selectedCabinet ? nextValue : height)) }));
  };

  const handleDepthChange = (value) => {
    if (selectedCabinet === null) return;
    const nextValue = clamp(Number(value) || (wallDepths[viewportWall] || defaultCabinetDepth), 12, 36);
    setWallCabinetDepths((prev) => ({ ...prev, [viewportWall]: prev[viewportWall].map((depth, index) => (index === selectedCabinet ? nextValue : depth)) }));
  };

  const handleLockPositionChange = (checked) => {
    if (selectedCabinet === null) return;
    setWallCabinetPositionLocks((prev) => ({ ...prev, [viewportWall]: prev[viewportWall].map((locked, index) => (index === selectedCabinet ? checked : locked)) }));
  };

  const handleDeleteCabinet = () => {
    if (selectedCabinet === null || currentCabinetWidths.length <= 1) return;
    const removeAt = selectedCabinet;
    setWallCabinets((prev) => ({ ...prev, [viewportWall]: prev[viewportWall].filter((_, index) => index !== removeAt) }));
    setWallCabinetTypes((prev) => ({ ...prev, [viewportWall]: prev[viewportWall].filter((_, index) => index !== removeAt) }));
    setWallCabinetLocks((prev) => ({ ...prev, [viewportWall]: prev[viewportWall].filter((_, index) => index !== removeAt) }));
    setWallCabinetPositionLocks((prev) => ({ ...prev, [viewportWall]: prev[viewportWall].filter((_, index) => index !== removeAt) }));
    setWallCabinetHeights((prev) => ({ ...prev, [viewportWall]: prev[viewportWall].filter((_, index) => index !== removeAt) }));
    setWallCabinetDepths((prev) => ({ ...prev, [viewportWall]: prev[viewportWall].filter((_, index) => index !== removeAt) }));
    setSelectedCabinet(null);
    setHoverInfoCabinet(null);
  };

  const handleRunOffsetChange = (value) => {
    const nextValue = clamp(Number(value) || 0, currentAllowedRunOffset.min, currentAllowedRunOffset.max);
    setWallOffsets((prev) => ({ ...prev, [viewportWall]: nextValue }));
  };

  const handleCenterRun = () => {
    if (hasLockedPosition) return;
    const preferred = currentPreferredSegment;
    if (!preferred) return setWallOffsets((prev) => ({ ...prev, [viewportWall]: 0 }));
    const offset = getSegmentAlignedOffset(preferred, currentUsedWidth, "center", getWallLengthInches(viewportWall, roomWidth, roomDepth));
    setWallOffsets((prev) => ({ ...prev, [viewportWall]: clamp(offset, currentAllowedRunOffset.min, currentAllowedRunOffset.max) }));
  };

  const handleAlignLeft = () => {
    if (hasLockedPosition) return;
    const preferred = currentPreferredSegment;
    if (!preferred) return;
    const offset = getSegmentAlignedOffset(preferred, currentUsedWidth, "left", getWallLengthInches(viewportWall, roomWidth, roomDepth));
    setWallOffsets((prev) => ({ ...prev, [viewportWall]: clamp(offset, currentAllowedRunOffset.min, currentAllowedRunOffset.max) }));
  };

  const handleAlignRight = () => {
    if (hasLockedPosition) return;
    const preferred = currentPreferredSegment;
    if (!preferred) return;
    const offset = getSegmentAlignedOffset(preferred, currentUsedWidth, "right", getWallLengthInches(viewportWall, roomWidth, roomDepth));
    setWallOffsets((prev) => ({ ...prev, [viewportWall]: clamp(offset, currentAllowedRunOffset.min, currentAllowedRunOffset.max) }));
  };

  const handleAutoAdjustSizes = () => {
    const preserveOffset = hasLockedPosition;
    const count = currentCabinetWidths.length;
    if (!count) return;
    const preferred = currentPreferredSegment;
    const targetWidth = preferred ? preferred.width : currentAvailableWidth;
    const lockedWidths = currentCabinetTypes.map((type, index) => ((type === "equipment-gap" || currentCabinetLocks[index]) ? currentCabinetWidths[index] : 0));
    const nextWidths = autoAdjustCabinetWidths(count, targetWidth, lockedWidths, 6, 30);
    setWallCabinets((prev) => ({ ...prev, [viewportWall]: nextWidths }));
    requestAnimationFrame(() => {
      if (preserveOffset) return;
      const runWidth = sumWidths(nextWidths);
      const offset = preferred ? getSegmentAlignedOffset(preferred, runWidth, "center", getWallLengthInches(viewportWall, roomWidth, roomDepth)) : 0;
      const nextAllowed = getAllowedRunOffsetRange(viewportWall, nextWidths, roomWidth, roomDepth, activeWalls, wallOpenings, wallDepths);
      setWallOffsets((prev) => ({ ...prev, [viewportWall]: clamp(offset, nextAllowed.min, nextAllowed.max) }));
    });
  };

  const handleResetDefaultSizes = () => {
    const count = currentCabinetWidths.length;
    if (!count) return;
    const nextWidths = resetCabinetWidthsToDefault(count, currentAvailableWidth, defaultCabinetWidth);
    setWallCabinets((prev) => ({ ...prev, [viewportWall]: nextWidths }));
    setWallCabinetTypes((prev) => ({ ...prev, [viewportWall]: normalizeCabinetTypes(nextWidths.length, prev[viewportWall]) }));
    setSelectedCabinet(null);
    setHoverInfoCabinet(null);
  };

  const handleCabinetCountChange = (nextCount) => {
    const targetCount = clamp(Number(nextCount) || 1, 1, 20);
    const current = [...currentCabinetWidths];
    let next = current;
    if (targetCount > current.length) {
      while (next.length < targetCount) {
        if (sumWidths(next) + defaultCabinetWidth > currentAvailableWidth) break;
        next = [...next, defaultCabinetWidth];
      }
    } else if (targetCount < current.length) {
      next = current.slice(0, targetCount);
    }
    setWallCabinets((prev) => ({ ...prev, [viewportWall]: next }));
    setWallCabinetTypes((prev) => ({ ...prev, [viewportWall]: normalizeCabinetTypes(next.length, prev[viewportWall]) }));
    setWallCabinetLocks((prev) => ({ ...prev, [viewportWall]: normalizeCabinetLocks(next.length, prev[viewportWall]) }));
    setWallCabinetPositionLocks((prev) => ({ ...prev, [viewportWall]: normalizeCabinetLocks(next.length, prev[viewportWall]) }));
  };

  const handlePointerMove = (e) => {
    if (!sceneRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    if (movingCabinet !== null) {
      const totalWidth = currentCabinetWidths.reduce((sum, width) => sum + width * 10, 0);
      const localX = dx + dragStartRef.current.moveStartX;
      let edge = -totalWidth / 2;
      let chosenIndex = 0;
      for (let i = 0; i <= currentCabinetWidths.length; i += 1) {
        if (localX >= edge) chosenIndex = i;
        if (i < currentCabinetWidths.length) edge += currentCabinetWidths[i] * 10;
      }
      setDropIndex(chosenIndex);
      return;
    }
    if (selectedCabinet !== null) return;
    if (isPanning) {
      setPanX(dragStartRef.current.panX + dx);
      setPanY(dragStartRef.current.panY + dy);
      return;
    }
    if (!isDragging) return;
    const orbitSensitivity = 0.4;
    const tiltSensitivity = 0.25;
    const nextOrbit = dragStartRef.current.orbit + dx * orbitSensitivity;
    const nextTilt = dragStartRef.current.tilt - dy * tiltSensitivity;
    const clampedTilt = clamp(nextTilt, -80, 80);
    const now = performance.now();
    const dt = Math.max(16, now - (lastPointerRef.current.time || now - 16));
    const stepDx = e.clientX - lastPointerRef.current.x;
    const stepDy = e.clientY - lastPointerRef.current.y;
    velocityRef.current = { orbit: (stepDx * orbitSensitivity) / dt, tilt: (-stepDy * tiltSensitivity) / dt };
    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };
    setOrbit(nextOrbit);
    setTilt(clampedTilt);
  };

  const handlePointerLeave = () => {
    setIsDragging(false);
    setIsPanning(false);
    if (movingCabinet !== null) {
      setMovingCabinet(null);
      setDropIndex(null);
    }
  };

  const handlePointerDown = (e) => {
    if (selectedCabinet !== null || movingCabinet !== null) return;
    clearHoverTimer();
    if (selectedCabinet === null) setHoverInfoCabinet(null);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, orbit, tilt, panX, panY, moveStartX: 0 };
    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    velocityRef.current = { orbit: 0, tilt: 0 };
    if (e.shiftKey) {
      setIsPanning(true);
      setIsDragging(false);
    } else {
      setIsDragging(true);
      setIsPanning(false);
    }
  };

  const finishMove = () => {
    if (movingCabinet !== null && dropIndex !== null) {
      const adjustedIndex = dropIndex > movingCabinet ? dropIndex - 1 : dropIndex;
      const moved = movePair(wallCabinets[viewportWall], wallCabinetTypes[viewportWall], wallCabinetLocks[viewportWall], wallCabinetPositionLocks[viewportWall], wallCabinetHeights[viewportWall], wallCabinetDepths[viewportWall], movingCabinet, adjustedIndex);
      setWallCabinets((prev) => ({ ...prev, [viewportWall]: moved.nextWidths }));
      setWallCabinetTypes((prev) => ({ ...prev, [viewportWall]: moved.nextTypes }));
      setWallCabinetLocks((prev) => ({ ...prev, [viewportWall]: moved.nextLocks }));
      setWallCabinetPositionLocks((prev) => ({ ...prev, [viewportWall]: moved.nextPositionLocks }));
      setWallCabinetHeights((prev) => ({ ...prev, [viewportWall]: moved.nextHeights }));
      setWallCabinetDepths((prev) => ({ ...prev, [viewportWall]: moved.nextDepths }));
      setSelectedCabinet(adjustedIndex);
    }
    setMovingCabinet(null);
    setDropIndex(null);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsPanning(false);
    finishMove();
  };

  const handleWheel = (e) => {
    if (selectedCabinet !== null || movingCabinet !== null || !e.shiftKey) return;
    e.preventDefault();
    setZoom((prev) => clamp(prev - e.deltaY * 0.0015, 0.4, 2.5));
  };

  const handleMoveStart = (index) => {
    setSelectedCabinet(null);
    setHoverInfoCabinet(null);
    setHoveredCabinet(null);
    setMovingCabinet(index);
    setDropIndex(index);
    const totalWidth = currentCabinetWidths.reduce((sum, width) => sum + width * 10, 0);
    const leftOffset = currentCabinetWidths.slice(0, index).reduce((sum, width) => sum + width * 10, -totalWidth / 2);
    dragStartRef.current.moveStartX = leftOffset + (currentCabinetWidths[index] * 10) / 2;
  };

  useEffect(() => {
    if (isDragging || isPanning || movingCabinet !== null) return;
    let lastTime = performance.now();
    const tick = (now) => {
      const dt = Math.max(16, now - lastTime);
      lastTime = now;
      const decay = Math.log1p(dt * 0.12);
      velocityRef.current.orbit *= Math.max(0, 1 - decay * 0.22);
      velocityRef.current.tilt *= Math.max(0, 1 - decay * 0.28);
      const orbitDelta = velocityRef.current.orbit * dt;
      const tiltDelta = velocityRef.current.tilt * dt;
      if (Math.abs(orbitDelta) < 0.01 && Math.abs(tiltDelta) < 0.01) {
        velocityRef.current = { orbit: 0, tilt: 0 };
        animationFrameRef.current = null;
        return;
      }
      setOrbit((prev) => prev + orbitDelta);
      setTilt((prev) => clamp(prev + tiltDelta, -80, 80));
      animationFrameRef.current = requestAnimationFrame(tick);
    };
    if (Math.abs(velocityRef.current.orbit) > 0.001 || Math.abs(velocityRef.current.tilt) > 0.001) {
      animationFrameRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    };
  }, [isDragging, isPanning, movingCabinet]);

  useEffect(() => () => clearHoverTimer(), []);

  useEffect(() => {
    setHoveredCabinet(null);
    setHoverInfoCabinet(null);
    setSelectedCabinet(null);
    setMovingCabinet(null);
    setDropIndex(null);
  }, [viewportWall]);

  const infoCabinetIndex = selectedCabinet !== null ? selectedCabinet : hoverInfoCabinet;
  const infoCabinetWidth = infoCabinetIndex !== null ? currentCabinetWidths[infoCabinetIndex] : null;
  const infoCabinetType = infoCabinetIndex !== null ? currentCabinetTypes[infoCabinetIndex] || "cabinet" : "cabinet";
  const infoCabinetLocked = infoCabinetIndex !== null ? Boolean(currentCabinetLocks[infoCabinetIndex]) : false;
  const infoCabinetPositionLocked = infoCabinetIndex !== null ? Boolean(currentCabinetPositionLocks[infoCabinetIndex]) : false;

  return (
    <div className="min-h-screen bg-zinc-100 p-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <h1 className="text-2xl font-semibold">V1 View Control</h1>
          <p className="mt-2 text-sm text-zinc-600">Viewport wall tabs now control which wall run you are editing. Active walls render in the viewport, and cabinet width/count are constrained by doors, windows, and corner blockers.</p>
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border bg-zinc-50 p-4">
              <div className="text-sm font-semibold text-zinc-900">Room envelope</div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div><label className="mb-2 block text-sm font-medium text-zinc-900">Width</label><input className="w-full rounded-xl border px-3 py-2" type="number" min="0" step="1" value={roomWidth} onChange={(e) => setRoomWidth(Math.max(0, Number(e.target.value) || 0))} /></div>
                <div><label className="mb-2 block text-sm font-medium text-zinc-900">Depth</label><input className="w-full rounded-xl border px-3 py-2" type="number" min="0" step="1" value={roomDepth} onChange={(e) => setRoomDepth(Math.max(0, Number(e.target.value) || 0))} /></div>
                <div><label className="mb-2 block text-sm font-medium text-zinc-900">Height</label><input className="w-full rounded-xl border px-3 py-2" type="number" min="0" step="1" value={roomHeight} onChange={(e) => setRoomHeight(Math.max(0, Number(e.target.value) || 0))} /></div>
              </div>
              <div className="mt-4">
                <div className="mb-2 text-sm font-medium text-zinc-900">Walls to receive cabinets</div>
                <div className="flex items-center justify-center">
                  <div className="relative h-28 w-28 rounded-2xl border-2 border-zinc-300 bg-white">
                    <button type="button" className={`absolute inset-x-4 top-1 h-5 rounded-md border text-xs font-medium ${activeWalls.includes(1) ? "border-emerald-500 bg-emerald-100 text-emerald-800" : "border-zinc-300 bg-zinc-50 text-zinc-600"}`} onClick={() => toggleWall(1)}>1</button>
                    <button type="button" className={`absolute inset-y-4 right-1 w-5 rounded-md border text-xs font-medium ${activeWalls.includes(2) ? "border-emerald-500 bg-emerald-100 text-emerald-800" : "border-zinc-300 bg-zinc-50 text-zinc-600"}`} onClick={() => toggleWall(2)}>2</button>
                    <button type="button" className={`absolute inset-x-4 bottom-1 h-5 rounded-md border text-xs font-medium ${activeWalls.includes(3) ? "border-emerald-500 bg-emerald-100 text-emerald-800" : "border-zinc-300 bg-zinc-50 text-zinc-600"}`} onClick={() => toggleWall(3)}>3</button>
                    <button type="button" className={`absolute inset-y-4 left-1 w-5 rounded-md border text-xs font-medium ${activeWalls.includes(4) ? "border-emerald-500 bg-emerald-100 text-emerald-800" : "border-zinc-300 bg-zinc-50 text-zinc-600"}`} onClick={() => toggleWall(4)}>4</button>
                    <div className="absolute inset-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60" />
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                <div className="text-left text-xs leading-relaxed text-zinc-600">While facing the wall, measure from the right-most wall. Doors and windows reduce the usable cabinet width on that wall. Corner blocker logic also reserves cabinet depth + 4” where active walls intersect.</div>
                {WALLS.map((wallNumber) => {
                  const opening = wallOpenings[wallNumber];
                  const isExpanded = expandedWalls.includes(wallNumber);
                  const isActive = activeWalls.includes(wallNumber);
                  return (
                    <div key={wallNumber} className="rounded-2xl border bg-white p-3 text-left">
                      <button type="button" className="mb-3 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left" onClick={() => toggleExpandedWall(wallNumber)}>
                        <span className="text-sm font-semibold text-zinc-900">Wall {wallNumber}</span>
                        <span className={`rounded-md px-2 py-1 text-xs font-medium ${isActive ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}`}>{isActive ? "cabinet wall" : "inactive"}</span>
                      </button>
                      {isExpanded && (
                        <>
                          <div className="grid grid-cols-4 items-end gap-3 text-left">
                            <label className="flex items-center justify-start gap-2 text-sm text-zinc-700"><input type="checkbox" checked={opening.door} onChange={(e) => updateWallOpening(wallNumber, "door", e.target.checked)} />Door</label>
                            <div><label className="mb-1 block text-xs font-medium text-zinc-700">Door distance from right wall (in.)</label><input className="w-full rounded-xl border px-3 py-2" type="number" min="0" step="1" value={opening.doorOffset} onChange={(e) => updateWallOpening(wallNumber, "doorOffset", Number(e.target.value) || 0)} disabled={!opening.door} /></div>
                            <div><label className="mb-1 block text-xs font-medium text-zinc-700">Door width trim-to-trim (in.)</label><input className="w-full rounded-xl border px-3 py-2" type="number" min="0" step="1" value={opening.doorWidth} onChange={(e) => updateWallOpening(wallNumber, "doorWidth", Number(e.target.value) || 0)} disabled={!opening.door} /></div>
                            <div><label className="mb-1 block text-xs font-medium text-zinc-700">Cabinet depth (in.)</label><input className="w-full rounded-xl border px-3 py-2" type="number" min="12" max="36" step="1" value={wallDepths[wallNumber]} onChange={(e) => updateWallDepth(wallNumber, e.target.value)} /></div>
                            <label className="flex items-center justify-start gap-2 text-sm text-zinc-700"><input type="checkbox" checked={wallCabinetSections[wallNumber]?.lowers ?? true} onChange={(e) => setWallCabinetSections((prev) => ({ ...prev, [wallNumber]: { ...(prev[wallNumber] || {}), lowers: e.target.checked } }))} />Lowers</label>
                            <label className="flex items-center justify-start gap-2 text-sm text-zinc-700"><input type="checkbox" checked={wallCabinetSections[wallNumber]?.uppers ?? false} onChange={(e) => setWallCabinetSections((prev) => ({ ...prev, [wallNumber]: { ...(prev[wallNumber] || {}), uppers: e.target.checked } }))} />Uppers</label>
                            <label className="flex items-center justify-start gap-2 text-sm text-zinc-700"><input type="checkbox" checked={wallCabinetSections[wallNumber]?.upperSyncWidth ?? true} onChange={(e) => setWallCabinetSections((prev) => ({ ...prev, [wallNumber]: { ...(prev[wallNumber] || {}), upperSyncWidth: e.target.checked } }))} />Sync upper width</label>
                            <label className="flex items-center justify-start gap-2 text-sm text-zinc-700"><input type="checkbox" checked={wallCountertops[wallNumber]?.enabled ?? false} onChange={(e) => setWallCountertops((prev) => ({ ...prev, [wallNumber]: { ...(prev[wallNumber] || {}), enabled: e.target.checked } }))} />Countertop</label>
                          </div>
                          <div className="mt-3 grid grid-cols-5 items-end gap-3 text-left">
                            <label className="flex items-center justify-start gap-2 text-sm text-zinc-700"><input type="checkbox" checked={opening.window} onChange={(e) => updateWallOpening(wallNumber, "window", e.target.checked)} />Window</label>
                            <div><label className="mb-1 block text-xs font-medium text-zinc-700">Window distance from right wall (in.)</label><input className="w-full rounded-xl border px-3 py-2" type="number" min="0" step="1" value={opening.windowOffset} onChange={(e) => updateWallOpening(wallNumber, "windowOffset", Number(e.target.value) || 0)} disabled={!opening.window} /></div>
                            <div><label className="mb-1 block text-xs font-medium text-zinc-700">Window width (in.)</label><input className="w-full rounded-xl border px-3 py-2" type="number" min="0" step="1" value={opening.windowWidth} onChange={(e) => updateWallOpening(wallNumber, "windowWidth", Number(e.target.value) || 0)} disabled={!opening.window} /></div>
                            <div><label className="mb-1 block text-xs font-medium text-zinc-700">Window height (in.)</label><input className="w-full rounded-xl border px-3 py-2" type="number" min="0" step="1" value={opening.windowHeight} onChange={(e) => updateWallOpening(wallNumber, "windowHeight", Number(e.target.value) || 0)} disabled={!opening.window} /></div>
                            <div><label className="mb-1 block text-xs font-medium text-zinc-700">Window height from floor (in.)</label><input className="w-full rounded-xl border px-3 py-2" type="number" min="0" step="1" value={opening.windowBottom} onChange={(e) => updateWallOpening(wallNumber, "windowBottom", Number(e.target.value) || 0)} disabled={!opening.window} /></div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="text-sm text-zinc-600">{movingCabinet !== null ? `Moving cabinet ${movingCabinet + 1} on wall ${viewportWall}` : selectedCabinet !== null ? `Editing cabinet ${selectedCabinet + 1} on wall ${viewportWall}` : `Viewport wall ${viewportWall}`}</div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="text-xl font-semibold">Viewport</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" className={`rounded-xl border px-3 py-2 text-sm font-medium ${isAllWallsView ? "border-emerald-500 bg-emerald-100 text-emerald-800" : "border-zinc-300 bg-white text-zinc-700"}`} onClick={() => setViewportWall("all")}>All Walls</button>
            {activeWalls.map((wallNumber) => (
              <button key={`viewport-wall-${wallNumber}`} type="button" className={`rounded-xl border px-3 py-2 text-sm font-medium ${viewportWall === wallNumber ? "border-emerald-500 bg-emerald-100 text-emerald-800" : "border-zinc-300 bg-white text-zinc-700"}`} onClick={() => setViewportWall(wallNumber)}>Wall {wallNumber}</button>
            ))}
          </div>
          <div ref={sceneRef} onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerLeave} onWheel={handleWheel} className="relative mt-4 h-[700px] overflow-hidden rounded-2xl border bg-gradient-to-b from-zinc-50 to-zinc-100">
            <Viewport3D
              defaultCabinetHeight={defaultCabinetHeight}
              orbit={orbit}
              tilt={tilt}
              zoom={zoom}
              panX={panX}
              panY={panY}
              roomWidth={roomWidth}
              roomDepth={roomDepth}
              roomHeight={roomHeight}
              toeKickHeight={toeKickHeight}
              activeWalls={activeWalls}
              viewportWall={viewportWall}
              hoveredCabinet={hoveredCabinet}
              selectedCabinet={selectedCabinet}
              movingCabinet={movingCabinet}
              dropIndex={dropIndex}
              wallOpenings={wallOpenings}
              onCabinetEnter={handleCabinetEnter}
              onCabinetLeave={handleCabinetLeave}
              onCabinetClick={handleCabinetClick}
              onMoveStart={handleMoveStart}
              onMoveEnd={finishMove}
              widthsByWall={wallCabinets}
              typesByWall={wallCabinetTypes}
              heightsByWall={wallCabinetHeights}
              depthsByWall={wallCabinetDepths}
              positionLocksByWall={wallCabinetPositionLocks}
              sectionSettingsByWall={wallCabinetSections}
              upperWidthsByWall={wallUpperWidths}
              countertopSettingsByWall={wallCountertops}
              offsetsByWall={wallOffsets}
              wallDepths={wallDepths}
              showDimensions={showDimensions}
            />
            <div className="absolute left-4 top-4 rounded-xl bg-white/85 px-3 py-2 text-sm shadow">zoom {zoom.toFixed(2)}× · pan {panX.toFixed(0)},{panY.toFixed(0)} · viewport {isAllWallsView ? "all walls" : `wall ${viewportWall}`} · room {roomWidth}×{roomDepth}×{roomHeight} · {movingCabinet !== null ? "moving" : isPanning ? "panning" : isDragging ? "dragging" : "gliding"}</div>

            {!isAllWallsView && infoCabinetIndex !== null && !isDragging && !isPanning && movingCabinet === null && (
              <div className="absolute right-4 top-4 w-72 rounded-2xl border bg-white/95 p-4 text-sm shadow-xl backdrop-blur" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-zinc-900">Wall {viewportWall} · Cabinet {infoCabinetIndex + 1}</div>
                  {selectedCabinet !== null && (
                    <button
                      className="rounded-lg border px-2 py-1 text-xs text-zinc-700"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCabinet(null);
                      }}
                    >
                      Done
                    </button>
                  )}
                </div>
                <div className="mt-2 text-zinc-700">Width: {formatInches(infoCabinetWidth)}”</div>
                <div className="text-zinc-700">Type: {infoCabinetType === "equipment-gap" ? "Equipment Gap" : "Cabinet"}</div>
                <div className="text-zinc-700">Width lock: {infoCabinetLocked ? "Locked" : "Unlocked"}</div>
                <div className="text-zinc-700">Position lock: {infoCabinetPositionLocked ? "Locked" : "Unlocked"}</div>
                <div className="text-zinc-700">Overall height: {formatInches(currentCabinetHeights[infoCabinetIndex] || defaultCabinetHeight)}”</div>
                <div className="text-zinc-700">Depth: {formatInches(currentCabinetDepths[infoCabinetIndex] || (wallDepths[viewportWall] || DEFAULT_CABINET_DEPTH_IN))}”</div>
                <div className="text-zinc-700">Toe kick height: {formatInches(toeKickHeight)}”</div>
                <div className="text-zinc-700">Available wall width: {formatInches(currentAvailableWidth)}”</div>
                <div className="text-zinc-700">Left remaining: {formatInches(currentSideSpace.left)}”</div>
                <div className="text-zinc-700">Right remaining: {formatInches(currentSideSpace.right)}”</div>
                {selectedCabinet === infoCabinetIndex ? (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs font-medium text-zinc-900">Edit width</label>
                    <input className="w-full rounded-xl border px-3 py-2" type="number" min="6" max="40" step="0.25" value={infoCabinetWidth ?? 15} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onChange={(e) => handleWidthChange(e.target.value)} />
                    <label className="block text-xs font-medium text-zinc-900">Edit height</label>
                    <input className="w-full rounded-xl border px-3 py-2" type="number" min="20" max="60" step="0.125" value={currentCabinetHeights[infoCabinetIndex] ?? defaultCabinetHeight} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onChange={(e) => handleHeightChange(e.target.value)} />
                    <label className="block text-xs font-medium text-zinc-900">Edit depth</label>
                    <input className="w-full rounded-xl border px-3 py-2" type="number" min="12" max="36" step="0.125" value={currentCabinetDepths[infoCabinetIndex] ?? (wallDepths[viewportWall] || defaultCabinetDepth)} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onChange={(e) => handleDepthChange(e.target.value)} />
                    <label className="block text-xs font-medium text-zinc-900">Cabinet type</label>
                    <select className="w-full rounded-xl border px-3 py-2" value={infoCabinetType} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onChange={(e) => handleTypeChange(e.target.value)}>
                      <option value="cabinet">Cabinet</option>
                      <option value="equipment-gap">Equipment Gap</option>
                    </select>
                    <label className="flex items-center gap-2 text-xs text-zinc-700">
                      <input type="checkbox" checked={infoCabinetLocked} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onChange={(e) => handleLockWidthChange(e.target.checked)} />
                      Lock width
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-700">
                      <input type="checkbox" checked={infoCabinetPositionLocked} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onChange={(e) => handleLockPositionChange(e.target.checked)} />
                      Lock position
                    </label>
                    <button
                      type="button"
                      className="rounded-xl border px-3 py-2 text-xs font-medium text-red-700 disabled:opacity-40"
                      disabled={currentCabinetWidths.length <= 1}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCabinet();
                      }}
                    >
                      Delete cabinet
                    </button>
                    <div className="text-xs text-zinc-500">Equipment gap keeps the opening width and position, but renders it as an open invisible equipment space.</div>
                    <div className="text-xs text-zinc-500">Locked boxes keep their width, height, and depth while the active box height/depth controls drive the unlocked ones.</div>
                    <div className="text-xs text-zinc-500">Position lock prevents align/auto actions from shifting the run and also blocks drag-reordering that cabinet.</div>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-zinc-500">Hover 1.2s, then click this cabinet to edit width or type.</div>
                )}
              </div>
            )}
          </div>

          {!isAllWallsView && (
            <div className="mt-6 rounded-2xl border bg-zinc-50 p-4">
              <div className="mb-4 text-sm font-semibold text-zinc-900">Wall {viewportWall} layout tools</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-900">Box height</label>
                  <input className="w-full rounded-xl border px-3 py-2" type="number" min="20" max="60" step="0.125" value={defaultCabinetHeight} onChange={(e) => setDefaultCabinetHeight(clamp(Number(e.target.value) || DEFAULT_CABINET_HEIGHT_IN, 20, 60))} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-900">Box depth</label>
                  <input className="w-full rounded-xl border px-3 py-2" type="number" min="12" max="36" step="0.125" value={defaultCabinetDepth} onChange={(e) => setDefaultCabinetDepth(clamp(Number(e.target.value) || DEFAULT_CABINET_DEPTH_IN, 12, 36))} />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-900">Cabinet Count · Wall {viewportWall}</label>
                <input className="w-full rounded-xl border px-3 py-2" type="number" min="1" max="20" step="1" value={currentCabinetWidths.length} onChange={(e) => handleCabinetCountChange(e.target.value)} />
                <div className="mt-2 text-sm text-zinc-600">Used: {formatInches(currentUsedWidth)}” / Available: {formatInches(currentAvailableWidth)}” · Remaining: {formatInches(currentRemainingWidth)}”</div>
              </div>
              <label className="mt-5 flex items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" checked={showDimensions} onChange={(e) => setShowDimensions(e.target.checked)} />
                Show dimensions
              </label>
              <div className="mt-2 text-xs text-zinc-500">Shows box widths and distance from the actual left wall edge, plus door dimensions. Windows are not labeled.</div>
              <div className="mt-2 text-xs text-zinc-500">Upper defaults: 14.000” deep, 18.000” high. Upper widths sync to lowers by default.</div>
              <div className="mt-2 text-xs text-zinc-500">Countertops follow the lower run length, project 1.000” past the cabinet face, and are fixed at 1.250” thick.</div>
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-zinc-900">Run Offset · Wall {viewportWall}</label>
                <input className="w-full" type="range" min={currentAllowedRunOffset.min} max={currentAllowedRunOffset.max} step="0.25" value={currentRunOffset} onChange={(e) => handleRunOffsetChange(e.target.value)} />
                <div className="mt-2 text-sm text-zinc-600">Left remaining: {formatInches(currentSideSpace.left)}” · Right remaining: {formatInches(currentSideSpace.right)}”</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="rounded-xl border px-3 py-2 text-sm font-medium text-zinc-700" onClick={handleCenterRun}>Center Run</button>
                  <button type="button" className="rounded-xl border px-3 py-2 text-sm font-medium text-zinc-700" onClick={handleAlignLeft}>Align Left</button>
                  <button type="button" className="rounded-xl border px-3 py-2 text-sm font-medium text-zinc-700" onClick={handleAlignRight}>Align Right</button>
                  <button type="button" className="rounded-xl border px-3 py-2 text-sm font-medium text-zinc-700" onClick={handleAutoAdjustSizes}>Auto Adjust Sizes</button>
                  <button type="button" className="rounded-xl border px-3 py-2 text-sm font-medium text-zinc-700" onClick={handleResetDefaultSizes}>Reset Default Sizes</button>
                </div>
              </div>
            </div>
          )}

          {isAllWallsView && (
            <div className="mt-6 rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-600">
              All Walls view is display-only. Select a specific wall tab to edit cabinet count, sizes, offsets, alignment, and cabinet type.
            </div>
          )}
          <div className="mt-3 text-xs text-zinc-500">Self-tests: {testsPassed ? "passed" : "failed"}</div>
        </div>
      </div>
    </div>
  );
}
