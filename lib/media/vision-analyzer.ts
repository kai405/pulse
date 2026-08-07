export type VisualSample = {
  timestampMs: number;
  faceDetected: boolean;
  cameraEngaged: boolean;
  wellFramed: boolean;
  confidence: "medium" | "low";
};

const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

/**
 * Runs a deliberately conservative, on-device head-orientation/framing heuristic.
 * It does not infer emotion, identity, personality, or gaze direction.
 */
export async function startVisionAnalyzer(
  video: HTMLVideoElement,
  onSample: (sample: Omit<VisualSample, "timestampMs">) => void,
): Promise<() => void> {
  const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(WASM_ROOT);
  const landmarker = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    runningMode: "VIDEO",
    numFaces: 1,
    minFaceDetectionConfidence: 0.55,
    minFacePresenceConfidence: 0.55,
    minTrackingConfidence: 0.55,
  });
  let stopped = false;
  let timer = 0;
  let lastVideoTime = -1;
  const analyze = () => {
    if (stopped || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.currentTime === lastVideoTime) return;
    lastVideoTime = video.currentTime;
    const face = landmarker.detectForVideo(video, performance.now()).faceLandmarks[0];
    if (!face?.length) {
      onSample({ faceDetected: false, cameraEngaged: false, wellFramed: false, confidence: "low" });
      return;
    }
    const xs = face.map((point) => point.x);
    const ys = face.map((point) => point.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    const centerX = (Math.max(...xs) + Math.min(...xs)) / 2;
    const centerY = (Math.max(...ys) + Math.min(...ys)) / 2;
    const leftEye = face[33];
    const rightEye = face[263];
    const nose = face[1];
    const eyeWidth = leftEye && rightEye ? Math.abs(rightEye.x - leftEye.x) : 0;
    const eyeCenterX = leftEye && rightEye ? (leftEye.x + rightEye.x) / 2 : centerX;
    const yawRatio = eyeWidth > 0.02 && nose ? Math.abs(nose.x - eyeCenterX) / eyeWidth : 1;
    onSample({
      faceDetected: true,
      cameraEngaged: yawRatio <= 0.34,
      wellFramed: width >= 0.18 && width <= 0.72 && height >= 0.24 && centerX >= 0.25 && centerX <= 0.75 && centerY >= 0.25 && centerY <= 0.72,
      confidence: "medium",
    });
  };
  timer = window.setInterval(analyze, 250);
  return () => {
    stopped = true;
    window.clearInterval(timer);
    landmarker.close();
  };
}
