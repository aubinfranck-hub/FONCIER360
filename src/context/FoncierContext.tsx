import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  DossierFoncier,
  TarifReference,
  ReglementationItem,
  AuditLog,
  DocumentFoncier,
  RechercheAdministrative,
  VisiteTerrain,
  Anomalie,
  ControleUrbanisme,
  PaiementDossier,
  RapportFoncier,
  DossierStatus
} from '../types/foncier360';
import {
  INITIAL_USERS,
  INITIAL_DOSSIERS,
  REFERENCE_TARIFFS,
  OFFICIAL_REGULATIONS,
  INITIAL_AUDIT_LOGS
} from '../data/seedData';
import { analyserCoherenceDossier } from '../services/consistencyEngine';

interface FoncierContextType {
  currentUser: User;
  allUsers: User[];
  setCurrentUserRole: (role: UserRole) => void;
  setCurrentUserById: (userId: string) => void;
  dossiers: DossierFoncier[];
  tarifs: TarifReference[];
  reglementations: ReglementationItem[];
  auditLogs: AuditLog[];
  selectedDossierId: string | null;
  setSelectedDossierId: (id: string | null) => void;

  // Actions métier
  creerNouveauDossier: (dossier: Omit<DossierFoncier, 'id' | 'numeroDossier' | 'dateCreation' | 'anomalies' | 'recherchesAdministratives'>) => string;
  mettreAJourDossier: (dossierId: string, updates: Partial<DossierFoncier>) => void;
  changerStatutDossier: (dossierId: string, statut: DossierStatus, motif?: string) => void;
  ajouterDocument: (dossierId: string, doc: Omit<DocumentFoncier, 'id' | 'dossierId' | 'dateUpload' | 'hashSha256'>) => void;
  confirmerExtractionExpert: (dossierId: string, docId: string, extractionsCorrigees: any) => void;
  ajouterRechercheAdministrative: (dossierId: string, rech: Omit<RechercheAdministrative, 'id' | 'dossierId'>) => void;
  mettreAJourRecherche: (dossierId: string, rechercheId: string, updates: Partial<RechercheAdministrative>) => void;
  enregistrerVisiteTerrain: (dossierId: string, visite: Omit<VisiteTerrain, 'id' | 'dossierId'>) => void;
  ajouterAnomalieManuelle: (dossierId: string, anomalie: Omit<Anomalie, 'id' | 'dossierId' | 'dateDetection'>) => void;
  resoudreAnomalie: (dossierId: string, anomalieId: string, resolution: string) => void;
  enregistrerControleUrbanisme: (dossierId: string, controle: ControleUrbanisme) => void;
  validerPaiementClient: (dossierId: string, moyen: PaiementDossier['moyenPaiement'], refTx: string) => void;
  genererRapportDossier: (dossierId: string) => void;
  validerRapportSenior: (dossierId: string, approbation: boolean, motif?: string) => void;
  poserQuestionClient: (dossierId: string, question: string) => void;
  repondreQuestionClient: (dossierId: string, demandeId: string, reponse: string) => void;
  mettreAJourTarif: (tarifId: string, updates: Partial<TarifReference>) => void;
  executerCasTestMetier: (casNumero: number) => void;
  reinitialiserDonnees: () => void;
}

const STORAGE_KEY_DOSSIERS = 'foncier360_dossiers_v1';
const STORAGE_KEY_LOGS = 'foncier360_logs_v1';
const STORAGE_KEY_TARIFS = 'foncier360_tarifs_v1';

const FoncierContext = createContext<FoncierContextType | undefined>(undefined);

