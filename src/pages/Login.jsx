import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = form.email.value;
    const password = form.password.value;
    if (email && password) {
      localStorage.setItem('osg.user.logged', JSON.stringify({ email, loginTime: Date.now() }));
      const onboardingDone = localStorage.getItem('osg.onboard.v1');
      if (onboardingDone) navigate('/app');
      else navigate('/setup');
    }
  }

  return (
    <div className="grid-lines flex items-center justify-center p-5">
      <main className="w-full max-w-md">
        <header className="flex items-center justify-center gap-3 mb-8">
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
            <h1 className="title-font text-4xl text-white tracking-wide">OLD SCHOOL GYM</h1>
            <p className="text-sm text-gray-400 -mt-1">Acesso ao sistema</p>
          </div>
        </header>

        <section className="card p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input type="email" id="email" name="email" required className="w-full px-3 py-2 rounded-md bg-[#0c0d0f] border border-[color:var(--edge)] focus:outline-none focus:ring-2 focus:ring-red-600 text-white" placeholder="seu@email.com" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
              <input type="password" id="password" name="password" required className="w-full px-3 py-2 rounded-md bg-[#0c0d0f] border border-[color:var(--edge)] focus:outline-none focus:ring-2 focus:ring-red-600 text-white" placeholder="••••••••" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                <input type="checkbox" className="accent-red-600" />
                Lembrar de mim
              </label>
              <a href="#" className="text-red-400 hover:text-red-300">Esqueceu a senha?</a>
            </div>
            <button type="submit" className="btn w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded-md font-medium">
              Entrar
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Não tem uma conta? <a href="#" className="text-red-400 hover:text-red-300">Cadastre-se</a>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-[color:var(--edge)]">
            <p className="text-center text-gray-400 text-sm mb-4">Ou continue com</p>
            <div className="grid grid-cols-2 gap-3">
              <button className="btn flex items-center justify-center gap-2 py-2 px-4 rounded-md border border-[color:var(--edge)] hover:bg:white/5 text-gray-300">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button className="btn flex items-center justify-center gap-2 py-2 px-4 rounded-md border border-[color:var(--edge)] hover:bg:white/5 text-gray-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
            </div>
          </div>
        </section>

        <footer className="text-center text-gray-500 text-xs mt-6">
          Primeira vez aqui? <Link to="/setup" className="text-red-400 hover:text-red-300">Entrar sem login</Link>
        </footer>
      </main>
    </div>
  );
}

