import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import HousePlan from './HousePlan'
import { ceilingHeight, hasWall, obstacles, rooms, size, surfaces, wallRanges } from './plan'
import type { Room, Surface } from './plan'
import { extent, fit, kindsFor, palette, parseDesign, storageKey } from './design'
import type { Design, Item, Kind } from './design'
import { starterItems, withMissingStarters } from './defaults'
import Studio3D from './Studio3D'
import { initialLighting } from './scene'
import './App.css'

function initialDesign(): {design: Design; error: string} {
  try { const saved=localStorage.getItem(storageKey); return {design:saved?parseDesign(saved):{version:1,items:starterItems()},error:''} }
  catch(e){return {design:{version:1,items:[]},error:`Could not load saved design. Your stored data has not been overwritten. ${e instanceof Error?e.message:String(e)}`}}
}
const loaded=initialDesign()
export default function App() {
  const [design,setDesign]=useState(loaded.design)
  const [error,setError]=useState(loaded.error)
  const [saveBlocked,setSaveBlocked]=useState(Boolean(loaded.error))
  const [room,setRoom]=useState<Room|null>(null)
  const [surface,setSurface]=useState<Surface>('floor')
  const [view3D,setView3D]=useState(false)
  const [dark,setDark]=useState(true)
  const [lighting,setLighting]=useState(initialLighting)
  const [house3D,setHouse3D]=useState(false)
  const [fullscreen,setFullscreen]=useState(false)
  const [selected,setSelected]=useState<string|null>(null)
  const [saveError,setSaveError]=useState('')
  const [past,setPast]=useState<Design[]>([])
  const [future,setFuture]=useState<Design[]>([])
  const canvas=useRef<SVGSVGElement>(null)
  const workspace=useRef<HTMLElement>(null)
  const houseDialog=useRef<HTMLDialogElement>(null)
  const drag=useRef<{id:string;dx:number;dy:number;before:Design}|null>(null)
  const items=useMemo(()=>design.items.filter(i=>i.room===room?.id),[design.items,room])
  const visible=items.filter(i=>i.surface===surface&&i.visible!==false)
  const item=visible.find(i=>i.id===selected)
  useEffect(()=>{
    if(saveBlocked) return
    try {localStorage.setItem(storageKey,JSON.stringify(design))}
    catch(e){queueMicrotask(()=>setSaveError(`Could not save: ${e instanceof Error?e.message:String(e)}. Export a backup.`))}
  },[design,saveBlocked])
  useEffect(()=>{
    const change=()=>setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange',change)
    return ()=>document.removeEventListener('fullscreenchange',change)
  },[])
  useEffect(()=>{
    const dialog=houseDialog.current
    if(house3D&&dialog&&!dialog.open) dialog.showModal()
    return ()=>{if(dialog?.open)dialog.close()}
  },[house3D])
  async function toggleFullscreen(element:HTMLElement|null){
    try {
      if(document.fullscreenElement) await document.exitFullscreen()
      else if(element?.requestFullscreen) await element.requestFullscreen()
      else setError('Fullscreen is unavailable in this browser. The expanded workspace is still available.')
    } catch(e){setError(`Could not change fullscreen: ${e instanceof Error?e.message:String(e)}`)}
  }
  function editRoom(next:Room,nextSurface:Surface,id?:string){
    setRoom(next);setSurface(nextSurface);setSelected(id??null);setView3D(false);setHouse3D(false)
  }
  function visibility(id:string,shown:boolean){
    commit({...design,items:design.items.map(i=>i.id===id?{...i,visible:shown}:i)})
  }
  function commit(next:Design){setPast(p=>[...p.slice(-49),design]);setFuture([]);setDesign(next)}
  function patch(changes:Partial<Item>){
    if(!item||!room) return
    const candidate={...item,...changes}
    if(![candidate.x,candidate.y,candidate.w,candidate.h,candidate.depth,candidate.rotation].every(Number.isFinite)||candidate.w<=0||candidate.h<=0||candidate.depth<=0||candidate.depth>11){setError('Use finite positions and positive sizes; depth must not exceed 11 ft.');return}
    const fitted=fit(candidate,room)
    if(!fitted){setError('This size, depth or rotation does not fit the selected surface or finished room height.');return}
    setError('');commit({...design,items:design.items.map(i=>i.id===item.id?fitted:i)})
  }
  function add(kind:Kind) {
    if(!room) return
    if(['link','kitchen-gap'].includes(room.id)){setError('Keep this circulation zone clear. Choose another room to place items.');return}
    const b=size(room,surface),preset=palette[kind]
    const w=surface==='floor'&&kind==='Cupboard'?6:preset.w
    const h=surface==='floor'&&kind==='Cupboard'?2:preset.h
    const next=fit({id:crypto.randomUUID(),room:room.id,surface,kind,x:b.w/2,y:b.h/2,w,h,depth:surface==='floor'&&kind==='Cupboard'?7:preset.depth,rotation:0,color:preset.color},room)
    if(!next){setError(`${kind} does not fit this surface at its default size. Try a smaller item.`);return}
    setError('');commit({...design,items:[...design.items,next]});setSelected(next.id)
  }
  function point(e:PointerEvent<SVGSVGElement|SVGGElement>){
    const svg=canvas.current!,p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY
    return p.matrixTransform(svg.getScreenCTM()!.inverse())
  }
  function start(e:PointerEvent<SVGGElement>,i:Item){
    if(e.button!==0) return
    e.preventDefault();const p=point(e);setSelected(i.id)
    drag.current={id:i.id,dx:p.x-i.x,dy:p.y-i.y,before:design}
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function move(e:PointerEvent<SVGSVGElement>){
    const d=drag.current
    if(!d||!room) return
    const i=design.items.find(i=>i.id===d.id)!,p=point(e)
    const next=fit({...i,x:Math.round((p.x-d.dx)*4)/4,y:Math.round((p.y-d.dy)*4)/4},room)!
    setDesign(v=>({...v,items:v.items.map(i=>i.id===next.id?next:i)}))
  }
  function finish(){
    const d=drag.current;if(!d) return
    if(JSON.stringify(d.before)!==JSON.stringify(design)){setPast(p=>[...p.slice(-49),d.before]);setFuture([])}
    drag.current=null
  }
  function undo(){const prev=past.at(-1);if(prev){setFuture(f=>[design,...f]);setPast(p=>p.slice(0,-1));setDesign(prev);setSelected(null)}}
  function redo(){const next=future[0];if(next){setPast(p=>[...p,design]);setFuture(f=>f.slice(1));setDesign(next);setSelected(null)}}
  function exportFile(){
    const url=URL.createObjectURL(new Blob([JSON.stringify(design,null,2)],{type:'application/json'}))
    const a=document.createElement('a');a.href=url;a.download='design-c-interiors.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  const bounds=room?size(room,surface):{w:1,h:1}
  const holes=room?obstacles(room,surface):[]
  const physicalRanges=room&&surface!=='floor'&&surface!=='ceiling'?wallRanges(room,surface):[]
  const partialWall=physicalRanges.length>0&&physicalRanges.reduce((length,r)=>length+r.end-r.start,0)<bounds.w-.01
  const warnings=item?holes.filter(o=>{
    const e=extent(item)
    return item.x+e.w/2>o.x&&item.x-e.w/2<o.x+o.w&&item.y+e.h/2>o.y&&item.y-e.h/2<o.y+o.h
  }):[]
  return <div className="app" data-theme={dark?'dark':'light'}>
    <header><div><span className="eyebrow">YOUR HOME, THOUGHTFULLY PLANNED</span><h1>Design C <span>/ Interior studio</span></h1><p>27 ft E-W × 53 ft N-S · 3 bedrooms · 3 bathrooms · Northeast entry</p></div><div className="file-actions"><button aria-pressed={dark} onClick={()=>setDark(v=>!v)}>{dark?'Light mode':'Dark mode'}</button><button onClick={()=>setHouse3D(true)}>Whole house 3D</button><button onClick={()=>{if(confirm('Add missing starter furniture and lights? Existing items are kept unchanged. Deleted starter items will be restored.'))commit(withMissingStarters(design))}}>Add starter items</button><button onClick={exportFile}>Export design</button><label className="button">Import JSON<input type="file" accept=".json,application/json" hidden onChange={async e=>{
      const file=e.target.files?.[0];e.target.value='';if(!file)return
      try{const next=parseDesign(await file.text());commit(next);setSaveBlocked(false);setSelected(null);setError('')}catch(err){setError(`Import rejected: ${err instanceof Error?err.message:String(err)}`)}
    }}/></label></div></header>
    {error&&<div className="error" role="alert">{error}<button onClick={()=>setError('')}>Dismiss</button></div>}
    {saveError&&<div className="error" role="alert">{saveError}</div>}
    {saveBlocked&&<p className="error">Automatic saving is paused to protect unreadable saved data. Import a valid backup or <button onClick={()=>{if(confirm('Replace the unreadable local save with this design?')){setSaveBlocked(false);setError('')}}}>replace local save</button>.</p>}
    <main ref={workspace} className={room?`room-workspace${view3D?' room-workspace-3d':''}`:undefined}>
      {!room?<><section className="panel home-plan"><div className="section-title"><h2>Your home plan</h2><span>Click a room to step inside ↗</span></div><HousePlan onRoom={r=>{setRoom(r);setSurface('floor');setSelected(null);setView3D(false)}}/></section>
      <aside className="panel"><span className="eyebrow">START HERE</span><h2>One room.<br/>Every detail.</h2><p>Select a room, then switch between the floor, four wall elevations, ceiling plan and 3D preview.</p><div className="stat"><strong>11 ft</strong><span>Structural ceiling height</span></div><div className="stat"><strong>9.5 ft</strong><span>Finished height · 1.5 ft false-ceiling drop</span></div><h3>Room schedule</h3><div className="room-list">{rooms.map(r=><button key={r.id} onClick={()=>{setRoom(r);setSurface('floor');setView3D(false);setSelected(null)}}><span>{r.name}</span><small>{r.w}' × {r.h}'</small></button>)}</div><p className="hint">Blue = windows. Brown = door swings. Dimensions are nominal wall-line zones. Concept only, not a construction drawing.</p></aside></>:
      <><section className="panel editor"><div className="section-title"><div><button className="back" onClick={()=>{setRoom(null);setSelected(null)}}>← Whole home</button><h2>{room.name}</h2><p>{room.w}' × {room.h}' · {room.w*room.h} sq ft</p></div><div className="actions"><button onClick={()=>toggleFullscreen(workspace.current)}>{fullscreen?'Exit fullscreen':'Fullscreen'}</button><button disabled={!past.length} onClick={undo}>Undo</button> <button disabled={!future.length} onClick={redo}>Redo</button></div></div>
        <nav aria-label="Room views">{surfaces.map(s=><button key={s} aria-pressed={!view3D&&surface===s} onClick={()=>{setSurface(s);setView3D(false);setSelected(null)}}>{s==='floor'?'Floor':s==='ceiling'?'Ceiling':`${s} wall`}</button>)}<button aria-pressed={view3D} onClick={()=>{setView3D(true);setSelected(null)}}>3D preview</button></nav>
        {view3D?<Studio3D key={room.id} room={room} items={items} dark={dark} lighting={lighting} onLighting={setLighting} onVisibility={visibility} onEdit={editRoom}/>:<>
        <p className="hint">{surface==='floor'||surface==='ceiling'?'North up. X runs east, Y runs south.':'Elevation: Y runs down from the finished ceiling. North/south: X runs west to east. East/west: X runs north to south.'} Drag items (3 inch snap), or use arrow keys (Shift = 1 ft). Rotate with R.</p>
        {!hasWall(room,surface)&&<p className="warning">Open edge / circulation zone, not a physical wall. Wall-mounted objects cannot be added here.</p>}
        {partialWall&&<p className="warning">Partial wall: only {physicalRanges.map(r=>`${r.start}–${r.end} ft`).join(', ')} along this elevation is solid. Mounted objects stay within that section; the remaining edge is open.</p>}
        <svg ref={canvas} className="room-canvas" viewBox={`-1.2 -1.2 ${bounds.w+2.4} ${bounds.h+2.4}`} aria-label={`${room.name} ${surface} editor`} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onClick={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
          <defs><pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0 H0 V1" fill="none" stroke="#82968b" strokeOpacity=".2" strokeWidth=".025"/></pattern></defs>
          <rect width={bounds.w} height={bounds.h} fill={surface==='ceiling'?'#f3f0e5':room.color} stroke="#385550" strokeWidth=".06"/>
          <rect width={bounds.w} height={bounds.h} fill="url(#grid)" pointerEvents="none"/>
          {holes.map((o,i)=><g key={i} pointerEvents="none"><rect x={o.x} y={o.y} width={o.w} height={o.h} fill={o.kind==='Window'?'#91d5e0':'#e5d7bf'} opacity=".65" stroke="#748a80" strokeWidth=".03"/><text x={o.x+o.w/2} y={o.y+o.h/2} textAnchor="middle" fontSize=".24">{o.kind}</text></g>)}
          <text x={bounds.w/2} y="-.45" textAnchor="middle" fontSize=".35">{bounds.w} ft · {surface.toUpperCase()}</text>
          <text transform={`translate(-.45 ${bounds.h/2}) rotate(-90)`} textAnchor="middle" fontSize=".32">{bounds.h} ft</text>
          {visible.map(i=><g key={i.id} role="button" tabIndex={0} aria-label={`${i.kind}, ${i.w} by ${i.h} feet`} className="placed-item" transform={`translate(${i.x} ${i.y}) rotate(${i.rotation})`} onClick={()=>setSelected(i.id)} onPointerDown={e=>start(e,i)} onKeyDown={e=>{
            setSelected(i.id)
            if(e.key==='r'||e.key==='R'){e.preventDefault();const n=fit({...i,rotation:(i.rotation+15)%360},room);if(n)commit({...design,items:design.items.map(v=>v.id===i.id?n:v)});else setError('Rotated item will not fit.');return}
            const step=e.shiftKey?1:.25,delta:Record<string,[number,number]>={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}
            if(delta[e.key]){e.preventDefault();const [dx,dy]=delta[e.key],n=fit({...i,x:i.x+dx,y:i.y+dy},room)!;commit({...design,items:design.items.map(v=>v.id===i.id?n:v)})}
          }}>
            <rect x={-i.w/2} y={-i.h/2} width={i.w} height={i.h} rx=".08" fill={i.color} fillOpacity={i.kind==='Ceiling panel'?.55:.95} stroke={i.id===selected?'#164e43':'#fff'} strokeWidth={i.id===selected?.1:.04}/>
            {i.kind==='Fan'&&<path d={`M${-i.w/2+.15} 0 H${i.w/2-.15} M0 ${-i.h/2+.15} V${i.h/2-.15}`} stroke="#fff" strokeWidth=".15"/>}
            <text textAnchor="middle" dominantBaseline="middle" fontSize={Math.min(.3,i.w/i.kind.length*1.4)} pointerEvents="none">{i.kind}</text>
            <circle cy={-i.h/2} r=".08" fill="#164e43"/>
          </g>)}
        </svg></>}
        <p className="hint">Wall doors: assumed 7 ft high; windows: assumed 3 ft sill, 4 ft height. Confirm actual site measurements before designing cabinetry. Open-plan edges remain open.</p>
      </section>
      {!view3D&&<aside className="panel inspector"><span className="eyebrow">{surface.toUpperCase()} DESIGN</span><h2>Make space yours</h2>
        {!view3D&&<><h3>Add to this view</h3><div className="palette">{kindsFor(surface).map(k=><button disabled={!hasWall(room,surface)||['link','kitchen-gap'].includes(room.id)} key={k} onClick={()=>add(k)}>+ {k}</button>)}</div>
        <p className="hint">Floor sizes = footprint; depth field = object height. Wall sizes = elevation; depth = projection. Ceiling sizes = plan; depth = drop.</p>
        {item?<><h3>{item.kind}</h3>{(['w','h','depth','rotation','x','y'] as const).map(key=><label key={`${item.id}-${key}`} className="field">{({w:'Width (ft)',h:'Height / length (ft)',depth:'Depth / height (ft)',rotation:'Rotation (degrees)',x:'Centre X (ft)',y:'Centre Y (ft)'})[key]}<input aria-label={key} type="number" step={key==='rotation'?15:.25} value={item[key]} onChange={e=>{if(e.target.value!=='')patch({[key]:Number(e.target.value)})}}/></label>)}<label className="field">Finish colour<input aria-label="Finish colour" type="color" value={item.color} onChange={e=>patch({color:e.target.value})}/></label>
        <div className="actions"><button onClick={()=>patch({rotation:(item.rotation+15)%360})}>Rotate +15°</button><button className="danger" onClick={()=>{commit({...design,items:design.items.filter(i=>i.id!==item.id)});setSelected(null)}}>Delete</button></div>
        {warnings.length>0&&<p className="warning" role="status">Check clearance: this item overlaps a {warnings.map(o=>o.kind.toLowerCase()).join(' / ')}. This is a placement warning, not a construction clearance check.</p>}
        </>:<p className="empty">Add an item, then select it to change its size, finish or rotation.</p>}</>}
        <h3>In this room <small>({items.length})</small></h3><div className="room-list">{items.map(i=><div className="visibility-row" key={i.id}><input type="checkbox" aria-label={`Show ${i.label??i.kind} ${i.id}`} checked={i.visible!==false} onChange={e=>visibility(i.id,e.target.checked)}/><button onClick={()=>{setSurface(i.surface);setSelected(i.id);setView3D(false)}}><span>{i.label??i.kind}</span><small>{i.surface}{i.visible===false?' · hidden':''}</small></button></div>)}</div>
        <p className="hint">Floor and elevation placements are independent design layers, not linked objects. Avoid duplicating the same cabinet across views. 3D combines all layers.</p>
      </aside>}</>}
    </main>
    {house3D&&<dialog ref={houseDialog} className="house-dialog" aria-label="Whole house 3D" onCancel={()=>setHouse3D(false)} onClose={()=>setHouse3D(false)}>
      <div className="section-title"><div><span className="eyebrow">DESIGN C · 27 × 53 FT</span><h2>Whole house in 3D</h2></div><div className="actions"><button onClick={()=>toggleFullscreen(houseDialog.current)}>{fullscreen?'Exit fullscreen':'Fullscreen'}</button><button onClick={()=>setHouse3D(false)}>Close 3D</button></div></div>
      <Studio3D items={design.items} dark={dark} lighting={lighting} onLighting={setLighting} onVisibility={visibility} onEdit={editRoom}/>
    </dialog>}
    <footer><span role="status">{saveBlocked?'Local save paused':saveError?'Local save failed':'Autosave enabled on this browser'}</span><span>Local browser save · Export JSON to keep a portable backup</span><span>{ceilingHeight} ft finished ceiling · Concept only</span></footer>
  </div>
}
