import {
  User,
  TarifReference,
  ReglementationItem,
  DossierFoncier,
  AuditLog
} from '../types/foncier360';

export const OFFICIAL_REGULATIONS: ReglementationItem[] = [
  {
    id: 'reg-01',
    numeroRef: 'Loi n°2020-624 du 14 août 2020',
    titre: 'Code de l\'Urbanisme et du Domaine Foncier Urbain de la République de Côte d\'Ivoire',
    dateAdoption: '2020-08-14',
    theme: 'URBANISME',
    resume: 'Régit les règles générales d\'urbanisme, les servitudes d\'utilité publique, les lotissements et les conditions de délivrance de l\'ACD.',
    portailSource: 'Ministère de la Construction, du Logement et de l\'Urbanisme',
    url: 'https://www.construction.gouv.ci/'
  },
  {
    id: 'reg-02',
    numeroRef: 'Loi n°2024-351 du 6 juin 2024',
    titre: 'Loi modifiant et complétant le Code de l\'Urbanisme et du Domaine Foncier Urbain',
    dateAdoption: '2024-06-06',
    theme: 'FONCIER_URBAIN',
    resume: 'Renforcement du contrôle des lotissements appliqués non approuvés et sanctions contre la commercialisation illicite de parcelles sans approbation préalable.',
    portailSource: 'Journal Officiel de la République de Côte d\'Ivoire',
    url: 'https://servicepublic.gouv.ci/'
  },
  {
    id: 'reg-03',
    numeroRef: 'Décret n°2019-221 du 13 mars 2019',
    titre: 'Création et mise en œuvre de l\'Identifiant Unique du Foncier de Côte d\'Ivoire (IDUFCI)',
    dateAdoption: '2019-03-13',
    theme: 'IDUFCI',
    resume: 'Institution d\'un identifiant alphanumérique unique pour chaque parcelle cadastrée en Côte d\'Ivoire pour assurer la traçabilité complète des mutations.',
    portailSource: 'Portail IDUFCI',
    url: 'https://idufci.construction.gouv.ci/'
  },
  {
    id: 'reg-04',
    numeroRef: 'Arrêté interministériel n°757 du 24 juillet 2020',
    titre: 'Modalités d\'attribution et de gestion de l\'IDUFCI',
    dateAdoption: '2020-07-24',
    theme: 'IDUFCI',
    resume: 'Précise l\'obligation de mentionner l\'IDUFCI sur tout acte notarié, arrêté de concession définitive ou certificat de mutation.',
    portailSource: 'Ministère du Budget et des Finances / MCLU',
    url: 'https://idufci.construction.gouv.ci/'
  },
  {
    id: 'reg-05',
    numeroRef: 'Décret n°2021-784 du 8 décembre 2021',
    titre: 'Réglementation des opérations de lotissement et approbation ministérielle',
    dateAdoption: '2021-12-08',
    theme: 'LOTISSEMENT',
    resume: 'Conditions techniques d\'enquête commodo et incommodo et obligation de viabilisation minimale (eau, électricité, voies primaires).',
    portailSource: 'Secrétariat Général du Gouvernement',
    url: 'https://www.construction.gouv.ci/services'
  },
  {
    id: 'reg-06',
    numeroRef: 'Arrêté n°0436 du 16 mai 2023',
    titre: 'Contrôle des constructions et du Visa d\'Examen Technique (VET)',
    dateAdoption: '2023-05-16',
    theme: 'URBANISME',
    resume: 'Fixe le passage obligatoire devant la commission technique des permis de construire et vérification de conformité au Plan d\'Urbanisme Directeur.',
    portailSource: 'Direction Générale du Logement et du Cadre de Vie',
    url: 'https://www.construction.gouv.ci/'
  },
  {
    id: 'reg-07',
    numeroRef: 'Décret n°2025-235 du 9 avril 2025',
    titre: 'Régime des servitudes de drainage pluvial et zones inondables du Grand Abidjan',
    dateAdoption: '2025-04-09',
    theme: 'URBANISME',
    resume: 'Inconstructibilité stricte des talwegs, zones de passage d\'exutoires naturels et servitudes de 25m le long des lagunes et cours d\'eau.',
    portailSource: 'Ministère de l\'Hydraulique et de l\'Assainissement',
    url: 'https://servicepublic.gouv.ci/'
  }
];

