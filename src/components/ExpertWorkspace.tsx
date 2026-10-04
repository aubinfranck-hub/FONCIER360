import React, { useState } from 'react';
import { useFoncier } from '../context/FoncierContext';
import {
  DossierFoncier,
  LotissementStatus,
  IdufciStatus,
  TypeRechercheAdministrative,
  AnomalieSeverity,
  AnomalieType
} from '../types/foncier360';
import {
  FileCheck,
  AlertTriangle,
  MapPin,
  Compass,
  FileSearch,
  Scale,
  Building,
  CheckCircle,
  PlusCircle,
  Clock,
  Check,
  UserCheck,
  Lock,
  Layers,
  Camera,
  Navigation
} from 'lucide-react';
import { analyserCoherenceDossier } from '../services/consistencyEngine';

interface ExpertWorkspaceProps {
  onOpenReport: (dossier: DossierFoncier) => void;
}

export const ExpertWorkspace: React.FC<ExpertWorkspaceProps> = ({ onOpenReport }) => {
  const {
    currentUser,
    dossiers,
    selectedDossierId,
    setSelectedDossierId,
    mettreAJourDossier,
    confirmerExtractionExpert,
    ajouterRechercheAdministrative,
    mettreAJourRecherche,
    enregistrerVisiteTerrain,
    ajouterAnomalieManuelle,
    resoudreAnomalie,
    enregistrerControleUrbanisme,
    genererRapportDossier,
    tarifs
  } = useFoncier();

  const [activeSection, setActiveSection] = useState<'DOCUMENTS' | 'RECHERCHES' | 'LOTISSEMENT' | 'VISITE' | 'URBANISME' | 'ANOMALIES'>('DOCUMENTS');

  const activeDossier = dossiers.find((d) => d.id === selectedDossierId) || dossiers[0];

  // État formulaire Recherche Administrative
  const [showRechForm, setShowRechForm] = useState(false);
  const [newRech, setNewRech] = useState({
    type: 'POSITION_FONCIERE' as TypeRechercheAdministrative,
    serviceCible: 'Conservation de la Propriété Foncière (DGI)',
    referenceDemande: `REC-${Date.now().toString().slice(-6)}`,
    coutDeboursCfa: 25000,
    sourceCout: 'Barème officiel DGI / MCLU',
    resultat: '',
    statut: 'REPONSE_RECUE' as const,
    commentaire: ''
  });

  // État formulaire Visite Terrain
  const [showVisiteForm, setShowVisiteForm] = useState(false);
  const [visiteData, setVisiteData] = useState({
    numeroOrdreMission: `ODM-2026-${Math.floor(100 + Math.random() * 900)}`,
    agentNom: currentUser.name,
    dateVisite: new Date().toISOString().split('T')[0],
    heureVisite: '10:30',
    latitude: activeDossier?.parcelle.latitude || 5.35824,
    longitude: activeDossier?.parcelle.longitude || -3.88219,
    precisionGpsMetres: 2.2,
    bornesRetrouvees: true,
    nbBornesIdentifiees: 4,
    accesVoiePublique: 'VOIE_RECHARGEE' as const,
    etatOccupation: 'NU' as const,
    observations: 'Terrain nu, bornage physique identifié, absence de construction illicite.',
    anomaliesText: ''
  });

  // État formulaire Contrôle Urbanisme
  const [showUrbaForm, setShowUrbaForm] = useState(false);
  const [urbaData, setUrbaData] = useState({
    zonePlanUrbanismeDirecteur: 'Zone Ua (Habitat collectif et individuel)',
    certificatUrbanismeNumero: 'CU-2026-MCLU-1029',
    coefficientEmpriseSolMax: 0.5,
    hauteurMaxAutoriseeMetres: 15,
    servitudes: 'Recul de 5m sur voie d\'accès',
    compatibiliteProjet: 'COMPATIBLE' as const,
    securiteFonciereStatut: 'FAVORABLE_SOUS_RESERVES' as const,
    constructibiliteStatut: 'CONSTRUCTIBLE_AVEC_PRESCRIPTIONS' as const,
    observations: 'Terrain constructible sous réserve de respect de la marge de recul réglementaire.'
  });

  // État nouvelle anomalie
  const [showAnomForm, setShowAnomForm] = useState(false);
  const [newAnom, setNewAnom] = useState({
    type: 'LOTISSEMENT_INCOHERENT' as AnomalieType,
    gravite: 'IMPORTANT' as AnomalieSeverity,
    titre: '',
    description: '',
    visibleClient: true,
    notesInternes: ''
  });

  // Récupération de la géolocalisation réelle
  const handleGetGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setVisiteData((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            precisionGpsMetres: Math.round(pos.coords.accuracy)
          }));
        },
        (err) => console.warn('Erreur geoloc', err)
      );
    }
  };

  // Déclencheur du Moteur de Cohérence
  const handleRunConsistencyEngine = () => {
    if (!activeDossier) return;
    const diag = analyserCoherenceDossier(activeDossier);
    if (diag.anomaliesDetectees.length > 0) {
      diag.anomaliesDetectees.forEach((anom) => {
        ajouterAnomalieManuelle(activeDossier.id, anom);
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Atelier Expert */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-slate-900">Atelier d'Instruction & Diligence Expert</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-100 font-mono">
              Rôle : {currentUser.role}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Traçabilité intégrale, recherches administratives officielles, conformité PUD et visites terrain certifiées.
          </p>
        </div>

        {activeDossier && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunConsistencyEngine}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Exécuter la vérification croisée automatique"
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>Contrôle de Cohérence</span>
            </button>
            <button
              onClick={() => genererRapportDossier(activeDossier.id)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>Générer / Mettre à jour Rapport</span>
            </button>
          </div>
        )}
      </div>

      {/* Barre de sélection du dossier actif & indicateurs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-700 shrink-0">Dossier en cours :</label>
          <select
            value={activeDossier?.id || ''}
            onChange={(e) => setSelectedDossierId(e.target.value)}
            className="border border-slate-300 rounded px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-50 focus:ring-1 focus:ring-emerald-600 w-full md:w-80 cursor-pointer"
          >
            {dossiers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.numeroDossier} - {d.parcelle.commune} ({d.statut})
              </option>
            ))}
          </select>
        </div>

        {activeDossier && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <div>
              <span className="text-slate-400">Demandeur :</span>{' '}
              <span className="font-semibold text-slate-800">{activeDossier.client.name}</span>
            </div>
            <div>
              <span className="text-slate-400">Lotissement :</span>{' '}
              <span className={`font-semibold ${
                activeDossier.lotissementCheck.statut === 'APPROUVE'
                  ? 'text-emerald-700'
                  : activeDossier.lotissementCheck.statut === 'EN_SURSIS'
                  ? 'text-red-700 font-bold'
                  : 'text-amber-700'
              }`}>
                {activeDossier.lotissementCheck.statut}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Anomalies :</span>{' '}
              <span className="font-semibold text-slate-800">{activeDossier.anomalies.length}</span>
            </div>
          </div>
        )}
      </div>

      {activeDossier && (
        <div className="space-y-6">
          {/* Onglets de travail de l'expert */}
          <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
            {[
              { id: 'DOCUMENTS', label: '1. Documents & OCR', count: activeDossier.documents.length },
              { id: 'LOTISSEMENT', label: '2. Contrôle Lotissement & IDUFCI' },
              { id: 'RECHERCHES', label: '3. Recherches Administratives', count: activeDossier.recherchesAdministratives.length },
              { id: 'VISITE', label: '4. Visite Terrain & Bornes', count: activeDossier.visiteTerrain ? 1 : 0 },
              { id: 'URBANISME', label: '5. Urbanisme & Constructibilité' },
              { id: 'ANOMALIES', label: '6. Anomalies & Escalade', count: activeDossier.anomalies.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeSection === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeSection === tab.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* SECTION 1 : DOCUMENTS & CONFIRMATION HUMAINE DE L'OCR */}
          {activeSection === 'DOCUMENTS' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Actes Téléversés & Analyse OCR</h3>
                  <p className="text-xs text-slate-500">
                    Règle absolue : « OCR != AUTHENTIFICATION ». L'expert humain confirme ou rectifie chaque donnée extraite.
                  </p>
                </div>
              </div>

              {activeDossier.documents.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6 text-center">Aucun document dans ce dossier.</p>
              ) : (
                <div className="space-y-4">
                  {activeDossier.documents.map((doc) => (
                    <div key={doc.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <div>
                          <span className="font-bold text-slate-900 text-xs">{doc.type}</span>
                          <span className="text-xs text-slate-500 ml-2">{doc.nomFichier}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            doc.statutAuthentification === 'CONFIRME_PAR_EXPERT'
                              ? 'bg-emerald-100 text-emerald-800 font-semibold'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {doc.statutAuthentification}
                          </span>
                          {doc.statutAuthentification !== 'CONFIRME_PAR_EXPERT' && (
                            <button
                              onClick={() => {
                                confirmerExtractionExpert(activeDossier.id, doc.id, {
                                  nomBeneficiaire: doc.extraction?.nomBeneficiaire || activeDossier.parcelle.proprietaireDeclare,
                                  lot: doc.extraction?.lot || activeDossier.parcelle.lot,
                                  ilot: doc.extraction?.ilot || activeDossier.parcelle.ilot,
                                  superficieM2: doc.extraction?.superficieM2 || activeDossier.parcelle.superficieM2,
                                  commune: doc.extraction?.commune || activeDossier.parcelle.commune
                                });
                              }}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Valider Données Expert</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {doc.extraction ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded border border-slate-200">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Bénéficiaire identifié :</span>
                            <span className="font-semibold text-slate-800">{doc.extraction.nomBeneficiaire || 'Non détecté'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Lot & Îlot :</span>
                            <span className="font-semibold text-slate-800">
                              Lot {doc.extraction.lot || '?'} · Îlot {doc.extraction.ilot || '?'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Superficie extraite :</span>
                            <span className="font-semibold text-slate-800">
                              {doc.extraction.superficieM2 ? `${doc.extraction.superficieM2} m²` : 'Non précisée'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Commune :</span>
                            <span className="font-semibold text-slate-800">{doc.extraction.commune || 'Non précisée'}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Aucune donnée extraite.</p>
                      )}

                      <div className="text-[10px] text-slate-400 font-mono">
                        Empreinte SHA-256 : {doc.hashSha256}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2 : CONTRÔLE DU LOTISSEMENT & IDUFCI */}
          {activeSection === 'LOTISSEMENT' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-bold text-sm text-slate-900">Vérification Réglementaire du Lotissement</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Règle critique : NON_RETROUVE != ANNULE. Conserver systématiquement source, date, résultat et preuve.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Statut Lotissement */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase text-xs">Statut Ministériel du Lotissement</h4>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Statut d'approbation *</label>
                    <select
                      value={activeDossier.lotissementCheck.statut}
                      onChange={(e) => {
                        const newStatut = e.target.value as LotissementStatus;
                        mettreAJourDossier(activeDossier.id, {
                          lotissementCheck: {
                            ...activeDossier.lotissementCheck,
                            statut: newStatut,
                            agentVerificateur: currentUser.name,
                            dateVerification: new Date().toISOString().split('T')[0]
                          }
                        });
                      }}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="APPROUVE">APPROUVÉ (Arrêté officiel publié au JO)</option>
                      <option value="EN_SURSIS">EN SURSIS (Litige coutumier ou suspension ministérielle)</option>
                      <option value="LOTISSEMENT_APPLIQUE_NON_APPROUVE">LOTISSEMENT APPLIQUÉ NON APPROUVÉ (Loi 2024-351)</option>
                      <option value="ANNULE">ANNULÉ (Arrêté d'annulation formel)</option>
                      <option value="NON_RETROUVE">NON RETROUVÉ (Nécessite recherche physique aux archives)</option>
                      <option value="DONNEES_INSUFFISANTES">DONNÉES INSUFFISANTES</option>
                      <option value="A_CONFIRMER">À CONFIRMER</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Numéro & Date de l'Arrêté</label>
                    <input
                      type="text"
                      value={activeDossier.lotissementCheck.arreteApprobationNumero || ''}
                      onChange={(e) => {
                        mettreAJourDossier(activeDossier.id, {
                          lotissementCheck: {
                            ...activeDossier.lotissementCheck,
                            arreteApprobationNumero: e.target.value
                          }
                        });
                      }}
                      placeholder="Ex: Arrêté n°0894/MCU/DGU du 14/11/2017"
                      className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Commentaire Expert / Justification</label>
                    <textarea
                      rows={3}
                      value={activeDossier.lotissementCheck.commentaireExpert}
                      onChange={(e) => {
                        mettreAJourDossier(activeDossier.id, {
                          lotissementCheck: {
                            ...activeDossier.lotissementCheck,
                            commentaireExpert: e.target.value
                          }
                        });
                      }}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>

                {/* Statut IDUFCI */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase text-xs">Identifiant Unique (IDUFCI)</h4>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Statut IDUFCI Cadastral</label>
                    <select
                      value={activeDossier.idufciCheck.statut}
                      onChange={(e) => {
                        mettreAJourDossier(activeDossier.id, {
                          idufciCheck: {
                            ...activeDossier.idufciCheck,
                            statut: e.target.value as IdufciStatus,
                            dateVerification: new Date().toISOString().split('T')[0]
                          }
                        });
                      }}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="CONFIRME">CONFIRMÉ (Attribué et concordant)</option>
                      <option value="FOURNI_NON_VERIFIE">FOURNI NON VÉRIFIÉ</option>
                      <option value="INCOHERENT">INCOHÉRENT (Divergence cadastrale)</option>
                      <option value="NON_FOURNI">NON FOURNI</option>
                      <option value="NON_DISPONIBLE">NON DISPONIBLE (Lotissement non approuvé)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">IDUFCI Retrouvé / Cadastré</label>
                    <input
                      type="text"
                      value={activeDossier.idufciCheck.idufciReel || ''}
                      onChange={(e) => {
                        mettreAJourDossier(activeDossier.id, {
                          idufciCheck: {
                            ...activeDossier.idufciCheck,
                            idufciReel: e.target.value
                          }
                        });
                      }}
                      placeholder="CI-ABJ-CCD-2021-004512"
                      className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Observations IDUFCI</label>
                    <textarea
                      rows={3}
                      value={activeDossier.idufciCheck.commentaire}
                      onChange={(e) => {
                        mettreAJourDossier(activeDossier.id, {
                          idufciCheck: {
                            ...activeDossier.idufciCheck,
                            commentaire: e.target.value
                          }
                        });
                      }}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3 : RECHERCHES ADMINISTRATIVES */}
          {activeSection === 'RECHERCHES' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Recherches Administratives Officielles</h3>
                  <p className="text-xs text-slate-500">
                    Débours officiels traçables (Conservation Foncière, DGI, Direction Domaine Urbain, Mairie).
                  </p>
                </div>
                <button
                  onClick={() => setShowRechForm(true)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Enregistrer une recherche</span>
                </button>
              </div>

              {/* Formulaire modal ou en ligne */}
              {showRechForm && (
                <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-3 text-xs">
                  <h4 className="font-bold text-emerald-950 uppercase text-xs">Nouvelle Démarche Administrative</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Type de recherche *</label>
                      <select
                        value={newRech.type}
                        onChange={(e) => setNewRech({ ...newRech, type: e.target.value as any })}
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                      >
                        <option value="POSITION_FONCIERE">Position Foncière (Antériorité)</option>
                        <option value="ETAT_FONCIER">État Foncier (Conservation Foncière)</option>
                        <option value="ETAT_HISTORIQUE">État Historique des Mutations</option>
                        <option value="VERIFICATION_ACD">Vérification ACD (Archives DGU)</option>
                        <option value="TOPOGRAPHIE">Topographie / Cadastre</option>
                        <option value="URBANISME">Certificat d'Urbanisme (CU)</option>
                        <option value="LOTISSEMENT">Arrêté de lotissement aux archives</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Service Cible *</label>
                      <input
                        type="text"
                        value={newRech.serviceCible}
                        onChange={(e) => setNewRech({ ...newRech, serviceCible: e.target.value })}
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Réf. de la demande *</label>
                      <input
                        type="text"
                        value={newRech.referenceDemande}
                        onChange={(e) => setNewRech({ ...newRech, referenceDemande: e.target.value })}
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Débours administratif (FCFA)</label>
                      <input
                        type="number"
                        value={newRech.coutDeboursCfa}
                        onChange={(e) => setNewRech({ ...newRech, coutDeboursCfa: Number(e.target.value) })}
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Statut *</label>
                      <select
                        value={newRech.statut}
                        onChange={(e) => setNewRech({ ...newRech, statut: e.target.value as any })}
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                      >
                        <option value="REPONSE_RECUE">Réponse reçue</option>
                        <option value="EN_INSTRUCTION">En cours d'instruction</option>
                        <option value="NON_RETROUVEE">Non retrouvée</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Résultat officiel</label>
                      <input
                        type="text"
                        value={newRech.resultat}
                        onChange={(e) => setNewRech({ ...newRech, resultat: e.target.value })}
                        placeholder="Ex: Titre Foncier n°112450 vierge de charges"
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRechForm(false)}
                      className="px-3 py-1 border rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        ajouterRechercheAdministrative(activeDossier.id, {
                          type: newRech.type,
                          serviceCible: newRech.serviceCible,
                          referenceDemande: newRech.referenceDemande,
                          dateDemande: new Date().toISOString().split('T')[0],
                          dateReponse: newRech.statut === 'REPONSE_RECUE' ? new Date().toISOString().split('T')[0] : undefined,
                          agentId: currentUser.id,
                          agentNom: currentUser.name,
                          statut: newRech.statut,
                          resultat: newRech.resultat,
                          coutDeboursCfa: newRech.coutDeboursCfa,
                          sourceCout: newRech.sourceCout,
                          dateVerificationCout: new Date().toISOString().split('T')[0]
                        });
                        setShowRechForm(false);
                      }}
                      className="px-4 py-1 bg-emerald-700 text-white rounded font-medium cursor-pointer"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              {/* Liste des recherches */}
              <div className="divide-y divide-slate-200 text-xs">
                {activeDossier.recherchesAdministratives.map((rech) => (
                  <div key={rech.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{rech.type}</span>
                        <span className="text-slate-500">· {rech.serviceCible}</span>
                        <span className="font-mono text-[10px] text-slate-400">({rech.referenceDemande})</span>
                      </div>
                      <div className="text-slate-700 mt-1 font-medium">{rech.resultat || 'En attente de réponse'}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Demandé le {rech.dateDemande} · Débours : {rech.coutDeboursCfa.toLocaleString('fr-FR')} FCFA ({rech.sourceCout})
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-100 text-emerald-800">
                      {rech.statut}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4 : VISITE TERRAIN & BORNAGE */}
          {activeSection === 'VISITE' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Constat de Terrain & Repérage des Bornes</h3>
                  <p className="text-xs text-slate-500">
                    Avertissement : la visite terrain constate la réalité matérielle et physique mais ne constitue jamais une preuve juridique de propriété.
                  </p>
                </div>
                <button
                  onClick={() => setShowVisiteForm(true)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Saisir Compte-Rendu Mission</span>
                </button>
              </div>

              {showVisiteForm && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-800 uppercase text-xs">Formulaire d'Ordre de Mission Terrain</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">N° Ordre de Mission (ODM) *</label>
                      <input
                        type="text"
                        value={visiteData.numeroOrdreMission}
                        onChange={(e) => setVisiteData({ ...visiteData, numeroOrdreMission: e.target.value })}
                        className="w-full border rounded px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Agent Enquêteur</label>
                      <input
                        type="text"
                        value={visiteData.agentNom}
                        onChange={(e) => setVisiteData({ ...visiteData, agentNom: e.target.value })}
                        className="w-full border rounded px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Date & Heure</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={visiteData.dateVisite}
                          onChange={(e) => setVisiteData({ ...visiteData, dateVisite: e.target.value })}
                          className="w-full border rounded px-2 py-1 text-xs"
                        />
                        <input
                          type="text"
                          value={visiteData.heureVisite}
                          onChange={(e) => setVisiteData({ ...visiteData, heureVisite: e.target.value })}
                          className="w-24 border rounded px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Coordonnées GPS avec bouton de géolocalisation */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block text-slate-600 mb-1">Latitude GPS</label>
                      <input
                        type="number"
                        step="0.00001"
                        value={visiteData.latitude}
                        onChange={(e) => setVisiteData({ ...visiteData, latitude: Number(e.target.value) })}
                        className="w-full border rounded px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Longitude GPS</label>
                      <input
                        type="number"
                        step="0.00001"
                        value={visiteData.longitude}
                        onChange={(e) => setVisiteData({ ...visiteData, longitude: Number(e.target.value) })}
                        className="w-full border rounded px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleGetGeolocation}
                        className="w-full px-3 py-1.5 bg-slate-800 text-white rounded text-xs flex items-center justify-center gap-1.5 hover:bg-slate-700 cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Capturer Position Actuelle</span>
                      </button>
                    </div>
                  </div>

                  {/* Bornage & Accès */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Bornes Retrouvées ?</label>
                      <div className="flex items-center gap-4 py-1.5">
                        <label className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            checked={visiteData.bornesRetrouvees}
                            onChange={() => setVisiteData({ ...visiteData, bornesRetrouvees: true })}
                          />
                          <span>Oui</span>
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            checked={!visiteData.bornesRetrouvees}
                            onChange={() => setVisiteData({ ...visiteData, bornesRetrouvees: false })}
                          />
                          <span>Non / Disparues</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1">Nb Bornes Identifiées (sur 4)</label>
                      <input
                        type="number"
                        min={0}
                        max={8}
                        value={visiteData.nbBornesIdentifiees}
                        onChange={(e) => setVisiteData({ ...visiteData, nbBornesIdentifiees: Number(e.target.value) })}
                        className="w-full border rounded px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1">Voie d'Accès</label>
                      <select
                        value={visiteData.accesVoiePublique}
                        onChange={(e) => setVisiteData({ ...visiteData, accesVoiePublique: e.target.value as any })}
                        className="w-full border rounded px-2.5 py-1.5 text-xs"
                      >
                        <option value="VOIE_BITUMEE">Voie Bitumée</option>
                        <option value="VOIE_RECHARGEE">Voie Rechargée / Stabilisée</option>
                        <option value="PISTE">Piste en terre sommaire</option>
                        <option value="PAS_ACCES_DIRECT">Enclavé / Pas d'accès direct</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Observations détaillées de l'agent enquêteur</label>
                    <textarea
                      rows={2}
                      value={visiteData.observations}
                      onChange={(e) => setVisiteData({ ...visiteData, observations: e.target.value })}
                      className="w-full border rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Anomalies physiques constatées (séparées par des virgules)</label>
                    <input
                      type="text"
                      value={visiteData.anomaliesText}
                      onChange={(e) => setVisiteData({ ...visiteData, anomaliesText: e.target.value })}
                      placeholder="Ex: Empiètement clôture voisine, Pente abrupte, Borne Sud arrachée..."
                      className="w-full border rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setShowVisiteForm(false)}
                      className="px-3 py-1.5 border rounded cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const anomsArr = visiteData.anomaliesText.split(',').map((s) => s.trim()).filter(Boolean);
                        enregistrerVisiteTerrain(activeDossier.id, {
                          numeroOrdreMission: visiteData.numeroOrdreMission,
                          agentId: currentUser.id,
                          agentNom: visiteData.agentNom,
                          dateVisite: visiteData.dateVisite,
                          heureVisite: visiteData.heureVisite,
                          latitude: Number(visiteData.latitude),
                          longitude: Number(visiteData.longitude),
                          precisionGpsMetres: Number(visiteData.precisionGpsMetres),
                          bornesRetrouvees: visiteData.bornesRetrouvees,
                          nbBornesIdentifiees: Number(visiteData.nbBornesIdentifiees),
                          accesVoiePublique: visiteData.accesVoiePublique,
                          etatOccupation: visiteData.etatOccupation,
                          observations: visiteData.observations,
                          photos: [
                            {
                              url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
                              description: 'Vue d\'ensemble de la parcelle',
                              horodatage: new Date().toISOString(),
                              latitude: Number(visiteData.latitude),
                              longitude: Number(visiteData.longitude)
                            }
                          ],
                          anomaliesTerrainConstatees: anomsArr,
                          disclaimer: ''
                        });
                        setShowVisiteForm(false);
                      }}
                      className="px-4 py-1.5 bg-emerald-700 text-white rounded font-medium cursor-pointer"
                    >
                      Enregistrer Compte-Rendu
                    </button>
                  </div>
                </div>
              )}

              {activeDossier.visiteTerrain ? (
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <span className="font-bold text-slate-900">
                        ODM {activeDossier.visiteTerrain.numeroOrdreMission}
                      </span>
                      <span className="text-slate-500 ml-2">
                        Visite effectuée le {activeDossier.visiteTerrain.dateVisite} par {activeDossier.visiteTerrain.agentNom}
                      </span>
                    </div>
                    <span className="font-mono text-emerald-800">
                      GPS : {activeDossier.visiteTerrain.latitude.toFixed(5)}, {activeDossier.visiteTerrain.longitude.toFixed(5)} (±{activeDossier.visiteTerrain.precisionGpsMetres}m)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 bg-white rounded border">
                      <span className="text-slate-400 block text-[10px]">Bornage :</span>
                      <span className="font-semibold text-slate-800">
                        {activeDossier.visiteTerrain.bornesRetrouvees
                          ? `${activeDossier.visiteTerrain.nbBornesIdentifiees} bornes identifiées`
                          : 'Bornes non retrouvées'}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-slate-400 block text-[10px]">Accès voirie :</span>
                      <span className="font-semibold text-slate-800">{activeDossier.visiteTerrain.accesVoiePublique}</span>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-slate-400 block text-[10px]">Occupation :</span>
                      <span className="font-semibold text-slate-800">{activeDossier.visiteTerrain.etatOccupation}</span>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-slate-400 block text-[10px]">Photos jointes :</span>
                      <span className="font-semibold text-slate-800">{activeDossier.visiteTerrain.photos.length} cliché(s)</span>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded border text-slate-700">
                    <span className="font-semibold">Constats de l'agent :</span> {activeDossier.visiteTerrain.observations}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-6 text-center">Aucune visite terrain enregistrée.</p>
              )}
            </div>
          )}

          {/* SECTION 5 : URBANISME & CONSTRUCTIBILITÉ */}
          {activeSection === 'URBANISME' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Évaluation Urbanistique & Constructibilité</h3>
                  <p className="text-xs text-slate-500">
                    Séparation stricte : SECURITE_FONCIERE (titre) et CONSTRUCTIBILITE (permis, servitudes, PUD).
                  </p>
                </div>
                <button
                  onClick={() => setShowUrbaForm(true)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                >
                  Renseigner Contrôle Urbanisme
                </button>
              </div>

              {showUrbaForm && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Zone Plan d'Urbanisme Directeur (PUD)</label>
                      <input
                        type="text"
                        value={urbaData.zonePlanUrbanismeDirecteur}
                        onChange={(e) => setUrbaData({ ...urbaData, zonePlanUrbanismeDirecteur: e.target.value })}
                        className="w-full border rounded px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Sécurité Foncière</label>
                      <select
                        value={urbaData.securiteFonciereStatut}
                        onChange={(e) => setUrbaData({ ...urbaData, securiteFonciereStatut: e.target.value as any })}
                        className="w-full border rounded px-2.5 py-1.5 text-xs"
                      >
                        <option value="FAVORABLE_SOUS_RESERVES">Favorable sous réserves</option>
                        <option value="DEFAVORABLE">Défavorable</option>
                        <option value="VIGILANCE_HAUTE">Vigilance Haute</option>
                        <option value="EN_COURS">En cours d'instruction</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Constructibilité</label>
                      <select
                        value={urbaData.constructibiliteStatut}
                        onChange={(e) => setUrbaData({ ...urbaData, constructibiliteStatut: e.target.value as any })}
                        className="w-full border rounded px-2.5 py-1.5 text-xs"
                      >
                        <option value="CONSTRUCTIBLE">Constructible</option>
                        <option value="CONSTRUCTIBLE_AVEC_PRESCRIPTIONS">Constructible avec prescriptions</option>
                        <option value="INCONSTRUCTIBLE">Inconstructible (Zone inondable/Servitude)</option>
                        <option value="A_CONFIRMER">À confirmer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Servitudes & Reculs identifiés</label>
                    <input
                      type="text"
                      value={urbaData.servitudes}
                      onChange={(e) => setUrbaData({ ...urbaData, servitudes: e.target.value })}
                      placeholder="Ex: Recul 5m façade, servitude passage réseau CIE"
                      className="w-full border rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Observations expert urbaniste</label>
                    <textarea
                      rows={2}
                      value={urbaData.observations}
                      onChange={(e) => setUrbaData({ ...urbaData, observations: e.target.value })}
                      className="w-full border rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setShowUrbaForm(false)}
                      className="px-3 py-1.5 border rounded cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        enregistrerControleUrbanisme(activeDossier.id, {
                          zonePlanUrbanismeDirecteur: urbaData.zonePlanUrbanismeDirecteur,
                          certificatUrbanismeNumero: urbaData.certificatUrbanismeNumero,
                          coefficientEmpriseSolMax: urbaData.coefficientEmpriseSolMax,
                          hauteurMaxAutoriseeMetres: urbaData.hauteurMaxAutoriseeMetres,
                          servitudesIdentifiees: urbaData.servitudes ? [urbaData.servitudes] : [],
                          contraintesParticulieres: [],
                          compatibiliteProjet: urbaData.compatibiliteProjet,
                          securiteFonciereStatut: urbaData.securiteFonciereStatut,
                          constructibiliteStatut: urbaData.constructibiliteStatut,
                          observationsExpertUrbaniste: urbaData.observations
                        });
                        setShowUrbaForm(false);
                      }}
                      className="px-4 py-1.5 bg-emerald-700 text-white rounded font-medium cursor-pointer"
                    >
                      Enregistrer Contrôle
                    </button>
                  </div>
                </div>
              )}

              {activeDossier.controleUrbanisme && (
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 bg-white rounded border">
                      <span className="text-slate-400 block text-[10px]">Zone PUD :</span>
                      <span className="font-semibold text-slate-800">{activeDossier.controleUrbanisme.zonePlanUrbanismeDirecteur}</span>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-slate-400 block text-[10px]">Sécurité Foncière :</span>
                      <span className="font-semibold text-slate-800">{activeDossier.controleUrbanisme.securiteFonciereStatut}</span>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-slate-400 block text-[10px]">Constructibilité :</span>
                      <span className="font-semibold text-slate-800">{activeDossier.controleUrbanisme.constructibiliteStatut}</span>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-slate-400 block text-[10px]">Expert :</span>
                      <span className="font-semibold text-slate-800">{activeDossier.controleUrbanisme.expertNom}</span>
                    </div>
                  </div>
                  {activeDossier.controleUrbanisme.observationsExpertUrbaniste && (
                    <div className="p-2 bg-white rounded border text-slate-700">
                      <span className="font-semibold">Avis circonstancié :</span> {activeDossier.controleUrbanisme.observationsExpertUrbaniste}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SECTION 6 : ANOMALIES & GESTION DES RISQUES */}
          {activeSection === 'ANOMALIES' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Anomalies & Conflits Foncier / Urbanisme</h3>
                  <p className="text-xs text-slate-500">
                    Toute anomalie BLOQUANTE interdit la conclusion favorable et déclenche la validation senior.
                  </p>
                </div>
                <button
                  onClick={() => setShowAnomForm(true)}
                  className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Ajouter une anomalie</span>
                </button>
              </div>

              {showAnomForm && (
                <div className="p-4 rounded-lg bg-red-50/50 border border-red-200 space-y-3 text-xs">
                  <h4 className="font-bold text-red-950 uppercase text-xs">Déclaration d'Anomalie</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1">Gravité *</label>
                      <select
                        value={newAnom.gravite}
                        onChange={(e) => setNewAnom({ ...newAnom, gravite: e.target.value as any })}
                        className="w-full border rounded px-2.5 py-1.5 text-xs font-semibold"
                      >
                        <option value="BLOQUANT">BLOQUANT (Bloque conclusion favorable)</option>
                        <option value="IMPORTANT">IMPORTANT (Réserves fortes)</option>
                        <option value="VIGILANCE">VIGILANCE (Points de recoupement)</option>
                        <option value="INFO">INFO (Notice informative)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1">Type d'anomalie *</label>
                      <select
                        value={newAnom.type}
                        onChange={(e) => setNewAnom({ ...newAnom, type: e.target.value as any })}
                        className="w-full border rounded px-2.5 py-1.5 text-xs"
                      >
                        <option value="LOTISSEMENT_EN_SURSIS">Lotissement en sursis</option>
                        <option value="LOTISSEMENT_APPLIQUE_NON_APPROUVE">Lotissement appliqué non approuvé</option>
                        <option value="NOM_INCOHERENT">Nom incohérent</option>
                        <option value="SUPERFICIE_INCOHERENTE">Superficie divergente</option>
                        <option value="EMPIETEMENT_CONSTATE">Empiètement physique</option>
                        <option value="IDUFCI_INCOHERENT">IDUFCI incohérent</option>
                        <option value="DOCUMENT_MANQUANT">Document manquant</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1">Titre de l'alerte *</label>
                      <input
                        type="text"
                        value={newAnom.titre}
                        onChange={(e) => setNewAnom({ ...newAnom, titre: e.target.value })}
                        placeholder="Ex: Arrêté de sursis ministériel n°00142"
                        className="w-full border rounded px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1">Description circonstanciée</label>
                    <textarea
                      rows={2}
                      value={newAnom.description}
                      onChange={(e) => setNewAnom({ ...newAnom, description: e.target.value })}
                      className="w-full border rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1">Notes internes expert (strictement invisibles pour le client)</label>
                    <input
                      type="text"
                      value={newAnom.notesInternes}
                      onChange={(e) => setNewAnom({ ...newAnom, notesInternes: e.target.value })}
                      placeholder="Commentaire confidentiel pour le validateur senior..."
                      className="w-full border rounded px-2.5 py-1.5 text-xs bg-amber-50/50"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setShowAnomForm(false)}
                      className="px-3 py-1.5 border rounded cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        ajouterAnomalieManuelle(activeDossier.id, {
                          type: newAnom.type,
                          gravite: newAnom.gravite,
                          titre: newAnom.titre || 'Anomalie identifiée',
                          description: newAnom.description,
                          sourceDetection: currentUser.role as any,
                          detectePar: currentUser.name,
                          statut: 'CONFIRMEE',
                          visibleClient: newAnom.visibleClient,
                          notesInternesExpert: newAnom.notesInternes
                        });
                        setShowAnomForm(false);
                      }}
                      className="px-4 py-1.5 bg-red-700 text-white rounded font-medium cursor-pointer"
                    >
                      Créer Anomalie
                    </button>
                  </div>
                </div>
              )}

              {/* Liste des anomalies */}
              <div className="space-y-3 text-xs">
                {activeDossier.anomalies.map((anom) => (
                  <div
                    key={anom.id}
                    className={`p-3.5 rounded-lg border ${
                      anom.gravite === 'BLOQUANT'
                        ? 'bg-red-50/80 border-red-300'
                        : anom.gravite === 'IMPORTANT'
                        ? 'bg-amber-50/80 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          anom.gravite === 'BLOQUANT'
                            ? 'bg-red-200 text-red-900 font-bold'
                            : 'bg-amber-200 text-amber-900'
                        }`}>
                          {anom.gravite}
                        </span>
                        <span className="text-slate-900">{anom.titre}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-normal">{anom.statut}</span>
                        {anom.statut !== 'RESOLUE' && (
                          <button
                            onClick={() => resoudreAnomalie(activeDossier.id, anom.id, 'Résolu après vérification contradictoire.')}
                            className="px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] hover:bg-slate-700 cursor-pointer"
                          >
                            Marquer Résolue
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-700 mt-1">{anom.description}</p>

                    {anom.notesInternesExpert && (
                      <div className="mt-2 p-2 bg-amber-100/60 rounded border border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                        <span><span className="font-semibold">Note interne confidentielle :</span> {anom.notesInternesExpert}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
