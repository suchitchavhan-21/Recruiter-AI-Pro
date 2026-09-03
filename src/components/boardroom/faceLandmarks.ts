/**
 * Recruiter AI Pro — Automatic Face Detection & Facial Landmarks
 *
 * Scans source portrait pixels automatically to determine:
 * - Face bounding box
 * - 68 dense anatomical landmarks (normalized to 512x512)
 * - Semantic facial regions (eyes, eyelids, eyebrows, mouthOuter, mouthInner, jaw, nose)
 *
 * Detection executes once per image and is cached in memory.
 * No external API or cloud calls are made.
 */

export interface FaceGeometry {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  landmarks: Array<{
    x: number;
    y: number;
    z?: number;
  }>;

  regions: {
    leftEye: number[];
    rightEye: number[];
    leftEyebrow: number[];
    rightEyebrow: number[];
    upperLip: number[];
    lowerLip: number[];
    mouthOuter: number[];
    mouthInner: number[];
    jaw: number[];
    nose: number[];
  };
}

// In-memory cache for detected geometries by image source
const geometryCache = new Map<string, FaceGeometry>();

/**
 * Detects face geometry and facial landmarks from an image or canvas.
 * Results are cached so detection runs only once on image load.
 */
export async function detectFaceGeometry(
  image: HTMLImageElement | HTMLCanvasElement,
  cacheKey?: string
): Promise<FaceGeometry | null> {
  const key = cacheKey || (image instanceof HTMLImageElement ? image.src : "canvas");
  if (geometryCache.has(key)) {
    return geometryCache.get(key)!;
  }

  try {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;

    if (image instanceof HTMLCanvasElement) {
      canvas = image;
      ctx = canvas.getContext("2d");
    } else {
      canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(image, 0, 0, 512, 512);
      }
    }

    if (!ctx) {
      console.warn("[FaceDetector] Unable to acquire 2D context for face detection");
      return null;
    }

    const imgData = ctx.getImageData(0, 0, 512, 512);
    const d = imgData.data;

    // 1. Skin & Face Bounding Box Detection
    let minX = 512, maxX = 0, minY = 512, maxY = 0;
    let skinCount = 0;

    for (let y = 60; y < 460; y++) {
      for (let x = 80; x < 432; x++) {
        const idx = (y * 512 + x) * 4;
        const r = d[idx];
        const g = d[idx + 1];
        const b = d[idx + 2];

        // Chromatic skin cluster test
        const isSkin = r > 45 && g > 30 && b > 15 &&
                       r > g && g > b &&
                       (r - g) >= 8 &&
                       Math.abs(r - g) < 145;

        if (isSkin) {
          skinCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // If skin density is insufficient, detection failed
    if (skinCount < 4000 || maxX <= minX || maxY <= minY) {
      console.warn("[FaceDetector] Insufficient skin pixels detected for reliable landmark model");
      return null;
    }

    const faceW = Math.max(160, maxX - minX);
    const faceH = Math.max(180, maxY - minY);
    const centerX = minX + faceW * 0.5;

    // 2. Eye Centers & Contours Detection
    // Left eye (subject's right, left on viewer's screen): search dark valley
    let leftEyeMin = 999;
    let leftEyeX = Math.round(minX + faceW * 0.32);
    let leftEyeY = Math.round(minY + faceH * 0.36);

    const eyeSearchStartY = Math.floor(minY + faceH * 0.25);
    const eyeSearchEndY = Math.floor(minY + faceH * 0.46);

    for (let y = eyeSearchStartY; y < eyeSearchEndY; y++) {
      for (let x = Math.floor(minX + faceW * 0.18); x < Math.floor(minX + faceW * 0.44); x++) {
        const idx = (y * 512 + x) * 4;
        const lum = d[idx] * 0.299 + d[idx + 1] * 0.587 + d[idx + 2] * 0.114;
        if (lum < leftEyeMin) {
          leftEyeMin = lum;
          leftEyeX = x;
          leftEyeY = y;
        }
      }
    }

    // Right eye: search dark valley
    let rightEyeMin = 999;
    let rightEyeX = Math.round(minX + faceW * 0.68);
    let rightEyeY = Math.round(minY + faceH * 0.36);

    for (let y = eyeSearchStartY; y < eyeSearchEndY; y++) {
      for (let x = Math.floor(minX + faceW * 0.56); x < Math.floor(minX + faceW * 0.82); x++) {
        const idx = (y * 512 + x) * 4;
        const lum = d[idx] * 0.299 + d[idx + 1] * 0.587 + d[idx + 2] * 0.114;
        if (lum < rightEyeMin) {
          rightEyeMin = lum;
          rightEyeX = x;
          rightEyeY = y;
        }
      }
    }

    // 3. Mouth Center & Lip Contour Detection
    const mouthSearchStartY = Math.floor(minY + faceH * 0.64);
    const mouthSearchEndY = Math.floor(minY + faceH * 0.86);

    let maxLipScore = -999;
    let mouthCenterX = Math.round(centerX);
    let mouthCenterY = Math.round(minY + faceH * 0.74);

    for (let y = mouthSearchStartY; y < mouthSearchEndY; y++) {
      for (let x = Math.floor(minX + faceW * 0.30); x < Math.floor(minX + faceW * 0.70); x++) {
        const idx = (y * 512 + x) * 4;
        const r = d[idx];
        const g = d[idx + 1];
        const b = d[idx + 2];
        const lipScore = (2 * r - g - b) / (r + g + b + 1);
        if (lipScore > maxLipScore) {
          maxLipScore = lipScore;
          mouthCenterX = x;
          mouthCenterY = y;
        }
      }
    }

    // 4. Construct 68 Dense Anatomical Landmarks
    const eyeSpan = rightEyeX - leftEyeX;
    const eyeHalfW = eyeSpan * 0.24;
    const eyeHalfH = eyeHalfW * 0.44;
    const mouthHalfW = eyeSpan * 0.48;
    const mouthHalfH = mouthHalfW * 0.30;
    const chinY = Math.min(480, mouthCenterY + faceH * 0.28);
    const noseY = (leftEyeY + rightEyeY) * 0.5 + (mouthCenterY - (leftEyeY + rightEyeY) * 0.5) * 0.56;

    const landmarks: Array<{ x: number; y: number; z?: number }> = [];

    // Points 0–16: Jawline contour (left ear to chin to right ear)
    for (let i = 0; i <= 16; i++) {
      const angle = Math.PI * (1 - i / 16);
      const jx = centerX - Math.cos(angle) * (faceW * 0.52);
      const jy = ((leftEyeY + rightEyeY) * 0.5) + Math.sin(angle) * (chinY - (leftEyeY + rightEyeY) * 0.5);
      landmarks.push({ x: Math.round(jx), y: Math.round(jy), z: 0 });
    }

    // Points 17–21: Left eyebrow
    const leftBrowY = leftEyeY - eyeHalfH * 1.5;
    landmarks.push({ x: Math.round(leftEyeX - eyeHalfW * 1.2), y: Math.round(leftBrowY + 3), z: 0 }); // 17
    landmarks.push({ x: Math.round(leftEyeX - eyeHalfW * 0.6), y: Math.round(leftBrowY), z: 0 });     // 18
    landmarks.push({ x: Math.round(leftEyeX), y: Math.round(leftBrowY - 2), z: 0 });                 // 19
    landmarks.push({ x: Math.round(leftEyeX + eyeHalfW * 0.6), y: Math.round(leftBrowY - 1), z: 0 }); // 20
    landmarks.push({ x: Math.round(leftEyeX + eyeHalfW * 1.1), y: Math.round(leftBrowY + 2), z: 0 }); // 21

    // Points 22–26: Right eyebrow
    const rightBrowY = rightEyeY - eyeHalfH * 1.5;
    landmarks.push({ x: Math.round(rightEyeX - eyeHalfW * 1.1), y: Math.round(rightBrowY + 2), z: 0 }); // 22
    landmarks.push({ x: Math.round(rightEyeX - eyeHalfW * 0.6), y: Math.round(rightBrowY - 1), z: 0 }); // 23
    landmarks.push({ x: Math.round(rightEyeX), y: Math.round(rightBrowY - 2), z: 0 });                  // 24
    landmarks.push({ x: Math.round(rightEyeX + eyeHalfW * 0.6), y: Math.round(rightBrowY), z: 0 });     // 25
    landmarks.push({ x: Math.round(rightEyeX + eyeHalfW * 1.2), y: Math.round(rightBrowY + 3), z: 0 }); // 26

    // Points 27–35: Nose bridge & base
    landmarks.push({ x: Math.round(centerX), y: Math.round((leftEyeY + rightEyeY) * 0.5 - 2), z: 0 }); // 27
    landmarks.push({ x: Math.round(centerX), y: Math.round((leftEyeY + rightEyeY) * 0.5 + 10), z: 0 }); // 28
    landmarks.push({ x: Math.round(centerX), y: Math.round(noseY - 10), z: 0 });                       // 29
    landmarks.push({ x: Math.round(centerX), y: Math.round(noseY), z: 0 });                            // 30
    landmarks.push({ x: Math.round(centerX - eyeSpan * 0.16), y: Math.round(noseY + 4), z: 0 });       // 31
    landmarks.push({ x: Math.round(centerX - eyeSpan * 0.08), y: Math.round(noseY + 5), z: 0 });       // 32
    landmarks.push({ x: Math.round(centerX), y: Math.round(noseY + 6), z: 0 });                        // 33
    landmarks.push({ x: Math.round(centerX + eyeSpan * 0.08), y: Math.round(noseY + 5), z: 0 });       // 34
    landmarks.push({ x: Math.round(centerX + eyeSpan * 0.16), y: Math.round(noseY + 4), z: 0 });       // 35

    // Points 36–41: Left eye (36=outer, 37-38=upper lid, 39=inner, 40-41=lower lid)
    landmarks.push({ x: Math.round(leftEyeX - eyeHalfW), y: Math.round(leftEyeY), z: 0 });             // 36
    landmarks.push({ x: Math.round(leftEyeX - eyeHalfW * 0.4), y: Math.round(leftEyeY - eyeHalfH), z: 0 }); // 37
    landmarks.push({ x: Math.round(leftEyeX + eyeHalfW * 0.4), y: Math.round(leftEyeY - eyeHalfH), z: 0 }); // 38
    landmarks.push({ x: Math.round(leftEyeX + eyeHalfW), y: Math.round(leftEyeY), z: 0 });             // 39
    landmarks.push({ x: Math.round(leftEyeX + eyeHalfW * 0.4), y: Math.round(leftEyeY + eyeHalfH * 0.8), z: 0 }); // 40
    landmarks.push({ x: Math.round(leftEyeX - eyeHalfW * 0.4), y: Math.round(leftEyeY + eyeHalfH * 0.8), z: 0 }); // 41

    // Points 42–47: Right eye (42=inner, 43-44=upper lid, 45=outer, 46-47=lower lid)
    landmarks.push({ x: Math.round(rightEyeX - eyeHalfW), y: Math.round(rightEyeY), z: 0 });            // 42
    landmarks.push({ x: Math.round(rightEyeX - eyeHalfW * 0.4), y: Math.round(rightEyeY - eyeHalfH), z: 0 }); // 43
    landmarks.push({ x: Math.round(rightEyeX + eyeHalfW * 0.4), y: Math.round(rightEyeY - eyeHalfH), z: 0 }); // 44
    landmarks.push({ x: Math.round(rightEyeX + eyeHalfW), y: Math.round(rightEyeY), z: 0 });            // 45
    landmarks.push({ x: Math.round(rightEyeX + eyeHalfW * 0.4), y: Math.round(rightEyeY + eyeHalfH * 0.8), z: 0 }); // 46
    landmarks.push({ x: Math.round(rightEyeX - eyeHalfW * 0.4), y: Math.round(rightEyeY + eyeHalfH * 0.8), z: 0 }); // 47

    // Points 48–59: Outer mouth contour (48=left corner, 54=right corner)
    landmarks.push({ x: Math.round(mouthCenterX - mouthHalfW), y: Math.round(mouthCenterY), z: 0 });       // 48
    landmarks.push({ x: Math.round(mouthCenterX - mouthHalfW * 0.5), y: Math.round(mouthCenterY - mouthHalfH * 0.8), z: 0 }); // 49
    landmarks.push({ x: Math.round(mouthCenterX - mouthHalfW * 0.2), y: Math.round(mouthCenterY - mouthHalfH), z: 0 });       // 50
    landmarks.push({ x: Math.round(mouthCenterX), y: Math.round(mouthCenterY - mouthHalfH * 0.85), z: 0 });                   // 51
    landmarks.push({ x: Math.round(mouthCenterX + mouthHalfW * 0.2), y: Math.round(mouthCenterY - mouthHalfH), z: 0 });       // 52
    landmarks.push({ x: Math.round(mouthCenterX + mouthHalfW * 0.5), y: Math.round(mouthCenterY - mouthHalfH * 0.8), z: 0 }); // 53
    landmarks.push({ x: Math.round(mouthCenterX + mouthHalfW), y: Math.round(mouthCenterY), z: 0 });       // 54
    landmarks.push({ x: Math.round(mouthCenterX + mouthHalfW * 0.5), y: Math.round(mouthCenterY + mouthHalfH * 0.9), z: 0 }); // 55
    landmarks.push({ x: Math.round(mouthCenterX + mouthHalfW * 0.2), y: Math.round(mouthCenterY + mouthHalfH * 1.1), z: 0 }); // 56
    landmarks.push({ x: Math.round(mouthCenterX), y: Math.round(mouthCenterY + mouthHalfH * 1.15), z: 0 });                   // 57
    landmarks.push({ x: Math.round(mouthCenterX - mouthHalfW * 0.2), y: Math.round(mouthCenterY + mouthHalfH * 1.1), z: 0 }); // 58
    landmarks.push({ x: Math.round(mouthCenterX - mouthHalfW * 0.5), y: Math.round(mouthCenterY + mouthHalfH * 0.9), z: 0 }); // 59

    // Points 60–67: Inner mouth contour
    landmarks.push({ x: Math.round(mouthCenterX - mouthHalfW * 0.75), y: Math.round(mouthCenterY), z: 0 }); // 60
    landmarks.push({ x: Math.round(mouthCenterX - mouthHalfW * 0.3), y: Math.round(mouthCenterY - mouthHalfH * 0.3), z: 0 }); // 61
    landmarks.push({ x: Math.round(mouthCenterX), y: Math.round(mouthCenterY - mouthHalfH * 0.35), z: 0 });                  // 62
    landmarks.push({ x: Math.round(mouthCenterX + mouthHalfW * 0.3), y: Math.round(mouthCenterY - mouthHalfH * 0.3), z: 0 }); // 63
    landmarks.push({ x: Math.round(mouthCenterX + mouthHalfW * 0.75), y: Math.round(mouthCenterY), z: 0 }); // 64
    landmarks.push({ x: Math.round(mouthCenterX + mouthHalfW * 0.3), y: Math.round(mouthCenterY + mouthHalfH * 0.4), z: 0 }); // 65
    landmarks.push({ x: Math.round(mouthCenterX), y: Math.round(mouthCenterY + mouthHalfH * 0.45), z: 0 });                  // 66
    landmarks.push({ x: Math.round(mouthCenterX - mouthHalfW * 0.3), y: Math.round(mouthCenterY + mouthHalfH * 0.4), z: 0 }); // 67

    const geometry: FaceGeometry = {
      boundingBox: {
        x: Math.round(minX),
        y: Math.round(minY),
        width: Math.round(faceW),
        height: Math.round(faceH)
      },
      landmarks,
      regions: {
        leftEye: [36, 37, 38, 39, 40, 41],
        rightEye: [42, 43, 44, 45, 46, 47],
        leftEyebrow: [17, 18, 19, 20, 21],
        rightEyebrow: [22, 23, 24, 25, 26],
        upperLip: [49, 50, 51, 52, 53, 61, 62, 63],
        lowerLip: [55, 56, 57, 58, 59, 65, 66, 67],
        mouthOuter: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
        mouthInner: [60, 61, 62, 63, 64, 65, 66, 67],
        jaw: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        nose: [27, 28, 29, 30, 31, 32, 33, 34, 35]
      }
    };

    geometryCache.set(key, geometry);
    return geometry;
  } catch (err) {
    console.warn("[FaceDetector] Error during automatic face detection:", err);
    return null;
  }
}
