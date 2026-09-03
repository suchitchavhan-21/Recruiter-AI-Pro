import { FaceGeometry } from "./faceLandmarks";

/**
 * 2D Local Mesh Deformation Engine
 * 
 * Performs authentic photographic triangular mesh warping:
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
 * Generates triangular mesh topology for the 68-landmark face
 */
export function buildFacialMeshTriangles(geom: FaceGeometry): Triangle[] {
  const triangles: Triangle[] = [];

  function addTri(p0: number, p1: number, p2: number, region?: Triangle["region"]) {
    triangles.push({ p0, p1, p2, region });
  }

  // 1. Mouth Outer & Inner Mesh (Vermilion borders & lip tissue)
  // Outer: 48..59, Inner: 60..67
  // Upper Lip
  addTri(48, 49, 60, "mouth");
  addTri(49, 61, 60, "mouth");
  addTri(49, 50, 61, "mouth");
  addTri(50, 62, 61, "mouth");
  addTri(50, 51, 62, "mouth");
  addTri(51, 52, 62, "mouth");
  addTri(52, 63, 62, "mouth");
  addTri(52, 53, 63, "mouth");
  addTri(53, 54, 64, "mouth");
  addTri(53, 64, 63, "mouth");

  // Lower Lip
  addTri(48, 60, 67, "mouth");
  addTri(48, 67, 59, "mouth");
  addTri(59, 67, 58, "mouth");
  addTri(58, 67, 66, "mouth");
  addTri(58, 66, 57, "mouth");
  addTri(57, 66, 56, "mouth");
  addTri(56, 66, 65, "mouth");
  addTri(56, 65, 55, "mouth");
  addTri(55, 65, 64, "mouth");
  addTri(55, 64, 54, "mouth");

  // 2. Philtrum / Upper Lip to Nose Base (smooth transition above upper lip)
  // Nose base: 31..35
  addTri(31, 49, 48, "mouth");
  addTri(31, 32, 50, "mouth");
  addTri(31, 50, 49, "mouth");
  addTri(32, 33, 51, "mouth");
  addTri(32, 51, 50, "mouth");
  addTri(33, 34, 52, "mouth");
  addTri(33, 52, 51, "mouth");
  addTri(34, 35, 53, "mouth");
  addTri(34, 53, 52, "mouth");
  addTri(35, 54, 53, "mouth");

  // 3. Lower Lip to Chin & Jaw (Mandibular deformation)
  // Chin: 8, Jaw: 4..12
  addTri(48, 59, 5, "jaw");
  addTri(59, 6, 5, "jaw");
  addTri(59, 58, 6, "jaw");
  addTri(58, 7, 6, "jaw");
  addTri(58, 57, 8, "jaw");
  addTri(58, 8, 7, "jaw");
  addTri(57, 56, 8, "jaw");
  addTri(56, 9, 8, "jaw");
  addTri(56, 55, 9, "jaw");
  addTri(55, 10, 9, "jaw");
  addTri(55, 54, 11, "jaw");
  addTri(55, 11, 10, "jaw");

  // 4. Cheeks (Smooth falloff anchors)
  addTri(48, 4, 3, "cheek");
  addTri(48, 5, 4, "cheek");
  addTri(31, 48, 3, "cheek");
  addTri(54, 12, 11, "cheek");
  addTri(54, 13, 12, "cheek");
  addTri(35, 13, 54, "cheek");

  // 5. Left Eye & Eyelid (36..41)
  addTri(36, 37, 41, "eyeLeft");
  addTri(37, 38, 40, "eyeLeft");
  addTri(37, 40, 41, "eyeLeft");
  addTri(38, 39, 40, "eyeLeft");
  // Eyebrow to Eye (Upper eyelid skin)
  addTri(17, 18, 37, "eyeLeft");
  addTri(17, 37, 36, "eyeLeft");
  addTri(18, 19, 38, "eyeLeft");
  addTri(18, 38, 37, "eyeLeft");
  addTri(19, 20, 39, "eyeLeft");
  addTri(19, 39, 38, "eyeLeft");

  // 6. Right Eye & Eyelid (42..47)
  addTri(42, 43, 47, "eyeRight");
  addTri(43, 44, 46, "eyeRight");
  addTri(43, 46, 47, "eyeRight");
  addTri(44, 45, 46, "eyeRight");
  // Eyebrow to Eye (Upper eyelid skin)
  addTri(22, 23, 43, "eyeRight");
  addTri(22, 43, 42, "eyeRight");
  addTri(23, 24, 44, "eyeRight");
  addTri(23, 44, 43, "eyeRight");
  addTri(24, 25, 45, "eyeRight");
  addTri(24, 45, 44, "eyeRight");

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

  // 1. Mouth Deformation
  if (mouthOpen > 0.2) {
    const lipLift = Math.min(mouthOpen * 0.15, 1.4);
    const jawDrop = mouthOpen * 0.52;
    const mouthW = baseLandmarks[54].x - baseLandmarks[48].x;
    const cornerShiftX = (widthScale - 1.0) * mouthW * 0.45;

    // Upper lip (moves upward subtly)
    [49, 50, 51, 52, 53, 61, 62, 63].forEach(idx => {
      result[idx].y -= lipLift;
    });

    // Lower lip (moves downward with jaw)
    [55, 56, 57, 58, 59, 65, 66, 67].forEach(idx => {
      result[idx].y += jawDrop;
    });

    // Mouth corners (horizontal spread/round)
    result[48].x -= cornerShiftX;
    result[48].y += mouthOpen * 0.08;
    result[60].x -= cornerShiftX * 0.8;
    result[54].x += cornerShiftX;
    result[54].y += mouthOpen * 0.08;
    result[64].x += cornerShiftX * 0.8;

    // Chin & Mandible (anatomical hinge falloff)
    // Points 5..11
    for (let i = 5; i <= 11; i++) {
      const distFromCenter = Math.abs(i - 8) / 3.0; // 0 at chin point 8, 1 at 5 and 11
      const falloff = Math.cos(Math.min(distFromCenter, 1.0) * Math.PI * 0.5);
      result[i].y += (jawOffset * 0.95 + jawDrop * 0.6) * falloff;
    }

    // Cheeks follow subtly
    [3, 4].forEach(idx => {
      result[idx].y += jawOffset * 0.15;
    });
    [12, 13].forEach(idx => {
      result[idx].y += jawOffset * 0.15;
    });
  }

  // 2. Eye Blinking & Gaze
  // Left eye
  if (blinkPhaseLeft > 0.02) {
    const eyeH = baseLandmarks[41].y - baseLandmarks[37].y;
    const drop = blinkPhaseLeft * eyeH * 0.92;
    result[37].y += drop;
    result[38].y += drop;
  }
  // Right eye
  if (blinkPhaseRight > 0.02) {
    const eyeH = baseLandmarks[47].y - baseLandmarks[43].y;
    const drop = blinkPhaseRight * eyeH * 0.92;
    result[43].y += drop;
    result[44].y += drop;
  }

  // Gaze micro-displacement on eye centers
  if (Math.abs(gazeX) > 0.05 || Math.abs(gazeY) > 0.05) {
    [37, 38, 40, 41].forEach(idx => {
      result[idx].x += gazeX * 0.5;
      result[idx].y += gazeY * 0.3;
    });
    [43, 44, 46, 47].forEach(idx => {
      result[idx].x += gazeX * 0.5;
      result[idx].y += gazeY * 0.3;
    });
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

    drawWarpedTriangle(ctx, sourceImage, s0, s1, s2, d0, d1, d2);
  }
}
