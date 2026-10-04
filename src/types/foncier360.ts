/**
 * FONCIER 360 - Types & Entités Référentielles
 * Conforme au Cahier des charges pour Due Diligence Foncière & Urbanistique en Côte d'Ivoire
 */

export type UserRole =
  | 'CLIENT'
  | 'ADMIN'
  | 'AGENT_DOCUMENTAIRE'
  | 'EXPERT_FONCIER'
  | 'EXPERT_URBANISME'
  | 'TECHNICIEN_TOPO'
  | 'AGENT_TERRAIN'
  | 'JURISTE'
  | 'VALIDATEUR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  isDiaspora?: boolean;
  residenceCountry?: string;
  mfaEnabled?: boolean;
}

export type DossierStatus =
  | 'CREATION'
  | 'INFORMATIONS_COMPLEMENTAIRES_REQUISES'
  | 'QUALIFICATION'
  | 'EN_ATTENTE_PAIEMENT'
  | 'PRE_VERIFICATION'
  | 'ANALYSE_DOCUMENTAIRE'
  | 'RECHERCHE_FONCIERE'
  | 'RECHERCHE_URBANISTIQUE'
  | 'RECHERCHE_TECHNIQUE'
  | 'VISITE_TERRAIN_PROGRAMMEE'
  | 'CONTROLE_QUALITE'
  | 'VALIDATION_SENIOR'
  | 'RAPPORT_GENERE'
  | 'LIVRE'
  | 'CLOTURE';

export type LotissementStatus =
  | 'APPROUVE'
  | 'ANNULE'
  | 'EN_SURSIS'
  | 'NON_RETROUVE'
  | 'DONNEES_INSUFFISANTES'
  | 'A_CONFIRMER'
  | 'LOTISSEMENT_APPLIQUE_NON_APPROUVE';

export type IdufciStatus =
  | 'CONFIRME'
  | 'FOURNI_NON_VERIFIE'
  | 'NON_FOURNI'
  | 'NON_DISPONIBLE'
  | 'INCOHERENT';

export type DocumentType =
  | 'ACD'
  | 'TITRE_FONCIER'
  | 'LETTRE_ATTRIBUTION'
  | 'ACP'
  | 'ATTESTATION_PROPRIETE'
  | 'ATTESTATION_VILLAGEOISE'
  | 'ETAT_FONCIER'
  | 'ETAT_HISTORIQUE'
  | 'POSITION_FONCIERE'
  | 'EXTRAIT_TOPOGRAPHIQUE'
  | 'PLAN_LOTISSEMENT'
  | 'PLAN_SITUATION'
  | 'CERTIFICAT_URBANISME'
  | 'VET'
  | 'PIECE_IDENTITE'
  | 'CONTRAT_VENTE'
  | 'PROCURATION'
  | 'PLAN_GEOMETRE'
  | 'DOCUMENTS_SUCCESSORAUX'
  | 'AUTRE';

export type DocumentAuthStatus =
  | 'NON_VERIFIE'
  | 'EXTRAIT_PAR_IA'
  | 'CONFIRME_PAR_EXPERT'
  | 'AUTHENTIFIE_ADMINISTRATION'
  | 'INAUTHENTIFIABLE'
  | 'REJETE';

export interface DocumentExtractionData {
  nomBeneficiaire?: string;
  nomVendeur?: string;
  lot?: string;
  ilot?: string;
  superficieM2?: number;
  commune?: string;
  ville?: string;
  lotissement?: string;
  idufci?: string;
  numeroDocument?: string;
  dateDocument?: string;
  autoriteSignataire?: string;
  mentionsSignatures?: string;
  coordonneesGpsMentionnees?: string;
  statutExtraction: 'EXTRAIT_PAR_IA' | 'CONFIRME_PAR_EXPERT' | 'NON_EXTRAIT';
  confianceExtraction?: number;
}

export interface DocumentFoncier {
  id: string;
  dossierId: string;
  type: DocumentType;
  nomFichier: string;
  tailleKo: number;
  dateUpload: string;
  numeroDocument?: string;
  dateEmission?: string;
  sourceUpload: 'CLIENT' | 'EXPERT' | 'ADMINISTRATION';
  hashSha256: string;
  statutAuthentification: DocumentAuthStatus;
  extraction?: DocumentExtractionData;
  commentaire?: string;
  dateVerification?: string;
  verificateurId?: string;
  verificateurNom?: string;
  urlSimulee?: string;
}

export type AnomalieSeverity = 'INFO' | 'VIGILANCE' | 'IMPORTANT' | 'BLOQUANT';

