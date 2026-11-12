import { fit, palette } from './design'
import type { Design, Item, Kind } from './design'
import { hasWall, rooms } from './plan'
import type { Surface } from './plan'

export function starterItems(): Item[] {
  const result: Item[]=[]
  for(const room of rooms) {
    if(['link','kitchen-gap'].includes(room.id)) continue
    let sequence=0
    function add(kind: Kind, surface: Surface, x: number, y: number, changes: Partial<Item>={}) {
      const item=fit({ ...palette[kind], id:`starter-${room.id}-${sequence++}`, room:room.id, kind, surface, x,y,rotation:0,visible:true,...changes },room)
      if(!item) throw new Error(`Starter ${kind} does not fit ${room.name}.`)
      result.push(item)
    }
    add('Light','ceiling',room.w*.3,room.h*.5,{label:'Ceiling light'})
    if(room.id==='bath-lobby'||room.id==='laundry') {
      add('Tube light','ceiling',room.w*.65,room.h*.5,{w:2,label:'Ceiling tube light'})
    } else {
      const side=hasWall(room,'north')?'north':hasWall(room,'east')?'east':'south'
      add('Tube light',side,(side==='east'?room.h:room.w)/2,.65,{w:Math.min(4,room.w-1),label:'Wall tube light'})
    }
    if(['master','bed2','bed3'].includes(room.id)) {
      add('Bed','floor',room.w/2,room.h*.45,{label:'Double bed'})
      add('Cupboard','floor',room.w-1.1,room.h-3.5,{w:2,h:5,depth:7,label:'Wardrobe'})
      add('Fan','ceiling',room.w/2,room.h*.5)
    } else if(room.id==='living') {
      add('Sofa','floor',1.8,13,{w:3,h:6,label:'Hall sofa'})
      add('Table','floor',5,13,{w:2.5,h:3,depth:1.5,label:'Coffee table'})
      add('Cabinet','floor',room.w-1,15,{w:1.5,h:5,depth:2.5,label:'TV unit'})
      add('Fan','ceiling',6.5,12)
    } else if(room.id==='dining') {
      add('Table','floor',6.5,6,{label:'Dining table'})
      for(const x of [5,8]) {
        add('Chair','floor',x,3.3)
        add('Chair','floor',x,8.7)
      }
      add('Fan','ceiling',6.5,6)
    } else if(room.id==='kitchen') {
      add('Cabinet','floor',room.w-1,5,{w:1.8,h:7,depth:3,label:'East counter'})
      add('Cabinet','floor',4,room.h-1,{w:6,h:1.8,depth:3,label:'South counter'})
      add('Fridge','floor',1.6,2.1)
    } else if(room.id.startsWith('bath')&&room.id!=='bath-lobby') {
      add('Shower','floor',1.6,1.7)
      add('Toilet','floor',room.w-1,room.h-1.3)
      add('Basin','floor',room.w-1.2,.9,{w:1.6,h:1.2})
    } else if(room.id.startsWith('dress')) {
      add('Cupboard','floor',room.w/2,1.1,{w:5.5,h:1.8,depth:7,label:'Dressing wardrobe'})
    } else if(room.id==='puja') {
      add('Altar','floor',room.w/2,1)
    } else if(room.id==='laundry') {
      add('Washing machine','floor',room.w-1.1,room.h/2)
    }
  }
  return result
}
export function withMissingStarters(design: Design): Design {
  const ids=new Set(design.items.map(i=>i.id))
  return {...design,items:[...design.items,...starterItems().filter(i=>!ids.has(i.id))]}
}
