import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { Pool } from 'pg';
import crypto from 'node:crypto';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const port = Number(process.env.PORT || 8080);
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
if (!databaseUrl) throw new Error('DATABASE_URL is required');
if (!jwtSecret || jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');

const pool = new Pool({ connectionString: databaseUrl, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(s => s.trim()), credentials: true }));

// JEKO_WEBHOOK_RAW_ROUTE
// Jèko signs the RAW request body with HMAC-SHA256. This route must run before express.json().
app.post('/api/payments/webhook/jeko', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secret = process.env.JEKO_WEBHOOK_SECRET;
    const signature = String(req.headers['jeko-signature'] || '');
    if (!secret || !signature || !Buffer.isBuffer(req.body)) return res.status(401).json({ error: 'JEKO_WEBHOOK_NOT_CONFIGURED' });
    const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
    const received = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expected, 'utf8');
    if (received.length !== expectedBuf.length || !crypto.timingSafeEqual(received, expectedBuf)) return res.status(401).json({ error: 'INVALID_JEKO_SIGNATURE' });

    const event = String(req.headers['jeko-event'] || '');
    if (event !== 'TRANSACTION_COMPLETED') return res.status(200).json({ ok: true, ignored: true, event });

    const body = JSON.parse(req.body.toString('utf8'));
    if (body.transactionType !== 'payment' || body.status !== 'success') return res.status(200).json({ ok: true, ignored: true });

    const reference = body?.transactionDetails?.reference;
    const transactionId = body?.id || body?.transactionDetails?.id;
    if (!reference || !transactionId) return res.status(400).json({ error: 'INVALID_JEKO_TRANSACTION' });

    const existing = await pool.query('SELECT id,dossier_id,status,provider_transaction_id FROM payments WHERE provider_reference=$1 LIMIT 1',[reference]);
    if (!existing.rowCount) return res.status(404).json({ error: 'PAYMENT_NOT_FOUND' });
    if (existing.rows[0].status === 'SUCCESS' && existing.rows[0].provider_transaction_id === transactionId) return res.status(200).json({ ok: true, duplicate: true });

    const paymentMethod = String(body.paymentMethod || '').toUpperCase();
    const dossierId = existing.rows[0].dossier_id;
    const amountCfa = Number(body?.amount?.amount || 0);

    const db=await pool.connect();
    try {
      await db.query('BEGIN');
      await db.query("UPDATE payments SET status='SUCCESS',provider_transaction_id=$1,method=$2,updated_at=NOW(),metadata=$3 WHERE provider_reference=$4",
        [transactionId,paymentMethod || 'JEKO',JSON.stringify({provider:'JEKO',event,transactionId,amountCfa,feesCfa:Number(body?.fees?.amount||0),executedAt:body.executedAt||null,paymentMethod:body.paymentMethod||null}),reference]);
      await db.query("UPDATE dossiers SET payload=jsonb_set(jsonb_set(jsonb_set(jsonb_set(payload,'{paiement,statut}','\"SUCCESS\"'::jsonb,true),'{paiement,moyenPaiement}',to_jsonb($1::text),true),'{paiement,refTx}',to_jsonb($2::text),true),'{paiement,provider}','\"JEKO\"'::jsonb,true),updated_at=NOW() WHERE id=$3",
        [paymentMethod || 'JEKO',transactionId,dossierId]);
      await db.query('COMMIT');
    } catch(e) { await db.query('ROLLBACK'); throw e; } finally { db.release(); }

    await audit(undefined,'PAYMENT_JEKO_CONFIRMED',dossierId,'Paiement Jèko confirmé : '+reference+' / transaction '+transactionId);
    return res.status(200).json({ok:true});
  } catch(error) {
    console.error('Jèko webhook error',error);
    return res.status(500).json({error:'JEKO_WEBHOOK_PROCESSING_ERROR'});
  }
});

