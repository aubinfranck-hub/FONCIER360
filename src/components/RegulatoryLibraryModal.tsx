import React from 'react';
import { useFoncier } from '../context/FoncierContext';
import { X, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';

interface RegulatoryLibraryModalProps {
  onClose: () => void;
}

export const RegulatoryLibraryModal: React.FC<RegulatoryLibraryModalProps> = ({ onClose }) => {
  const { reglementations } = useFoncier();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-slate-300 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-800 flex items-center justify-center text-emerald-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base">Référentiel Légal & Réglementaire Officiel</h2>
              <p className="text-xs text-slate-400">Sources officielles de la République de Côte d'Ivoire</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Engagement de conformité FONCIER 360 :</p>
              <p className="text-slate-600 mt-0.5">
                Chaque analyse, contrôle foncier ou rapport d'urbanisme s'appuie exclusivement sur les lois, décrets et arrêtés
                en vigueur en Côte d'Ivoire. Aucune réglementation n'est inventée ou simulée.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {reglementations.map((reg) => (
              <div key={reg.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono font-semibold text-emerald-800 block">
                      {reg.numeroRef}
                    </span>
                    <h4 className="font-semibold text-slate-900 text-sm mt-0.5">{reg.titre}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{reg.resume}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <span>Portail : {reg.portailSource}</span>
                      <span aria-hidden="true">·</span>
                      <span>Adopté le : {new Date(reg.dateAdoption).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <a
                    href={reg.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors shrink-0"
                    title="Consulter le portail officiel"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Portails institutionnels recommandés */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Portails Gouvernementaux Partenaires
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <a
                href="https://www.construction.gouv.ci/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded border border-slate-200 hover:border-emerald-500 flex items-center justify-between text-slate-700 hover:text-emerald-800"
              >
                <span>Ministère de la Construction (MCLU)</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a
                href="https://idufci.construction.gouv.ci/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded border border-slate-200 hover:border-emerald-500 flex items-center justify-between text-slate-700 hover:text-emerald-800"
              >
                <span>Portail National IDUFCI</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a
                href="https://servicepublic.gouv.ci/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded border border-slate-200 hover:border-emerald-500 flex items-center justify-between text-slate-700 hover:text-emerald-800"
              >
                <span>Service Public Côte d'Ivoire</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a
                href="https://dgi.gouv.ci/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded border border-slate-200 hover:border-emerald-500 flex items-center justify-between text-slate-700 hover:text-emerald-800"
              >
                <span>Direction Générale des Impôts (DGI Cadastre)</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
