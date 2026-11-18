// GitHub-only personal drill persistence. Credentials live in the caller's memory, never in storage.
const ROOT='https://api.github.com/repos/techtinkerclub/techtinkerclub.github.io/contents/rugby/data/coach-drills.json';
export const REPO_LIBRARY='https://github.com/techtinkerclub/techtinkerclub.github.io/blob/master/rugby/data/coach-drills.json';
const empty=()=>({version:1,kind:'rugby-coach-library',drills:[]});
const encode=s=>{const bytes=new TextEncoder().encode(s);let b='';for(let i=0;i<bytes.length;i+=8192)b+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(b)};
const decode=s=>new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,'')),c=>c.charCodeAt(0)));
export function validateCoachLibrary(d){
 if(d?.version!==1||d.kind!=='rugby-coach-library'||!Array.isArray(d.drills))throw Error('Invalid GitHub drill library.');
 const ids=new Set();
 for(const q of d.drills){if(!q||typeof q.id!=='string'||ids.has(q.id)||!Array.isArray(q.frames)||!q.frames.length)throw Error('Invalid or duplicate drill in GitHub library.');ids.add(q.id)}
 return d;
}
export function createGithubStore(fetcher=fetch){
 let token='';
 const headers=()=>({Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(token?{Authorization:'Bearer '+token}:{})});
 const request=async(url,opts={})=>{
  const res=await fetcher(url,{cache:'no-store',redirect:'error',...opts,headers:{...headers(),...opts.headers}});
  if(!res.ok){let msg=res.status===401?'GitHub authentication expired or invalid. Reconnect.':res.status===403?'GitHub denied access or rate limited this request. Check token permissions.':res.status===409||res.status===422?'GitHub rejected the update. Reload the library and retry.':'GitHub request failed (HTTP '+res.status+').';const err=Error(msg);err.status=res.status;throw err}
  return res.json();
 };
 const load=async(ref='master')=>{
  const response=await request(ROOT+'?ref='+encodeURIComponent(ref));
  if(response.encoding!=='base64'||typeof response.content!=='string'||!response.sha)throw Error('GitHub returned an unsupported library format.');
  return {data:validateCoachLibrary(JSON.parse(decode(response.content))),sha:response.sha};
 };
 return {
  connected:()=>!!token,disconnect:()=>{token=''},
  async connect(value){if(!/^github_pat_[A-Za-z0-9_]+$/.test(value))throw Error('Use a fine-grained GitHub personal access token.');token=value;try{return await load()}catch(e){token='';throw e}},
  load,
  async save(drill,baseline){
   if(!token)throw Error('Connect to GitHub first.');
   const latest=await load(),existing=latest.data.drills.find(x=>x.id===drill.id);
   if(existing&&(!baseline||JSON.stringify(existing)!==JSON.stringify(baseline)))throw Error('This drill changed on GitHub. Reopen the latest saved copy or export your current edits before retrying.');
   if(!existing&&baseline)throw Error('This drill was removed on GitHub. Reopen the latest library before saving.');
   const snapshot={...JSON.parse(JSON.stringify(drill)),revision:existing?Math.max(1,Number(existing.revision)||1)+1:1,savedAt:new Date().toISOString()};
   const data={...latest.data,drills:[snapshot,...latest.data.drills.filter(x=>x.id!==snapshot.id)]},json=JSON.stringify(data,null,2)+'\n';
   if(new TextEncoder().encode(json).length>750000)throw Error('GitHub library size limit reached. Export JSON to protect your work.');
   const result=await request(ROOT,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Save rugby drill: '+String(drill.title||'Untitled').replace(/[\r\n]/g,' ').slice(0,100),content:encode(json),sha:latest.sha,branch:'master'})});
   const commit=result.commit?.sha;if(!/^[a-f0-9]{40}$/.test(commit||''))throw Error('Commit could not be confirmed. Refresh the GitHub library before retrying.');
   const verify=await load(commit),stored=verify.data.drills.find(x=>x.id===snapshot.id);
   if(JSON.stringify(stored)!==JSON.stringify(snapshot))throw Error('Commit verification failed. Refresh the GitHub library before retrying.');
   return {data:verify.data,snapshot:stored,commit};
  },
  async remove(id,baseline){
   if(!token)throw Error('Connect to GitHub first.');
   const latest=await load(),existing=latest.data.drills.find(x=>x.id===id);
   if(!existing)throw Error('Drill no longer exists on GitHub. Refresh the library.');
   if(!baseline||JSON.stringify(existing)!==JSON.stringify(baseline))throw Error('This drill changed on GitHub. Refresh and review it before deleting.');
   const data={...latest.data,drills:latest.data.drills.filter(x=>x.id!==id)};
   const json=JSON.stringify(data,null,2)+'\n';
   const result=await request(ROOT,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Remove rugby drill: '+String(existing.title||id).replace(/[\r\n]/g,' ').slice(0,100),content:encode(json),sha:latest.sha,branch:'master'})});
   const commit=result.commit?.sha;
   if(!/^[a-f0-9]{40}$/.test(commit||''))throw Error('Deletion commit could not be confirmed. Refresh GitHub.');
   const verify=await load(commit);
   if(verify.data.drills.some(x=>x.id===id))throw Error('Deletion verification failed. Refresh GitHub.');
   return {data:verify.data,commit};
  }
 };
}
