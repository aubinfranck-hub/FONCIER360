# Base FONCIER 360

Créer PostgreSQL puis exécuter db/schema.sql. Définir DATABASE_URL et JWT_SECRET. Le MVP stocke les documents en BYTEA dans PostgreSQL afin d'éviter un disque local non persistant sur Render. Pour un volume documentaire important, migrer vers un object storage compatible S3.