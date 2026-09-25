const $=id=>document.getElementById(id);
const BUILD="blue5";try{$("buildTag").textContent=BUILD;}catch{}console.log("NovaSMS",BUILD);
// progress
let pT=null;function pStart(){$("pbar").style.opacity=1;$("pbar").style.width="35%";clearTimeout(pT);pT=setTimeout(()=>$("pbar").style.width="75%",300);}
function pDone(){$("pbar").style.width="100%";setTimeout(()=>{$("pbar").style.opacity=0;$("pbar").style.width="0";},250);}
const token=()=>localStorage.getItem("nova:token")||"";
if(!token())location.href="/login";
let _gone=false;
const api=async(m,u,b,quiet)=>{if(!quiet)pStart();const c=new AbortController();const t=setTimeout(()=>c.abort(),15000);
try{const r=await fetch(u,{method:m,headers:Object.assign({"Content-Type":"application/json"},token()?{Authorization:"Bearer "+token()}:{}),body:b?JSON.stringify(b):undefined,signal:c.signal});
if(r.status===401&&!u.includes("/api/auth")){
if(!_gone){_gone=true;localStorage.removeItem("nova:token");localStorage.removeItem("nova:user");location.href="/login";}
throw new Error("Session expired — login again");}
const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.detail||"Request failed");return j;}finally{clearTimeout(t);if(!quiet)pDone();}};
function logout(){localStorage.removeItem("nova:token");localStorage.removeItem("nova:user");location.href="/login";}
function toggleGrp(id){document.getElementById(id).classList.toggle("open");}
let ME=null;
async function loadMe(){try{ME=await api("GET","/api/auth/me");localStorage.setItem("nova:user",JSON.stringify(ME));}catch{ME=JSON.parse(localStorage.getItem("nova:user")||"null");}
if(ME){$("meName").textContent=ME.name||"User";$("meRole").textContent=(ME.role||"customer")+" · online";
$("meFace").textContent=(ME.name||"U").split(" ").map(s=>s[0]).join("").slice(0,2).toUpperCase();
const isAdmin=ME.role==="admin"||ME.role==="super_admin";
const isSuper=ME.role==="super_admin";
if(isAdmin)$("navUsers").classList.remove("hide");
$("adminDash").classList.toggle("hide",!isAdmin);
$("custDash").classList.toggle("hide",isAdmin);
$("greetH").textContent=isSuper?"Super control room.":isAdmin?"Admin control room.":"Morning flow, let's hit send.";
if(isAdmin)loadAdminDash();}}
const toast=(m,ok)=>{const d=document.createElement("div");d.className="toast "+(ok||"");d.textContent=m;$("toasts").appendChild(d);setTimeout(()=>d.remove(),3200);};
let _errN=0;window.addEventListener("error",e=>{try{if(_errN++<3)toast("Error: "+(e.message||"unknown"),"err");}catch{}});
const debounce=(f,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms);};};
let THREADS=[],THREAD="";
// tiny SWR cache: instant paint, then revalidate
const cache={get(k){try{const v=localStorage.getItem("nova:"+k);return v?JSON.parse(v):null;}catch{return null;}},
set(k,v){try{localStorage.setItem("nova:"+k,JSON.stringify(v));}catch{}}};
// chunked render: keeps 60fps on big tables
function paint(el,rows,map){if(!el)return;el.innerHTML="";if(!rows.length){el.innerHTML="<tr><td colspan=7>empty</td></tr>";return;}
let i=0;const step=()=>{const frag=document.createElement("tbody");frag.innerHTML=rows.slice(i,i+60).map(map).join("");
[...frag.children].forEach(n=>el.appendChild(n));i+=60;if(i<rows.length)requestAnimationFrame(step);};requestAnimationFrame(step);}
function skel(el,n=5){if(el)el.innerHTML=Array(n).fill('<tr><td colspan=7><div class="sk">&nbsp;</div></td></tr>').join("");}

