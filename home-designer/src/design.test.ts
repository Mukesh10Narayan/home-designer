import { describe, expect, it } from 'vitest'
import { fit, isLight, itemsOnWall, parseDesign } from './design'
import { starterItems, withMissingStarters } from './defaults'
import type { Item } from './design'
import { hasWall, obstacles, rooms } from './plan'

const master=rooms.find(r=>r.id==='master')!
const cupboard: Item={id:'test',room:'master',surface:'north',kind:'Cupboard',x:7,y:4.75,w:6,h:7,depth:2,rotation:0,color:'#aa7954'}

describe('Design C geometry and clearance',()=>{
  it('tiles the reduced footprint without gaps or overlaps',()=>{
    expect(rooms.reduce((sum,r)=>sum+r.w*r.h,0)).toBe(27*53)
    for(let i=0;i<rooms.length;i++){
      const a=rooms[i]
      expect(a.x>=0&&a.y>=0&&a.x+a.w<=27&&a.y+a.h<=53).toBe(true)
      for(const b of rooms.slice(i+1)){
        expect(Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y))).toBe(0)
      }
    }
  })
  it('keeps kitchen/dining open and preserves kitchen south exit but no master west exit',()=>{
    const kitchen=rooms.find(r=>r.id==='kitchen')!
    expect(hasWall(kitchen,'north')).toBe(false)
    expect(obstacles(kitchen,'south').some(o=>o.kind==='Door')).toBe(true)
    expect(obstacles(master,'west').some(o=>o.kind==='Door')).toBe(false)
  })
  it('clamps a rotated item using its rotated bounding box and rejects oversize',()=>{
    const fitted=fit({...cupboard,rotation:90,x:0,y:0},master)!
    expect(fitted.x).toBeCloseTo(3.5)
    expect(fitted.y).toBeCloseTo(3)
    expect(fit({...cupboard,w:30},master)).toBeNull()
    expect(fit({...cupboard,surface:'floor',depth:10},master)).toBeNull()
    expect(fit({...cupboard,depth:17},master)).toBeNull()
  })
})
describe('design import',()=>{
  const file=(items: Item[])=>JSON.stringify({version:1,items})
  it('round-trips edits without losing rotation or colours',()=>{
    expect(parseDesign(file([{...cupboard,rotation:15,color:'#112233'}])).items[0]).toEqual({...cupboard,rotation:15,color:'#112233'})
  })
  it('keeps old saves valid and preserves optional visibility and labels',()=>{
    expect(parseDesign(file([cupboard])).items[0].visible).toBeUndefined()
    expect(parseDesign(file([{...cupboard,visible:false,label:'My wardrobe'}])).items[0].visible).toBe(false)
    expect(()=>parseDesign(JSON.stringify({version:1,items:[{...cupboard,visible:'yes'}]}))).toThrow('visibility')
  })
  it('rejects invalid dimensions, outside objects, duplicate IDs and unsupported versions',()=>{
    expect(()=>parseDesign(file([{...cupboard,w:-1}]))).toThrow()
    expect(()=>parseDesign(file([{...cupboard,x:99}]))).toThrow()
    expect(()=>parseDesign(file([cupboard,cupboard]))).toThrow()
    expect(()=>parseDesign('{"version":2,"items":[]}')).toThrow()
    expect(()=>parseDesign('not JSON')).toThrow()
  })
  describe('starter furniture and wall inspection',()=>{
    it('creates valid room-scale furniture and both light types in every furnished room',()=>{
      const items=starterItems()
      expect(parseDesign(JSON.stringify({version:1,items})).items).toEqual(items)
      for(const room of rooms.filter(r=>!['link','kitchen-gap'].includes(r.id))){
        const local=items.filter(i=>i.room===room.id)
        expect(local.some(i=>i.kind==='Light')).toBe(true)
        expect(local.some(i=>i.kind==='Tube light')).toBe(true)
      }
      expect(items.filter(i=>isLight(i)).length).toBe(28)
      expect(items.some(i=>['link','kitchen-gap'].includes(i.room))).toBe(false)
    })
    it('only adds missing starters, never replacing an edited or hidden item',()=>{
      const starter={...starterItems()[0],visible:false,color:'#123456'}
      const merged=withMissingStarters({version:1,items:[starter,cupboard]})
      expect(merged.items.find(i=>i.id===starter.id)).toEqual(starter)
      expect(withMissingStarters(merged)).toEqual(merged)
      expect(merged.items).toContainEqual(cupboard)
    })
    it('lists wall-mounted objects and nearby furniture, excluding central furniture',()=>{
      const wardrobe:Item={...cupboard,surface:'floor',w:2,h:5,depth:7,x:13,y:10}
      const centre={...wardrobe,id:'centre',x:7}
      expect(itemsOnWall([wardrobe,centre,cupboard],master,'east')).toEqual([wardrobe])
      expect(itemsOnWall([wardrobe,centre,cupboard],master,'north')).toEqual([cupboard])
    })
    it('keeps wall-mounted items on the physical part of a partial wall',()=>{
      const dining=rooms.find(r=>r.id==='dining')!
      const cabinet={...cupboard,room:dining.id,surface:'south' as const,w:4,h:3,x:3}
      expect(fit(cabinet,dining)?.x).toBe(9)
      expect(fit({...cabinet,w:7},dining)).toBeNull()
      expect(fit({...cabinet,surface:'north'},dining)).toBeNull()
    })
  })
  it('rejects furnishing the clear gap or mounting items on an open edge',()=>{
    expect(()=>parseDesign(file([{...cupboard,room:'kitchen-gap',surface:'floor',w:1,h:1,x:1,y:1}]))).toThrow()
    expect(()=>parseDesign(file([{...cupboard,room:'kitchen',surface:'north'}]))).toThrow()
  })
})
