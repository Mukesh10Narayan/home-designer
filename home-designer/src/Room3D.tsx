import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Room } from './plan'
import { ceilingHeight, obstacles, rooms, wallColor, wallRanges, wallSides } from './plan'
import { isLight } from './design'
import type { Item } from './design'
import type { Lighting, WallSelection } from './scene'

type Props = {
  room?: Room
  items: Item[]
  lighting: Lighting
  dark: boolean
  selectedWall: WallSelection | null
  onWall: (wall: WallSelection) => void
}
type SceneState = {
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  ambient: THREE.HemisphereLight
  sun: THREE.DirectionalLight
  sunRays: THREE.Group
  fixtures: { group: THREE.Group; light: THREE.PointLight; rays: THREE.Group; material: THREE.MeshStandardMaterial; item: Item }[]
  walls: { mesh: THREE.Mesh; wall: WallSelection }[]
}
function updateAppearance(s:SceneState, lighting:Lighting, dark:boolean, selectedWall:WallSelection|null) {
  s.scene.background=new THREE.Color(lighting.time==='night'?'#0c1423':dark?'#182723':'#eff3ee')
  s.ambient.intensity=lighting.time==='night'?.1:.85
  s.sun.visible=lighting.sun&&lighting.time==='day'
  s.sunRays.visible=lighting.sun&&lighting.time==='day'&&lighting.rays
  let active=0
  for(const f of s.fixtures){
    const on=lighting.lights&&f.item.visible!==false
    f.light.visible=on;f.rays.visible=on&&lighting.rays
    f.material.emissive.set(on?'#ffffff':'#000000');f.material.emissiveIntensity=on?1.5:0
    if(on)active++
  }
  for(const {mesh,wall} of s.walls) {
    const chosen=selectedWall?.roomId===wall.roomId&&selectedWall.side===wall.side
    const material=mesh.material as THREE.MeshStandardMaterial
    material.color.set(chosen?'#e7bb55':wallColor);material.opacity=chosen?.65:.28
  }
  s.renderer.render(s.scene,s.camera)
  return active
}

