import type { AvenueId } from '../types/traffic';
import type { VideoAnalysisResult } from '../types/video';

export const VISION_API_URL = 'http://localhost:8000';

export async function analyzeVideo(avenue: AvenueId, file: File): Promise<VideoAnalysisResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('avenue', avenue);
  form.append('direction', 'down');
  const response = await fetch(`${VISION_API_URL}/analyze`, { method: 'POST', body: form });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? 'No fue posible analizar el video.');
  }
  const result = await response.json() as VideoAnalysisResult;
  return { ...result, processed_video: `${VISION_API_URL}${result.processed_video}` };
}