export const FoncierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Default to Client
  const [allUsers] = useState<User[]>(INITIAL_USERS);
  const [dossiers, setDossiers] = useState<DossierFoncier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DOSSIERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erreur parsing storage dossiers', e);
      }
    }
    return INITIAL_DOSSIERS;
  });

  const [tarifs, setTarifs] = useState<TarifReference[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TARIFS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erreur parsing storage tarifs', e);
      }
    }
    return REFERENCE_TARIFFS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LOGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erreur parsing storage logs', e);
      }
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [reglementations] = useState<ReglementationItem[]>(OFFICIAL_REGULATIONS);
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(dossiers[0]?.id || null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DOSSIERS, JSON.stringify(dossiers));
  }, [dossiers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TARIFS, JSON.stringify(tarifs));
  }, [tarifs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  const logAction = (action: string, dossierId?: string, details?: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      dossierId,
      details: details || `Action ${action} effectuée par ${currentUser.name}`
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const setCurrentUserRole = (role: UserRole) => {
    const userWithRole = allUsers.find((u) => u.role === role);
    if (userWithRole) {
      setCurrentUser(userWithRole);
      logAction('CHANGEMENT_ROLE_SIMULE', undefined, `Utilisateur basculé sur le profil : ${userWithRole.name} (${role})`);
    }
  };

  const setCurrentUserById = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const creerNouveauDossier = (
    data: Omit<DossierFoncier, 'id' | 'numeroDossier' | 'dateCreation' | 'anomalies' | 'recherchesAdministratives'>
  ): string => {
    const newId = `dos-${Date.now()}`;
    const seq = Math.floor(1000 + Math.random() * 9000);
    const numeroDossier = `F360-CI-2026-${seq}`;

    // Calcul automatique du devis initial en séparant rigoureusement les coûts
    const honoraires = data.formule === 'VERIFICATION_EXPRESS' ? 120000 : data.formule === 'DUE_DILIGENCE_COMPLETE' ? 220000 : 350000;
    const debours = 65000;
    const deplacement = 35000;
    const tech = data.formule === 'AUDIT_PRE_INVESTISSEMENT_DIASPORA' ? 60000 : 30000;
    const totalTtc = honoraires + debours + deplacement + tech;

    const nouveauDossier: DossierFoncier = {
      ...data,
      id: newId,
      numeroDossier,
      dateCreation: new Date().toISOString(),
      statut: 'QUALIFICATION',
      anomalies: [],
      recherchesAdministratives: [],
      paiement: {
        statut: 'INITIATED',
        honorairesFoncier360Cfa: honoraires,
        deboursAdministratifsCfa: debours,
        deplacementTerrainCfa: deplacement,
        prestationsTechniquesCfa: tech,
        totalTtcCfa: totalTtc
      }
    };

    // Analyse de cohérence initiale
    const diag = analyserCoherenceDossier(nouveauDossier);
    if (diag.anomaliesDetectees.length > 0) {
      nouveauDossier.anomalies = diag.anomaliesDetectees.map((a, idx) => ({
        ...a,
        id: `anom-${newId}-${idx + 1}`,
        dossierId: newId,
        dateDetection: new Date().toISOString()
      }));
    }

    setDossiers((prev) => [nouveauDossier, ...prev]);
    setSelectedDossierId(newId);
    logAction('CREATION_DOSSIER', newId, `Création du dossier ${numeroDossier} pour la parcelle à ${data.parcelle.commune}.`);
    return newId;
  };

  const mettreAJourDossier = (dossierId: string, updates: Partial<DossierFoncier>) => {
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          const updated = { ...d, ...updates };
          return updated;
        }
        return d;
      })
    );
    logAction('MISE_A_JOUR_DOSSIER', dossierId, `Mise à jour des champs du dossier.`);
  };

  const changerStatutDossier = (dossierId: string, statut: DossierStatus, motif?: string) => {
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          return { ...d, statut };
        }
        return d;
      })
    );
    logAction('CHANGEMENT_STATUT', dossierId, `Nouveau statut : ${statut}${motif ? ` (Motif : ${motif})` : ''}`);
  };

  const ajouterDocument = (
    dossierId: string,
    doc: Omit<DocumentFoncier, 'id' | 'dossierId' | 'dateUpload' | 'hashSha256'>
  ) => {
    const docId = `doc-${Date.now()}`;
    const hashSimule = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const nouveauDoc: DocumentFoncier = {
      ...doc,
      id: docId,
      dossierId,
      dateUpload: new Date().toISOString(),
      hashSha256: hashSimule
    };

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          const docsUpdated = [...d.documents, nouveauDoc];
          const tempDossier = { ...d, documents: docsUpdated };
          // Re-vérification de cohérence
          const diag = analyserCoherenceDossier(tempDossier);
          const anomaliesExistantes = d.anomalies.filter((a) => a.sourceDetection !== 'MOTEUR_COHERENCE');
          const nouvellesAnomalies = diag.anomaliesDetectees.map((a, idx) => ({
            ...a,
            id: `anom-auto-${Date.now()}-${idx}`,
            dossierId,
            dateDetection: new Date().toISOString()
          }));

          return {
            ...tempDossier,
            anomalies: [...anomaliesExistantes, ...nouvellesAnomalies]
          };
        }
        return d;
      })
    );

    logAction('AJOUT_DOCUMENT', dossierId, `Ajout document ${doc.type} (${doc.nomFichier}). Statut extraction: ${doc.extraction?.statutExtraction || 'NON_VERIFIE'}`);
  };

  const confirmerExtractionExpert = (dossierId: string, docId: string, extractionsCorrigees: any) => {
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          const docsUpdated = d.documents.map((doc) => {
            if (doc.id === docId) {
              return {
                ...doc,
                statutAuthentification: 'CONFIRME_PAR_EXPERT' as const,
                extraction: {
                  ...doc.extraction,
                  ...extractionsCorrigees,
                  statutExtraction: 'CONFIRME_PAR_EXPERT' as const
                },
                verificateurId: currentUser.id,
                verificateurNom: currentUser.name,
                dateVerification: new Date().toISOString()
              };
            }
            return doc;
          });

          const temp = { ...d, documents: docsUpdated };
          const diag = analyserCoherenceDossier(temp);
          const anomaliesExpert = d.anomalies.filter((a) => a.sourceDetection !== 'MOTEUR_COHERENCE');
          const autoAnom = diag.anomaliesDetectees.map((a, i) => ({
            ...a,
            id: `anom-cross-${Date.now()}-${i}`,
            dossierId,
            dateDetection: new Date().toISOString()
          }));

          return {
            ...temp,
            anomalies: [...anomaliesExpert, ...autoAnom]
          };
        }
        return d;
      })
    );

    logAction('EXTRACTION_CONFIRMEE_EXPERT', dossierId, `Validation humaine des données extraites pour le document ${docId} par ${currentUser.name}.`);
  };

  const ajouterRechercheAdministrative = (dossierId: string, rech: Omit<RechercheAdministrative, 'id' | 'dossierId'>) => {
    const rechId = `rech-${Date.now()}`;
    const nouvelleRech: RechercheAdministrative = {
      ...rech,
      id: rechId,
      dossierId
    };

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          return {
            ...d,
            recherchesAdministratives: [...d.recherchesAdministratives, nouvelleRech]
          };
        }
        return d;
      })
    );

    logAction('RECHERCHE_ADMIN_CREEE', dossierId, `Recherche initiée : ${rech.type} auprès de ${rech.serviceCible} (Réf : ${rech.referenceDemande})`);
  };

  const mettreAJourRecherche = (dossierId: string, rechercheId: string, updates: Partial<RechercheAdministrative>) => {
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          const list = d.recherchesAdministratives.map((r) => (r.id === rechercheId ? { ...r, ...updates } : r));
          return { ...d, recherchesAdministratives: list };
        }
        return d;
      })
    );
    logAction('RECHERCHE_ADMIN_MAJ', dossierId, `Mise à jour recherche administrative ${rechercheId}`);
  };

  const enregistrerVisiteTerrain = (dossierId: string, visite: Omit<VisiteTerrain, 'id' | 'dossierId'>) => {
    const nouvelleVisite: VisiteTerrain = {
      ...visite,
      id: `vis-${Date.now()}`,
      dossierId,
      disclaimer: 'La visite terrain a pour but exclusif de constater la réalité physique de la parcelle, ses accès et son occupation visible à la date de mission. Elle ne constitue en aucun cas une preuve juridique de propriété.'
    };

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          // Si anomalies de terrain constatées, ajouter en anomalies du dossier
          const anomsTerrain: Anomalie[] = visite.anomaliesTerrainConstatees.map((txt, idx) => ({
            id: `anom-ter-${Date.now()}-${idx}`,
            dossierId,
            type: 'EMPIETEMENT_CONSTATE',
            gravite: 'IMPORTANT',
            titre: `Anomalie de terrain : ${txt}`,
            description: `Constaté sur site lors de la visite terrain : ${txt}`,
            sourceDetection: 'VISITE_TERRAIN',
            detectePar: visite.agentNom,
            dateDetection: new Date().toISOString(),
            statut: 'CONFIRMEE',
            visibleClient: true
          }));

          return {
            ...d,
            visiteTerrain: nouvelleVisite,
            anomalies: [...d.anomalies, ...anomsTerrain],
            statut: 'CONTROLE_QUALITE'
          };
        }
        return d;
      })
    );

    logAction('VISITE_TERRAIN_ENREGISTREE', dossierId, `Compte-rendu de visite terrain ODM ${visite.numeroOrdreMission} par ${visite.agentNom}. Bornes : ${visite.bornesRetrouvees ? 'OUI' : 'NON'}`);
  };

  const ajouterAnomalieManuelle = (dossierId: string, anomalie: Omit<Anomalie, 'id' | 'dossierId' | 'dateDetection'>) => {
    const anomId = `anom-man-${Date.now()}`;
    const nouvelleAnomalie: Anomalie = {
      ...anomalie,
      id: anomId,
      dossierId,
      dateDetection: new Date().toISOString()
    };

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          return {
            ...d,
            anomalies: [...d.anomalies, nouvelleAnomalie]
          };
        }
        return d;
      })
    );

    logAction('ANOMALIE_CREEE', dossierId, `Anomalie (${anomalie.gravite}) : ${anomalie.titre}`);
  };

  const resoudreAnomalie = (dossierId: string, anomalieId: string, resolution: string) => {
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          const list = d.anomalies.map((a) => {
            if (a.id === anomalieId) {
              return {
                ...a,
                statut: 'RESOLUE' as const,
                resolution,
                dateResolution: new Date().toISOString(),
                resoluPar: currentUser.name
              };
            }
            return a;
          });
          return { ...d, anomalies: list };
        }
        return d;
      })
    );

    logAction('ANOMALIE_RESOLUE', dossierId, `Anomalie ${anomalieId} marquée résolue par ${currentUser.name}`);
  };

  const enregistrerControleUrbanisme = (dossierId: string, controle: ControleUrbanisme) => {
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          return {
            ...d,
            controleUrbanisme: {
              ...controle,
              expertNom: currentUser.name,
              dateControle: new Date().toISOString().split('T')[0]
            }
          };
        }
        return d;
      })
    );
    logAction('CONTROLE_URBANISME_ENREGISTRE', dossierId, `Avis urbanisme enregistré par ${currentUser.name}. Statut constructibilité : ${controle.constructibiliteStatut}`);
  };

  const validerPaiementClient = (dossierId: string, moyen: PaiementDossier['moyenPaiement'], refTx: string) => {
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          return {
            ...d,
            statut: 'PRE_VERIFICATION',
            paiement: {
              ...d.paiement,
              statut: 'SUCCESS',
              moyenPaiement: moyen,
              referenceTransaction: refTx,
              datePaiement: new Date().toISOString()
            }
          };
        }
        return d;
      })
    );
    logAction('PAIEMENT_VALIDE', dossierId, `Paiement confirmé via ${moyen} (Réf : ${refTx})`);
  };

  const genererRapportDossier = (dossierId: string) => {
    const target = dossiers.find((d) => d.id === dossierId);
    if (!target) return;

    const hasBloquant = target.anomalies.some((a) => a.gravite === 'BLOQUANT' && a.statut !== 'RESOLUE');
    const isEnSursis = target.lotissementCheck.statut === 'EN_SURSIS';
    const isNonApprouve = target.lotissementCheck.statut === 'LOTISSEMENT_APPLIQUE_NON_APPROUVE';

    let conclusion = '';
    if (hasBloquant || isEnSursis || isNonApprouve) {
      conclusion = `Les contrôles compris dans la formule souscrite ont été réalisés à la date indiquée. Des anomalies critiques et/ou un blocage administratif majeur ont été constatés (lotissement en sursis, identifiant contradictoire ou infraction aux textes en vigueur). Aucune acquisition ni mise en valeur n'est recommandée dans l'état actuel du dossier. Les éléments favorables, anomalies et points restant à confirmer sont détaillés dans le présent rapport. Ce rapport ne constitue ni un titre de propriété, ni une décision administrative, ni une garantie de transfert de propriété.`;
    } else {
      conclusion = `Les contrôles compris dans la formule souscrite ont été réalisés à la date indiquée. Les éléments documentaires et les vérifications administratives présentent une concordance favorable sous réserve du respect des servitudes et formalités notariales obligatoires. Les anomalies secondaires et points restant à confirmer sont détaillés dans le présent rapport. Ce rapport ne constitue ni un titre de propriété, ni une décision administrative, ni une garantie de transfert de propriété.`;
    }

    const favor = [];
    if (target.lotissementCheck.statut === 'APPROUVE') favor.push(`Lotissement approuvé par arrêté officiel (${target.lotissementCheck.arreteApprobationNumero || 'Vérifié'}).`);
    if (target.idufciCheck.statut === 'CONFIRME') favor.push(`IDUFCI confirmé au cadastre officiel.`);
    if (target.documents.some((doc) => doc.type === 'ACD')) favor.push(`Arrêté de Concession Définitive (ACD) existant.`);
    if (target.visiteTerrain?.bornesRetrouvees) favor.push(`Bornage matérialisé sur site (${target.visiteTerrain.nbBornesIdentifiees} bornes identifiées).`);
    if (favor.length === 0) favor.push(`Dossier constitué et instruit méthodiquement selon les règles de diligence.`);

    const anomsList = target.anomalies.map((a) => `[${a.gravite}] ${a.titre} : ${a.description}`);
    const unverified = [
      'Authenticité matérielle définitive des originaux papier (compétence exclusive du Notaire instrumentaire)',
      'Levée des hypothèques ou privilèges de dernière minute au livre foncier le jour de la signature'
    ];

    const recomPrat = [
      'Ne verser aucun acompte sous seing privé sans la présence et le séquestre d\'un Notaire assermenté',
      'Exiger un plan de bornage contradictoire signé par un géomètre-expert inscrit à l\'OGECI'
    ];

    const recomJur = [
      'Passation impérative de l\'acte authentique de vente par-devant Notaire en Côte d\'Ivoire',
      'Vérifier auprès de la Conservation Foncière l\'absence de commandement de saisie ou prénotation judiciaire'
    ];

    const hashReport = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const nouveauRapport: RapportFoncier = {
      id: `rap-${Date.now()}`,
      dossierId,
      numeroRapport: `RAP-${target.numeroDossier}-V1`,
      version: 1,
      dateGeneration: new Date().toISOString(),
      validateurId: currentUser.id,
      validateurNom: currentUser.name,
      validateurQualite: currentUser.role === 'VALIDATEUR' ? 'Validatrice Senior FONCIER 360' : 'Expert Foncier Référent',
      hashSha256: hashReport,
      statut: hasBloquant ? 'SOUMIS_VALIDATION' : 'VALIDE',
      conclusionGenerale: conclusion,
      elementsFavorables: favor,
      anomaliesRelevees: anomsList,
      pointsRestantAConfirmer: unverified,
      recommandationsPratiques: recomPrat,
      recommandationsJuridiques: recomJur,
      clauseNonGarantie: `FONCIER 360 n'est ni un office notarial, ni un service du Cadastre, ni la Conservation Foncière. Les avis émis résultent des vérifications diligentes au jour dit. Ce document ne confère aucun droit réel et ne constitue pas une garantie d'éviction ou de propriété.`
    };

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          return {
            ...d,
            rapportFinal: nouveauRapport,
            statut: hasBloquant ? 'VALIDATION_SENIOR' : 'RAPPORT_GENERE'
          };
        }
        return d;
      })
    );

    logAction('RAPPORT_GENERE', dossierId, `Génération du rapport ${nouveauRapport.numeroRapport} (Statut: ${nouveauRapport.statut})`);
  };

  const validerRapportSenior = (dossierId: string, approbation: boolean, motif?: string) => {
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId && d.rapportFinal) {
          return {
            ...d,
            statut: approbation ? 'LIVRE' : 'CONTROLE_QUALITE',
            rapportFinal: {
              ...d.rapportFinal,
              statut: approbation ? 'VALIDE' : 'REJETE',
              validateurId: currentUser.id,
              validateurNom: currentUser.name,
              validateurQualite: 'Direction Technique et Juridique Senior'
            }
          };
        }
        return d;
      })
    );
    logAction(
      approbation ? 'VALIDATION_SENIOR_APPROUVEE' : 'VALIDATION_SENIOR_REJETEE',
      dossierId,
      `Décision de validation senior par ${currentUser.name} : ${approbation ? 'APPROUVÉ & LIVRÉ' : 'REJETÉ POUR RÉVISION'} (Motif : ${motif || 'Conforme aux exigences'})`
    );
  };

  const poserQuestionClient = (dossierId: string, question: string) => {
    const demId = `dem-${Date.now()}`;
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          const demandes = d.demandesComplementairesClient || [];
          return {
            ...d,
            demandesComplementairesClient: [
              ...demandes,
              {
                id: demId,
                date: new Date().toISOString(),
                question,
                demandeurNom: currentUser.name,
                resolu: false
              }
            ]
          };
        }
        return d;
      })
    );
    logAction('DEMANDE_CLIENT_SOUMISE', dossierId, `Nouvelle question client : ${question}`);
  };

  const repondreQuestionClient = (dossierId: string, demandeId: string, reponse: string) => {
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId && d.demandesComplementairesClient) {
          const list = d.demandesComplementairesClient.map((dem) => {
            if (dem.id === demandeId) {
              return {
                ...dem,
                reponse,
                dateReponse: new Date().toISOString(),
                resolu: true
              };
            }
            return dem;
          });
          return { ...d, demandesComplementairesClient: list };
        }
        return d;
      })
    );
    logAction('DEMANDE_CLIENT_REPONDUE', dossierId, `Réponse fournie à la demande client ${demandeId}`);
  };

  const mettreAJourTarif = (tarifId: string, updates: Partial<TarifReference>) => {
    setTarifs((prev) =>
      prev.map((t) => {
        if (t.id === tarifId) {
          return {
            ...t,
            ...updates,
            dateDerniereVerification: new Date().toISOString().split('T')[0]
          };
        }
        return t;
      })
    );
    logAction('TARIF_MODIFIE', undefined, `Mise à jour du tarif référence ${tarifId} par l'administrateur.`);
  };

  // Exécuteur des 10 cas de test métier requis par la Section 47
  const executerCasTestMetier = (casNumero: number) => {
    let testDossier: DossierFoncier;
    const nowIso = new Date().toISOString();

    switch (casNumero) {
      case 1: // Lotissement approuvé + documents cohérents
        testDossier = {
          id: `dos-test-cas1-${Date.now()}`,
          numeroDossier: `TEST-CAS1-APPROUVE`,
          dateCreation: nowIso,
          statut: 'RAPPORT_GENERE',
          formule: 'DUE_DILIGENCE_COMPLETE',
          client: INITIAL_USERS[0],
          slaEcheanceDate: nowIso,
          parcelle: {
            region: 'Abidjan',
            district: 'Autonome d\'Abidjan',
            ville: 'Abidjan',
            commune: 'Cocody',
            quartierVillage: 'Angré 8ème Tranche',
            lotissementNom: 'Soleil Levant 1',
            lot: '45',
            ilot: '6',
            superficieM2: 600,
            idufciFourni: 'CI-ABJ-CCD-2022-008129',
            proprietaireDeclare: 'Kouame Yao Michel',
            typeDocumentPrincipal: 'ACD'
          },
          lotissementCheck: {
            statut: 'APPROUVE',
            arreteApprobationNumero: 'Arrêté n°0312/MCU/DGU du 12 juin 2019',
            dateArrete: '2019-06-12',
            sourceRecherche: 'Direction Générale de l\'Urbanisme (MCLU)',
            dateVerification: nowIso.split('T')[0],
            agentVerificateur: 'Me N\'Guessan Yao',
            commentaireExpert: 'Lotissement régulier, viabilisé et approuvé au Journal Officiel.'
          },
          idufciCheck: {
            statut: 'CONFIRME',
            idufciReel: 'CI-ABJ-CCD-2022-008129',
            sourceVerification: 'Portail IDUFCI',
            dateVerification: nowIso.split('T')[0],
            commentaire: 'Identifiant cohérent et attribué à cette parcelle.'
          },
          documents: [
            {
              id: 'doc-cas1-1',
              dossierId: 'test-1',
              type: 'ACD',
              nomFichier: 'ACD_Kouame_Michel.pdf',
              tailleKo: 2100,
              dateUpload: nowIso,
              hashSha256: 'cas1hash0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
              statutAuthentification: 'CONFIRME_PAR_EXPERT',
              sourceUpload: 'CLIENT',
              extraction: {
                nomBeneficiaire: 'Kouame Yao Michel',
                lot: '45',
                ilot: '6',
                superficieM2: 600,
                commune: 'Cocody',
                statutExtraction: 'CONFIRME_PAR_EXPERT'
              }
            }
          ],
          anomalies: [],
          recherchesAdministratives: [
            {
              id: 'rech-cas1',
              dossierId: 'test-1',
              type: 'POSITION_FONCIERE',
              serviceCible: 'Conservation Foncière de Cocody',
              referenceDemande: 'REC-CAS1-881',
              dateDemande: nowIso.split('T')[0],
              agentId: 'usr-expert-foncier-01',
              agentNom: 'Me N\'Guessan Yao',
              statut: 'REPONSE_RECUE',
              resultat: 'Titre Foncier net sans inscription hypothécaire ni litige.',
              coutDeboursCfa: 10000,
              sourceCout: 'DGI Tarif officiel',
              dateVerificationCout: nowIso.split('T')[0]
            }
          ],
          paiement: {
            statut: 'SUCCESS',
            honorairesFoncier360Cfa: 220000,
            deboursAdministratifsCfa: 50000,
            deplacementTerrainCfa: 30000,
            prestationsTechniquesCfa: 50000,
            totalTtcCfa: 350000
          }
        };
        break;

      case 2: // Lotissement non retrouvé
        testDossier = {
          id: `dos-test-cas2-${Date.now()}`,
          numeroDossier: `TEST-CAS2-NON-RETROUVE`,
          dateCreation: nowIso,
          statut: 'RECHERCHE_FONCIERE',
          formule: 'DUE_DILIGENCE_COMPLETE',
          client: INITIAL_USERS[0],
          slaEcheanceDate: nowIso,
          parcelle: {
            region: 'Abidjan',
            district: 'Autonome d\'Abidjan',
            ville: 'Anyama',
            commune: 'Anyama',
            quartierVillage: 'Ebimpé Sud',
            lotissementNom: 'Cité Espérance Anyama',
            lot: '102',
            ilot: '14',
            superficieM2: 500,
            proprietaireDeclare: 'Gbagbo Sylvain',
            typeDocumentPrincipal: 'ATTESTATION_VILLAGEOISE'
          },
          lotissementCheck: {
            statut: 'NON_RETROUVE', // NON_RETROUVE != ANNULE
            sourceRecherche: 'Direction Générale de l\'Urbanisme (Archives numériques)',
            dateVerification: nowIso.split('T')[0],
            agentVerificateur: 'Me N\'Guessan Yao',
            commentaireExpert: 'Lotissement non répertorié dans la base SIGFU actuelle. Règle absolue : une absence de résultat ne constitue pas une annulation.'
          },
          idufciCheck: {
            statut: 'NON_FOURNI',
            sourceVerification: 'Portail IDUFCI',
            dateVerification: nowIso.split('T')[0],
            commentaire: 'Non renseigné par le client.'
          },
          documents: [],
          anomalies: [
            {
              id: 'anom-cas2',
              dossierId: 'test-2',
              type: 'REFERENCE_MANQUANTE',
              gravite: 'VIGILANCE',
              titre: 'Lotissement non retrouvé dans l\'immédiat aux archives ordinaires',
              description: 'Recherches physiques complémentaires requises aux archives centrales du Ministère. Ne pas assimiler à une annulation.',
              sourceDetection: 'EXPERT_FONCIER',
              detectePar: 'Me N\'Guessan Yao',
              dateDetection: nowIso,
              statut: 'DETECTEE',
              visibleClient: true
            }
          ],
          recherchesAdministratives: [],
          paiement: {
            statut: 'SUCCESS',
            honorairesFoncier360Cfa: 150000,
            deboursAdministratifsCfa: 40000,
            deplacementTerrainCfa: 30000,
            prestationsTechniquesCfa: 30000,
            totalTtcCfa: 250000
          }
        };
        break;

      case 3: // Lotissement annulé
        testDossier = {
          id: `dos-test-cas3-${Date.now()}`,
          numeroDossier: `TEST-CAS3-ANNULE`,
          dateCreation: nowIso,
          statut: 'VALIDATION_SENIOR',
          formule: 'DUE_DILIGENCE_COMPLETE',
          client: INITIAL_USERS[0],
          slaEcheanceDate: nowIso,
          parcelle: {
            region: 'Abidjan',
            district: 'Autonome d\'Abidjan',
            ville: 'Abidjan',
            commune: 'Port-Bouët',
            quartierVillage: 'Adjouffou',
            lotissementNom: 'Zone Aéroportuaire Sud',
            lot: '78',
            ilot: '4',
            superficieM2: 800,
            proprietaireDeclare: 'Koffi Paul',
            typeDocumentPrincipal: 'LETTRE_ATTRIBUTION'
          },
          lotissementCheck: {
            statut: 'ANNULE',
            arreteApprobationNumero: 'Arrêté d\'annulation ministériel n°0049/MCU/2021',
            dateArrete: '2021-03-15',
            sourceRecherche: 'Journal Officiel de la République de Côte d\'Ivoire',
            dateVerification: nowIso.split('T')[0],
            agentVerificateur: 'Me N\'Guessan Yao',
            commentaireExpert: 'Arrêté d\'annulation formel pour cause d\'empiètement sur la servitude de sécurité aéroportuaire.'
          },
          idufciCheck: {
            statut: 'INCOHERENT',
            sourceVerification: 'Portail IDUFCI',
            dateVerification: nowIso.split('T')[0],
            commentaire: 'Parcelle radiée du registre.'
          },
          documents: [],
          anomalies: [
            {
              id: 'anom-cas3',
              dossierId: 'test-3',
              type: 'LOTISSEMENT_INCOHERENT',
              gravite: 'BLOQUANT',
              titre: 'Lotissement frappé d\'un arrêté d\'annulation ministérielle',
              description: 'Le lotissement est officiellement annulé. Tout acte d\'acquisition est nul d\'ordre public.',
              sourceDetection: 'EXPERT_FONCIER',
              detectePar: 'Me N\'Guessan Yao',
              dateDetection: nowIso,
              statut: 'CONFIRMEE',
              visibleClient: true
            }
          ],
          recherchesAdministratives: [],
          paiement: {
            statut: 'SUCCESS',
            honorairesFoncier360Cfa: 150000,
            deboursAdministratifsCfa: 40000,
            deplacementTerrainCfa: 30000,
            prestationsTechniquesCfa: 30000,
            totalTtcCfa: 250000
          }
        };
        break;

      case 4: // Lotissement en sursis
        testDossier = {
          id: `dos-test-cas4-${Date.now()}`,
          numeroDossier: `TEST-CAS4-EN-SURSIS`,
          dateCreation: nowIso,
          statut: 'VALIDATION_SENIOR',
          formule: 'DUE_DILIGENCE_COMPLETE',
          client: INITIAL_USERS[0],
          slaEcheanceDate: nowIso,
          parcelle: {
            region: 'Abidjan',
            district: 'Autonome d\'Abidjan',
            ville: 'Bingerville',
            commune: 'Bingerville',
            quartierVillage: 'Adjamé-Bingerville',
            lotissementNom: 'Domaine de la Lagune',
            lot: '210',
            ilot: '18',
            superficieM2: 500,
            proprietaireDeclare: 'Konate Lassana',
            typeDocumentPrincipal: 'ATTESTATION_VILLAGEOISE'
          },
          lotissementCheck: {
            statut: 'EN_SURSIS',
            arreteApprobationNumero: 'Notification de sursis n°112/MCLU/2023',
            sourceRecherche: 'Direction du Domaine Urbain',
            dateVerification: nowIso.split('T')[0],
            agentVerificateur: 'Me N\'Guessan Yao',
            commentaireExpert: 'Litige de délimitation coutumière. Arrêté placé en sursis. Bloque toute conclusion favorable standard.'
          },
          idufciCheck: {
            statut: 'NON_DISPONIBLE',
            sourceVerification: 'MCLU',
            dateVerification: nowIso.split('T')[0],
            commentaire: 'Gelé pendant la durée du sursis.'
          },
          documents: [],
          anomalies: [
            {
              id: 'anom-cas4',
              dossierId: 'test-4',
              type: 'LOTISSEMENT_EN_SURSIS',
              gravite: 'BLOQUANT',
              titre: 'Lotissement sous arrêté de sursis (Litige coutumier actif)',
              description: 'Blocage obligatoire de la conclusion favorable. Imposer validation senior et recherche administrative.',
              sourceDetection: 'EXPERT_FONCIER',
              detectePar: 'Me N\'Guessan Yao',
              dateDetection: nowIso,
              statut: 'CONFIRMEE',
              visibleClient: true
            }
          ],
          recherchesAdministratives: [],
          paiement: {
            statut: 'SUCCESS',
            honorairesFoncier360Cfa: 150000,
            deboursAdministratifsCfa: 40000,
            deplacementTerrainCfa: 30000,
            prestationsTechniquesCfa: 30000,
            totalTtcCfa: 250000
          }
        };
        break;

      case 5: // Lotissement appliqué non approuvé
        testDossier = {
          id: `dos-test-cas5-${Date.now()}`,
          numeroDossier: `TEST-CAS5-APPLIQUE-NON-APPROUVE`,
          dateCreation: nowIso,
          statut: 'VALIDATION_SENIOR',
          formule: 'DUE_DILIGENCE_COMPLETE',
          client: INITIAL_USERS[0],
          slaEcheanceDate: nowIso,
          parcelle: {
            region: 'Abidjan',
            district: 'Autonome d\'Abidjan',
            ville: 'Songon',
            commune: 'Songon',
            quartierVillage: 'Songon Agban',
            lotissementNom: 'Cité des Oliviers',
            lot: '55',
            ilot: '7',
            superficieM2: 600,
            proprietaireDeclare: 'Village Songon Agban',
            typeDocumentPrincipal: 'ATTESTATION_VILLAGEOISE'
          },
          lotissementCheck: {
            statut: 'LOTISSEMENT_APPLIQUE_NON_APPROUVE',
            sourceRecherche: 'Direction de la Topographie et de la Cartographie',
            dateVerification: nowIso.split('T')[0],
            agentVerificateur: 'Me N\'Guessan Yao',
            commentaireExpert: 'Lotissement physiquement tracé sur le terrain mais AUCUN arrêté ministériel d\'approbation. Infraction Loi 2024-351.'
          },
          idufciCheck: {
            statut: 'NON_DISPONIBLE',
            sourceVerification: 'MCLU',
            dateVerification: nowIso.split('T')[0],
            commentaire: 'Inéligible à l\'IDUFCI en l\'absence d\'approbation.'
          },
          documents: [],
          anomalies: [
            {
              id: 'anom-cas5',
              dossierId: 'test-5',
              type: 'LOTISSEMENT_APPLIQUE_NON_APPROUVE',
              gravite: 'BLOQUANT',
              titre: 'Lotissement appliqué non approuvé (Loi 2024-351)',
              description: 'Commercialisation prohibée. Risque de refonte complète des tracés ou démolitions.',
              sourceDetection: 'EXPERT_FONCIER',
              detectePar: 'Me N\'Guessan Yao',
              dateDetection: nowIso,
              statut: 'CONFIRMEE',
              visibleClient: true
            }
          ],
          recherchesAdministratives: [],
          paiement: {
            statut: 'SUCCESS',
            honorairesFoncier360Cfa: 150000,
            deboursAdministratifsCfa: 40000,
            deplacementTerrainCfa: 30000,
            prestationsTechniquesCfa: 30000,
            totalTtcCfa: 250000
          }
        };
        break;

      case 6: // ACD incohérent (Nom / Numéro mismatch)
        testDossier = {
          id: `dos-test-cas6-${Date.now()}`,
          numeroDossier: `TEST-CAS6-ACD-INCOHERENT`,
          dateCreation: nowIso,
          statut: 'ANALYSE_DOCUMENTAIRE',
          formule: 'DUE_DILIGENCE_COMPLETE',
          client: INITIAL_USERS[0],
          slaEcheanceDate: nowIso,
          parcelle: {
            region: 'Abidjan',
            district: 'Autonome d\'Abidjan',
            ville: 'Abidjan',
            commune: 'Cocody',
            quartierVillage: 'Riviera Palmeraie',
            lotissementNom: 'Palmeraie Tranche 4',
            lot: '120',
            ilot: '15',
            superficieM2: 500,
            proprietaireDeclare: 'Koffi Serge', // Déclaré par le vendeur
            typeDocumentPrincipal: 'ACD'
          },
          lotissementCheck: {
            statut: 'APPROUVE',
            sourceRecherche: 'Archives DGU',
            dateVerification: nowIso.split('T')[0],
            agentVerificateur: 'Me N\'Guessan Yao',
            commentaireExpert: 'Lotissement régulier.'
          },
          idufciCheck: {
            statut: 'FOURNI_NON_VERIFIE',
            sourceVerification: 'Portail IDUFCI',
            dateVerification: nowIso.split('T')[0],
            commentaire: 'En cours.'
          },
          documents: [
            {
              id: 'doc-cas6-1',
              dossierId: 'test-6',
              type: 'ACD',
              nomFichier: 'ACD_falsifie_ou_divergent.pdf',
              tailleKo: 1900,
              dateUpload: nowIso,
              hashSha256: 'cas6hashabcdef0123456789abcdef0123456789abcdef0123456789abcdef01',
              statutAuthentification: 'CONFIRME_PAR_EXPERT',
              sourceUpload: 'CLIENT',
              extraction: {
                nomBeneficiaire: 'Madame Diallo Fatoumata', // Incohérence totale avec Koffi Serge
                lot: '120',
                ilot: '15',
                superficieM2: 500,
                commune: 'Cocody',
                statutExtraction: 'CONFIRME_PAR_EXPERT'
              }
            }
          ],
          anomalies: [
            {
              id: 'anom-cas6',
              dossierId: 'test-6',
              type: 'NOM_INCOHERENT',
              gravite: 'IMPORTANT',
              titre: 'Nom divergent : Vendeur Koffi Serge vs Titulaire ACD Diallo Fatoumata',
              description: 'L\'acte de Concession Définitive est au nom d\'un tiers sans mandat notarié versé au dossier.',
              sourceDetection: 'MOTEUR_COHERENCE',
              detectePar: 'Moteur de Cohérence',
              dateDetection: nowIso,
              statut: 'CONFIRMEE',
              visibleClient: true
            }
          ],
          recherchesAdministratives: [],
          paiement: {
            statut: 'SUCCESS',
            honorairesFoncier360Cfa: 150000,
            deboursAdministratifsCfa: 40000,
            deplacementTerrainCfa: 30000,
            prestationsTechniquesCfa: 30000,
            totalTtcCfa: 250000
          }
        };
        break;

      case 7: // Superficie incohérente (Plan vs Attestation)
        testDossier = {
          id: `dos-test-cas7-${Date.now()}`,
          numeroDossier: `TEST-CAS7-SUPERFICIE-DIVERGENTE`,
          dateCreation: nowIso,
          statut: 'ANALYSE_DOCUMENTAIRE',
          formule: 'DUE_DILIGENCE_COMPLETE',
          client: INITIAL_USERS[0],
          slaEcheanceDate: nowIso,
          parcelle: {
            region: 'Sud-Comoé',
            district: 'Lagunes',
            ville: 'Grand-Bassam',
            commune: 'Grand-Bassam',
            quartierVillage: 'Azuretti',
            lotissementNom: 'Lagune & Mer',
            lot: '18',
            ilot: '2',
            superficieM2: 800, // Déclaré 800m2
            proprietaireDeclare: 'Amichia Jean',
            typeDocumentPrincipal: 'EXTRAIT_TOPOGRAPHIQUE'
          },
          lotissementCheck: {
            statut: 'APPROUVE',
            sourceRecherche: 'Cadastre Bassam',
            dateVerification: nowIso.split('T')[0],
            agentVerificateur: 'Me N\'Guessan Yao',
            commentaireExpert: 'Lotissement approuvé.'
          },
          idufciCheck: {
            statut: 'FOURNI_NON_VERIFIE',
            sourceVerification: 'Cadastre',
            dateVerification: nowIso.split('T')[0],
            commentaire: 'En cours.'
          },
          documents: [
            {
              id: 'doc-cas7-1',
              dossierId: 'test-7',
              type: 'EXTRAIT_TOPOGRAPHIQUE',
              nomFichier: 'plan_geometre_610m2.pdf',
              tailleKo: 1800,
              dateUpload: nowIso,
              hashSha256: 'cas7hashabcdef0123456789abcdef0123456789abcdef0123456789abcdef02',
              statutAuthentification: 'CONFIRME_PAR_EXPERT',
              sourceUpload: 'CLIENT',
              extraction: {
                nomBeneficiaire: 'Amichia Jean',
                lot: '18',
                ilot: '2',
                superficieM2: 610, // 610 m2 réels vs 800 m2 vendus !
                commune: 'Grand-Bassam',
                statutExtraction: 'CONFIRME_PAR_EXPERT'
              }
            }
          ],
          anomalies: [
            {
              id: 'anom-cas7',
              dossierId: 'test-7',
              type: 'SUPERFICIE_INCOHERENTE',
              gravite: 'BLOQUANT',
              titre: 'Écart critique de superficie de 190 m² (24% de divergence)',
              description: 'Le plan officiel du géomètre certifie 610 m², alors que le contrat de vente stipule 800 m² payables.',
              sourceDetection: 'MOTEUR_COHERENCE',
              detectePar: 'Moteur de Cohérence',
              dateDetection: nowIso,
              statut: 'CONFIRMEE',
              visibleClient: true
            }
          ],
          recherchesAdministratives: [],
          paiement: {
            statut: 'SUCCESS',
            honorairesFoncier360Cfa: 150000,
            deboursAdministratifsCfa: 40000,
            deplacementTerrainCfa: 30000,
            prestationsTechniquesCfa: 30000,
            totalTtcCfa: 250000
          }
        };
        break;

      case 8: // Document manquant (Requiert VET / Extrait Topo)
        testDossier = {
          id: `dos-test-cas8-${Date.now()}`,
          numeroDossier: `TEST-CAS8-DOC-MANQUANT`,
          dateCreation: nowIso,
          statut: 'INFORMATIONS_COMPLEMENTAIRES_REQUISES',
          formule: 'DUE_DILIGENCE_COMPLETE',
          client: INITIAL_USERS[0],
          slaEcheanceDate: nowIso,
          parcelle: {
            region: 'Abidjan',
            district: 'Autonome d\'Abidjan',
            ville: 'Abidjan',
            commune: 'Yopougon',
            quartierVillage: 'Zone Industrielle',
            lotissementNom: 'Extension Yopougon Nord',
            lot: '400',
            ilot: '50',
            superficieM2: 1200,
            proprietaireDeclare: 'Entreprise BTP SARL',
            typeDocumentPrincipal: 'AUTRE'
          },
          lotissementCheck: {
            statut: 'A_CONFIRMER',
            sourceRecherche: 'En attente des pièces',
            dateVerification: nowIso.split('T')[0],
            agentVerificateur: 'Me N\'Guessan Yao',
            commentaireExpert: 'Dossier incomplet.'
          },
          idufciCheck: {
            statut: 'NON_FOURNI',
            sourceVerification: 'Non renseigné',
            dateVerification: nowIso.split('T')[0],
            commentaire: 'En attente.'
          },
          documents: [], // Aucun document
          anomalies: [
            {
              id: 'anom-cas8',
              dossierId: 'test-8',
              type: 'DOCUMENT_MANQUANT',
              gravite: 'BLOQUANT',
              titre: 'Aucun document de propriété ou d\'urbanisme fourni',
              description: 'Le dossier ne contient ni ACD, ni attestation, ni extrait topographique. Statut bloqué en INFORMATIONS_COMPLEMENTAIRES_REQUISES.',
              sourceDetection: 'MOTEUR_COHERENCE',
              detectePar: 'Moteur de Cohérence',
              dateDetection: nowIso,
              statut: 'CONFIRMEE',
              visibleClient: true
            }
          ],
          recherchesAdministratives: [],
          paiement: {
            statut: 'INITIATED',
            honorairesFoncier360Cfa: 150000,
            deboursAdministratifsCfa: 40000,
            deplacementTerrainCfa: 30000,
            prestationsTechniquesCfa: 30000,
            totalTtcCfa: 250000
          }
        };
        break;

      case 9: // Terrain différent du plan (Constat terrain : empiètement / servitude)
        testDossier = {
          id: `dos-test-cas9-${Date.now()}`,
          numeroDossier: `TEST-CAS9-TERRAIN-DIVERGENT`,
          dateCreation: nowIso,
          statut: 'CONTROLE_QUALITE',
          formule: 'DUE_DILIGENCE_COMPLETE',
          client: INITIAL_USERS[0],
          slaEcheanceDate: nowIso,
          parcelle: {
            region: 'Abidjan',
            district: 'Autonome d\'Abidjan',
            ville: 'Abidjan',
            commune: 'Koumassi',
            quartierVillage: 'Zone Remblais',
            lotissementNom: 'Remblais Lagune',
            lot: '14',
            ilot: '3',
            superficieM2: 450,
            proprietaireDeclare: 'Coulibaly Brahima',
            typeDocumentPrincipal: 'LETTRE_ATTRIBUTION'
          },
          lotissementCheck: {
            statut: 'APPROUVE',
            sourceRecherche: 'Mairie de Koumassi',
            dateVerification: nowIso.split('T')[0],
            agentVerificateur: 'Me N\'Guessan Yao',
            commentaireExpert: 'Lotissement approuvé.'
          },
          idufciCheck: {
            statut: 'FOURNI_NON_VERIFIE',
            sourceVerification: 'Portail IDUFCI',
            dateVerification: nowIso.split('T')[0],
            commentaire: 'En cours.'
          },
          documents: [
            {
              id: 'doc-cas9-1',
              dossierId: 'test-9',
              type: 'PLAN_SITUATION',
              nomFichier: 'plan_theorique_lot14.pdf',
              tailleKo: 1700,
              dateUpload: nowIso,
              hashSha256: 'cas9hashabcdef0123456789abcdef0123456789abcdef0123456789abcdef03',
              statutAuthentification: 'CONFIRME_PAR_EXPERT',
              sourceUpload: 'CLIENT'
            }
          ],
          visiteTerrain: {
            id: 'vis-cas9',
            dossierId: 'test-9',
            numeroOrdreMission: 'ODM-TEST-CAS9',
            agentId: 'usr-agent-terrain-01',
            agentNom: 'Bakary Sanogo',
            dateVisite: nowIso.split('T')[0],
            heureVisite: '14:20',
            latitude: 5.29412,
            longitude: -3.95123,
            precisionGpsMetres: 1.8,
            bornesRetrouvees: false,
            nbBornesIdentifiees: 1,
            accesVoiePublique: 'PISTE',
            etatOccupation: 'CONSTRUCTION_EN_COURS',
            observations: 'Constat alarmant : la parcelle théorique est occupée par les fondations du voisin (empiètement physique de 3 mètres) et traversée par un dalot d\'évacuation d\'eaux pluviales non figuré sur le plan.',
            photos: [
              {
                url: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=600&auto=format&fit=crop&q=80',
                description: 'Fondations voisines empiétant sur l\'emprise du lot 14',
                horodatage: nowIso,
                latitude: 5.29412,
                longitude: -3.95123
              }
            ],
            anomaliesTerrainConstatees: [
              'Empiètement physique des fondations de la parcelle voisine (3m)',
              'Présence d\'un caniveau à ciel ouvert rendant le terrain partiellement inconstructible',
              '3 bornes sur 4 introuvables ou arrachées'
            ],
            disclaimer: 'La visite terrain ne constitue en aucun cas une preuve juridique de propriété.'
          },
          anomalies: [
            {
              id: 'anom-cas9-1',
              dossierId: 'test-9',
              type: 'EMPIETEMENT_CONSTATE',
              gravite: 'BLOQUANT',
              titre: 'Empiètement physique majeur par la parcelle voisine',
              description: 'Constaté de visu et au GPS par l\'agent de terrain. Litige d\'occupation immédiat.',
              sourceDetection: 'VISITE_TERRAIN',
              detectePar: 'Bakary Sanogo (Agent Terrain)',
              dateDetection: nowIso,
              statut: 'CONFIRMEE',
              visibleClient: true
            }
          ],
          recherchesAdministratives: [],
          paiement: {
            statut: 'SUCCESS',
            honorairesFoncier360Cfa: 150000,
            deboursAdministratifsCfa: 40000,
            deplacementTerrainCfa: 30000,
            prestationsTechniquesCfa: 30000,
            totalTtcCfa: 250000
          }
        };
        break;

      case 10: // Dossier diaspora avec visite locale (Bingerville)
      default:
        testDossier = {
          id: `dos-test-cas10-${Date.now()}`,
          numeroDossier: `TEST-CAS10-DIASPORA-BINGV`,
          dateCreation: nowIso,
          statut: 'RECHERCHE_URBANISTIQUE',
          formule: 'AUDIT_PRE_INVESTISSEMENT_DIASPORA',
          client: INITIAL_USERS[0], // Aubin Franck (Diaspora Paris)
          slaEcheanceDate: nowIso,
          parcelle: {
            region: 'Abidjan',
            district: 'Autonome d\'Abidjan',
            ville: 'Bingerville',
            commune: 'Bingerville',
            quartierVillage: 'Adjin Sud',
            lotissementNom: 'Jardins d\'Adjin',
            lot: '89',
            ilot: '11',
            superficieM2: 700,
            latitude: 5.38129,
            longitude: -3.86412,
            idufciFourni: 'CI-ABJ-BGV-2023-014418',
            proprietaireDeclare: 'Famille Djoman / Promoteur Diaspora Land',
            qualiteVendeur: 'PROMOTEUR',
            typeDocumentPrincipal: 'ATTESTATION_PROPRIETE'
          },
          projetConstruction: {
            typeProjet: 'MAISON_INDIVIDUELLE',
            nombreNiveaux: 2,
            surfacePlancherPrevueM2: 320,
            usagePrincipal: 'Villa de vacances et future retraite'
          },
          lotissementCheck: {
            statut: 'APPROUVE',
            arreteApprobationNumero: 'Arrêté n°0881/MCLU/2022',
            dateArrete: '2022-09-14',
            sourceRecherche: 'MCLU & Préfecture',
            dateVerification: nowIso.split('T')[0],
            agentVerificateur: 'Me N\'Guessan Yao',
            commentaireExpert: 'Lotissement approuvé, bornage d\'ensemble vérifié.'
          },
          idufciCheck: {
            statut: 'CONFIRME',
            idufciReel: 'CI-ABJ-BGV-2023-014418',
            sourceVerification: 'Portail officiel IDUFCI',
            dateVerification: nowIso.split('T')[0],
            commentaire: 'Concordance totale avec le découpage cadastral d\'Adjin.'
          },
          documents: [
            {
              id: 'doc-cas10-1',
              dossierId: 'test-10',
              type: 'ATTESTATION_PROPRIETE',
              nomFichier: 'attestation_notariee_adjin.pdf',
              tailleKo: 2400,
              dateUpload: nowIso,
              hashSha256: 'cas10hashabcdef0123456789abcdef0123456789abcdef0123456789abcdef04',
              statutAuthentification: 'CONFIRME_PAR_EXPERT',
              sourceUpload: 'CLIENT'
            }
          ],
          visiteTerrain: {
            id: 'vis-cas10',
            dossierId: 'test-10',
            numeroOrdreMission: 'ODM-DIASPORA-BGV-01',
            agentId: 'usr-agent-terrain-01',
            agentNom: 'Bakary Sanogo',
            dateVisite: nowIso.split('T')[0],
            heureVisite: '10:00',
            latitude: 5.38129,
            longitude: -3.86412,
            precisionGpsMetres: 2.1,
            bornesRetrouvees: true,
            nbBornesIdentifiees: 4,
            accesVoiePublique: 'VOIE_RECHARGEE',
            etatOccupation: 'NU',
            observations: 'Mission terrain spéciale Diaspora : Terrain nu, plat, 4 bornes repeintes en jaune par l\'agent, aucun litige avec le voisinage immédiat, ligne électrique basse tension à 50 mètres.',
            photos: [
              {
                url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
                description: 'Vue panoramique parcelle Adjin Bingerville',
                horodatage: nowIso,
                latitude: 5.38129,
                longitude: -3.86412
              }
            ],
            anomaliesTerrainConstatees: [],
            disclaimer: 'La visite terrain ne constitue en aucun cas une preuve juridique de propriété.'
          },
          anomalies: [],
          recherchesAdministratives: [
            {
              id: 'rech-cas10-1',
              dossierId: 'test-10',
              type: 'URBANISME',
              serviceCible: 'Direction Régionale de la Construction de Bingerville',
              referenceDemande: 'REC-URB-BGV-882',
              dateDemande: nowIso.split('T')[0],
              agentId: 'usr-expert-urba-01',
              agentNom: 'Ing. Amadou Coulibaly',
              statut: 'REPONSE_RECUE',
              resultat: 'Zone constructible villa d\'habitation, aucune servitude de voirie pénalisante.',
              coutDeboursCfa: 50000,
              sourceCout: 'Arrêté MCLU CU',
              dateVerificationCout: nowIso.split('T')[0]
            }
          ],
          paiement: {
            statut: 'SUCCESS',
            moyenPaiement: 'CARTE_BANCAIRE',
            honorairesFoncier360Cfa: 350000,
            deboursAdministratifsCfa: 75000,
            deplacementTerrainCfa: 45000,
            prestationsTechniquesCfa: 60000,
            totalTtcCfa: 530000
          }
        };
        break;
    }

    setDossiers((prev) => [testDossier, ...prev.filter((d) => d.id !== testDossier.id)]);
    setSelectedDossierId(testDossier.id);
    logAction('EXECUTION_CAS_TEST', testDossier.id, `Exécution du Cas de test Métier #${casNumero} (${testDossier.numeroDossier}).`);
  };

  const reinitialiserDonnees = () => {
    localStorage.removeItem(STORAGE_KEY_DOSSIERS);
    localStorage.removeItem(STORAGE_KEY_LOGS);
    localStorage.removeItem(STORAGE_KEY_TARIFS);
    setDossiers(INITIAL_DOSSIERS);
    setTarifs(REFERENCE_TARIFFS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSelectedDossierId(INITIAL_DOSSIERS[0].id);
    setCurrentUser(INITIAL_USERS[0]);
    logAction('REINITIALISATION_COMPLETE', undefined, 'Réinitialisation des données au référentiel d\'origine.');
  };

  return (
    <FoncierContext.Provider
      value={{
        currentUser,
        allUsers,
        setCurrentUserRole,
        setCurrentUserById,
        dossiers,
        tarifs,
        reglementations,
        auditLogs,
        selectedDossierId,
        setSelectedDossierId,
        creerNouveauDossier,
        mettreAJourDossier,
        changerStatutDossier,
        ajouterDocument,
        confirmerExtractionExpert,
        ajouterRechercheAdministrative,
        mettreAJourRecherche,
        enregistrerVisiteTerrain,
        ajouterAnomalieManuelle,
        resoudreAnomalie,
        enregistrerControleUrbanisme,
        validerPaiementClient,
        genererRapportDossier,
        validerRapportSenior,
        poserQuestionClient,
        repondreQuestionClient,
        mettreAJourTarif,
        executerCasTestMetier,
        reinitialiserDonnees
      }}
    >
      {children}
    </FoncierContext.Provider>
  );
};

export const useFoncier = () => {
  const context = useContext(FoncierContext);
  if (!context) {
    throw new Error('useFoncier doit être utilisé au sein de FoncierProvider');
  }
  return context;
};