export type AnomalieType =
  | 'NOM_INCOHERENT'
  | 'LOT_INCOHERENT'
  | 'ILOT_INCOHERENT'
  | 'SUPERFICIE_INCOHERENTE'
  | 'LOTISSEMENT_INCOHERENT'
  | 'LOCALISATION_INCOHERENTE'
  | 'IDUFCI_INCOHERENT'
  | 'DOCUMENT_MANQUANT'
  | 'REFERENCE_MANQUANTE'
  | 'DATE_INCOHERENTE'
  | 'LOTISSEMENT_EN_SURSIS'
  | 'LOTISSEMENT_APPLIQUE_NON_APPROUVE'
  | 'SURFACE_TERRAIN_DIVERGENTE'
  | 'EMPIETEMENT_CONSTATE'
  | 'SERVITUDE_NON_DECLAREE'
  | 'ZONE_INCONSTRUCTIBLE'
  | 'AUTRE_ANOMALIE';

export interface Anomalie {
  id: string;
  dossierId: string;
  type: AnomalieType;
  gravite: AnomalieSeverity;
  titre: string;
  description: string;
  preuve?: string;
  sourceDetection: 'MOTEUR_COHERENCE' | 'EXPERT_FONCIER' | 'EXPERT_URBANISME' | 'VISITE_TERRAIN' | 'JURISTE';
  detectePar: string;
  dateDetection: string;
  statut: 'DETECTEE' | 'EN_COURS_ANALYSE' | 'CONFIRMEE' | 'RESOLUE' | 'CLASSEE_SANS_SUITE';
  visibleClient: boolean;
  notesInternesExpert?: string;
  resolution?: string;
  dateResolution?: string;
  resoluPar?: string;
}

export type TypeRechercheAdministrative =
  | 'POSITION_FONCIERE'
  | 'ETAT_FONCIER'
  | 'ETAT_HISTORIQUE'
  | 'VERIFICATION_ACD'
  | 'TOPOGRAPHIE'
  | 'URBANISME'
  | 'LOTISSEMENT'
  | 'AUTRE';

export interface RechercheAdministrative {
  id: string;
  dossierId: string;
  type: TypeRechercheAdministrative;
  serviceCible: string;
  referenceDemande: string;
  dateDemande: string;
  dateReponse?: string;
  agentId: string;
  agentNom: string;
  statut: 'DEMANDEE' | 'EN_INSTRUCTION' | 'REPONSE_RECUE' | 'NON_RETROUVEE' | 'SANS_REPONSE';
  resultat?: string;
  preuveDocumentId?: string;
  preuveReference?: string;
  coutDeboursCfa: number;
  sourceCout: string;
  dateVerificationCout: string;
  commentaire?: string;
}

export interface VisiteTerrain {
  id: string;
  dossierId: string;
  numeroOrdreMission: string;
  agentId: string;
  agentNom: string;
  dateVisite: string;
  heureVisite: string;
  latitude: number;
  longitude: number;
  precisionGpsMetres: number;
  bornesRetrouvees: boolean;
  nbBornesIdentifiees: number;
  accesVoiePublique: 'VOIE_BITUMEE' | 'VOIE_RECHARGEE' | 'PISTE' | 'PAS_ACCES_DIRECT';
  etatOccupation: 'NU' | 'CLOTURE_SANS_BATIMENT' | 'CONSTRUCTION_EN_COURS' | 'BATIMENT_HABITE' | 'CULTURE_AGRICOLE' | 'SQUAT_OU_LITIGE_OCCUPANT';
  observations: string;
  photos: Array<{
    url: string;
    description: string;
    horodatage: string;
    latitude: number;
    longitude: number;
  }>;
  anomaliesTerrainConstatees: string[];
  disclaimer: string;
}

export interface ProjetConstruction {
  typeProjet: 'MAISON_INDIVIDUELLE' | 'IMMEUBLE_COLLECTIF' | 'COMMERCE' | 'HOTEL' | 'ENTREPOT' | 'INDUSTRIE' | 'INVESTISSEMENT_LOCATIF' | 'AGRICOLE' | 'AUTRE';
  nombreNiveaux?: number;
  surfacePlancherPrevueM2?: number;
  usagePrincipal?: string;
  parkingPrevu?: boolean;
  activiteSpecifique?: string;
}

export interface ControleUrbanisme {
  certificatUrbanismeNumero?: string;
  certificatUrbanismeDate?: string;
  vetNumero?: string;
  vetDate?: string;
  zonePlanUrbanismeDirecteur?: string; // ex: PUD Grand Abidjan Zone Ua, Ub, etc.
  coefficientEmpriseSolMax?: number;
  hauteurMaxAutoriseeMetres?: number;
  servitudesIdentifiees: string[];
  contraintesParticulieres: string[];
  compatibiliteProjet: 'COMPATIBLE' | 'COMPATIBLE_AVEC_RESERVES' | 'INCOMPATIBLE' | 'A_CONFIRMER';
  securiteFonciereStatut: 'FAVORABLE_SOUS_RESERVES' | 'DEFAVORABLE' | 'VIGILANCE_HAUTE' | 'EN_COURS';
  constructibiliteStatut: 'CONSTRUCTIBLE' | 'CONSTRUCTIBLE_AVEC_PRESCRIPTIONS' | 'INCONSTRUCTIBLE' | 'A_CONFIRMER';
  observationsExpertUrbaniste?: string;
  expertNom?: string;
  dateControle?: string;
}

