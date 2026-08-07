export function chooseMimeType(kind: "audio" | "video") {
  const candidates = kind === "audio"
    ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
    : ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  return candidates.find((candidate) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(candidate)) ?? "";
}

export function describeMediaError(error: unknown) {
  if (!(error instanceof DOMException)) return "Pulse could not access your recording devices.";
  switch (error.name) {
    case "NotAllowedError": return "Permission was denied. Use the camera icon in your browser address bar to allow access, then try again.";
    case "NotFoundError": return "No compatible microphone was found. Connect one or check your system input settings.";
    case "NotReadableError": return "Another application may be using your microphone or camera. Close it and try again.";
    case "OverconstrainedError": return "The selected device cannot provide a compatible recording format.";
    default: return "Pulse could not start your microphone or camera. Check browser device settings and try again.";
  }
}

export function createFrame(video: HTMLVideoElement, quality = 0.66) {
  if (!video.videoWidth || !video.videoHeight) return null;
  const maxWidth = 640;
  const scale = Math.min(1, maxWidth / video.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}
