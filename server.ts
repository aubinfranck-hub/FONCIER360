import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/gemini/ocr', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
      return;
    }

    const { typeDocument, nomFichier, texteOuDescription, dossierContext } = req.body || {};

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Tu es un moteur d'assistance OCR pour la due diligence foncière en Côte d'Ivoire (FONCIER 360).
Analyse les éléments suivants pour extraire les entités foncières strictement identifiées :
Type de document : ${typeDocument}
Nom du fichier : ${nomFichier}
Contenu / transcription : ${texteOuDescription}
Contexte déclaré : ${JSON.stringify(dossierContext || {})}

Règles impératives :
- N'invente aucune donnée non mentionnée.
- Si une information n'est pas lisible ou absente, renvoie null.
- Extrait : nomBeneficiaire, nomVendeur, lot, ilot, superficieM2 (nombre), commune, lotissement, idufci, numeroDocument, dateDocument, autoriteSignataire, mentionsSignatures.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nomBeneficiaire: { type: Type.STRING, nullable: true },
              nomVendeur: { type: Type.STRING, nullable: true },
              lot: { type: Type.STRING, nullable: true },
              ilot: { type: Type.STRING, nullable: true },
              superficieM2: { type: Type.NUMBER, nullable: true },
              commune: { type: Type.STRING, nullable: true },
              lotissement: { type: Type.STRING, nullable: true },
              idufci: { type: Type.STRING, nullable: true },
              numeroDocument: { type: Type.STRING, nullable: true },
              dateDocument: { type: Type.STRING, nullable: true },
              autoriteSignataire: { type: Type.STRING, nullable: true },
              mentionsSignatures: { type: Type.STRING, nullable: true },
            },
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        res.json(parsed);
        return;
      }

      res.status(502).json({ error: 'Empty response from Gemini API' });
    } catch (error) {
      console.error('Gemini OCR error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to process OCR with Gemini' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
