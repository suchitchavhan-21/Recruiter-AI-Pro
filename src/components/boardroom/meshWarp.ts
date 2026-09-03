import { FaceGeometry, FACIAL_REGION_INDICES } from "./faceLandmarks";

/**
 * 2D Local Mesh Deformation Engine (MediaPipe Face Mesh Topology)
 *
 * Calibrated for maximum perceptual realism:
 * - 70% photographic stability / 20% facial articulation / 10% subtle micro-motion
 * - Subpixel dilation on triangle rasterization prevents visible mesh boundaries
 * - Natural ambient oral depth shadow without stark artificial black patches
 * - Persona-specific calibration scales for Sarah, David, and Marcus
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Triangle {
  p0: number;
  p1: number;
  p2: number;
  region?: "mouth" | "jaw" | "eyeLeft" | "eyeRight" | "cheek" | "base";
}

/**
 * Generates triangular mesh topology for MediaPipe 468/478 landmarks
 */
export function buildFacialMeshTriangles(geom: FaceGeometry): Triangle[] {
  const triangles: Triangle[] = [];
  const lm = geom.landmarks;

  function addTri(p0: number, p1: number, p2: number, region?: Triangle["region"]) {
    if (lm[p0] && lm[p1] && lm[p2]) {
      triangles.push({ p0, p1, p2, region });
    }
  }

  const outer = FACIAL_REGION_INDICES.mouthOuter;
  const inner = FACIAL_REGION_INDICES.mouthInner;

  // 1. Mouth Outer to Inner Lip Ribbon
  // Both outer and inner have 20 matching circumferential points
  const n = Math.min(outer.length, inner.length);
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    addTri(outer[i], outer[next], inner[i], "mouth");
    addTri(outer[next], inner[next], inner[i], "mouth");
  }

  // 2. Upper Lip to Nose & Philtrum
  addTri(61, 185, 98, "mouth");
  addTri(185, 40, 98, "mouth");
  addTri(40, 39, 97, "mouth");
  addTri(39, 37, 2, "mouth");
  addTri(37, 0, 2, "mouth");
  addTri(0, 267, 2, "mouth");
  addTri(267, 269, 326, "mouth");
  addTri(269, 270, 326, "mouth");
  addTri(270, 409, 327, "mouth");
  addTri(409, 291, 327, "mouth");
  addTri(98, 97, 2, "mouth");
  addTri(2, 326, 327, "mouth");
  addTri(2, 1, 326, "mouth");

  // 3. Lower Lip to Chin & Jaw (Mandibular Hinge)
  addTri(61, 146, 172, "jaw");
  addTri(146, 91, 136, "jaw");
  addTri(91, 181, 150, "jaw");
  addTri(181, 84, 149, "jaw");
  addTri(84, 17, 176, "jaw");
  addTri(17, 314, 148, "jaw");
  addTri(148, 176, 152, "jaw");
  addTri(17, 148, 152, "jaw");
  addTri(314, 405, 377, "jaw");
  addTri(152, 148, 377, "jaw");
  addTri(405, 321, 400, "jaw");
  addTri(377, 400, 378, "jaw");
  addTri(321, 375, 378, "jaw");
  addTri(375, 291, 379, "jaw");
  addTri(291, 365, 379, "jaw");

  // 4. Cheeks (Low-deformation anchor transitions)
  addTri(61, 205, 98, "cheek");
  addTri(61, 172, 205, "cheek");
  addTri(291, 425, 327, "cheek");
  addTri(291, 365, 425, "cheek");

  // 5. Left Eye & Eyelid
  addTri(33, 160, 144, "eyeLeft");
  addTri(160, 158, 153, "eyeLeft");
  addTri(160, 153, 144, "eyeLeft");
  addTri(158, 133, 153, "eyeLeft");
  addTri(70, 63, 160, "eyeLeft");
  addTri(70, 160, 33, "eyeLeft");
  addTri(63, 105, 158, "eyeLeft");
  addTri(63, 158, 160, "eyeLeft");
  addTri(105, 66, 133, "eyeLeft");
  addTri(105, 133, 158, "eyeLeft");

  // 6. Right Eye & Eyelid
  addTri(362, 385, 380, "eyeRight");
  addTri(385, 387, 373, "eyeRight");
  addTri(385, 373, 380, "eyeRight");
  addTri(387, 263, 373, "eyeRight");
  addTri(300, 293, 385, "eyeRight");
  addTri(300, 385, 362, "eyeRight");
  addTri(293, 334, 387, "eyeRight");
  addTri(293, 387, 385, "eyeRight");
  addTri(334, 296, 263, "eyeRight");
  addTri(334, 263, 387, "eyeRight");

  return triangles;
}

