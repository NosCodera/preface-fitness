const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const ALLOWED_TABLES = new Set([
  'membership_plans','members','payments','attendance','leads','trainers','pt_sessions',
  'progress_records','workout_plans','diet_plans','communication_logs','feedbacks','app_settings',
  'gym_users','member_profiles','public_enquiries'
]);

// Explicit source-to-D1 column allowlists. Never interpolate client-provided column names.
const TABLE_MAP = {
 membership_plans:{columns:['id','gym_id','name','months','price','description','is_active','created_at','updated_at']},
 members:{columns:['id','gym_id','member_code','attendance_number','name','phone','email','date_of_birth','gender','address','emergency_contact','diet_preference','referred_by_member_id','plan_name','membership_plan_id','start_date','expiry_date','status','visits','amount','paid','due','photo_url','notes','metadata','created_at','updated_at','body_fat','membership_amount','paid_amount','photo','referral_points','dob','due_amount','height','weight','trainer_name','referral_source','referred_clients','legacy_id'],json:{metadata:'metadata_json'}},
 payments:{columns:['id','gym_id','payment_code','member_id','member_name','amount','type','mode','payment_date','invoice_number','notes','metadata','created_at','payment_mode','payment_type','gst_applicable','gst_rate','taxable_amount','cgst_amount','sgst_amount','invoice_amount','paid_amount_at_invoice','balance_at_invoice','description','legacy_id'],json:{metadata:'metadata_json'}},
 attendance:{columns:['id','gym_id','member_id','member_name','attendance_date','check_in_time','latitude','longitude','distance_meters','source','metadata','created_at'],json:{metadata:'metadata_json'}},
 leads:{columns:['id','gym_id','lead_code','name','phone','email','source','stage','follow_up_date','notes','metadata','created_at','updated_at','interested_plan','converted_member_code','converted_at','last_contact'],json:{metadata:'metadata_json'}},
 trainers:{columns:['id','gym_id','trainer_code','name','phone','specialization','experience','status','monthly_salary','notes','metadata','created_at','updated_at','tier','pt_pricing'],json:{metadata:'metadata_json',pt_pricing:'pt_pricing_json'}},
 pt_sessions:{columns:['id','gym_id','member_id','trainer_id','member_name','trainer_name','session_date','session_time','status','amount','notes','metadata','created_at','updated_at','session_type','duration_minutes','end_time','start_time','plan_name','sessions_total','sessions_completed','validity_days','expiry_date'],json:{metadata:'metadata_json'}},
 progress_records:{columns:['id','gym_id','member_id','record_date','weight','body_fat','chest','waist','hips','arms','thighs','notes','metadata','created_at','neck','photos'],json:{metadata:'metadata_json',photos:'photos_json'}},
 workout_plans:{columns:['id','gym_id','name','goal','level','duration_weeks','trainer','notes','assigned_member_ids','exercises','metadata','created_at','updated_at','trainer_name'],json:{assigned_member_ids:'assigned_member_ids_json',exercises:'exercises_json',metadata:'metadata_json'}},
 diet_plans:{columns:['id','gym_id','name','goal','calories','protein','duration_weeks','coach','notes','assigned_member_ids','meals','metadata','created_at','updated_at'],json:{assigned_member_ids:'assigned_member_ids_json',meals:'meals_json',metadata:'metadata_json'}},
 communication_logs:{columns:['id','gym_id','member_id','member_name','channel','message','status','sent_at','metadata','created_at','direction','template','subject','communication_date','communication_time'],json:{metadata:'metadata_json'}},
 feedbacks:{columns:['id','gym_id','member_id','member_name','category','priority','feedback','status','feedback_date','notes','created_at','updated_at']},
 app_settings:{columns:['id','gym_id','setting_key','setting_value','created_at','updated_at'],json:{setting_value:'setting_value_json'}}
};
const JSON_COLUMNS = new Set(['metadata_json','pt_pricing_json','photos_json','assigned_member_ids_json','exercises_json','meals_json','setting_value_json']);
function decodeRow(table,row){ const spec=TABLE_MAP[table]; const out={...row};
 for(const col of JSON_COLUMNS){if(col in out){const key=Object.entries(spec.json||{}).find(([,db])=>db===col)?.[0]||Object.entries(spec.encode||{}).find(([,db])=>db===col)?.[0];if(key){try{out[key]=JSON.parse(out[col]||'null')}catch{out[key]=out[col]};if(key!==col)delete out[col];}}}
 return out; }
function encodeRow(table,row){const spec=TABLE_MAP[table];const out={};for(const col of spec.columns){if(!(col in row))continue;const db=(spec.json||{})[col]||(spec.encode||{})[col]||col;let value=row[col];if(JSON_COLUMNS.has(db)){if(table==='membership_plans'&&col==='description'){let old={};try{old=JSON.parse(row.metadata_json||'{}')}catch{};value=JSON.stringify({...old,description:value??''});}else value=JSON.stringify(value??(db==='metadata_json'?'{}':[]));}out[db]=value;}
 return out;}
