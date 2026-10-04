import React, { useState } from 'react';
import { useFoncier } from '../context/FoncierContext';
import { DossierFoncier } from '../types/foncier360';
import {
  FileCheck2,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronRight,
  Eye,
  RotateCcw
} from 'lucide-react';

interface BusinessTestSuiteProps {
  onOpenReport: (dossier: DossierFoncier) => void;
  onNavigateToExpert: () => void;
}

interface TestCaseDef {
  numero: number;
  titre: string;
  sousTitre: string;
  entree: string;
  workflow: string;
  resultatAttendu: string;
  anomaliesAttendues: string;
  decisionAttendue: string;
}

const TEST_CASES: TestCaseDef[] = [
  {
    numero: 1,
    titre: 'Cas 1 : Lotissement approuvé + documents cohérents',
    sousTitre: 'Parcelle Cocody Angré · Titre Foncier et ACD conformes',
    entree: 'Client acquéreur fournit un ACD au nom du vendeur Michel Kouame, Lot 45 Îlot 6, 600 m² à Cocody. IDUFCI concorde.',
    workflow: 'Création → Qualification → Paiement → Analyse Doc → Recherche Conserv. → Validation → Rapport.',
    resultatAttendu: 'Dossier fluide, 0 anomalie bloquante, vérification positive à la Conservation Foncière de Cocody.',
    anomaliesAttendues: 'Aucune anomalie bloquante.',
    decisionAttendue: 'Conclusion Favorable sous réserve des formalités notariales habituelles. Rapport validé.'
  },
  {
    numero: 2,
    titre: 'Cas 2 : Lotissement non retrouvé',
    sousTitre: 'Parcelle Anyama Ebimpé · Règle critique : NON_RETROUVE != ANNULE',
    entree: 'Parcelle dans un lotissement communal récent à Anyama. Non présent dans le SIGFU numérique actuel.',
    workflow: 'Création → Pré-vérification → Recherches administratives élargies aux archives physiques.',
    resultatAttendu: 'Statut du lotissement marqué NON_RETROUVE. Interdiction stricte de le qualifier d\'annulé.',
    anomaliesAttendues: 'Alerte VIGILANCE (REFERENCE_MANQUANTE). Ne pas créer d\'anomalie de fraude.',
    decisionAttendue: 'Rapport d\'étape avec réserves expresses : Recherches approfondies aux archives centrales en cours.'
  },
  {
    numero: 3,
    titre: 'Cas 3 : Lotissement annulé',
    sousTitre: 'Zone Aéroportuaire Port-Bouët · Arrêté ministériel d\'annulation formel',
    entree: 'Vendeur présente une lettre d\'attribution sur le lotissement Zone Aéroportuaire Sud.',
    workflow: 'Instruction expert → Consultation du Journal Officiel → Découverte de l\'arrêté d\'annulation.',
    resultatAttendu: 'Détection immédiate de l\'annulation ministérielle pour servitude aéroportuaire.',
    anomaliesAttendues: 'Anomalie BLOQUANTE : LOTISSEMENT_INCOHERENT / ANNULATION_OFFICIELLE.',
    decisionAttendue: 'Avis DEFAVORABLE catégorique. Interdiction stricte de conclusion favorable.'
  },
  {
    numero: 4,
    titre: 'Cas 4 : Lotissement en sursis',
    sousTitre: 'Bingerville Akouai Santai · Litige coutumier de délimitation',
    entree: 'Terrain à Akouai Santai avec attestation villageoise. Arrêté ministériel placé en sursis suite à contestation.',
    workflow: 'Création → Détection sursis → Bloquage conclusion standard → Tâche expert senior.',
    resultatAttendu: 'Blocage automatique de toute conclusion favorable. Escalade vers la direction qualité.',
    anomaliesAttendues: 'Anomalie BLOQUANTE : LOTISSEMENT_EN_SURSIS.',
    decisionAttendue: 'Validation senior obligatoire. Recommandation formelle de surseoir à l\'achat.'
  },
  {
    numero: 5,
    titre: 'Cas 5 : Lotissement appliqué non approuvé',
    sousTitre: 'Songon Agban · Infraction à la Loi n°2024-351',
    entree: 'Lotissement tracé sur le terrain par le village et un promoteur, sans aucun arrêté ministériel délivré.',
    workflow: 'Examen DTC/Cadastre → Constat d\'absence d\'approbation → Qualification juridique Loi 2024-351.',
    resultatAttendu: 'Qualification stricte LOTISSEMENT_APPLIQUE_NON_APPROUVE (ne pas assimiler à approuvé).',
    anomaliesAttendues: 'Anomalie BLOQUANTE : Risque de redressement de voirie et sanctions de commercialisation.',
    decisionAttendue: 'Avis DEFAVORABLE pour acquisition sous seing privé. Signalement des risques d\'éviction.'
  },
  {
    numero: 6,
    titre: 'Cas 6 : ACD incohérent (Nom / Titulaire divergent)',
    sousTitre: 'Cocody Riviera Palmeraie · Mismatch titulaire vs vendeur',
    entree: 'Vendeur déclaré : Koffi Serge. L\'ACD téléversé porte le nom de Diallo Fatoumata.',
    workflow: 'Extraction IA → Moteur de Cohérence → Détection de divergence nominative.',
    resultatAttendu: 'Génération automatique d\'une anomalie NOM_INCOHERENT (Gravité: IMPORTANT).',
    anomaliesAttendues: 'NOM_INCOHERENT : Nécessite mandat notarié, procuration légalisée ou certificat d\'hérédité.',
    decisionAttendue: 'Dossier suspendu en attente de la chaîne de transmission notariée des droits.'
  },
  {
    numero: 7,
    titre: 'Cas 7 : Superficie incohérente (Plan vs Attestation)',
    sousTitre: 'Grand-Bassam Azuretti · 610 m² réels vs 800 m² vendus',
    entree: 'Le vendeur facture 800 m². L\'extrait topographique du géomètre certifie 610 m² (écart de 24%).',
    workflow: 'Moteur de cohérence calcule le ratio d\'écart (> 15%) → Déclenchement anomalie critique.',
    resultatAttendu: 'Génération automatique de SUPERFICIE_INCOHERENTE (Gravité: BLOQUANT).',
    anomaliesAttendues: 'Divergence critique de surface (190 m² manquants par rapport à l\'offre commerciale).',
    decisionAttendue: 'Blocage du prix au m² réel, révision contractuelle impérative avant tout engagement.'
  },
  {
    numero: 8,
    titre: 'Cas 8 : Document manquant',
    sousTitre: 'Yopougon Zone Industrielle · Dossier incomplet',
    entree: 'Création d\'un dossier sans aucun acte téléversé (ACD, attestation ou plan).',
    workflow: 'Vérification initiale d\'intégrité documentaire → Détection de vacuité.',
    resultatAttendu: 'Passage automatique en statut INFORMATIONS_COMPLEMENTAIRES_REQUISES.',
    anomaliesAttendues: 'Anomalie BLOQUANTE : DOCUMENT_MANQUANT.',
    decisionAttendue: 'Diligence suspendue dans l\'attente des pièces du client.'
  },
  {
    numero: 9,
    titre: 'Cas 9 : Terrain différent du plan (Visite terrain)',
    sousTitre: 'Koumassi Remblais · Empiètement voisin & dalot pluvial constaté',
    entree: 'Plan théorique vierge. L\'agent de terrain inspecte le site au GPS.',
    workflow: 'Mission terrain → Relevé GPS → Constat empiètement des fondations voisines de 3m.',
    resultatAttendu: 'Capture des photos terrain, constat d\'arrachage de 3 bornes sur 4 et dalot d\'évacuation.',
    anomaliesAttendues: 'Anomalie BLOQUANTE : EMPIETEMENT_CONSTATE & INCONSTRUCTIBILITE PARTIELLE.',
    decisionAttendue: 'Avis défavorable : Contentieux de voisinage avéré. Bornage contradictoire exigé.'
  },
  {
    numero: 10,
    titre: 'Cas 10 : Dossier diaspora avec visite locale',
    sousTitre: 'Bingerville Adjin · Vérification intégrale pré-achat pour expatrié',
    entree: 'Souscripteur résidant en France (Aubin Franck) pour une villa à Bingerville Adjin. Pack Diaspora.',
    workflow: 'Collecte doc → Analyse Cadastre → Visite terrain avec bornes repeintes → Contrôle PUD → Rapport certifié.',
    resultatAttendu: 'Vérification complète sans déplacement physique du client. Photos et coordonnées vérifiées.',
    anomaliesAttendues: 'Aucune anomalie bloquante. Respect des servitudes de voirie.',
    decisionAttendue: 'Rapport favorable circonstancié avec avis notarié pré-acquisition.'
  }
];