export default function Room3D({ room, items, lighting, dark, selectedWall, onWall }: Props) {
  const host=useRef<HTMLDivElement>(null)
  const state=useRef<SceneState|null>(null)
  const onWallRef=useRef(onWall)
  const cameraPose=useRef<{key:string;position:THREE.Vector3;target:THREE.Vector3}|null>(null)
  const [error,setError]=useState('')
  useEffect(()=>{onWallRef.current=onWall},[onWall])
  useEffect(()=>{
    const node=host.current!
    let renderer: THREE.WebGLRenderer
    try { renderer=new THREE.WebGLRenderer({antialias:true}) }
    catch(e) { queueMicrotask(()=>setError(`3D is unavailable: ${e instanceof Error?e.message:String(e)}. Use the 2D views instead.`)); return }
    const scene=new THREE.Scene()
    const camera=new THREE.PerspectiveCamera(45,1,.1,400)
    const controls=new OrbitControls(camera,renderer.domElement)
    const key=room?.id??'house'
    const pose=cameraPose.current
    if(pose?.key===key) {camera.position.copy(pose.position);controls.target.copy(pose.target)}
    else if(room) {camera.position.set(room.w*1.35,Math.max(18,room.h),room.h*1.5);controls.target.set(room.w/2,3,room.h/2)}
    else {camera.position.set(65,65,84);controls.target.set(13.5,1.5,26.5)}
    controls.enableDamping=true
    controls.maxDistance=180
    controls.minDistance=3
    const ambient=new THREE.HemisphereLight('#ffffff','#778480',1)
    scene.add(ambient)
    const sun=new THREE.DirectionalLight('#ffdf84',2)
    sun.position.set(70,50,-20)
    sun.target.position.set(room?room.w/2:13.5,0,room?room.h/2:26.5)
    scene.add(sun,sun.target)
    const sunRays=new THREE.Group()
    scene.add(sunRays)
    const walls: SceneState['walls']=[]
    const fixtures: SceneState['fixtures']=[]
    const roomSet=room?[room]:rooms
    function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,color:string,opacity=1) {
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,transparent:opacity<1,opacity,roughness:.65,depthWrite:opacity===1}))
      mesh.position.set(x,y,z);parent.add(mesh);return mesh
    }
    function rays(parent:THREE.Object3D,origin:THREE.Vector3,targets:THREE.Vector3[],color:string) {
      const points=targets.flatMap(target=>[origin,target])
      const mesh=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:true,opacity:.65,depthWrite:false}))
      mesh.userData.ray=true
      parent.add(mesh)
    }
    function label(text:string,x:number,z:number) {
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=64
      const ctx=canvas.getContext('2d')
      if(!ctx) return
      ctx.fillStyle='#153d35';ctx.font='bold 30px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,43)
      const texture=new THREE.CanvasTexture(canvas)
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}))
      sprite.position.set(x,.22,z);sprite.scale.set(6,.75,1);scene.add(sprite)
    }
    for(const r of roomSet) {
      const ox=room?0:r.x,oz=room?0:r.y
      box(scene,r.w,.15,r.h,ox+r.w/2,-.08,oz+r.h/2,r.color)
      if(!room) label(r.name,ox+r.w/2,oz+r.h/2)
      for(const side of wallSides) {
        const horizontal=side==='north'||side==='south'
        const holes=obstacles(r,side)
        const ranges=wallRanges(r,side)
        for(const range of ranges) {
          const xs=[...new Set([range.start,range.end,...holes.flatMap(o=>[Math.max(range.start,Math.min(range.end,o.x)),Math.max(range.start,Math.min(range.end,o.x+o.w))])])].sort((a,b)=>a-b)
          const ys=[...new Set([0,ceilingHeight,...holes.flatMap(o=>[o.y,o.y+o.h])])].sort((a,b)=>a-b)
          for(let a=0;a<xs.length-1;a++) for(let b=0;b<ys.length-1;b++) {
            const x=(xs[a]+xs[a+1])/2,y=(ys[b]+ys[b+1])/2
            if(holes.some(o=>x>o.x&&x<o.x+o.w&&y>o.y&&y<o.y+o.h)) continue
            // Separate the two room-facing wall skins to avoid shared-wall z-fighting.
            const inward=.035
            const mesh=box(scene,horizontal?xs[a+1]-xs[a]:.055,ys[b+1]-ys[b],horizontal?.055:xs[a+1]-xs[a],
              ox+(horizontal?x:side==='west'?inward:r.w-inward),ceilingHeight-y,oz+(horizontal?(side==='north'?inward:r.h-inward):x),wallColor,.28)
            const wall={roomId:r.id,side}
            mesh.userData.wall=wall
            walls.push({mesh,wall})
          }
        }
        const exterior=side==='north'?r.y===0:side==='south'?r.y+r.h===53:side==='west'?r.x===0:r.x+r.w===27
        if(exterior) for(const opening of holes.filter(o=>o.kind==='Window')) {
          const centre=opening.x+opening.w/2
          const wx=ox+(horizontal?centre:side==='west'?0:r.w)
          const wz=oz+(horizontal?(side==='north'?0:r.h):centre)
          const inward=new THREE.Vector3(side==='west'?1:side==='east'?-1:0,0,side==='north'?1:side==='south'?-1:0)
          const origin=new THREE.Vector3(wx,5,wz).addScaledVector(inward,-3).add(new THREE.Vector3(0,3,0))
          const end=new THREE.Vector3(wx,0.12,wz).addScaledVector(inward,Math.min(5,horizontal?r.h:r.w))
          rays(sunRays,origin,[-.6,0,.6].map(d=>end.clone().add(new THREE.Vector3(horizontal?d:0,0,horizontal?0:d))),'#ffd23f')
        }
      }
    }
    const gridSize=room?Math.max(room.w,room.h)*2:70
    const grid=new THREE.GridHelper(gridSize,gridSize,'#82998d','#b8c5bd')
    const gridMaterials=Array.isArray(grid.material)?grid.material:[grid.material]
    gridMaterials.forEach(material=>{material.transparent=true;material.opacity=.18;material.depthWrite=false})
    grid.position.set(room?room.w/2:13.5,-.18,room?room.h/2:26.5);scene.add(grid)
    for(const item of items) {
      const r=rooms.find(r=>r.id===item.room)!
      if(room&&room.id!==r.id) continue
      const ox=room?0:r.x,oz=room?0:r.y
      const s=item.surface,horizontal=s==='floor'||s==='ceiling'
      const x=ox+(horizontal||s==='north'||s==='south'?item.x:s==='west'?item.depth/2:r.w-item.depth/2)
      const z=oz+(horizontal?item.y:s==='north'?item.depth/2:s==='south'?r.h-item.depth/2:item.x)
      const y=s==='floor'?item.depth/2:s==='ceiling'?ceilingHeight-item.depth/2:ceilingHeight-item.y
      const group=new THREE.Group();group.visible=item.visible!==false;scene.add(group)
      const mesh=box(group,horizontal||s==='north'||s==='south'?item.w:item.depth,horizontal?item.depth:item.h,horizontal?item.h:s==='east'||s==='west'?item.w:item.depth,x,y,z,item.color,item.kind==='Ceiling panel'?.5:1)
      const a=item.rotation*Math.PI/180
      if(horizontal) mesh.rotation.y=-a
      else if(s==='north'||s==='south') mesh.rotation.z=-a
      else mesh.rotation.x=a
      if(item.kind==='Fan') {
        mesh.scale.set(.18,1,.18)
        const blade=box(group,item.w,.1,.25,x,y,z,item.color);blade.rotation.y=-a
        const blade2=box(group,.25,.1,item.h,x,y,z,item.color);blade2.rotation.y=-a
      } else if(item.kind==='Bed') {
        const pillow=box(group,item.w*.8,.25,1.2,0,item.depth/2+.15,-item.h/2+.9,'#eaf0f2')
        mesh.add(pillow)
      } else if(item.kind==='Sofa') {
        const back=box(group,item.w,.9,.3,0,item.depth/2+.3,-item.h/2+.15,'#737c56');mesh.add(back)
      } else if(item.kind==='Cupboard'||item.kind==='Cabinet') {
        const seam=box(group,.025,item.surface==='floor'?item.depth*.85:item.h*.85,.025,0,0,(horizontal?item.h:item.depth)/2+.02,'#5e675f');mesh.add(seam)
      }
      if(isLight(item)) {
        const light=new THREE.PointLight('#ffffff',35,13,1.5)
        light.position.set(x,y-.3,z);group.add(light)
        const beam=new THREE.Group();group.add(beam)
        const floorY=.18
        const spread=item.kind==='Tube light'?1.5:2
        const targets=[[-spread,-spread],[spread,-spread],[spread,spread],[-spread,spread],[0,0]]
          .map(([dx,dz])=>new THREE.Vector3(Math.max(ox+.15,Math.min(ox+r.w-.15,x+dx)),floorY,Math.max(oz+.15,Math.min(oz+r.h-.15,z+dz))))
        rays(beam,new THREE.Vector3(x,y-.25,z),targets,'#ffffff')
        fixtures.push({group,light,rays:beam,material:mesh.material,item})
      }
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio,2))
    node.appendChild(renderer.domElement)
    state.current={scene,renderer,camera,controls,ambient,sun,sunRays,fixtures,walls}
    const resize=new ResizeObserver(()=>{
      if(!node.clientWidth||!node.clientHeight) return
      renderer.setSize(node.clientWidth,node.clientHeight);camera.aspect=node.clientWidth/node.clientHeight;camera.updateProjectionMatrix()
      renderer.render(scene,camera)
    })
    resize.observe(node)
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2()
    let down={x:0,y:0}
    const pointerDown=(e:globalThis.PointerEvent)=>{down={x:e.clientX,y:e.clientY}}
    const pick=(e:globalThis.PointerEvent)=>{
      if(e.button!==0||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5) return
      const rect=renderer.domElement.getBoundingClientRect()
      pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1)
      raycaster.setFromCamera(pointer,camera)
      const hits=raycaster.intersectObjects(walls.map(w=>w.mesh))
      const wall=hits[0]?.object.userData.wall as WallSelection|undefined
      if(wall) onWallRef.current(wall)
    }
    renderer.domElement.addEventListener('pointerdown',pointerDown)
    renderer.domElement.addEventListener('pointerup',pick)
    const contextLost=(e:Event)=>{e.preventDefault();setError('3D graphics context was lost. Reopen this view to retry; your design is saved separately.')}
    renderer.domElement.addEventListener('webglcontextlost',contextLost)
    let frame=0
    function animate(){controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(animate)}
    animate()
    return ()=>{
      cameraPose.current={key,position:camera.position.clone(),target:controls.target.clone()}
      state.current=null
      cancelAnimationFrame(frame);resize.disconnect();controls.dispose()
      renderer.domElement.removeEventListener('pointerdown',pointerDown)
      renderer.domElement.removeEventListener('pointerup',pick)
      renderer.domElement.removeEventListener('webglcontextlost',contextLost)
      scene.traverse(obj=>{
        if(obj instanceof THREE.Mesh||obj instanceof THREE.LineSegments||obj instanceof THREE.Sprite){
          if('geometry' in obj) obj.geometry.dispose()
          const materials=Array.isArray(obj.material)?obj.material:[obj.material]
          materials.forEach(m=>{if('map' in m&&m.map instanceof THREE.Texture)m.map.dispose();m.dispose()})
        }
      })
      renderer.dispose();node.replaceChildren()
    }
  },[room,items])
  useEffect(()=>{
    const s=state.current
    if(!s) return
    const active=updateAppearance(s,lighting,dark,selectedWall)
    // Expose rendered scene state for assistive status and regression assertions.
    host.current!.dataset.sunRays=String(s.sunRays.visible)
    host.current!.dataset.activeLights=String(active)
    host.current!.dataset.visibleItems=String(items.filter(i=>i.visible!==false&&(!room||i.room===room.id)).length)
  },[lighting,dark,selectedWall,items,room])
  return <div className="scene-wrap"><p className="hint">Drag to orbit · Scroll / pinch to zoom · Right-drag to pan · Click a wall to inspect. Roof omitted; transparent walls expose the interiors. Yellow rays = sunlight; white rays = electric lights. Illustrative, not a daylight or lux simulation.</p>{error&&<p role="alert">{error}</p>}<div className="three-view" ref={host} aria-label={`3D preview of ${room?.name??'whole house'}`}/></div>
}
