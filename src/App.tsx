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

const MainContent: React.FC = () => {
  const { isProductionApi, authLoading, isAuthenticated } = useFoncier();
  if (isProductionApi && authLoading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Chargement sécurisé…</div>;
  if (isProductionApi && !isAuthenticated) return <AuthView />;
  const [activeTab, setActiveTab] = useState<'CLIENT' | 'EXPERT' | 'ADMIN' | 'TEST_SUITE'>('CLIENT');
  const [reportModalDossier, setReportModalDossier] = useState<DossierFoncier | null>(null);
  const [showRegulationsModal, setShowRegulationsModal] = useState<boolean>(false);

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
  return (
    <FoncierProvider>
      <MainContent />
    </FoncierProvider>
  );
}
