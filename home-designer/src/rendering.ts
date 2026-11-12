import * as THREE from 'three'
import type { Item } from './design'

// Models occupy a unit box: X = width, Y = height/drop, Z = plan depth.
export function furnitureModel(item: Item): THREE.Group | null {
  if(!['Sofa','Table','Fan'].includes(item.kind)) return null
  const group=new THREE.Group()
  group.userData.model=item.kind
  const base=new THREE.Color(item.color)
  const finish=new THREE.MeshStandardMaterial({color:base,roughness:.7})
  const soft=new THREE.MeshStandardMaterial({color:base.clone().lerp(new THREE.Color('#ffffff'),.16),roughness:.95})
  const dark=new THREE.MeshStandardMaterial({color:base.clone().multiplyScalar(.48),roughness:.5,metalness:.2})
  const materials=[finish,soft,dark]
  function part(geometry:THREE.BufferGeometry,material:THREE.Material,x:number,y:number,z:number) {
    const mesh=new THREE.Mesh(geometry,material)
    mesh.position.set(x,y,z);group.add(mesh);return mesh
  }
  function box(w:number,h:number,d:number,x:number,y:number,z:number,material=finish) {
    return part(new THREE.BoxGeometry(w,h,d),material,x,y,z)
  }
  function leg(x:number,z:number,top:number,bottom=-.5) {
    part(new THREE.CylinderGeometry(.025,.018,top-bottom,10),dark,x,(top+bottom)/2,z)
  }
  if(item.kind==='Sofa') {
    for(const x of [-.39,.39]) for(const z of [-.36,.36]) leg(x,z,-.31)
    box(.96,.18,.94,0,-.22,0)
    box(.94,.59,.16,0,.205,-.41)
    for(const x of [-.44,.44]) box(.12,.48,.94,x,-.02,0)
    // Separate tailored cushions leave readable seams without texture assets.
    for(const x of [-.25,0,.25]) {
      box(.235,.17,.69,x,-.035,.035,soft)
      const back=box(.235,.4,.15,x,.255,-.285,soft)
      back.rotation.x=-.1
      box(.218,.013,.012,x,.045,.373,finish)
    }
    for(const x of [-.44,.44]) box(.12,.055,.9,x,.245,0,soft)
  } else if(item.kind==='Table') {
    box(1,.1,1,0,.45,0)
    box(.94,.035,.94,0,.382,0,dark)
    for(const x of [-.39,.39]) for(const z of [-.37,.37]) leg(x,z,.365)
    for(const x of [-.39,.39]) box(.045,.15,.78,x,.28,0)
    for(const z of [-.37,.37]) box(.82,.15,.045,0,.28,z)
  } else {
    function cylinder(top:number,bottom:number,height:number,y:number,material=finish) {
      return part(new THREE.CylinderGeometry(top,bottom,height,32),material,0,y,0)
    }
    cylinder(.105,.075,.13,.435)
    cylinder(.018,.018,.39,.175,dark)
    cylinder(.09,.145,.12,-.08)
    cylinder(.145,.13,.19,-.235)
    cylinder(.105,.065,.09,-.375,dark)
    const blade=new THREE.Shape()
    blade.moveTo(.075,-.028)
    blade.bezierCurveTo(.19,-.025,.29,-.105,.43,-.095)
    blade.bezierCurveTo(.49,-.09,.49,-.015,.455,.015)
    blade.bezierCurveTo(.34,.09,.18,.065,.075,.028)
    blade.closePath()
    const geometry=new THREE.ExtrudeGeometry(blade,{depth:.026,bevelEnabled:false,curveSegments:12})
    geometry.rotateX(Math.PI/2)
    for(let i=0;i<3;i++) {
      const mesh=part(geometry,finish,0,-.28,0)
      mesh.rotation.y=i*Math.PI*2/3
      mesh.userData.fanBlade=true
      const bracket=box(.14,.035,.035,0,-.285,0,dark)
      bracket.position.set(Math.cos(i*Math.PI*2/3)*.1,-.285,-Math.sin(i*Math.PI*2/3)*.1)
      bracket.rotation.y=i*Math.PI*2/3
    }
  }
  // Only allocate finishes actually used by this model; unused ones have no scene owner.
  const used=new Set<THREE.Material>()
  group.traverse(object=>{if(object instanceof THREE.Mesh) used.add(object.material)})
  materials.forEach(material=>{if(!used.has(material)) material.dispose()})
  group.scale.set(item.w,item.depth,item.h)
  return group
}

const guideVertex=`
  varying vec2 guideUv;
  void main() {
    guideUv=uv;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
  }
`

/** Illustrative tapered source guide and soft floor pool, not light transport. */
export function lightGuide(parent:THREE.Object3D,origin:THREE.Vector3,target:THREE.Vector3,radiusX:number,radiusZ:number,color:string,sourceRadius=.05) {
  const direction=origin.clone().sub(target)
  const length=direction.length()
  if(length<.01) return
  const material=new THREE.ShaderMaterial({
    uniforms:{tint:{value:new THREE.Color(color)}},
    vertexShader:guideVertex,
    fragmentShader:`
      uniform vec3 tint;
      varying vec2 guideUv;
      void main() {
        float fade=sin(guideUv.y*3.14159265);
        gl_FragColor=vec4(tint,0.075*fade*fade);
      }
    `,
    transparent:true,depthWrite:false,side:THREE.FrontSide,forceSinglePass:true,
  })
  const volume=new THREE.Mesh(new THREE.CylinderGeometry(sourceRadius,1,1,40,1,true),material)
  volume.scale.set(radiusX,length,radiusZ)
  volume.position.copy(origin).add(target).multiplyScalar(.5)
  volume.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize())
  volume.userData.ray=true
  parent.add(volume)
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(radiusX*2,radiusZ*2),new THREE.ShaderMaterial({
    uniforms:{tint:{value:new THREE.Color(color)}},
    vertexShader:guideVertex,
    fragmentShader:`
      uniform vec3 tint;
      varying vec2 guideUv;
      void main() {
        float radius=length((guideUv-0.5)*2.0);
        float fade=1.0-smoothstep(0.0,1.0,radius);
        gl_FragColor=vec4(tint,0.23*fade*fade);
      }
    `,
    transparent:true,depthWrite:false,side:THREE.FrontSide,forceSinglePass:true,
  }))
  glow.rotation.x=-Math.PI/2;glow.position.copy(target)
  glow.userData.floorGlow=true
  parent.add(glow)
}
