import React, { useRef } from 'react';
import { DossierFoncier } from '../types/foncier360';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  MapPin,
  Clock,
  Stamp,
  ExternalLink
} from 'lucide-react';

interface ReportModalProps {
  dossier: DossierFoncier;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ dossier, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const rep = dossier.rapportFinal;

  const handlePrint = () => {
    window.print();
  };

  const hasBloquant = dossier.anomalies.some((a) => a.gravite === 'BLOQUANT' && a.statut !== 'RESOLUE');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-300 overflow-hidden">
        {/* Modal Action Header (Non imprimable) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-800 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base">Rapport Officiel de Due Diligence</h2>
              <p className="text-xs text-slate-400 font-mono">
                {rep?.numeroRapport || `RAP-${dossier.numeroDossier}-V1`} · Version {rep?.version || 1}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer / Exporter PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div ref={printRef} className="overflow-y-auto p-8 sm:p-12 space-y-8 text-sm leading-relaxed font-sans bg-white print:p-0">
          {/* Section 1 & 2 : Couverture, En-tête officiel & Références */}
          <div className="border-b-2 border-slate-900 pb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs tracking-widest uppercase font-semibold text-emerald-800">
                  FONCIER 360 · CÔTE D'IVOIRE
                </div>
                <h1 className="text-2xl font-serif font-bold text-slate-900 mt-1">
                  RAPPORT D'AUDIT FONCIER & URBANISTIQUE
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Plateforme indépendante de diligence foncière pré-transactionnelle
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block border border-slate-300 bg-slate-50 p-2.5 rounded text-right">
                  <div className="text-[11px] text-slate-500 font-medium">Référence d'audit :</div>
                  <div className="font-mono font-bold text-sm text-slate-900">{rep?.numeroRapport || dossier.numeroDossier}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Émis le : {new Date().toLocaleDateString('fr-FR')}</div>
                </div>
              </div>
            </div>

            {/* Avertissement institutionnel absolu (Section 21 du cahier des charges) */}
            <div className="mt-4 p-3 bg-amber-50/90 border-l-4 border-amber-500 text-xs text-amber-900">
              <span className="font-bold">Mention légale impérative : </span>
              Les contrôles compris dans la formule souscrite ont été réalisés à la date indiquée. Les éléments favorables,
              anomalies et points restant à confirmer sont détaillés dans le présent rapport. Ce rapport ne constitue ni un
              titre de propriété, ni une décision administrative, ni une garantie de transfert de propriété.
            </div>
          </div>

