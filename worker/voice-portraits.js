const BASE={
 en:{name:'Thalia',skin:'#b9785d',hair:'#2a1c1a',shirt:'#173b5c',accent:'#31d7c1',style:'long'},
 es:{name:'Celeste',skin:'#b96f4e',hair:'#241817',shirt:'#4a285f',accent:'#31dfc5',style:'wavy'},
 de:{name:'Julius',skin:'#d7a07d',hair:'#6b432c',shirt:'#183c57',accent:'#5ab9ff',style:'short'},
 fr:{name:'Agathe',skin:'#d9a084',hair:'#39251f',shirt:'#343153',accent:'#35dec5',style:'bob'},
 nl:{name:'Rhea',skin:'#c88462',hair:'#70452c',shirt:'#31524c',accent:'#4dd9c5',style:'wavy'},
 it:{name:'Livia',skin:'#b97659',hair:'#211817',shirt:'#56304d',accent:'#4bbcff',style:'long'},
 ja:{name:'Izanami',skin:'#e6b39d',hair:'#171a22',shirt:'#243e61',accent:'#35dec5',style:'long'}
};
const PORTRAITS=Object.fromEntries(Object.entries(BASE).flatMap(([code,p])=>[[code,p],[`${code}-v2`,p]]));

function esc(v){return String(v).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&apos;'}[m]));}

export function getPortrait(code){
 const p=PORTRAITS[code]; if(!p)return null;
 const hairBack=p.style==='short'
  ? `<path d="M82 118C78 65 106 25 151 25c45 0 72 33 68 91v57H82z" fill="${p.hair}"/>`
  : `<path d="M68 130C65 65 99 22 151 22c56 0 88 40 81 111l-3 87H71z" fill="${p.hair}"/>`;
 const front=p.style==='bob'
  ? `<path d="M78 123c5-59 33-91 76-91 42 0 68 30 73 88l-18-16-8-42c-17 19-39 28-66 28-22 0-40-6-53-18l-4 51z" fill="${p.hair}"/>`
  : p.style==='short'
  ? `<path d="M82 113c4-47 30-72 69-72 38 0 63 23 69 65l-24-13c-15 12-34 18-56 18-22 0-40-6-58-19z" fill="${p.hair}"/>`
  : `<path d="M73 123c5-58 34-91 78-91 44 0 70 31 76 90l-20-18-12-43c-17 21-40 30-68 30-21 0-39-7-53-21l-5 53z" fill="${p.hair}"/>`;
 const waves=p.style==='wavy'?`<path d="M74 93c-12 20-15 47-9 79l18 20 5-62-14-37zM226 93c12 20 15 47 9 79l-18 20-5-62 14-37z" fill="${p.hair}"/>`:'';
 const beard=p.style==='short'?`<path d="M115 166c8 18 20 28 36 28 16 0 28-10 35-28-10 7-22 10-35 10s-25-3-36-10z" fill="#55382c" opacity=".72"/>`:'';
 return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img" aria-label="${esc(p.name)} voice portrait"><defs><radialGradient id="bg"><stop stop-color="#17344b"/><stop offset="1" stop-color="#071421"/></radialGradient><radialGradient id="light"><stop stop-color="${p.accent}" stop-opacity=".24"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient><linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${p.skin}"/><stop offset="1" stop-color="#8e5748"/></linearGradient><linearGradient id="shirt" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${p.shirt}"/><stop offset="1" stop-color="#081321"/></linearGradient><filter id="soft"><feGaussianBlur stdDeviation="9"/></filter></defs><rect width="320" height="320" rx="160" fill="url(#bg)"/><circle cx="245" cy="65" r="120" fill="url(#light)"/><ellipse cx="160" cy="305" rx="105" ry="28" fill="#000" opacity=".24" filter="url(#soft)"/><path d="M52 320c10-69 49-103 108-103s98 34 108 103z" fill="url(#shirt)"/><path d="M129 208l31 29 31-29 16 17c-11 25-28 39-47 39s-36-14-47-39z" fill="url(#skin)"/>${hairBack}<path d="M101 112c0-48 26-76 59-76s59 28 59 76v55c0 38-26 63-59 63s-59-25-59-63z" fill="url(#skin)"/>${waves}${front}<ellipse cx="137" cy="130" rx="6" ry="4.5" fill="#182330"/><ellipse cx="183" cy="130" rx="6" ry="4.5" fill="#182330"/><path d="M123 115c9-6 18-7 27-3M170 112c10-4 19-3 27 3" fill="none" stroke="#4a2d29" stroke-width="4" stroke-linecap="round" opacity=".65"/><path d="M160 134c-2 10-5 18-2 22 3 2 7 2 10 0" fill="none" stroke="#875246" stroke-width="3" stroke-linecap="round"/><path d="M144 169c10 8 22 8 32 0" fill="none" stroke="#7d403d" stroke-width="4" stroke-linecap="round"/>${beard}<circle cx="46" cy="48" r="7" fill="${p.accent}"/><circle cx="46" cy="48" r="14" fill="none" stroke="${p.accent}" stroke-opacity=".28" stroke-width="2"/></svg>`;
}

export const PORTRAIT_CODES=Object.keys(BASE);
