export enum Role {
  NONE = 'NONE',
  HOST = 'HOST',
  CAM_1 = 'CAM_1',
  CAM_2 = 'CAM_2',
}

export type LayoutMode = 'split' | 'full_cam1' | 'full_cam2';

export type AppMode = 'KISS' | 'DRINK';

export interface BroadcastMessage {
  type: 'FRAME' | 'STATUS' | 'COMMAND';
  source: Role;
  payload?: string; // Base64 image
  layout?: LayoutMode; // For COMMAND messages
  active?: boolean;
}

export interface GeminiCommentary {
  text: string;
  mood: 'romantic' | 'funny' | 'hype' | 'awkward' | 'party' | 'spilled';
  score: number;
}