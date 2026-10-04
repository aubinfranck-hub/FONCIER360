import React, { useState } from 'react';
import { FoncierProvider, useFoncier } from './context/FoncierContext';
import { Navbar } from './components/Navbar';
import { ClientView } from './components/ClientView';
import { ExpertWorkspace } from './components/ExpertWorkspace';
import { AdminDashboard } from './components/AdminDashboard';
import { BusinessTestSuite } from './components/BusinessTestSuite';
import { ReportModal } from './components/ReportModal';
import { RegulatoryLibraryModal } from './components/RegulatoryLibraryModal';
import { DossierFoncier } from './types/foncier360';
import { ShieldCheck } from 'lucide-react';
import { AuthView } from './components/AuthView';


const PaymentReturn: React.FC<{ success: boolean }> = ({ success }) => {
  const { isProductionApi, isAuthenticated, dossiers } = useFoncier();
  const [status, setStatus] = useState('PENDING');
  const [checking, setChecking] = useState(true);
  const params = new URLSearchParams(window.location.search);
  const reference = params.get('reference');
  useEffect(() => {
    if (!isProductionApi || !isAuthenticated || !reference) { setChecking(false); return; }
    let cancelled=false;
    const check=async()=>{
      const token=localStorage.getItem('foncier360_access_token');
      const api=import.meta.env.VITE_API_URL;
      if(!token || !api) { setChecking(false); return; }
      try {
        const r=await fetch(api+'/api/payments/'+encodeURIComponent(reference)+'/status',{headers:{Authorization:'Bearer '+token}});
        if(r.ok){ const data=await r.json(); if(!cancelled) setStatus(data.status); }
      } finally { if(!cancelled) setChecking(false); }
    };
    check();
    const timer=window.setInterval(check,5000);
    const timeout=window.setTimeout(()=>window.clearInterval(timer),300000);
    return()=>{cancelled=true;window.clearInterval(timer);window.clearTimeout(timeout);};
  },[isProductionApi,isAuthenticated,reference]);
  const done=status==='SUCCESS';
  return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
    <div className="max-w-lg w-full bg-white text-slate-900 rounded-2xl p-8 shadow-2xl text-center">
      <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${done?'bg-emerald-100':'bg-amber-100'}`}>
        {done ? <span className="text-2xl">✓</span> : <span className="text-2xl">…</span>}
      </div>
      <h1 className="text-xl font-bold">{success ? (done?'Paiement confirmé':'Paiement en cours de confirmation') : 'Paiement non confirmé'}</h1>
      <p className="text-sm text-slate-500 mt-2">{reference ? 'Référence : '+reference : 'Référence de paiement absente.'}</p>
      <p className="text-xs text-slate-500 mt-4">{done ? 'Votre dossier peut maintenant poursuivre son instruction.' : checking ? 'Vérification de la transaction…' : 'La confirmation définitive dépend du webhook Jèko. Ne payez pas une seconde fois tant que le statut n’est pas clarifié.'}</p>
      <button onClick={()=>window.location.href='/'} className="mt-6 px-5 py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-semibold">Retour à FONCIER 360</button>
    </div>
  </div>;
};

const MainContent: React.FC = () => {
  const { isProductionApi, authLoading, isAuthenticated } = useFoncier();
  const [activeTab, setActiveTab] = useState<'CLIENT' | 'EXPERT' | 'ADMIN' | 'TEST_SUITE'>('CLIENT');
  const [reportModalDossier, setReportModalDossier] = useState<DossierFoncier | null>(null);
  const [showRegulationsModal, setShowRegulationsModal] = useState<boolean>(false);
  if (isProductionApi && authLoading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Chargement sécurisé…</div>;
  if (isProductionApi && !isAuthenticated) return <AuthView />;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation principale */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRegulations={() => setShowRegulationsModal(true)}
      />

      {/* Corps dynamique selon l'onglet actif */}
      <main className="flex-1 pb-16">
        {activeTab === 'CLIENT' && (
          <ClientView onOpenReport={(dossier) => setReportModalDossier(dossier)} />
        )}
        {activeTab === 'EXPERT' && (
          <ExpertWorkspace onOpenReport={(dossier) => setReportModalDossier(dossier)} />
        )}
        {activeTab === 'ADMIN' && (
          <AdminDashboard onOpenReport={(dossier) => setReportModalDossier(dossier)} />
        )}
        {activeTab === 'TEST_SUITE' && (
          <BusinessTestSuite
            onOpenReport={(dossier) => setReportModalDossier(dossier)}
            onNavigateToExpert={() => setActiveTab('EXPERT')}
          />
        )}
      </main>

      {/* Modal Rapport d'audit officiel */}
      {reportModalDossier && (
        <ReportModal
          dossier={reportModalDossier}
          onClose={() => setReportModalDossier(null)}
        />
      )}

      {/* Modal Référentiel réglementaire officiel */}
      {showRegulationsModal && (
        <RegulatoryLibraryModal onClose={() => setShowRegulationsModal(false)} />
      )}

      {/* Footer institutionnel avec clauses de neutralité */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-emerald-800 text-emerald-300 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-white">FONCIER 360 · Côte d'Ivoire</div>
              <p className="text-[11px] text-slate-500">
                Plateforme de due diligence foncière & urbanistique indépendante
              </p>
            </div>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-500 max-w-xl">
            <p>
              FONCIER 360 n'est ni un office notarial, ni une autorité administrative, ni un registre foncier. Les rapports
              produits synthétisent les diligences documentaires, cadastrales et physiques contradictoires et ne constituent
              pas une garantie légale de propriété.
            </p>
            <div className="flex items-center justify-center md:justify-end gap-3 mt-2 text-slate-400">
              <button
                onClick={() => setShowRegulationsModal(true)}
                className="hover:text-emerald-400 underline cursor-pointer"
              >
                Code de l'Urbanisme 2020 & Loi 2024-351
              </button>
              <span aria-hidden="true">·</span>
              <a
                href="https://idufci.construction.gouv.ci/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 underline"
              >
                Portail IDUFCI
              </a>
              <span aria-hidden="true">·</span>
              <a
                href="https://www.construction.gouv.ci/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 underline"
              >
                Ministère de la Construction
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  const path=window.location.pathname;
  return (
    <FoncierProvider>
      {path === '/payment/success' ? <PaymentReturn success /> : path === '/payment/error' ? <PaymentReturn success={false} /> : <MainContent />}
    </FoncierProvider>
  );
}