export interface Parcelle {
  region: string;
  district: string;
  ville: string;
  commune: string;
  quartierVillage: string;
  lotissementNom: string;
  lot: string;
  ilot: string;
  superficieM2: number;
  latitude?: number;
  longitude?: number;
  precisionGpsMetres?: number;
  idufciFourni?: string;
  referencesCadastrales?: string;
  referencesTopographiques?: string;
  proprietaireDeclare: string;
  qualiteVendeur?: 'PROPRIETAIRE_TITRE' | 'MANDATAIRE' | 'DETENTEUR_ATTESTATION' | 'HERITIER' | 'PROMOTEUR' | 'AUTRE';
  typeDocumentPrincipal: DocumentType;
}

export interface TarifReference {
  id: string;
  service: string;
  libelle: string;
  montantCfa: number;
  unite: 'DOSSIER' | 'PARCELLE' | 'PAGE' | 'FORFAIT';
  sourceOfficielle: string;
  urlOfficielle: string;
  dateEffet: string;
  dateDerniereVerification: string;
  estMontantOfficielVerifie: boolean;
  actif: boolean;
}

export interface PaiementDossier {
  statut: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  referenceTransaction?: string;
  datePaiement?: string;
  moyenPaiement?: 'ORANGE_MONEY' | 'MTN_MOMO' | 'MOOV_MONEY' | 'WAVE' | 'CARTE_BANCAIRE' | 'VIREMENT';
  honorairesFoncier360Cfa: number;
  deboursAdministratifsCfa: number;
  deplacementTerrainCfa: number;
  prestationsTechniquesCfa: number;
  totalTtcCfa: number;
}

export interface RapportFoncier {
  id: string;
  dossierId: string;
  numeroRapport: string;
  version: number;
  dateGeneration: string;
  validateurId: string;
  validateurNom: string;
  validateurQualite: string;
  hashSha256: string;
  statut: 'BROUILLON' | 'SOUMIS_VALIDATION' | 'VALIDE' | 'REJETE';
  conclusionGenerale: string;
  elementsFavorables: string[];
  anomaliesRelevees: string[];
  pointsRestantAConfirmer: string[];
  recommandationsPratiques: string[];
  recommandationsJuridiques: string[];
  clauseNonGarantie: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  dossierId?: string;
  details: string;
}

export interface ReglementationItem {
  id: string;
  numeroRef: string;
  titre: string;
  dateAdoption: string;
  theme: 'URBANISME' | 'FONCIER_URBAIN' | 'IDUFCI' | 'LOTISSEMENT' | 'TOPOGRAPHIE';
  resume: string;
  portailSource: string;
  url: string;
}

export interface DossierFoncier {
  id: string;
  numeroDossier: string; // Ex: F360-CI-2026-0842
  dateCreation: string;
  statut: DossierStatus;
  formule: 'VERIFICATION_EXPRESS' | 'DUE_DILIGENCE_COMPLETE' | 'AUDIT_PRE_INVESTISSEMENT_DIASPORA';
  client: User;
  parcelle: Parcelle;
  projetConstruction?: ProjetConstruction;
  lotissementCheck: {
    statut: LotissementStatus;
    arreteApprobationNumero?: string;
    dateArrete?: string;
    sourceRecherche: string;
    dateVerification: string;
    agentVerificateur: string;
    commentaireExpert: string;
    preuveRef?: string;
  };
  idufciCheck: {
    statut: IdufciStatus;
    idufciReel?: string;
    sourceVerification: string;
    dateVerification: string;
    commentaire: string;
  };
  controleUrbanisme?: ControleUrbanisme;
  documents: DocumentFoncier[];
  anomalies: Anomalie[];
  recherchesAdministratives: RechercheAdministrative[];
  visiteTerrain?: VisiteTerrain;
  expertAffecteId?: string;
  expertAffecteNom?: string;
  validateurAffecteId?: string;
  validateurAffecteNom?: string;
  slaEcheanceDate: string;
  paiement: PaiementDossier;
  rapportFinal?: RapportFoncier;
  notesInternesExpert?: string;
  demandesComplementairesClient?: Array<{
    id: string;
    date: string;
    question: string;
    demandeurNom: string;
    reponse?: string;
    dateReponse?: string;
    resolu: boolean;
  }>;
}
