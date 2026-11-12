import { ceilingHeight, hasWall, rooms, size, surfaces, wallRanges } from './plan'
import type { Room, Surface, WallSide } from './plan'

export type Kind = 'Cupboard' | 'Cabinet' | 'Shelf' | 'Bed' | 'Sofa' | 'Fan' | 'Light' | 'Tube light' | 'Ceiling panel' | 'Table' | 'Chair' | 'Toilet' | 'Basin' | 'Shower' | 'Altar' | 'Fridge' | 'Washing machine'
export type Item = { id: string; room: string; surface: Surface; kind: Kind; x: number; y: number; w: number; h: number; depth: number; rotation: number; color: string; visible?: boolean; label?: string }
export type Design = { version: 1; items: Item[] }
export const storageKey = 'design-c-home-v1'
export const palette: Record<Kind, { w: number; h: number; depth: number; color: string }> = {
  Cupboard: { w: 6, h: 7, depth: 2, color: '#aa7954' },
  Cabinet: { w: 4, h: 3, depth: 2, color: '#629b94' },
  Shelf: { w: 3, h: 1, depth: 1, color: '#cba573' },
  Bed: { w: 6, h: 6.5, depth: 2, color: '#799bbe' },
  Sofa: { w: 6, h: 3, depth: 2.5, color: '#9b9f70' },
  Fan: { w: 4, h: 4, depth: .6, color: '#a68661' },
  Light: { w: .6, h: .6, depth: .2, color: '#e8bf5d' },
  'Tube light': { w: 4, h: .25, depth: .2, color: '#f0f3f5' },
  'Ceiling panel': { w: 5, h: 5, depth: .3, color: '#b5c5c6' },
  Table: { w: 5, h: 3, depth: 2.5, color: '#b48a65' },
  Chair: { w: 1.5, h: 1.5, depth: 2.5, color: '#ae9b7a' },
  Toilet: { w: 1.6, h: 2.3, depth: 1.5, color: '#e8edef' },
  Basin: { w: 2, h: 1.5, depth: 2.5, color: '#edf2f2' },
  Shower: { w: 2.7, h: 2.7, depth: .15, color: '#96bfc6' },
  Altar: { w: 4, h: 1.5, depth: 3, color: '#c4a15f' },
  Fridge: { w: 2.5, h: 2.5, depth: 6, color: '#adb9bc' },
  'Washing machine': { w: 2, h: 2, depth: 2.8, color: '#b9c9cd' },
}
export function kindsFor(surface: Surface): Kind[] {
  return surface==='ceiling' ? ['Fan','Light','Tube light','Ceiling panel'] : surface==='floor' ? ['Cupboard','Cabinet','Bed','Sofa','Table','Chair','Toilet','Basin','Shower','Altar','Fridge','Washing machine'] : ['Cupboard','Cabinet','Shelf','Light','Tube light']
}
export function isLight(item: Item) { return item.kind==='Light'||item.kind==='Tube light' }
export function itemsOnWall(items: Item[], room: Room, side: WallSide) {
  return items.filter(i=>{
    if(i.room!==room.id) return false
    if(i.surface===side) return true
    if(i.surface!=='floor') return false
    const e=extent(i)
    const adjacent=side==='north'?i.y-e.h/2<=.35:side==='south'?room.h-i.y-e.h/2<=.35:side==='west'?i.x-e.w/2<=.35:room.w-i.x-e.w/2<=.35
    const centre=side==='north'||side==='south'?i.x:i.y
    const length=side==='north'||side==='south'?e.w:e.h
    return adjacent&&wallRanges(room,side).some(r=>centre+length/2>r.start&&centre-length/2<r.end)
  })
}
export function extent(item: Pick<Item,'w'|'h'|'rotation'>) {
  const a=item.rotation*Math.PI/180
  return { w:Math.abs(item.w*Math.cos(a))+Math.abs(item.h*Math.sin(a)), h:Math.abs(item.w*Math.sin(a))+Math.abs(item.h*Math.cos(a)) }
}
export function fit(item: Item, room: Room): Item | null {
  const bounds=size(room,item.surface), e=extent(item)
  const maxDepth=item.surface==='floor'||item.surface==='ceiling'?ceilingHeight:item.surface==='north'||item.surface==='south'?room.h:room.w
  if(item.depth>maxDepth) return null
  if(e.w>bounds.w+1e-8 || e.h>bounds.h+1e-8) return null
  let x=Math.max(e.w/2,Math.min(bounds.w-e.w/2,item.x))
  if(item.surface!=='floor'&&item.surface!=='ceiling') {
    const candidates=wallRanges(room,item.surface).filter(r=>r.end-r.start+1e-8>=e.w)
      .map(r=>Math.max(r.start+e.w/2,Math.min(r.end-e.w/2,item.x)))
    if(!candidates.length) return null
    x=candidates.reduce((nearest,next)=>Math.abs(next-item.x)<Math.abs(nearest-item.x)?next:nearest)
  }
  return {...item,x,y:Math.max(e.h/2,Math.min(bounds.h-e.h/2,item.y))}
}
export function parseDesign(text: string): Design {
  const d: unknown=JSON.parse(text)
  if(typeof d!=='object'||d===null||!('version' in d)||d.version!==1||!('items' in d)||!Array.isArray(d.items)) throw new Error('Unsupported design file. Expected version 1 and an items list.')
  const seen=new Set<string>()
  for(const item of d.items as unknown[]) {
    if(typeof item!=='object'||item===null) throw new Error('Invalid item.')
    const i=item as Record<string,unknown>
    if(i.visible!==undefined&&typeof i.visible!=='boolean') throw new Error('Item visibility must be a boolean.')
    if(i.label!==undefined&&(typeof i.label!=='string'||i.label.length>80)) throw new Error('Item label must be text of at most 80 characters.')
    if(typeof i.id!=='string'||seen.has(i.id)||typeof i.room!=='string'||!rooms.some(r=>r.id===i.room)||!surfaces.includes(i.surface as Surface)||!Object.hasOwn(palette,String(i.kind))||typeof i.color!=='string'||!/^#[0-9a-f]{6}$/i.test(i.color)) throw new Error('Invalid item identity, room, surface, kind or colour.')
    for(const key of ['x','y','w','h','depth','rotation']) if(typeof i[key]!=='number'||!Number.isFinite(i[key])) throw new Error('Item dimensions must be finite numbers.')
    const typed=item as Item, room=rooms.find(r=>r.id===typed.room)!
    if(typed.w<=0||typed.h<=0||typed.depth<=0||typed.depth>11||['link','kitchen-gap'].includes(room.id)||!hasWall(room,typed.surface)||!kindsFor(typed.surface).includes(typed.kind)) throw new Error('Item dimensions or surface are not valid.')
    const fitted=fit(typed,room)
    if(!fitted||Math.abs(fitted.x-typed.x)>.001||Math.abs(fitted.y-typed.y)>.001) throw new Error('An item extends outside its room surface or finished room height/depth.')
    seen.add(typed.id)
  }
  return {version:1,items:d.items as Item[]}
}
