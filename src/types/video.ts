export type VideoPanelStatus = 'EMPTY' | 'READY' | 'ANALYZING' | 'ANALYZED' | 'ERROR';

export interface VideoAsset {
  file: File;
  name: string;
  size: number;
  url: string;
  duration?: number;
  width?: number;
  height?: number;
}

export interface VideoAnalysisResult {
  avenue: 'A' | 'B';
  vehicle_count: number;
  arrival_rate: number;
  duration: number;
  processed_video: string;
  class_counts: { car: number; motorcycle: number; bus: number; truck: number };
}
