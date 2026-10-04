import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { Pool } from 'pg';
import crypto from 'node:crypto';

const app = express();
const port = Number(process.env.PORT || 8080);
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
if (!databaseUrl) throw new Error('DATABASE_URL is required');
if (!jwtSecret || jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');

const pool = new Pool({ connectionString: databaseUrl, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(s => s.trim()), credentials: true }));
app.use(express.json({ limit: '2mb' }));

type AuthUser = { id:string; email:string; name:string; role:string };
function tokenFor(u: AuthUser) { return jwt.sign(u, jwtSecret!, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }); }
function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error:'AUTH_REQUIRED' });
  try { (req as any).user = jwt.verify(h.slice(7), jwtSecret!) as AuthUser; next(); }
  catch { return res.status(401).json({ error:'INVALID_TOKEN' }); }
}
function requireRoles(...allowed:string[]) {
  return (req:express.Request,res:express.Response,next:express.NextFunction) => {
    const u=(req as any).user as AuthUser;
    if (!u || !allowed.includes(u.role)) return res.status(403).json({ error:'FORBIDDEN' });
    next();
  };
}
async function audit(user:AuthUser|undefined, action:string, dossierId:string|undefined, details:string) {
  await pool.query('INSERT INTO audit_logs(id,user_id,user_name,user_role,action,dossier_id,details) VALUES($1,$2,$3,$4,$5,$6,$7)',
    [crypto.randomUUID(), user?.id || 'SYSTEM', user?.name || 'SYSTEM', user?.role || 'SYSTEM', action, dossierId || null, details]);
}

app.get('/api/health', async (_req,res) => {
  const r=await pool.query('SELECT NOW() AS now');
  res.json({ ok:true, service:'FONCIER360 API', database:true, time:r.rows[0].now });
});

app.post('/api/auth/register', async (req,res) => {
  const {name,email,password,phone,isDiaspora,residenceCountry}=req.body||{};
  if (!name || !email || !password || password.length < 10) return res.status(400).json({error:'INVALID_INPUT'});
  const exists=await pool.query('SELECT id FROM users WHERE lower(email)=lower($1)',[email]);
  if(exists.rowCount) return res.status(409).json({error:'EMAIL_EXISTS'});
  const id=crypto.randomUUID(), hash=await bcrypt.hash(password,12);
  const r=await pool.query('INSERT INTO users(id,name,email,password_hash,role,phone,is_diaspora,residence_country) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,name,email,role,phone,is_diaspora,residence_country',
    [id,name,email.toLowerCase(),hash,'CLIENT',phone||null,!!isDiaspora,residenceCountry||null]);
  const u=r.rows[0] as AuthUser; await audit(u,'USER_REGISTERED',undefined,'Compte client créé');
  res.status(201).json({user:u,token:tokenFor(u)});
});

app.post('/api/auth/login', async (req,res) => {
  const {email,password}=req.body||{};
  const r=await pool.query('SELECT * FROM users WHERE lower(email)=lower($1) AND active=true',[email||'']);
  const u=r.rows[0];
  if(!u || !(await bcrypt.compare(password||'',u.password_hash))) return res.status(401).json({error:'INVALID_CREDENTIALS'});
  const user={id:u.id,email:u.email,name:u.name,role:u.role};
  await pool.query('UPDATE users SET last_login_at=NOW() WHERE id=$1',[u.id]);
  await audit(user,'LOGIN',undefined,'Connexion réussie');
  res.json({user,token:tokenFor(user)});
});

app.get('/api/auth/me',auth,async(req,res)=> {
  const u=(req as any).user;
  const r=await pool.query('SELECT id,name,email,role,phone,is_diaspora,residence_country,mfa_enabled FROM users WHERE id=$1',[u.id]);
  if(!r.rowCount) return res.status(404).json({error:'USER_NOT_FOUND'});
  res.json({user:r.rows[0]});
});

app.get('/api/dossiers',auth,async(req,res)=>{
  const u=(req as any).user as AuthUser;
  const q=u.role==='CLIENT'
    ? await pool.query('SELECT payload FROM dossiers WHERE client_id=$1 ORDER BY created_at DESC',[u.id])
    : await pool.query('SELECT payload FROM dossiers ORDER BY created_at DESC');
  res.json({dossiers:q.rows.map(x=>x.payload)});
});

