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

  // 1. FACE_MASK: complete facial area (jawline polygon closed across upper temple/forehead)
  const facePath = new Path2D();
  if (lm.length >= 27) {
    facePath.moveTo(lm[0].x, lm[0].y);
    for (let i = 1; i <= 16; i++) {
      facePath.lineTo(lm[i].x, lm[i].y);
    }
    // Top arch through temples and forehead
    const foreheadY = Math.max(20, geom.boundingBox.y - 15);
    facePath.lineTo(lm[26].x + 15, foreheadY + 20);
    facePath.lineTo(geom.boundingBox.x + geom.boundingBox.width * 0.5, foreheadY);
    facePath.lineTo(lm[17].x - 15, foreheadY + 20);
    facePath.closePath();
  }

  // 2. LEFT_EYE_MASK: smooth closed polygon around left eye contour (indices 36–41)
  const leftEyePath = new Path2D();
  const leIdx = geom.regions.leftEye;
  if (leIdx.length > 0) {
    leftEyePath.moveTo(lm[leIdx[0]].x, lm[leIdx[0]].y);
    for (let i = 1; i < leIdx.length; i++) {
      leftEyePath.lineTo(lm[leIdx[i]].x, lm[leIdx[i]].y);
    }
    leftEyePath.closePath();
  }

  // 3. RIGHT_EYE_MASK: smooth closed polygon around right eye contour (indices 42–47)
  const rightEyePath = new Path2D();
  const reIdx = geom.regions.rightEye;
  if (reIdx.length > 0) {
    rightEyePath.moveTo(lm[reIdx[0]].x, lm[reIdx[0]].y);
    for (let i = 1; i < reIdx.length; i++) {
      rightEyePath.lineTo(lm[reIdx[i]].x, lm[reIdx[i]].y);
    }
    rightEyePath.closePath();
  }

  // 4. LEFT_EYELID_MASK: covers upper eyelid skin crease down to lower lid
  const leftEyelidPath = new Path2D();
  if (leIdx.length >= 6) {
    const browOffset = 10;
    leftEyelidPath.moveTo(lm[leIdx[0]].x, lm[leIdx[0]].y);
    leftEyelidPath.lineTo(lm[leIdx[1]].x, lm[leIdx[1]].y - browOffset);
    leftEyelidPath.lineTo(lm[leIdx[2]].x, lm[leIdx[2]].y - browOffset);
    leftEyelidPath.lineTo(lm[leIdx[3]].x, lm[leIdx[3]].y);
    leftEyelidPath.lineTo(lm[leIdx[4]].x, lm[leIdx[4]].y + 2);
    leftEyelidPath.lineTo(lm[leIdx[5]].x, lm[leIdx[5]].y + 2);
    leftEyelidPath.closePath();
  }

  // 5. RIGHT_EYELID_MASK
  const rightEyelidPath = new Path2D();
  if (reIdx.length >= 6) {
    const browOffset = 10;
    rightEyelidPath.moveTo(lm[reIdx[0]].x, lm[reIdx[0]].y);
    rightEyelidPath.lineTo(lm[reIdx[1]].x, lm[reIdx[1]].y - browOffset);
    rightEyelidPath.lineTo(lm[reIdx[2]].x, lm[reIdx[2]].y - browOffset);
    rightEyelidPath.lineTo(lm[reIdx[3]].x, lm[reIdx[3]].y);
    rightEyelidPath.lineTo(lm[reIdx[4]].x, lm[reIdx[4]].y + 2);
    rightEyelidPath.lineTo(lm[reIdx[5]].x, lm[reIdx[5]].y + 2);
    rightEyelidPath.closePath();
  }

  // 6. MOUTH_MASK: outer lip contour (indices 48–59)
  const mouthPath = new Path2D();
  const mOutIdx = geom.regions.mouthOuter;
  if (mOutIdx.length > 0) {
    mouthPath.moveTo(lm[mOutIdx[0]].x, lm[mOutIdx[0]].y);
    for (let i = 1; i < mOutIdx.length; i++) {
      mouthPath.lineTo(lm[mOutIdx[i]].x, lm[mOutIdx[i]].y);
    }
    mouthPath.closePath();
  }

  // 7. ORAL_CAVITY_MASK: inner mouth region (indices 60–67)
  const oralCavityPath = new Path2D();
  const mInIdx = geom.regions.mouthInner;
  if (mInIdx.length > 0) {
    oralCavityPath.moveTo(lm[mInIdx[0]].x, lm[mInIdx[0]].y);
    for (let i = 1; i < mInIdx.length; i++) {
      oralCavityPath.lineTo(lm[mInIdx[i]].x, lm[mInIdx[i]].y);
    }
    oralCavityPath.closePath();
  }

  // 8. LOWER_FACE_MASK: lower lip -> chin -> jaw
  const lowerFacePath = new Path2D();
  if (lm.length >= 17) {
    lowerFacePath.moveTo(lm[4].x, lm[4].y);
    for (let i = 5; i <= 12; i++) {
      lowerFacePath.lineTo(lm[i].x, lm[i].y);
    }
    // Return through mouth center
    lowerFacePath.lineTo(lm[54].x, lm[54].y);
    lowerFacePath.lineTo(lm[48].x, lm[48].y);
    lowerFacePath.closePath();
  }

  // 9. JAW_MASK: Along the mandible curve (indices 0–16)
  const jawPath = new Path2D();
  if (lm.length >= 17) {
    jawPath.moveTo(lm[0].x, lm[0].y);
    for (let i = 1; i <= 16; i++) {
      jawPath.lineTo(lm[i].x, lm[i].y);
    }
    jawPath.lineTo(lm[16].x - 10, lm[16].y + 20);
    jawPath.lineTo(lm[8].x, lm[8].y + 30);
    jawPath.lineTo(lm[0].x + 10, lm[0].y + 20);
    jawPath.closePath();
  }

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
