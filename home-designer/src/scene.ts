import type { WallSide } from './plan'

export type WallSelection = { roomId: string; side: WallSide }
export type Lighting = { time: 'day' | 'night'; sun: boolean; lights: boolean; rays: boolean }
export const initialLighting: Lighting = { time:'day', sun:true, lights:true, rays:true }
