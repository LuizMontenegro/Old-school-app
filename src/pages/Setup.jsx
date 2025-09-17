import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PREF_KEY = 'osg.prefs.v1';
const EXS_KEY = 'osg.exercises.v3';
const ONB_KEY = 'osg.onboard.v1';

const LIB = [
  {name:'Supino reto', group:'Peito', color:'#ef4444'},
  {name:'Puxada frente', group:'Costas', color:'#22d3ee'},
  {name:'Agachamento livre', group:'Pernas', color:'#a3e635'},
  {name:'Leg press', group:'Pernas', color:'#84cc16'},
  {name:'Desenvolvimento militar', group:'Ombros', color:'#f43f5e'},
  {name:'Rosca direta', group:'Bíceps', color:'#a855f7'},
  {name:'Tríceps corda', group:'Tríceps', color:'#f9a8d4'},
  {name:'Abdominal máquina', group:'Core', color:'#14b8a6'},
];

function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36) }
function svgPlaceholder(text, c1='#ef4444'){
  const initials = text.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='#f59e0b'/></linearGradient></defs>
      <rect width='100%' height='100%' rx='24' fill='#0b0b0c'/>
      <rect x='12' y='12' width='232' height='232' rx='20' fill='url(#g)' opacity='0.2' stroke='${c1}' stroke-opacity='0.5'/>
      <text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Oswald, Arial' font-size='88' fill='white' fill-opacity='0.9'>${initials}</text>
    </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
function savePrefs(p){ localStorage.setItem(PREF_KEY, JSON.stringify(p)) }
function saveExercises(list){ localStorage.setItem(EXS_KEY, JSON.stringify(list)) }
function markOnboardDone(){ localStorage.setItem(ONB_KEY, JSON.stringify(true)) }

function pickSeeds(favs){
  const pool = favs && favs.length ? LIB.filter(x=> favs.includes(x.group)) : LIB;
  const arr = [...pool];
  for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr.slice(0, Math.min(3, arr.length));
}

export default function Setup(){
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [prefs, setPrefs] = useState({ unit:'kg', goals:[], favGroups:[], profileName:'' });
  const [seed, setSeed] = useState(true);

  const progress = useMemo(()=>({1:25,2:60,3:90,4:100})[step]||0, [step]);

  function toggle(arrName, value){
    setPrefs(prev=>{
      const arr = new Set(prev[arrName]);
      if(arr.has(value)) arr.delete(value); else arr.add(value);
      return { ...prev, [arrName]: Array.from(arr) };
    });
  }

  function finish(){
    const payload = { contrast:false, large:false, ...prefs };
    savePrefs(payload);
    const list = [];
    if(seed){
      const picked = pickSeeds(prefs.favGroups);
      const now = Date.now();
      picked.forEach(s=>{
        list.push({ id:uid(), name:s.name, group:s.group, photo:svgPlaceholder(s.name, s.color), plan:'linear', history:[], createdAt: now });
      });
    }
    saveExercises(list);
    markOnboardDone();
    setStep(4);
  }

  function restart(){
    setPrefs({ unit:'kg', goals:[], favGroups:[], profileName:'' });
    setSeed(true);
    setStep(1);
  }

  return (
    <div className="grid-lines flex items-center justify-center p-5">
      <main className="w-full max-w-3xl">
        <header className="flex items-center justify-center gap-3 mb-6">
          <span className="kettlebell" aria-hidden="true" style={{ width:40, height:40, display:'inline-block' }}>
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ef4444"/><stop offset="1" stopColor="#f59e0b"/></linearGradient></defs>
              <path d="M18 26a14 14 0 1 1 28 0v6H18v-6z" stroke="url(#g1)" strokeWidth="4"/>
              <rect x="10" y="30" width="44" height="28" rx="12" fill="url(#g1)" opacity=".18" stroke="#ef4444" strokeWidth="2"/>
              <circle cx="20" cy="44" r="6" fill="#ef4444" opacity=".6"/>
              <circle cx="44" cy="44" r="6" fill="#f59e0b" opacity=".6"/>
            </svg>
          </span>
          <div className="text-center">
            <h1 className="title-font text-4xl md:text-5xl text-white tracking-wide">OLD SCHOOL GYM</h1>
            <p className="text-sm text-gray-400 -mt-1">Configuração Inicial • Preferências • Seed data</p>
          </div>
        </header>

        <section className="card p-5 md:p-7">
          <div className="progress-bar mb-6"><div className="progress-fill" style={{ width: progress + '%' }}></div></div>

          <div className="space-y-6">
            {step===1 && (
              <div className="step-enter step-show">
                <h2 className="title-font text-2xl mb-2">1) Como você quer ver os pesos?</h2>
                <p className="text-gray-400 text-sm mb-4">Escolha a unidade preferida. Você pode mudar depois.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="chip flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer hover:bg-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⚖️</span>
                      <div>
                        <div className="text-gray-100">Quilogramas (kg)</div>
                        <div className="text-xs text-gray-400">Padrão no Brasil</div>
                      </div>
                    </div>
                    <input type="radio" name="unit" value="kg" className="accent-yellow-400" checked={prefs.unit==='kg'} onChange={()=> setPrefs(p=>({...p, unit:'kg'}))} />
                  </label>
                  <label className="chip flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer hover:bg-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🏋️</span>
                      <div>
                        <div className="text-gray-100">Libras (lb)</div>
                        <div className="text-xs text-gray-400">Com equivalência em kg</div>
                      </div>
                    </div>
                    <input type="radio" name="unit" value="lb" className="accent-yellow-400" checked={prefs.unit==='lb'} onChange={()=> setPrefs(p=>({...p, unit:'lb'}))} />
                  </label>
                </div>
                <div className="mt-5 flex items-center justify-end">
                  <button id="next1" className="btn bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-md" onClick={()=> setStep(2)}>Próximo</button>
                </div>
              </div>
            )}

            {step===2 && (
              <div className="step-enter step-show">
                <h2 className="title-font text-2xl mb-2">2) Seus objetivos</h2>
                <p className="text-gray-400 text-sm mb-4">Escolha um ou mais objetivos.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['força','hipertrofia','resistência'].map(goal=> (
                    <button key={goal} className={`btn chip px-3 py-2 rounded ${prefs.goals.includes(goal)?'ring-glow':''}`} onClick={()=> toggle('goals', goal)} type="button" data-goal={goal}>
                      {goal.charAt(0).toUpperCase()+goal.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <button className="btn px-5 py-2 rounded-md border border-gray-600/60 text-gray-200 hover:bg-white/5" onClick={()=> setStep(1)} data-prev="2">Voltar</button>
                  <button className="btn bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-md" onClick={()=> setStep(3)} data-next="2">Próximo</button>
                </div>
              </div>
            )}

            {step===3 && (
              <div className="step-enter step-show">
                <h2 className="title-font text-2xl mb-2">3) Seus grupos favoritos</h2>
                <p className="text-gray-400 text-sm mb-4">Usaremos isso pra sugerir seus primeiros aparelhos.</p>
                <div className="flex flex-wrap gap-2">
                  {['Peito','Costas','Pernas','Ombros','Bíceps','Tríceps','Core'].map(group=> (
                    <button key={group} className={`btn chip px-3 py-2 rounded ${prefs.favGroups.includes(group)?'ring-glow':''}`} type="button" onClick={()=> toggle('favGroups', group)} data-group={group}>{group}</button>
                  ))}
                </div>

                <div className="mt-6 grid gap-3">
                  <div className="text-gray-300 text-sm">Nome do seu perfil (opcional)</div>
                  <input value={prefs.profileName} onChange={e=> setPrefs(p=>({...p, profileName: e.target.value}))} id="profileName" type="text" className="w-full px-3 py-2 rounded-md bg-[#0c0d0f] border border-[color:var(--edge)] focus:outline-none focus:ring-2 focus:ring-red-600" placeholder="Ex: João • Treino 2025" />
                </div>

                <div className="mt-6 p-4 rounded-lg border border-[color:var(--edge)] bg-[#0b0c0e]">
                  <div className="text-sm text-gray-300 mb-2">Seed data (recomendado)</div>
                  <p className="text-xs text-gray-400 mb-3">Vamos criar 3 aparelhos iniciais para você não começar do zero. Você pode remover depois.</p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer"><input checked={seed} onChange={e=> setSeed(e.target.checked)} id="seedToggle" type="checkbox" className="accent-yellow-400" /> Criar aparelhos iniciais</label>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <button className="btn px-5 py-2 rounded-md border border-gray-600/60 text-gray-200 hover:bg-white/5" onClick={()=> setStep(2)} data-prev="3">Voltar</button>
                  <button id="finish" className="btn bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-md" onClick={finish}>Concluir & Entrar</button>
                </div>
              </div>
            )}

            {step===4 && (
              <div className="step-enter step-show">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">✅</span>
                  <h2 className="title-font text-2xl">Tudo pronto!</h2>
                </div>
                <p className="text-gray-300">Suas preferências foram salvas no navegador e os aparelhos iniciais foram criados.</p>
                <ul className="text-sm text-gray-400 list-disc ml-5 mt-3">
                  <li>Unidade de peso ajustada</li>
                  <li>Objetivos e grupos favoritos salvos</li>
                  <li>Aparelhos iniciais criados (se você marcou)</li>
                </ul>
                <div className="mt-5 flex items-center justify-between">
                  <button id="restart" className="btn px-5 py-2 rounded-md border border-gray-600/60 text-gray-200 hover:bg-white/5" onClick={restart}>Refazer</button>
                  <button id="goApp" className="btn bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-md" onClick={()=> navigate('/app')}>Entrar no app</button>
                </div>
              </div>
            )}
          </div>
        </section>

        <footer className="text-center text-gray-500 text-xs mt-4">
          Tudo é salvo localmente no seu navegador. Sem login, sem senha.
        </footer>
      </main>
    </div>
  );
}