/**
 * Calculates deformed target landmark positions given acoustic speech & blink parameters
 */
export function computeDeformedLandmarks(
  baseLandmarks: Array<{ x: number; y: number }>,
  mouthOpen: number,       // 0 to 10px
  widthScale: number,      // 0.94 to 1.06
  jawOffset: number,       // 0 to 4.5px
  blinkPhaseLeft: number,  // 0 to 1
  blinkPhaseRight: number, // 0 to 1
  gazeX: number,           // -1.5 to +1.5px
  gazeY: number,           // -1.5 to +1.5px
  personaId: number = 0    // 0: Sarah, 1: David, 2: Marcus
): Point2D[] {
  const result: Point2D[] = baseLandmarks.map(p => ({ x: p.x, y: p.y }));

  // Persona-specific calibration scale
  // Sarah (id=0): delicate articulation for 14px resting mouth
  // David (id=1): balanced architectural articulation
  // Marcus (id=2): clear authoritative articulation
  const personaScale = personaId === 0 ? 0.75 : personaId === 1 ? 0.90 : 0.95;
  const maxOpen = personaId === 0 ? 3.8 : 5.2;
  const effMouthOpen = Math.min(mouthOpen * personaScale, maxOpen);

  // 1. Mouth & Speech Deformation
  if (effMouthOpen > 0.2) {
    const lipLift = Math.min(effMouthOpen * 0.12, 0.9);
    const jawDrop = effMouthOpen * 0.42;
    const mouthW = Math.abs(baseLandmarks[291].x - baseLandmarks[61].x);
    const cornerShiftX = (widthScale - 1.0) * mouthW * 0.22;

    // Upper lip (elevates subtly)
    FACIAL_REGION_INDICES.upperLip.forEach(idx => {
      if (result[idx]) result[idx].y -= lipLift;
    });

    // Lower lip (depresses with mandible)
    FACIAL_REGION_INDICES.lowerLip.forEach(idx => {
      if (result[idx]) result[idx].y += jawDrop;
    });

    // Mouth corners (subtle width modulation without tearing cheeks)
    if (result[61]) {
      result[61].x -= cornerShiftX;
      result[61].y += effMouthOpen * 0.05;
    }
    if (result[78]) {
      result[78].x -= cornerShiftX * 0.7;
    }
    if (result[291]) {
      result[291].x += cornerShiftX;
      result[291].y += effMouthOpen * 0.05;
    }
    if (result[308]) {
      result[308].x += cornerShiftX * 0.7;
    }

    // Chin & Mandible Hinge: Chin moves subtly downward, cheeks deform minimally
    // Point 152 is Chin apex
    if (result[152]) {
      result[152].y += jawOffset * 0.40 + jawDrop * 0.32;
    }
    [148, 176, 149, 150, 377, 400, 378].forEach((idx, i) => {
      if (result[idx]) {
        const falloff = Math.cos((i / 7) * Math.PI * 0.4);
        result[idx].y += (jawOffset * 0.30 + jawDrop * 0.22) * falloff;
      }
    });

    // Cheeks follow minimally (prevents stretching surrounding skin)
    [205, 425].forEach(idx => {
      if (result[idx]) result[idx].y += jawOffset * 0.06;
    });
  }

  // 2. Eye Blinking (Upper eyelid landmarks descend toward lower eyelid)
  if (blinkPhaseLeft > 0.02) {
    const upperLeft = [159, 158, 157, 160];
    const lowerLeftY = (baseLandmarks[145].y + baseLandmarks[153].y) * 0.5;
    upperLeft.forEach(idx => {
      if (result[idx]) {
        const drop = (lowerLeftY - baseLandmarks[idx].y) * blinkPhaseLeft * 0.94;
        result[idx].y += drop;
      }
    });
  }

  if (blinkPhaseRight > 0.02) {
    const upperRight = [386, 387, 388, 385];
    const lowerRightY = (baseLandmarks[374].y + baseLandmarks[373].y) * 0.5;
    upperRight.forEach(idx => {
      if (result[idx]) {
        const drop = (lowerRightY - baseLandmarks[idx].y) * blinkPhaseRight * 0.94;
        result[idx].y += drop;
      }
    });
  }

  // 3. Gaze micro-displacement: Extremely subtle, locked inside iris
  const effGazeX = Math.max(-0.4, Math.min(0.4, gazeX * 0.25));
  const effGazeY = Math.max(-0.3, Math.min(0.3, gazeY * 0.20));
  if (Math.abs(effGazeX) > 0.02 || Math.abs(effGazeY) > 0.02) {
    if (result[468]) {
      result[468].x += effGazeX;
      result[468].y += effGazeY;
    }
    if (result[473]) {
      result[473].x += effGazeX;
      result[473].y += effGazeY;
    }
  }

  return result;
}

