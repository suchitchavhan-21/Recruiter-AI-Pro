import { FaceGeometry } from "./faceLandmarks";

/**
 * Facial Masks Builder
 * Creates polygon paths and feathered masks from detected landmark contours.
 * Zero rectangular masks are used.
 */

export interface FacialMasks {
  face: Path2D;
  leftEye: Path2D;
  rightEye: Path2D;
  leftEyelid: Path2D;
  rightEyelid: Path2D;
  mouth: Path2D;
  oralCavity: Path2D;
  lowerFace: Path2D;
  jaw: Path2D;
}

/**
 * Builds Path2D polygon contours for all required facial masks from geometry
 */
export function buildFacialMasks(geom: FaceGeometry): FacialMasks {
  const lm = geom.landmarks;

  // Helper to construct closed polygon from array of landmark indices
  function buildPolygon(indices: number[]): Path2D {
    const path = new Path2D();
    if (indices.length === 0) return path;

    const firstPt = lm[indices[0]];
    if (firstPt) {
      path.moveTo(firstPt.x, firstPt.y);
      for (let i = 1; i < indices.length; i++) {
        const pt = lm[indices[i]];
        if (pt) path.lineTo(pt.x, pt.y);
      }
      path.closePath();
    }
    return path;
  }

  // 1. FACE_MASK: complete facial area (jawline polygon closed across upper temple/forehead)
  const facePath = new Path2D();
  const jawIdx = geom.regions.jaw;
  if (jawIdx.length > 0) {
    const firstPt = lm[jawIdx[0]];
    if (firstPt) {
      facePath.moveTo(firstPt.x, firstPt.y);
      for (let i = 1; i < jawIdx.length; i++) {
        const pt = lm[jawIdx[i]];
        if (pt) facePath.lineTo(pt.x, pt.y);
      }
      facePath.closePath();
    }
  }

  // 2. LEFT_EYE_MASK & RIGHT_EYE_MASK: smooth closed polygons around eye contours
  const leftEyePath = buildPolygon(geom.regions.leftEye);
  const rightEyePath = buildPolygon(geom.regions.rightEye);

  // 3. LEFT_EYELID_MASK & RIGHT_EYELID_MASK: upper eyelid skin crease to eye aperture
  const leftEyelidPath = new Path2D();
  const leIdx = geom.regions.leftEye;
  const lebIdx = geom.regions.leftEyebrow;
  if (leIdx.length > 0 && lebIdx.length > 0) {
    leftEyelidPath.moveTo(lm[leIdx[0]].x, lm[leIdx[0]].y);
    for (const idx of lebIdx) {
      if (lm[idx]) leftEyelidPath.lineTo(lm[idx].x, lm[idx].y);
    }
    for (let i = leIdx.length - 1; i >= 0; i--) {
      const pt = lm[leIdx[i]];
      if (pt) leftEyelidPath.lineTo(pt.x, pt.y);
    }
    leftEyelidPath.closePath();
  }

  const rightEyelidPath = new Path2D();
  const reIdx = geom.regions.rightEye;
  const rebIdx = geom.regions.rightEyebrow;
  if (reIdx.length > 0 && rebIdx.length > 0) {
    rightEyelidPath.moveTo(lm[reIdx[0]].x, lm[reIdx[0]].y);
    for (const idx of rebIdx) {
      if (lm[idx]) rightEyelidPath.lineTo(lm[idx].x, lm[idx].y);
    }
    for (let i = reIdx.length - 1; i >= 0; i--) {
      const pt = lm[reIdx[i]];
      if (pt) rightEyelidPath.lineTo(pt.x, pt.y);
    }
    rightEyelidPath.closePath();
  }

  // 4. MOUTH_MASK: outer lip contour
  const mouthPath = buildPolygon(geom.regions.mouthOuter);

  // 5. ORAL_CAVITY_MASK: inner mouth region
  const oralCavityPath = buildPolygon(geom.regions.mouthInner);

  // 6. LOWER_FACE_MASK: lower lip -> chin -> jaw
  const lowerFacePath = new Path2D();
  const mouthLeft = lm[61] || lm[geom.regions.mouthOuter[0]];
  const mouthRight = lm[291] || lm[geom.regions.mouthOuter[Math.floor(geom.regions.mouthOuter.length / 2)]];
  const chin = lm[152] || lm[geom.regions.jaw[Math.floor(geom.regions.jaw.length / 2)]];
  if (mouthLeft && mouthRight && chin) {
    lowerFacePath.moveTo(mouthLeft.x, mouthLeft.y);
    // trace along lower lip
    for (const idx of geom.regions.lowerLip) {
      if (lm[idx]) lowerFacePath.lineTo(lm[idx].x, lm[idx].y);
    }
    lowerFacePath.lineTo(mouthRight.x, mouthRight.y);
    // trace down along jawline to chin
    lowerFacePath.lineTo(chin.x + 30, chin.y);
    lowerFacePath.lineTo(chin.x, chin.y + 15);
    lowerFacePath.lineTo(chin.x - 30, chin.y);
    lowerFacePath.closePath();
  }

  // 7. JAW_MASK: Mandible curve
  const jawPath = buildPolygon(geom.regions.jaw);

  return {
    face: facePath,
    leftEye: leftEyePath,
    rightEye: rightEyePath,
    leftEyelid: leftEyelidPath,
    rightEyelid: rightEyelidPath,
    mouth: mouthPath,
    oralCavity: oralCavityPath,
    lowerFace: lowerFacePath,
    jaw: jawPath
  };
}