app.post('/api/dossiers',auth,async(req,res)=>{
  const u=(req as any).user as AuthUser; const d=req.body;
  if(!d?.id || !d?.numeroDossier || !d?.parcelle) return res.status(400).json({error:'INVALID_DOSSIER'});
  const payload={...d, client:{...d.client,id:u.role==='CLIENT'?u.id:d.client?.id||u.id}};
  await pool.query('INSERT INTO dossiers(id,numero_dossier,client_id,status,payload) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET status=EXCLUDED.status,payload=EXCLUDED.payload,updated_at=NOW()',
    [d.id,d.numeroDossier,payload.client.id,d.statut,JSON.stringify(payload)]);
  await audit(u,'DOSSIER_UPSERTED',d.id,'Dossier enregistré via API');
  res.status(201).json({dossier:payload});
});

app.put('/api/dossiers/:id',auth,async(req,res)=>{
  const u=(req as any).user as AuthUser; const d=req.body;
  const current=await pool.query('SELECT payload,client_id FROM dossiers WHERE id=$1',[req.params.id]);
  if(!current.rowCount) return res.status(404).json({error:'DOSSIER_NOT_FOUND'});
  if(u.role==='CLIENT' && current.rows[0].client_id!==u.id) return res.status(403).json({error:'FORBIDDEN'});
  await pool.query('UPDATE dossiers SET status=$2,payload=$3,updated_at=NOW() WHERE id=$1',[req.params.id,d.statut,JSON.stringify(d)]);
  await audit(u,'DOSSIER_UPDATED',req.params.id,'Dossier mis à jour');
  res.json({dossier:d});
});

