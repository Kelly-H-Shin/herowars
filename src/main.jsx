import React, { useMemo, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Shield, Swords, Users, Sparkles, RotateCcw, Save, Info, ChevronDown, X, Activity, Target, AlertTriangle, BookOpen } from 'lucide-react';
import heroesData from './data/heroes.json';
import './style.css';

const FACTIONS = [
  ['ALL','전체'],['Mystery','신비의 길'],['Progress','진보의 길'],['Chaos','혼돈의 길'],['Eternity','영원의 길'],['Nature','자연의 길'],['Honor','명예의 길']
];
const ROLES = ['전체','탱커','전사','사수','마법 딜러','힐러','지원','제어','확인 필요'];
const STORAGE_KEY='hwa-team-analyzer-v1';
const blankGrowth = () => ({level:0,stars:0,rank:'미설정',skin:0,glyph:0,artifact:0,legendary:0,spark:0});
function loadInitial(){ try { const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'); return {my:x.my||[],enemy:x.enemy||[],growth:x.growth||{}}; } catch { return {my:[],enemy:[],growth:{}}; } }
const factionMap=Object.fromEntries(FACTIONS);
function App(){
 const [initial]=useState(loadInitial);
 const [my,setMy]=useState(initial.my); const [enemy,setEnemy]=useState(initial.enemy);
 const [growth,setGrowth]=useState(initial.growth); const [target,setTarget]=useState('my');
 const [search,setSearch]=useState(''); const [faction,setFaction]=useState('ALL'); const [role,setRole]=useState('전체');
 const [active,setActive]=useState(null); const [result,setResult]=useState(null); const [presetName,setPresetName]=useState('');
 const heroes=heroesData;
 useEffect(()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify({my,enemy,growth}));},[my,enemy,growth]);
 const filtered=useMemo(()=>heroes.filter(h=>(faction==='ALL'||h.faction===faction)&&(role==='전체'||h.roleKo===role)&&(h.name.toLowerCase().includes(search.toLowerCase())||h.id.toLowerCase().includes(search.toLowerCase()))),[heroes,search,faction,role]);
 const addHero=(h)=>{ const own=target==='my'?my:enemy, other=target==='my'?enemy:my; if(own.includes(h.id)||other.includes(h.id))return; if(own.length>=5)return; target==='my'?setMy([...my,h.id]):setEnemy([...enemy,h.id]); setResult(null); };
 const removeHero=(side,id)=>{side==='my'?setMy(my.filter(x=>x!==id)):setEnemy(enemy.filter(x=>x!==id));setResult(null)};
 const getHero=id=>heroes.find(h=>h.id===id);
 const setHeroGrowth=(id,key,val)=>setGrowth(old=>({...old,[id]:{...blankGrowth(),...(old[id]||{}),[key]:Number(val)}}));
 const reset=()=>{if(confirm('팀 구성과 성장 설정을 초기화할까요?')){setMy([]);setEnemy([]);setGrowth({});setResult(null)}};
 const loadPreset=(key)=>{const presets={mystery:{my:['folio','celeste','amira','satori','martha'],enemy:['isaac','julius','judge','orion','sebastian']},progress:{my:['julius','isaac','judge','ginger','orion'],enemy:['corvus','morrigan','dante','iris','octavia']},honor:{my:['galahad','tristan','artemis','helios','fafnir'],enemy:['astaroth','kayla','aidan','cleaver','peppy']},chaos:{my:['astaroth','kayla','aidan','cleaver','peppy'],enemy:['corvus','morrigan','iris','octavia','dante']},eternity:{my:['corvus','morrigan','dante','iris','octavia'],enemy:['julius','isaac','judge','ginger','orion']},nature:{my:['aurora','alvanor','mojo','yasmine','mushy_shroom'],enemy:['galahad','tristan','artemis','helios','fafnir']}};let p=presets[key];setMy(p.my);setEnemy(p.enemy);setTarget('my');setResult(null)};
 const getTags=ids=>ids.flatMap(id=>getHero(id)?.tags||[]);
 function analyze(){
  if(my.length!==5||enemy.length!==5){alert('아군과 상대 덱에 각각 영웅 5명을 선택해 주세요.');return;}
  const a=my.map(getHero), b=enemy.map(getHero), tagsA=getTags(my),tagsB=getTags(enemy); let synergy=0,counter=0,logs=[],risks=[];
  const factionCounts={}; a.forEach(h=>factionCounts[h.faction]=(factionCounts[h.faction]||0)+1);
  Object.entries(factionCounts).forEach(([f,n])=>{if(n>=3){const p=n>=4?22:15;synergy+=p;logs.push(`${factionMap[f]} ${n}명 구성: 진영 집중도 가점 +${p}`)}});
  if(tagsA.includes('Physical_DPS')&&my.some(id=>['tristan','sebastian','fafnir'].includes(id))){synergy+=12;logs.push('물리 딜러와 지원 영웅 조합 감지 +12 (일반 규칙)')}
  if(my.includes('kayla')&&my.includes('aidan')){synergy+=15;logs.push('케일라 + 에이단 조합 규칙 +15')}
  if(my.includes('cleaver')&&my.includes('peppy')){synergy+=10;logs.push('클리버 + 페피 조합 규칙 +10')}
  if(my.includes('corvus')&&my.includes('morrigan')&&my.includes('octavia')){synergy+=15;logs.push('코르부스 + 모리간 + 옥타비아 조합 규칙 +15')}
  if(tagsB.includes('Magic_DPS')&&my.includes('isaac')){counter+=22;logs.push('상대 마법 딜러 태그 + 아이작: 대응 규칙 +22')}
  if(tagsB.includes('Buff_Crit')&&my.includes('helios')){counter+=18;logs.push('상대 치명타 태그 + 헬리오스: 대응 규칙 +18')}
  if((enemy.includes('dante')||enemy.includes('octavia'))&&!my.includes('cornelius')&&!my.includes('heidi')){counter-=10;risks.push('상대 회피 중심 조합에 대한 직접 대응 영웅이 확인되지 않음 (임시 규칙)')}
  const growthScore=ids=>ids.reduce((sum,id)=>{const g={...blankGrowth(),...(growth[id]||{})};return sum+g.stars*0.7+g.skin*0.03+g.glyph*0.04+g.artifact*0.04+g.legendary*0.04+g.spark*0.03+g.level*0.02},0);
  const ga=growthScore(my),gb=growthScore(enemy); const growthDiff=Math.max(-12,Math.min(12,(ga-gb)*0.35));
  const raw=50+(synergy+counter)*0.35+growthDiff; const estimate=Math.max(10,Math.min(90,Math.round(raw)));
  setResult({estimate,synergy,counter,growthDiff,logs,risks,confidence:'낮음',warning:'규칙 기반 참고 점수입니다. 검증된 게임 전투 공식이나 실측 승률이 아닙니다.'});
 }
 const sidePanel=(side,ids)=> <section className={`team-panel ${side==='my'?'blue':'red'}`}><div className="panel-head"><div><div className="eyebrow">{side==='my'?'YOUR TEAM':'ENEMY TEAM'}</div><h2>{side==='my'?'아군 덱':'상대 덱'} <span>{ids.length}/5</span></h2></div><button className={target===side?'selected':''} onClick={()=>setTarget(side)}>영웅 선택 대상</button></div><div className="slots">{Array.from({length:5},(_,i)=>{const id=ids[i],h=id?getHero(id):null;return <div className={`slot ${h?'filled':''}`} key={i}>{h?<><button className="remove" onClick={()=>removeHero(side,id)} title="제거"><X size={14}/></button><div className="hero-symbol">{h.name.slice(0,1)}</div><b>{h.name}</b><small>{h.factionKo}</small><button className="detail-link" onClick={()=>setActive(h)}>상세 / 강화</button></>:<><span className="slot-num">{i+1}</span><span>영웅 선택</span></>}</div>})}</div><div className="faction-counts">{Object.entries(ids.reduce((o,id)=>{const f=getHero(id)?.factionKo;if(f)o[f]=(o[f]||0)+1;return o},{})).map(([f,n])=><span key={f}>{f} {n}</span>)}</div></section>;
 return <div className="app-shell"><header><div className="brand-mark">HW</div><div className="brand"><div className="eyebrow">ALLIANCE · TEAM BUILDER</div><h1>Hero Wars <span>팀 분석기</span></h1><p>5인 덱 구성 · 시너지 · 상성 비교</p></div><button className="icon-button" onClick={reset} title="초기화"><RotateCcw/></button></header>
 <main><section className="intro"><div><h2>덱을 구성하고 상대 조합을 분석하세요</h2><p>영웅을 선택한 뒤 분석을 실행하면 규칙별 가점과 위험 요소를 확인할 수 있습니다.</p></div><div className="warning-chip"><AlertTriangle size={16}/> 초기 데이터 · 분석 규칙 검증 중</div></section>
 <section className="preset-row"><span>빠른 팀 구성</span>{[['mystery','신비'],['progress','진보'],['honor','명예'],['chaos','혼돈'],['eternity','영원'],['nature','자연']].map(([k,l])=><button key={k} onClick={()=>loadPreset(k)}>{l} 프리셋</button>)}</section>
 <div className="teams-grid">{sidePanel('my',my)}<div className="versus"><div className="vs-circle">VS</div><button className="analyze-btn" onClick={analyze}><Activity size={17}/> 덱 분석 실행</button><p>두 팀 각 5명 필요</p></div>{sidePanel('enemy',enemy)}</div>
 <section className="picker-section"><div className="section-heading"><div><div className="eyebrow">HERO DATABASE</div><h2>영웅 선택 <span className="count-pill">{heroes.length}명 목록</span></h2></div><div className="target-toggle"><button className={target==='my'?'active':''} onClick={()=>setTarget('my')}>아군에 추가</button><button className={target==='enemy'?'active':''} onClick={()=>setTarget('enemy')}>상대에 추가</button></div></div>
 <div className="search-row"><label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="영웅 이름 검색"/></label><select value={faction} onChange={e=>setFaction(e.target.value)}>{FACTIONS.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select><select value={role} onChange={e=>setRole(e.target.value)}>{ROLES.map(x=><option key={x}>{x}</option>)}</select></div>
 <div className="hero-grid">{filtered.map(h=>{const chosen=my.includes(h.id)||enemy.includes(h.id);return <button className={`hero-card ${chosen?'chosen':''}`} key={h.id} onClick={()=>addHero(h)} disabled={chosen||(target==='my'?my:enemy).length>=5}><span className="hero-avatar">{h.name.slice(0,1)}</span><b>{h.name}</b><small>{h.roleKo}</small><span className={`faction-dot ${h.faction.toLowerCase()}`}></span><em>{h.factionKo}</em></button>})}</div><p className="database-note"><Info size={14}/> 일부 영웅 이름·분류는 확인이 필요하며, 스킬과 능력치 데이터는 검증 후 입력합니다. 선택 중인 팀은 브라우저에 자동 저장됩니다.</p></section>
 {result&&<section className="results"><div className="section-heading"><div><div className="eyebrow">MATCHUP REPORT</div><h2>분석 결과</h2></div><span className="confidence"><AlertTriangle size={14}/> 신뢰도: {result.confidence}</span></div><div className="result-grid"><div className="win-card"><span>아군 우세 지표</span><strong>{result.estimate}<small>/100</small></strong><div className="meter"><i style={{width:`${result.estimate}%`}}/></div><p>실제 승률이 아닌 규칙 기반 점수</p></div><div className="metric-card"><Sparkles/><span>시너지 점수</span><b>{result.synergy}</b></div><div className="metric-card"><Target/><span>상성 점수</span><b>{result.counter>0?'+':''}{result.counter}</b></div><div className="metric-card"><Activity/><span>성장 차이 보정</span><b>{result.growthDiff>0?'+':''}{result.growthDiff.toFixed(1)}</b></div></div><div className="report-columns"><div className="report-card"><h3><BookOpen size={17}/> 점수 산출 근거</h3>{result.logs.length?result.logs.map((x,i)=><p key={i}>• {x}</p>):<p>현재 감지된 명시적 시너지 규칙이 없습니다.</p>}</div><div className="report-card risk"><h3><AlertTriangle size={17}/> 위험 요소 및 한계</h3>{result.risks.length?result.risks.map((x,i)=><p key={i}>• {x}</p>):<p>현재 임시 규칙에서 확인된 위험 항목이 없습니다. 이는 위험이 없다는 뜻은 아닙니다.</p>}<p className="fine-print">{result.warning}</p></div></div></section>}
 <footer><span>Hero Wars: Alliance Team Analyzer · Prototype v0.1</span><span>데이터 검증 및 전투 결과 보정 필요</span></footer></main>
 {active&&<div className="modal-backdrop" onClick={()=>setActive(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setActive(null)}><X/></button><div className="eyebrow">HERO DETAILS</div><h2>{active.name}</h2><p>{active.factionKo} · {active.roleKo}</p><div className="data-status"><Info size={15}/> {active.dataStatus}</div><p className="modal-description">현재 제공된 자료만으로 검증된 스킬 계수와 능력치가 확인되지 않아 임의의 수치를 표시하지 않습니다. 아래 강화 단계는 사용자가 입력한 상대적 설정값을 비교 지표에 반영합니다.</p><div className="growth-grid">{[['level','레벨',120],['stars','별 등급',6],['skin','스킨 강화',100],['glyph','글리프 강화',100],['artifact','일반 유물',100],['legendary','전설 유물',100],['spark','힘의 불꽃',100]].map(([key,label,max])=><label key={key}>{label}<input type="number" min="0" max={max} value={(growth[active.id]||blankGrowth())[key]||0} onChange={e=>setHeroGrowth(active.id,key,Math.min(max,Math.max(0,e.target.value)))}/></label>)}</div><div className="modal-footer"><button onClick={()=>setActive(null)}>저장하고 닫기</button></div></div></div>}
 </div>
}

createRoot(document.getElementById('root')).render(<App/>);
