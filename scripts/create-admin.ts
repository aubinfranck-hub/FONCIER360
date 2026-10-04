import 'dotenv/config';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:undefined});
const email=process.env.ADMIN_EMAIL;
const password=process.env.ADMIN_PASSWORD;
const name=process.env.ADMIN_NAME || 'Administrateur FONCIER 360';
if(!email || !password || password.length<12) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD (12+ chars) are required');
const hash=await bcrypt.hash(password,12);
const id=crypto.randomUUID();
await pool.query('INSERT INTO users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5) ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,password_hash=EXCLUDED.password_hash,role=EXCLUDED.role,active=true',
[id,name,email.toLowerCase(),hash,'ADMIN']);
console.log('Admin ready:',email);
await pool.end();