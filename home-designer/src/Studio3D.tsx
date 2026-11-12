import { lazy, Suspense, useEffect, useState } from 'react'
import type { Item } from './design'
import { itemsOnWall } from './design'
import type { Room, WallSide } from './plan'
import { rooms, wallColor, wallRanges, wallSides } from './plan'
import type { Lighting, WallSelection } from './scene'

const Room3D=lazy(()=>import('./Room3D'))
type Props = {
  room?: Room
  items: Item[]
  dark: boolean
  lighting: Lighting
  onLighting: (value: Lighting)=>void
  onVisibility: (id: string, visible: boolean)=>void
  onEdit: (room: Room, surface: Item['surface'], id?: string)=>void
  onHome: ()=>void
}
export default function Studio3D({room,items,dark,lighting,onLighting,onVisibility,onEdit,onHome}:Props) {
  const [expanded,setExpanded]=useState(false)
  useEffect(()=>{
    if(!expanded) return
    const overflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    const escape=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setExpanded(false)}
    }
    document.addEventListener('keydown',escape,true)
    return ()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',escape,true)}
  },[expanded])
  const [wall,setWall]=useState<WallSelection|null>(null)
  const selectedRoom=rooms.find(r=>r.id===wall?.roomId)
  const relevant=selectedRoom&&wall?itemsOnWall(items,selectedRoom,wall.side):items.filter(i=>!room||i.room===room.id)
  const choices=room?[room]:rooms
  const [pickerRoom,setPickerRoom]=useState(room?.id??'master')
  const picked=rooms.find(r=>r.id===pickerRoom)!
  const walls=wallSides.filter(s=>wallRanges(picked,s).length)
  function selectWall(roomId:string,side:WallSide){setWall({roomId,side});setPickerRoom(roomId)}
  function itemList(list:Item[]){
    return <div className="visibility-list">{list.map(i=><div className="visibility-row" key={i.id}>
      <label><input type="checkbox" checked={i.visible!==false} aria-label={`Show ${i.label??i.kind} ${i.id}`} onChange={e=>onVisibility(i.id,e.target.checked)}/><span><strong>{i.label??i.kind}</strong><small>{i.surface} · {i.w}' × {i.h}'</small></span></label>
      <button aria-label={`Edit ${i.label??i.kind} ${i.id}`} onClick={()=>onEdit(rooms.find(r=>r.id===i.room)!,i.surface,i.id)}>Edit</button>
    </div>)}</div>
  }
  return <div className={`studio-3d${expanded?' model-fullscreen':''}`} data-expanded={expanded}>
    <div className="scene-column">
      <div className="model-toolbar">
        {expanded?<nav className="breadcrumbs" aria-label="Model breadcrumb"><button onClick={onHome}>Home</button><span aria-hidden="true">/</span><span aria-current="page">{room?.name??'Whole house'} 3D</span></nav>:<span className="eyebrow">{room?.name??'Whole house'} · 3D model</span>}
        <button onClick={()=>setExpanded(v=>!v)}>{expanded?'Exit fullscreen':'Fullscreen'}</button>
      </div>
      <div className="lighting-controls" aria-label="Lighting controls">
        <div className="time-switch"><button aria-pressed={lighting.time==='day'} onClick={()=>onLighting({...lighting,time:'day',sun:true})}>Day</button><button aria-pressed={lighting.time==='night'} onClick={()=>onLighting({...lighting,time:'night',sun:false})}>Night</button></div>
        <label><input type="checkbox" checked={lighting.sun} disabled={lighting.time==='night'} onChange={e=>onLighting({...lighting,sun:e.target.checked})}/>Sunlight <span className="ray-key sun"/></label>
        <label><input type="checkbox" checked={lighting.lights} onChange={e=>onLighting({...lighting,lights:e.target.checked})}/>Ceiling / tube lights <span className="ray-key electric"/></label>
        <label><input type="checkbox" checked={lighting.rays} onChange={e=>onLighting({...lighting,rays:e.target.checked})}/>Show rays</label>
      </div>
      <Suspense fallback={<p>Loading 3D preview...</p>}><Room3D room={room} items={items} dark={dark} lighting={lighting} selectedWall={wall} onWall={w=>selectWall(w.roomId,w.side)}/></Suspense>
      <p className="hint" role="status">{lighting.time==='day'?'Daytime':'Nighttime'} · Sun {lighting.sun&&lighting.time==='day'?'on':'off'} · Electric lights {lighting.lights?'on':'off'} · {items.filter(i=>i.visible!==false&&(!room||i.room===room.id)).length} visible objects</p>
    </div>
    <aside className="scene-inspector">
      <span className="eyebrow">WALL INSPECTOR & OBJECTS</span>
      <h3>{selectedRoom&&wall?`${selectedRoom.name} · ${wall.side} wall`:'Objects in 3D'}</h3>
      <p className="hint">Click a wall in the model, or select it below. Checkboxes hide objects and their emitted light without deleting them.</p>
      <label className="field">Room<select aria-label="Inspect room" value={pickerRoom} onChange={e=>{setPickerRoom(e.target.value);setWall(null)}}>{choices.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
      <div className="wall-buttons">{walls.map(s=><button key={s} aria-label={`Inspect ${s} wall`} aria-pressed={wall?.roomId===pickerRoom&&wall.side===s} onClick={()=>selectWall(pickerRoom,s)}>{s}</button>)}</div>
      {selectedRoom&&wall&&<section className="wall-detail" aria-label="Selected wall details">
        <p className="wall-finish"><span style={{background:wallColor}}/>Wall colour <code>{wallColor}</code></p>
        <p className="hint">Current default finish. Wall-colour editing will come later. Gold in the model is only the selection highlight.</p>
        <div className="actions"><button onClick={()=>onEdit(selectedRoom,wall.side)}>Open wall editor</button><button onClick={()=>setWall(null)}>Show all objects</button></div>
        <p className="hint">Includes wall-mounted objects and floor furniture within 0.35 ft of this wall. Other layers remain independent.</p>
      </section>}
      <h3>{wall?'On / against this wall':'Visibility'} <small>({relevant.length})</small></h3>
      {!relevant.length?<p className="empty">No objects on this wall yet.</p>:room||wall?itemList(relevant):choices.map(r=>{
        const list=relevant.filter(i=>i.room===r.id)
        return list.length?<details key={r.id} open={r.id===pickerRoom}><summary>{r.name} <small>({list.length})</small></summary>{itemList(list)}</details>:null
      })}
    </aside>
  </div>
}