const railBtns=()=>[...document.querySelectorAll(".rail button[data-p]")];
const tabBtns=()=>[...document.querySelectorAll(".tabbar button[data-p]")];
railBtns().forEach(b=>b.onclick=()=>go(b.dataset.p,b.dataset.tab));
tabBtns().forEach(b=>b.onclick=()=>go(b.dataset.p));
$("moreTab").onclick=()=>document.body.classList.add("rail-open");
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
const TITLES={dashboard:"Dashboard",sending:"Sending",contacts:"Contacts",sms:"History",senders:"Sender ID",templates:"SMS Template",blacklist:"Blacklist",chat:"Chat Box",reports:"Reports",developers:"Developers",support:"Support",users:"Users",profile:"Profile",billing:"Billing",pricing:"Pricing"};
function go(p,tab){railBtns().forEach(x=>x.classList.toggle("on",x.dataset.p===p&&(!x.dataset.tab||x.dataset.tab===(tab||""))));tabBtns().forEach(x=>x.classList.toggle("on",x.dataset.p===p));
document.querySelectorAll(".view").forEach(x=>x.classList.toggle("on",x.id==="p-"+p));
document.body.classList.remove("rail-open");
if($("meMenu"))$("meMenu").classList.add("hide");
try{localStorage.setItem("nova:page",JSON.stringify({p,tab:tab||null}));}catch{}
if(p!=="chat")document.body.classList.remove("thread-open");
$("ptitle").textContent=TITLES[p]||p;
if(tab){document.querySelectorAll(".seg button").forEach(x=>x.classList.toggle("on",x.dataset.t===tab));
["single","campaign","sched","sim"].forEach(t=>$("t-"+t).classList.toggle("hide",tab!==t));
if(tab==="sched")loadSched2();}
({dashboard:refresh,sending:loadSendersMeta,sms:loadMsgs,contacts:loadContacts,blacklist:loadBlack,chat:loadThreads,reports:loadReports,developers:loadKeys,support:loadTickets,senders:loadSenders,templates:loadTemplates,users:loadUsers,profile:loadProfile,billing:loadBilling,pricing:()=>{}}[p]||(()=>{}))();}
function toggleMe(e){e.stopPropagation();const m=$("meMenu");m.classList.toggle("hide");
$("meBtn").setAttribute("aria-expanded",String(!m.classList.contains("hide")));}
document.addEventListener("click",e=>{const m=$("meMenu");if(m&&!m.classList.contains("hide")&&!e.target.closest(".me-wrap"))m.classList.add("hide");});
async function loadProfile(){const u=ME||await api("GET","/api/auth/me");
$("pfName").value=u.name||"";$("pfEmail").value=u.email||"";$("pfPhone").value=u.phone||"";}
async function saveProfile(){try{const u=await api("PATCH","/api/auth/profile",{name:pfName.value,email:pfEmail.value,phone:pfPhone.value});
ME=u;localStorage.setItem("nova:user",JSON.stringify(u));loadMe();toast("Profile saved","ok");}catch(e){toast(e.message,"err");}}
async function savePassword(){try{const j=await api("POST","/api/auth/password",{current:pwCur.value,new:pwNew.value});
localStorage.setItem("nova:token",j.token);pwCur.value=pwNew.value="";toast("Password updated","ok");}catch(e){toast(e.message,"err");}}
async function loadBilling(){try{const b=await api("GET","/api/billing");
$("blPlan").textContent=b.plan+" · "+b.price;$("blBal").textContent=b.balance;
$("blSent").textContent=b.outbound;$("blDel").textContent=b.delivered;}catch(e){toast(e.message,"err");}}
function closeThread(){THREAD="";document.body.classList.remove("thread-open");renderThreads();}
document.querySelectorAll(".seg button").forEach(b=>b.onclick=()=>{
document.querySelectorAll(".seg button").forEach(x=>x.classList.remove("on"));b.classList.add("on");
["single","campaign","sched","sim"].forEach(t=>$("t-"+t).classList.toggle("hide",b.dataset.t!==t));
if(b.dataset.t==="sched")loadSched2();});
$("themeBtn").onclick=()=>document.body.classList.toggle("dark");
document.addEventListener("keydown",e=>{const t=$("topSearch");if(e.key==="/"&&t&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();t.focus();}});
const globalSearch=debounce(v=>{if(v.length>1){go("sms");$("mQ").value=v;loadMsgs();}},350);

const h=new Date().getHours();
$("greet").textContent=(h<12?"Good morning":h<17?"Good afternoon":"Good evening")+" · here's your studio";
$("greetH").textContent=(h<12?"Morning flow":h<17?"Afternoon flow":"Evening flow")+", let's hit send.";
$("dateLine").textContent=new Date().toDateString();

