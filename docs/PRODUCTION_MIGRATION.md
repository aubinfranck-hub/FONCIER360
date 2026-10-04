# Migration production FONCIER 360

1. PostgreSQL : source de vérité.
2. Authentification : bcrypt + JWT + RBAC serveur.
3. Documents : upload serveur + SHA-256 réel.
4. Recherches : objets persistants, jamais confondus avec une preuve officielle.
5. Paiements : PENDING puis SUCCESS uniquement après webhook authentifié.
6. Rapports : validation serveur, blocage sur anomalies BLOQUANTES non résolues, version + SHA-256.
7. Evidence : source, URL, date, agent, référence, résultat et pièce justificative.

Les connecteurs gouvernementaux doivent rester explicites. Le site officiel du ministère expose notamment des e-services liés à l'ACD, à l'IDUFCI et à la vérification du statut des lotissements, mais FONCIER 360 ne doit pas inventer une API privée.