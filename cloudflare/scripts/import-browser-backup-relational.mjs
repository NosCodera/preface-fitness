#!/usr/bin/env node
/**
 * Convert a Preface browser JSON backup into additive D1 SQL for normalized tables.
 * This intentionally does NOT create staff logins or member portal credentials.
 * It preserves each original object in metadata_json where the schema permits.
 */
import fs from 'node:fs';
import path from 'node:path';

const argv=process.argv.slice(2);
const arg=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1]};
const input=path.resolve(arg('--backup','preface-fitness-complete-backup-2026-11-14.json'));
const out=path.resolve(arg('--out','./d1-relational-import'));
const batchSize=Math.max(1,Math.min(20,Number(arg('--batch-size','10'))));
const PHOTO_CHUNK_SIZE=12000;
const esc=v=>`'${String(v).replaceAll("'","''")}'`;
const json=v=>JSON.stringify(v??null);
const val=v=>v===undefined||v===null?'NULL':typeof v==='boolean'?(v?1:0):typeof v==='number'?(Number.isFinite(v)?String(v):'NULL'):esc(v);
const pick=(o,...keys)=>{for(const k of keys) if(o?.[k]!==undefined&&o?.[k]!==null)return o[k];return null};
const num=v=>v===null||v===''?null:Number(v);
const iso=v=>v?String(v):null;
const idOf=o=>String(o?.cloudId||o?.id||'');
if(!fs.existsSync(input)) throw new Error(`Backup not found: ${input}`);
const backup=JSON.parse(fs.readFileSync(input,'utf8'));
if(backup.format!=='preface-fitness-complete-backup'||!backup.data?.gym?.id) throw new Error('Unsupported Preface backup or missing gym.id');
const d=backup.data,g=d.gym,gymId=String(g.id);
const stmts=[];
let photoChunks=0;
const photoBytes=0;
function insert(table,columns,values){ if(values.length!==columns.length)throw new Error(`Column mismatch ${table}`); stmts.push(`INSERT OR IGNORE INTO ${table} (${columns.join(',')}) VALUES (${values.map(val).join(',')});`); }
// Parent records first; source identifiers are retained.
insert('gyms',['id','name','slug','public_config_json','address','phone','email','gstin','invoice_prefix','latitude','longitude','attendance_radius_meters','created_at','updated_at'],[
 gymId,g.name||'Preface Fitness',`preface-${gymId.slice(0,8)}`,json(g),g.address,g.phone,g.email,g.gstin,g.invoice_prefix,num(g.latitude),num(g.longitude),num(g.attendance_radius_meters)||50,g.created_at,g.updated_at]);
const members=d.members||[], memberIds=new Map(), deferredMemberRefs=[];
for(const m of members){const id=idOf(m); if(!id)continue; memberIds.set(String(m.id||id),id);memberIds.set(String(m.cloudId||id),id);}
const plans=d.membershipPlans||[], planIds=new Map();
for(const p of plans){const id=idOf(p);if(!id)continue;planIds.set(p.name,id);insert('membership_plans',['id','gym_id','name','amount','duration_months','metadata_json','created_at','updated_at','months','price','description','is_active'],[id,gymId,p.name||'Membership',num(p.price),num(p.months),json(p),null,null,num(p.months),num(p.price),p.description,1]);}
for(const m of members){const id=idOf(m);if(!id)continue;const plan=planIds.get(m.plan)||null;const metadata={...m};delete metadata.photo;insert('members',['id','gym_id','member_code','attendance_number','name','phone','email','date_of_birth','gender','address','emergency_contact','diet_preference','referred_by_member_id','plan_name','membership_plan_id','start_date','expiry_date','status','visits','amount','paid','due','photo_url','notes','metadata_json','created_at','updated_at','body_fat','membership_amount','paid_amount','photo','referral_points','dob','due_amount','height','weight','trainer_name','referral_source','referred_clients','legacy_id'],[
 id,gymId,m.memberCode||m.member_code,m.attendanceNumber,m.name||'Unknown',m.phone,m.email,m.dob||m.birthday,m.gender,m.address,m.emergencyContact,m.dietPreference,null,m.plan,plan,m.start,m.expiry,m.status,num(m.visits)||0,num(m.amount),num(m.paid),num(m.due),m.photoUrl||null,m.notes,json(metadata),m.createdAt,m.updatedAt,num(m.bodyFat),num(m.amount),num(m.paid),null,num(m.referralPoints),m.dob,num(m.due),m.height,m.weight,m.trainer,m.referral,num(m.referredClients),m.id!==id?m.id:null]);}
