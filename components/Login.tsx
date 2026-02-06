
import React, { useState } from 'react';
import { User, Lock, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  error?: string;
}

export const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="bg-green-700 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3">
             <img 
                src="https://adra.org.nz/wp-content/uploads/2021/08/ADRA-Horizontal-Logo.png" 
                alt="Logo"
                className="w-12 brightness-200 contrast-200 grayscale opacity-80" 
             />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">ADRA Report Builder</h1>
        <p className="text-slate-500 mt-2">Sign in to access the system</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
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
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-xs text-slate-400">
        © 2025 ADRA Bangladesh. Internal Use Only.
      </p>
    </div>
  );
};
