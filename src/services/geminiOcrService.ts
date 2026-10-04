import { DocumentExtractionData, DocumentType } from '../types/foncier360';

/** OCR assisté : aucune donnée fictive n'est produite. OCR != authentification. */
export async function extraireDonneesDocumentAvecIA(typeDocument: DocumentType, nomFichier: string, texteOuDescription: string, dossierContext?: { commune?: string; lot?: string; ilot?: string; lotissement?: string }): Promise<DocumentExtractionData> {
  const api=import.meta.env.VITE_API_URL;
  const token=localStorage.getItem('foncier360_access_token');
  if(!api || !token) return extractionSansIA(nomFichier,texteOuDescription);
  try {
    const response=await fetch(api+'/api/gemini/ocr',{
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
      body:JSON.stringify({typeDocument,nomFichier,texteOuDescription,dossierContext})
    });
    if(!response.ok) return extractionSansIA(nomFichier,texteOuDescription);
    return await response.json() as DocumentExtractionData;
  } catch(error) {
    console.warn('OCR serveur indisponible:',error);
    return extractionSansIA(nomFichier,texteOuDescription);
  }
}

function extractionSansIA(nomFichier:string, texte:string):DocumentExtractionData {
  const content=nomFichier+' '+texte;
  const lot=content.match(/\blot\s*[:#]?\s*([0-9A-Za-z-]+)/i)?.[1];
  const ilot=content.match(/\b(?:îlot|ilot)\s*[:#]?\s*([0-9A-Za-z-]+)/i)?.[1];
  const superficie=content.match(/([0-9]{2,7})\s*(?:m2|m²)\b/i)?.[1];
  const idufci=content.match(/\bCI-[A-Z]{3}-[A-Z]{3}-[0-9]{4}-[0-9]{4,8}\b/i)?.[0];
  return {lot,ilot,superficieM2:superficie?Number(superficie):undefined,idufci,statutExtraction:'NON_EXTRAIT'};
}