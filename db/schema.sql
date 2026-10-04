CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
 id UUID PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
 role TEXT NOT NULL CHECK (role IN ('CLIENT','ADMIN','AGENT_DOCUMENTAIRE','EXPERT_FONCIER','EXPERT_URBANISME','TECHNICIEN_TOPO','AGENT_TERRAIN','JURISTE','VALIDATEUR')),
 phone TEXT, is_diaspora BOOLEAN NOT NULL DEFAULT FALSE, residence_country TEXT, mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
 active BOOLEAN NOT NULL DEFAULT TRUE, last_login_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS dossiers (
 id UUID PRIMARY KEY, numero_dossier TEXT UNIQUE NOT NULL, client_id UUID NOT NULL REFERENCES users(id),
 status TEXT NOT NULL, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dossiers_client ON dossiers(client_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_status ON dossiers(status);
CREATE TABLE IF NOT EXISTS documents (
 id UUID PRIMARY KEY, dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE, file_name TEXT NOT NULL, mime_type TEXT NOT NULL,
 size_bytes INTEGER NOT NULL, sha256 TEXT NOT NULL, data BYTEA NOT NULL, uploaded_by UUID NOT NULL REFERENCES users(id),
 metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_documents_dossier ON documents(dossier_id);
CREATE TABLE IF NOT EXISTS administrative_researches (
 id UUID PRIMARY KEY, dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE, type TEXT NOT NULL,
 service_cible TEXT NOT NULL, reference_demande TEXT NOT NULL, status TEXT NOT NULL, payload JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_by UUID NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS payments (
 id UUID PRIMARY KEY, dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE, amount_cfa INTEGER NOT NULL,
 method TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('PENDING','SUCCESS','FAILED','CANCELLED','REFUNDED')),
 provider_reference TEXT UNIQUE NOT NULL, provider_transaction_id TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS reports (
 id UUID PRIMARY KEY, dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE, version INTEGER NOT NULL,
 report_number TEXT UNIQUE NOT NULL, hash_sha256 TEXT NOT NULL, payload JSONB NOT NULL, validated_by UUID NOT NULL REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(dossier_id,version)
);
CREATE TABLE IF NOT EXISTS audit_logs (
 id UUID PRIMARY KEY, timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(), user_id TEXT NOT NULL, user_name TEXT NOT NULL,
 user_role TEXT NOT NULL, action TEXT NOT NULL, dossier_id UUID, details TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE TABLE IF NOT EXISTS evidence (
 id UUID PRIMARY KEY, dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE, source_type TEXT NOT NULL,
 source_name TEXT NOT NULL, source_url TEXT, checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), checked_by UUID NOT NULL REFERENCES users(id),
 result_status TEXT NOT NULL, reference TEXT, evidence_document_id UUID REFERENCES documents(id), notes TEXT
);
CREATE TABLE IF NOT EXISTS tariffs (
 id UUID PRIMARY KEY, service TEXT NOT NULL, label TEXT NOT NULL, amount_cfa INTEGER NOT NULL, unit TEXT NOT NULL,
 official_source TEXT NOT NULL, official_url TEXT NOT NULL, effective_date DATE NOT NULL, last_verified_date DATE NOT NULL,
 official_verified BOOLEAN NOT NULL DEFAULT FALSE, active BOOLEAN NOT NULL DEFAULT TRUE
);