/**
 * Draws an affine-warped texture triangle from source image to destination canvas.
 * Subpixel expansion outward from centroid prevents visible mesh seams on canvas.
 */
export function drawWarpedTriangle(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | HTMLCanvasElement,
  s0: Point2D,
  s1: Point2D,
  s2: Point2D,
  d0: Point2D,
  d1: Point2D,
  d2: Point2D
) {
  ctx.save();
  ctx.beginPath();

  // Subpixel dilation by 0.45px outward from centroid eliminates 2D canvas boundary cracking
  const cx = (d0.x + d1.x + d2.x) / 3;
  const cy = (d0.y + d1.y + d2.y) / 3;
  const pad = 0.45;

  const dx0 = d0.x + (d0.x > cx ? pad : -pad);
  const dy0 = d0.y + (d0.y > cy ? pad : -pad);
  const dx1 = d1.x + (d1.x > cx ? pad : -pad);
  const dy1 = d1.y + (d1.y > cy ? pad : -pad);
  const dx2 = d2.x + (d2.x > cx ? pad : -pad);
  const dy2 = d2.y + (d2.y > cy ? pad : -pad);

  ctx.moveTo(dx0, dy0);
  ctx.lineTo(dx1, dy1);
  ctx.lineTo(dx2, dy2);
  ctx.closePath();
  ctx.clip();

  // Solve affine matrix: S -> D
  const denom = (s0.x - s2.x) * (s1.y - s2.y) - (s1.x - s2.x) * (s0.y - s2.y);
  if (Math.abs(denom) < 1e-6) {
    ctx.restore();
    return;
  }

  const a = ((d0.x - d2.x) * (s1.y - s2.y) - (d1.x - d2.x) * (s0.y - s2.y)) / denom;
  const b = ((d0.y - d2.y) * (s1.y - s2.y) - (d1.y - d2.y) * (s0.y - s2.y)) / denom;
  const c = ((d1.x - d2.x) * (s0.x - s2.x) - (d0.x - d2.x) * (s1.x - s2.x)) / denom;
  const dCoeff = ((d1.y - d2.y) * (s0.x - s2.x) - (d0.y - d2.y) * (s1.x - s2.x)) / denom;
  const e = d0.x - a * s0.x - c * s0.y;
  const f = d0.y - b * s0.x - dCoeff * s0.y;

  ctx.transform(a, b, c, dCoeff, e, f);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

/**
 * Renders the full local mesh warp onto the destination canvas
 */
export function renderLocalMeshWarp(
  ctx: CanvasRenderingContext2D,
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  baseLandmarks: Array<{ x: number; y: number }>,
  deformedLandmarks: Point2D[],
  triangles: Triangle[],
  oralCavityPath?: Path2D,
  mouthOpen: number = 0
) {
  // 1. Natural subtle inner oral depth (soft ambient shadow, no harsh black hole)
  if (mouthOpen > 0.8 && oralCavityPath) {
    ctx.save();
    const shadowAlpha = Math.min((mouthOpen - 0.8) * 0.05, 0.32);
    ctx.fillStyle = `rgba(24, 10, 10, ${shadowAlpha})`;
    ctx.fill(oralCavityPath);
    ctx.restore();
  }

  // 2. Warp each affected mesh triangle directly from original photo texture
  for (let i = 0; i < triangles.length; i++) {
    const t = triangles[i];
    const s0 = baseLandmarks[t.p0];
    const s1 = baseLandmarks[t.p1];
    const s2 = baseLandmarks[t.p2];
    const d0 = deformedLandmarks[t.p0];
    const d1 = deformedLandmarks[t.p1];
    const d2 = deformedLandmarks[t.p2];

    if (s0 && s1 && s2 && d0 && d1 && d2) {
      drawWarpedTriangle(ctx, sourceImage, s0, s1, s2, d0, d1, d2);
    }
  }
}
