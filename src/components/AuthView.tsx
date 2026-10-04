import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useFoncier } from '../context/FoncierContext';

export const AuthView: React.FC = () => {
  const { login, register } = useFoncier();
  const [mode,setMode]=useState<'LOGIN'|'REGISTER'>('LOGIN');
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault(); setError('');
    const ok=mode==='LOGIN' ? await login(email,password) : await register(name,email,password);
    if(!ok) setError(mode==='LOGIN'?'Identifiants invalides ou compte désactivé.':'Inscription impossible. Vérifiez les informations.');
  };
  return <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
    <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-8"><div className="w-11 h-11 rounded-xl bg-emerald-900 text-white flex items-center justify-center"><ShieldCheck/></div><div><h1 className="font-bold text-xl">FONCIER 360</h1><p className="text-xs text-slate-500">Espace sécurisé</p></div></div>
      {mode==='REGISTER' && <input value={name} onChange={e=>setName(e.target.value)} required placeholder="Nom complet" className="w-full border rounded-lg px-4 py-3 mb-3"/>}
      <input value={email} onChange={e=>setEmail(e.target.value)} required type="email" placeholder="Email" className="w-full border rounded-lg px-4 py-3 mb-3"/>
      <input value={password} onChange={e=>setPassword(e.target.value)} required minLength={10} type="password" placeholder="Mot de passe (10 caractères minimum)" className="w-full border rounded-lg px-4 py-3 mb-4"/>
      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
      <button className="w-full bg-emerald-900 text-white rounded-lg py-3 font-semibold">{mode==='LOGIN'?'Se connecter':'Créer mon compte'}</button>
      <button type="button" onClick={()=>setMode(mode==='LOGIN'?'REGISTER':'LOGIN')} className="w-full mt-4 text-sm text-emerald-800 underline">{mode==='LOGIN'?'Créer un compte client':'J’ai déjà un compte'}</button>
    </form>
  </div>;
};