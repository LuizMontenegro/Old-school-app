import React, { useEffect, useMemo, useRef, useState } from 'react';

const LS_KEY = 'osg.exercises.v3';
const PREF_KEY = 'osg.prefs.v1';
const SESS_KEY = 'osg.sessions.v1';
const RUN_KEY = 'osg.session.running.v1';

const KG_TO_LB = 2.20462;
const toKg = (v, unit) => (unit === 'lb' ? v / KG_TO_LB : v);

function estimate1RM(kg, reps) {
  if (!kg || !reps) return null;
  return kg * (1 + reps / 30);
}

function svgPlaceholder(text, c1 = '#ef4444') {
  const initials = text
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='#f59e0b'/></linearGradient></defs>
      <rect width='100%' height='100%' rx='24' fill='#0b0b0c'/>
      <rect x='12' y='12' width='232' height='232' rx='20' fill='url(#g)' opacity='0.2' stroke='${c1}' stroke-opacity='0.5'/>
      <text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Oswald, Arial' font-size='88' fill='white' fill-opacity='0.9'>${initials}</text>
    </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function useLocalState() {
  const [exercises, setExercises] = useState([]);
  const [prefs, setPrefs] = useState({ unit: 'kg', contrast: false, large: false, goals: [], favGroups: [] });
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    try {
      setExercises(JSON.parse(localStorage.getItem(LS_KEY) || '[]'));
    } catch {}
    try {
      setPrefs((p) => ({ ...p, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') }));
    } catch {}
    try {
      setSessions(JSON.parse(localStorage.getItem(SESS_KEY) || '[]'));
    } catch {}
  }, []);

  const saveExercises = (list) => {
    setExercises(list);
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  };
  const savePrefs = (p) => {
    setPrefs(p);
    localStorage.setItem(PREF_KEY, JSON.stringify(p));
  };
  const saveSessions = (list) => {
    setSessions(list);
    localStorage.setItem(SESS_KEY, JSON.stringify(list));
  };
  return { exercises, saveExercises, prefs, savePrefs, sessions, saveSessions };
}

const LIB = [
  { name: 'Supino reto', group: 'Peito', color: '#ef4444' },
  { name: 'Puxada frente', group: 'Costas', color: '#22d3ee' },
  { name: 'Agachamento livre', group: 'Pernas', color: '#a3e635' },
  { name: 'Leg press', group: 'Pernas', color: '#84cc16' },
  { name: 'Desenvolvimento militar', group: 'Ombros', color: '#f43f5e' },
  { name: 'Rosca direta', group: 'Bíceps', color: '#a855f7' },
  { name: 'Tríceps corda', group: 'Tríceps', color: '#f9a8d4' },
  { name: 'Abdominal máquina', group: 'Core', color: '#14b8a6' },
];

function Sparkline({ data, id }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = (canvas.width = canvas.clientWidth);
    const h = (canvas.height = canvas.clientHeight);
    ctx.clearRect(0, 0, w, h);
    if (!data || !data.length) return;
    const vals = data.map((d) => d.weight);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = 6;
    const scaleX = (i) => (i / (vals.length - 1)) * (w - pad * 2) + pad;
    const scaleY = (v) => {
      const rr = max === min ? 1 : (v - min) / (max - min);
      return h - pad - rr * (h - pad * 2);
    };
    ctx.lineWidth = 2;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(1, '#f59e0b');
    ctx.strokeStyle = grad;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = scaleX(i);
      const y = scaleY(d.weight);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [data, id]);
  return <canvas ref={ref} height={56} className="w-full rounded-lg bg-[#0b0c0e] border border-[color:var(--edge)]" />;
}

function useUserWelcome() {
  const [text, setText] = useState('');
  useEffect(() => {
    const loggedUser = localStorage.getItem('osg.user.logged');
    if (loggedUser) {
      try {
        const userData = JSON.parse(loggedUser);
        if (userData?.email) {
          setText(`Bem-vindo(a), ${userData.email}!`);
          return;
        }
      } catch {}
    }
    const prefs = localStorage.getItem('osg.prefs.v1');
    if (prefs) {
      try {
        const p = JSON.parse(prefs);
        if (p.profileName?.trim()) {
          setText(`Bem-vindo(a), ${p.profileName}!`);
          return;
        }
      } catch {}
    }
    const onboard = localStorage.getItem('osg.onboard.v1');
    if (onboard) {
      try {
        const d = JSON.parse(onboard);
        if (d?.profileName) {
          setText(`Bem-vindo(a), ${d.profileName}!`);
          return;
        }
        if (d?.goals?.length) {
          setText(`Bem-vindo(a)! Objetivos: ${d.goals.join(', ')}`);
          return;
        }
      } catch {}
    }
    setText('');
  }, []);
  return text;
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function formatSec(s) {
  const m = Math.floor(s / 60), r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function ChartModal({ ex, prefs, onClose, onQuickAdd, onRemoveEntry, onSharePR }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ex) return;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const w = (canvas.width = canvas.clientWidth);
    const h = (canvas.height = canvas.clientHeight);
    ctx.clearRect(0, 0, w, h);
    const data = ex.history || [];
    if (!data.length) return;
    const vals = data.map((d) => d.weight);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = 20;
    const scaleX = (i) => (i / (vals.length - 1)) * (w - pad * 2) + pad;
    const scaleY = (v) => {
      const rr = max === min ? 1 : (v - min) / (max - min);
      return h - pad - rr * (h - pad * 2);
    };
    // axes baseline
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();
    // line
    ctx.lineWidth = 2;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(1, '#f59e0b');
    ctx.strokeStyle = grad;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = scaleX(i);
      const y = scaleY(d.weight);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [ex]);

  if (!ex) return null;
  const best1rm = ex.history && ex.history.length ? Math.max(...ex.history.map((h) => estimate1RM(h.weight, h.reps || 1) || 0)) : 0;
  const best = ex.history?.reduce((m, h) => Math.max(m, h.weight), 0) || 0;
  const toDisplayKgLb = (kg) => (prefs.unit === 'kg' ? `${kg} kg (${(kg * KG_TO_LB).toFixed(1)} lb)` : `${(kg * KG_TO_LB).toFixed(1)} lb (${kg} kg)`);

  return (
    <div className="fixed inset-0 z-[60] modal-backdrop flex items-end sm:items-center justify-center p-4" role="dialog" aria-label="Gráfico de progresso">
      <div className="card w-full max-w-2xl overflow-hidden">
        <div className="p-4 border-b border-[color:var(--edge)] flex items-center justify-between">
          <div>
            <h3 className="title-font text-xl">{ex.name}</h3>
            <div className="text-xs text-gray-400">{ex.group ? `Grupo: ${ex.group}` : 'Histórico de cargas'} • 1RM est.: {best1rm ? toDisplayKgLb(Math.round(best1rm)) : '—'} • Recorde: {toDisplayKgLb(best)}</div>
          </div>
          <button className="btn text-gray-300 hover:text-white focus-vis" onClick={onClose}>✕</button>
        </div>
        <div className="p-4 space-y-3">
          <canvas ref={ref} height={200} className="w-full bg-[#0b0c0e] border border-[color:var(--edge)] rounded" />
          <div className="flex items-center gap-2">
            <button className="btn bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-md" onClick={() => onQuickAdd(ex)}>Registrar</button>
            <button className="btn gold px-3 py-2 rounded-md hover:bg-yellow-600/10" onClick={onSharePR}>Compartilhar PR deste aparelho</button>
          </div>
          <div className="grid gap-2" id="historyList">
            {(!ex.history || !ex.history.length) && <div className="text-gray-400 text-sm">Sem registros ainda.</div>}
            {[...(ex.history || [])]
              .slice()
              .reverse()
              .map((h) => {
                const details = [toDisplayKgLb(h.weight), h.reps ? `${h.reps} reps` : null, h.rpe ? `RPE ${h.rpe}` : null, h.restSec ? `Descanso ${formatSec(h.restSec)}` : null]
                  .filter(Boolean)
                  .join(' • ');
                return (
                  <div key={h.date} className="flex items-center justify-between gap-3 px-3 py-2 rounded bg-[#0c0d10] border border-[color:var(--edge)]">
                    <div className="flex items-center gap-3">
                      {h.pr ? <span className="badge-pr px-1.5 py-0.5 rounded text-[10px]">PR</span> : <span className="text-yellow-300">●</span>}
                      <div>
                        <div className="text-sm text-gray-100">{details}</div>
                        <div className="text-xs text-gray-400">{formatDate(h.date)}{h.note ? ` • ${h.note}` : ''}</div>
                      </div>
                    </div>
                    <button className="btn text-xs px-2 py-1 rounded border border-gray-600/60 text-gray-300 hover:bg-white/5" onClick={() => onRemoveEntry(ex.id, h.date)}>Remover</button>
                  </div>
                );
              })}
          </div>
        </div>
        <div className="p-4 border-t border-[color:var(--edge)] flex items-center justify-end gap-3">
          <button className="btn px-4 py-2 rounded-md border border-gray-600/60 text-gray-300 hover:bg-white/5 focus-vis" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

export default function AppPage() {
  const { exercises, saveExercises, prefs, savePrefs, sessions, saveSessions } = useLocalState();
  const userText = useUserWelcome();
  const [tab, setTab] = useState('meus');
  const [selectedPR, setSelectedPR] = useState('');
  const [runningSession, setRunningSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RUN_KEY) || 'null'); } catch { return null; }
  }); // {id,name,items:[{exId,done:false}], startedAt}
  const [filterGroup, setFilterGroup] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [logEx, setLogEx] = useState(null); // exercise being logged
  const [chartEx, setChartEx] = useState(null);

  const groups = useMemo(() => Array.from(new Set(exercises.map((e) => e.group).filter(Boolean))).sort(), [exercises]);

  const list = useMemo(() => {
    let l = exercises.slice();
    if (filterGroup) l = l.filter((e) => e.group === filterGroup);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      l = l.filter((e) => (e.name || '').toLowerCase().includes(s) || (e.group || '').toLowerCase().includes(s));
    }
    l.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'best') {
        const ba = Math.max(0, ...(a.history || []).map((h) => h.weight));
        const bb = Math.max(0, ...(b.history || []).map((h) => h.weight));
        return bb - ba;
      }
      if (sortBy === 'most') {
        const ca = (a.history || []).length;
        const cb = (b.history || []).length;
        return cb - ca;
      }
      const la = a.history?.[a.history.length - 1]?.date || a.createdAt;
      const lb = b.history?.[b.history.length - 1]?.date || b.createdAt;
      return lb - la;
    });
    return l;
  }, [exercises, filterGroup, searchTerm, sortBy]);

  function toDisplayKgLb(kg) {
    const lb = kg * KG_TO_LB;
    return prefs.unit === 'kg' ? `${kg} kg (${lb.toFixed(1)} lb)` : `${lb.toFixed(1)} lb (${kg} kg)`;
  }

  function removeExercise(id) {
    if (!confirm('Remover aparelho?')) return;
    const next = exercises.filter((e) => e.id !== id);
    saveExercises(next);
  }

  function addExerciseQuick() {
    // Mantido como fallback (não usado pelo card)
    const name = prompt('Nome do aparelho:');
    if (!name) return;
    const group = prompt('Grupo (ex: Peito):') || '';
    const plan = 'linear';
    const ex = { id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2), name, group, plan, photo: svgPlaceholder(name), history: [], createdAt: Date.now() };
    saveExercises([...exercises, ex]);
  }

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', group: '', plan: 'linear', start: '', photo: '' });
  const fileRef = useRef(null);

  function openAddModal() {
    setAddForm({ name: '', group: '', plan: 'linear', start: '', photo: '' });
    setAddOpen(true);
  }
  function closeAddModal() {
    setAddOpen(false);
  }
  async function onPickPhoto(e) {
    const f = e.target.files?.[0];
    if (!f) { setAddForm((p)=> ({...p, photo:''})); return; }
    const dataUrl = await new Promise((res, rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(f); });
    setAddForm((p)=> ({...p, photo: String(dataUrl)}));
  }
  function saveAddForm() {
    const name = addForm.name.trim(); if (!name) { alert('Informe o nome do aparelho.'); return; }
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    const createdAt = Date.now();
    const ex = {
      id,
      name,
      group: addForm.group.trim() || undefined,
      photo: addForm.photo || svgPlaceholder(name),
      plan: addForm.plan || 'linear',
      history: [],
      createdAt,
    };
    const start = parseFloat(addForm.start);
    if (!isNaN(start)) ex.history.push({ date: createdAt, weight: start, note: 'Carga inicial' });
    saveExercises([ex, ...exercises]);
    setAddOpen(false);
  }

  function AddExerciseCard() {
    return (
      <article className="card overflow-hidden p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5" onClick={openAddModal} title="Adicionar novo aparelho">
        <div className="img-frame w-20 h-20 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
          <span className="text-3xl" aria-hidden>＋</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="title-font text-lg truncate">Novo Aparelho</h4>
            <span className="chip text-[10px] px-2 py-0.5 rounded">Adicionar</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Clique para criar um aparelho e começar a registrar.</p>
        </div>
      </article>
    );
  }

  function addFromLibrary(item) {
    const exists = exercises.some((e) => e.name.toLowerCase() === item.name.toLowerCase() && e.group === item.group);
    if (exists) return;
    const ex = { id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2), name: item.name, group: item.group, plan: 'linear', photo: svgPlaceholder(item.name, item.color), history: [], createdAt: Date.now() };
    saveExercises([ex, ...exercises]);
    setTab('meus');
  }

  // Compartilhamento de PR
  function shareExerciseLatestPR(ex) {
    if (!ex || !ex.history?.length) { alert('Sem PR para compartilhar.'); return; }
    const pr = [...ex.history].reverse().find((h) => h.pr);
    if (!pr) { alert('Sem PR para este aparelho ainda.'); return; }
    generatePRCanvas(ex, pr);
  }

  // Sessions
  function addSession() {
    const base = ['Treino A', 'Treino B', 'Treino C'];
    const name = prompt('Nome da sessão (ex.: Treino A):', base[sessions.length % 3]) || `Sessão ${sessions.length + 1}`;
    const next = [...sessions, { id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2), name, items: [], createdAt: Date.now() }];
    saveSessions(next);
  }
  function deleteSession(id) {
    if (!confirm('Excluir sessão?')) return;
    const next = sessions.filter((s) => s.id !== id);
    saveSessions(next);
    if (runningSession?.id === id) setRunningSession(null);
  }
  function editSession(id) {
    const sess = sessions.find((s) => s.id === id);
    if (!sess) return;
    const name = prompt('Nome da sessão:', sess.name) || sess.name;
    sess.name = name;
    if (confirm('Quer adicionar um aparelho a esta sessão agora?')) {
      const options = exercises.map((e) => `${e.id}::${e.name}`).join('\n');
      const chosen = prompt('Digite o ID do aparelho dentre as opções:\n' + options);
      const ex = exercises.find((e) => e.id === (chosen || '').split('::')[0]);
      if (ex) {
        const sets = parseInt(prompt('Séries (opcional):') || '');
        const reps = parseInt(prompt('Reps (opcional):') || '');
        const rest = parseInt(prompt('Descanso em segundos (opcional):') || '');
        sess.items.push({ exId: ex.id, targetSets: isNaN(sets) ? undefined : sets, targetReps: isNaN(reps) ? undefined : reps, rest: isNaN(rest) ? undefined : rest });
      }
    }
    saveSessions([...sessions]);
  }
  function reorderItem(sessionId, idx, dir) {
    const sess = sessions.find((s) => s.id === sessionId);
    if (!sess) return;
    const i2 = dir === 'up' ? idx - 1 : idx + 1;
    if (i2 < 0 || i2 >= sess.items.length) return;
    const items = sess.items.slice();
    [items[idx], items[i2]] = [items[i2], items[idx]];
    const next = sessions.map((s) => (s.id === sessionId ? { ...s, items } : s));
    saveSessions(next);
  }
  function removeItem(sessionId, idx) {
    const sess = sessions.find((s) => s.id === sessionId);
    if (!sess) return;
    const items = sess.items.slice();
    items.splice(idx, 1);
    const next = sessions.map((s) => (s.id === sessionId ? { ...s, items } : s));
    saveSessions(next);
  }
  function startSession(id) {
    const sess = sessions.find((s) => s.id === id);
    if (!sess) {
      alert('Crie uma sessão primeiro.');
      return;
    }
    setRunningSession({ id: sess.id, name: sess.name, startedAt: Date.now(), items: sess.items.map((i) => ({ exId: i.exId, done: false, rest: i.rest })) });
  }
  function finishSession() {
    if (!runningSession) return;
    alert('Sessão concluída! Gere o resumo se quiser compartilhar.');
    setRunningSession(null);
  }

  // Persist running session in localStorage
  useEffect(() => {
    if (runningSession) localStorage.setItem(RUN_KEY, JSON.stringify(runningSession));
    else localStorage.removeItem(RUN_KEY);
  }, [runningSession]);

  // Rest timer modal
  const [restState, setRestState] = useState(null); // {total,left,running,startTs,onFinish}
  function openRest(seconds = 90, onFinish) {
    setRestState({ total: seconds, left: seconds, running: false, startTs: null, onFinish });
  }
  useEffect(() => {
    if (!restState) return;
    let interval;
    function tick() {
      if (!restState.running) return;
      const now = Date.now();
      const elapsed = Math.floor((now - restState.startTs) / 1000);
      const left = Math.max(0, restState.total - elapsed);
      setRestState((s) => ({ ...s, left }));
      if (left === 0) {
        clearInterval(interval);
        setRestState((s) => ({ ...s, running: false }));
        try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch {}
        if (typeof restState.onFinish === 'function') restState.onFinish(restState.total);
      }
    }
    interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [restState?.running]);
  function restStart() {
    if (!restState || restState.running) return;
    const startTs = Date.now() - (restState.total - restState.left) * 1000;
    setRestState((s) => ({ ...s, running: true, startTs }));
  }
  function restPause() {
    if (!restState || !restState.running) return;
    setRestState((s) => ({ ...s, running: false }));
  }
  function restAdd30() {
    if (!restState) return;
    setRestState((s) => {
      if (s.running) {
        const elapsed = Math.floor((Date.now() - s.startTs) / 1000);
        const total = s.total + 30;
        const left = Math.max(0, total - elapsed);
        return { ...s, total, left };
      } else {
        return { ...s, total: s.total + 30, left: s.left + 30 };
      }
    });
  }
  function restReset() {
    setRestState((s) => (s ? { ...s, total: 90, left: 90, running: false } : s));
  }
  function restClose() {
    if (!restState) return setRestState(null);
    const actual = restState.running ? restState.total - Math.max(0, Math.floor((Date.now() - restState.startTs) / 1000)) : restState.total - restState.left;
    if (typeof restState.onFinish === 'function') restState.onFinish(actual);
    setRestState(null);
  }

  // Analytics (heatmap + PRs)
  const heatRef = useRef(null);
  const streakText = useRef('');
  const prs = useMemo(() => {
    const out = [];
    for (const ex of exercises) {
      for (const h of ex.history || []) {
        if (h.pr) out.push({ exId: ex.id, exName: ex.name, type: h.pr, date: h.date, weight: h.weight, reps: h.reps });
      }
    }
    out.sort((a, b) => b.date - a.date);
    return out;
  }, [exercises]);
  function drawHeatmap() {
    const canvas = heatRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cssW = canvas.clientWidth || 300;
    const cssH = 240;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = '#0b0c0e';
    ctx.fillRect(0, 0, cssW, cssH);

    // collect workout days
    const map = new Map();
    for (const ex of exercises) {
      for (const hst of ex.history || []) {
        const d = new Date(hst.date);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const cell = 28;
    const offsetX = 10;
    const offsetY = 24;

    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.font = '12px Oswald, sans-serif';
    ctx.fillText(now.toLocaleString('pt-BR', { month: 'long' }), offsetX, 14);
    for (let d = 1; d <= days; d++) {
      const date = new Date(year, month, d);
      const weekday = (date.getDay() + 6) % 7; // seg=0
      const week = Math.floor(((d + new Date(year, month, 1).getDay() + 6) % 7) + (d - 1) / 7);
      const x = offsetX + week * cell;
      const y = offsetY + weekday * cell;
      const key = `${year}-${month}-${d}`;
      const v = map.get(key) || 0;
      const color = v === 0 ? '#1f2937' : v < 2 ? '#ef444422' : v < 4 ? '#ef444444' : '#ef4444aa';
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 22, 22);
    }

    // streak
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (map.get(key)) streak++;
      else break;
    }
    streakText.current = `Streak atual: ${streak} ${streak === 1 ? 'dia' : 'dias'}`;
  }
  useEffect(() => {
    if (tab !== 'analise') return;
    drawHeatmap();
  }, [tab, exercises]);

  function toDisplayKgLbLocal(kg) {
    return prefs.unit === 'kg' ? `${kg} kg (${(kg * KG_TO_LB).toFixed(1)} lb)` : `${(kg * KG_TO_LB).toFixed(1)} lb (${kg} kg)`;
  }
  // Ferramentas: backup/import/export/reset
  function backupJSON() {
    const blob = new Blob([JSON.stringify(exercises, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oldschoolgym-backup-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importJSON(e) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const txt = await file.text();
      const data = JSON.parse(txt);
      if (!Array.isArray(data)) throw new Error('Formato inválido');
      saveExercises(data);
      alert('Importação concluída!');
    } catch (err) {
      alert('Falha ao importar.');
    } finally {
      e.target.value = '';
    }
  }
  function exportCSV() {
    const rows = [['date','exercise','group','weight_kg','reps','rpe','rest_s','note','is_pr']];
    for (const ex of exercises) {
      for (const h of ex.history || []) {
        rows.push([
          new Date(h.date).toISOString(),
          ex.name,
          ex.group || '',
          h.weight,
          h.reps || '',
          h.rpe || '',
          h.restSec || '',
          String(h.note || '').replace(/[\n,]/g, ' '),
          h.pr ? 1 : 0,
        ]);
      }
    }
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `oldschoolgym-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=> URL.revokeObjectURL(url), 1000);
  }
  function resetAll() {
    if (!confirm('Apagar TODOS os dados?')) return;
    saveExercises([]);
    saveSessions([]);
    alert('Dados removidos.');
  }

  function shareSessionCanvas(sess) {
    try {
      const W = 900, H = 540;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H; const ctx = canvas.getContext('2d');
      // bg
      const grad = ctx.createLinearGradient(0, 0, W, H); grad.addColorStop(0, '#0b0b0c'); grad.addColorStop(1, '#111214'); ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      // frame
      ctx.strokeStyle = '#ef4444'; ctx.globalAlpha = .25; ctx.lineWidth = 6; ctx.strokeRect(12, 12, W-24, H-24); ctx.globalAlpha = 1;
      // title
      ctx.fillStyle = '#fde68a'; ctx.font = 'bold 54px Bebas Neue, Oswald, sans-serif'; ctx.fillText('OLD SCHOOL SESSION', 36, 86);
      // subtitle
      ctx.fillStyle = '#f3f4f6'; ctx.font = '28px Oswald, sans-serif';
      ctx.fillText(sess.name || 'Sessão', 36, 130);
      const when = sess.startedAt ? new Date(sess.startedAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
      ctx.font = '18px Oswald, sans-serif'; ctx.fillStyle = '#9ca3af'; ctx.fillText(when, 36, 156);
      // items list
      const items = sess.items || [];
      ctx.font = '20px Oswald, sans-serif'; ctx.fillStyle = '#f3f4f6';
      const left = 36, top = 200, line = 30; let y = top;
      items.forEach((it, idx) => {
        const ex = exercises.find((e) => e.id === it.exId);
        const name = ex ? ex.name : '(removido)';
        const meta = [it.targetSets?`${it.targetSets}x`:null, it.targetReps?`${it.targetReps} reps`:null, it.rest?`${it.rest}s`:null].filter(Boolean).join(' • ');
        const text = `${String(idx+1).padStart(2,'0')}. ${name}${meta? ' • ' + meta: ''}`;
        ctx.fillText(text, left, y);
        y += line;
      });
      // badge
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(W-220, 40, 180, 36); ctx.fillStyle = '#111214'; ctx.font = 'bold 20px Oswald'; ctx.fillText('TREINO DO DIA', W-205, 66);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url; a.download = `Sessao-${(sess.name||'treino').replace(/\s+/g,'_')}.png`; document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { alert('Falha ao gerar resumo.'); }
  }
  function sharePRCanvasBy(exId, date) {
    const ex = exercises.find((e) => e.id === exId);
    const pr = ex?.history?.find((h) => String(h.date) === String(date));
    if (ex && pr) generatePRCanvas(ex, pr);
  }
  function generatePRCanvas(ex, pr) {
    const W = 800, H = 420;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H; const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, W, H); grad.addColorStop(0, '#0b0b0c'); grad.addColorStop(1, '#111214'); ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ef4444'; ctx.globalAlpha = .25; ctx.lineWidth = 6; ctx.strokeRect(12, 12, W - 24, H - 24); ctx.globalAlpha = 1;
    ctx.fillStyle = '#fde68a'; ctx.font = 'bold 54px Bebas Neue, Oswald, sans-serif'; ctx.fillText('OLD SCHOOL PR', 36, 86);
    ctx.fillStyle = '#f3f4f6'; ctx.font = '28px Oswald, sans-serif'; ctx.fillText(ex.name, 36, 130);
    const val = pr.pr === '1rm' ? `1RM Est.: ${toDisplayKgLbLocal(Math.round(estimate1RM(pr.weight, pr.reps || 1) || pr.weight))}` : `Carga: ${toDisplayKgLbLocal(pr.weight)}`;
    ctx.font = '36px Oswald, sans-serif'; ctx.fillStyle = '#f3f4f6'; ctx.fillText(val, 36, 176);
    ctx.font = '18px Oswald, sans-serif'; ctx.fillStyle = '#9ca3af'; ctx.fillText(new Date(pr.date).toLocaleString('pt-BR'), 36, 204);
    ctx.fillStyle = '#f59e0b'; ctx.fillRect(W - 180, 40, 120, 36); ctx.fillStyle = '#111214'; ctx.font = 'bold 20px Oswald'; ctx.fillText(pr.pr === '1rm' ? 'PR 1RM' : 'PR CARGA', W - 170, 66);
    ctx.save(); ctx.beginPath(); ctx.arc(W - 120, H - 120, 64, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    const pImg = new Image(); pImg.onload = () => { ctx.drawImage(pImg, W - 184, H - 184, 128, 128); finish(); }; pImg.onerror = () => finish();
    pImg.src = ex.photo || svgPlaceholder(ex.name);
    function finish() {
      ctx.restore();
      const url = canvas.toDataURL('image/png'); const a = document.createElement('a'); a.href = url; a.download = `PR-${ex.name.replace(/\s+/g, '_')}.png`; document.body.appendChild(a); a.click(); a.remove();
    }
  }

  function openLog(ex) {
    setLogEx(ex);
  }

  function submitLog(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const wInput = parseFloat(form.weight.value);
    const reps = parseInt(form.reps.value);
    const rpe = parseFloat(form.rpe.value);
    const note = (form.note.value || '').trim();
    if (isNaN(wInput)) {
      alert('Informe o peso.');
      return;
    }
    const weightKg = Number(toKg(wInput, prefs.unit).toFixed(2));

    const list = exercises.slice();
    const ex = list.find((x) => x.id === logEx.id);
    if (!ex) return;
    const entry = { date: Date.now(), weight: weightKg };
    if (!isNaN(reps)) entry.reps = reps;
    if (!isNaN(rpe)) entry.rpe = rpe;
    if (note) entry.note = note;

    const prevMax = Math.max(0, ...(ex.history || []).map((h) => h.weight));
    const new1rm = estimate1RM(weightKg, entry.reps || 1) || 0;
    const prev1rm = ex.history?.length ? Math.max(...ex.history.map((h) => estimate1RM(h.weight, h.reps || 1) || 0)) : 0;
    if (new1rm > prev1rm + 1e-6) entry.pr = '1rm';
    else if (weightKg > prevMax) entry.pr = 'weight';

    ex.history = [...(ex.history || []), entry];
    saveExercises(list);
    setLogEx(null);
    // Se houver sessão em execução, marcar o primeiro item correspondente como concluído
    setRunningSession((s) => {
      if (!s) return s;
      const idx = s.items.findIndex((it) => it.exId === ex.id && !it.done);
      if (idx === -1) return s;
      const items = s.items.slice();
      items[idx] = { ...items[idx], done: true };
      return { ...s, items };
    });
    // Abrir timer de descanso e salvar descanso real no histórico, como no legado
    openRest(90, (actualSec) => {
      const refreshed = exercises.slice();
      const exRef = refreshed.find((x) => x.id === ex.id);
      if (exRef && exRef.history && exRef.history.length) {
        exRef.history[exRef.history.length - 1].restSec = actualSec;
        saveExercises(refreshed);
      }
    });
  }

  function removeHistoryEntry(exId, date) {
    const list = exercises.slice();
    const ex = list.find((x) => x.id === exId);
    if (!ex) return;
    const idx = ex.history.findIndex((h) => h.date === date);
    if (idx >= 0) {
      ex.history.splice(idx, 1);
      saveExercises(list);
    }
  }

  function renderCard(ex) {
    const last = ex.history?.[ex.history.length - 1];
    const best = ex.history?.reduce((m, h) => Math.max(m, h.weight), 0) || 0;
    const best1rm = ex.history && ex.history.length ? Math.max(...ex.history.map((h) => estimate1RM(h.weight, h.reps || 1) || 0)) : 0;
    const hasPR = !!last?.pr;
    return (
      <article key={ex.id} className="card overflow-visible flex flex-col">
        <div className="p-4 flex items-start gap-4">
          <div className="img-frame w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
            {ex.photo ? (
              <img alt={`Foto do aparelho ${ex.name}`} className="w-full h-full object-cover" src={ex.photo} onError={(ev) => (ev.currentTarget.style.display = 'none')} />
            ) : (
              <div className="text-gray-500 text-xs px-2">Sem foto</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="title-font text-xl truncate">{ex.name}</h3>
              {ex.group ? <span className="chip text-[10px] px-2 py-0.5 rounded">{ex.group}</span> : null}
              <span className="chip text-[10px] px-2 py-0.5 rounded">Plano: {ex.plan || 'linear'}</span>
              {hasPR ? <span className="badge-pr text-[10px] px-2 py-0.5 rounded">PR {last.pr === '1rm' ? '1RM' : 'Carga'}</span> : null}
            </div>
            <div className="mt-1 text-sm text-gray-400">
              {last ? (
                <>
                  Última: <span className="text-gray-200">{toDisplayKgLb(Number(last.weight.toFixed(2)))}{last.reps ? ` • ${last.reps} reps` : ''}{last.rpe ? ` • RPE ${last.rpe}` : ''}</span> •{' '}
                  {formatTiming(last.date)} atrás
                </>
              ) : (
                'Sem registros ainda'
              )}
            </div>
          </div>
        </div>
        <div className="px-4">
          <Sparkline id={ex.id} data={ex.history || []} />
        </div>
        <div className="p-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs text-gray-400">
            Recorde: <span className="text-gray-100">{toDisplayKgLb(best)}</span> • 1RM est.: <span className="text-gray-100">{best1rm ? toDisplayKgLb(Math.round(best1rm)) : '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-md" onClick={() => openLog(ex)}>Registrar</button>
            <button className="btn px-3 py-1.5 rounded-md border border-gray-600/60 text-gray-200 hover:bg-white/5" onClick={() => setChartEx(ex)}>Gráfico</button>
            <button className="btn gold px-3 py-1.5 rounded-md hover:bg-yellow-600/10" onClick={() => shareExerciseLatestPR(ex)}>Compartilhar PR</button>
            <button className="btn px-3 py-1.5 rounded-md border border-gray-600/60 text-red-200 hover:bg-red-600/10" onClick={() => removeExercise(ex.id)}>Remover</button>
          </div>
        </div>
      </article>
    );
  }

  function formatTiming(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 60) return m === 0 ? 'agora' : `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} h`;
    const d = Math.floor(h / 24);
    return `${d} d`;
  }

  return (
    <div className="grid-lines">
      <header className="px-5 md:px-10 pt-6 pb-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span aria-hidden="true" className="w-8 h-8">
                <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ef4444"/><stop offset="1" stopColor="#f59e0b"/></linearGradient></defs>
                  <path d="M18 26a14 14 0 1 1 28 0v6H18v-6z" stroke="url(#g1)" strokeWidth="4"/>
                  <rect x="10" y="30" width="44" height="28" rx="12" fill="url(#g1)" opacity=".18" stroke="#ef4444" strokeWidth="2"/>
                  <circle cx="20" cy="44" r="6" fill="#ef4444" opacity=".6"/>
                  <circle cx="44" cy="44" r="6" fill="#f59e0b" opacity=".6"/>
                </svg>
              </span>
              <div>
                <h1 className="title-font text-3xl md:text-5xl text-white tracking-wide">OLD SCHOOL GYM</h1>
                <p className="text-sm text-gray-300 mt-1 font-medium">{userText}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="chip px-2 py-1 rounded text-xs flex items-center gap-1" role="group" aria-label="Unidade de peso">
                Unidade:
                <button className={`btn px-2 py-0.5 rounded border ${prefs.unit==='kg'?'bg-white/5 text-white':'border-gray-600/60 text-gray-200 hover:bg-white/5'}`} onClick={() => savePrefs({ ...prefs, unit: 'kg' })}>KG</button>
                <button className={`btn px-2 py-0.5 rounded border ${prefs.unit==='lb'?'bg-white/5 text-white':'border-gray-600/60 text-gray-200 hover:bg-white/5'}`} onClick={() => savePrefs({ ...prefs, unit: 'lb' })}>LB</button>
              </div>
              <div className="chip px-2 py-1 rounded text-xs">{exercises.length} aparelhos</div>
              <button className="btn ok px-3 py-1.5 rounded-md hover:bg-green-600/10" onClick={addExerciseQuick}>+ Adicionar</button>
            </div>
          </div>
          <div className="mt-4">
            <input id="globalSearch" className="w-full md:w-96 px-3 py-2 rounded-md bg-[#0c0d0f] border border-[color:var(--edge)] focus-vis" placeholder="Buscar por nome ou grupo (/)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <nav className="mt-6 flex items-center gap-6">
            <button className="tab pb-3 text-gray-300 hover:text-white focus-vis" data-tab="meus" aria-controls="viewMeus" data-active={tab==='meus'} onClick={()=> setTab('meus')}>Meus</button>
            <button className="tab pb-3 text-gray-300 hover:text-white focus-vis" data-tab="biblioteca" aria-controls="viewBiblioteca" data-active={tab==='biblioteca'} onClick={()=> setTab('biblioteca')}>Biblioteca</button>
            <button className="tab pb-3 text-gray-300 hover:text-white focus-vis" data-tab="sessoes" aria-controls="viewSessoes" data-active={tab==='sessoes'} onClick={()=> setTab('sessoes')}>Sessões</button>
            <button className="tab pb-3 text-gray-300 hover:text-white focus-vis" data-tab="analise" aria-controls="viewAnalise" data-active={tab==='analise'} onClick={()=> setTab('analise')}>Análises</button>
          </nav>
        </div>
      </header>

      <main className="px-5 md:px-10 pb-10">
        <div className="max-w-7xl mx-auto">
          {tab==='meus' && (
          <section id="controls" className="card p-4 mb-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Grupo:</label>
              <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value || '')} id="filterGroup" className="bg-[#0c0d0f] border border-[color:var(--edge)] rounded px-2 py-1 text-sm focus-vis" aria-label="Filtrar por grupo">
                <option value="">Todos</option>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Ordenar por:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} id="sortBy" className="bg-[#0c0d0f] border border-[color:var(--edge)] rounded px-2 py-1 text-sm focus-vis" aria-label="Ordenar">
                <option value="recent">Mais recentes</option>
                <option value="most">Mais usados</option>
                <option value="name">Nome</option>
                <option value="best">Recorde</option>
              </select>
            </div>
          </section>
          )}

          {tab==='meus' && (list.length === 0 ? (
            <div className="card p-8 flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-2">🏋️</div>
              <h3 className="title-font text-2xl mb-1">Nada por aqui</h3>
              <p className="text-gray-400 mb-4">Use a Biblioteca ou adicione manualmente para começar.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                <AddExerciseCard />
                <article className="card overflow-hidden p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5" onClick={() => setTab('biblioteca')} title="Explorar Biblioteca">
                  <div className="img-frame w-20 h-20 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                    <span className="text-3xl" aria-hidden>📚</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="title-font text-lg truncate">Explorar Biblioteca</h4>
                      <span className="chip text-[10px] px-2 py-0.5 rounded">Sugestões</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Adicione máquinas prontas ao seu painel.</p>
                  </div>
                </article>
              </div>
            </div>
          ) : (
            <section id="viewMeus" className="grid gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite">
              <AddExerciseCard />
              {list.map((ex) => renderCard(ex))}
            </section>
          ))}

          {tab==='biblioteca' && (
            <section id="viewBiblioteca" className="space-y-6">
              <div className="text-gray-300 text-sm">Selecione uma máquina pronta e clique em “Adicionar”.</div>
              <div id="libraryGrid" className="grid gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {Object.entries(LIB.reduce((acc, item) => { (acc[item.group] ||= []).push(item); return acc; }, {}))
                  .sort(([a],[b]) => a.localeCompare(b))
                  .map(([group, items]) => (
                    <React.Fragment key={group}>
                      <div className="col-span-full">
                        <h3 className="title-font text-xl mb-3">{group}</h3>
                      </div>
                      {items.map((m) => (
                        <article key={m.name} className="card overflow-hidden flex items-center gap-4 p-4">
                          <div className="img-frame w-20 h-20 rounded-xl overflow-hidden shrink-0">
                            <img alt={`Máquina ${m.name}`} className="w-full h-full object-cover" src={svgPlaceholder(m.name, m.color)} onError={(ev)=> (ev.currentTarget.style.display='none')} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap"><h4 className="title-font text-lg truncate">{m.name}</h4><span className="chip text-[10px] px-2 py-0.5 rounded">{group}</span></div>
                            <p className="text-xs text-gray-400 mt-0.5">Clique para adicionar ao seu painel.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="btn ok px-3 py-1.5 rounded-md hover:bg-green-600/10 focus-vis" onClick={() => addFromLibrary(m)}>Adicionar</button>
                          </div>
                        </article>
                      ))}
                    </React.Fragment>
                  ))}
              </div>
            </section>
          )}

          {tab==='sessoes' && (
            <section id="viewSessoes" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card p-4 space-y-3">
                  <h3 className="title-font text-xl">Planos A/B/C</h3>
                  <div className="text-sm text-gray-400">Crie suas sessões. Arraste para ordenar (simples: setas).</div>
                  <div className="space-y-3">
                    {sessions.map((s) => (
                      <div key={s.id} className="p-3 rounded border border-[color:var(--edge)]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2"><span className="chip px-2 py-0.5 rounded text-xs">{s.name}</span><span className="text-xs text-gray-400">{s.items.length} itens</span></div>
                          <div className="flex items-center gap-2">
                            <button className="btn px-2 py-1 rounded border border-gray-600/60 text-gray-200 hover:bg-white/5" onClick={() => editSession(s.id)}>Editar</button>
                            <button className="btn px-2 py-1 rounded border border-gray-600/60 text-red-200 hover:bg-red-600/10" onClick={() => deleteSession(s.id)}>Excluir</button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {s.items.map((it, idx) => {
                            const ex = exercises.find((e) => e.id === it.exId);
                            const name = ex ? ex.name : '(removido)';
                            return (
                              <div key={it.exId + ':' + idx} className="flex items-center justify-between text-sm bg-[#0b0c0e] border border-[color:var(--edge)] rounded px-2 py-1">
                                <div className="truncate">{idx + 1}. {name} {it.targetSets ? `• ${it.targetSets}x` : ''}{it.targetReps ? ` ${it.targetReps} reps` : ''}{it.rest ? ` • descanso ${it.rest}s` : ''}</div>
                                <div className="flex items-center gap-1">
                                  <button className="chip px-2 py-0.5 rounded" onClick={() => reorderItem(s.id, idx, 'up')}>↑</button>
                                  <button className="chip px-2 py-0.5 rounded" onClick={() => reorderItem(s.id, idx, 'down')}>↓</button>
                                  <button className="chip px-2 py-0.5 rounded text-red-300" onClick={() => removeItem(s.id, idx)}>x</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="btn ok px-3 py-2 rounded-md hover:bg-green-600/10 w-full focus-vis" onClick={addSession}>+ Nova sessão</button>
                </div>
                <div className="card p-4 space-y-3 lg:col-span-2">
                  <h3 className="title-font text-xl">Sessão do dia</h3>
                  <div className="flex items-center gap-2">
                    <select className="bg-[#0c0d0f] border border-[color:var(--edge)] rounded px-2 py-1 text-sm focus-vis" value={runningSession?.id || ''} onChange={(e) => startSession(e.target.value)}>
                      <option value="">Selecionar...</option>
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button className="btn bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-md focus-vis" onClick={() => startSession((document.activeElement.previousSibling && document.activeElement.previousSibling.value) || sessions[0]?.id)} disabled={!sessions.length || !!runningSession}>Iniciar</button>
                    <button className="btn px-3 py-2 rounded-md border border-gray-600/60 text-gray-200 hover:bg-white/5 focus-vis" onClick={finishSession} disabled={!runningSession}>Concluir</button>
                    <button className="btn gold px-3 py-2 rounded-md hover:bg-yellow-600/10 focus-vis" onClick={() => runningSession && shareSessionCanvas(runningSession)} disabled={!runningSession}>Compartilhar resumo</button>
                  </div>
                  <div className="grid gap-3">
                    {!runningSession && <div className="text-sm text-gray-400">Selecione uma sessão e clique em “Iniciar”.</div>}
                    {runningSession && runningSession.items.map((it, idx) => {
                      const ex = exercises.find((e) => e.id === it.exId);
                      return (
                        <div key={it.exId + ':' + idx} className="p-3 bg-[#0b0c0e] border border-[color:var(--edge)] rounded flex items-center justify-between gap-2">
                          <div className="truncate">{idx + 1}. {ex ? ex.name : '(removido)'}{it.done ? ' • concluído' : ''}{it.lastRestSec ? ` • último descanso ${formatSec(it.lastRestSec)}` : ''}</div>
                          <div className="flex items-center gap-2">
                            <button className="btn chip px-2 py-1 rounded text-xs" onClick={() => openLog(ex)} disabled={!ex}>+ log</button>
                            <button className="btn px-2 py-1 rounded border border-gray-600/60 text-gray-200 hover:bg-white/5 text-xs" onClick={() => openRest(it.rest || 90, (actualSec) => {
                              setRunningSession((s) => {
                                if (!s) return s;
                                const items = s.items.slice();
                                const curr = items[idx] || {};
                                items[idx] = { ...curr, lastRestSec: actualSec, rests: [ ...(curr.rests||[]), actualSec ] };
                                return { ...s, items };
                              });
                            })}>⏱ descanso</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {tab==='analise' && (
            <section id="viewAnalise" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-4">
                  <h3 className="title-font text-xl mb-2">Heatmap Mensal</h3>
                  <canvas ref={heatRef} height={240} className="w-full bg-[#0b0c0e] border border-[color:var(--edge)] rounded"></canvas>
                  <div className="text-sm text-gray-300 mt-2">{streakText.current || 'Streak atual: 0 dias'}</div>
                </div>
                <div className="card p-4 md:col-span-2">
                  <h3 className="title-font text-xl mb-2">PRs Recentes</h3>
                  <div className="grid gap-2">
                    {prs.slice(0,10).map((p) => (
                      <div key={p.exId+':'+p.date} className="flex items-center justify-between gap-2 px-3 py-2 rounded bg-[#0c0d10] border border-[color:var(--edge)]">
                        <div className="flex items-center gap-2">
                          <span className="badge-pr px-1.5 py-0.5 rounded text-[10px]">{p.type==='1rm' ? '1RM' : 'Carga'}</span>
                          <div>
                            <div className="text-sm text-gray-100">{p.exName} • {toDisplayKgLbLocal(p.weight)}{p.reps?` • ${p.reps} reps`:''}</div>
                            <div className="text-xs text-gray-400">{formatDate(p.date)}</div>
                          </div>
                        </div>
                        <button className="btn text-xs px-2 py-1 rounded border border-gray-600/60 text-gray-300 hover:bg-white/5" onClick={()=> sharePRCanvasBy(p.exId, p.date)}>Compartilhar</button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button className="btn gold px-3 py-2 rounded hover:bg-yellow-600/10 focus-vis" onClick={()=>{
                      if(!selectedPR) return; const [exId,dateStr]=selectedPR.split(':'); sharePRCanvasBy(exId,dateStr);
                    }}>Compartilhar PR selecionado</button>
                    <select className="bg-[#0c0d0f] border border-[color:var(--edge)] rounded px-2 py-1 text-sm ml-2 focus-vis" value={selectedPR} onChange={(e)=> setSelectedPR(e.target.value)}>
                      <option value="">Selecione…</option>
                      {prs.map((p)=> (
                        <option key={p.exId+':'+p.date} value={`${p.exId}:${p.date}`}>{p.exName} • {p.type.toUpperCase()} • {new Date(p.date).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="card p-4 md:col-span-3">
                  <h3 className="title-font text-xl mb-2">Ferramentas</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <button className="btn px-3 py-2 rounded-md border border-gray-600/60 text-gray-200 hover:bg-white/5" onClick={backupJSON}>Backup JSON</button>
                    <label className="btn px-3 py-2 rounded-md border border-gray-600/60 text-gray-200 hover:bg-white/5 cursor-pointer">
                      Importar JSON
                      <input type="file" accept="application/json" className="hidden" onChange={importJSON} />
                    </label>
                    <button className="btn px-3 py-2 rounded-md border border-gray-600/60 text-gray-200 hover:bg-white/5" onClick={exportCSV}>Exportar CSV</button>
                    <button className="btn px-3 py-2 rounded-md border border-red-600/60 text-red-200 hover:bg-red-600/10" onClick={resetAll}>Resetar tudo</button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {logEx && (
        <div className="fixed inset-0 z-50 modal-backdrop flex items-end sm:items-center justify-center p-4" role="dialog" aria-label="Registrar Carga">
          <div className="card w-full max-w-md overflow-hidden">
            <div className="p-5 md:p-6 border-b border-[color:var(--edge)] flex items-center justify-between">
              <h3 className="title-font text-2xl">Registrar Carga</h3>
              <button className="btn text-gray-300 hover:text-white focus-vis" onClick={() => setLogEx(null)}>✕</button>
            </div>
            <form className="p-5 md:p-6 space-y-3" onSubmit={submitLog}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Peso (<span>{prefs.unit}</span>)</label>
                  <input name="weight" type="number" inputMode="decimal" className="focus-vis ghost-input w-full px-3 py-2 rounded-md bg-[#0c0d0f] border border-[color:var(--edge)]" placeholder="Ex: 40" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Reps</label>
                  <input name="reps" type="number" inputMode="numeric" className="focus-vis ghost-input w-full px-3 py-2 rounded-md bg-[#0c0d0f] border border-[color:var(--edge)]" placeholder="Ex: 8" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">RPE (1–10)</label>
                  <input name="rpe" type="number" inputMode="decimal" step="0.5" min="1" max="10" className="focus-vis ghost-input w-full px-3 py-2 rounded-md bg-[#0c0d0f] border border-[color:var(--edge)]" placeholder="Ex: 8.5" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Anotação</label>
                  <input name="note" type="text" className="focus-vis ghost-input w-full px-3 py-2 rounded-md bg-[#0c0d0f] border border-[color:var(--edge)]" placeholder="Opcional" />
                </div>
              </div>
              <div className="p-5 md:p-6 border-t border-[color:var(--edge)] flex items-center justify-end gap-3">
                <button type="button" className="btn px-4 py-2 rounded-md border border-gray-600/60 text-gray-300 hover:bg-white/5 focus-vis" onClick={() => setLogEx(null)}>Cancelar</button>
                <button type="submit" className="btn bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md focus-vis">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Geração de cartão da sessão (download imediato) */}
      {chartEx && (
        <ChartModal
          ex={chartEx}
          prefs={prefs}
          onClose={() => setChartEx(null)}
          onQuickAdd={(ex) => {
            setChartEx(null);
            setLogEx(ex);
          }}
          onRemoveEntry={removeHistoryEntry}
          onSharePR={() => shareExerciseLatestPR(chartEx)}
        />
      )}
      {restState && (
        <div className="fixed inset-0 z-[70] modal-backdrop flex items-end sm:items-center justify-center p-4" role="dialog" aria-label="Descanso">
          <div className="card w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-[color:var(--edge)] flex items-center justify-between">
              <h3 className="title-font text-xl">Descanso</h3>
              <button className="btn text-gray-300 hover:text-white focus-vis" onClick={restClose}>✕</button>
            </div>
            <div className="p-5 flex flex-col items-center gap-4">
              <div className={`title-font text-5xl tracking-wide ${restState.left===0?'ring-raw':''}`}>{formatSec(restState.left)}</div>
              <div className="flex items-center gap-2">
                <button className="btn ok px-3 py-2 rounded-md hover:bg-green-600/10 focus-vis" onClick={restStart}>Iniciar</button>
                <button className="btn px-3 py-2 rounded-md border border-gray-600/60 text-gray-200 hover:bg-white/5 focus-vis" onClick={restPause}>Pausar</button>
                <button className="btn gold px-3 py-2 rounded-md hover:bg-yellow-600/10 focus-vis" onClick={restAdd30}>+30s</button>
                <button className="btn px-3 py-2 rounded-md border border-gray-600/60 text-gray-200 hover:bg-white/5 focus-vis" onClick={restReset}>Reset</button>
              </div>
              <div className="text-xs text-gray-400">Ao terminar, registraremos o descanso real no histórico.</div>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-[75] modal-backdrop flex items-end sm:items-center justify-center p-4" role="dialog" aria-label="Adicionar Aparelho">
          <div className="card w-full max-w-lg overflow-hidden">
            <div className="p-5 md:p-6 border-b border-[color:var(--edge)] flex items-center justify-between">
              <h3 className="title-font text-2xl">Adicionar Aparelho</h3>
              <button className="btn text-gray-300 hover:text-white focus-vis" onClick={closeAddModal}>✕</button>
            </div>
            <div className="p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="img-frame w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center">
                  {addForm.photo ? (
                    <img alt="Prévia do aparelho" className="w-full h-full object-cover" src={addForm.photo} />
                  ) : (
                    <div className="text-gray-500 text-xs text-center px-2">Sem foto</div>
                  )}
                </div>
                <label className="btn px-3 py-2 rounded-md border border-gray-600/60 text-gray-200 hover:bg-white/5 cursor-pointer focus-vis">
                  Selecionar foto
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
                </label>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Nome do aparelho</label>
                <input value={addForm.name} onChange={(e)=> setAddForm((p)=> ({...p, name:e.target.value}))} type="text" placeholder="Ex: Supino reto" className="focus-vis w-full px-3 py-2 rounded-md bg-[#0c0d0f] border border-[color:var(--edge)]" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Carga inicial (kg)</label>
                  <input value={addForm.start} onChange={(e)=> setAddForm((p)=> ({...p, start:e.target.value}))} type="number" inputMode="decimal" className="focus-vis ghost-input w-full px-3 py-2 rounded-md bg-[#0c0d0f] border border-[color:var(--edge)]" placeholder="Opcional" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Grupo muscular</label>
                  <input value={addForm.group} onChange={(e)=> setAddForm((p)=> ({...p, group:e.target.value}))} type="text" className="focus-vis w-full px-3 py-2 rounded-md bg-[#0c0d0f] border border-[color:var(--edge)]" placeholder="Ex: Peito" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Plano de progressão</label>
                <select value={addForm.plan} onChange={(e)=> setAddForm((p)=> ({...p, plan:e.target.value}))} className="focus-vis w-full px-3 py-2 rounded-md bg-[#0c0d0f] border border-[color:var(--edge)]">
                  <option value="linear">Linear +2,5 kg</option>
                  <option value="double">Duplo progresso (reps→peso)</option>
                  <option value="531">5/3/1 lite</option>
                </select>
              </div>
            </div>
            <div className="p-5 md:p-6 border-t border-[color:var(--edge)] flex items-center justify-end gap-3">
              <button className="btn px-4 py-2 rounded-md border border-gray-600/60 text-gray-300 hover:bg-white/5 focus-vis" onClick={closeAddModal}>Cancelar</button>
              <button className="btn bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md focus-vis" onClick={saveAddForm}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
