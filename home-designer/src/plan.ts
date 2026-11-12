export type Surface = 'floor' | 'north' | 'east' | 'south' | 'west' | 'ceiling'
export type Room = { id: string; name: string; x: number; y: number; w: number; h: number; color: string }
export const structuralHeight = 11
export const ceilingHeight = 9.5
export const rooms: Room[] = [
  { id: 'master', name: 'Master bedroom', x: 0, y: 37, w: 14, h: 16, color: '#dcebf6' },
  { id: 'bath1', name: 'Master bath', x: 0, y: 32, w: 7, h: 5, color: '#d8f0ed' },
  { id: 'dress', name: 'Master dressing', x: 7, y: 32, w: 7, h: 5, color: '#eee5f2' },
  { id: 'bed3', name: 'Bedroom 3', x: 0, y: 21, w: 14, h: 11, color: '#dcebf6' },
  { id: 'bath3', name: 'Common bath', x: 0, y: 16.5, w: 7, h: 4.5, color: '#d8f0ed' },
  { id: 'bath-lobby', name: 'Bath lobby', x: 7, y: 16.5, w: 7, h: 2.25, color: '#f4efe4' },
  { id: 'laundry', name: 'Laundry', x: 7, y: 18.75, w: 7, h: 2.25, color: '#e8e9df' },
  { id: 'bath2', name: 'Bedroom 2 bath', x: 0, y: 12, w: 7, h: 4.5, color: '#d8f0ed' },
  { id: 'dress2', name: 'Dressing 2', x: 7, y: 12, w: 7, h: 4.5, color: '#eee5f2' },
  { id: 'bed2', name: 'Bedroom 2', x: 0, y: 0, w: 14, h: 12, color: '#e4e6f8' },
  { id: 'living', name: 'Living / hall', x: 14, y: 0, w: 13, h: 20, color: '#e3edda' },
  { id: 'dining', name: 'Dining', x: 14, y: 20, w: 13, h: 12, color: '#f5ebd6' },
  { id: 'link', name: 'Open circulation', x: 14, y: 32, w: 7, h: 6, color: '#f5ebd6' },
  { id: 'puja', name: 'Puja', x: 21, y: 32, w: 6, h: 6, color: '#fff0bc' },
  { id: 'kitchen-gap', name: '4 ft clear gap', x: 14, y: 38, w: 13, h: 4, color: '#f8f6ef' },
  { id: 'kitchen', name: 'Open kitchen', x: 14, y: 42, w: 13, h: 11, color: '#fce6cb' },
]
export const wallPath = 'M0 0 H27 V53 H0 Z M14 0 V53 M0 12 H14 M0 16.5 H14 M7 12 V21 M7 18.75 H14 M0 21 H14 M0 32 H14 M0 37 H14 M7 32 V37 M27 32.09 H21.09 V37.91 H27'
export const windows = [
  [3,53,10,53],[15.5,53,19.5,53],[0,43,0,49],[0,33,0,35.5],
  [0,23.5,0,29],[0,17.5,0,20],[0,13,0,15.5],[0,3,0,8],
  [3,0,10,0],[16,0,19,0],[21,0,25,0],[27,1.5,27,4.5],
  [27,12,27,17],[27,23,27,29],[27,33.5,27,36.5],[27,44.5,27,50],
]
export const doors: [number, number, number, 'left' | 'right' | 'up' | 'down'][] = [
  [14,39,2.5,'left'],[14,6,3,'left'],[3.5,12,2.5,'down'],
  [3.5,37,2.5,'up'],[14,26,3,'left'],[7,16.5,2.25,'left'],
  [21.09,34.5,2.5,'right'],[27,6,4,'left'],[22,53,3,'up'],
]
export const openings = [[9,37,12,37],[9,12,12,12],[14,16.5,14,18.75],[9,18.75,12,18.75]]
export const surfaces: Surface[] = ['floor','north','east','south','west','ceiling']
export type WallSide = Exclude<Surface, 'floor' | 'ceiling'>
export const wallSides: WallSide[] = ['north','east','south','west']
export const wallColor = '#b1bdb5'
// Physical wall lines, including partial edges of the open eastern circulation.
export const wallSegments = [
  [0,0,27,0],[27,0,27,53],[0,53,27,53],[0,0,0,53],[14,0,14,53],
  [0,12,14,12],[0,16.5,14,16.5],[7,12,7,21],[7,18.75,14,18.75],
  [0,21,14,21],[0,32,14,32],[0,37,14,37],[7,32,7,37],
  [21,32,27,32],[21,32,21,38],[21,38,27,38],
]
export function wallRanges(room: Room, side: WallSide): { start: number; end: number }[] {
  const horizontal=side==='north'||side==='south'
  const boundary=side==='north'?room.y:side==='south'?room.y+room.h:side==='west'?room.x:room.x+room.w
  const start=horizontal?room.x:room.y, end=start+(horizontal?room.w:room.h)
  return wallSegments.flatMap(([x1,y1,x2,y2])=>{
    if(horizontal ? y1!==boundary||y2!==boundary : x1!==boundary||x2!==boundary) return []
    const a=Math.max(start,horizontal?Math.min(x1,x2):Math.min(y1,y2))
    const b=Math.min(end,horizontal?Math.max(x1,x2):Math.max(y1,y2))
    return b>a?[{start:a-start,end:b-start}]:[]
  })
}
export function size(room: Room, surface: Surface) {
  return surface === 'floor' || surface === 'ceiling'
    ? { w: room.w, h: room.h }
    : { w: surface === 'north' || surface === 'south' ? room.w : room.h, h: ceilingHeight }
}
export function hasWall(room: Room, surface: Surface) {
  if (surface === 'floor' || surface === 'ceiling') return true
  if (['link', 'kitchen-gap'].includes(room.id)) return false
  return wallRanges(room,surface).length>0
}
export type Obstacle = { x: number; y: number; w: number; h: number; kind: 'Door' | 'Window' | 'Opening' }
export function obstacles(room: Room, surface: Surface): Obstacle[] {
  if (surface === 'floor' || surface === 'ceiling') return []
  const horizontal = surface === 'north' || surface === 'south'
  const boundary = surface === 'north' ? room.y : surface === 'south' ? room.y+room.h : surface === 'west' ? room.x : room.x+room.w
  const start = horizontal ? room.x : room.y
  const span = horizontal ? room.w : room.h
  const result: Obstacle[] = []
  function add(x1: number,y1: number,x2: number,y2: number,kind: Obstacle['kind']) {
    const axis1 = horizontal ? y1 : x1, axis2 = horizontal ? y2 : x2
    if (Math.abs(axis1-boundary) > .12 || Math.abs(axis2-boundary) > .12) return
    const a = Math.max(start, horizontal ? Math.min(x1,x2) : Math.min(y1,y2))
    const b = Math.min(start+span, horizontal ? Math.max(x1,x2) : Math.max(y1,y2))
    if (b<=a) return
    result.push({ x:a-start, y:ceilingHeight-7, w:b-a, h:kind==='Window'?4:7, kind })
  }
  windows.forEach(([a,b,c,d])=>add(a,b,c,d,'Window'))
  doors.forEach(([x,y,w,dir])=>add(x,y,dir==='up'||dir==='down'?x+w:x,dir==='left'||dir==='right'?y+w:y,'Door'))
  openings.forEach(([a,b,c,d])=>add(a,b,c,d,'Opening'))
  return result
}
