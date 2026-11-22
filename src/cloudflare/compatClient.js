/*
 * Compatibility layer for the existing data access API for staged Cloudflare cutover.
 * Selected only when VITE_BACKEND=cloudflare; Cloudflare Worker is the only configured backend.
 * It intentionally returns legacy {data,error} results to avoid a risky
 * rewrite of the large existing React data layer.
 */
import { createCloudflareClient } from './client';

const TOKEN_KEY = 'preface_cf_access_token';
const GYM_ID = String(import.meta.env.VITE_CLOUDFLARE_GYM_ID || '').trim();
const api = createCloudflareClient({
  baseUrl: import.meta.env.VITE_CLOUDFLARE_API_URL,
  gymId: GYM_ID,
  getToken: async () => {
    try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
});

const authListeners = new Set();

// IDs arrive as strings from D1, while legacy callers may pass numeric values.
function sameValue(left, right) {
  if (left == null || right == null) return left === right;
  return String(left) === String(right);
}

let cachedUser = null;
function emitAuth(event, session) {
  cachedUser = session?.user || null;
  for (const listener of authListeners) {
    try { listener(event, session); } catch (error) { console.error('Auth listener failed', error); }
  }
}
function makeSession(token, user, expiresAt) {
  return { access_token: token, token_type: 'bearer', expires_at: expiresAt, user };
}
function errorResult(error) { return { data: null, error: { message: error?.message || 'Cloudflare request failed', status: error?.status || 0 } }; }

class Query {
  constructor(table) { this.table=table; this.operation='select'; this.payload=null; this.filters={}; this.singleMode='many'; this.limitValue=500; this.ordering=null; }
  select(){ this.returning=true; return this; }
  eq(key,value){ this.filters[key]=value; return this; }
  order(key,{ascending=true}={}){ this.ordering={key,ascending}; return this; }
  limit(value){ this.limitValue=Math.min(500,Math.max(1,Number(value)||100)); return this; }
  insert(payload){this.operation='insert';this.payload=payload;return this;}
  update(payload){this.operation='update';this.payload=payload;return this;}
  delete(){this.operation='delete';return this;}
  upsert(payload,options={}){this.operation='upsert';this.payload=payload;this.onConflict=options.onConflict||'id';return this;}
  single(){this.singleMode='single';return this.execute();}
  maybeSingle(){this.singleMode='maybe';return this.execute();}
  async execute(){
    try {
      if(this.table==='gym_users' && this.operation==='select'){
        const {user}=await api.me(); const row=user?{id:user.id,gym_id:user.gymId ?? user.gym_id,role:user.role}:null;
        if(!row || Object.entries(this.filters).some(([k,v])=>!sameValue(row[k],v))) return {data:null,error:null};
        return {data:row,error:null};
      }
      if(this.table==='gyms' && this.operation==='select'){
        const result=await api.requestGymCurrent(); const row=result;
        if(!row || Object.entries(this.filters).some(([k,v])=>!sameValue(row[k],v))) return {data:null,error:null};
        return {data:row,error:null};
      }
      if(this.operation==='select'){
        if(this.filters.id!==undefined){const row=await api.get(this.table,this.filters.id);return {data:row,error:null};}
        let rows=await api.list(this.table,{limit:this.limitValue});
        rows=rows.filter(row=>Object.entries(this.filters).every(([key,value])=>sameValue(row[key],value))); 
        if(this.ordering) rows.sort((a,b)=>String(a[this.ordering.key]||'').localeCompare(String(b[this.ordering.key]||''))*(this.ordering.ascending?1:-1));
        if(this.singleMode==='single'){if(!rows.length)throw new Error('No rows returned');return {data:rows[0],error:null};}
        if(this.singleMode==='maybe') return {data:rows[0]||null,error:null};
        return {data:rows,error:null};
      }
      if(this.operation==='insert'||this.operation==='upsert'){
        const rows=Array.isArray(this.payload)?this.payload:[this.payload];
        const result=await api.upsert(this.table,rows);
        if(!this.returning) return {data:null,error:null};
        const ids=Array.isArray(result?.ids)?result.ids:[];
        if(ids.length!==rows.length) throw new Error(`Cloudflare saved ${ids.length} of ${rows.length} ${this.table} record(s); the server did not confirm every inserted ID.`);
        const returned=await Promise.all(ids.map(id=>api.get(this.table,id)));
        const missing=returned.findIndex(row=>!row);
        if(missing!==-1) throw new Error(`Cloudflare accepted the ${this.table} write but read-back failed for record ${ids[missing]}. Check the Worker/D1 gym binding before retrying.`);
        return {data:Array.isArray(this.payload)?returned:returned[0],error:null};
      }
      if(this.operation==='update'){
        const id=this.filters.id; if(!id) throw new Error('Cloudflare update requires an id filter');
        const current=await api.get(this.table,id); const result=await api.upsert(this.table,{...current,...this.payload,id});
        if(!this.returning) return {data:null,error:null};
        return {data:await api.get(this.table,id),error:null};
      }
      if(this.operation==='delete'){
        const id=this.filters.id; if(!id) throw new Error('Cloudflare delete requires an id filter');
        await api.remove(this.table,id);return {data:null,error:null};
      }
      throw new Error(`Unsupported query operation: ${this.operation}`);
    } catch(error){return errorResult(error);}
  }
  then(resolve,reject){return this.execute().then(resolve,reject);}
}

const auth = {
  async signInWithPassword({email,password}){
    try{
      if(!GYM_ID) throw new Error('VITE_CLOUDFLARE_GYM_ID is required for Cloudflare login');
      const result=await api.login(email,password,GYM_ID); const session=makeSession(result.token,result.user,result.expiresAt);
      window.localStorage.setItem(TOKEN_KEY,result.token);emitAuth('SIGNED_IN',session);return {data:{user:result.user,session},error:null};
    }catch(error){return errorResult(error);}
  },
  async signOut(){try{await api.logout();}catch{};try{window.localStorage.removeItem(TOKEN_KEY);}catch{};emitAuth('SIGNED_OUT',null);return {error:null};},
  async getSession(){try{const token=window.localStorage.getItem(TOKEN_KEY);if(!token)return {data:{session:null},error:null};const result=await api.me();const session=makeSession(token,result.user,null);cachedUser=result.user;return {data:{session},error:null};}catch(error){return errorResult(error);}},
  async getUser(){try{const result=await api.me();cachedUser=result.user;return {data:{user:result.user},error:null};}catch(error){return errorResult(error);}},
  onAuthStateChange(callback){authListeners.add(callback);this.getSession().then(({data})=>callback('INITIAL_SESSION',data?.session||null));return {data:{subscription:{unsubscribe:()=>authListeners.delete(callback)}}};},
  async updateUser(updates={}){try{const result=await api.updateAccount({email:updates.email,password:updates.password});const current=await api.me();return {data:{user:current.user},error:null};}catch(error){return errorResult(error);}}
};

async function rpc(name,args={}){
  try{
    if(name==='public_get_gym_profile') return {data:await api.publicGymProfile(args.p_gym_id),error:null};
    if(name==='public_check_in') return {data:await api.publicCheckIn(args),error:null};
    if(name==='public_submit_feedback') return {data:await api.publicSubmitFeedback(args),error:null};
    const result=await api.rpc(name,args);return {data:result.staff||result,error:null};
  }catch(error){return errorResult(error);}
}

export const backendClient = {
  auth,
  from:(table)=>new Query(table),
  rpc,
  channel:()=>({on(){return this;},subscribe(callback){if(callback)callback('SUBSCRIBED');return this;}}),
  removeChannel:async()=>({}),
};
