import { useState } from 'react'
import type { ReactNode } from 'react'
import HousePlan from './HousePlan'
import { planLabels, rooms } from './plan'
import type { Room } from './plan'

export default function HomePage({onRoom,controls}:{onRoom:(room:Room)=>void;controls:ReactNode}) {
  const [furniture,setFurniture]=useState(true)
  const [air,setAir]=useState(true)
  return <>
    <section className="home-studio-actions" aria-label="Interior studio tools">{controls}</section>
    <section className="home-card home-plan" aria-label="Interactive floor plan">
      <div className="home-toolbar"><span className="active-layout">C · East living / west bedrooms</span><button onClick={()=>window.print()}>Print / Save PDF</button></div>
      <div className="home-tools"><label><input type="checkbox" checked={furniture} onChange={e=>setFurniture(e.target.checked)}/>Furniture</label><label><input type="checkbox" checked={air} onChange={e=>setAir(e.target.checked)}/>Airflow / daylight</label><span>Click a room to design it ↗</span></div>
      <HousePlan onRoom={onRoom} furniture={furniture} air={air}/>
      <div className="home-caption"><strong>Layout C (27' x 53'): open kitchen, shortened to 13' x 11', has a door in its south wall to the outside. Puja sits northeast of the kitchen with a 4 ft furniture-free gap. Bedroom 2's bath and dressing room are on its south side, next to the common bath and lobby. The master has its own entrance from the open area. Two bathrooms are attached and one is common.</strong> Blue = windows; brown = door swings; E = exhaust provision. All dimensions are nominal planning zones, measured on wall lines, not finished clear dimensions. Walls are schematic; a scaled wall-thickness design will reduce usable room sizes.</div>
    </section>
    <aside className="home-sidebar">
      <section className="home-card home-panel">
        <h2>A genuinely larger master</h2>
        <div className="home-highlight"><span>Sleeping area only</span><strong>14 ft × 16 ft</strong><p>224 sq ft, plus a 7 × 5 ft attached bath and a separate 7 × 5 ft dressing area.</p></div>
        <p>The bathroom and dressing area do not take space from the quoted bedroom size.</p>
        <p>In Design C, the master has its own door from the open living/dining area, next to the 4 ft gap, and a separate opening to its dressing room.</p>
        <table aria-label="Room dimensions"><thead><tr><th>Space</th><th>Nominal size</th></tr></thead><tbody>{rooms.filter(r=>r.id!=='link').map(r=><tr key={r.id}><td><button className="schedule-room" aria-label={`Open ${r.name}`} onClick={()=>onRoom(r)}>{planLabels[r.id]}</button></td><td>{r.w}' x {r.h}'</td></tr>)}</tbody></table>
      </section>
      <section className="home-card home-panel">
        <h2>Light &amp; ventilation</h2>
        <ul>
          <li><strong>Southeast kitchen:</strong> east and south windows for daylight and potential cross-ventilation, plus an exterior-wall exhaust point near the cooktop. The kitchen is open to the dining area and has a south door to the outside (service yard / wash area), giving a second air path and easy waste and delivery access. There is no separate passage.</li>
          <li><strong>Master:</strong> south and west windows for potential cross-ventilation.</li>
          <li><strong>Bedrooms 2 and 3:</strong> both have west windows; shade them and use high-level openable transoms above their doors to the open living/dining area as secondary air paths when appropriate for privacy.</li>
          <li><strong>All three bathrooms:</strong> high-level exterior ventilators and provision for mechanical exhaust. Have a professional verify discharge locations and separation from windows.</li>
          <li><strong>Open living / dining:</strong> the eastern rooms are one open space. Puja has an east window north of the kitchen; keep the 4 ft space between them free of furniture. The laundry nook needs a transfer opening or mechanical ventilation.</li>
        </ul>
        <p>Arrows show possible air paths, not a wind study. Actual sun, airflow and shading depend on location, season and neighbouring buildings.</p>
        <div className="home-legend">{[['#dcebf6','Bedrooms'],['#d8f0ed','Bathrooms'],['#fce6cb','Kitchen'],['#e3edda','Living / dining'],['#fff0bc','Puja'],['#179bb5','Blue = windows']].map(([color,label])=><span key={label}><i style={{background:color}}/>{label}</span>)}</div>
      </section>
      <section className="home-card home-panel">
        <h2>Make it yours</h2>
        <p>Click a room or use Tab and Enter to open its floor, wall and ceiling editors. Add, drag and rotate cupboards, cabinets, fans and lights, or explore the whole house in 3D.</p>
        <div className="home-heights"><strong>11 ft</strong> structural height · <strong>9.5 ft</strong> finished ceiling after the 1.5 ft false-ceiling drop.</div>
        <p>The furniture on this home plan matches the original schematic illustration. Your saved interior objects and their visibility are shown in the room editors and 3D views.</p>
      </section>
      <section className="home-card home-panel home-notice">
        <h2>Before building</h2>
        <p>Design C is drawn on 27 ft east-west × 53 ft north-south (1,431 sq ft), assumed to be <strong>buildable footprint</strong>, with open space outside the walls and east-side access at the northeast end. No parking, stairs or setbacks are allocated within it.</p>
        <p>This is a concept, not a sanctioned or construction drawing. A local architect / engineer must resolve wall thickness, clearances, structure, drainage, waterproofing, ventilation, shading, setbacks and local building rules. Not a Vastu-certified layout.</p>
      </section>
    </aside>
  </>
}
