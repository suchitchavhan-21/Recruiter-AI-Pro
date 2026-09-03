import { FaceGeometry, FACIAL_REGION_INDICES } from "./faceLandmarks";

/**
 * 2D Local Mesh Deformation Engine (MediaPipe Face Mesh Topology)
 *
 * Performs authentic photographic triangular mesh warping:
 * - Uses real detector landmark indices
 * - Warps local triangles for mouth, jaw, chin, cheeks, eyes, and eyelids
 * - Every pixel rendered comes directly from the original photograph
 * - Deformation falls off smoothly toward surrounding skin
 * - Oral depth is rendered within inner lip boundaries without cartoon overlays
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
  // Nose base: 98, 97, 2, 326, 327, 1
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
  // Chin: 152, Jaw: 148, 176, 149, 150, 377, 400, 378, 379
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
  // Contour: 33, 160, 158, 133, 153, 144
  addTri(33, 160, 144, "eyeLeft");
  addTri(160, 158, 153, "eyeLeft");
  addTri(160, 153, 144, "eyeLeft");
  addTri(158, 133, 153, "eyeLeft");
  // Eyebrow upper fold: 70, 63, 105, 66
  addTri(70, 63, 160, "eyeLeft");
  addTri(70, 160, 33, "eyeLeft");
  addTri(63, 105, 158, "eyeLeft");
  addTri(63, 158, 160, "eyeLeft");
  addTri(105, 66, 133, "eyeLeft");
  addTri(105, 133, 158, "eyeLeft");

  // 6. Right Eye & Eyelid
  // Contour: 362, 385, 387, 263, 373, 380
  addTri(362, 385, 380, "eyeRight");
  addTri(385, 387, 373, "eyeRight");
  addTri(385, 373, 380, "eyeRight");
  addTri(387, 263, 373, "eyeRight");
  // Eyebrow upper fold: 300, 293, 334, 296
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
  gazeY: number            // -1.5 to +1.5px
): Point2D[] {
  const result: Point2D[] = baseLandmarks.map(p => ({ x: p.x, y: p.y }));

  // 1. Mouth & Speech Deformation
  if (mouthOpen > 0.2) {
    const lipLift = Math.min(mouthOpen * 0.15, 1.4);
    const jawDrop = mouthOpen * 0.52;
    const mouthW = Math.abs(baseLandmarks[291].x - baseLandmarks[61].x);
    const cornerShiftX = (widthScale - 1.0) * mouthW * 0.45;

    // Upper lip (elevates slightly)
    FACIAL_REGION_INDICES.upperLip.forEach(idx => {
      if (result[idx]) result[idx].y -= lipLift;
    });

    // Lower lip (depresses with mandible)
    FACIAL_REGION_INDICES.lowerLip.forEach(idx => {
      if (result[idx]) result[idx].y += jawDrop;
    });

    // Mouth corners (horizontal stretch/round)
    if (result[61]) {
      result[61].x -= cornerShiftX;
      result[61].y += mouthOpen * 0.08;
    }
    if (result[78]) {
      result[78].x -= cornerShiftX * 0.8;
    }
    if (result[291]) {
      result[291].x += cornerShiftX;
      result[291].y += mouthOpen * 0.08;
    }
    if (result[308]) {
      result[308].x += cornerShiftX * 0.8;
    }

    // Chin & Mandible Hinge
    // Point 152 is Chin apex
    if (result[152]) {
      result[152].y += jawOffset * 0.95 + jawDrop * 0.6;
    }
    [148, 176, 149, 150, 377, 400, 378].forEach((idx, i) => {
      if (result[idx]) {
        const falloff = Math.cos((i / 7) * Math.PI * 0.4);
        result[idx].y += (jawOffset * 0.85 + jawDrop * 0.5) * falloff;
      }
    });

    // Cheeks follow subtly
    [205, 425].forEach(idx => {
      if (result[idx]) result[idx].y += jawOffset * 0.15;
    });
  }

  // 2. Eye Blinking (Upper eyelid landmarks descend toward lower eyelid)
  // Left eye: upper [159, 158, 157, 160], lower [145, 153, 154]
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

  // Right eye: upper [386, 387, 388, 385], lower [374, 373, 380]
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

  // 3. Gaze micro-displacement on irises
  if (Math.abs(gazeX) > 0.05 || Math.abs(gazeY) > 0.05) {
    if (result[468]) {
      result[468].x += gazeX * 0.6;
      result[468].y += gazeY * 0.4;
    }
    if (result[473]) {
      result[473].x += gazeX * 0.6;
      result[473].y += gazeY * 0.4;
    }
  }

  return result;
}

/**
 * Draws an affine-warped texture triangle from source image to destination canvas
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
  ctx.moveTo(d0.x, d0.y);
  ctx.lineTo(d1.x, d1.y);
  ctx.lineTo(d2.x, d2.y);
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
  // 1. Oral cavity depth shadow rendered between parting lips
  if (mouthOpen > 0.4 && oralCavityPath) {
    ctx.save();
    ctx.fillStyle = "rgba(14, 5, 5, 0.94)";
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
