import React, { useState } from 'react';
import { useFoncier } from '../context/FoncierContext';
import { DossierFoncier, DocumentType, ProjetConstruction } from '../types/foncier360';
import {
  PlusCircle,
  FileText,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
  HelpCircle,
  Send,
  Download,
  ShieldCheck,
  ChevronRight,
  Eye,
  Info
} from 'lucide-react';
import { extraireDonneesDocumentAvecIA } from '../services/geminiOcrService';

interface ClientViewProps {
  onOpenReport: (dossier: DossierFoncier) => void;
}

export const ClientView: React.FC<ClientViewProps> = ({ onOpenReport }) => {
  const {
    currentUser,
    dossiers,
    selectedDossierId,
    setSelectedDossierId,
    creerNouveauDossier,
    ajouterDocument,
    validerPaiementClient,
    poserQuestionClient
  } = useFoncier();

  // Mode vue : 'LISTE_DOSSIER' ou 'NOUVEAU_DOSSIER'
  const [viewMode, setViewMode] = useState<'LISTE' | 'NOUVEAU'>('LISTE');

  // État du formulaire Nouveau Dossier
  const [nouveauForm, setNouveauForm] = useState({
    commune: 'Bingerville',
    quartierVillage: 'Adjin',
    lotissementNom: 'Résidentiel Les Palmiers',
    lot: '204',
    ilot: '18',
    superficieM2: 500,
    proprietaireDeclare: 'Koffi Michel',
    qualiteVendeur: 'DETENTEUR_ATTESTATION' as const,
    typeDocumentPrincipal: 'ATTESTATION_VILLAGEOISE' as DocumentType,
    idufciFourni: '',
    formule: 'DUE_DILIGENCE_COMPLETE' as 'VERIFICATION_EXPRESS' | 'DUE_DILIGENCE_COMPLETE' | 'AUDIT_PRE_INVESTISSEMENT_DIASPORA',
    projetType: 'MAISON_INDIVIDUELLE' as ProjetConstruction['typeProjet'],
    niveaux: 2,
    surfacePlancher: 250
  });

  // Modal upload document
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<DocumentType>('ATTESTATION_VILLAGEOISE');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);

  // Modal paiement
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<'WAVE' | 'ORANGE_MONEY' | 'MTN_MOMO' | 'MOOV_MONEY' | 'DJAMO' | 'JEKO'>('WAVE');

  // Input question client
  const [newQuestion, setNewQuestion] = useState('');

  // Filtrer les dossiers visibles par le client connecté (ou tous si mode démo)
  const clientDossiers = dossiers.filter((d) => d.client.id === currentUser.id || currentUser.role !== 'CLIENT');
  const activeDossier = dossiers.find((d) => d.id === selectedDossierId) || clientDossiers[0] || dossiers[0];

  // Gestion de la création
  const handleCreateDossier = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = creerNouveauDossier({
      statut: 'QUALIFICATION',
      formule: nouveauForm.formule,
      client: currentUser,
      slaEcheanceDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
      parcelle: {
        region: 'Abidjan',
        district: 'Autonome d\'Abidjan',
        ville: nouveauForm.commune,
        commune: nouveauForm.commune,
        quartierVillage: nouveauForm.quartierVillage,
        lotissementNom: nouveauForm.lotissementNom,
        lot: nouveauForm.lot,
        ilot: nouveauForm.ilot,
        superficieM2: Number(nouveauForm.superficieM2),
        proprietaireDeclare: nouveauForm.proprietaireDeclare,
        qualiteVendeur: nouveauForm.qualiteVendeur,
        typeDocumentPrincipal: nouveauForm.typeDocumentPrincipal,
        idufciFourni: nouveauForm.idufciFourni.trim() || undefined
      },
      projetConstruction: {
        typeProjet: nouveauForm.projetType,
        nombreNiveaux: nouveauForm.niveaux,
        surfacePlancherPrevueM2: nouveauForm.surfacePlancher,
        usagePrincipal: 'Habitation'
      },
      lotissementCheck: {
        statut: 'A_CONFIRMER',
        sourceRecherche: 'En attente d\'instruction',
        dateVerification: new Date().toISOString().split('T')[0],
        agentVerificateur: 'Direction des Opérations',
        commentaireExpert: 'Dossier créé. Vérification du lotissement en file d\'attente.'
      },
      idufciCheck: {
        statut: nouveauForm.idufciFourni ? 'FOURNI_NON_VERIFIE' : 'NON_FOURNI',
        sourceVerification: 'Portail IDUFCI',
        dateVerification: new Date().toISOString().split('T')[0],
        commentaire: nouveauForm.idufciFourni ? 'En cours de validation cadastre.' : 'Aucun IDUFCI fourni.'
      },
      documents: [],
      paiement: {
        statut: 'INITIATED',
        honorairesFoncier360Cfa: nouveauForm.formule === 'VERIFICATION_EXPRESS' ? 120000 : 220000,
        deboursAdministratifsCfa: 65000,
        deplacementTerrainCfa: 35000,
        prestationsTechniquesCfa: 30000,
        totalTtcCfa: nouveauForm.formule === 'VERIFICATION_EXPRESS' ? 250000 : 350000
      }
    });

    setViewMode('LISTE');
    setSelectedDossierId(newId);
  };

  // Traitement d'upload avec OCR Gemini
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDossier) return;

    setIsProcessingOcr(true);
    const fileName = uploadFile ? uploadFile.name : `scan_${uploadType.toLowerCase()}_${Date.now()}.pdf`;

    try {
      // Assistance OCR avec Gemini (stoppé et marqué EXTRAIT_PAR_IA)
      const extraction = await extraireDonneesDocumentAvecIA(
        uploadType,
        fileName,
        `Document téléversé pour le dossier ${activeDossier.numeroDossier} situé à ${activeDossier.parcelle.commune}.`,
        {
          commune: activeDossier.parcelle.commune,
          lot: activeDossier.parcelle.lot,
          ilot: activeDossier.parcelle.ilot,
          lotissement: activeDossier.parcelle.lotissementNom
        }
      );

      ajouterDocument(activeDossier.id, {
        type: uploadType,
        nomFichier: fileName,
        tailleKo: Math.floor(1200 + Math.random() * 2000),
        sourceUpload: 'CLIENT',
        statutAuthentification: 'EXTRAIT_PAR_IA',
        extraction,
        commentaire: 'Document téléversé par le client. Données extraites par IA en attente de confirmation expert.'
      });

      setShowUploadModal(false);
      setUploadFile(null);
    } catch (err) {
      console.error('Erreur upload/OCR', err);
    } finally {
      setIsProcessingOcr(false);
    }
  };

  // Gestion du paiement
  const handlePaiementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDossier) return;
    const api = import.meta.env.VITE_API_URL;
    if (!api) {
      alert('Le paiement réel n’est pas configuré. Aucun succès ne sera simulé.');
      return;
    }
    const token = localStorage.getItem('foncier360_access_token');
    const response = await fetch(api + '/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify({ dossierId: activeDossier.id, method: paymentProvider })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      alert(result?.error === 'JEKO_NOT_CONFIGURED'
        ? 'Le paiement Jèko n’est pas encore configuré côté serveur.'
        : result?.error === 'TARIFF_NOT_CONFIGURED'
          ? 'Le tarif de la formule n’est pas encore configuré.'
          : 'Impossible de créer la demande de paiement.');
      return;
    }
    setShowPaymentModal(false);
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
      return;
    }
    alert('Demande de paiement créée. Le dossier reste en attente jusqu’à confirmation réelle de Jèko.');
  };

  // Calcul des 4 états de clarté pour le client
  const elementsTermines = [
    'Création et enregistrement de la demande',
    activeDossier?.paiement.statut === 'SUCCESS' ? `Paiement sécurisé validé (${activeDossier.paiement.moyenPaiement})` : null,
    activeDossier?.documents.length ? `${activeDossier.documents.length} document(s) téléversé(s) et tracés` : null,
    activeDossier?.recherchesAdministratives.filter((r) => r.statut === 'REPONSE_RECUE').length
      ? `${activeDossier.recherchesAdministratives.filter((r) => r.statut === 'REPONSE_RECUE').length} recherche(s) administrative(s) clôturée(s)`
      : null,
    activeDossier?.visiteTerrain ? 'Visite terrain et repérage des bornes réalisés' : null,
    activeDossier?.rapportFinal?.statut === 'VALIDE' ? 'Rapport final certifié et validé par la direction' : null
  ].filter(Boolean);

  const elementsEnCours = [
    activeDossier?.paiement.statut === 'INITIATED' ? 'En attente de règlement de la provision pour débours' : null,
    activeDossier?.lotissementCheck.statut === 'A_CONFIRMER' ? 'Vérification de l\'arrêté ministériel de lotissement' : null,
    activeDossier?.recherchesAdministratives.some((r) => r.statut === 'EN_INSTRUCTION' || r.statut === 'DEMANDEE')
      ? 'Instruction auprès de la Conservation Foncière / DGI'
      : null,
    activeDossier?.statut === 'VALIDATION_SENIOR' ? 'Examen approfondi par la direction qualité (anomalie bloquante)' : null
  ].filter(Boolean);

  const elementsManquants = [
    activeDossier?.documents.length === 0 ? 'Aucun acte de propriété (ACD, attestation, extrait topo) fourni' : null,
    !activeDossier?.parcelle.idufciFourni ? 'IDUFCI non renseigné (recherche d\'office lancée)' : null,
    !activeDossier?.parcelle.latitude ? 'Coordonnées GPS non précisées par le demandeur' : null
  ].filter(Boolean);

  const elementsAVerifier = [
    activeDossier?.lotissementCheck.statut === 'EN_SURSIS' ? 'Arrêté de sursis ministériel actif à élucider' : null,
    activeDossier?.lotissementCheck.statut === 'LOTISSEMENT_APPLIQUE_NON_APPROUVE' ? 'Risque de lotissement appliqué non approuvé (Loi 2024-351)' : null,
    activeDossier?.anomalies.filter((a) => a.visibleClient && a.statut !== 'RESOLUE').map((a) => a.titre)
  ].flat().filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Client */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-slate-900">Espace Suivi & Due Diligence</h1>
            {currentUser.isDiaspora && (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                Pack Diaspora CI
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Suivez l'avancement en direct, consultez les pièces certifiées et accédez à vos rapports de diligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'LISTE' ? (
            <button
              onClick={() => setViewMode('NOUVEAU')}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Demander une Vérification</span>
            </button>
          ) : (
            <button
              onClick={() => setViewMode('LISTE')}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Retour à mes dossiers
            </button>
          )}
        </div>
      </div>

      {/* FORMULAIRE NOUVEAU DOSSIER */}
      {viewMode === 'NOUVEAU' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h2 className="text-lg font-serif font-bold text-slate-900">
              Demande de Due Diligence Foncière & Urbanistique
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Remplissez les informations de la parcelle. Un dossier incomplet peut être soumis ; il sera instruit dès réception des compléments.
            </p>
          </div>

          <form onSubmit={handleCreateDossier} className="space-y-6 text-sm">
            {/* Formule */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Formule de Vérification</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setNouveauForm({ ...nouveauForm, formule: 'VERIFICATION_EXPRESS' })}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    nouveauForm.formule === 'VERIFICATION_EXPRESS'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-900 text-xs">Vérification Express</div>
                  <div className="text-[11px] text-slate-500 mt-1">Analyse documentaire & statut lotissement (48h)</div>
                  <div className="text-xs font-bold text-emerald-800 mt-2">120 000 FCFA + Débours</div>
                </div>

                <div
                  onClick={() => setNouveauForm({ ...nouveauForm, formule: 'DUE_DILIGENCE_COMPLETE' })}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    nouveauForm.formule === 'DUE_DILIGENCE_COMPLETE'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-900 text-xs">Due Diligence Complète</div>
                  <div className="text-[11px] text-slate-500 mt-1">Foncier + Urbanisme + Visite terrain avec GPS</div>
                  <div className="text-xs font-bold text-emerald-800 mt-2">220 000 FCFA + Débours</div>
                </div>

                <div
                  onClick={() => setNouveauForm({ ...nouveauForm, formule: 'AUDIT_PRE_INVESTISSEMENT_DIASPORA' })}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    nouveauForm.formule === 'AUDIT_PRE_INVESTISSEMENT_DIASPORA'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-900 text-xs">Pack Diaspora Pré-Achat</div>
                  <div className="text-[11px] text-slate-500 mt-1">Diligence intégrale, repérage vidéo & audit notarial</div>
                  <div className="text-xs font-bold text-emerald-800 mt-2">350 000 FCFA + Débours</div>
                </div>
              </div>
            </div>

            {/* Identification Parcelle */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Localisation & Références de la Parcelle
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Commune / Ville *</label>
                  <input
                    type="text"
                    required
                    value={nouveauForm.commune}
                    onChange={(e) => setNouveauForm({ ...nouveauForm, commune: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="Ex: Cocody, Bingerville, Grand-Bassam..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Quartier ou Village</label>
                  <input
                    type="text"
                    value={nouveauForm.quartierVillage}
                    onChange={(e) => setNouveauForm({ ...nouveauForm, quartierVillage: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="Ex: Akouai Santai, M'Badon, Modeste..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nom du Lotissement *</label>
                  <input
                    type="text"
                    required
                    value={nouveauForm.lotissementNom}
                    onChange={(e) => setNouveauForm({ ...nouveauForm, lotissementNom: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="Ex: Riviera Palmeraie Tranche 4"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">N° de Lot *</label>
                    <input
                      type="text"
                      required
                      value={nouveauForm.lot}
                      onChange={(e) => setNouveauForm({ ...nouveauForm, lot: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      placeholder="Ex: 412"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">N° d'Îlot *</label>
                    <input
                      type="text"
                      required
                      value={nouveauForm.ilot}
                      onChange={(e) => setNouveauForm({ ...nouveauForm, ilot: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      placeholder="Ex: 38"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Superficie déclarée (m²) *</label>
                  <input
                    type="number"
                    required
                    value={nouveauForm.superficieM2}
                    onChange={(e) => setNouveauForm({ ...nouveauForm, superficieM2: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">IDUFCI (si connu)</label>
                  <input
                    type="text"
                    value={nouveauForm.idufciFourni}
                    onChange={(e) => setNouveauForm({ ...nouveauForm, idufciFourni: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="CI-ABJ-BGV-2024-XXXXXX"
                  />
                </div>
              </div>
            </div>

            {/* Vendeur & Document */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Propriétaire Présumé & Document Détenu
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nom du Vendeur / Propriétaire *</label>
                  <input
                    type="text"
                    required
                    value={nouveauForm.proprietaireDeclare}
                    onChange={(e) => setNouveauForm({ ...nouveauForm, proprietaireDeclare: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="Nom complet figurant sur l'acte"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Document Principal Présenté *</label>
                  <select
                    value={nouveauForm.typeDocumentPrincipal}
                    onChange={(e) => setNouveauForm({ ...nouveauForm, typeDocumentPrincipal: e.target.value as DocumentType })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="ACD">ACD (Arrêté de Concession Définitive)</option>
                    <option value="TITRE_FONCIER">Titre Foncier (Conservation Foncière)</option>
                    <option value="LETTRE_ATTRIBUTION">Lettre d'Attribution Ministérielle</option>
                    <option value="ATTESTATION_VILLAGEOISE">Attestation Villageoise Coutumière</option>
                    <option value="ATTESTATION_PROPRIETE">Attestation de Propriété</option>
                    <option value="EXTRAIT_TOPOGRAPHIQUE">Extrait Topographique (CST/DGI)</option>
                    <option value="AUTRE">Autre acte / En attente</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Projet de construction */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Votre Projet d'Investissement
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Type d'Ouvrage</label>
                  <select
                    value={nouveauForm.projetType}
                    onChange={(e) => setNouveauForm({ ...nouveauForm, projetType: e.target.value as any })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="MAISON_INDIVIDUELLE">Villa / Maison individuelle</option>
                    <option value="IMMEUBLE_COLLECTIF">Immeuble collectif R+X</option>
                    <option value="COMMERCE">Commerce / Bureaux</option>
                    <option value="HOTEL">Hôtel / Résidence hôtelière</option>
                    <option value="ENTREPOT">Entrepôt logistique</option>
                    <option value="INVESTISSEMENT_LOCATIF">Placement foncier nu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nombre de Niveaux</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={nouveauForm.niveaux}
                    onChange={(e) => setNouveauForm({ ...nouveauForm, niveaux: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Surface Plancher Estimée (m²)</label>
                  <input
                    type="number"
                    value={nouveauForm.surfacePlancher}
                    onChange={(e) => setNouveauForm({ ...nouveauForm, surfacePlancher: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-200 pt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setViewMode('LISTE')}
                className="px-4 py-2 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Créer & Initier la Vérification
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* VUE SUIVI DU DOSSIER ACTIF */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne Gauche : Liste des dossiers de l'utilisateur */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Mes Dossiers en Cours ({clientDossiers.length})
            </h2>

            <div className="space-y-2">
              {clientDossiers.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDossierId(d.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    d.id === activeDossier?.id
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-emerald-800">{d.numeroDossier}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      d.statut === 'LIVRE' || d.statut === 'RAPPORT_GENERE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : d.statut === 'VALIDATION_SENIOR'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {d.statut.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 text-sm">
                    {d.parcelle.commune} · Lot {d.parcelle.lot || '?'} Îlot {d.parcelle.ilot || '?'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{d.parcelle.lotissementNom}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
                    <span>Créé le {new Date(d.dateCreation).toLocaleDateString('fr-FR')}</span>
                    <span className="font-medium text-slate-700">
                      {d.paiement.statut === 'SUCCESS' ? 'Payé' : 'En attente paiement'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne Centrale & Droite : Détail & Progression du dossier sélectionné */}
          {activeDossier && (
            <div className="lg:col-span-2 space-y-6">
              {/* Carte Principale du Dossier */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {activeDossier.numeroDossier}
                      </span>
                      <span className="text-xs text-slate-500">
                        {activeDossier.formule.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h2 className="text-xl font-serif font-bold text-slate-900 mt-1">
                      {activeDossier.parcelle.commune}, {activeDossier.parcelle.quartierVillage}
                    </h2>
                    <p className="text-xs text-slate-600">
                      Lotissement : <span className="font-semibold text-slate-800">{activeDossier.parcelle.lotissementNom}</span> · Lot {activeDossier.parcelle.lot} · Îlot {activeDossier.parcelle.ilot} · {activeDossier.parcelle.superficieM2} m²
                    </p>
                  </div>

                  {/* Actions Rapides : Rapport si disponible */}
                  <div className="flex items-center gap-2">
                    {activeDossier.rapportFinal?.statut === 'VALIDE' ? (
                      <button
                        onClick={() => onOpenReport(activeDossier)}
                        className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Consulter Rapport Certifié</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 italic bg-slate-100 px-3 py-1.5 rounded">
                        Rapport en cours de rédaction
                      </span>
                    )}
                  </div>
                </div>

                {/* LES 4 QUADRANTS DE CLARTÉ DU CAHIER DES CHARGES (Section 34) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {/* 1. Ce qui est terminé */}
                  <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-900 flex items-center gap-1.5 mb-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Ce qui est terminé</span>
                    </h3>
                    {elementsTermines.length === 0 ? (
                      <p className="text-xs text-emerald-800/80 italic">Instruction initiale en cours.</p>
                    ) : (
                      <ul className="space-y-1.5 text-xs text-emerald-900">
                        {elementsTermines.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* 2. Ce qui est en cours */}
                  <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-200">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-blue-900 flex items-center gap-1.5 mb-2.5">
                      <Clock className="w-4 h-4 text-blue-700" />
                      <span>Ce qui est en cours</span>
                    </h3>
                    {elementsEnCours.length === 0 ? (
                      <p className="text-xs text-blue-800/80 italic">Aucune démarche active en attente.</p>
                    ) : (
                      <ul className="space-y-1.5 text-xs text-blue-900">
                        {elementsEnCours.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* 3. Ce qui manque */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-2.5">
                      <HelpCircle className="w-4 h-4 text-slate-600" />
                      <span>Ce qui manque</span>
                    </h3>
                    {elementsManquants.length === 0 ? (
                      <p className="text-xs text-slate-600 italic">Dossier complet sur les éléments requis.</p>
                    ) : (
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {elementsManquants.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-slate-400 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* 4. Ce qui doit être vérifié */}
                  <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-700" />
                      <span>Points sous vigilance</span>
                    </h3>
                    {elementsAVerifier.length === 0 ? (
                      <p className="text-xs text-amber-800/80 italic">Aucun point d'alerte spécifique signalé.</p>
                    ) : (
                      <ul className="space-y-1.5 text-xs text-amber-900">
                        {elementsAVerifier.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 font-medium">
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Frais & Paiement Séparé Transparent (Section 12 & 44) */}
                <div className="mt-6 p-4 rounded-lg bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-semibold">
                      Décomposition Financière Transparente
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                      Honoraires FONCIER 360 : <span className="text-emerald-400 font-semibold">{activeDossier.paiement.honorairesFoncier360Cfa.toLocaleString('fr-FR')} FCFA</span> + Débours officiels : <span className="font-semibold">{activeDossier.paiement.deboursAdministratifsCfa.toLocaleString('fr-FR')} FCFA</span> + Déplacement : {activeDossier.paiement.deplacementTerrainCfa.toLocaleString('fr-FR')} FCFA + Prestations tech : {activeDossier.paiement.prestationsTechniquesCfa.toLocaleString('fr-FR')} FCFA
                    </div>
                    <div className="text-base font-bold text-white mt-1">
                      Total TTC : {activeDossier.paiement.totalTtcCfa.toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>

                  {activeDossier.paiement.statut === 'SUCCESS' ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded border border-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Règlement validé ({activeDossier.paiement.moyenPaiement})</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      Régler la Due Diligence
                    </button>
                  )}
                </div>
              </div>

              {/* Module Documentaire & Téléversement */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Documents Justificatifs & Actes</h3>
                    <p className="text-xs text-slate-500">Chaque document est horodaté et sécurisé par empreinte SHA-256.</p>
                  </div>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ajouter un document</span>
                  </button>
                </div>

                {activeDossier.documents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p>Aucun document versé pour l'instant.</p>
                    <p className="text-slate-400 mt-0.5">Téléversez un ACD, une attestation villageoise ou un plan géomètre.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {activeDossier.documents.map((doc) => (
                      <div key={doc.id} className="py-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{doc.type}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              doc.statutAuthentification === 'CONFIRME_PAR_EXPERT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {doc.statutAuthentification}
                            </span>
                          </div>
                          <div className="text-slate-600 mt-0.5">{doc.nomFichier} · {(doc.tailleKo / 1024).toFixed(1)} Mo</div>
                          {doc.extraction && (
                            <div className="mt-1 p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-700">
                              <span className="font-semibold text-emerald-800">Données extraites ({doc.extraction.statutExtraction}) : </span>
                              Lot {doc.extraction.lot || '?'}, Îlot {doc.extraction.ilot || '?'}, {doc.extraction.superficieM2 ? `${doc.extraction.superficieM2} m²` : ''}, Bénéficiaire : {doc.extraction.nomBeneficiaire || 'Non détecté'}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-[10px] text-slate-400 font-mono">
                          SHA-256 : {doc.hashSha256.substring(0, 10)}...
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Module Questions & Échanges avec l'équipe Foncier 360 */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Échanges & Demandes Complémentaires
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Posez une question directement aux juristes et experts fonciers affectés à votre dossier.
                </p>

                {/* Historique des questions */}
                {activeDossier.demandesComplementairesClient?.map((dem) => (
                  <div key={dem.id} className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="font-semibold text-slate-800">Votre question : « {dem.question} »</div>
                    {dem.reponse ? (
                      <div className="mt-2 pl-3 border-l-2 border-emerald-600 text-emerald-900">
                        <span className="font-bold">Réponse expert : </span> {dem.reponse}
                      </div>
                    ) : (
                      <div className="mt-1 text-slate-400 italic">En attente de réponse par l'expert référent...</div>
                    )}
                  </div>
                ))}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newQuestion.trim()) return;
                    poserQuestionClient(activeDossier.id, newQuestion);
                    setNewQuestion('');
                  }}
                  className="flex items-center gap-2 mt-3"
                >
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Ex: Le vendeur me demande une avance, qu'en pensez-vous ?"
                    className="flex-1 border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Envoyer</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Upload Document */}
      {showUploadModal && activeDossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="font-serif font-bold text-base text-slate-900 mb-1">
              Téléverser un document foncier
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              L'IA assistera l'expert par une pré-extraction OCR (statuée EXTRAIT_PAR_IA).
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Type d'acte *</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as DocumentType)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="ACD">ACD (Arrêté de Concession Définitive)</option>
                  <option value="TITRE_FONCIER">Titre Foncier (Conservation Foncière)</option>
                  <option value="ATTESTATION_VILLAGEOISE">Attestation Villageoise Coutumière</option>
                  <option value="ATTESTATION_PROPRIETE">Attestation de Propriété</option>
                  <option value="EXTRAIT_TOPOGRAPHIQUE">Extrait Topographique (CST/DGI)</option>
                  <option value="PLAN_LOTISSEMENT">Plan de Lotissement</option>
                  <option value="PLAN_SITUATION">Plan de Situation</option>
                  <option value="CERTIFICAT_URBANISME">Certificat d'Urbanisme</option>
                  <option value="AUTRE">Autre document</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Fichier (PDF ou image)</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-xs"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px]">
                <span className="font-semibold">Règle déontologique : </span>
                Le téléversement d'un document ne vaut pas authentification. L'expert effectuera le contrôle contradictoire.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 border rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessingOcr}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isProcessingOcr ? (
                    <span>Traitement OCR...</span>
                  ) : (
                    <span>Téléverser & Analyser</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Paiement Sécurisé */}
      {showPaymentModal && activeDossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="font-serif font-bold text-base text-slate-900 mb-1">
              Règlement de la Due Diligence
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Passerelle de paiement sécurisée (Opérateurs CI & Carte Internationale).
            </p>

            <form onSubmit={handlePaiementSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Dossier :</span>
                  <span className="font-mono font-semibold text-slate-800">{activeDossier.numeroDossier}</span>
                </div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Formule :</span>
                  <span>{activeDossier.formule.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t">
                  <span>Total à payer :</span>
                  <span className="text-emerald-800">{activeDossier.paiement.totalTtcCfa.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-2">Sélectionnez le mode de paiement :</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['WAVE', 'ORANGE_MONEY', 'MTN_MOMO', 'MOOV_MONEY', 'DJAMO', 'JEKO'] as const).map((m) => (
                    <div
                      key={m}
                      onClick={() => setPaymentProvider(m)}
                      className={`p-2.5 rounded border text-center font-medium cursor-pointer transition-all ${
                        paymentProvider === m
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {m === 'JEKO' ? 'Jèko' : m === 'DJAMO' ? 'Djamo' : m.replace(/_/g, ' ')}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-1.5 border rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-medium transition-colors cursor-pointer"
                >
                  Confirmer le Règlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
