
export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface VisionResult {
  imageUrl: string;
  analysis: string;
}

export enum AppSection {
  HOME = 'home',
  WISDOM = 'wisdom',
  VISION = 'vision',
  LIVE = 'live'
}
