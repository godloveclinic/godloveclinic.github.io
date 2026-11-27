/* ===== 診所資料：直接修改這裡 ===== */
const CLINIC = { phone: "02-2365-1224" };
const SESSIONS = [
  { key:"am", name:"上午診", start:"10:00", end:"13:00" },
  { key:"pm", name:"下午診", start:"14:00", end:"17:00" },
  { key:"ev", name:"夜間診", start:"18:00", end:"21:00" },
];
// 星期 0=日 1=一 ... 6=六；值為看診醫師，null 代表休診
const WEEK = {
  1:{ am:"吳佳憬", pm:"吳佳憬", ev:null },
  2:{ am:null, pm:"吳佳憬", ev:"吳佳憬" },
  3:{ am:"吳佳憬", pm:"吳佳憬", ev:null },
  4:{ am:null, pm:"吳佳憬", ev:"吳佳憬" },
  5:{ am:"吳佳憬", pm:"吳佳憬", ev:null },
  6:{ am:null, pm:null, ev:null },
  0:{ am:null, pm:null, ev:null },
};
const DAYN = ["日","一","二","三","四","五","六"];

/* 台北時間 */
function taipeiNow(){
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Taipei",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false,weekday:"short"}).formatToParts(new Date()).map(x=>[x.type,x.value]));
  const wd = {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[p.weekday];
  return { y:p.year, m:p.month, d:p.day, wd, min:(+p.hour%24)*60 + +p.minute };
}
const toMin = t => { const [h,m]=t.split(":").map(Number); return h*60+m; };

function renderToday(){
  if(!document.getElementById("status")) return;
  const n = taipeiNow(), day = WEEK[n.wd];
  document.getElementById("todayDate").textContent = `${n.y}/${n.m}/${n.d}（${DAYN[n.wd]}）`;
  const ul = document.getElementById("todaySess"); ul.innerHTML = "";
  let state = null;
  SESSIONS.forEach(s=>{
    const doc = day[s.key], st = toMin(s.start), en = toMin(s.end);
    const li = document.createElement("li");
    const isNow = doc && n.min>=st && n.min<en;
    if(!doc) li.className="off"; else if(isNow) li.className="now";
    li.innerHTML = `<b>${s.name}</b><span>${s.start}–${s.end}</span><span class="doc">${doc?doc+" 醫師"+(s.note?"（"+s.note+"）":""):"休診"}</span>`;
    ul.appendChild(li);
    if(!doc) return;
    if(isNow && !state){
      const regEnd = en-30;
      state = n.min < regEnd ? ["open",`${s.name}${s.note?"（"+s.note+"）":""}看診中・掛號至 ${String(Math.floor(regEnd/60)).padStart(2,"0")}:${String(regEnd%60).padStart(2,"0")}`] : ["soon",`${s.name}已停止掛號，${s.end} 結束`];
    } else if(!state && n.min<st){
      state = ["soon",`下一診 ${s.name} ${s.start} 開始`];
    }
  });
  if(!state) state = SESSIONS.some(s=>day[s.key]) ? ["closed","今日門診已結束"] : ["closed","今日休診"];
  const box = document.getElementById("status");
  box.className = "status " + state[0];
  document.getElementById("statusText").textContent = state[1];
}

function renderTable(){
  if(!document.getElementById("schedTable")) return;
  const wd = taipeiNow().wd, order=[1,2,3,4,5,6,0];
  let h = "<thead><tr><th>診別</th>" + order.map(d=>`<th class="${d===wd?"today-col":""}">週${DAYN[d]}</th>`).join("") + "</tr></thead><tbody>";
  SESSIONS.forEach(s=>{
    h += `<tr><th>${s.name}<small>${s.start}–${s.end}${s.note?"・"+s.note:""}</small></th>` + order.map(d=>{
      const doc = WEEK[d][s.key];
      return `<td class="${doc?"":"off"} ${d===wd?"today-col":""}">${doc?doc+" 醫師":"休診"}</td>`;
    }).join("") + "</tr>";
  });
  document.getElementById("schedTable").innerHTML = h + "</tbody>";
}

/* BSRS-5 */
const QS = ["睡眠困難，譬如難以入睡、易醒或早醒","感覺緊張或不安","覺得容易苦惱或動怒","感覺憂鬱、心情低落","覺得比不上別人","有自殺的想法"];
const OPT = ["完全沒有","輕微","中等程度","厲害","非常厲害"];
function renderQuiz(){
  if(!document.getElementById("qs")) return;
  document.getElementById("qs").innerHTML = QS.map((q,i)=>`
    <fieldset class="q" style="border:0;padding:0;margin:0 0 14px">
      <p>${i+1}. ${q}${i===5?"<em>（附加題）</em>":""}</p>
      <div class="opts">${OPT.map((o,v)=>`<label><input type="radio" id="q${i}_${v}" name="q${i}" value="${v}"><span><b>${v}</b>${o}</span></label>`).join("")}</div>
    </fieldset>`).join("");
}
const quizEl = document.getElementById("quiz");
quizEl && quizEl.addEventListener("submit",e=>{
  e.preventDefault();
  const v = QS.map((_,i)=>{ const c=document.querySelector(`input[name=q${i}]:checked`); return c?+c.value:null; });
  const r = document.getElementById("result");
  r.hidden = false;
  if(v.includes(null)){ r.className="result lv1"; r.innerHTML="<b>還有題目沒有作答</b><span>請完成全部 6 題，再看結果。</span>"; return; }
  const total = v.slice(0,5).reduce((a,b)=>a+b,0), si = v[5];
  let lv, msg;
  if(total<=5){lv=0;msg="身心狀況大致良好，請繼續照顧好自己。";}
  else if(total<=9){lv=1;msg="有輕度的情緒困擾。建議找家人或朋友談談，給自己一些休息與紓壓的時間。";}
  else if(total<=14){lv=2;msg="有中度的情緒困擾。建議尋求心理諮商或身心科專業協助。";}
  else {lv=3;msg="有重度的情緒困擾。建議盡快到身心科就醫，讓專業人員協助您。";}
  let extra = "";
  if(si>=2 || lv===3){
    extra = `<p style="font-weight:700;color:var(--warn)">您不需要一個人承受這些。現在就可以撥打 24 小時安心專線 1925，或在門診時間直接到診所，我們會陪您一起面對。若有立即危險，請撥 119。</p>`;
    if(lv<2) lv=2;
  }
  r.className = "result lv"+lv;
  r.innerHTML = `<span class="score">總分 ${total} / 20</span><span>${msg}</span>${extra}`;
  r.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth",block:"nearest"});
});
quizEl && quizEl.addEventListener("reset",()=>{ const r=document.getElementById("result"); r.hidden=true; });

/* 選單、複製 */
const menuBtn = document.getElementById("menuBtn"), nav = document.getElementById("mainNav");
menuBtn.addEventListener("click",()=>{ const o = nav.classList.toggle("open"); menuBtn.setAttribute("aria-expanded",o); });
nav.addEventListener("click",e=>{ if(e.target.tagName==="A"){ nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded","false"); }});
document.querySelectorAll(".copy").forEach(b=>b.addEventListener("click",async()=>{
  const el = document.getElementById(b.dataset.copy);
  try{ await navigator.clipboard.writeText(el.textContent.trim()); b.textContent="已複製"; }
  catch{ const r=document.createRange(); r.selectNodeContents(el); const s=getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent="請手動複製"; }
  setTimeout(()=>b.textContent="複製",1600);
}));

const setText = (id,t)=>{ const e=document.getElementById(id); if(e) e.textContent=t; };
setText("phone", CLINIC.phone);
setText("heroPhone", CLINIC.phone);
renderToday(); renderTable(); renderQuiz();
setInterval(renderToday, 60000);

/* 舊網址 #about 這類連結：自動帶到對應的分頁 */
const HASH_PAGE = { about:"about.html", services:"services.html", team:"team.html", schedule:"schedule.html", first:"first.html", check:"check.html", faq:"faq.html", contact:"contact.html" };
if(document.querySelector(".hero") && HASH_PAGE[location.hash.slice(1)]) location.replace(HASH_PAGE[location.hash.slice(1)]);