const allowedOrigins = (env) => String(env.APP_ORIGIN || '').split(',').map(x => x.trim()).filter(Boolean);
const cors = (origin, env) => ({
  'access-control-allow-origin': origin && allowedOrigins(env).includes(origin) ? origin : (allowedOrigins(env)[0] || 'null'),
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'authorization,content-type,x-gym-id,last-event-id',
  'access-control-max-age': '86400',
  'vary': 'Origin'
});
const response = (data, status=200, headers={}) => new Response(JSON.stringify(data), {status,headers:{...JSON_HEADERS,...headers}});
const uid = () => crypto.randomUUID();
const hex = b => [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function sha256(value){ return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))); }
async function passwordHash(password,salt){ const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']); return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256)); }
function bearer(req){ return (req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim(); }
async function auth(req,env){ const token=bearer(req); if(!token) return null; const hash=await sha256(token); const now=Math.floor(Date.now()/1000); return env.DB.prepare(`SELECT u.id,u.gym_id,u.email,gu.role,u.display_name,u.member_id,gu.permissions_json FROM sessions s JOIN users u ON u.id=s.user_id JOIN gym_users gu ON gu.id=u.id AND gu.gym_id=u.gym_id WHERE s.token_hash=? AND s.expires_at>? AND u.is_active=1 AND gu.is_active=1`).bind(hash,now).first(); }
function canWrite(user,table){
 if(!user) return false;
 if(['owner','admin'].includes(user.role)) return true;
 if(user.role==='staff'){
  let p={}; try{p=typeof user.permissions_json==='string'?JSON.parse(user.permissions_json||'{}'):(user.permissions_json||{});}catch{}
  const pageKey={
   members:'members',payments:'payments',attendance:'attendance',leads:'leads',
   membership_plans:'memberships',trainers:'trainers',pt_sessions:'trainers',
   progress_records:'progress',workout_plans:'training',diet_plans:'diet',
   communication_logs:'communication',feedbacks:'feedback',public_enquiries:'enquiries',
   app_settings:'settings'
  }[table]||table;
  const candidates=[p?.tables?.[table],p?.[table],p?.[pageKey]];
  return candidates.some(v=>v===true || v?.write===true || v?.create===true || v?.manage===true);
 }
 if(user.role==='trainer') return ['attendance','progress_records','workout_plans','diet_plans','pt_sessions'].includes(table);
 return false;
}
async function publish(env,gymId,event){ const id=env.LIVE_ROOMS.idFromName(gymId); await env.LIVE_ROOMS.get(id).fetch('https://live.internal/publish',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(event)}); }
export class GymLiveRoom {
  constructor(state){ this.state=state; this.sessions=new Set(); }
  async fetch(request){ const url=new URL(request.url);
    if(url.pathname==='/publish' && request.method==='POST'){ const msg=await request.json(); const packet=JSON.stringify(msg); for(const ws of this.state.getWebSockets()) { try{ws.send(packet)}catch{ws.close(1011,'send failed')} } return new Response('ok'); }
    if(url.pathname==='/ws'){ const pair=new WebSocketPair(); const [client,server]=Object.values(pair); this.state.acceptWebSocket(server); server.send(JSON.stringify({type:'ready',at:Date.now()})); return new Response(null,{status:101,webSocket:client}); }
    return new Response('not found',{status:404});
  }
  webSocketMessage(ws,message){ try{const m=JSON.parse(message); if(m.type==='ping') ws.send(JSON.stringify({type:'pong',at:Date.now()}));}catch{} }
  webSocketClose(ws){ try{ws.close()}catch{} }
}
export default {
 async fetch(req,env){ const origin=req.headers.get('origin')||''; const headers=cors(origin,env);
  if(req.method==='OPTIONS') return new Response(null,{status:204,headers});
  const url=new URL(req.url); const path=url.pathname;
  try{
   if(path==='/health') return response({ok:true,service:'preface-fitness-api',time:new Date().toISOString()},200,headers);
   // Public gym profile and feedback endpoints intentionally do not require staff auth.
   if(path==='/api/public/gym-profile' && req.method==='GET'){
    const gymId=String(url.searchParams.get('gymId')||''); if(!gymId) return response({error:'gymId is required'},400,headers);
    const gym=await env.DB.prepare('SELECT id,name,address,phone,email,gstin,invoice_prefix,latitude,longitude,attendance_radius_meters,public_config_json FROM gyms WHERE id=?').bind(gymId).first();
    if(!gym) return response({error:'Gym not found'},404,headers);
    const plans=await env.DB.prepare("SELECT name,months,price,COALESCE(description, '') AS description FROM membership_plans WHERE gym_id=? ORDER BY months ASC").bind(gymId).all();
    const settings=await env.DB.prepare("SELECT setting_key,setting_value_json FROM app_settings WHERE gym_id=? AND setting_key IN ('gymName','gymAddress','gymPhone','gymEmail','membershipPrices','gymIntro','notice','publicPage')").bind(gymId).all();
    const safeSettings={}; for(const row of (settings.results||[])){ try{safeSettings[row.setting_key]=JSON.parse(row.setting_value_json)}catch{safeSettings[row.setting_key]=row.setting_value_json} }
    delete gym.public_config_json;
    return response({gym,settings:safeSettings,membershipPlans:plans.results||[]},200,headers);
   }
   if(path==='/api/public/registration-info' && req.method==='GET'){
    const gymId=String(url.searchParams.get('gymId')||''); if(!gymId) return response({error:'gymId is required'},400,headers);
    const gym=await env.DB.prepare('SELECT id,name FROM gyms WHERE id=?').bind(gymId).first(); if(!gym) return response({error:'Gym not found'},404,headers);
    const setting=await env.DB.prepare("SELECT setting_value_json FROM app_settings WHERE gym_id=? AND setting_key='customerRegistrationEnabled'").bind(gymId).first();
    let enabled=false; try{enabled=JSON.parse(setting?.setting_value_json||'false')===true}catch{}
    const plans=await env.DB.prepare('SELECT name,months,price FROM membership_plans WHERE gym_id=? ORDER BY months ASC').bind(gymId).all();
    return response({gym,enabled,plans:plans.results||[]},200,headers);
   }
   if(path==='/api/public/register' && req.method==='POST'){
    const b=await req.json(); const gymId=String(b.gymId||''); if(!gymId) return response({error:'Invalid gym reference.'},400,headers);
    const gym=await env.DB.prepare('SELECT id FROM gyms WHERE id=?').bind(gymId).first(); if(!gym) return response({error:'Invalid gym reference.'},404,headers);
    const setting=await env.DB.prepare("SELECT setting_value_json FROM app_settings WHERE gym_id=? AND setting_key='customerRegistrationEnabled'").bind(gymId).first(); let enabled=false; try{enabled=JSON.parse(setting?.setting_value_json||'false')===true}catch{}
    if(!enabled) return response({error:'Online registration is currently disabled by the gym.'},403,headers);
    const name=String(b.name||'').trim().slice(0,120)||'Unnamed Member'; const phone=String(b.phone||'').replace(/[^0-9+]/g,'').slice(0,20)||null;
    const attendanceInput=String(b.attendanceNumber||'').trim().slice(0,40); const id=uid();
    if(attendanceInput){const exists=await env.DB.prepare('SELECT id FROM members WHERE gym_id=? AND attendance_number=? LIMIT 1').bind(gymId,attendanceInput).first();if(exists)return response({error:'This attendance number is already in use. Leave it blank or choose another.'},409,headers);}
    let plan=null; const planName=String(b.planName||'').trim(); if(planName) plan=await env.DB.prepare('SELECT id,name,months,price FROM membership_plans WHERE gym_id=? AND name=? COLLATE NOCASE LIMIT 1').bind(gymId,planName).first();
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date()); let expiry=null;
    if(plan?.months){const d=new Date(`${today}T12:00:00Z`);d.setUTCMonth(d.getUTCMonth()+Number(plan.months));expiry=d.toISOString().slice(0,10);}
    const pin=String(b.pin||'').trim(); if(pin&&!/^\d{6}$/.test(pin))return response({error:'PIN must contain exactly six digits.'},400,headers);
    const amountRaw=String(b.paymentAmount??'').trim(); const paid=amountRaw!==''&&Number.isFinite(Number(amountRaw))?Math.max(0,Math.min(10000000,Number(amountRaw))):0;
    const bodyMeasurements=b.bodyMeasurements&&typeof b.bodyMeasurements==='object'?b.bodyMeasurements:{};
    const medical=String(b.medicalConditions||'').trim().slice(0,2000);
    const aadhaarDigits=String(b.aadhaarNumber||'').replace(/\D/g,''); const maskedAadhaar=aadhaarDigits.length===12?`XXXX-XXXX-${aadhaarDigits.slice(-4)}`:null;
    const metadata={bodyMeasurements,medicalConditions:medical, ...(maskedAadhaar?{aadhaarNumberMasked:maskedAadhaar}:{})};
    const memberMeta={medicalConditions:medical?[medical]:[],medicalOther:'',surgeryDetails:'',additionalMedicalNotes:'',referralOther:'',chest:String(bodyMeasurements.chest||''),shoulder:'',biceps:String(bodyMeasurements.arms||''),forearms:'',waist:String(bodyMeasurements.waist||''),hips:String(bodyMeasurements.hips||''),thighs:String(bodyMeasurements.thighs||''),calves:'',neck:'',gstinAadhaar:'',billingState:'',billingStateCode:'',memberInvoiceNumber:''};
    const memberNotes=`<!--PREFACE_MEMBER_META:${JSON.stringify(memberMeta)}-->`;
    const memberFormatRow=await env.DB.prepare("SELECT setting_value_json FROM app_settings WHERE gym_id=? AND setting_key='memberIdFormat'").bind(gymId).first(); let memberFormat={prefix:'PF',numberLength:4};try{memberFormat={...memberFormat,...JSON.parse(memberFormatRow?.setting_value_json||'{}')}}catch{}
    const existingCodes=await env.DB.prepare("SELECT member_code FROM members WHERE gym_id=? AND member_code LIKE ?").bind(gymId,`${String(memberFormat.prefix||'PF')}-%`).all(); let maxCode=0; for(const r of existingCodes.results||[]){const m=String(r.member_code||'').match(/(\d+)$/);if(m)maxCode=Math.max(maxCode,Number(m[1]));}
    const memberCode=`${String(memberFormat.prefix||'PF')}-${String(maxCode+1).padStart(Math.min(8,Math.max(1,Number(memberFormat.numberLength)||4)),'0')}`;
    let attendanceNumber=attendanceInput; if(!attendanceNumber){const maxRow=await env.DB.prepare("SELECT MAX(CAST(attendance_number AS INTEGER)) AS n FROM members WHERE gym_id=? AND attendance_number GLOB '[0-9]*'").bind(gymId).first();attendanceNumber=String(Number(maxRow?.n||0)+1);}
    const columns=['id','gym_id','member_code','attendance_number','name','phone','date_of_birth','gender','address','diet_preference','plan_name','membership_plan_id','start_date','expiry_date','status','visits','amount','paid','due','metadata_json','notes','created_at','updated_at','height','weight'];
    const vals=[id,gymId,memberCode,attendanceNumber,name,phone,String(b.dob||'').slice(0,10)||null,String(b.gender||'').slice(0,30)||null,String(b.address||'').slice(0,500)||null,String(b.dietPreference||'').slice(0,40)||null,plan?.name||planName||null,plan?.id||null,today,expiry,'Active',0,Number(plan?.price||0),paid,Math.max(0,Number(plan?.price||0)-paid),JSON.stringify(metadata),memberNotes,new Date().toISOString(),new Date().toISOString(),String(b.height||'').slice(0,20)||null,String(b.weight||'').slice(0,20)||null];
    await env.DB.prepare(`INSERT INTO members(${columns.join(',')}) VALUES(${columns.map(()=>'?').join(',')})`).bind(...vals).run();
    if(pin) {const bcrypt=await import('bcryptjs');const hash=await bcrypt.hash(pin,10);await env.DB.prepare('INSERT INTO member_portal_credentials(member_id,gym_id,pin_hash,created_at,updated_at) VALUES(?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)').bind(id,gymId,hash).run();}
    let paymentId=null; if(paid>0){paymentId=uid();await env.DB.prepare("INSERT INTO payments(id,gym_id,member_id,member_name,amount,type,mode,payment_date,notes,created_at,payment_mode,payment_type) VALUES(?,?,?,?,?,'Membership','Cash',?,'Customer self-registration',CURRENT_TIMESTAMP,'Cash','Membership')").bind(paymentId,gymId,id,name,paid,today).run();await env.DB.prepare("INSERT INTO change_events(gym_id,table_name,record_id,operation) VALUES(?,?,?,'upsert')").bind(gymId,'payments',paymentId).run();}
    await env.DB.prepare("INSERT INTO change_events(gym_id,table_name,record_id,operation) VALUES(?,?,?,'upsert')").bind(gymId,'members',id).run();
    await publish(env,gymId,{type:'data_changed',gymId,table:'members',ids:[id],at:Date.now()}); if(paymentId)await publish(env,gymId,{type:'data_changed',gymId,table:'payments',ids:[paymentId],at:Date.now()});
    return response({success:true,memberId:id,memberCode,attendanceNumber},201,headers);
   }
   if(path==='/api/public/feedback' && req.method==='POST'){
    const b=await req.json(); const gymId=String(b.gymId||''); const feedback=String(b.feedback||b.message||'').trim(); const memberName=String(b.memberName||'').trim(); const category=String(b.category||'General').trim(); const priority=String(b.priority||'medium').trim().toLowerCase();
    if(!gymId||!feedback) return response({error:'Gym reference and feedback are required.'},400,headers);
    const gym=await env.DB.prepare('SELECT id FROM gyms WHERE id=?').bind(gymId).first(); if(!gym) return response({error:'Invalid gym reference.'},404,headers);
    if(!['low','medium','high'].includes(priority)) return response({error:'Invalid priority.'},400,headers);
    if(feedback.length>2000||memberName.length>100||category.length>80) return response({error:'Feedback, name or category exceeds the allowed length.'},400,headers);
    const id=uid(); await env.DB.prepare("INSERT INTO feedbacks(id,gym_id,member_id,member_name,category,priority,feedback,status,feedback_date,notes,created_at,updated_at) VALUES(?,?,NULL,?,?,?,?,? ,?,'Submitted through public QR feedback form',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(id,gymId,memberName||null,category||'General',priority,feedback,'Open',new Date().toISOString().slice(0,10)).run();
    return response({success:true,id},201,headers);
   }
   if(path==='/api/public/check-in' && req.method==='POST'){
    const b=await req.json(); const gymId=String(b.gymId||''); const memberNumber=String(b.memberNumber||b.member_number||'').trim(); const lat=Number(b.latitude??b.lat), lng=Number(b.longitude??b.lng);
    if(!gymId||!memberNumber||!Number.isFinite(lat)||!Number.isFinite(lng)) return response({success:false,message:'Gym, member number and phone location are required.'},400,headers);
    const gym=await env.DB.prepare('SELECT id,latitude,longitude,attendance_radius_meters FROM gyms WHERE id=?').bind(gymId).first(); if(!gym) return response({success:false,message:'Gym not found.'},404,headers);
    const settingRows=await env.DB.prepare("SELECT setting_key,setting_value_json FROM app_settings WHERE gym_id=? AND setting_key IN ('gymLatitude','gymLongitude')").bind(gymId).all(); const sv={}; for(const r of (settingRows.results||[])){try{sv[r.setting_key]=JSON.parse(r.setting_value_json)}catch{sv[r.setting_key]=r.setting_value_json}}
    const gymLat=Number(sv.gymLatitude??gym.latitude??b.gymLatitude), gymLng=Number(sv.gymLongitude??gym.longitude??b.gymLongitude);
    if(!Number.isFinite(gymLat)||!Number.isFinite(gymLng)) return response({success:false,message:'Gym location has not been configured.'},200,headers);
    const rad=x=>x*Math.PI/180; const dLat=rad(lat-gymLat),dLng=rad(lng-gymLng); const h=Math.sin(dLat/2)**2+Math.cos(rad(gymLat))*Math.cos(rad(lat))*Math.sin(dLng/2)**2; const distance=6371000*2*Math.asin(Math.sqrt(h)); const radius=50; // Match the source public_check_in function's fixed 50 m geofence.
    if(distance>radius) return response({success:false,message:`Attendance denied. You are approximately ${Math.round(distance)} m from the gym. You must be within ${radius} m.`,distanceMeters:Math.round(distance)},200,headers);
    const member=await env.DB.prepare("SELECT id,name,expiry_date,status,visits FROM members WHERE gym_id=? AND TRIM(COALESCE(attendance_number,''))=? ORDER BY created_at ASC LIMIT 1").bind(gymId,memberNumber).first();
    if(!member) return response({success:false,message:'Member number not found.'},200,headers);
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date()); if(member.expiry_date && member.expiry_date<today) return response({success:false,message:'Your membership has expired.'},200,headers);
    const existing=await env.DB.prepare('SELECT id FROM attendance WHERE gym_id=? AND member_id=? AND attendance_date=? LIMIT 1').bind(gymId,member.id,today).first(); if(existing) return response({success:false,message:'Attendance already marked for today.'},200,headers);
    const id=uid(); await env.DB.batch([env.DB.prepare("INSERT INTO attendance(id,gym_id,member_id,member_name,attendance_date,check_in_time,latitude,longitude,distance_meters,source,created_at) VALUES(?,?,?,?,?,?,?,?,?,'public_qr',CURRENT_TIMESTAMP)").bind(id,gymId,member.id,member.name,today,new Date().toISOString(),lat,lng,Math.round(distance)),env.DB.prepare('UPDATE members SET visits=COALESCE(visits,0)+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND gym_id=?').bind(member.id,gymId)]);
    return response({success:true,message:'Attendance marked successfully.',attendanceId:id,memberName:member.name,distanceMeters:Math.round(distance)},200,headers);
   }
   if(path==='/api/auth/login' && req.method==='POST'){
    const {email,password,gymId}=await req.json(); if(!email||!password||!gymId) return response({error:'Email, password and gymId are required'},400,headers);
    const user=await env.DB.prepare('SELECT u.*,gu.role AS access_role FROM users u JOIN gym_users gu ON gu.id=u.id AND gu.gym_id=u.gym_id WHERE u.gym_id=? AND u.email=? COLLATE NOCASE AND u.is_active=1 AND gu.is_active=1').bind(String(gymId),String(email).trim()).first();
    if(!user || await passwordHash(String(password),user.password_salt)!==user.password_hash) return response({error:'Invalid email or password'},401,headers);
    const token=uid()+uid(); const expires=Math.floor(Date.now()/1000)+Number(env.TOKEN_TTL_SECONDS||604800);
    await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,gym_id,expires_at) VALUES(?,?,?,?)').bind(await sha256(token),user.id,user.gym_id,expires).run();
    return response({token,expiresAt:expires,user:{id:user.id,email:user.email,gymId:user.gym_id,role:user.access_role,name:user.display_name,memberId:user.member_id}},200,headers);
   }
   if(path==='/api/auth/logout' && req.method==='POST'){const token=bearer(req); if(token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(token)).run(); return response({ok:true},200,headers);}
   if(path==='/api/auth/me'){const user=await auth(req,env); return user?response({user},200,headers):response({error:'Unauthorized'},401,headers);}
   if(path==='/api/gym/current' && req.method==='GET'){
    const user=await auth(req,env); if(!user) return response({error:'Unauthorized'},401,headers);
    const gym=await env.DB.prepare('SELECT * FROM gyms WHERE id=?').bind(user.gym_id).first();
    return gym?response({data:gym},200,headers):response({error:'Gym not found'},404,headers);
   }
   if(path==='/api/auth/account' && req.method==='PATCH'){
    const user=await auth(req,env); if(!user) return response({error:'Unauthorized'},401,headers);
    const body=await req.json();
    // A valid, unexpired bearer session is required for credential changes.
    const stored=await env.DB.prepare('SELECT password_hash,password_salt,email FROM users WHERE id=? AND gym_id=?').bind(user.id,user.gym_id).first();
    if(!stored) return response({error:'Account not found'},404,headers);
    const nextEmail=body.email===undefined?stored.email:String(body.email).trim().toLowerCase();
    const nextPassword=body.password===undefined?'':String(body.password);
    if(!nextEmail) return response({error:'Email is required'},400,headers);
    if(nextPassword && nextPassword.length<8) return response({error:'New password must be at least 8 characters'},400,headers);
    const conflict=await env.DB.prepare('SELECT id FROM users WHERE gym_id=? AND email=? COLLATE NOCASE AND id<>?').bind(user.gym_id,nextEmail,user.id).first();
    if(conflict) return response({error:'Email is already in use'},409,headers);
    if(nextPassword){ const salt=uid()+uid(); const hash=await passwordHash(nextPassword,salt); await env.DB.prepare('UPDATE users SET email=?,password_salt=?,password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(nextEmail,salt,hash,user.id).run(); }
    else { await env.DB.prepare('UPDATE users SET email=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(nextEmail,user.id).run(); }
    return response({ok:true,email:nextEmail},200,headers);
   }
   if(path==='/api/changes' && req.method==='GET'){
    const user=await auth(req,env); if(!user) return response({error:'Unauthorized'},401,headers);
    const after=Math.max(0,Number(url.searchParams.get('after')||0)); const limit=Math.min(500,Math.max(1,Number(url.searchParams.get('limit')||100)));
    const rows=await env.DB.prepare('SELECT seq,table_name,record_id,operation,created_at FROM change_events WHERE gym_id=? AND seq>? ORDER BY seq ASC LIMIT ?').bind(user.gym_id,after,limit).all();
    const events=rows.results||[]; return response({events,cursor:events.length?events[events.length-1].seq:after},200,headers);
   }
   if(path==='/api/rpc' && req.method==='POST'){
    const body=await req.json(); const name=String(body.name||''); const a=body.args||{};
    if(name==='member_portal_login'){
     const gymId=String(a.p_gym_id||''); const identifier=String(a.p_identifier||'').trim(); const pin=String(a.p_pin||'');
     if(!gymId||!identifier||!/^\d{6}$/.test(pin)) return response({error:'Gym, member identifier and 6-digit PIN are required'},400,headers);
     const identifierKey=await sha256(`${gymId}:${identifier.toLowerCase()}`); const now=Math.floor(Date.now()/1000);
     const attempt=await env.DB.prepare('SELECT attempts,locked_until,window_started_at FROM member_portal_login_attempts WHERE gym_id=? AND identifier_key=?').bind(gymId,identifierKey).first();
     if(attempt?.locked_until && Number(attempt.locked_until)>now) return response({error:'Too many failed attempts. Try again later.'},429,headers);
     const member=await env.DB.prepare("SELECT * FROM members WHERE gym_id=? AND (member_code=? OR phone=? OR attendance_number=?) LIMIT 1").bind(gymId,identifier,identifier,identifier).first();
     const credential=member?await env.DB.prepare('SELECT pin_hash FROM member_portal_credentials WHERE gym_id=? AND member_id=?').bind(gymId,member.id).first():null;
     let valid=false;
     if(credential?.pin_hash){const bcrypt=await import('bcryptjs');valid=await bcrypt.compare(pin,credential.pin_hash);}
     if(!valid){const attempts=Number(attempt?.attempts||0)+1;const locked=attempts>=5?now+900:null;await env.DB.prepare(`INSERT INTO member_portal_login_attempts(gym_id,identifier_key,attempts,window_started_at,locked_until,updated_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(gym_id,identifier_key) DO UPDATE SET attempts=excluded.attempts,window_started_at=CASE WHEN member_portal_login_attempts.window_started_at<? THEN excluded.window_started_at ELSE member_portal_login_attempts.window_started_at END,locked_until=excluded.locked_until,updated_at=CURRENT_TIMESTAMP`).bind(gymId,identifierKey,attempts,now,locked,now-900).run();return response({error:'Invalid member ID/mobile or PIN'},401,headers);}
     await env.DB.prepare('DELETE FROM member_portal_login_attempts WHERE gym_id=? AND identifier_key=?').bind(gymId,identifierKey).run();
     const [payments,attendance,workouts,diets,ptSessions,profileHistory]=await Promise.all([
      env.DB.prepare('SELECT * FROM payments WHERE gym_id=? AND member_id=? ORDER BY COALESCE(payment_date,created_at) DESC LIMIT 100').bind(gymId,member.id).all(),
      env.DB.prepare('SELECT * FROM attendance WHERE gym_id=? AND member_id=? ORDER BY attendance_date DESC LIMIT 100').bind(gymId,member.id).all(),
      env.DB.prepare('SELECT * FROM workout_plans WHERE gym_id=? AND assigned_member_ids_json LIKE ? ORDER BY created_at DESC').bind(gymId,`%${member.id}%`).all(),
      env.DB.prepare('SELECT * FROM diet_plans WHERE gym_id=? AND assigned_member_ids_json LIKE ? ORDER BY created_at DESC').bind(gymId,`%${member.id}%`).all(),
      env.DB.prepare('SELECT p.*,COALESCE(NULLIF(p.trainer_name,\'\'),t.name) AS trainer_name FROM pt_sessions p LEFT JOIN trainers t ON t.id=p.trainer_id AND t.gym_id=p.gym_id WHERE p.gym_id=? AND p.member_id=? ORDER BY COALESCE(p.session_date,p.created_at) DESC').bind(gymId,member.id).all(),
      env.DB.prepare('SELECT id,changed_at,measurements_json,medical_json FROM member_portal_profile_history WHERE gym_id=? AND member_id=? ORDER BY changed_at DESC LIMIT 100').bind(gymId,member.id).all()
     ]);
     return response({ok:true,member:decodeRow('members',member),payments:(payments.results||[]).map(r=>decodeRow('payments',r)),attendance:attendance.results||[],workout_plans:(workouts.results||[]).map(r=>decodeRow('workout_plans',r)),diet_plans:(diets.results||[]).map(r=>decodeRow('diet_plans',r)),pt_sessions:(ptSessions.results||[]).map(r=>decodeRow('pt_sessions',r)),profile_history:(profileHistory.results||[]).map(r=>({...r,measurements:JSON.parse(r.measurements_json||'{}'),medical:JSON.parse(r.medical_json||'{}')}))},200,headers);
    }
    if(name==='member_portal_update_profile'){
     const gymId=String(a.p_gym_id||''); const memberId=String(a.p_member_id||''); const pin=String(a.p_pin||''); const profile=a.p_profile||{};
     if(!gymId||!memberId||!/^[0-9]{6}$/.test(pin)) return response({error:'Member, gym and 6-digit PIN are required'},400,headers);
     const member=await env.DB.prepare('SELECT * FROM members WHERE id=? AND gym_id=?').bind(memberId,gymId).first();
     const credential=member?await env.DB.prepare('SELECT pin_hash FROM member_portal_credentials WHERE gym_id=? AND member_id=?').bind(gymId,memberId).first():null;
     if(!member||!credential?.pin_hash) return response({error:'Member portal account not found'},404,headers);
     const attemptKey=await sha256(`${gymId}:profile:${memberId}`); const now=Math.floor(Date.now()/1000);
     const attempt=await env.DB.prepare('SELECT attempts,locked_until,window_started_at FROM member_portal_login_attempts WHERE gym_id=? AND identifier_key=?').bind(gymId,attemptKey).first();
     if(attempt?.locked_until&&Number(attempt.locked_until)>now) return response({error:'Too many failed attempts. Try again in 15 minutes.'},429,headers);
     const bcrypt=await import('bcryptjs'); const pinValid=await bcrypt.compare(pin,credential.pin_hash);
     if(!pinValid){const attempts=Number(attempt?.attempts||0)+1;const locked=attempts>=5?now+900:null;await env.DB.prepare(`INSERT INTO member_portal_login_attempts(gym_id,identifier_key,attempts,window_started_at,locked_until,updated_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(gym_id,identifier_key) DO UPDATE SET attempts=excluded.attempts,window_started_at=CASE WHEN member_portal_login_attempts.window_started_at<? THEN excluded.window_started_at ELSE member_portal_login_attempts.window_started_at END,locked_until=excluded.locked_until,updated_at=CURRENT_TIMESTAMP`).bind(gymId,attemptKey,attempts,now,locked,now-900).run();return response({error:'Invalid member PIN'},401,headers);}
     await env.DB.prepare('DELETE FROM member_portal_login_attempts WHERE gym_id=? AND identifier_key=?').bind(gymId,attemptKey).run();
     const allowed=['height','weight','body_fat','chest','shoulder','biceps','forearms','waist','hips','thighs','calves','neck'];
     const measurements={}; for(const key of allowed){const value=profile.measurements?.[key]; if(value!==undefined&&value!==null&&String(value).trim()!==''){const n=Number(value);if(!Number.isFinite(n)||n<0||n>500)return response({error:`Invalid ${key} value`},400,headers);measurements[key]=String(n);}else measurements[key]='';}
     const conditions=Array.isArray(profile.medical?.medicalConditions)?profile.medical.medicalConditions.map(x=>String(x).trim()).filter(Boolean).slice(0,40):[];
     const medical={medicalConditions:conditions,medicalOther:String(profile.medical?.medicalOther||'').slice(0,2000),surgeryDetails:String(profile.medical?.surgeryDetails||'').slice(0,2000),additionalMedicalNotes:String(profile.medical?.additionalMedicalNotes||'').slice(0,3000)};
     const marker='<!--PREFACE_MEMBER_META:'; const notes=String(member.notes||''); const idx=notes.lastIndexOf(marker); let meta={}; if(idx>=0){try{meta=JSON.parse(notes.slice(idx+marker.length).split('-->')[0]||'{}')}catch{meta={}}} const clean=idx>=0?notes.slice(0,idx).trim():notes.trim();
     const nextMeta={...meta,...medical}; for(const key of ['chest','shoulder','biceps','forearms','waist','hips','thighs','calves','neck'])nextMeta[key]=measurements[key]||'';
     const nextNotes=`${clean}${clean?'\n\n':''}${marker}${JSON.stringify(nextMeta)}-->`;
     const previousMeasurements={height:member.height||'',weight:member.weight||'',body_fat:member.body_fat||'',...Object.fromEntries(['chest','shoulder','biceps','forearms','waist','hips','thighs','calves','neck'].map(k=>[k,meta[k]||'']))};
     const previousMedical={medicalConditions:meta.medicalConditions||[],medicalOther:meta.medicalOther||'',surgeryDetails:meta.surgeryDetails||'',additionalMedicalNotes:meta.additionalMedicalNotes||''};
     const changedAt=new Date().toISOString(); const historyId=uid();
     const existingHistory=await env.DB.prepare('SELECT id FROM member_portal_profile_history WHERE gym_id=? AND member_id=? LIMIT 1').bind(gymId,memberId).first();
     const statements=[];
     if(!existingHistory && (Object.values(previousMeasurements).some(v=>String(v||'').trim()!=='') || previousMedical.medicalConditions.length || previousMedical.medicalOther || previousMedical.surgeryDetails || previousMedical.additionalMedicalNotes)){
      statements.push(env.DB.prepare('INSERT INTO member_portal_profile_history(id,gym_id,member_id,changed_at,measurements_json,medical_json) VALUES(?,?,?,?,?,?)').bind(uid(),gymId,memberId,member.updated_at||member.created_at||changedAt,JSON.stringify(previousMeasurements),JSON.stringify(previousMedical)));
     }
     statements.push(
      env.DB.prepare('UPDATE members SET height=?,weight=?,body_fat=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND gym_id=?').bind(measurements.height||null,measurements.weight||null,measurements.body_fat||null,nextNotes,memberId,gymId),
      env.DB.prepare('INSERT INTO member_portal_profile_history(id,gym_id,member_id,changed_at,measurements_json,medical_json) VALUES(?,?,?,?,?,?)').bind(historyId,gymId,memberId,changedAt,JSON.stringify(measurements),JSON.stringify(medical)),
      env.DB.prepare('INSERT INTO progress_records(id,gym_id,member_id,record_date,weight,body_fat,chest,waist,hips,arms,thighs,neck,notes,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)').bind(uid(),gymId,memberId,changedAt.slice(0,10),Number(measurements.weight)||null,Number(measurements.body_fat)||null,Number(measurements.chest)||null,Number(measurements.waist)||null,Number(measurements.hips)||null,Number(measurements.biceps)||null,Number(measurements.thighs)||null,Number(measurements.neck)||null,'Member portal self-reported update')
     );
     await env.DB.batch(statements);
     const updated=await env.DB.prepare('SELECT * FROM members WHERE id=? AND gym_id=?').bind(memberId,gymId).first();
     const rows=await env.DB.prepare('SELECT id,changed_at,measurements_json,medical_json FROM member_portal_profile_history WHERE gym_id=? AND member_id=? ORDER BY changed_at DESC LIMIT 100').bind(gymId,memberId).all();
     return response({ok:true,member:decodeRow('members',updated),profile_history:(rows.results||[]).map(r=>({...r,measurements:JSON.parse(r.measurements_json||'{}'),medical:JSON.parse(r.medical_json||'{}')}))},200,headers);
    }
    const user=await auth(req,env); if(!user) return response({error:'Unauthorized'},401,headers);
    if(name==='get_my_access') return response({userId:user.id,gymId:user.gym_id,role:user.role,permissions:JSON.parse(user.permissions_json||'{}')},200,headers);
    if(name==='provision_staff_login'){
     if(user.role!=='owner') return response({error:'Only the gym owner can create staff accounts'},403,headers);
     const email=String(a.p_email||a.email||'').trim().toLowerCase();
     const displayName=String(a.p_display_name||a.displayName||'').trim();
     const password=String(a.p_password||a.password||'');
     const permissions=a.p_permissions??a.permissions??{};
     if(!displayName) return response({error:'Staff name is required'},400,headers);
     if(displayName.length>100) return response({error:'Staff name must be 100 characters or fewer'},400,headers);
     if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254) return response({error:'Enter a valid email address'},400,headers);
     if(password.length<8 || password.length>128) return response({error:'Password must be between 8 and 128 characters'},400,headers);
     if(!permissions || typeof permissions!=='object' || Array.isArray(permissions)) return response({error:'Staff permissions must be an object'},400,headers);
     const existing=await env.DB.prepare('SELECT id FROM users WHERE gym_id=? AND email=? COLLATE NOCASE').bind(user.gym_id,email).first();
     if(existing) return response({error:'A user with this email already exists in this gym'},409,headers);
     const id=uid(); const salt=uid()+uid(); const hash=await passwordHash(password,salt);
     await env.DB.batch([
      env.DB.prepare(`INSERT INTO users(id,gym_id,email,password_hash,password_salt,role,display_name,member_id,is_active,created_at,updated_at) VALUES(?,?,?,?,?,'staff',?,NULL,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(id,user.gym_id,email,hash,salt,displayName),
      env.DB.prepare(`INSERT INTO gym_users(id,gym_id,role,created_at,permissions_json,is_active) VALUES(?,?,'staff',CURRENT_TIMESTAMP,?,1)`).bind(id,user.gym_id,JSON.stringify(permissions))
     ]);
     return response({success:true,user:{user_id:id,email,display_name:displayName,role:'staff',permissions,is_active:true}},201,headers);
    }
    if(name==='get_gym_staff'){
     if(user.role!=='owner') return response({error:'Only the gym owner can view staff accounts'},403,headers);
     const rows=await env.DB.prepare("SELECT gu.id AS user_id,u.email,u.display_name,gu.role,gu.permissions_json AS permissions,gu.is_active FROM gym_users gu JOIN users u ON u.id=gu.id WHERE gu.gym_id=? AND gu.role<>'owner' ORDER BY u.email").bind(user.gym_id).all();
     return response({staff:(rows.results||[]).map(r=>({...r,permissions:JSON.parse(r.permissions||'{}'),is_active:!!r.is_active}))},200,headers);
    }
    if(name==='update_staff_permissions'){
     if(user.role!=='owner') return response({error:'Only the gym owner can change staff permissions'},403,headers);
     const targetId=String(a.p_user_id||a.user_id||''); const permissions=a.p_permissions??a.permissions??{};
     const target=await env.DB.prepare('SELECT role FROM gym_users WHERE id=? AND gym_id=?').bind(targetId,user.gym_id).first();
     if(!target||target.role==='owner') return response({error:target?'Owner permissions cannot be changed here':'Staff account not found'},404,headers);
     await env.DB.prepare('UPDATE gym_users SET permissions_json=? WHERE id=? AND gym_id=?').bind(JSON.stringify(permissions),targetId,user.gym_id).run();
     await env.DB.prepare('UPDATE users SET updated_at=CURRENT_TIMESTAMP WHERE id=? AND gym_id=?').bind(targetId,user.gym_id).run();
     return response({success:true,userId:targetId,permissions},200,headers);
    }
    if(name==='set_staff_active'){
     if(user.role!=='owner') return response({error:'Only the gym owner can change staff status'},403,headers);
     const targetId=String(a.p_user_id||a.user_id||''); const active=!!(a.p_is_active??a.is_active);
     const target=await env.DB.prepare('SELECT role FROM gym_users WHERE id=? AND gym_id=?').bind(targetId,user.gym_id).first();
     if(!target||target.role==='owner') return response({error:target?'Owner account cannot be disabled here':'Staff account not found'},404,headers);
     await env.DB.prepare('UPDATE gym_users SET is_active=? WHERE id=? AND gym_id=?').bind(active?1:0,targetId,user.gym_id).run();
     if(!active) await env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND gym_id=?').bind(targetId,user.gym_id).run();
     return response({success:true,userId:targetId,is_active:active},200,headers);
    }
    if(name==='public_get_gym_profile'||name==='public_check_in'||name==='public_submit_feedback') return response({error:'Use the public /api/public/* endpoint for this operation.'},400,headers);
    if(name==='set_member_portal_pin'){
     if(!['owner','admin'].includes(user.role) && !(user.role==='staff' && canWrite(user,'members'))) return response({error:'Members write permission is required to set a member portal PIN'},403,headers);
     const memberId=String(a.p_member_id||''); const pin=String(a.p_pin||'');
     if(!/^\d{6}$/.test(pin)) return response({error:'PIN must contain exactly six digits'},400,headers);
     const member=await env.DB.prepare('SELECT id FROM members WHERE id=? AND gym_id=?').bind(memberId,user.gym_id).first();
     if(!member) return response({error:'Member not found'},404,headers);
     const bcrypt=await import('bcryptjs'); const hash=await bcrypt.hash(pin,10);
     await env.DB.prepare(`INSERT INTO member_portal_credentials(member_id,gym_id,pin_hash,created_at,updated_at) VALUES(?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(member_id) DO UPDATE SET pin_hash=excluded.pin_hash,updated_at=CURRENT_TIMESTAMP`).bind(memberId,user.gym_id,hash).run();
     return response({success:true},200,headers);
    }
    return response({error:'Unknown or unsupported RPC',rpc:name},404,headers);
   }
   const wsMatch=path.match(/^\/api\/live\/([^/]+)$/); if(wsMatch){ const user=await auth(req,env); if(!user||user.gym_id!==wsMatch[1]) return response({error:'Unauthorized'},401,headers); const id=env.LIVE_ROOMS.idFromName(user.gym_id); return env.LIVE_ROOMS.get(id).fetch(new Request('https://live.internal/ws',{headers:req.headers})); }
   const match=path.match(/^\/api\/data\/([a-z_]+)(?:\/([^/]+))?$/);
   if(match){
    const user=await auth(req,env); if(!user) return response({error:'Unauthorized'},401,headers);
    const table=match[1], id=match[2], spec=TABLE_MAP[table]; if(!spec) return response({error:'Unknown table'},404,headers);
    if(req.method==='GET'){
     if(id){const row=await env.DB.prepare(`SELECT * FROM ${table} WHERE id=? AND gym_id=?`).bind(id,user.gym_id).first();return row?response({data:decodeRow(table,row)},200,headers):response({error:'Record not found'},404,headers);}
     const limit=Math.min(500,Math.max(1,Number(url.searchParams.get('limit')||100)));
     const orderBy=table==='payments' ? "COALESCE(created_at,payment_date,'') DESC, rowid DESC" : "COALESCE(created_at,'') DESC";
     const rows=await env.DB.prepare(`SELECT * FROM ${table} WHERE gym_id=? ORDER BY ${orderBy} LIMIT ?`).bind(user.gym_id,limit).all();
     return response({data:(rows.results||[]).map(r=>decodeRow(table,r))},200,headers);
    }
    if(!canWrite(user,table)) return response({error:'Permission denied'},403,headers);
    if(req.method==='POST'||req.method==='PUT'||req.method==='PATCH'){
     const body=await req.json();const rows=Array.isArray(body)?body:[body];if(rows.length>100)return response({error:'Maximum 100 records per batch'},413,headers);
     const stmts=[],ids=[];
     for(const row of rows){const rid=String(row.id||uid());const encoded=encodeRow(table,{...row,id:rid,gym_id:user.gym_id});encoded.id=rid;encoded.gym_id=user.gym_id;
      // D1's members.created_at is nullable and has no default. Ensure new member
      // records always receive a timestamp, including writes from older clients.
      if((table==='members' || table==='payments') && !encoded.created_at) encoded.created_at=new Date().toISOString();
      const cols=Object.keys(encoded);const placeholders=cols.map(()=>'?').join(',');const updates=cols.filter(c=>!['id','gym_id'].includes(c)).map(c=>`${c}=excluded.${c}`).join(',');
      const conflict=table==='app_settings'?'gym_id,setting_key':'id';
      stmts.push(env.DB.prepare(`INSERT INTO ${table}(${cols.join(',')}) VALUES(${placeholders}) ON CONFLICT(${conflict}) DO UPDATE SET ${updates||'id=excluded.id'} WHERE ${table}.gym_id=excluded.gym_id`).bind(...cols.map(c=>encoded[c])));
      stmts.push(env.DB.prepare('INSERT INTO change_events(gym_id,table_name,record_id,operation) VALUES(?,?,?,?)').bind(user.gym_id,table,rid,'upsert'));ids.push(rid);
     }
     await env.DB.batch(stmts);await publish(env,user.gym_id,{type:'data_changed',gymId:user.gym_id,table,ids,at:Date.now()});return response({ok:true,ids},200,headers);
    }
    if(req.method==='DELETE'&&id){
     if(table==='members'){
      // Remove the member's ledger rows first, in the same D1 transaction.
      // This avoids orphaned payment entries when a member is deleted.
      const memberRow=await env.DB.prepare('SELECT member_code,name FROM members WHERE id=? AND gym_id=?').bind(id,user.gym_id).first();
      const memberCode=String(memberRow?.member_code||id);
      // Some imported legacy ledger rows have no member_id. Match those by name
      // only when the name is unique inside this gym, avoiding duplicate-name deletion.
      const sameName=memberRow?.name ? await env.DB.prepare("SELECT COUNT(*) AS count FROM members WHERE gym_id=? AND lower(trim(name))=lower(trim(?))").bind(user.gym_id,memberRow.name).first() : null;
      const uniqueName=Number(sameName?.count||0)===1 && Boolean(memberRow?.name);
      const paymentWhere=uniqueName
       ? "gym_id=? AND (member_id=? OR member_id=? OR (member_id IS NULL AND lower(trim(COALESCE(member_name,'')))=lower(trim(?))))"
       : 'gym_id=? AND (member_id=? OR member_id=?)';
      const paymentArgs=uniqueName ? [user.gym_id,id,memberCode,memberRow.name] : [user.gym_id,id,memberCode];
      const paymentRows=await env.DB.prepare(`SELECT id FROM payments WHERE ${paymentWhere}`).bind(...paymentArgs).all();
      const paymentIds=(paymentRows.results||[]).map(row=>row.id);
      const batch=[
       env.DB.prepare(`INSERT INTO change_events(gym_id,table_name,record_id,operation) SELECT gym_id,'payments',id,'delete' FROM payments WHERE ${paymentWhere}`).bind(...paymentArgs),
       env.DB.prepare(`DELETE FROM payments WHERE ${paymentWhere}`).bind(...paymentArgs),
       env.DB.prepare('DELETE FROM members WHERE id=? AND gym_id=?').bind(id,user.gym_id),
       env.DB.prepare('INSERT INTO change_events(gym_id,table_name,record_id,operation) VALUES(?,?,?,?)').bind(user.gym_id,'members',id,'delete')
      ];
      const results=await env.DB.batch(batch);
      const memberChanges=results?.[2]?.meta?.changes||0;
      if(paymentIds.length) await publish(env,user.gym_id,{type:'data_changed',gymId:user.gym_id,table:'payments',ids:paymentIds,at:Date.now()});
      await publish(env,user.gym_id,{type:'data_changed',gymId:user.gym_id,table:'members',ids:[id],at:Date.now()});
      return response({ok:true,changes:memberChanges,paymentsDeleted:paymentIds.length},200,headers);
     }
     const result=await env.DB.prepare(`DELETE FROM ${table} WHERE id=? AND gym_id=?`).bind(id,user.gym_id).run();
     await env.DB.prepare('INSERT INTO change_events(gym_id,table_name,record_id,operation) VALUES(?,?,?,?)').bind(user.gym_id,table,id,'delete').run();
     await publish(env,user.gym_id,{type:'data_changed',gymId:user.gym_id,table,ids:[id],at:Date.now()});
     return response({ok:true,changes:result.meta?.changes||0},200,headers);
    }
    return response({error:'Method not allowed'},405,headers);
   }
   return response({error:'Not found'},404,headers);
  }catch(e){ return response({error:'Internal server error',message:e?.message||'Unknown error'},500,headers); }
 }
};

// Exported for deterministic mapping unit tests; not part of the HTTP surface.
export { encodeRow, decodeRow };
export { TABLE_MAP };