export const BusinessTestSuite: React.FC<BusinessTestSuiteProps> = ({ onOpenReport, onNavigateToExpert }) => {
  const { dossiers, executerCasTestMetier, setSelectedDossierId } = useFoncier();
  const [selectedCaseNum, setSelectedCaseNum] = useState<number>(1);
  const [executionLog, setExecutionLog] = useState<string | null>(null);

  const selectedCase = TEST_CASES.find((c) => c.numero === selectedCaseNum) || TEST_CASES[0];

  // Recherche du dossier créé ou existant pour ce cas de test
  const existingDossierForCase = dossiers.find((d) =>
    d.numeroDossier.includes(`TEST-CAS${selectedCaseNum}`) ||
    (selectedCaseNum === 1 && d.numeroDossier.includes('0018')) ||
    (selectedCaseNum === 4 && d.numeroDossier.includes('0012'))
  );

  const handleRunTest = (casNum: number) => {
    executerCasTestMetier(casNum);
    setExecutionLog(`Cas de test #${casNum} exécuté avec succès. Les données ont été chargées dans le moteur.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-amber-600 flex items-center justify-center text-white">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Suite Interactive des 10 Tests Métier Officiels
          </h1>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Conforme à la Section 47 du Cahier des charges. Exécutez et observez en conditions réelles les 10 scénarios
          critiques de due diligence foncière en Côte d'Ivoire.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des 10 Cas */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Sélectionnez un Cas de Test (1 à 10)
          </h2>

          <div className="space-y-1.5">
            {TEST_CASES.map((tc) => (
              <button
                key={tc.numero}
                onClick={() => {
                  setSelectedCaseNum(tc.numero);
                  setExecutionLog(null);
                }}
                className={`w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer flex items-center justify-between ${
                  selectedCaseNum === tc.numero
                    ? 'border-amber-600 bg-amber-50/60 font-semibold text-amber-950 shadow-sm ring-1 ring-amber-600'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold">{tc.titre.split(':')[0]}</div>
                  <div className="text-[11px] text-slate-500 font-normal truncate max-w-[240px]">
                    {tc.titre.split(':')[1]}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Détails du Cas sélectionné & Exécution */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  TEST BENCH #{selectedCase.numero}
                </span>
                <h3 className="text-lg font-serif font-bold text-slate-900 mt-1">{selectedCase.titre}</h3>
                <p className="text-xs text-slate-500">{selectedCase.sousTitre}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunTest(selectedCase.numero)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Exécuter ce Cas de Test</span>
                </button>
              </div>
            </div>

            {/* Notification d'exécution */}
            {executionLog && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{executionLog}</span>
                </div>
                {existingDossierForCase && (
                  <button
                    onClick={() => {
                      setSelectedDossierId(existingDossierForCase.id);
                      onNavigateToExpert();
                    }}
                    className="font-bold underline text-emerald-800 hover:text-emerald-950 text-xs ml-3 shrink-0"
                  >
                    Voir dans l'Atelier Expert →
                  </button>
                )}
              </div>
            )}

            {/* Matrice du Cas de Test : Entrée, Workflow, Résultat Attendu, Anomalies, Décision */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 uppercase text-[10px] block">Données d'Entrée</span>
                <p className="text-slate-700">{selectedCase.entree}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 uppercase text-[10px] block">Workflow Déclenché</span>
                <p className="text-slate-700">{selectedCase.workflow}</p>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-900 uppercase text-[10px] block">Résultat Attendu</span>
                <p className="text-emerald-950 font-medium">{selectedCase.resultatAttendu}</p>
              </div>

              <div className="p-3 bg-amber-50/50 rounded border border-amber-200 space-y-1">
                <span className="font-bold text-amber-900 uppercase text-[10px] block">Anomalies Attendues</span>
                <p className="text-amber-950">{selectedCase.anomaliesAttendues}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-900 text-slate-100 rounded text-xs space-y-1">
              <span className="font-bold text-emerald-400 uppercase text-[10px] block">
                Décision & Arbitrage du Validateur Senior
              </span>
              <p className="leading-relaxed">{selectedCase.decisionAttendue}</p>
            </div>

            {/* État réel dans l'application si le test a été injecté */}
            {existingDossierForCase && (
              <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Dossier généré : {existingDossierForCase.numeroDossier}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-200 text-slate-800">
                    Statut : {existingDossierForCase.statut}
                  </span>
                </div>
                <div className="text-slate-600">
                  Lotissement : <span className="font-semibold">{existingDossierForCase.lotissementCheck.statut}</span> · Anomalies réelles détectées : <span className="font-semibold">{existingDossierForCase.anomalies.length}</span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedDossierId(existingDossierForCase.id);
                      onOpenReport(existingDossierForCase);
                    }}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-medium flex items-center gap-1 hover:bg-slate-700 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualiser Rapport</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDossierId(existingDossierForCase.id);
                      onNavigateToExpert();
                    }}
                    className="px-3 py-1.5 bg-emerald-700 text-white rounded text-xs font-medium flex items-center gap-1 hover:bg-emerald-600 cursor-pointer"
                  >
                    <span>Inspecter les Pièces & Preuves</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