app.use(express.json({ limit: '2mb' }));
app.disable('x-powered-by');
app.use((_req,res,next)=>{ res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('X-Frame-Options','DENY'); res.setHeader('Referrer-Policy','strict-origin-when-cross-origin'); res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(self)'); next(); });

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

app.post('/api/gemini/ocr',auth,async(req,res)=>{
  const apiKey=process.env.GEMINI_API_KEY;
  if(!apiKey) return res.status(503).json({error:'GEMINI_API_KEY_NOT_CONFIGURED'});
  const {typeDocument,nomFichier,texteOuDescription,dossierContext}=req.body||{};
  if(!typeDocument || !nomFichier) return res.status(400).json({error:'INVALID_OCR_INPUT'});
  try {
    const ai=new GoogleGenAI({apiKey});
    const prompt='Tu es un moteur OCR documentaire pour FONCIER 360 en Côte d’Ivoire. Extrais uniquement les informations explicitement visibles. N’invente aucune donnée. Si une information est absente ou illisible, retourne null. OCR != authentification. Type='+typeDocument+' Fichier='+nomFichier+' Contenu='+String(texteOuDescription||'')+' Contexte='+JSON.stringify(dossierContext||{});
    const response=await ai.models.generateContent({
      model:process.env.GEMINI_OCR_MODEL||'gemini-2.5-flash',
      contents:prompt,
      config:{
        responseMimeType:'application/json',
        responseSchema:{
          type:Type.OBJECT,
          properties:{
            nomBeneficiaire:{type:Type.STRING,nullable:true},nomVendeur:{type:Type.STRING,nullable:true},
            lot:{type:Type.STRING,nullable:true},ilot:{type:Type.STRING,nullable:true},
            superficieM2:{type:Type.NUMBER,nullable:true},commune:{type:Type.STRING,nullable:true},
            ville:{type:Type.STRING,nullable:true},lotissement:{type:Type.STRING,nullable:true},
            idufci:{type:Type.STRING,nullable:true},numeroDocument:{type:Type.STRING,nullable:true},
            dateDocument:{type:Type.STRING,nullable:true},autoriteSignataire:{type:Type.STRING,nullable:true},
            mentionsSignatures:{type:Type.STRING,nullable:true}
          }
        }
      }
    });
    if(!response.text) return res.status(502).json({error:'EMPTY_GEMINI_RESPONSE'});
    const p=JSON.parse(response.text);
    res.json({...p,statutExtraction:'EXTRAIT_PAR_IA',confianceExtraction:0.92});
  } catch(error) {
    console.error('Gemini OCR error',error);
    res.status(502).json({error:'GEMINI_OCR_FAILED'});
  }
});

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
  if(u.role==='CLIENT' && !['CREATION','EN_ATTENTE_PAIEMENT'].includes(d.statut)) return res.status(403).json({error:'CLIENT_CANNOT_SET_WORKFLOW_STATUS'});
  const payload={...d, statut:u.role==='CLIENT' ? 'CREATION' : d.statut, client:{...d.client,id:u.role==='CLIENT'?u.id:d.client?.id||u.id}};
  await pool.query('INSERT INTO dossiers(id,numero_dossier,client_id,status,payload) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET status=EXCLUDED.status,payload=EXCLUDED.payload,updated_at=NOW()',
    [d.id,d.numeroDossier,payload.client.id,d.statut,JSON.stringify(payload)]);
  await audit(u,'DOSSIER_UPSERTED',d.id,'Dossier enregistré via API');
  res.status(201).json({dossier:payload});
});