// Import photos as short concatenation statements. The photo is deliberately removed
// from metadata_json above so a large base64 image never appears inside one SQL literal.
for(const m of members){const id=idOf(m),photo=typeof m.photo==='string'?m.photo:'';if(!id||!photo)continue;stmts.push(`UPDATE members SET photo='' WHERE id=${val(id)} AND gym_id=${val(gymId)};`);for(let offset=0;offset<photo.length;offset+=PHOTO_CHUNK_SIZE){const chunk=photo.slice(offset,offset+PHOTO_CHUNK_SIZE);stmts.push(`UPDATE members SET photo=COALESCE(photo,'') || ${esc(chunk)} WHERE id=${val(id)} AND gym_id=${val(gymId)};`);photoChunks++;}}
// Resolve self-referential member referrals after all parent member rows exist.
for(const m of members){const id=idOf(m), referred=memberIds.get(String(m.referredBy||''));if(id&&referred)stmts.push(`UPDATE members SET referred_by_member_id=${val(referred)} WHERE id=${val(id)} AND gym_id=${val(gymId)};`);}
const trainerIds=new Map();for(const t of d.trainers||[]){const id=idOf(t);if(!id)continue;trainerIds.set(String(t.id||id),id);trainerIds.set(String(t.cloudId||id),id);const metadata={...t};delete metadata.ptPricing;const pricingJson=json(t.ptPricing||{});insert('trainers',['id','gym_id','trainer_code','name','phone','specialization','experience','status','monthly_salary','notes','metadata_json','created_at','updated_at','legacy_id','tier','pt_pricing_json'],[id,gymId,t.trainerCode,t.name||'Trainer',t.phone,t.specialization,num(t.experience),t.status,num(t.monthlySalary),t.notes,json(metadata),t.createdAt,null,t.id!==id? t.id:null,t.tier,pricingJson.length>PHOTO_CHUNK_SIZE?'':pricingJson]);if(pricingJson.length>PHOTO_CHUNK_SIZE){stmts.push(`UPDATE trainers SET pt_pricing_json='' WHERE id=${val(id)} AND gym_id=${val(gymId)};`);for(let offset=0;offset<pricingJson.length;offset+=PHOTO_CHUNK_SIZE){const chunk=pricingJson.slice(offset,offset+PHOTO_CHUNK_SIZE);stmts.push(`UPDATE trainers SET pt_pricing_json=COALESCE(pt_pricing_json,'') || ${esc(chunk)} WHERE id=${val(id)} AND gym_id=${val(gymId)};`);photoChunks++;}}}
for(const p of d.payments||[]){const id=idOf(p);if(!id)continue;const mid=memberIds.get(String(p.memberId||''))||null;insert('payments',['id','gym_id','payment_code','member_id','member_name','amount','type','mode','payment_date','invoice_number','notes','metadata_json','created_at','legacy_id','payment_mode','payment_type','gst_applicable','gst_rate','taxable_amount','cgst_amount','sgst_amount','invoice_amount','paid_amount_at_invoice','balance_at_invoice','description'],[id,gymId,p.paymentCode,mid,p.member,num(p.amount),p.type,p.mode,p.date,p.invoiceNumber,p.notes,json(p),p.createdAt,p.id!==id?p.id:null,p.mode,p.type,p.gstApplicable?1:0,num(p.gstRate),num(p.taxableAmount),num(p.cgstAmount),num(p.sgstAmount),num(p.invoiceAmount),num(p.paidAmountAtInvoice),num(p.balanceAtInvoice),p.description]);}
for(const a of d.attendance||[]){const id=idOf(a);if(!id)continue;insert('attendance',['id','gym_id','member_id','member_name','attendance_date','check_in_time','source','metadata_json','created_at','legacy_id'],[id,gymId,memberIds.get(String(a.memberId||''))||null,a.memberName||a.member,a.date,a.time,a.source,json(a),a.createdAt,a.id!==id?a.id:null]);}
for(const l of d.leads||[]){const id=idOf(l);if(!id)continue;insert('leads',['id','gym_id','lead_code','name','phone','email','source','stage','follow_up_date','notes','metadata_json','created_at','updated_at','legacy_id','interested_plan','converted_member_code','converted_at','last_contact'],[id,gymId,l.leadCode,l.name,l.phone,l.email,l.source,l.stage,l.followUpDate,l.notes,json(l),l.createdAt,l.updatedAt,l.id!==id?l.id:null,l.interestedPlan,l.convertedMemberCode,l.convertedAt,l.lastContact]);}
for(const p of d.ptSessions||[]){const id=idOf(p);if(!id)continue;insert('pt_sessions',['id','gym_id','member_id','trainer_id','member_name','trainer_name','session_date','session_time','status','amount','notes','metadata_json','created_at','updated_at','legacy_id','session_type','duration_minutes','end_time','start_time','plan_name','sessions_total','sessions_completed','validity_days','expiry_date'],[id,gymId,memberIds.get(String(p.memberId||''))||null,trainerIds.get(String(p.trainerId||''))||null,p.member,p.trainer,p.date,p.time,p.status,num(p.amount??p.fee),p.notes,json(p),p.createdAt,null,p.id!==id?p.id:null,p.type,num(p.duration),p.endTime,p.startTime,p.planName,num(p.sessionsTotal),num(p.sessionsCompleted),num(p.validityDays),p.expiryDate]);}
for(const p of d.progressRecords||[]){const id=idOf(p);if(!id)continue;insert('progress_records',['id','gym_id','member_id','record_date','weight','body_fat','notes','metadata_json','created_at','photos_json'],[id,gymId,memberIds.get(String(p.memberId||''))||null,p.date,num(p.weight),num(p.bodyFat),p.notes,json(p),p.createdAt,json(p.photos||[])]);}
for(const p of d.workoutPlans||[]){const id=idOf(p);if(!id)continue;insert('workout_plans',['id','gym_id','name','goal','level','duration_weeks','trainer','notes','assigned_member_ids_json','exercises_json','metadata_json','created_at','updated_at','trainer_name'],[id,gymId,p.name,p.goal,p.level,num(p.durationWeeks),p.trainer,p.notes,json(p.assignedMemberIds||[]),json(p.exercises||[]),json(p),p.createdAt,null,p.trainer]);}
for(const p of d.dietPlans||[]){const id=idOf(p);if(!id)continue;insert('diet_plans',['id','gym_id','name','goal','calories','protein','duration_weeks','coach','notes','assigned_member_ids_json','meals_json','metadata_json','created_at','updated_at'],[id,gymId,p.name,p.goal,num(p.calories),num(p.protein),num(p.durationWeeks),p.coach,p.notes,json(p.assignedMemberIds||[]),json(p.meals||[]),json(p),p.createdAt,null]);}
for(const p of d.communicationLogs||[]){const id=idOf(p);if(!id)continue;insert('communication_logs',['id','gym_id','member_id','member_name','channel','message','status','sent_at','metadata_json','created_at','direction','template','subject','communication_date','communication_time'],[id,gymId,memberIds.get(String(p.memberId||''))||null,p.memberName,p.channel,p.message,p.status,p.sentAt,json(p),p.createdAt,p.direction,p.template,p.subject,p.date,p.time]);}
// Settings are stored key-by-key. Full source object remains available in gym public config as well.
for(const [key,value] of Object.entries(d.settings||{})){const settingJson=json(value);const settingId=`setting-${key}`;if(settingJson.length>PHOTO_CHUNK_SIZE){insert('app_settings',['id','gym_id','setting_key','setting_value_json','created_at','updated_at'],[settingId,gymId,key,'',null,null]);stmts.push(`UPDATE app_settings SET setting_value_json='' WHERE id=${val(settingId)} AND gym_id=${val(gymId)};`);for(let offset=0;offset<settingJson.length;offset+=PHOTO_CHUNK_SIZE){const chunk=settingJson.slice(offset,offset+PHOTO_CHUNK_SIZE);stmts.push(`UPDATE app_settings SET setting_value_json=COALESCE(setting_value_json,'') || ${esc(chunk)} WHERE id=${val(settingId)} AND gym_id=${val(gymId)};`);photoChunks++;}}else{insert('app_settings',['id','gym_id','setting_key','setting_value_json','created_at','updated_at'],[settingId,gymId,key,settingJson,null,null]);}}
// Website enquiries are displayed from the feedbacks collection by cloudData.js.
// Preserve their source category and serialized contact details in feedbacks, not leads.
for(const e of d.websiteEnquiries||[]){const id=idOf(e);if(!id)continue;insert('feedbacks',['id','gym_id','member_id','member_name','category','priority','feedback','status','feedback_date','notes','created_at','updated_at'],[id,gymId,null,e.memberName||e.name||'Website visitor','Website Enquiry',e.priority||'medium',e.feedback||'',e.status||'Open',e.date||null,e.notes||'Submitted through website enquiry form',e.createdAt||null,e.updatedAt||null]);}
// The source JSON contains no staff auth credentials or member portal PIN hashes.
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
const files=[];for(let i=0;i<stmts.length;i+=batchSize){const f=path.join(out,`${String(files.length+1).padStart(3,'0')}-relational.sql`);fs.writeFileSync(f,stmts.slice(i,i+batchSize).join('\n')+'\n');files.push(f);}
const counts={};for(const s of stmts){const t=s.match(/^INSERT OR IGNORE INTO (\w+)/)?.[1];if(t)counts[t]=(counts[t]||0)+1;}
const manifest={format:'preface-d1-relational-import',sourceFormat:backup.format,sourceCreatedAt:backup.createdAt,gymId,generatedAt:new Date().toISOString(),statements:stmts.length,batches:files.length,photoAndLargeValueChunks:photoChunks,chunkSize:PHOTO_CHUNK_SIZE,counts,excluded:['staff users/auth identities','member_portal_credentials PIN hashes','member_portal_login_attempts','feedbacks other than website enquiries (none in browser backup)','photo files external to member.photo'],notes:['This is a browser-backup import, not a replacement for the PostgreSQL dump.','INSERT OR IGNORE makes reruns non-destructive but does not update existing rows.','Review FK references and run against a disposable D1 database first.']};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({output:out,...manifest},null,2));
