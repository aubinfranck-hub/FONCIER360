import { DossierFoncier, Anomalie, AnomalieType, AnomalieSeverity } from '../types/foncier360';

export interface ConsistencyCheckResult {
  anomaliesDetectees: Omit<Anomalie, 'id' | 'dossierId' | 'dateDetection'>[];
  hasBloquant: boolean;
  scoreCoherence: number; // 0 to 100
  resumeDiagnostic: string;
}

export function analyserCoherenceDossier(dossier: DossierFoncier): ConsistencyCheckResult {
  const anomalies: Omit<Anomalie, 'id' | 'dossierId' | 'dateDetection'>[] = [];
  const { parcelle, documents, lotissementCheck, idufciCheck } = dossier;

  // 1. Analyse du statut de Lotissement
  if (lotissementCheck.statut === 'EN_SURSIS') {
    anomalies.push({
      type: 'LOTISSEMENT_EN_SURSIS',
      gravite: 'BLOQUANT',
      titre: 'Lotissement sous arrêté de sursis administratif',
      description: `Le lotissement « ${parcelle.lotissementNom} » fait l'objet d'une décision de sursis ministériel. Les actes et transactions sont suspendus.`,
      preuve: lotissementCheck.arreteApprobationNumero || 'Notification DGU/MCLU',
      sourceDetection: 'EXPERT_FONCIER',
      detectePar: lotissementCheck.agentVerificateur || 'Moteur de Cohérence',
      statut: 'CONFIRMEE',
      visibleClient: true,
      notesInternesExpert: 'Bloque la conclusion favorable. Imposer validation senior et enquête au domaine urbain.'
    });
  } else if (lotissementCheck.statut === 'LOTISSEMENT_APPLIQUE_NON_APPROUVE') {
    anomalies.push({
      type: 'LOTISSEMENT_APPLIQUE_NON_APPROUVE',
      gravite: 'BLOQUANT',
      titre: 'Lotissement appliqué non approuvé (Infraction Loi 2024-351)',
      description: `Le lotissement a été matérialisé sur le terrain sans arrêté d'approbation préalable du Ministère. Risque majeur d'éviction ou de refonte cadastrale.`,
      preuve: 'Absence d\'arrêté au Journal Officiel et aux archives DGU',
      sourceDetection: 'EXPERT_FONCIER',
      detectePar: 'Moteur de Cohérence FONCIER 360',
      statut: 'CONFIRMEE',
      visibleClient: true,
      notesInternesExpert: 'Nécessite analyse renforcée, contrôle de servitude et validation senior.'
    });
  } else if (lotissementCheck.statut === 'ANNULE') {
    anomalies.push({
      type: 'LOTISSEMENT_INCOHERENT',
      gravite: 'BLOQUANT',
      titre: 'Arrêté d\'approbation de lotissement expressément annulé',
      description: `Le lotissement a fait l'objet d'un arrêté d'annulation ou de retrait par le Ministère. Tout droit d'usage foncier est caduc.`,
      sourceDetection: 'EXPERT_FONCIER',
      detectePar: 'Moteur de Cohérence',
      statut: 'CONFIRMEE',
      visibleClient: true
    });
  } else if (lotissementCheck.statut === 'NON_RETROUVE') {
    // RÈGLE CRITIQUE: NON_RETROUVE != ANNULE
    anomalies.push({
      type: 'REFERENCE_MANQUANTE',
      gravite: 'VIGILANCE',
      titre: 'Lotissement non retrouvé dans l\'immédiat aux archives ordinaires',
      description: `Les références du lotissement n'ont pas encore été retrouvées dans le registre numérisé. Attention : une absence de résultat ne constitue pas une annulation, des recherches approfondies aux archives centrales sont requises.`,
      sourceDetection: 'EXPERT_FONCIER',
      detectePar: 'Moteur de Cohérence',
      statut: 'DETECTEE',
      visibleClient: true,
      notesInternesExpert: 'Ne jamais assimiler NON_RETROUVE à ANNULE. Lancer une recherche administrative approfondie.'
    });
  }

  // 2. Contrôle IDUFCI
  if (idufciCheck.statut === 'INCOHERENT') {
    anomalies.push({
      type: 'IDUFCI_INCOHERENT',
      gravite: 'BLOQUANT',
      titre: 'Incohérence majeure de l\'identifiant unique (IDUFCI)',
      description: `L'IDUFCI déclaré (${parcelle.idufciFourni || 'fourni'}) est non concorde avec la parcelle indiquée au cadastre national.`,
      sourceDetection: 'MOTEUR_COHERENCE',
      detectePar: 'Moteur de Cohérence IDUFCI',
      statut: 'CONFIRMEE',
      visibleClient: true
    });
  }

  // 3. Vérification des documents et extractions
  if (documents.length === 0) {
    anomalies.push({
      type: 'DOCUMENT_MANQUANT',
      gravite: 'BLOQUANT',
      titre: 'Aucun document justificatif fourni',
      description: 'Aucun acte de propriété (ACD, Titre foncier, attestation) n\'a été téléversé pour instruction.',
      sourceDetection: 'MOTEUR_COHERENCE',
      detectePar: 'Système FONCIER 360',
      statut: 'DETECTEE',
      visibleClient: true
    });
  }

  // Comparaison croisée avec les documents extraits
  documents.forEach((doc) => {
    if (!doc.extraction) return;
    const ext = doc.extraction;

    // Nom / Bénéficiaire
    if (ext.nomBeneficiaire && parcelle.proprietaireDeclare) {
      const cleanNomExt = ext.nomBeneficiaire.trim().toLowerCase();
      const cleanNomParcelle = parcelle.proprietaireDeclare.trim().toLowerCase();
      // Test simple de ressemblance
      if (!cleanNomExt.includes(cleanNomParcelle) && !cleanNomParcelle.includes(cleanNomExt)) {
        anomalies.push({
          type: 'NOM_INCOHERENT',
          gravite: 'IMPORTANT',
          titre: `Nom divergent entre déclaration et document (${doc.type})`,
          description: `Propriétaire déclaré : « ${parcelle.proprietaireDeclare} », mais le document extrait mentionne : « ${ext.nomBeneficiaire} ». Mandat ou lien successoral à vérifier.`,
          preuve: `Document ${doc.nomFichier}`,
          sourceDetection: 'MOTEUR_COHERENCE',
          detectePar: 'Moteur de Cohérence',
          statut: 'DETECTEE',
          visibleClient: true,
          notesInternesExpert: 'Exiger procuration notariée ou certificat d\'hérédité si le vendeur n\'est pas le titulaire de l\'acte.'
        });
      }
    }

    // Lot
    if (ext.lot && parcelle.lot && ext.lot.trim().toLowerCase() !== parcelle.lot.trim().toLowerCase()) {
      anomalies.push({
        type: 'LOT_INCOHERENT',
        gravite: 'BLOQUANT',
        titre: `Numéro de lot divergent (${doc.type})`,
        description: `Le dossier mentionne le Lot ${parcelle.lot}, tandis que le document extrait porte sur le Lot ${ext.lot}.`,
        sourceDetection: 'MOTEUR_COHERENCE',
        detectePar: 'Moteur de Cohérence',
        statut: 'CONFIRMEE',
        visibleClient: true
      });
    }

    // Îlot
    if (ext.ilot && parcelle.ilot && ext.ilot.trim().toLowerCase() !== parcelle.ilot.trim().toLowerCase()) {
      anomalies.push({
        type: 'ILOT_INCOHERENT',
        gravite: 'BLOQUANT',
        titre: `Numéro d'îlot divergent (${doc.type})`,
        description: `Le dossier mentionne l'Îlot ${parcelle.ilot}, mais le document indique l'Îlot ${ext.ilot}.`,
        sourceDetection: 'MOTEUR_COHERENCE',
        detectePar: 'Moteur de Cohérence',
        statut: 'CONFIRMEE',
        visibleClient: true
      });
    }

    // Superficie : tolérance de 5%
    if (ext.superficieM2 && parcelle.superficieM2) {
      const diff = Math.abs(ext.superficieM2 - parcelle.superficieM2);
      const ratio = diff / parcelle.superficieM2;
      if (ratio > 0.05) {
        anomalies.push({
          type: 'SUPERFICIE_INCOHERENTE',
          gravite: ratio > 0.15 ? 'BLOQUANT' : 'IMPORTANT',
          titre: `Divergence de superficie constatée (${ext.superficieM2} m² vs ${parcelle.superficieM2} m²)`,
          description: `Écart de ${diff.toFixed(0)} m² (${(ratio * 100).toFixed(1)}%) entre la superficie déclarée (${parcelle.superficieM2} m²) et celle indiquée sur l'acte (${ext.superficieM2} m²).`,
          preuve: `Acte ${doc.nomFichier}`,
          sourceDetection: 'MOTEUR_COHERENCE',
          detectePar: 'Moteur de Cohérence',
          statut: 'DETECTEE',
          visibleClient: true
        });
      }
    }

    // Commune / Localisation
    if (ext.commune && parcelle.commune) {
      const c1 = ext.commune.trim().toLowerCase();
      const c2 = parcelle.commune.trim().toLowerCase();
      if (!c1.includes(c2) && !c2.includes(c1)) {
        anomalies.push({
          type: 'LOCALISATION_INCOHERENTE',
          gravite: 'BLOQUANT',
          titre: `Commune divergente (${ext.commune} vs ${parcelle.commune})`,
          description: `La parcelle déclarée se situerait à ${parcelle.commune}, or le document mentionne ${ext.commune}.`,
          sourceDetection: 'MOTEUR_COHERENCE',
          detectePar: 'Moteur de Cohérence',
          statut: 'CONFIRMEE',
          visibleClient: true
        });
      }
    }
  });

  // Calcul du diagnostic synthétique
  const hasBloquant = anomalies.some((a) => a.gravite === 'BLOQUANT');
  const countImportant = anomalies.filter((a) => a.gravite === 'IMPORTANT').length;
  const countVigilance = anomalies.filter((a) => a.gravite === 'VIGILANCE').length;

  let score = 100;
  if (hasBloquant) score -= 60;
  score -= countImportant * 20;
  score -= countVigilance * 10;
  if (score < 10) score = 10;

  let resume = '';
  if (hasBloquant) {
    resume = 'Au moins une anomalie BLOQUANTE identifiée. Toute conclusion favorable automatique est strictement interdite selon le cahier des charges FONCIER 360.';
  } else if (countImportant > 0) {
    resume = 'Points de vigilance importants relevés. Enquête complémentaire et validation par l\'expert requises.';
  } else if (countVigilance > 0) {
    resume = 'Dossier globalement recevable sous réserve de confirmation des points de vigilance ordinaires.';
  } else {
    resume = 'Concordance satisfaisante des données initiales. En attente du résultat des recherches administratives.';
  }

  return {
    anomaliesDetectees: anomalies,
    hasBloquant,
    scoreCoherence: score,
    resumeDiagnostic: resume
  };
}