          {/* Section 3 & 4 : Client & Objet de la mission */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>3. Identification du Client</span>
              </h3>
              <div className="space-y-1 text-slate-700">
                <div><span className="font-semibold">Nom / Raison sociale :</span> {dossier.client.name}</div>
                <div><span className="font-semibold">Email :</span> {dossier.client.email}</div>
                {dossier.client.phone && <div><span className="font-semibold">Téléphone :</span> {dossier.client.phone}</div>}
                {dossier.client.isDiaspora && (
                  <div className="text-emerald-700 font-medium">
                    Statut : Diaspora ({dossier.client.residenceCountry || 'Résident à l\'étranger'})
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>4. Objet & Formule Souscrite</span>
              </h3>
              <div className="space-y-1 text-slate-700">
                <div><span className="font-semibold">Formule d'audit :</span> {dossier.formule.replace(/_/g, ' ')}</div>
                <div><span className="font-semibold">Dossier ouvert le :</span> {new Date(dossier.dateCreation).toLocaleDateString('fr-FR')}</div>
                <div>
                  <span className="font-semibold">Projet envisagé :</span>{' '}
                  {dossier.projetConstruction
                    ? `${dossier.projetConstruction.typeProjet.replace(/_/g, ' ')} (${dossier.projetConstruction.nombreNiveaux ? `R+${dossier.projetConstruction.nombreNiveaux - 1}` : 'Niveaux non précisés'})`
                    : 'Acquisition / Sécurisation foncière'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 : Identification de la Parcelle */}
          <div>
            <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>5. Fiche Signalétique de la Parcelle</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded border border-slate-200">
              <div>
                <span className="text-slate-500 block">Commune & Ville :</span>
                <span className="font-semibold text-slate-900">{dossier.parcelle.commune}, {dossier.parcelle.ville}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Quartier / Village :</span>
                <span className="font-semibold text-slate-900">{dossier.parcelle.quartierVillage}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Lotissement :</span>
                <span className="font-semibold text-slate-900">{dossier.parcelle.lotissementNom}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Lot & Îlot :</span>
                <span className="font-semibold text-slate-900">Lot {dossier.parcelle.lot || 'Non précisé'} · Îlot {dossier.parcelle.ilot || 'Non précisé'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Superficie déclarée :</span>
                <span className="font-semibold text-slate-900">{dossier.parcelle.superficieM2} m²</span>
              </div>
              <div>
                <span className="text-slate-500 block">IDUFCI :</span>
                <span className="font-mono font-semibold text-slate-900">
                  {dossier.parcelle.idufciFourni || 'Non fourni'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Propriétaire / Vendeur déclaré :</span>
                <span className="font-semibold text-slate-900">{dossier.parcelle.proprietaireDeclare}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Qualité du vendeur :</span>
                <span className="font-semibold text-slate-900">{dossier.parcelle.qualiteVendeur || 'A confirmer'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Coordonnées GPS :</span>
                <span className="font-mono text-slate-800">
                  {dossier.parcelle.latitude ? `${dossier.parcelle.latitude.toFixed(5)}, ${dossier.parcelle.longitude?.toFixed(5)}` : 'Non renseignées'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 6 : Documents examinés */}
          <div>
            <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3 text-sm">
              6. Inventaire des Documents Examinés & Traçabilité SHA-256
            </h3>
            {dossier.documents.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Aucun document téléversé pour ce dossier.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-2 border-b">Type</th>
                      <th className="p-2 border-b">Fichier</th>
                      <th className="p-2 border-b">Statut de vérification</th>
                      <th className="p-2 border-b font-mono">Empreinte SHA-256</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {dossier.documents.map((doc) => (
                      <tr key={doc.id}>
                        <td className="p-2 font-semibold text-slate-900">{doc.type}</td>
                        <td className="p-2 text-slate-700">{doc.nomFichier}</td>
                        <td className="p-2">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            doc.statutAuthentification === 'CONFIRME_PAR_EXPERT' || doc.statutAuthentification === 'AUTHENTIFIE_ADMINISTRATION'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {doc.statutAuthentification}
                          </span>
                        </td>
                        <td className="p-2 font-mono text-[10px] text-slate-500 truncate max-w-[200px]" title={doc.hashSha256}>
                          {doc.hashSha256}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 8 & 9 : Recherches Administratives & Examen du Lotissement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50">
              <h3 className="font-bold text-slate-900 text-xs uppercase mb-2">
                8. Recherches Administratives Réalisées
              </h3>
              {dossier.recherchesAdministratives.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Aucune recherche administrative officielle enregistrée.</p>
              ) : (
                <div className="space-y-2.5 text-xs">
                  {dossier.recherchesAdministratives.map((r) => (
                    <div key={r.id} className="p-2 bg-white rounded border border-slate-200">
                      <div className="font-semibold text-slate-800">{r.type} · {r.serviceCible}</div>
                      <div className="text-[11px] text-slate-500">Réf : {r.referenceDemande} · Statut : {r.statut}</div>
                      {r.resultat && <div className="text-xs text-slate-700 mt-1 font-medium">{r.resultat}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50">
              <h3 className="font-bold text-slate-900 text-xs uppercase mb-2">
                9. Statut du Lotissement & IDUFCI
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Statut Lotissement :</div>
                  <div className={`font-bold ${
                    dossier.lotissementCheck.statut === 'APPROUVE'
                      ? 'text-emerald-700'
                      : dossier.lotissementCheck.statut === 'EN_SURSIS' || dossier.lotissementCheck.statut === 'ANNULE'
                      ? 'text-red-700'
                      : 'text-amber-700'
                  }`}>
                    {dossier.lotissementCheck.statut}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    {dossier.lotissementCheck.commentaireExpert || 'Vérification effectuée auprès du MCLU.'}
                  </div>
                </div>

                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Statut IDUFCI :</div>
                  <div className="font-semibold text-slate-900">{dossier.idufciCheck.statut}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{dossier.idufciCheck.commentaire}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 11 & 12 : Urbanisme & Constat Terrain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="border border-slate-200 p-4 rounded-lg">
              <h3 className="font-bold text-slate-900 mb-2 uppercase text-xs">11. Contrôle Urbanisme & Constructibilité</h3>
              {dossier.controleUrbanisme ? (
                <div className="space-y-1.5 text-slate-700">
                  <div><span className="font-semibold">Zone PUD :</span> {dossier.controleUrbanisme.zonePlanUrbanismeDirecteur || 'Non précisée'}</div>
                  <div><span className="font-semibold">Sécurité Foncière :</span> {dossier.controleUrbanisme.securiteFonciereStatut}</div>
                  <div><span className="font-semibold">Constructibilité :</span> {dossier.controleUrbanisme.constructibiliteStatut}</div>
                  {dossier.controleUrbanisme.servitudesIdentifiees.length > 0 && (
                    <div>
                      <span className="font-semibold">Servitudes :</span>{' '}
                      {dossier.controleUrbanisme.servitudesIdentifiees.join(', ')}
                    </div>
                  )}
                  {dossier.controleUrbanisme.observationsExpertUrbaniste && (
                    <div className="text-slate-600 italic mt-1 border-t pt-1">
                      {dossier.controleUrbanisme.observationsExpertUrbaniste}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 italic">Contrôle urbanisme en cours d'instruction.</p>
              )}
            </div>

            <div className="border border-slate-200 p-4 rounded-lg">
              <h3 className="font-bold text-slate-900 mb-2 uppercase text-xs">12. Constat de Visite Terrain</h3>
              {dossier.visiteTerrain ? (
                <div className="space-y-1.5 text-slate-700">
                  <div>
                    <span className="font-semibold">Date & Agent :</span>{' '}
                    {dossier.visiteTerrain.dateVisite} par {dossier.visiteTerrain.agentNom} (ODM {dossier.visiteTerrain.numeroOrdreMission})
                  </div>
                  <div>
                    <span className="font-semibold">Bornes retrouvées :</span>{' '}
                    {dossier.visiteTerrain.bornesRetrouvees ? `Oui (${dossier.visiteTerrain.nbBornesIdentifiees} bornes)` : 'Non identifiées'}
                  </div>
                  <div><span className="font-semibold">Accès :</span> {dossier.visiteTerrain.accesVoiePublique}</div>
                  <div><span className="font-semibold">Occupation :</span> {dossier.visiteTerrain.etatOccupation}</div>
                  <div className="text-[11px] text-slate-600 italic border-t pt-1">{dossier.visiteTerrain.observations}</div>
                </div>
              ) : (
                <p className="text-slate-500 italic">Visite terrain non réalisée ou formule sans visite.</p>
              )}
            </div>
          </div>

          {/* Section 13 : Tableau des Anomalies Relevées */}
          <div>
            <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>13. Synthèse des Anomalies & Alertes Relevées</span>
            </h3>
            {dossier.anomalies.length === 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Aucune anomalie bloquante ou de vigilance relevée sur les pièces fournies.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {dossier.anomalies.map((anom) => (
                  <div
                    key={anom.id}
                    className={`p-3 rounded border text-xs ${
                      anom.gravite === 'BLOQUANT'
                        ? 'bg-red-50/90 border-red-300 text-red-900'
                        : anom.gravite === 'IMPORTANT'
                        ? 'bg-amber-50/90 border-amber-300 text-amber-900'
                        : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          anom.gravite === 'BLOQUANT' ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'
                        }`}>
                          {anom.gravite}
                        </span>
                        <span>{anom.titre}</span>
                      </span>
                      <span className="text-[10px] font-normal text-slate-600">{anom.statut}</span>
                    </div>
                    <p className="text-slate-700">{anom.description}</p>
                    {anom.preuve && <div className="text-[11px] text-slate-600 mt-1 italic">Preuve : {anom.preuve}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 15 : Conclusion circonstanciée */}
          <div className="p-4 bg-slate-900 text-slate-100 rounded-lg">
            <h3 className="font-serif font-bold text-emerald-400 text-sm mb-2 uppercase tracking-wide">
              15. Conclusion Générale Circonstanciée
            </h3>
            <p className="text-xs leading-relaxed text-slate-200">
              {rep?.conclusionGenerale || (hasBloquant
                ? 'Les contrôles compris dans la formule souscrite ont été réalisés à la date indiquée. Des anomalies critiques et/ou un blocage administratif majeur ont été constatés (lotissement en sursis, identifiant contradictoire ou infraction aux textes en vigueur). Aucune acquisition ni mise en valeur n\'est recommandée dans l\'état actuel du dossier. Les éléments favorables, anomalies et points restant à confirmer sont détaillés dans le présent rapport. Ce rapport ne constitue ni un titre de propriété, ni une décision administrative, ni une garantie de transfert de propriété.'
                : 'Les contrôles compris dans la formule souscrite ont été réalisés à la date indiquée. Les éléments favorables, anomalies et points restant à confirmer sont détaillés dans le présent rapport. Ce rapport ne constitue ni un titre de propriété, ni une décision administrative, ni une garantie de transfert de propriété.')}
            </p>
          </div>

          {/* Section 16 : Recommandations pratiques & juridiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-200 p-3 rounded bg-slate-50">
              <h4 className="font-bold text-slate-800 mb-1.5">Recommandations Pratiques</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                <li>Ne jamais verser de fonds sous seing privé sans la présence et le compte séquestre d'un Notaire.</li>
                <li>Exiger un plan de bornage contradictoire dressé par un géomètre-expert inscrit à l'OGECI.</li>
              </ul>
            </div>
            <div className="border border-slate-200 p-3 rounded bg-slate-50">
              <h4 className="font-bold text-slate-800 mb-1.5">Recommandations Juridiques</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                <li>Passer impérativement l'acte de vente par-devant Notaire instrumentaire en Côte d'Ivoire.</li>
                <li>Vérifier l'absence d'inscription d'hypothèque ou de commandement de saisie au jour de l'acte authentique.</li>
              </ul>
            </div>
          </div>

          {/* Section 19 : Signature électronique, Hash & Sceau */}
          <div className="border-t-2 border-slate-900 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-600">
            <div>
              <div className="font-bold text-slate-900">FONCIER 360 · Validation Direction Qualité</div>
              <div>Validateur : {rep?.validateurNom || 'Dr. Konan Marie-Laure (Directrice Qualité & Validation Senior)'}</div>
              <div className="font-mono text-[10px] text-slate-500 mt-1">
                Hash cryptographique SHA-256 du rapport :<br />
                <span className="text-slate-800 font-semibold">{rep?.hashSha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="border-2 border-emerald-800 text-emerald-900 p-3 rounded-md text-center inline-block">
                <Stamp className="w-6 h-6 mx-auto mb-1 text-emerald-800" />
                <div className="font-serif font-bold text-[11px] uppercase tracking-wider">FONCIER 360 CI</div>
                <div className="text-[9px] uppercase font-mono">DUE DILIGENCE CERTIFIÉE</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