export const REFERENCE_TARIFFS: TarifReference[] = [
  {
    id: 'tf-01',
    service: 'Conservation de la Propriété Foncière et des Hypothèques (DGI)',
    libelle: 'Délivrance d\'un État Foncier officiel (Certificat d\'inscription)',
    montantCfa: 10000,
    unite: 'PARCELLE',
    sourceOfficielle: 'Direction Générale des Impôts - DGI Recette des Domaines',
    urlOfficielle: 'https://dgi.gouv.ci/',
    dateEffet: '2022-01-01',
    dateDerniereVerification: '2026-09-15',
    estMontantOfficielVerifie: true,
    actif: true
  },
  {
    id: 'tf-02',
    service: 'Ministère de la Construction et de l\'Urbanisme (MCLU)',
    libelle: 'Demande de Certificat d\'Urbanisme (CU)',
    montantCfa: 50000,
    unite: 'DOSSIER',
    sourceOfficielle: 'Arrêté interministériel MCLU/MEF n°0033',
    urlOfficielle: 'https://www.construction.gouv.ci/services',
    dateEffet: '2022-07-05',
    dateDerniereVerification: '2026-08-20',
    estMontantOfficielVerifie: true,
    actif: true
  },
  {
    id: 'tf-03',
    service: 'Direction de la Topographie et de la Cartographie (DTC)',
    libelle: 'Extrait topographique certifié / Calque de lotissement officiel',
    montantCfa: 35000,
    unite: 'PARCELLE',
    sourceOfficielle: 'Tarif officiel Cadastre et DTC Côte d\'Ivoire',
    urlOfficielle: 'https://www.construction.gouv.ci/services',
    dateEffet: '2023-01-15',
    dateDerniereVerification: '2026-07-10',
    estMontantOfficielVerifie: true,
    actif: true
  },
  {
    id: 'tf-04',
    service: 'Direction du Domaine Urbain (DDU)',
    libelle: 'Attestation de Position Foncière (Recherche d\'antériorité de dossier ACD)',
    montantCfa: 25000,
    unite: 'DOSSIER',
    sourceOfficielle: 'MCLU - Direction du Domaine Urbain',
    urlOfficielle: 'https://www.construction.gouv.ci/services',
    dateEffet: '2023-04-20',
    dateDerniereVerification: '2026-09-01',
    estMontantOfficielVerifie: true,
    actif: true
  },
  {
    id: 'tf-05',
    service: 'Antenne Régionale Urbanisme / Mairie',
    libelle: 'Recherche d\'arrêté d\'approbation de lotissement aux archives',
    montantCfa: 15000,
    unite: 'DOSSIER',
    sourceOfficielle: 'Services domaniaux des collectivités territoriales',
    urlOfficielle: 'https://servicepublic.gouv.ci/',
    dateEffet: '2022-06-01',
    dateDerniereVerification: '2026-06-30',
    estMontantOfficielVerifie: true,
    actif: true
  },
  {
    id: 'tf-06',
    service: 'Ordre des Géomètres-Experts de Côte d\'Ivoire (OGECI)',
    libelle: 'Vérification contradictoire des bornes par Géomètre Assermenté',
    montantCfa: 0,
    unite: 'FORFAIT',
    sourceOfficielle: 'Barème ordinal indicatif - Selon superficie et relief (Sur devis)',
    urlOfficielle: 'https://servicepublic.gouv.ci/',
    dateEffet: '2024-01-01',
    dateDerniereVerification: '2026-09-20',
    estMontantOfficielVerifie: false, // Doit afficher A CONFIRMER selon la règle
    actif: true
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-client-01',
    name: 'Aubin Franck',
    email: 'aubinfranck@gmail.com',
    role: 'CLIENT',
    phone: '+33 6 42 18 90 22',
    isDiaspora: true,
    residenceCountry: 'France (Paris)',
    mfaEnabled: true
  },
  {
    id: 'usr-admin-01',
    name: 'Koffi Brou Sylvain',
    email: 'admin@foncier360.ci',
    role: 'ADMIN',
    phone: '+225 07 08 09 10 11',
    mfaEnabled: true
  },
  {
    id: 'usr-expert-foncier-01',
    name: 'Me N\'Guessan Yao',
    email: 'expert.foncier@foncier360.ci',
    role: 'EXPERT_FONCIER',
    phone: '+225 05 44 33 22 11',
    mfaEnabled: true
  },
  {
    id: 'usr-expert-urba-01',
    name: 'Ing. Amadou Coulibaly',
    email: 'expert.urba@foncier360.ci',
    role: 'EXPERT_URBANISME',
    phone: '+225 07 12 34 56 78',
    mfaEnabled: true
  },
  {
    id: 'usr-agent-terrain-01',
    name: 'Bakary Sanogo',
    email: 'terrain.sanogo@foncier360.ci',
    role: 'AGENT_TERRAIN',
    phone: '+225 01 23 45 67 89',
    mfaEnabled: true
  },
  {
    id: 'usr-validateur-01',
    name: 'Dr. Konan Marie-Laure',
    email: 'validateur.senior@foncier360.ci',
    role: 'VALIDATEUR',
    phone: '+225 07 88 99 00 11',
    mfaEnabled: true
  }
];

