# Déploiement Render — FONCIER 360

## Architecture
Un seul Web Service peut servir l'API Express et le build Vite en production.

Build command:
`npm install && npm run build && npm run build:api`

Start command:
`npm run start:api`

## PostgreSQL
Créer une base PostgreSQL Render puis renseigner DATABASE_URL.

Après création de la base:
`psql "$DATABASE_URL" -f db/schema.sql`

## Variables obligatoires
- NODE_ENV=production
- DATABASE_URL
- JWT_SECRET (secret aléatoire >= 32 caractères)
- CORS_ORIGIN = URL publique FONCIER 360
- VITE_API_URL = URL publique de l'API si frontend séparé
- GEMINI_API_KEY = clé Gemini uniquement côté serveur pour l’OCR assisté
- GEMINI_OCR_MODEL = modèle Gemini autorisé pour l’OCR (optionnel)

## Premier administrateur
Renseigner temporairement:
- ADMIN_EMAIL
- ADMIN_PASSWORD (>= 12 caractères)
- ADMIN_NAME

Puis exécuter:
`npx tsx scripts/create-admin.ts`

Retirer ensuite les variables ADMIN_* de l'environnement.

## Paiements
Ne pas déclarer un paiement SUCCESS manuellement. Configurer un prestataire autorisé et son webhook signé. Tant que le connecteur n'est pas configuré, l'interface reste en PENDING.

## Recherche foncière
Ne pas prétendre disposer d'une API gouvernementale non documentée. Les e-services officiels et les recherches physiques doivent être enregistrés avec leur preuve, date, agent et référence.

## Paiement Jèko — production

FONCIER 360 utilise Jèko Checkout pour créer une demande de paiement côté serveur et rediriger le client vers Jèko. Le succès définitif est confirmé uniquement par le webhook signé.

Variables Render obligatoires :

- `JEKO_API_KEY` : clé API Jèko, uniquement côté serveur
- `JEKO_API_KEY_ID` : identifiant de la clé API
- `JEKO_STORE_ID` : `storeId` du magasin FONCIER 360
- `JEKO_WEBHOOK_SECRET` : secret HMAC du webhook
- `APP_PUBLIC_URL` : URL publique HTTPS de FONCIER 360, par exemple `https://votre-domaine.ci`

Webhook à configurer dans le Dashboard Jèko :

`POST https://votre-domaine.ci/api/payments/webhook/jeko`

Jèko signe le corps brut avec HMAC-SHA256 dans `Jeko-Signature`. Le serveur vérifie cette signature avant tout traitement et rend le traitement idempotent. Le montant est déterminé côté serveur depuis la grille tarifaire FONCIER 360.

Méthodes actuellement exposées dans l'interface : Wave, Orange Money, MTN, Moov, Djamo et compte Jèko. Les identifiants et clés ne doivent jamais être ajoutés au dépôt Git.
