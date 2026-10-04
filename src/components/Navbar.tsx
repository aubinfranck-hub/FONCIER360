import React, { useState } from 'react';
import { useFoncier } from '../context/FoncierContext';
import { UserRole } from '../types/foncier360';
import {
  ShieldCheck,
  Building2,
  UserCheck,
  Search,
  BookOpen,
  FileCheck2,
  RefreshCw,
  Clock,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'CLIENT' | 'EXPERT' | 'ADMIN' | 'TEST_SUITE';
  setActiveTab: (tab: 'CLIENT' | 'EXPERT' | 'ADMIN' | 'TEST_SUITE') => void;
  onOpenRegulations: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenRegulations }) => {
  const {
    currentUser,
    setCurrentUserRole,
    dossiers,
    selectedDossierId,
    setSelectedDossierId,
    reinitialiserDonnees,
    isProductionApi,
    logout
  } = useFoncier();

  const [searchQuery, setSearchQuery] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'CLIENT', label: 'Client / Diaspora', desc: 'Demandeur de vérification foncière' },
    { role: 'EXPERT_FONCIER', label: 'Expert Foncier', desc: 'Analyse domaniale & titres' },
    { role: 'EXPERT_URBANISME', label: 'Expert Urbanisme', desc: 'PUD, VET & constructibilité' },
    { role: 'AGENT_TERRAIN', label: 'Agent Terrain', desc: 'Constat bornes & GPS' },
    { role: 'VALIDATEUR', label: 'Validateur Senior', desc: 'Directeur qualité & signataire' },
    { role: 'ADMIN', label: 'Administrateur', desc: 'Supervision globale & tarifs' }
  ];

  const filteredDossiers = dossiers.filter((d) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      d.numeroDossier.toLowerCase().includes(q) ||
      d.parcelle.commune.toLowerCase().includes(q) ||
      d.parcelle.lotissementNom.toLowerCase().includes(q) ||
      (d.parcelle.lot && d.parcelle.lot.toLowerCase().includes(q)) ||
      (d.parcelle.ilot && d.parcelle.ilot.toLowerCase().includes(q)) ||
      (d.parcelle.idufciFourni && d.parcelle.idufciFourni.toLowerCase().includes(q)) ||
      d.client.name.toLowerCase().includes(q)
    );
  });

  // Nombre de dossiers bloqués nécessitant attention
  const blockedCount = dossiers.filter(
    (d) =>
      d.anomalies.some((a) => a.gravite === 'BLOQUANT' && a.statut !== 'RESOLUE') ||
      d.lotissementCheck.statut === 'EN_SURSIS'
  ).length;

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40">
      {/* Top Banner : Avertissement officiel & neutralité institutionnelle */}
      <div className="bg-slate-950 px-4 py-1 text-xs text-slate-400 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-400">RÉPUBLIQUE DE CÔTE D'IVOIRE</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Plateforme indépendante de due diligence foncière & urbanistique</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-amber-400/90 font-medium">Non substituable à la Conservation Foncière ou aux Notaires</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenRegulations}
            className="hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Référentiel Juridique (Lois 2020 & 2024)</span>
          </button>
          <span aria-hidden="true" className="text-slate-700">·</span>
          {!isProductionApi && <button
            onClick={reinitialiserDonnees}
            title="Réinitialiser toutes les données au référentiel d'origine"
            className="hover:text-slate-200 flex items-center gap-1 text-slate-400 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Réinitialiser démo</span>
          </button>}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-800/90 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shadow-inner">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-lg text-white font-serif">FONCIER 360</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700/50 text-emerald-300 font-mono">
                CI v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Due Diligence & Workflow Expert</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Recherche dossier, lot, îlot, commune, IDUFCI, client..."
              className="w-full bg-slate-800/90 border border-slate-700 text-sm text-slate-200 rounded-md pl-9 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          {/* Quick Search Dropdown */}
          {filteredDossiers.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-md shadow-xl py-1 z-50 max-h-64 overflow-y-auto">
              <div className="px-3 py-1 text-[11px] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                Résultats trouvés ({filteredDossiers.length})
              </div>
              {filteredDossiers.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDossierId(d.id);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-center justify-between border-b border-slate-800/40 last:border-0"
                >
                  <div>
                    <span className="font-semibold text-emerald-400">{d.numeroDossier}</span>
                    <span className="text-slate-300 ml-2">
                      {d.parcelle.commune} · Lot {d.parcelle.lot || '?'} Îlot {d.parcelle.ilot || '?'}
                    </span>
                    <div className="text-[11px] text-slate-500">
                      {d.client.name} · {d.parcelle.lotissementNom}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{d.statut}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Tabs (Functional segmented tabs) */}
        <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
          <button
            onClick={() => setActiveTab('CLIENT')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
              activeTab === 'CLIENT'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            Espace Client
          </button>
          {!isProductionApi || ['EXPERT_FONCIER','EXPERT_URBANISME','TECHNICIEN_TOPO','AGENT_TERRAIN','JURISTE','VALIDATEUR','ADMIN'].includes(currentUser.role) ? <button
            onClick={() => setActiveTab('EXPERT')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'EXPERT'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <span>Atelier Expert</span>
            {blockedCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400" title={`${blockedCount} dossiers en sursis ou avec anomalie bloquante`} />
            )}
          </button> : null}
          {(!isProductionApi || ['ADMIN','VALIDATEUR'].includes(currentUser.role)) && <button
            onClick={() => setActiveTab('ADMIN')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
              activeTab === 'ADMIN'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            Admin & Tarifs
          </button>}
          {!isProductionApi && <button
            onClick={() => setActiveTab('TEST_SUITE')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'TEST_SUITE'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>10 Cas de Test</span>
          </button>}
        </nav>

        <div className="relative">
          {isProductionApi ? (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-xs">
                <div className="font-medium text-slate-200">{currentUser.name}</div>
                <div className="text-[10px] text-emerald-400">{currentUser.role}</div>
              </div>
              <button onClick={logout} className="px-3 py-1.5 rounded-md border border-slate-700 text-xs text-slate-300 hover:bg-slate-800">Déconnexion</button>
            </div>
          ) : (
            <>
              <button onClick={() => setShowRoleMenu(!showRoleMenu)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors text-xs text-left cursor-pointer">
                <div className="w-6 h-6 rounded bg-emerald-900 border border-emerald-600/40 flex items-center justify-center text-emerald-300 font-bold text-[10px]">{currentUser.role.substring(0, 2)}</div>
                <div className="hidden sm:block"><div className="font-medium text-slate-200 text-xs">{currentUser.name}</div><div className="text-[10px] text-emerald-400">{currentUser.role}</div></div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {showRoleMenu && <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-2 z-50">
                <div className="px-3 pb-2 mb-1 border-b border-slate-800"><span className="text-[11px] font-semibold text-slate-400 uppercase">Changer de rôle (démo uniquement)</span></div>
                {roles.map((r) => <button key={r.role} onClick={() => { setCurrentUserRole(r.role); setShowRoleMenu(false); if (r.role==='CLIENT') setActiveTab('CLIENT'); else if (['EXPERT_FONCIER','EXPERT_URBANISME','AGENT_TERRAIN'].includes(r.role)) setActiveTab('EXPERT'); else if (['ADMIN','VALIDATEUR'].includes(r.role)) setActiveTab('ADMIN'); }} className={`w-full text-left px-3 py-2 text-xs ${currentUser.role===r.role?'bg-emerald-950/60 text-emerald-300':'text-slate-300 hover:bg-slate-800'}`}>{r.label}</button>)}
              </div>}
            </>
          )}
        </div>      </div>
    </header>
  );
};