export const INITIAL_DOSSIERS: DossierFoncier[] = [
  {
    id: 'dos-001',
    numeroDossier: 'F360-CI-2026-0012',
    dateCreation: '2026-09-28T09:15:00Z',
    statut: 'VALIDATION_SENIOR',
    formule: 'DUE_DILIGENCE_COMPLETE',
    client: INITIAL_USERS[0],
    slaEcheanceDate: '2026-10-06T18:00:00Z',
    parcelle: {
      region: 'Abidjan',
      district: 'Autonome d\'Abidjan',
      ville: 'Abidjan',
      commune: 'Bingerville',
      quartierVillage: 'Akouai Santai Nord',
      lotissementNom: 'Résidentiel Les Palmiers 2',
      lot: '412',
      ilot: '38',
      superficieM2: 500,
      latitude: 5.35824,
      longitude: -3.88219,
      precisionGpsMetres: 2.8,
      idufciFourni: 'CI-ABJ-BGV-2024-009841',
      proprietaireDeclare: 'Kouassi Kouame Jean-Baptiste',
      qualiteVendeur: 'DETENTEUR_ATTESTATION',
      typeDocumentPrincipal: 'ATTESTATION_VILLAGEOISE'
    },
    projetConstruction: {
      typeProjet: 'MAISON_INDIVIDUELLE',
      nombreNiveaux: 2,
      surfacePlancherPrevueM2: 280,
      usagePrincipal: 'Résidence principale familiale',
      parkingPrevu: true
    },
    lotissementCheck: {
      statut: 'EN_SURSIS',
      arreteApprobationNumero: 'Arrêté ministériel suspendu n°00142/MCLU/DGU/SDAL',
      dateArrete: '2022-04-18',
      sourceRecherche: 'Direction du Domaine Urbain & Bulletin officiel des lotissements',
      dateVerification: '2026-09-30',
      agentVerificateur: 'Me N\'Guessan Yao (Expert Foncier)',
      commentaireExpert: 'Lotissement placé en sursis par décision ministérielle suite à un litige de délimitation coutumière entre les villages d\'Akouai Santai et d\'Eloka.',
      preuveRef: 'Bordereau MCLU/SG/2024-912'
    },
    idufciCheck: {
      statut: 'INCOHERENT',
      idufciReel: 'Non attribuable tant que le lotissement est en sursis',
      sourceVerification: 'Plateforme officielle IDUFCI MCLU',
      dateVerification: '2026-09-30',
      commentaire: 'L\'IDUFCI fourni par le vendeur correspond en réalité à une parcelle située dans la commune de Songon.'
    },
    documents: [
      {
        id: 'doc-001-1',
        dossierId: 'dos-001',
        type: 'ATTESTATION_VILLAGEOISE',
        nomFichier: 'attestation_coutumiere_lot412.pdf',
        tailleKo: 1420,
        dateUpload: '2026-09-28T09:20:00Z',
        numeroDocument: 'ATT-AK-2023-88',
        dateEmission: '2023-06-12',
        sourceUpload: 'CLIENT',
        hashSha256: 'a4f89d34208a0ebc91e457f92026f849b211d087b2e463a921dcb93457a1b920',
        statutAuthentification: 'CONFIRME_PAR_EXPERT',
        extraction: {
          nomBeneficiaire: 'Kouassi Kouame Jean-Baptiste',
          lot: '412',
          ilot: '38',
          superficieM2: 500,
          commune: 'Bingerville',
          lotissement: 'Résidentiel Les Palmiers 2',
          statutExtraction: 'CONFIRME_PAR_EXPERT',
          confianceExtraction: 0.94
        },
        commentaire: 'Document analysé. Signature chefferie identifiable mais sans valeur d\'ACD.',
        verificateurNom: 'Me N\'Guessan Yao'
      },
      {
        id: 'doc-001-2',
        dossierId: 'dos-001',
        type: 'PLAN_SITUATION',
        nomFichier: 'plan_geometre_lot412_ilot38.pdf',
        tailleKo: 2150,
        dateUpload: '2026-09-28T09:22:00Z',
        sourceUpload: 'CLIENT',
        hashSha256: '98d3e210ac09b45e7f12e8736d8120fa2849c00184b2389d7fa13cba984218de',
        statutAuthentification: 'EXTRAIT_PAR_IA',
        extraction: {
          lot: '412',
          ilot: '38',
          superficieM2: 500,
          commune: 'Bingerville',
          statutExtraction: 'EXTRAIT_PAR_IA'
        }
      }
    ],
    anomalies: [
      {
        id: 'anom-001-1',
        dossierId: 'dos-001',
        type: 'LOTISSEMENT_EN_SURSIS',
        gravite: 'BLOQUANT',
        titre: 'Lotissement sous arrêté de sursis ministériel',
        description: 'Le lotissement Les Palmiers 2 fait l\'objet d\'une suspension ministérielle n°00142/MCLU. Tout acte de vente ou de mise en valeur est juridiquement bloqué.',
        preuve: 'Notification d\'arrêté de sursis consultée au service du Domaine Urbain.',
        sourceDetection: 'EXPERT_FONCIER',
        detectePar: 'Me N\'Guessan Yao',
        dateDetection: '2026-09-30T11:00:00Z',
        statut: 'CONFIRMEE',
        visibleClient: true,
        notesInternesExpert: 'Risque contentieux majeur. Aucun ACD ne sera délivré tant que le litige n\'est pas purgé par décret.'
      },
      {
        id: 'anom-001-2',
        dossierId: 'dos-001',
        type: 'IDUFCI_INCOHERENT',
        gravite: 'BLOQUANT',
        titre: 'Incohérence majeure de l\'identifiant IDUFCI',
        description: 'L\'IDUFCI fourni (CI-ABJ-BGV-2024-009841) est introuvable sur la parcelle ciblée et référence une assiette foncière distincte.',
        sourceDetection: 'MOTEUR_COHERENCE',
        detectePar: 'Moteur de cohérence FONCIER 360',
        dateDetection: '2026-09-29T14:30:00Z',
        statut: 'CONFIRMEE',
        visibleClient: true
      }
    ],
    recherchesAdministratives: [
      {
        id: 'rech-001-1',
        dossierId: 'dos-001',
        type: 'LOTISSEMENT',
        serviceCible: 'Direction Générale de l\'Urbanisme (MCLU Abidjan Plateau)',
        referenceDemande: 'REC-2026-DGU-9182',
        dateDemande: '2026-09-29',
        dateReponse: '2026-09-30',
        agentId: 'usr-expert-foncier-01',
        agentNom: 'Me N\'Guessan Yao',
        statut: 'REPONSE_RECUE',
        resultat: 'Confirmation du statut EN SURSIS (Conflit de chefferies non tranché).',
        coutDeboursCfa: 15000,
        sourceCout: 'Tarif officiel Archives DGU',
        dateVerificationCout: '2026-09-20',
        commentaire: 'La DGU confirme le gel complet de l\'instruction des demandes d\'ACD sur cet îlot.'
      },
      {
        id: 'rech-001-2',
        dossierId: 'dos-001',
        type: 'POSITION_FONCIERE',
        serviceCible: 'Conservation Foncière de Bingerville',
        referenceDemande: 'CF-BGV-DEM-441',
        dateDemande: '2026-09-29',
        agentId: 'usr-expert-foncier-01',
        agentNom: 'Me N\'Guessan Yao',
        statut: 'REPONSE_RECUE',
        resultat: 'Aucun dossier de Titre Foncier en cours pour le lot 412.',
        coutDeboursCfa: 25000,
        sourceCout: 'Barème MCLU Domaine Urbain',
        dateVerificationCout: '2026-09-20'
      }
    ],
    visiteTerrain: {
      id: 'vis-001',
      dossierId: 'dos-001',
      numeroOrdreMission: 'ODM-2026-09-084',
      agentId: 'usr-agent-terrain-01',
      agentNom: 'Bakary Sanogo',
      dateVisite: '2026-10-01',
      heureVisite: '11:45',
      latitude: 5.35824,
      longitude: -3.88219,
      precisionGpsMetres: 2.8,
      bornesRetrouvees: true,
      nbBornesIdentifiees: 3,
      accesVoiePublique: 'PISTE',
      etatOccupation: 'NU',
      observations: 'Terrain plat, herbeux. 3 bornes identifiées sur 4 (borne Nord-Ouest ensevelie ou manquante). Piquetage sommaire avec peinture rouge. Aucune occupation physique lors du passage.',
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
          description: 'Vue d\'ensemble de la parcelle Lot 412 Îlot 38 depuis la voie d\'accès',
          horodatage: '2026-10-01T11:48:00Z',
          latitude: 5.35824,
          longitude: -3.88219
        },
        {
          url: 'https://images.unsplash.com/photo-1524813686514-a57563d77d66?w=600&auto=format&fit=crop&q=80',
          description: 'Borne d\'angle Sud-Est identifiée et numérotée',
          horodatage: '2026-10-01T11:54:00Z',
          latitude: 5.35821,
          longitude: -3.88215
        }
      ],
      anomaliesTerrainConstatees: [
        '1 borne manquante à l\'angle Nord-Ouest',
        'Voie d\'accès non stabilisée impraticable en saison des pluies'
      ],
      disclaimer: 'La visite terrain a pour but exclusif de constater la réalité physique de la parcelle, ses accès et son occupation visible à la date de mission. Elle ne constitue en aucun cas une preuve juridique de propriété.'
    },
    controleUrbanisme: {
      zonePlanUrbanismeDirecteur: 'PUD Grand Abidjan - Secteur Est Bingerville (Zone R2 Habitat)',
      coefficientEmpriseSolMax: 0.5,
      hauteurMaxAutoriseeMetres: 12,
      servitudesIdentifiees: ['Servitude d\'alignement futur voie de 15m'],
      contraintesParticulieres: ['Sol latéritique nécessitant étude de sol préalable'],
      compatibiliteProjet: 'COMPATIBLE_AVEC_RESERVES',
      securiteFonciereStatut: 'DEFAVORABLE',
      constructibiliteStatut: 'A_CONFIRMER',
      observationsExpertUrbaniste: 'Sur le plan technique le projet de villa R+1 est conforme à la zone, mais la constructibilité légale est suspendue au règlement du sursis de lotissement.',
      expertNom: 'Ing. Amadou Coulibaly',
      dateControle: '2026-10-02'
    },
    paiement: {
      statut: 'SUCCESS',
      referenceTransaction: 'WAVE-CI-TX-984102',
      datePaiement: '2026-09-28T10:00:00Z',
      moyenPaiement: 'WAVE',
      honorairesFoncier360Cfa: 150000,
      deboursAdministratifsCfa: 40000,
      deplacementTerrainCfa: 35000,
      prestationsTechniquesCfa: 50000,
      totalTtcCfa: 275000
    },
    notesInternesExpert: 'Dossier hautement conflictuel sur le plan foncier. L\'anomalie bloquante de sursis interdit toute conclusion favorable.',
    demandesComplementairesClient: [
      {
        id: 'dem-01',
        date: '2026-09-29T10:00:00Z',
        question: 'Le vendeur me dit que le sursis est sur le point d\'être levé d\'ici 2 semaines. Est-ce vrai ?',
        demandeurNom: 'Aubin Franck',
        reponse: 'Aucun acte officiel de mainlevée n\'est enregistré à la Direction du Domaine Urbain à ce jour. Ne versez aucun acompte sur la base de simples déclarations verbales.',
        dateReponse: '2026-09-30T09:00:00Z',
        resolu: true
      }
    ]
  },
  {
    id: 'dos-002',
    numeroDossier: 'F360-CI-2026-0018',
    dateCreation: '2026-09-25T14:00:00Z',
    statut: 'LIVRE',
    formule: 'DUE_DILIGENCE_COMPLETE',
    client: {
      id: 'usr-client-02',
      name: 'Société Ivoirienne de Promotion Immobilière (SIPI SARL)',
      email: 'invest@sipi-ci.com',
      role: 'CLIENT',
      phone: '+225 27 22 40 10 00'
    },
    slaEcheanceDate: '2026-10-03T18:00:00Z',
    parcelle: {
      region: 'Abidjan',
      district: 'Autonome d\'Abidjan',
      ville: 'Abidjan',
      commune: 'Cocody',
      quartierVillage: 'Riviera 4 M\'Badon',
      lotissementNom: 'Riviera M\'Badon Extension Tranche 3',
      lot: '184',
      ilot: '12',
      superficieM2: 820,
      latitude: 5.34211,
      longitude: -3.94823,
      precisionGpsMetres: 1.5,
      idufciFourni: 'CI-ABJ-CCD-2021-004512',
      proprietaireDeclare: 'Dr. Toure Ibrahim',
      qualiteVendeur: 'PROPRIETAIRE_TITRE',
      typeDocumentPrincipal: 'ACD'
    },
    projetConstruction: {
      typeProjet: 'IMMEUBLE_COLLECTIF',
      nombreNiveaux: 4,
      surfacePlancherPrevueM2: 1200,
      usagePrincipal: 'Résidence de standing R+3 avec 8 appartements',
      parkingPrevu: true
    },
    lotissementCheck: {
      statut: 'APPROUVE',
      arreteApprobationNumero: 'Arrêté n°0894/MCU/DGU/DU/SDA du 14 novembre 2017',
      dateArrete: '2017-11-14',
      sourceRecherche: 'Direction Générale de l\'Urbanisme & Journal Officiel',
      dateVerification: '2026-09-26',
      agentVerificateur: 'Me N\'Guessan Yao',
      commentaireExpert: 'Lotissement régulier, approuvé et publié au Journal Officiel. Viabilisation effectuée.'
    },
    idufciCheck: {
      statut: 'CONFIRME',
      idufciReel: 'CI-ABJ-CCD-2021-004512',
      sourceVerification: 'Portail officiel IDUFCI',
      dateVerification: '2026-09-26',
      commentaire: 'Concordance totale avec l\'assiette parcellaire au cadastre de Cocody.'
    },
    documents: [
      {
        id: 'doc-002-1',
        dossierId: 'dos-002',
        type: 'ACD',
        nomFichier: 'ACD_arrete_ministeriel_lot184.pdf',
        tailleKo: 3200,
        dateUpload: '2026-09-25T14:10:00Z',
        numeroDocument: 'ACD n°18-0932/MCLU/DGU/DDU',
        dateEmission: '2018-08-22',
        sourceUpload: 'CLIENT',
        hashSha256: 'bc9412e0915fba248102a9e8841029410941829e012891823901928419208412',
        statutAuthentification: 'CONFIRME_PAR_EXPERT',
        extraction: {
          nomBeneficiaire: 'Dr. Toure Ibrahim',
          lot: '184',
          ilot: '12',
          superficieM2: 820,
          commune: 'Cocody',
          lotissement: 'Riviera M\'Badon Extension Tranche 3',
          idufci: 'CI-ABJ-CCD-2021-004512',
          numeroDocument: 'ACD 18-0932',
          dateDocument: '2018-08-22',
          statutExtraction: 'CONFIRME_PAR_EXPERT',
          confianceExtraction: 0.99
        }
      },
      {
        id: 'doc-002-2',
        dossierId: 'dos-002',
        type: 'ETAT_FONCIER',
        nomFichier: 'etat_foncier_conservation_cocody.pdf',
        tailleKo: 1800,
        dateUpload: '2026-09-26T16:00:00Z',
        numeroDocument: 'EF-CCD-2026-10492',
        dateEmission: '2026-09-26',
        sourceUpload: 'EXPERT',
        hashSha256: '990141eab192408c109284091820491820941820491820491820941820941820',
        statutAuthentification: 'AUTHENTIFIE_ADMINISTRATION',
        extraction: {
          nomBeneficiaire: 'Dr. Toure Ibrahim',
          superficieM2: 820,
          lot: '184',
          ilot: '12',
          commune: 'Cocody',
          statutExtraction: 'CONFIRME_PAR_EXPERT'
        }
      }
    ],
    anomalies: [
      {
        id: 'anom-002-1',
        dossierId: 'dos-002',
        type: 'SERVITUDE_NON_DECLAREE',
        gravite: 'VIGILANCE',
        titre: 'Servitude de recul obligatoire de 5 mètres sur façade avant',
        description: 'Le plan d\'alignement municipal de Cocody prescrit une marge de recul de 5 mètres pour les immeubles R+3 dans cette zone.',
        sourceDetection: 'EXPERT_URBANISME',
        detectePar: 'Ing. Amadou Coulibaly',
        dateDetection: '2026-09-27T10:00:00Z',
        statut: 'CONFIRMEE',
        visibleClient: true
      }
    ],
    recherchesAdministratives: [
      {
        id: 'rech-002-1',
        dossierId: 'dos-002',
        type: 'ETAT_FONCIER',
        serviceCible: 'Conservation Foncière de Cocody (DGI)',
        referenceDemande: 'CF-CCD-2026-891',
        dateDemande: '2026-09-26',
        dateReponse: '2026-09-27',
        agentId: 'usr-expert-foncier-01',
        agentNom: 'Me N\'Guessan Yao',
        statut: 'REPONSE_RECUE',
        resultat: 'Titre Foncier n°112.450 de la Riviera inscrit au nom de Toure Ibrahim. Aucune hypothèque ni prénotation d\'opposition inscrite.',
        coutDeboursCfa: 10000,
        sourceCout: 'Tarif officiel DGI État Foncier',
        dateVerificationCout: '2026-09-15'
      },
      {
        id: 'rech-002-2',
        dossierId: 'dos-002',
        type: 'URBANISME',
        serviceCible: 'Mairie de Cocody & Direction de la Construction',
        referenceDemande: 'URB-CCD-2026-302',
        dateDemande: '2026-09-26',
        dateReponse: '2026-09-28',
        agentId: 'usr-expert-urba-01',
        agentNom: 'Ing. Amadou Coulibaly',
        statut: 'REPONSE_RECUE',
        resultat: 'Certificat d\'urbanisme n°2026-CU-041 délivré : Zone Ua2 constructible jusqu\'à R+4.',
        coutDeboursCfa: 50000,
        sourceCout: 'Arrêté MCLU n°0033',
        dateVerificationCout: '2026-08-20'
      }
    ],
    visiteTerrain: {
      id: 'vis-002',
      dossierId: 'dos-002',
      numeroOrdreMission: 'ODM-2026-09-079',
      agentId: 'usr-agent-terrain-01',
      agentNom: 'Bakary Sanogo',
      dateVisite: '2026-09-28',
      heureVisite: '09:30',
      latitude: 5.34211,
      longitude: -3.94823,
      precisionGpsMetres: 1.5,
      bornesRetrouvees: true,
      nbBornesIdentifiees: 4,
      accesVoiePublique: 'VOIE_BITUMEE',
      etatOccupation: 'NU',
      observations: 'Terrain nu, parfaitement borné avec 4 bornes cadastrales intactes. Bordure de voie bitumée avec caniveau bétonné. Réseaux CIE et SODECI en bordure immédiate.',
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=600&auto=format&fit=crop&q=80',
          description: 'Terrain borné et accès voie bitumée Cocody Riviera 4',
          horodatage: '2026-09-28T09:35:00Z',
          latitude: 5.34211,
          longitude: -3.94823
        }
      ],
      anomaliesTerrainConstatees: [],
      disclaimer: 'La visite terrain ne constitue en aucun cas une preuve juridique de propriété.'
    },
    controleUrbanisme: {
      certificatUrbanismeNumero: 'CU-2026-041-CCD',
      certificatUrbanismeDate: '2026-09-28',
      zonePlanUrbanismeDirecteur: 'Zone Ua2 (Habitat collectif et mixte)',
      coefficientEmpriseSolMax: 0.6,
      hauteurMaxAutoriseeMetres: 16,
      servitudesIdentifiees: ['Recul 5m sur alignement voie publique'],
      contraintesParticulieres: ['Prévoir fosse septique aux normes ou raccordement réseau collecteur'],
      compatibiliteProjet: 'COMPATIBLE',
      securiteFonciereStatut: 'FAVORABLE_SOUS_RESERVES',
      constructibiliteStatut: 'CONSTRUCTIBLE_AVEC_PRESCRIPTIONS',
      observationsExpertUrbaniste: 'Projet R+3 parfaitement compatible sous réserve de respect de la marge de recul de 5m en façade.',
      expertNom: 'Ing. Amadou Coulibaly',
      dateControle: '2026-09-28'
    },
    paiement: {
      statut: 'SUCCESS',
      referenceTransaction: 'ORANGE-CI-TX-77810',
      datePaiement: '2026-09-25T14:30:00Z',
      moyenPaiement: 'ORANGE_MONEY',
      honorairesFoncier360Cfa: 250000,
      deboursAdministratifsCfa: 95000,
      deplacementTerrainCfa: 25000,
      prestationsTechniquesCfa: 80000,
      totalTtcCfa: 450000
    },
    rapportFinal: {
      id: 'rap-002',
      dossierId: 'dos-002',
      numeroRapport: 'RAP-F360-2026-0018-V1',
      version: 1,
      dateGeneration: '2026-09-29T16:00:00Z',
      validateurId: 'usr-validateur-01',
      validateurNom: 'Dr. Konan Marie-Laure',
      validateurQualite: 'Directrice Qualité & Validatrice Senior',
      hashSha256: '7f98120b02194a819bce18420918401928410298410298401928401928401928',
      statut: 'VALIDE',
      conclusionGenerale: 'Les contrôles compris dans la formule souscrite ont été réalisés à la date indiquée. Le statut foncier fait l\'objet d\'un Arrêté de Concession Définitive (ACD) régulier et vérifié auprès de la Conservation Foncière de Cocody. Les anomalies et points restant à confirmer sont détaillés dans le présent rapport. Ce rapport ne constitue ni un titre de propriété, ni une décision administrative, ni une garantie de transfert de propriété.',
      elementsFavorables: [
        'ACD régulier inscrit au livre foncier sous le Titre Foncier n°112.450',
        'Lotissement officiel approuvé par arrêté ministériel publié au Journal Officiel',
        'IDUFCI vérifié et concordant avec le cadastre',
        '4 bornes cadastrales retrouvées et conformes au plan géomètre',
        'Voie d\'accès bitumée avec réseaux électricité et eau en bordure'
      ],
      anomaliesRelevees: [
        'Servitude de recul obligatoire de 5m à respecter pour le permis de construire (Vigilance)'
      ],
      pointsRestantAConfirmer: [
        'Obtention effective du permis de construire auprès du Guichet Unique MCLU',
        'Étude de sol géotechnique avant coulage des fondations R+3'
      ],
      recommandationsPratiques: [
        'Faire intervenir l\'architecte pour caler l\'emprise avec le recul de 5m',
        'Exiger la purge notariée habituelle lors de la signature de l\'acte authentique chez le notaire'
      ],
      recommandationsJuridiques: [
        'Passer obligatoirement par un notaire assermenté en Côte d\'Ivoire pour l\'acte de vente authentique',
        'Vérifier l\'absence d\'inscription hypothécaire de dernière minute le jour de la signature'
      ],
      clauseNonGarantie: 'Ce rapport de due diligence exprime l\'état vérifiable du dossier à la date d\'émission. Il ne remplace pas l\'intervention obligatoire du notaire et ne constitue pas une garantie d\'éviction.'
    }
  },
  {
    id: 'dos-003',
    numeroDossier: 'F360-CI-2026-0025',
    dateCreation: '2026-10-01T08:30:00Z',
    statut: 'ANALYSE_DOCUMENTAIRE',
    formule: 'DUE_DILIGENCE_COMPLETE',
    client: {
      id: 'usr-client-03',
      name: 'Moussa Fofana',
      email: 'moussa.fofana@gmail.com',
      role: 'CLIENT',
      phone: '+225 07 47 18 29 30'
    },
    slaEcheanceDate: '2026-10-08T18:00:00Z',
    parcelle: {
      region: 'Abidjan',
      district: 'Autonome d\'Abidjan',
      ville: 'Songon',
      commune: 'Songon',
      quartierVillage: 'Songon Kassemblé',
      lotissementNom: 'Grand Éden Songon',
      lot: '12',
      ilot: '3',
      superficieM2: 600,
      latitude: 5.31294,
      longitude: -4.24182,
      proprietaireDeclare: 'Village de Kassemblé / Promoteur Vision Verte',
      qualiteVendeur: 'PROMOTEUR',
      typeDocumentPrincipal: 'ATTESTATION_VILLAGEOISE'
    },
    lotissementCheck: {
      statut: 'LOTISSEMENT_APPLIQUE_NON_APPROUVE',
      sourceRecherche: 'Direction de la Topographie et de la Cartographie',
      dateVerification: '2026-10-02',
      agentVerificateur: 'Me N\'Guessan Yao',
      commentaireExpert: 'Lotissement appliqué sur le terrain avec voies tracées mais AUCUN arrêté d\'approbation ministérielle délivré à ce jour (Dossier en instance au MCLU).'
    },
    idufciCheck: {
      statut: 'NON_DISPONIBLE',
      sourceVerification: 'Portail IDUFCI',
      dateVerification: '2026-10-02',
      commentaire: 'Aucun IDUFCI ne peut être attribué à un lotissement non encore approuvé par arrêté ministériel.'
    },
    documents: [
      {
        id: 'doc-003-1',
        dossierId: 'dos-003',
        type: 'ATTESTATION_VILLAGEOISE',
        nomFichier: 'attestation_kassemble_visionverte.pdf',
        tailleKo: 1540,
        dateUpload: '2026-10-01T08:45:00Z',
        sourceUpload: 'CLIENT',
        hashSha256: '8841029410941829e012891823901928419208412bc9412e0915fba248102a9e',
        statutAuthentification: 'EXTRAIT_PAR_IA',
        extraction: {
          nomBeneficiaire: 'Moussa Fofana',
          lot: '12',
          ilot: '3',
          superficieM2: 600,
          commune: 'Songon',
          statutExtraction: 'EXTRAIT_PAR_IA'
        }
      }
    ],
    anomalies: [
      {
        id: 'anom-003-1',
        dossierId: 'dos-003',
        type: 'LOTISSEMENT_APPLIQUE_NON_APPROUVE',
        gravite: 'BLOQUANT',
        titre: 'Lotissement appliqué non approuvé (Loi 2024-351)',
        description: 'La commercialisation et l\'achat de parcelles dans un lotissement non approuvé sont formellement sanctionnés par le Code de l\'Urbanisme révisé (Loi n°2024-351). Risque de redressement de voirie ou de non-délivrance d\'ACD.',
        sourceDetection: 'EXPERT_FONCIER',
        detectePar: 'Me N\'Guessan Yao',
        dateDetection: '2026-10-02T10:00:00Z',
        statut: 'CONFIRMEE',
        visibleClient: true,
        notesInternesExpert: 'Nécessite analyse renforcée, recherche administrative auprès du domaine et validation senior obligatoire.'
      }
    ],
    recherchesAdministratives: [
      {
        id: 'rech-003-1',
        dossierId: 'dos-003',
        type: 'LOTISSEMENT',
        serviceCible: 'Direction du Domaine Urbain & Sous-direction des lotissements',
        referenceDemande: 'REC-LOT-SNG-2026-08',
        dateDemande: '2026-10-02',
        agentId: 'usr-expert-foncier-01',
        agentNom: 'Me N\'Guessan Yao',
        statut: 'EN_INSTRUCTION',
        coutDeboursCfa: 15000,
        sourceCout: 'MCLU Domaine Urbain',
        dateVerificationCout: '2026-09-01'
      }
    ],
    paiement: {
      statut: 'SUCCESS',
      referenceTransaction: 'MOOV-CI-TX-10948',
      datePaiement: '2026-10-01T09:00:00Z',
      moyenPaiement: 'MOOV_MONEY',
      honorairesFoncier360Cfa: 150000,
      deboursAdministratifsCfa: 35000,
      deplacementTerrainCfa: 30000,
      prestationsTechniquesCfa: 40000,
      totalTtcCfa: 255000
    }
  },
  {
    id: 'dos-004',
    numeroDossier: 'F360-CI-2026-0031',
    dateCreation: '2026-10-02T11:00:00Z',
    statut: 'RECHERCHE_FONCIERE',
    formule: 'VERIFICATION_EXPRESS',
    client: {
      id: 'usr-client-04',
      name: 'Salimata Diabate',
      email: 'salimata.diabate@yahoo.fr',
      role: 'CLIENT',
      phone: '+225 05 89 22 11 00'
    },
    slaEcheanceDate: '2026-10-05T18:00:00Z',
    parcelle: {
      region: 'Sud-Comoé',
      district: 'Lagunes',
      ville: 'Grand-Bassam',
      commune: 'Grand-Bassam',
      quartierVillage: 'Modeste Ouest',
      lotissementNom: 'Espace Océan Bassam',
      lot: '88',
      ilot: '9',
      superficieM2: 600, // Déclarée par le client
      proprietaireDeclare: 'Famille Modeste / Vendeur Bamba',
      typeDocumentPrincipal: 'EXTRAIT_TOPOGRAPHIQUE'
    },
    lotissementCheck: {
      statut: 'APPROUVE',
      arreteApprobationNumero: 'Arrêté n°1432/MCLU/2021',
      dateArrete: '2021-05-10',
      sourceRecherche: 'Préfecture de Grand-Bassam',
      dateVerification: '2026-10-03',
      agentVerificateur: 'Me N\'Guessan Yao',
      commentaireExpert: 'Lotissement approuvé, mais divergence de contenance relevée entre le plan géomètre et la superficie déclarée.'
    },
    idufciCheck: {
      statut: 'FOURNI_NON_VERIFIE',
      sourceVerification: 'En attente de retour cadastre Bassam',
      dateVerification: '2026-10-03',
      commentaire: 'IDUFCI déclaré en cours de recoupement.'
    },
    documents: [
      {
        id: 'doc-004-1',
        dossierId: 'dos-004',
        type: 'EXTRAIT_TOPOGRAPHIQUE',
        nomFichier: 'extrait_topo_modeste_lot88.pdf',
        tailleKo: 1980,
        dateUpload: '2026-10-02T11:15:00Z',
        sourceUpload: 'CLIENT',
        hashSha256: '389410941829e012891823901928419208412bc9412e0915fba248102a9e8841',
        statutAuthentification: 'CONFIRME_PAR_EXPERT',
        extraction: {
          nomBeneficiaire: 'Vendeur Bamba',
          lot: '88',
          ilot: '9',
          superficieM2: 485, // Divergence : 485 m2 vs 600 m2 déclaré !
          commune: 'Grand-Bassam',
          statutExtraction: 'CONFIRME_PAR_EXPERT'
        },
        verificateurNom: 'Me N\'Guessan Yao'
      }
    ],
    anomalies: [
      {
        id: 'anom-004-1',
        dossierId: 'dos-004',
        type: 'SUPERFICIE_INCOHERENTE',
        gravite: 'IMPORTANT',
        titre: 'Divergence majeure de superficie (485 m² réels vs 600 m² vendus)',
        description: 'L\'extrait topographique officiel du géomètre indique une contenance réelle de 485 m², alors que le contrat préliminaire et le prix demandé portent sur 600 m².',
        preuve: 'Extrait topographique signé par géomètre assermenté OGECI.',
        sourceDetection: 'MOTEUR_COHERENCE',
        detectePar: 'Moteur de cohérence FONCIER 360',
        dateDetection: '2026-10-02T14:00:00Z',
        statut: 'CONFIRMEE',
        visibleClient: true
      }
    ],
    recherchesAdministratives: [
      {
        id: 'rech-004-1',
        dossierId: 'dos-004',
        type: 'TOPOGRAPHIE',
        serviceCible: 'Service du Cadastre de Grand-Bassam',
        referenceDemande: 'DEM-CAD-GBM-991',
        dateDemande: '2026-10-02',
        agentId: 'usr-expert-foncier-01',
        agentNom: 'Me N\'Guessan Yao',
        statut: 'EN_INSTRUCTION',
        coutDeboursCfa: 30000,
        sourceCout: 'Barème DTC Cadastre',
        dateVerificationCout: '2026-07-10'
      }
    ],
    paiement: {
      statut: 'SUCCESS',
      referenceTransaction: 'CB-STRIPE-FR-88910',
      datePaiement: '2026-10-02T11:05:00Z',
      moyenPaiement: 'CARTE_BANCAIRE',
      honorairesFoncier360Cfa: 120000,
      deboursAdministratifsCfa: 30000,
      deplacementTerrainCfa: 0,
      prestationsTechniquesCfa: 0,
      totalTtcCfa: 150000
    }
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: '2026-09-28T09:15:00Z',
    userId: 'usr-client-01',
    userName: 'Aubin Franck',
    userRole: 'CLIENT',
    action: 'CREATION_DOSSIER',
    dossierId: 'dos-001',
    details: 'Création du dossier de due diligence pour la parcelle Bingerville Akouai Santai Lot 412 Îlot 38.'
  },
  {
    id: 'log-002',
    timestamp: '2026-09-28T10:00:00Z',
    userId: 'usr-client-01',
    userName: 'Aubin Franck',
    userRole: 'CLIENT',
    action: 'PAIEMENT_VALIDE',
    dossierId: 'dos-001',
    details: 'Paiement Wave validé : 275 000 FCFA (Honoraires: 150k, Débours: 40k, Déplacement: 35k, Tech: 50k).'
  },
  {
    id: 'log-003',
    timestamp: '2026-09-29T14:30:00Z',
    userId: 'usr-expert-foncier-01',
    userName: 'Me N\'Guessan Yao',
    userRole: 'EXPERT_FONCIER',
    action: 'ANOMALIE_CREEE',
    dossierId: 'dos-001',
    details: 'Détection anomalie bloquante : Lotissement Les Palmiers 2 EN SURSIS ministériel.'
  },
  {
    id: 'log-004',
    timestamp: '2026-09-29T16:00:00Z',
    userId: 'usr-validateur-01',
    userName: 'Dr. Konan Marie-Laure',
    userRole: 'VALIDATEUR',
    action: 'RAPPORT_VALIDE_SIGNE',
    dossierId: 'dos-002',
    details: 'Validation et signature électronique du rapport d\'audit F360-CI-2026-0018-V1 (Cocody M\'Badon).'
  }
];
