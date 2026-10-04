import { GoogleGenAI } from '@google/genai';
import { DocumentExtractionData, DocumentType } from '../types/foncier360';

/** OCR assisté : aucune donnée fictive n'est produite. OCR != authentification. */
export async function extraireDonneesDocumentAvecIA(typeDocument: DocumentType, nomFichier: string, texteOuDescription: string, dossierContext?: { commune?: string; lot?: string; ilot?: string; lotissement?: string }): Promise<DocumentExtractionData> {
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) return extractionSansIA(nomFichier, texteOuDescription);
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = 'Tu es un moteur OCR documentaire pour FONCIER 360. Extrais uniquement les informations explicitement visibles. N’invente rien. Si une donnée est absente, retourne null. Type='+typeDocument+' Fichier='+nomFichier+' Contenu='+texteOuDescription+' Contexte='+JSON.stringify(dossierContext||{});
    const response = await ai.models.generateContent({ model:'gemini-2.5-flash', contents:prompt, config:{responseMimeType:'application/json'} });
    if (!response.text) return extractionSansIA(nomFichier, texteOuDescription);
    const p=JSON.parse(response.text);
    return { nomBeneficiaire:p.nomBeneficiaire||undefined, nomVendeur:p.nomVendeur||undefined, lot:p.lot||undefined, ilot:p.ilot||undefined, superficieM2:p.superficieM2==null?undefined:Number(p.superficieM2), commune:p.commune||undefined, ville:p.ville||undefined, lotissement:p.lotissement||undefined, idufci:p.idufci||undefined, numeroDocument:p.numeroDocument||undefined, dateDocument:p.dateDocument||undefined, autoriteSignataire:p.autoriteSignataire||undefined, mentionsSignatures:p.mentionsSignatures||undefined, statutExtraction:'EXTRAIT_PAR_IA', confianceExtraction:0.92 };
  } catch(error) { console.warn('OCR Gemini indisponible ou invalide:',error); return extractionSansIA(nomFichier,texteOuDescription); }
}

function extractionSansIA(nomFichier:string, texte:string):DocumentExtractionData {
  const content=nomFichier+' '+texte;
  const lot=content.match(/\blot\s*[:#]?\s*([0-9A-Za-z-]+)/i)?.[1];
  const ilot=content.match(/\b(?:îlot|ilot)\s*[:#]?\s*([0-9A-Za-z-]+)/i)?.[1];
  const superficie=content.match(/([0-9]{2,7})\s*(?:m2|m²)\b/i)?.[1];
  const idufci=content.match(/\bCI-[A-Z]{3}-[A-Z]{3}-[0-9]{4}-[0-9]{4,8}\b/i)?.[0];
  return {lot,ilot,superficieM2:superficie?Number(superficie):undefined,idufci,statutExtraction:'NON_EXTRAIT'};
}