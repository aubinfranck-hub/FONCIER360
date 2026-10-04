import React, { useState } from 'react';
import { useFoncier } from '../context/FoncierContext';
import { TarifReference, DossierFoncier } from '../types/foncier360';
import {
  ShieldAlert,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  FileCheck2,
  ExternalLink,
  Edit2,
  Save,
  Lock,
  History,
  Sliders,
  AlertTriangle
} from 'lucide-react';

interface AdminDashboardProps {
  onOpenReport: (dossier: DossierFoncier) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenReport }) => {
  const {
    currentUser,
    dossiers,
    tarifs,
    auditLogs,
    mettreAJourTarif,
    validerRapportSenior
  } = useFoncier();

  const [activeTab, setActiveTab] = useState<'VALIDATION' | 'FINANCE' | 'TARIFS' | 'AUDIT'>('VALIDATION');
  const [editingTarifId, setEditingTarifId] = useState<string | null>(null);
  const [editTarifForm, setEditTarifForm] = useState<Partial<TarifReference>>({});

  // Filtrage des dossiers nécessitant validation senior
  const dossiersEnValidation = dossiers.filter(
    (d) => d.statut === 'VALIDATION_SENIOR' || d.rapportFinal?.statut === 'SOUMIS_VALIDATION'
  );

  // Calculs financiers
  const totalCA = dossiers.reduce((acc, d) => (d.paiement.statut === 'SUCCESS' ? acc + d.paiement.totalTtcCfa : acc), 0);
  const totalDebours = dossiers.reduce((acc, d) => (d.paiement.statut === 'SUCCESS' ? acc + d.paiement.deboursAdministratifsCfa : acc), 0);
  const totalHonoraires = dossiers.reduce((acc, d) => (d.paiement.statut === 'SUCCESS' ? acc + d.paiement.honorairesFoncier360Cfa : acc), 0);
  const totalBloques = dossiers.filter(
    (d) =>
      d.anomalies.some((a) => a.gravite === 'BLOQUANT' && a.statut !== 'RESOLUE') ||
      d.lotissementCheck.statut === 'EN_SURSIS'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Admin */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-slate-900">Console Direction & Gouvernance</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">
              Accès Privilégié (RBAC)
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Supervision des validations sensibles, pilotage financier, gestion des tarifs officiels et audit trail immuable.
          </p>
        </div>

        {/* Segmented Controls pour sous-écrans */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('VALIDATION')}
            className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-colors ${
              activeTab === 'VALIDATION' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Validation Senior ({dossiersEnValidation.length})
          </button>
          <button
            onClick={() => setActiveTab('FINANCE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-colors ${
              activeTab === 'FINANCE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Finances & Débours
          </button>
          <button
            onClick={() => setActiveTab('TARIFS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-colors ${
              activeTab === 'TARIFS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Référentiel Tarifs ({tarifs.length})
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-colors ${
              activeTab === 'AUDIT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Journal d'Audit ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Dossiers Actifs</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{dossiers.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">En cours d'instruction</div>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Cas Bloquants / Sursis</span>
          </span>
          <div className="text-2xl font-bold text-amber-900 mt-1">{totalBloques}</div>
          <div className="text-[11px] text-amber-700 mt-1">Interdiction conclusion favorable auto</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Chiffre d'Affaires</span>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{totalCA.toLocaleString('fr-FR')} F</div>
          <div className="text-[11px] text-slate-400 mt-1">Honoraires nets : {totalHonoraires.toLocaleString('fr-FR')} F</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Débours Conservations</span>
          <div className="text-2xl font-bold text-slate-800 mt-1">{totalDebours.toLocaleString('fr-FR')} F</div>
          <div className="text-[11px] text-slate-400 mt-1">Avances administratives DGI/MCLU</div>
        </div>
      </div>

      {/* TAB 1 : VALIDATION SENIOR */}
      {activeTab === 'VALIDATION' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-bold text-sm text-slate-900">
              Guichet de Validation Senior & Arbitrage Juridique
            </h3>
            <p className="text-xs text-slate-500">
              Règle : Tout dossier présentant une anomalie bloquante ou un lotissement en sursis doit être formellement validé par la Direction.
            </p>
          </div>

          {dossiersEnValidation.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <CheckCircle className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
              <p>Aucun dossier en attente d'approbation senior pour l'instant.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dossiersEnValidation.map((dossier) => (
                <div key={dossier.id} className="p-4 rounded-lg border border-amber-300 bg-amber-50/40 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-200 pb-2">
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-sm">{dossier.numeroDossier}</span>
                      <span className="text-slate-600 ml-2">
                        {dossier.parcelle.commune} · {dossier.parcelle.lotissementNom} (Lot {dossier.parcelle.lot} Îlot {dossier.parcelle.ilot})
                      </span>
                    </div>
                    <span className="font-semibold text-amber-900 px-2 py-0.5 rounded bg-amber-200 font-mono text-[10px]">
                      {dossier.lotissementCheck.statut}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="font-semibold">Anomalies bloquantes détectées :</span>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-red-900">
                        {dossier.anomalies
                          .filter((a) => a.gravite === 'BLOQUANT')
                          .map((a) => (
                            <li key={a.id}>
                              <span className="font-semibold">{a.titre}</span> : {a.description}
                            </li>
                          ))}
                      </ul>
                    </div>

                    <div>
                      <span className="font-semibold">Notes confidentielles des experts :</span>
                      <p className="italic text-slate-600 mt-1">
                        {dossier.notesInternesExpert || 'Aucune note interne additionnelle.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions de validation senior */}
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-amber-200">
                    <button
                      onClick={() => onOpenReport(dossier)}
                      className="px-3 py-1.5 border border-slate-300 bg-white rounded text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                    >
                      Examiner le Projet de Rapport
                    </button>
                    <button
                      onClick={() => validerRapportSenior(dossier.id, false, 'Dossier renvoyé pour enquête complémentaire.')}
                      className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded cursor-pointer font-medium"
                    >
                      Rejeter / Demander Complément
                    </button>
                    <button
                      onClick={() => validerRapportSenior(dossier.id, true, 'Validation senior avec réserves expresses.')}
                      className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded cursor-pointer font-semibold shadow-sm"
                    >
                      Approuver & Signer Électroniquement
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2 : FINANCES & DEBOURS */}
      {activeTab === 'FINANCE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Comptabilité des Débours & Ventilation</h3>
            <p className="text-slate-500">
              Règle : Séparer impérativement les honoraires FONCIER 360 des débours administratifs légaux et frais techniques.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-200">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-2 border-b">N° Dossier</th>
                  <th className="p-2 border-b">Client</th>
                  <th className="p-2 border-b text-right">Honoraires F360</th>
                  <th className="p-2 border-b text-right">Débours Officiels</th>
                  <th className="p-2 border-b text-right">Déplacement</th>
                  <th className="p-2 border-b text-right">Prestations Tech</th>
                  <th className="p-2 border-b text-right font-bold">Total TTC</th>
                  <th className="p-2 border-b text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dossiers.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="p-2 font-mono font-semibold text-slate-900">{d.numeroDossier}</td>
                    <td className="p-2 text-slate-700">{d.client.name}</td>
                    <td className="p-2 text-right font-mono text-emerald-800 font-medium">
                      {d.paiement.honorairesFoncier360Cfa.toLocaleString('fr-FR')} F
                    </td>
                    <td className="p-2 text-right font-mono text-slate-600">
                      {d.paiement.deboursAdministratifsCfa.toLocaleString('fr-FR')} F
                    </td>
                    <td className="p-2 text-right font-mono text-slate-600">
                      {d.paiement.deplacementTerrainCfa.toLocaleString('fr-FR')} F
                    </td>
                    <td className="p-2 text-right font-mono text-slate-600">
                      {d.paiement.prestationsTechniquesCfa.toLocaleString('fr-FR')} F
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900">
                      {d.paiement.totalTtcCfa.toLocaleString('fr-FR')} F
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        d.paiement.statut === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {d.paiement.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3 : RÉFÉRENTIEL TARIFS */}
      {activeTab === 'TARIFS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Référentiel des Tarifs Administratifs Officiels</h3>
            <p className="text-slate-500">
              Règle : Ne jamais coder les tarifs en dur. Conserver source, date d'effet et URL officielle. Si non vérifié, afficher « À CONFIRMER ».
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-200">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-2.5 border-b">Service Administratif</th>
                  <th className="p-2.5 border-b">Libellé de la prestation</th>
                  <th className="p-2.5 border-b text-right">Montant (FCFA)</th>
                  <th className="p-2.5 border-b">Source officielle / Arrêté</th>
                  <th className="p-2.5 border-b">Vérifié le</th>
                  <th className="p-2.5 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tarifs.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-semibold text-slate-900">{t.service}</td>
                    <td className="p-2.5 text-slate-700">{t.libelle}</td>
                    <td className="p-2.5 text-right font-mono font-bold">
                      {editingTarifId === t.id ? (
                        <input
                          type="number"
                          value={editTarifForm.montantCfa ?? t.montantCfa}
                          onChange={(e) => setEditTarifForm({ ...editTarifForm, montantCfa: Number(e.target.value) })}
                          className="w-24 border rounded px-1.5 py-0.5 text-right font-mono text-xs"
                        />
                      ) : t.estMontantOfficielVerifie ? (
                        `${t.montantCfa.toLocaleString('fr-FR')} FCFA`
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-sans font-semibold">
                          A CONFIRMER
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-slate-600">
                      <div>{t.sourceOfficielle}</div>
                      {t.urlOfficielle && (
                        <a
                          href={t.urlOfficielle}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span>Lien portail</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="p-2.5 text-slate-500 font-mono text-[11px]">{t.dateDerniereVerification}</td>
                    <td className="p-2.5 text-center">
                      {editingTarifId === t.id ? (
                        <button
                          onClick={() => {
                            mettreAJourTarif(t.id, editTarifForm);
                            setEditingTarifId(null);
                          }}
                          className="px-2 py-1 bg-emerald-700 text-white rounded font-medium cursor-pointer"
                        >
                          Sauvegarder
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingTarifId(t.id);
                            setEditTarifForm({ montantCfa: t.montantCfa, estMontantOfficielVerifie: true });
                          }}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                          title="Modifier le tarif officiel"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4 : JOURNAL D'AUDIT IMMUABLE */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Journal d'Audit Immuable (Audit Trail)</h3>
              <p className="text-slate-500">
                Horodatage cryptographique de chaque décision, consultation, anomalie et validation.
              </p>
            </div>
            <span className="font-mono text-xs text-slate-400">Total : {auditLogs.length} événements</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{log.action}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-medium text-emerald-800">{log.userName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({log.userRole})</span>
                    {log.dossierId && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-mono text-slate-600">
                        {log.dossierId}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600">{log.details}</p>
                </div>
                <div className="text-right text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
