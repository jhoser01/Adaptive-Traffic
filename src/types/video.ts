export type VideoPanelStatus = 'EMPTY' | 'READY' | 'ANALYZING' | 'ANALYZED' | 'ERROR';

export interface VideoAsset {
  name: string;
  size: number;
  url: string;
  duration?: number;
  width?: number;
  height?: number;
}
