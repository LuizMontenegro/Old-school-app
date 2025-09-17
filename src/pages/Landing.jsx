import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const [userText, setUserText] = useState('');
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    // Replicar displayUserInfo() do index.html raiz
    function displayUserInfo() {
      const loggedUser = localStorage.getItem('osg.user.logged');
      if (loggedUser) {
        try {
          const userData = JSON.parse(loggedUser);
          if (userData?.email) {
            setUserText(`👋 Olá, ${userData.email}!`);
            return;
          }
        } catch {}
      }
      const onboardData = localStorage.getItem('osg.onboard.v1');
      if (onboardData) {
        try {
          const data = JSON.parse(onboardData);
          if (data?.profileName) {
            setUserText(`👋 Olá, ${data.profileName}!`);
            return;
          }
          if (data?.goals?.length) {
            setUserText(`🎯 Seus objetivos: ${data.goals.join(', ')}`);
            return;
          }
        } catch {}
      }
      setUserText('');
    }

    function checkData() {
      const hasOnboarding = localStorage.getItem('osg.onboard.v1');
      const hasExercises = localStorage.getItem('osg.exercises.v3');
      const hasUser = localStorage.getItem('osg.user.logged');
      setCanContinue(Boolean(hasOnboarding || hasExercises || hasUser));
    }

    displayUserInfo();
    checkData();
  }, []);

  const continueClasses = useMemo(() => {
    if (canContinue) return 'btn bg-green-600 hover:bg-green-500 text-white';
    return 'btn border border-yellow-600/50 text-yellow-200 hover:bg-yellow-600/10';
  }, [canContinue]);

  return (
    <div className="grid-lines flex items-center justify-center p-5">
      <main className="w-full max-w-2xl text-center fade-in">
        <header className="flex items-center justify-center gap-4 mb-8">
          <span className="kettlebell" aria-hidden="true" style={{ width:60, height:60, display:'inline-block' }}>
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ef4444"/><stop offset="1" stopColor="#f59e0b"/></linearGradient></defs>
              <path d="M18 26a14 14 0 1 1 28 0v6H18v-6z" stroke="url(#g1)" strokeWidth="4"/>
              <rect x="10" y="30" width="44" height="28" rx="12" fill="url(#g1)" opacity=".18" stroke="#ef4444" strokeWidth="2"/>
              <circle cx="20" cy="44" r="6" fill="#ef4444" opacity=".6"/>
              <circle cx="44" cy="44" r="6" fill="#f59e0b" opacity=".6"/>
            </svg>
          </span>
          <div>
            <h1 className="title-font text-6xl md:text-7xl text-white tracking-wide">OLD SCHOOL GYM</h1>
            <p className="text-lg text-gray-400 -mt-2">Sistema de Gestão de Treinos</p>
          </div>
        </header>

        <section className="card p-8 mb-8">
          <div className={`mb-4 p-3 rounded-lg bg-blue-900/20 border border-blue-700/30 ${userText? '' : 'hidden'}`}>
            <p className="text-blue-200 font-medium">{userText}</p>
          </div>

          <h2 className="title-font text-3xl text-white mb-4">Bem-vindo ao seu Gestor de Treinos</h2>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Gerencie seus exercícios, acompanhe sua progressão e registre suas sessões de treino.
            Tudo salvo localmente no seu navegador, sem necessidade de login ou cadastro.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-lg border border-gray-700/50 bg-gray-800/20">
              <span className="text-2xl mb-2 block">📊</span>
              <h3 className="font-semibold text-white mb-1">Progressão</h3>
              <p className="text-sm text-gray-400">Acompanhe seus recordes e evolução</p>
            </div>
            <div className="p-4 rounded-lg border border-gray-700/50 bg-gray-800/20">
              <span className="text-2xl mb-2 block">🏋️‍♂️</span>
              <h3 className="font-semibold text-white mb-1">Exercícios</h3>
              <p className="text-sm text-gray-400">Gerencie seus aparelhos favoritos</p>
            </div>
            <div className="p-4 rounded-lg border border-gray-700/50 bg-gray-800/20">
              <span className="text-2xl mb-2 block">📝</span>
              <h3 className="font-semibold text-white mb-1">Sessões</h3>
              <p className="text-sm text-gray-400">Registre seus treinos diários</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="btn bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-lg font-medium">
              Fazer Login
            </Link>
            <Link to="/setup" className="btn border border-gray-600/60 text-gray-200 hover:bg-white/5 px-8 py-3 rounded-lg font-medium">
              Entrar sem Login
            </Link>
            <Link to="/app" className={`${continueClasses} px-8 py-3 rounded-lg font-medium`} style={{ display: canContinue ? 'inline-block' : 'none' }}>
              🚀 Continuar no App
            </Link>
          </div>
        </section>

        <footer className="text-center text-gray-500 text-sm">
          <p>Tudo é salvo localmente no seu navegador. Sem login, sem senha, sem complicação.</p>
          <p className="mt-2">Old School Gym © 2025</p>
        </footer>
      </main>
    </div>
  );
}

