
import React, { useState } from 'react';
import { User, Lock, ArrowRight } from 'lucide-react';
import logo from '../assets/ADRA-Horizontal-Logo.png';


interface LoginProps {
  onLogin: (username: string, password: string) => void;
  error?: string;
}

export const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const currentYear = new Date().getFullYear();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-1">
      <div className="mb-4 text-center">
        <div className="w-60 h-40 rounded-xl flex items-center justify-center mx-auto ">
          <img
            src={logo}
            alt="Logo"
            className="w-50 brightness-900 contrast-200 opacity-80 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.2] hover:drop-shadow-lg"
          />
        </div>
      </div>


      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-6 text-center">

          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Internal Report Builder
          </h1>

          <p className="text-slate-500 mb-2">
            Sign in to access the system
          </p>

          <div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all"
                placeholder="Enter your username"
                autoFocus
              />
            </div>
          </div>

          <div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            Sign In
            {/* <ArrowRight className="w-4 h-4" /> */}
          </button>

        </form>


        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          Powered by
          <span
            ref={(el) => {
              if (!el) return;

              el.style.background =
                'linear-gradient(90deg, #34A6F4 0%, #53EAFD 50%, #34A6F4 100%)';
              el.style.backgroundSize = '200% auto';
              el.style.webkitBackgroundClip = 'text';
              el.style.webkitTextFillColor = 'transparent';

              el.animate(
                [
                  { backgroundPosition: '-200% center' },
                  { backgroundPosition: '200% center' }
                ],
                {
                  duration: 3000,
                  iterations: Infinity
                }
              );
            }}
            onClick={() => window.open('https://onmoeon.vercel.app', '_blank')}
            className="text-sm font-semibold mx-2 cursor-pointer transition-transform duration-300 hover:-translate-y-0.5 hover:scale-105 inline-block"
          >
            ONMOEON
          </span>

        </div>
      </div>


      <p className="mt-8 text-xs text-slate-400">
        © {currentYear} {' '} v1.2.6
      </p>





    </div>
  );
};