app.put('/api/dossiers/:id',auth,async(req,res)=>{
  const u=(req as any).user as AuthUser; const incoming=req.body||{};
  const current=await pool.query('SELECT payload,client_id FROM dossiers WHERE id=$1',[req.params.id]);
  if(!current.rowCount) return res.status(404).json({error:'DOSSIER_NOT_FOUND'});
  if(u.role==='CLIENT' && current.rows[0].client_id!==u.id) return res.status(403).json({error:'FORBIDDEN'});

  if(u.role==='CLIENT') {
    const existing=current.rows[0].payload||{};
    const currentStatus=String(existing.statut||'CREATION');
    if(!['CREATION','EN_ATTENTE_PAIEMENT'].includes(currentStatus)) return res.status(403).json({error:'DOSSIER_LOCKED_FOR_CLIENT'});

    const p=incoming.parcelle||{};
    const safeParcel={
      ...existing.parcelle,
      region:p.region,
      district:p.district,
      ville:p.ville,
      commune:p.commune,
      quartierVillage:p.quartierVillage,
      lotissementNom:p.lotissementNom,
      lot:p.lot,
      ilot:p.ilot,
      superficieM2:p.superficieM2,
      proprietaireDeclare:p.proprietaireDeclare,
      qualiteVendeur:p.qualiteVendeur,
      typeDocumentPrincipal:p.typeDocumentPrincipal,
      idufciFourni:p.idufciFourni
    };
    const payload={
      ...existing,
      formule: ['VERIFICATION_EXPRESS','DUE_DILIGENCE_COMPLETE','AUDIT_PRE_INVESTISSEMENT_DIASPORA'].includes(incoming.formule) ? incoming.formule : existing.formule,
      statut:currentStatus,
      client:{...existing.client,id:u.id,name:existing.client?.name||u.name,email:existing.client?.email||u.email},
      parcelle:safeParcel,
      projetConstruction: incoming.projetConstruction ? {
        ...existing.projetConstruction,
        typeProjet:incoming.projetConstruction.typeProjet,
        nombreNiveaux:Number(incoming.projetConstruction.nombreNiveaux)||1,
        surfacePlancherPrevueM2:Number(incoming.projetConstruction.surfacePlancherPrevueM2)||0,
        usagePrincipal:incoming.projetConstruction.usagePrincipal
      } : existing.projetConstruction
    };
    await pool.query('UPDATE dossiers SET status=$2,payload=$3,updated_at=NOW() WHERE id=$1',[req.params.id,currentStatus,JSON.stringify(payload)]);
    await audit(u,'DOSSIER_CLIENT_UPDATED',req.params.id,'Champs client autorisés uniquement');
    return res.json({dossier:payload});
  }

  if(!incoming.statut) return res.status(400).json({error:'STATUS_REQUIRED'});
  await pool.query('UPDATE dossiers SET status=$2,payload=$3,updated_at=NOW() WHERE id=$1',[req.params.id,incoming.statut,JSON.stringify(incoming)]);
  await audit(u,'DOSSIER_UPDATED',req.params.id,'Dossier mis à jour');
  res.json({dossier:incoming});
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
  const u=(req as any).user as AuthUser;
  const r=await pool.query('SELECT d.file_name,d.mime_type,d.data,d.sha256,ds.client_id FROM documents d JOIN dossiers ds ON ds.id=d.dossier_id WHERE d.id=$1',[req.params.id]);
  if(!r.rowCount) return res.status(404).end();
  if(u.role==='CLIENT' && r.rows[0].client_id!==u.id) return res.status(403).json({error:'FORBIDDEN'});
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

app.get('/api/dossiers/:id/evidence',auth,async(req,res)=>{
  const u=(req as any).user as AuthUser;
  const d=await pool.query('SELECT client_id FROM dossiers WHERE id=$1',[req.params.id]);
  if(!d.rowCount) return res.status(404).json({error:'DOSSIER_NOT_FOUND'});
  if(u.role==='CLIENT' && d.rows[0].client_id!==u.id) return res.status(403).json({error:'FORBIDDEN'});
  const r=await pool.query('SELECT * FROM evidence WHERE dossier_id=$1 ORDER BY checked_at DESC',[req.params.id]);
  res.json({evidence:r.rows});
});

app.post('/api/dossiers/:id/evidence',auth,requireRoles('ADMIN','AGENT_DOCUMENTAIRE','EXPERT_FONCIER','EXPERT_URBANISME','JURISTE','VALIDATEUR'),async(req,res)=>{
  const u=(req as any).user as AuthUser; const x=req.body||{};
  if(!x.sourceType || !x.sourceName || !x.resultStatus) return res.status(400).json({error:'INVALID_EVIDENCE'});
  const id=crypto.randomUUID();
  await pool.query('INSERT INTO evidence(id,dossier_id,source_type,source_name,source_url,checked_at,checked_by,result_status,reference,evidence_document_id,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    [id,req.params.id,x.sourceType,x.sourceName,x.sourceUrl||null,x.checkedAt||new Date().toISOString(),u.id,x.resultStatus,x.reference||null,x.evidenceDocumentId||null,x.notes||null]);
  await audit(u,'EVIDENCE_RECORDED',req.params.id,'Preuve enregistrée : '+x.sourceName+' / '+x.resultStatus+' / '+(x.reference||'sans référence'));
  res.status(201).json({id,...x});
});

app.post('/api/payments/create-intent',auth,async(req,res)=>{
  const {dossierId,method}=req.body||{};
  const allowedMethods: Record<string,string>={WAVE:'wave',ORANGE_MONEY:'orange',MTN_MOMO:'mtn',MOOV_MONEY:'moov',DJAMO:'djamo',JEKO:'jeko'};
  if(!dossierId || !allowedMethods[method]) return res.status(400).json({error:'INVALID_PAYMENT_METHOD'});
  const u=(req as any).user as AuthUser;
  const dossierRow=await pool.query('SELECT client_id,payload FROM dossiers WHERE id=$1',[dossierId]);
  if(!dossierRow.rowCount) return res.status(404).json({error:'DOSSIER_NOT_FOUND'});
  if(u.role==='CLIENT' && dossierRow.rows[0].client_id!==u.id) return res.status(403).json({error:'FORBIDDEN'});
  const formula=String(dossierRow.rows[0].payload?.formule || '');
  const tariffService=formula==='VERIFICATION_EXPRESS'
    ? 'F360-VERIFICATION_EXPRESS'
    : formula==='AUDIT_PRE_INVESTISSEMENT_DIASPORA'
      ? 'F360-AUDIT_PRE_INVESTISSEMENT_DIASPORA'
      : 'F360-DUE_DILIGENCE_COMPLETE';
  const tariff=await pool.query("SELECT amount_cfa FROM tariffs WHERE service=$1 AND active=true ORDER BY effective_date DESC LIMIT 1",[tariffService]);
  if(!tariff.rowCount) return res.status(409).json({error:'TARIFF_NOT_CONFIGURED'});
  const amount=Number(tariff.rows[0].amount_cfa);
  if(!Number.isInteger(amount)||amount<=0) return res.status(409).json({error:'INVALID_TARIFF'});

  const jekoKey=process.env.JEKO_API_KEY,jekoKeyId=process.env.JEKO_API_KEY_ID,jekoStoreId=process.env.JEKO_STORE_ID;
  const publicUrl=(process.env.APP_PUBLIC_URL||'').replace(/\/$/,'');
  if(!jekoKey||!jekoKeyId||!jekoStoreId||!publicUrl) return res.status(503).json({error:'JEKO_NOT_CONFIGURED'});

  const id=crypto.randomUUID(),reference='F360-'+new Date().getFullYear()+'-'+id.slice(0,8).toUpperCase();
  const successUrl=publicUrl+'/payment/success?reference='+encodeURIComponent(reference)+'&dossierId='+encodeURIComponent(dossierId);
  const errorUrl=publicUrl+'/payment/error?reference='+encodeURIComponent(reference)+'&dossierId='+encodeURIComponent(dossierId);

  const jr=await fetch('https://api.jeko.africa/partner_api/payment_requests',{
    method:'POST',
    headers:{'X-API-KEY':jekoKey,'X-API-KEY-ID':jekoKeyId,'Content-Type':'application/json'},
    body:JSON.stringify({storeId:jekoStoreId,amountCents:amount*100,currency:'XOF',reference,paymentDetails:{type:'redirect',data:{paymentMethod:allowedMethods[method],successUrl,errorUrl}}})
  });
  const jb=await jr.json().catch(()=>({}));
  if(!jr.ok||!jb?.redirectUrl){
    console.error('Jèko payment creation failed',jr.status,jb);
    return res.status(502).json({error:'JEKO_PAYMENT_CREATION_FAILED'});
  }

  await pool.query('INSERT INTO payments(id,dossier_id,amount_cfa,method,status,provider_reference,provider_transaction_id,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
    [id,dossierId,amount,method,'PENDING',reference,jb.id||null,JSON.stringify({provider:'JEKO',jekoPaymentRequestId:jb.id||null,jekoStatus:jb.status||'pending',redirectUrl:jb.redirectUrl})]);
  await audit(u,'PAYMENT_INTENT_CREATED',dossierId,'Paiement Jèko '+reference+' créé; montant '+amount+' FCFA');
  res.status(201).json({paymentId:id,reference,status:'PENDING',provider:'JEKO',redirectUrl:jb.redirectUrl,jekoPaymentRequestId:jb.id||null});
});

app.get('/api/payments/:reference/status',auth,async(req,res)=>{
  const u=(req as any).user as AuthUser;
  const r=await pool.query('SELECT p.*,d.client_id FROM payments p JOIN dossiers d ON d.id=p.dossier_id WHERE p.provider_reference=$1 LIMIT 1',[req.params.reference]);
  if(!r.rowCount) return res.status(404).json({error:'PAYMENT_NOT_FOUND'});
  if(u.role==='CLIENT' && r.rows[0].client_id!==u.id) return res.status(403).json({error:'FORBIDDEN'});
  const x=r.rows[0];
  res.json({reference:x.provider_reference,status:x.status,method:x.method,amountCfa:x.amount_cfa,transactionId:x.provider_transaction_id,metadata:x.metadata});
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
  const paid=await pool.query("SELECT 1 FROM payments WHERE dossier_id=$1 AND status='SUCCESS' LIMIT 1",[req.params.dossierId]);
  if(!paid.rowCount) return res.status(409).json({error:'PAYMENT_NOT_CONFIRMED'});
  const canonical=JSON.stringify({dossierId:req.params.dossierId,payload});
  const hash=crypto.createHash('sha256').update(canonical).digest('hex');
  const vr=await pool.query('SELECT COALESCE(MAX(version),0)+1 AS version FROM reports WHERE dossier_id=$1',[req.params.dossierId]);
  const version=Number(vr.rows[0].version);
  const id=crypto.randomUUID(), number='F360-R-'+new Date().getFullYear()+'-'+hash.slice(0,8).toUpperCase()+'-V'+version;
  const report={id,dossierId:req.params.dossierId,numeroRapport:number,version,dateGeneration:new Date().toISOString(),validateurId:u.id,validateurNom:u.name,validateurQualite:'VALIDATEUR',hashSha256:hash,statut:'VALIDE'};
  await pool.query('INSERT INTO reports(id,dossier_id,version,report_number,hash_sha256,payload,validated_by) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,req.params.dossierId,version,number,hash,JSON.stringify(report),u.id]);
  await audit(u,'REPORT_VALIDATED',req.params.dossierId,'Rapport '+number+'; SHA-256 '+hash);
  res.status(201).json(report);
});

app.get('/api/reports/verify/:reportNumber',async(req,res)=>{
  const r=await pool.query('SELECT report_number,version,hash_sha256,created_at FROM reports WHERE report_number=$1 LIMIT 1',[req.params.reportNumber]);
  if(!r.rowCount) return res.status(404).json({valid:false,error:'REPORT_NOT_FOUND'});
  res.json({valid:true,reportNumber:r.rows[0].report_number,version:r.rows[0].version,hashSha256:r.rows[0].hash_sha256,validatedAt:r.rows[0].created_at});
});

app.get('/api/audit-logs',auth,requireRoles('ADMIN','VALIDATEUR'),async(_req,res)=>{
  const r=await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1000'); res.json({logs:r.rows});
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist', { index: 'index.html' }));
  app.get(/^\\/(?!api).*/, (_req,res) => res.sendFile(process.cwd() + '/dist/index.html'));
}
app.listen(port,()=>console.log('FONCIER360 API listening on :'+port));