app.post('/api/dossiers/:id/documents',auth,upload.single('file'),async(req,res)=>{
  const u=(req as any).user as AuthUser;
  if(!req.file) return res.status(400).json({error:'FILE_REQUIRED'});
  const d=await pool.query('SELECT client_id FROM dossiers WHERE id=$1',[req.params.id]);
  if(!d.rowCount) return res.status(404).json({error:'DOSSIER_NOT_FOUND'});
  if(u.role==='CLIENT' && d.rows[0].client_id!==u.id) return res.status(403).json({error:'FORBIDDEN'});
  const hash=crypto.createHash('sha256').update(req.file.buffer).digest('hex');
  const id=crypto.randomUUID();
  await pool.query('INSERT INTO documents(id,dossier_id,file_name,mime_type,size_bytes,sha256,data,uploaded_by,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [id,req.params.id,req.file.originalname,req.file.mimetype,req.file.size,hash,req.file.buffer,u.id,JSON.stringify({type:req.body.type||'AUTRE'})]);
  await audit(u,'DOCUMENT_UPLOADED',req.params.id,'Document '+req.file.originalname+'; SHA-256 '+hash);
  res.status(201).json({id,fileName:req.file.originalname,size:req.file.size,sha256:hash});
});

app.get('/api/documents/:id',auth,async(req,res)=>{
  const r=await pool.query('SELECT file_name,mime_type,data,sha256 FROM documents WHERE id=$1',[req.params.id]);
  if(!r.rowCount) return res.status(404).end();
  const x=r.rows[0]; res.setHeader('Content-Type',x.mime_type); res.setHeader('Content-Disposition','inline; filename="'+x.file_name.replace(/"/g,'')+'"'); res.setHeader('X-SHA256',x.sha256); res.send(x.data);
});

app.post('/api/dossiers/:id/recherches',auth,requireRoles('ADMIN','AGENT_DOCUMENTAIRE','EXPERT_FONCIER','EXPERT_URBANISME','JURISTE','VALIDATEUR'),async(req,res)=>{
  const u=(req as any).user as AuthUser; const x=req.body;
  if(!x?.type || !x?.serviceCible || !x?.referenceDemande) return res.status(400).json({error:'INVALID_RESEARCH'});
  const id=crypto.randomUUID();
  await pool.query('INSERT INTO administrative_researches(id,dossier_id,type,service_cible,reference_demande,status,payload,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
    [id,req.params.id,x.type,x.serviceCible,x.referenceDemande,x.statut||'DEMANDEE',JSON.stringify(x),u.id]);
  await audit(u,'ADMIN_RESEARCH_CREATED',req.params.id,x.type+' -> '+x.serviceCible+' -> '+x.referenceDemande);
  res.status(201).json({id,...x});
});

app.patch('/api/recherches/:id',auth,requireRoles('ADMIN','AGENT_DOCUMENTAIRE','EXPERT_FONCIER','EXPERT_URBANISME','JURISTE','VALIDATEUR'),async(req,res)=>{
  const u=(req as any).user as AuthUser; const r=await pool.query('SELECT dossier_id,payload FROM administrative_researches WHERE id=$1',[req.params.id]);
  if(!r.rowCount) return res.status(404).json({error:'RESEARCH_NOT_FOUND'});
  const payload={...r.rows[0].payload,...req.body};
  await pool.query('UPDATE administrative_researches SET status=$2,payload=$3,updated_at=NOW() WHERE id=$1',[req.params.id,payload.statut||payload.status||'EN_INSTRUCTION',JSON.stringify(payload)]);
  await audit(u,'ADMIN_RESEARCH_UPDATED',r.rows[0].dossier_id,'Recherche administrative mise à jour');
  res.json(payload);
});

app.post('/api/payments/create-intent',auth,async(req,res)=>{
  const {dossierId,amount,method}=req.body||{};
  if(!dossierId || !amount || !method) return res.status(400).json({error:'INVALID_PAYMENT'});
  const id=crypto.randomUUID(), reference='F360-'+new Date().getFullYear()+'-'+id.slice(0,8).toUpperCase();
  await pool.query('INSERT INTO payments(id,dossier_id,amount_cfa,method,status,provider_reference,metadata) VALUES($1,$2,$3,$4,$5,$6,$7)',
    [id,dossierId,amount,method,'PENDING',reference,JSON.stringify({providerConfigured:false})]);
  await audit((req as any).user,'PAYMENT_INTENT_CREATED',dossierId,'Paiement '+reference+' créé; aucun succès n’est simulé');
  res.status(201).json({paymentId:id,reference,status:'PENDING',providerConfigured:false,requiresProviderConfiguration:true});
});

app.post('/api/payments/webhook/:provider',async(req,res)=>{
  const provider=req.params.provider.toUpperCase();
  const secret=process.env[provider+'_WEBHOOK_SECRET'];
  if(!secret || req.headers['x-provider-signature']!==secret) return res.status(401).json({error:'INVALID_WEBHOOK'});
  const {reference,status,providerTransactionId}=req.body||{};
  if(!reference || !['SUCCESS','FAILED','CANCELLED'].includes(status)) return res.status(400).json({error:'INVALID_WEBHOOK_PAYLOAD'});
  const r=await pool.query('UPDATE payments SET status=$1,provider_transaction_id=$2,updated_at=NOW() WHERE provider_reference=$3 RETURNING dossier_id',
    [status,providerTransactionId||null,reference]);
  if(!r.rowCount) return res.status(404).json({error:'PAYMENT_NOT_FOUND'});
  await audit(undefined,'PAYMENT_WEBHOOK',r.rows[0].dossier_id,provider+' -> '+status+' -> '+reference);
  res.json({ok:true});
});

app.post('/api/reports/:dossierId/finalize',auth,requireRoles('VALIDATEUR','ADMIN'),async(req,res)=>{
  const u=(req as any).user as AuthUser; const d=await pool.query('SELECT payload FROM dossiers WHERE id=$1',[req.params.dossierId]);
  if(!d.rowCount) return res.status(404).json({error:'DOSSIER_NOT_FOUND'});
  const payload=d.rows[0].payload;
  if(payload.anomalies?.some((a:any)=>a.gravite==='BLOQUANT' && a.statut!=='RESOLUE')) return res.status(409).json({error:'BLOCKING_ANOMALY'});
  const canonical=JSON.stringify({dossierId:req.params.dossierId,payload});
  const hash=crypto.createHash('sha256').update(canonical).digest('hex');
  const id=crypto.randomUUID(), number='F360-R-'+new Date().getFullYear()+'-'+hash.slice(0,8).toUpperCase();
  const report={id,dossierId:req.params.dossierId,numeroRapport:number,version:1,dateGeneration:new Date().toISOString(),validateurId:u.id,validateurNom:u.name,validateurQualite:'VALIDATEUR',hashSha256:hash,statut:'VALIDE'};
  await pool.query('INSERT INTO reports(id,dossier_id,version,report_number,hash_sha256,payload,validated_by) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,req.params.dossierId,1,number,hash,JSON.stringify(report),u.id]);
  await audit(u,'REPORT_VALIDATED',req.params.dossierId,'Rapport '+number+'; SHA-256 '+hash);
  res.status(201).json(report);
});

app.get('/api/audit-logs',auth,requireRoles('ADMIN','VALIDATEUR'),async(_req,res)=>{
  const r=await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1000'); res.json({logs:r.rows});
});

app.listen(port,()=>console.log('FONCIER360 API listening on :'+port));