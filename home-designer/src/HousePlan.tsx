import { doors, openings, rooms, wallPath, windows } from './plan'
import type { Room } from './plan'

export default function HousePlan({ onRoom }: { onRoom: (room: Room)=>void }) {
  return <svg className="house-plan" viewBox="-4 -4 37 62" aria-label="Design C: 27 by 53 feet. Select a room to design it.">
    <text x="13.5" y="-2" textAnchor="middle" className="overall">27 ft EAST - WEST · NORTH ↑</text>
    <text transform="translate(-2 26.5) rotate(-90)" textAnchor="middle" className="overall">53 ft NORTH - SOUTH</text>
    {rooms.map(r=><g key={r.id} role="button" tabIndex={0} aria-label={`${r.name}, ${r.w} by ${r.h} feet`} onClick={()=>onRoom(r)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onRoom(r)}}} className="plan-room">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={r.color}/>
      <text x={r.x+r.w/2} y={r.y+r.h/2-.15} textAnchor="middle" fontSize={Math.min(.65,r.w/r.name.length*1.5)}>{r.name}</text>
      <text x={r.x+r.w/2} y={r.y+r.h/2+.8} textAnchor="middle" fontSize=".5">{r.w}' × {r.h}'</text>
    </g>)}
    <g pointerEvents="none">
      <path d={wallPath} fill="none" stroke="#385550" strokeWidth=".18"/>
      {openings.map(([x1,y1,x2,y2],i)=><line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fffefa" strokeWidth=".28"/>)}
      {doors.map(([x,y,w,dir],i)=>{
        const horizontal=dir==='up'||dir==='down'
        const dx=dir==='left'?-w:dir==='right'?w:0,dy=dir==='up'?-w:dir==='down'?w:0
        return <g key={i}><line x1={x} y1={y} x2={horizontal?x+w:x} y2={horizontal?y:y+w} stroke="#fffefa" strokeWidth=".28"/>
          <path d={horizontal?`M${x} ${y} v${dy} M${x+w} ${y} A${w} ${w} 0 0 ${dir==='up'?0:1} ${x} ${y+dy}`:`M${x} ${y} h${dx} M${x} ${y+w} A${w} ${w} 0 0 ${dir==='left'?1:0} ${x+dx} ${y}`} fill="none" stroke="#ae8654" strokeWidth=".07"/>
        </g>
      })}
      {windows.map(([x1,y1,x2,y2],i)=><line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2698b1" strokeWidth=".16"/>)}
      <text x="28" y="7" fontSize=".5">NE entry</text>
      <text x="23.5" y="54.3" fontSize=".5" textAnchor="middle">South exit</text>
      <text x="13.5" y="56.5" textAnchor="middle" className="overall">SOUTH · 1,431 sq ft · Nominal dimensions</text>
    </g>
  </svg>
}
