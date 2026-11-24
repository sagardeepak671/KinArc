export class LocalAIProvider {
 enabled(){return typeof location!=='undefined'&&['localhost','127.0.0.1'].includes(location.hostname)&&location.port==='8766'}
 async health(){if(!this.enabled())throw Error('Use the local Mac server on port 8766 for generative AI.');const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),2500);try{const r=await fetch('api/health',{signal:controller.signal,cache:'no-store'});if(!r.ok)throw Error('Local AI service unavailable');const value=await r.json();if(!value.available)throw Error(value.message||'Local model is unavailable');return value}finally{clearTimeout(timer)}}
 async reply(messages,{signal,context,spoken=false}={}){const response=await fetch('api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal,body:JSON.stringify({messages,context,spoken})});const value=await response.json();if(!response.ok)throw Error(value.error||'The local coach could not reply.');return value}
}
