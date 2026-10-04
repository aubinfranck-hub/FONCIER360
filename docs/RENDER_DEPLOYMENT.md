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