let _sig="";
async function refresh(quiet){const c=cache.get("stats");if(c&&!_sig)applyStats(c);
try{const s=await api("GET","/api/stats",null,true);cache.set("stats",s);applyStats(s);
if(ME&&(ME.role==="admin"||ME.role==="super_admin"))loadAdminDash();else loadCustDash();
const r=await api("GET","/api/messages?limit=14",null,true);
const sig=JSON.stringify(r.map(m=>[m.id,m.status,m.body]));
if(sig!==_sig){_sig=sig;paint($("recent"),r,row);}}catch{}}
async function loadCustDash(){try{
const a=await api("GET","/api/activity?days=7",null,true);
const t=k=>a.reduce((x,d)=>x+d[k],0);
$("dSent").textContent=t("outbound")+" last 7d";$("dDel").textContent=t("delivered")+" last 7d";
$("dFail").textContent=t("failed")+" failed 7d";$("dIn").textContent=t("inbound")+" received 7d";
$("volLegend").textContent=t("outbound")+" sent · "+t("delivered")+" delivered";
drawVolume("volChart",a);}catch{}}
async function loadAdminDash(){try{const o=await api("GET","/api/admin/overview",null,true);
$("aUsers").textContent=o.users;$("aCustomers").textContent=o.customers+" customers";
$("aMsgs").textContent=o.outbound+o.inbound;$("aDel").textContent=o.delivered;
$("aPS").textContent=o.pending_senders;$("aTix").textContent=o.open_tickets;$("aBlk").textContent=o.blocked;
paint($("aPSRows"),o.pending_sender_list,s=>`<tr><td><b>${s.value}</b></td><td>${s.owner||"—"}</td><td><span class="st pending">${s.status}</span></td><td style="white-space:nowrap"><button class="link" onclick="approveSender(${s.id},true)">approve</button><button class="link" onclick="rejectSender(${s.id})">reject</button></td></tr>`);
paint($("aUsersRows"),o.recent_users,u=>`<tr><td>${u.name}</td><td><span class="chip">${u.role}</span></td><td>${u.balance}</td></tr>`);
try{const a=await api("GET","/api/activity?days=7",null,true);
const t=k=>a.reduce((x,d)=>x+d[k],0);
$("aVolLegend").textContent=t("outbound")+" sent · "+t("delivered")+" delivered";
drawVolume("aVolChart",a);
const rate=o.outbound?Math.round(o.delivered/o.outbound*100):0;
$("aHealth").innerHTML=`<div><span>Delivery rate</span><b>${rate}%</b></div><div><span>Failed</span><b>${o.failed}</b></div><div><span>Inbox</span><b>${o.inbound}</b></div>`;}catch{}}catch{}}
function drawVolume(id,data){const c=$(id);if(!c||!data.length)return;
const d=Math.min(2,window.devicePixelRatio||1),W=520,H=180;
c.style.width="100%";c.style.maxWidth=W+"px";
if(c.width!==W*d){c.width=W*d;c.height=H*d;}
const x=c.getContext("2d");x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,W,H);
const M=Math.max(...data.map(v=>v.outbound),1),n=data.length,gap=10;
const bw=(W-20-(n-1)*gap)/n;
x.strokeStyle=getComputedStyle(document.body).getPropertyValue("--line")||"#e9e2d4";
x.fillStyle="#7a7387";x.font="10px sans-serif";x.textAlign="center";
data.forEach((v,i)=>{const bx=10+i*(bw+gap),bh=Math.max(3,v.outbound/M*120),by=150-bh;
const g=x.createLinearGradient(0,by,0,150);g.addColorStop(0,"#1e6ff5");g.addColorStop(1,"#5aa5ff");
x.fillStyle=g;x.beginPath();x.roundRect(bx,by,bw,bh,[6,6,0,0]);x.fill();
if(v.outbound){x.fillStyle="#191423";if(document.body.classList.contains("dark"))x.fillStyle="#f2edff";
x.fillText(v.outbound,bx+bw/2,by-5);}
x.fillStyle="#7a7387";x.fillText(v.day,bx+bw/2,166);
if(v.delivered){const dy=150-Math.max(2,v.delivered/M*120);x.fillStyle="#38bdf8";
x.beginPath();x.arc(bx+bw/2,dy,3.5,0,7);x.fill();}});}
function applyStats(s){$("bal").textContent=s.balance;if($("balSide"))$("balSide").textContent=s.balance;if($("bal2"))$("bal2").textContent=s.balance;
$("kContacts").textContent=s.contacts;$("kSent").textContent=s.outbound;$("kDel").textContent=s.delivered;
$("kFail").textContent=s.failed;$("kPend").textContent=s.pending;$("kIn").textContent=s.inbound;
if($("kBlk"))$("kBlk").textContent=s.blacklist;
const rate=s.outbound?Math.round(s.delivered/s.outbound*100):0;$("heroDel").textContent=rate+"%";
if($("meterFill"))$("meterFill").style.width=Math.min(100,s.balance/5)+"%";$("inboxN").textContent=s.inbound?("· "+s.inbound):"";
donut([s.delivered,s.failed,s.pending,s.inbound]);
$("legend").textContent=`${s.delivered} delivered · ${s.failed} failed · ${s.pending} queued`;}
function row(m){const peer=m.direction==="outbound"?m.to_phone:m.from_phone;
return `<tr><td>${m.direction==="outbound"?"↗ out":"↙ in"}</td><td>${peer}${m.error?`<br><small style="color:#b4234a">${m.error}</small>`:""}</td><td>${(m.body||"").slice(0,80)}</td><td><span class="st ${m.status}">${m.status}</span></td></tr>`;}
function fitCanvas(c,w,h){const d=Math.min(2,window.devicePixelRatio||1);c.style.width="100%";c.style.maxWidth=w+"px";
if(c.width!==w*d){c.width=w*d;c.height=h*d;}const x=c.getContext("2d");x.setTransform(d,0,0,d,0,0);return x;}
function donut(v){const c=$("donut");if(!c)return;const x=fitCanvas(c,150,150),T=v.reduce((a,b)=>a+b,0)||1;let a=-Math.PI/2;
const cols=["#38bdf8","#ff5b8d","#f5c518","#5aa5ff"];x.clearRect(0,0,150,150);
v.forEach((n,i)=>{const s=n/T*Math.PI*2;x.beginPath();x.moveTo(75,75);x.arc(75,75,68,a,a+s);x.fillStyle=cols[i];x.fill();a+=s;});
x.globalCompositeOperation="destination-out";x.beginPath();x.arc(75,75,38,0,7);x.fill();x.globalCompositeOperation="source-over";}
function bars(el,vals){const c=$(el);if(!c)return;const x=fitCanvas(c,300,170);x.clearRect(0,0,300,170);const M=Math.max(...vals,1);
vals.forEach((v,i)=>{const hh=v/M*130;x.fillStyle=["#1e6ff5","#38bdf8","#ff5b8d","#5aa5ff"][i%4];x.beginPath();x.roundRect(14+i*68,155-hh,44,hh,8);x.fill();});}

