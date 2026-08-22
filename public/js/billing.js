const PLAN_NAMES={starter:'Starter',creator:'Creator',pro:'Pro',studio:'Studio'};
const params=new URLSearchParams(window.location.search);
const plan=(params.get('plan')||'').toLowerCase();
const status=params.get('status')||'';
const title=document.getElementById('planTitle');
const description=document.getElementById('planDescription');
const summary=document.getElementById('planSummary');
const error=document.getElementById('billingError');
const button=document.getElementById('payButton');

async function getMe(){const response=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});return response.json();}
async function load(){
 if(!PLAN_NAMES[plan]){title.textContent='Choose a paid plan.';description.textContent='Select a plan from the SvaraONE pricing page to continue.';button.disabled=true;return;}
 if(status==='success'){title.textContent='Payment submitted.';description.textContent='Payfast has returned you to SvaraONE. Your account will activate when the payment notification is confirmed.';button.textContent='Back to Studio';button.onclick=()=>window.location.replace('/studio');return;}
 if(status==='cancelled'){description.textContent='The Payfast payment was cancelled. No paid plan was activated.';}
 try{
  const me=await getMe();
  if(!me.authenticated){const next=`/billing.html?plan=${encodeURIComponent(plan)}`;window.location.replace(`/login.html?next=${encodeURIComponent(next)}`);return;}
  const pricingResponse=await fetch('/api/pricing',{cache:'no-store'});const pricing=await pricingResponse.json();const config=pricing.plans?.[plan];
  if(config){summary.textContent=`${PLAN_NAMES[plan]} · $${Number(config.price).toLocaleString('en-US')} / year · ${Number(config.credits).toLocaleString('en-US')} SvaraONE Credits / month`}
  button.onclick=beginCheckout;
 }catch(err){error.textContent='Unable to load billing details.';button.disabled=true;console.error(err)}
}

async function beginCheckout(){
 error.textContent='';button.disabled=true;button.textContent='Opening Payfast…';
 try{
  const response=await fetch('/api/payments/payfast/checkout',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||'Unable to start payment.');
  const form=document.createElement('form');form.method='POST';form.action=data.action;form.style.display='none';
  Object.entries(data.fields||{}).forEach(([name,value])=>{const input=document.createElement('input');input.type='hidden';input.name=name;input.value=String(value);form.appendChild(input)});
  document.body.appendChild(form);form.submit();
 }catch(err){error.textContent=err.message;button.disabled=false;button.textContent='Continue to Payfast';}
}
load();