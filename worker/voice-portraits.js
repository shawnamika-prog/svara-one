const PORTRAITS={
 en:{name:'Thalia',skin:'#d39a78',hair:'#241b1b',shirt:'#163a59',accent:'#31d7c1',hairStyle:'long'},
 es:{name:'Celeste',skin:'#c98b68',hair:'#2a1b18',shirt:'#4b245f',accent:'#2fe0c5',hairStyle:'wavy'},
 de:{name:'Julius',skin:'#e2ae8d',hair:'#5a3824',shirt:'#1e3d57',accent:'#58b8ff',hairStyle:'short'},
 fr:{name:'Agathe',skin:'#e4b090',hair:'#39251f',shirt:'#2b304f',accent:'#35dec5',hairStyle:'bob'},
 nl:{name:'Rhea',skin:'#dca17d',hair:'#7a4c2d',shirt:'#31514a',accent:'#52d9c4',hairStyle:'wavy'},
 it:{name:'Livia',skin:'#c98d6c',hair:'#211817',shirt:'#54314d',accent:'#4ab8ff',hairStyle:'long'},
 ja:{name:'Izanami',skin:'#f0c2a8',hair:'#17191f',shirt:'#233c5b',accent:'#35dec5',hairStyle:'long'}
};

function escapeXml(value){return String(value).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&apos;'}[m]));}

export function getPortrait(code){
 const p=PORTRAITS[code];
 if(!p)return null;
 const hairBack=p.hairStyle==='short'?`<path d="M82 96c0-47 22-72 68-72s68 25 68 72v39H82z" fill="${p.hair}"/>`:`<path d="M68 118c-1-61 25-96 82-96 52 0 82 32 82 96v74H68z" fill="${p.hair}"/>`;
 const hairFront=p.hairStyle==='bob'?`<path d="M75 111c4-48 28-78 75-78 43 0 70 26 75 78l-22-16-7-31c-14 17-35 25-64 24-18 0-34-5-47-15l-2 29z" fill="${p.hair}"/>`:p.hairStyle==='short'?`<path d="M82 101c4-38 25-62 69-62 34 0 59 17 68 50l-21-11c-16 14-35 19-60 17-20-2-37-7-52-18z" fill="${p.hair}"/>`:`<path d="M73 111c5-49 31-78 77-78 45 0 70 27 77 78l-18-13-12-39c-17 22-39 31-67 29-21-1-38-8-52-22l-4 45z" fill="${p.hair}"/>`;
 const beard=p.hairStyle==='short'?`<path d="M119 161c8 19 21 28 31 28 11 0 25-9 32-28-11 7-21 10-32 10-11 0-21-3-31-10z" fill="#51382b" opacity=".75"/>`:'';
 return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" role="img" aria-label="${escapeXml(p.name)} voice portrait"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0c2034"/><stop offset="1" stop-color="#081321"/></linearGradient><radialGradient id="glow"><stop stop-color="${p.accent}" stop-opacity=".22"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient></defs><rect width="300" height="300" rx="150" fill="url(#bg)"/><circle cx="230" cy="70" r="105" fill="url(#glow)"/><path d="M54 300c9-58 45-86 96-86s87 28 96 86z" fill="${p.shirt}"/><path d="M125 211l25 25 25-25 12 11c-9 21-23 33-37 33s-28-12-37-33z" fill="${p.skin}"/><path d="M103 112c0-45 22-70 47-70s47 25 47 70v49c0 34-21 55-47 55s-47-21-47-55z" fill="${p.skin}"/>${hairBack}<path d="M106 112c2-17 6-31 16-42 11-12 25-18 43-18 20 0 35 7 46 20 8 10 12 23 13 40-14-5-27-14-38-28-10 14-26 24-47 29-13 3-24 3-33-1z" fill="${p.hair}" opacity=".96"/>${hairFront}<ellipse cx="132" cy="126" rx="5" ry="4" fill="#17202c"/><ellipse cx="168" cy="126" rx="5" ry="4" fill="#17202c"/><path d="M139 159c7 5 15 5 22 0" fill="none" stroke="#8a4f4a" stroke-width="4" stroke-linecap="round"/>${beard}<circle cx="44" cy="44" r="8" fill="${p.accent}"/><circle cx="44" cy="44" r="15" fill="none" stroke="${p.accent}" stroke-opacity=".25" stroke-width="2"/></svg>`;
}

export const PORTRAIT_CODES=Object.keys(PORTRAITS);
