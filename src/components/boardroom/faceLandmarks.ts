import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

/**
 * Official MediaPipe Face Landmarker Client-Side Implementation
 *
 * Runs 100% locally in the browser using the official MediaPipe Tasks Vision WASM & TFLite model.
 * - ZERO image or camera uploads to any cloud/server
 * - ZERO synthetic or mathematically generated landmark coordinates
 * - Executes ONCE per persona image load and caches results by URL
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

  metrics: {
    faceWidth: number;
    faceHeight: number;
    eyeDistance: number;
    mouthWidth: number;
    mouthHeight: number;
    jawWidth: number;
  };
}

// MediaPipe 468/478 Dense Landmark Topology Region Indices
export const FACIAL_REGION_INDICES = {
  // Left eye contour & iris (viewer left is subject right: MediaPipe indices)
  leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  rightEye: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
  leftEyebrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  rightEyebrow: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
  upperLip: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78],
  lowerLip: [291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308],
  mouthOuter: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146],
  mouthInner: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95],
  jaw: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
  nose: [168, 6, 197, 195, 5, 4, 1, 98, 97, 2, 326, 327]
};

// In-memory cache for detected FaceGeometry keyed by avatar URL
const geometryCache = new Map<string, FaceGeometry>();

// Singleton instance of MediaPipe FaceLandmarker
let landmarkerInstance: FaceLandmarker | null = null;
let landmarkerPromise: Promise<FaceLandmarker | null> | null = null;

async function getMediaPipeFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (landmarkerInstance) return landmarkerInstance;
  if (landmarkerPromise) return landmarkerPromise;

  landmarkerPromise = (async () => {
    try {
      const resolver = await FilesetResolver.forVisionTasks("/mediapipe");
      const landmarker = await FaceLandmarker.createFromOptions(resolver, {
        baseOptions: {
          modelAssetPath: "/mediapipe/face_landmarker.task",
          delegate: "CPU"
        },
        runningMode: "IMAGE",
        numFaces: 1
      });
      landmarkerInstance = landmarker;
      return landmarker;
    } catch (err) {
      console.warn("[MediaPipe FaceLandmarker] Failed to initialize local vision task:", err);
      return null;
    }
  })();

  return landmarkerPromise;
}

/**
 * Detects real facial landmarks from a portrait image using MediaPipe Face Landmarker.
 * Runs once upon image load and caches the result.
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
    const landmarker = await getMediaPipeFaceLandmarker();
    if (!landmarker) {
      console.warn("[FaceDetector] MediaPipe FaceLandmarker is unavailable.");
      return null;
    }

    const detection = landmarker.detect(image);
    if (!detection || !detection.faceLandmarks || detection.faceLandmarks.length === 0) {
      console.warn(`[FaceDetector] No face detected in image '${key}'`);
      return null;
    }

    const rawLandmarks = detection.faceLandmarks[0];
    if (!rawLandmarks || rawLandmarks.length < 468) {
      console.warn(`[FaceDetector] Insufficient landmarks returned (${rawLandmarks?.length || 0})`);
      return null;
    }

    const imgW = (image as HTMLImageElement).naturalWidth || image.width || 512;
    const imgH = (image as HTMLImageElement).naturalHeight || image.height || 512;

    // 1. Convert normalized coordinates [0, 1] into source image pixel space
    const landmarks = rawLandmarks.map(pt => ({
      x: pt.x * imgW,
      y: pt.y * imgH,
      z: (pt.z ?? 0) * imgW
    }));

    // 2. Compute true bounding box from detected landmark extremes
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const faceWidth = maxX - minX;
    const faceHeight = maxY - minY;

    // 3. Anatomical Validation
    const leftEyeRef = landmarks[468] || landmarks[33];
    const rightEyeRef = landmarks[473] || landmarks[263];
    const upperLipRef = landmarks[0];
    const lowerLipRef = landmarks[17];
    const mouthLeftRef = landmarks[61];
    const mouthRightRef = landmarks[291];
    const jawLeftRef = landmarks[234];
    const jawRightRef = landmarks[454];

    const eyeDistance = Math.hypot(rightEyeRef.x - leftEyeRef.x, rightEyeRef.y - leftEyeRef.y);
    const mouthWidth = Math.hypot(mouthRightRef.x - mouthLeftRef.x, mouthRightRef.y - mouthLeftRef.y);
    const mouthHeight = Math.abs(lowerLipRef.y - upperLipRef.y);
    const jawWidth = Math.hypot(jawRightRef.x - jawLeftRef.x, jawRightRef.y - jawLeftRef.y);

    // Validate structural plausibility
    const isOutOfBounds = minX < 0 || minY < 0 || maxX > imgW || maxY > imgH;
    const isTooSmall = faceWidth < 50 || faceHeight < 50;
    const isEyeSeparationInvalid = eyeDistance <= 15;
    const isMouthAboveEyes = upperLipRef.y <= Math.max(leftEyeRef.y, rightEyeRef.y);
    const isEyeTiltExtreme = Math.abs(leftEyeRef.y - rightEyeRef.y) > faceHeight * 0.45;

    if (isOutOfBounds || isTooSmall || isEyeSeparationInvalid || isMouthAboveEyes || isEyeTiltExtreme) {
      console.warn(`[FaceDetector] Validation rejected face geometry for '${key}':`, {
        faceWidth, faceHeight, eyeDistance, mouthWidth, mouthHeight, isMouthAboveEyes
      });
      return null;
    }

    const geometry: FaceGeometry = {
      boundingBox: {
        x: Math.round(minX),
        y: Math.round(minY),
        width: Math.round(faceWidth),
        height: Math.round(faceHeight)
      },
      landmarks,
      regions: { ...FACIAL_REGION_INDICES },
      metrics: {
        faceWidth: Math.round(faceWidth),
        faceHeight: Math.round(faceHeight),
        eyeDistance: Math.round(eyeDistance),
        mouthWidth: Math.round(mouthWidth),
        mouthHeight: Math.round(mouthHeight),
        jawWidth: Math.round(jawWidth)
      }
    };

    geometryCache.set(key, geometry);
    return geometry;
  } catch (err) {
    console.warn(`[FaceDetector] Unexpected error during landmark detection for '${key}':`, err);
    return null;
  }
}