sBody.oninput=()=>{const n=sBody.value.length;$("sCount").textContent=`${n} / 1600 · ${Math.max(1,Math.ceil(n/160))} seg`;};
bTo.oninput=()=>{$("bCount").textContent=bTo.value.split("\n").map(s=>s.trim()).filter(Boolean).length+" recipients";};
bFile.onchange=async e=>{const t=await e.target.files[0].text();bTo.value=t.split(/[\n,;]+/).map(s=>s.trim()).filter(Boolean).join("\n");bTo.oninput();};
async function sendSingle(){const to=sTo.value,body=sBody.value;if(!to.trim()||!body.trim())return toast("Add recipient + message","err");
// optimistic: paint instantly
$("recent").insertAdjacentHTML("afterbegin",row({direction:"outbound",to_phone:to,body,status:"queued"}));
try{const j=await api("POST","/api/send",{to,body,sender:sSender.value||"NOVA"});
sOut.classList.remove("hide");sOut.textContent="→ "+j.to_phone+" · "+j.status;toast("Queued · "+j.status,"ok");sBody.value="";}catch(e){toast(e.message,"err");}refresh();}
async function sendBulk(){const to=bTo.value.split("\n").map(s=>s.trim()).filter(Boolean);if(!to.length)return toast("No recipients","err");
try{const j=await api("POST","/api/bulk",{to,body:bBody.value,sender:bSender.value||"NOVA"});
bOut.classList.remove("hide");bOut.textContent=`bulk ${j.bulk_id} · ${j.accepted}/${j.total} accepted`;toast(`Launched ${j.accepted}/${j.total}`,"ok");}catch(e){toast(e.message,"err");}refresh();}
async function simReply(){try{await api("POST","/api/inbound",{from:qFrom.value||sTo.value||"+233244000001",body:qBody.value||"Thanks!"});toast("Inbound injected","ok");}catch(e){toast(e.message,"err");}refresh();}
function schedToggle(w){const on=$(w==="s"?"sSched":"bSched").checked;
$(w==="s"?"sWhen":"bWhen").classList.toggle("hide",!on);
if(w==="s")$("sGoBtn").textContent=on?"Schedule ➤":"Send ➤";
else $("bGoBtn").textContent=on?"Schedule ▸":"Launch ▸";}
function doSingle(){if($("sSched").checked){scheduleSingle();return;}sendSingle();}
function doBulk(){if($("bSched").checked){scheduleBulk();return;}sendBulk();}
function fmtWhen(v){if(!v)return "";const d=new Date(v);if(isNaN(d))return v.trim();
return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");}
async function scheduleSingle(){const when=fmtWhen(sWhen.value);if(!when)return toast("Pick a date + time first","err");
if(!sTo.value.trim()||!sBody.value.trim())return toast("Add recipient + message","err");
try{await api("POST","/api/scheduled",{to:[sTo.value.trim()],body:sBody.value,sender:sSender.value||"NOVA",send_at:when});
sWhen.value="";$("sSched").checked=false;schedToggle("s");toast("Single scheduled for "+when,"ok");}catch(e){toast(e.message,"err");}}
async function scheduleBulk(){const when=fmtWhen(bWhen.value);if(!when)return toast("Pick a date + time first","err");
const to=bTo.value.split("\n").map(s=>s.trim()).filter(Boolean);
if(!to.length||!bBody.value.trim())return toast("Add recipients + message","err");
try{await api("POST","/api/scheduled",{to,body:bBody.value,sender:bSender.value||"NOVA",send_at:when});
bWhen.value="";$("bSched").checked=false;schedToggle("b");toast(`Bulk scheduled for ${when} (${to.length})`,"ok");}catch(e){toast(e.message,"err");}}
async function loadSched2(){try{const r=await api("GET","/api/scheduled");
paint($("schedRows"),r,s=>`<tr><td>${(s.to_phones||"").slice(0,44)}</td><td>${s.send_at}</td><td><span class="st ${s.status}">${s.status}</span></td><td><button type="button" class="link" onclick="delSched2(${s.id})">cancel</button></td></tr>`);}catch(e){toast(e.message,"err");}}
async function delSched2(id){try{await api("DELETE","/api/scheduled/"+id);loadSched2();toast("Cancelled","ok");}catch(e){toast(e.message,"err");}}
async function fillFromGroup(){const c=await api("GET","/api/contacts");bTo.value=c.slice(0,60).map(x=>x.phone).join("\n");bTo.oninput();}

const loadContacts=debounce(_loadContacts,250);
function initials(n){return (n||"?").trim().split(/\s+/).map(s=>s[0]).join("").slice(0,2).toUpperCase();}
function skelList(el,n=4){if(el)el.innerHTML=Array(n).fill('<div class="contact-row"><div class="sk avatar-sk"></div><div style="flex:1"><div class="sk">&nbsp;</div></div></div>').join("");}
async function _loadContacts(){skelList($("cRows"));const q=cQ.value,g=cG.value;
const [cs,gs]=await Promise.all([api("GET",`/api/contacts?q=${encodeURIComponent(q)}&group=${encodeURIComponent(g)}`),api("GET","/api/groups")]);
$("ctTotal").textContent=cs.length;$("ctGroups").textContent=gs.length;
cG.innerHTML=`<option value="">All groups</option>`+gs.map(x=>`<option ${g===x.name?"selected":""}>${x.name}</option>`).join("");
groups.innerHTML=`<div class="grp-item ${!g?"on":""}" onclick="cG.value='';_loadContacts()"><span class="grp-dot"></span><b>All contacts</b></div>`+
gs.map(x=>`<div class="grp-item ${g===x.name?"on":""}" onclick="cG.value='${x.name.replace(/'/g,"")}';_loadContacts()"><span class="grp-dot"></span><b>${x.name}</b><span class="count">${x.count}</span>${x.name!=="General"?`<button class="x" title="delete group" onclick="event.stopPropagation();delGroup(${x.id},'${x.name.replace(/'/g,"")}')">×</button>`:""}</div>`).join("");
$("nGroup").innerHTML=gs.map(x=>`<option ${x.name==="General"?"selected":""}>${x.name}</option>`).join("");
$("impGroup").innerHTML=gs.map(x=>`<option>${x.name}</option>`).join("");
if(!cs.length){$("cRows").innerHTML=`<div class="empty"><b>No contacts yet</b><p class="mut">Create a group, then add your first person — or import Excel below.</p><button class="btn primary sm" onclick="openContact()">+ New contact</button></div>`;return;}
let i=0;const el=$("cRows");el.innerHTML="";
const step=()=>{const frag=document.createElement("div");
frag.innerHTML=cs.slice(i,i+40).map(c=>`<div class="contact-row"><div class="avatar">${initials(c.name)}</div>
<div class="cmeta"><b>${c.name}</b><small>${c.phone}</small></div>
<span class="chip">${c.group_name||"General"}</span>
<div class="cact"><button type="button" class="iconbtn sm" title="Message" onclick="msgContact('${c.phone}')">➤</button><button type="button" class="iconbtn sm danger" title="Delete contact" aria-label="Delete ${c.name}" onclick="delContact(${c.id})">${TRASH}</button></div></div>`).join("");
[...frag.children].forEach(n=>el.appendChild(n));i+=40;if(i<cs.length)requestAnimationFrame(step);};requestAnimationFrame(step);}
const TRASH=`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
function msgContact(phone){sTo.value=phone;go("sending","single");toast("Composing → "+phone,"ok");}
async function addGroup(){const v=gName.value.trim();if(!v)return toast("Type a group name","err");
try{await api("POST","/api/groups",{name:v});gName.value="";_loadContacts();toast("Group created — now add contacts to it","ok");}catch(e){toast(e.message,"err");}}
async function delGroup(id,name){if(!confirm(`Delete group '${name}'?`))return;
try{await api("DELETE","/api/groups/"+id);_loadContacts();toast("Group deleted","ok");}catch(e){toast(e.message,"err");}}
async function importContacts(){const f=impFile.files[0];if(!f)return toast("Choose a .csv or .xlsx file","err");
const fd=new FormData();fd.append("file",f);fd.append("group_name",impGroup.value||"General");
pStart();try{const r=await fetch("/api/contacts/import",{method:"POST",headers:token()?{Authorization:"Bearer "+token()}:{},body:fd});
const j=await r.json();if(!r.ok)throw new Error(j.detail||"Import failed");
impOut.classList.remove("hide");impOut.textContent=`${j.imported} imported → ${j.group} · ${j.skipped} skipped${j.errors&&j.errors.length?"\n"+j.errors.join("\n"):""}`;
toast(`${j.imported} imported`,"ok");_loadContacts();refresh();}catch(e){toast(e.message,"err");}finally{pDone();}}
async function delContact(id){await api("DELETE","/api/contacts/"+id);_loadContacts();refresh();}
function openContact(){$("contactM").classList.remove("hide");}function closeContact(){$("contactM").classList.add("hide");}
async function saveContact(){try{await api("POST","/api/contacts",{name:nName.value,phone:nPhone.value,group_name:nGroup.value});closeContact();nName.value=nPhone.value="";_loadContacts();refresh();toast("Saved","ok");}catch(e){toast(e.message,"err");}}

const loadMsgs=debounce(_loadMsgs,250);
async function _loadMsgs(){skel($("mRows"),5);
const r=await api("GET",`/api/messages?search=${encodeURIComponent(mQ.value)}&direction=${mD.value}&status=${mS.value}&limit=60`);
paint($("mRows"),r,m=>`<tr><td>${m.id}</td><td>${m.direction}</td><td>${m.from_phone} → ${m.to_phone}${m.error?`<br><small style="color:#b4234a">${m.error}</small>`:""}</td><td>${(m.body||"").slice(0,90)}</td><td><span class="st ${m.status}">${m.status}</span></td><td>${(m.updated_at||"").slice(0,16)}</td></tr>`);}

async function loadBlack(){const r=await api("GET","/api/blacklist");paint($("blRows"),r,b=>`<tr><td>${b.phone}</td><td>${b.reason||""}</td><td><button class="link" onclick="delBlack(${b.id})">unblock</button></td></tr>`);}
async function addBlack(){try{await api("POST","/api/blacklist",{phone:blPhone.value,reason:blWhy.value});blPhone.value=blWhy.value="";loadBlack();refresh();toast("Blocked","ok");}catch(e){toast(e.message,"err");}}
async function delBlack(id){await api("DELETE","/api/blacklist/"+id);loadBlack();refresh();}

async function loadThreads(){const c=cache.get("threads");if(c){THREADS=c;renderThreads();}
THREADS=await api("GET","/api/conversations");cache.set("threads",THREADS);renderThreads();if(THREADS[0]&&!THREAD)openThread(THREADS[0].peer);}
function renderThreads(){const q=(chQ.value||"").toLowerCase();
$("threads").innerHTML=THREADS.filter(t=>!q||t.peer.includes(q)||(t.name||"").toLowerCase().includes(q))
.map(t=>`<div class="thread ${t.peer===THREAD?"on":""}" onclick="openThread('${t.peer}')"><b>${t.name||t.peer}</b><small>${t.preview||""}</small></div>`).join("")||"<small>no threads</small>";}
async function openThread(p){THREAD=p;renderThreads();if(window.innerWidth<=700)document.body.classList.add("thread-open");$("bubbles").innerHTML='<div class="sk">&nbsp;</div><div class="sk">&nbsp;</div>';
const m=await api("GET","/api/conversations/"+encodeURIComponent(p));
const c=THREADS.find(t=>t.peer===p);chPeer.textContent=p;chName.textContent=c&&c.name?" · "+c.name:"";
bubbles.innerHTML=m.map(x=>`<div class="bub ${x.direction==="outbound"?"out":"in"}">${x.body}<small>${x.status} · ${(x.created_at||"").slice(5,16)}</small></div>`).join("");
bubbles.scrollTop=1e6;}
async function replyThread(){if(!THREAD)return toast("Pick a thread","err");if(!chBody.value.trim())return;
const body=chBody.value;bubbles.insertAdjacentHTML("beforeend",`<div class="bub out">${body}<small>sending…</small></div>`);bubbles.scrollTop=1e6;chBody.value="";
await api("POST","/api/send",{to:THREAD,body,sender:(typeof sSender!=="undefined"&&sSender.value)||"NOVA"});setTimeout(()=>openThread(THREAD),900);refresh();}
chBody.addEventListener("keydown",e=>{if(e.key==="Enter")replyThread();},{passive:true});

async function loadReports(){const s=await api("GET","/api/stats");bars("bar",[s.outbound,s.delivered,s.failed,s.inbound]);
repTotals.innerHTML=`<div><span>Outbound</span><b>${s.outbound}</b></div><div><span>Delivered</span><b>${s.delivered}</b></div><div><span>Failed</span><b>${s.failed}</b></div><div><span>Inbox</span><b>${s.inbound}</b></div>`;
const r=await api("GET","/api/messages?limit=15");feed.innerHTML=r.map(m=>`<div><b>${m.direction}</b> ${(m.body||"").slice(0,60)} <span class="st ${m.status}">${m.status}</span></div>`).join("");}

async function loadKeys(){const r=await api("GET","/api/keys");paint($("kRows"),r,k=>`<tr><td>${k.name}</td><td><small>${k.key}</small></td><td><button class="link" onclick="delKey(${k.id})">revoke</button></td></tr>`);}
async function newKey(){await api("POST","/api/keys",{name:kName.value||"default"});kName.value="";loadKeys();}
async function delKey(id){await api("DELETE","/api/keys/"+id);loadKeys();}
async function loadTickets(){const r=await api("GET","/api/tickets");paint($("tRows"),r,t=>`<tr><td>${t.id}</td><td>${t.subject}</td><td><span class="st sent">${t.status}</span></td></tr>`);}
async function newTicket(){try{await api("POST","/api/tickets",{subject:tSub.value,message:tMsg.value});tSub.value=tMsg.value="";loadTickets();toast("Ticket opened","ok");}catch(e){toast(e.message,"err");}}

function openTopup(){$("topupM").classList.remove("hide");}function closeTopup(){$("topupM").classList.add("hide");}
async function topup(a){const j=await api("POST","/api/topup",{amount:a});closeTopup();refresh();toast("Balance "+j.balance,"ok");}
async function topupCustom(){topup(Number(topAmt.value)||100);}
$("bellBtn").onclick=()=>toast("All caught up ✓");
// senders + templates + users
async function loadSendersMeta(){try{const s=await api("GET","/api/senders");
const ok=s.filter(x=>x.status==="approved").map(x=>x.value);
for(const id of ["sSender","bSender"]){const el=$(id);if(!el||el.tagName!=="SELECT")continue;
const keep=el.value;
el.innerHTML=(ok.length?ok.map(v=>`<option ${v===keep?"selected":""}>${v}</option>`).join(""):`<option value="">No approved sender — request one</option>`);
if(el._ddSync)el._ddSync();}
if(ok.length){if(!sSender.value)sSender.value=ok[0];if(!bSender.value)bSender.value=ok[0];}}catch{}}
async function loadSenders(){const r=await api("GET","/api/senders");
const admin=ME&&(ME.role==="admin"||ME.role==="super_admin");
paint($("sdRows"),r,s=>`<tr><td><b>${s.value}</b></td><td>${s.owner||"—"}</td><td><span class="st ${s.status==="approved"?"delivered":s.status==="rejected"?"failed":"pending"}">${s.status}</span></td><td style="white-space:nowrap">${admin?(s.status==="pending"?`<button class="link" onclick="approveSender(${s.id})">approve</button><button class="link" onclick="rejectSender(${s.id})">reject</button>`:`<button class="link" onclick="delSender(${s.id})">del</button>`):(s.status!=="approved"?`<small class="mut">awaiting admin</small>`:"")}</td></tr>`);}
async function addSender(){try{await api("POST","/api/senders",{value:sdName.value});sdName.value="";loadSenders();toast("Requested — an admin must approve","ok");}catch(e){toast(e.message,"err");}}
async function approveSender(id,fromDash){try{await api("POST",`/api/senders/${id}/approve`);toast("Approved","ok");}catch(e){return toast(e.message,"err");}
if(fromDash){loadAdminDash();}loadSenders();}
async function rejectSender(id){try{await api("POST",`/api/senders/${id}/reject`);toast("Rejected","ok");}catch(e){return toast(e.message,"err");}loadSenders();loadAdminDash();}
async function delSender(id){try{await api("DELETE","/api/senders/"+id);loadSenders();}catch(e){toast(e.message,"err");}}
async function loadTemplates(){const r=await api("GET","/api/templates");
paint($("tpRows"),r,t=>`<tr><td><b>${t.name}</b></td><td>${(t.body||"").slice(0,80)}</td><td style="white-space:nowrap"><button class="link" onclick="useTemplate(${t.id})">use</button><button class="link" onclick="delTemplate(${t.id})">del</button></td></tr>`);}
async function addTemplate(){try{await api("POST","/api/templates",{name:tpName.value,body:tpBody.value});tpName.value=tpBody.value="";loadTemplates();toast("Saved","ok");}catch(e){toast(e.message,"err");}}
async function delTemplate(id){await api("DELETE","/api/templates/"+id);loadTemplates();}
async function useTemplate(id){const r=await api("GET","/api/templates");const t=r.find(x=>x.id===id);if(t){sBody.value=t.body;bBody.value=t.body;go("sending","single");toast("Template loaded","ok");}}
let USERS=[];
async function loadUsers(){if(!ME||(ME.role!=="admin"&&ME.role!=="super_admin")){toast("Admin only","err");return go("dashboard");}
USERS=await api("GET","/api/admin/users");renderUsers();}
function renderUsers(){const q=(uQ.value||"").toLowerCase();
const admin=ME&&ME.role==="admin", super_=ME&&ME.role==="super_admin";
paint($("uRows"),USERS.filter(u=>!q||u.name.toLowerCase().includes(q)||u.email.includes(q)),
u=>`<tr><td>${u.name}<br><small class="mut">${u.email}</small></td>
<td>${super_?`<select onchange="setRole(${u.id},this.value)" aria-label="role">${["customer","admin","super_admin"].map(r=>`<option ${u.role===r?"selected":""}>${r}</option>`).join("")}</select>`:`<span class="chip">${u.role}</span>`}</td>
<td>${u.balance}</td>
<td style="white-space:nowrap"><button class="link" onclick="adminTopup(${u.id})">+100</button>${super_?`<button class="link" onclick="delUser(${u.id})">del</button>`:""}</td></tr>`);}
async function adminTopup(id){const j=await api("POST",`/api/admin/users/${id}/topup`,{amount:100});USERS=USERS.map(u=>u.id===id?Object.assign(u,{balance:j.balance}):u);renderUsers();toast("Topped up → "+j.balance,"ok");}
async function setRole(id,role){try{const u=await api("PATCH",`/api/admin/users/${id}`,{role});USERS=USERS.map(x=>x.id===id?u:x);renderUsers();toast(u.name+" → "+u.role,"ok");}catch(e){toast(e.message,"err");loadUsers();}}
async function delUser(id){const u=USERS.find(x=>x.id===id);if(!confirm(`Delete ${u?u.name:"user"} permanently?`))return;
try{await api("DELETE","/api/admin/users/"+id);USERS=USERS.filter(x=>x.id!==id);renderUsers();toast("Deleted","ok");}catch(e){toast(e.message,"err");}}
// modern dropdowns: custom popover synced to native select (source of truth)
function enhanceSelect(sel){
if(!sel||sel.dataset.dd)return;sel.dataset.dd="1";
const wrap=document.createElement("div");wrap.className="dd-wrap";
sel.parentNode.insertBefore(wrap,sel);wrap.appendChild(sel);
const btn=document.createElement("button");btn.type="button";btn.className="dd-btn";
btn.innerHTML=`<span class="lbl"></span><span class="chev">▾</span>`;
const pop=document.createElement("div");pop.className="dd-pop";pop.setAttribute("role","listbox");
wrap.appendChild(btn);wrap.appendChild(pop);
const close=()=>wrap.classList.remove("open");
btn.onclick=e=>{e.stopPropagation();
const was=wrap.classList.contains("open");
document.querySelectorAll(".dd-wrap.open").forEach(w=>w.classList.remove("open"));
if(!was){wrap.classList.add("open");const on=pop.querySelector(".dd-item.on");if(on)on.focus();}};
document.addEventListener("click",e=>{if(!wrap.contains(e.target))close();});
btn.onkeydown=e=>{if(e.key==="ArrowDown"||e.key==="Enter"||e.key===" "){e.preventDefault();btn.click();}
if(e.key==="Escape")close();};
pop.onkeydown=e=>{const items=[...pop.querySelectorAll(".dd-item")];const i=items.indexOf(document.activeElement);
if(e.key==="ArrowDown"){e.preventDefault();(items[i+1]||items[0]).focus();}
if(e.key==="ArrowUp"){e.preventDefault();(items[i-1]||items[items.length-1]).focus();}
if(e.key==="Escape"){close();btn.focus();}};
function sync(){const opts=[...sel.options];
btn.querySelector(".lbl").textContent=sel.selectedIndex>=0?opts[sel.selectedIndex].text:"—";
pop.innerHTML=opts.map((o,i)=>`<button type="button" role="option" aria-selected="${i===sel.selectedIndex}" class="dd-item ${i===sel.selectedIndex?"on":""}" data-i="${i}"><span>${o.text}</span>${o.dataset.count?`<span class="cnt">${o.dataset.count}</span>`:""}<span class="tick">✓</span></button>`).join("")||`<div class="mut" style="padding:10px">No options</div>`;
pop.querySelectorAll(".dd-item").forEach(b=>{b.onclick=()=>{sel.selectedIndex=+b.dataset.i;
sel.dispatchEvent(new Event("change",{bubbles:true}));sync();close();};
b.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();b.click();}}});}
new MutationObserver(sync).observe(sel,{childList:true,attributes:true,subtree:true});
sync();sel._ddSync=sync;}
function enhanceAllDropdowns(){document.querySelectorAll("select").forEach(enhanceSelect);}
// sidebar tooltips for collapsed mode
document.querySelectorAll(".rail nav button[data-p]").forEach(b=>{
const l=b.querySelector("label");if(l)b.setAttribute("data-tip",l.textContent.trim());});
enhanceAllDropdowns();
// idle prefetch + visibility-aware poll (cheap, smooth)
const idle=window.requestIdleCallback||(f=>setTimeout(f,1200));
idle(()=>{["/api/contacts?limit=20","/api/conversations","/api/blacklist"].forEach(u=>fetch(u,{headers:token()?{Authorization:"Bearer "+token()}: {}}).catch(()=>{}));});
setInterval(()=>{if(!document.hidden&&$("p-dashboard").classList.contains("on"))refresh();},12000);
(async()=>{await loadMe();
if(!ME){localStorage.removeItem("nova:token");localStorage.removeItem("nova:user");location.href="/login";return;}
refresh();
try{const s=JSON.parse(localStorage.getItem("nova:page")||"null");
if(s&&s.p&&document.getElementById("p-"+s.p))go(s.p,s.tab||undefined);}catch{}})();
