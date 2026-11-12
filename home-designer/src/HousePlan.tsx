import { doors, openings, planLabels, rooms, wallPaths, windows } from './plan'
import type { Room } from './plan'
import type { ReactNode } from 'react'

function Box({x,y,w,h}:{x:number;y:number;w:number;h:number}) {
  return <rect x={x} y={y} width={w} height={h} rx=".12" className="furniture"/>
}
function Bed({x,y,w,h}:{x:number;y:number;w:number;h:number}) {
  return <g><Box x={x} y={y} w={w} h={h}/>
    <Box x={x+.25} y={y+.25} w={(w-.75)/2} h={1}/>
    <Box x={x+.5+(w-.75)/2} y={y+.25} w={(w-.75)/2} h={1}/>
    <line x1={x} y1={y+1.6} x2={x+w} y2={y+1.6} className="furniture-detail"/>
  </g>
}
function Text({x,y,children,size=.65,cls='room-label'}:{x:number;y:number;children:ReactNode;size?:number;cls?:string}) {
  return <text x={x} y={y} fontSize={size} className={cls}>{children}</text>
}
const airPaths=['M-1.8 45 H3 V49','M-1.8 5 H3','M-1.8 27 H2','M29 47 H23 V51','M17.5 55 V51','M18 5 V1','M29 15 H25','M29 26 H25','M29 3 H25.5','M29 35 H25']
export default function HousePlan({onRoom,furniture=true,air=true}:{onRoom:(room:Room)=>void;furniture?:boolean;air?:boolean}) {
  return <svg className="house-plan reference-plan" viewBox="-5 -5 40 65" aria-label="Design C: 27 by 53 feet. Select a room to design it.">
    <title>Northeast-entry 27 by 53 ft, three bedroom floor plan</title>
    <desc>North up. East living, dining and southeast kitchen with south exit. West bedrooms and bathrooms. Puja northeast of kitchen with a 4 ft clear gap. Click a room to open the interior editor.</desc>
    <defs><marker id="plan-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#178ca2"/></marker></defs>
    <g aria-label="Room zones">{rooms.map(r=><g key={r.id} role="button" tabIndex={0} aria-label={`${r.name}, ${r.w} by ${r.h} feet`} data-room={r.id} onClick={()=>onRoom(r)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onRoom(r)}}} className="plan-room">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={r.color} className="room-fill"/>
    </g>)}</g>
    <g data-layer="reference-furniture" display={furniture?'inline':'none'} pointerEvents="none">
      <Bed x={4} y={42} w={6} h={6.7}/>
      <Box x={2.2} y={42.5} w={1.2} h={1.4}/><Box x={10.3} y={42.5} w={1.2} h={1.4}/><Box x={11.6} y={44} w={2} h={5}/>
      <Box x={.5} y={32.5} w={2.7} h={2.7}/><line x1={.6} y1={32.6} x2={3.1} y2={35.1} className="furniture-detail"/>
      <ellipse cx="5.4" cy="33.5" rx=".55" ry=".8" className="furniture"/><Box x={.5} y={36} w={1.8} h={1}/>
      <Box x={7.5} y={32.5} w={5.5} h={1.8}/>
      <Bed x={4.5} y={22} w={5} h={6.5}/><Box x={11.8} y={21.5} w={1.8} h={3}/>
      <Box x={.5} y={16.9} w={2.7} h={2.7}/><line x1={.6} y1={17} x2={3.1} y2={19.5} className="furniture-detail"/><ellipse cx="5.4" cy="20" rx=".55" ry=".8" className="furniture"/>
      <Box x={7.4} y={19.2} w={1.5} h={1.5}/><Box x={12.1} y={19.2} w={1.5} h={1.5}/>
      <Box x={.5} y={12.4} w={2.7} h={2.7}/><line x1={.6} y1={12.5} x2={3.1} y2={15} className="furniture-detail"/><ellipse cx="5.4" cy="15.2" rx=".55" ry=".8" className="furniture"/>
      <Box x={7.5} y={14.7} w={5.5} h={1.4}/>
      <Bed x={4.5} y={1.5} w={6} h={6.7}/><Box x={2.7} y={2} w={1.2} h={1.4}/><Box x={11} y={2} w={1.2} h={1.4}/><Box x={.5} y={3.5} w={2} h={4.5}/>
      <Box x={15} y={9.8} w={2.2} h={5.5}/><Box x={18.5} y={10.5} w={3} h={2.2}/>
      <Box x={25} y={13} w={1.5} h={5}/><Text x={25.8} y={15.7} size={.35}>TV</Text>
      <Box x={18} y={23.5} w={5} h={3.5}/>
      {[18.4,20.1,21.8].map(x=><g key={x}><Box x={x} y={22.5} w={1} h={.8}/><Box x={x} y={27.3} w={1} h={.8}/></g>)}
      <Box x={22} y={32.6} w={4.4} h={1.2}/><Text x={24.2} y={33.5} size={.4}>ALTAR</Text>
      <Box x={14.4} y={43} w={2.4} h={3}/><Box x={14.4} y={51.3} w={7.2} h={1.5}/><Box x={16.5} y={51.6} w={2.5} h={.9}/><Box x={25} y={43.2} w={1.8} h={8.5}/>
      {[45.3,46.4].map(y=><circle key={y} cx="25.9" cy={y} r=".35" className="furniture-detail"/>)}
    </g>
    <g pointerEvents="none" data-layer="reference-labels">{rooms.filter(r=>r.id!=='link').map(r=>{
      const small=['bath1','bath2','bath3','bath-lobby','laundry','dress','dress2','puja','kitchen-gap'].includes(r.id)
      const positions:Record<string,number>={master:50,bed2:10.2,bed3:30.2,living:4.5,dining:30.5,kitchen:48}
      const y=positions[r.id]??r.y+r.h/2+.5,label=planLabels[r.id]
      if(['bath-lobby','laundry'].includes(r.id)) return <Text key={r.id} x={r.x+r.w/2} y={r.y+r.h/2+.2} size={.42}>{label}</Text>
      return <g key={r.id}><Text x={r.x+r.w/2} y={y} size={Math.min(small?.48:.73,(r.w-.5)/(label.length*.62))}>{label}</Text><Text x={r.x+r.w/2} y={y+.9} size={small?.55:.75}>{r.w}' x {r.h}'</Text></g>
    })}</g>
    <g pointerEvents="none">
      {wallPaths.map(d=><path key={d} d={d} className="wall"/>)}
      {doors.map(([x,y,w,dir],i)=>{
        const horizontal=dir==='up'||dir==='down'
        const dx=dir==='left'?-w:dir==='right'?w:0,dy=dir==='up'?-w:dir==='down'?w:0
        return <g key={i}><line x1={x} y1={y} x2={horizontal?x+w:x} y2={horizontal?y:y+w} className="opening"/>
          <line x1={x} y1={y} x2={x+dx} y2={y+dy} className="door"/>
          <path d={horizontal?`M${x+w} ${y} A${w} ${w} 0 0 ${dir==='up'?0:1} ${x} ${y+dy}`:`M${x} ${y+w} A${w} ${w} 0 0 ${dir==='left'?1:0} ${x+dx} ${y}`} className="door"/>
        </g>
      })}
      {openings.map(([x1,y1,x2,y2],i)=><line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="opening"/>)}
      {windows.map(([x1,y1,x2,y2],i)=><g key={i}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} className="opening"/>
        <line x1={x1} y1={y1} x2={x2} y2={y2} className="window"/>
        {[-.1,.1].map(offset=><line key={offset} x1={x1+(x1===x2?offset:0)} y1={y1+(y1===y2?offset:0)} x2={x2+(x1===x2?offset:0)} y2={y2+(y1===y2?offset:0)} className="window"/>)}
      </g>)}
    </g>
    <g data-layer="reference-air" display={air?'inline':'none'} pointerEvents="none">
      {airPaths.map(d=><path key={d} d={d} className="air" markerEnd="url(#plan-arrow)"/>)}
      <Text x={31} y={21.7} size={.52}>AM SUN</Text>
      <circle cx="31" cy="20" r=".6" fill="#ffd46c" stroke="#d7a432" strokeWidth=".05"/>
      {Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return <line key={i} x1={31+Math.cos(a)*.85} y1={20+Math.sin(a)*.85} x2={31+Math.cos(a)*1.1} y2={20+Math.sin(a)*1.1} className="dimension"/>})}
      <Text x={-2} y={28} size={.42}>SHADE</Text>
      {[[.7,34.5],[.7,18.5],[.7,13.5],[26.3,45.9]].map(([x,y])=><g key={`${x}-${y}`}><circle cx={x} cy={y} r=".28" fill="#fff" stroke="#178ca2" strokeWidth=".07"/><Text x={x} y={y+.13} size={.36}>E</Text></g>)}
      {[7.5,27.5,40.3].map(y=><line key={y} x1="13.7" y1={y} x2="14.3" y2={y} className="air"/>)}
    </g>
    <g pointerEvents="none">
      <line x1="0" y1="-2" x2="27" y2="-2" className="dimension"/>
      {[0,27].map(x=><line key={x} x1={x} y1="-2.4" x2={x} y2="-.4" className="dimension"/>)}
      <Text x={13.5} y={-2.6} size={.65} cls="dim-label">27 ft / EAST - WEST</Text>
      <line x1="-2.7" y1="0" x2="-2.7" y2="53" className="dimension"/>
      {[0,53].map(y=><line key={y} x1="-3.1" y1={y} x2="-.4" y2={y} className="dimension"/>)}
      <text x="-3.3" y="26.5" transform="rotate(-90 -3.3 26.5)" className="dim-label">53 ft / NORTH - SOUTH</text>
      <line x1="0" y1="55" x2="27" y2="55" className="dimension"/>
      {[0,14,27].map(x=><line key={x} x1={x} y1="54.6" x2={x} y2="55.4" className="dimension"/>)}
      <Text x={7} y={56.2} size={.48} cls="dim-label">14' BEDROOM WING</Text><Text x={20.5} y={56.2} size={.48} cls="dim-label">13' OPEN EAST WING</Text>
      <line x1="28.5" y1="38" x2="28.5" y2="42" className="dimension"/>
      {[38,42].map(y=><line key={y} x1="28.2" y1={y} x2="28.8" y2={y} className="dimension"/>)}
      <Text x={31} y={40.3} size={.5} cls="dim-label">4' CLEAR GAP</Text><Text x={23.5} y={54.2} size={.4} cls="dim-label">KITCHEN EXIT</Text>
      <Text x={13.5} y={-.6} size={.52} cls="dim-label">NORTH</Text><Text x={13.5} y={57.5} size={.52} cls="dim-label">SOUTH</Text><Text x={-1} y={15} size={.6} cls="dim-label">W</Text>
      <path d="M30 3 V0 M29.5 .8 L30 0 L30.5 .8" className="dimension"/><Text x={30} y={-.7} size={.7} cls="dim-label">N</Text>
      <Text x={30} y={6.5} size={.55} cls="dim-label">NE ENTRY</Text><Text x={30} y={7.5} size={.43} cls="dim-label">EAST WALL</Text>
      <path d="M31 9 H28" className="air" markerEnd="url(#plan-arrow)"/>
      <line x1="1" y1="57.5" x2="11" y2="57.5" className="wall"/>
      {[1,6,11].map(x=><line key={x} x1={x} y1="57.2" x2={x} y2="57.8" className="dimension"/>)}
      <Text x={6} y={58.6} size={.43} cls="dim-label">0             5            10 ft</Text>
    </g>
  </svg>
}
