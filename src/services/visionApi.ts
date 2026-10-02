import type { AvenueId } from '../types/traffic';
import type { VideoAnalysisResult } from '../types/video';

export const VISION_API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001';

export type CountDirection = 'down' | 'up' | 'left' | 'right';

export async function analyzeVideo(avenue: AvenueId, file: File, direction: CountDirection): Promise<VideoAnalysisResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('avenue', avenue);
  form.append('direction', direction);
  let response: Response;
  try {
    response = await fetch(`${VISION_API_URL}/analyze`, { method: 'POST', body: form });
  } catch {
    throw new Error(`No se pudo conectar con ${VISION_API_URL}`);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? 'No fue posible analizar el video.');
  }
  const result = await response.json() as VideoAnalysisResult;
  return { ...result, processed_video: `${VISION_API_URL}${result.processed_video}` };
}
