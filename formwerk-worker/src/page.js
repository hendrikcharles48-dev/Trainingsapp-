// Testseite des Workers: zeigt die rohen Garmin-Daten der letzten Tage und was Formwerk daraus liest.
// Das Passwort wird nur im Browser dieses Geräts gespeichert (localStorage) und als Bearer-Header gesendet.
export const PAGE = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex">
<meta name="theme-color" content="#090B0F"><title>Formwerk · Worker</title>
<style>
:root{--bg:#090B0F;--s:#12161D;--s2:#1A202A;--line:#232A35;--ink:#EEF2F7;--mu:#8D97A8;--ac:#8FB3D9;--navy:#14203A;--ok:#7FBF9A;--warn:#D9C27F;--bad:#D98F8F}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.45 -apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif;font-variant-numeric:tabular-nums;padding:calc(env(safe-area-inset-top) + 16px) 16px calc(env(safe-area-inset-bottom) + 32px)}
h1{font-size:34px;font-weight:900;margin:8px 0 2px;letter-spacing:-.02em}.mu{color:var(--mu)}.sm{font-size:13px}
.card{background:var(--s);border:1px solid var(--line);border-radius:22px;padding:16px;margin:12px 0}
input{width:100%;font-size:16px;padding:14px;border-radius:14px;border:1px solid var(--line);background:var(--s2);color:var(--ink)}
button{font:inherit;font-weight:700;border:0;border-radius:20px;min-height:48px;padding:0 18px;background:var(--s2);color:var(--ink);cursor:pointer}
button.p{background:var(--ac);color:#0A1220}.row{display:flex;gap:8px;flex-wrap:wrap}.row>*{flex:1}
.lbl{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mu);margin:0 0 6px}
.tw{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 -16px;padding:0 16px}
table{border-collapse:collapse;font-size:13px;white-space:nowrap}th,td{padding:7px 9px;border-bottom:1px solid var(--line);text-align:right}th:first-child,td:first-child{text-align:left;position:sticky;left:0;background:var(--s)}
th{color:var(--mu);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}.y{background:var(--ok)}.n{background:var(--bad)}
details{border-top:1px solid var(--line);padding:10px 0}summary{cursor:pointer;font-weight:600;min-height:32px;display:flex;align-items:center;gap:6px}
pre{background:var(--bg);border-radius:12px;padding:12px;font-size:11px;line-height:1.4;overflow:auto;max-height:420px;white-space:pre-wrap;word-break:break-all}
.err{color:var(--bad)}.ok{color:var(--ok)}
</style></head><body>
<div class="lbl">Formwerk · Worker</div><h1>Garmin-Test</h1>
<p class="mu sm" style="margin:0">Zeigt, welche Werte deine Uhr wirklich liefert – roh und so, wie Formwerk sie liest.</p>
<div class="card" id="login"><div class="lbl">App-Passwort</div><input id="pw" type="password" autocomplete="current-password" placeholder="Passwort aus dem Cloudflare-Secret APP_PASSWORD">
<div class="row" style="margin-top:10px"><button class="p" id="go7">7 Tage laden</button><button id="go14">14 Tage</button></div>
<div class="row" style="margin-top:8px"><button id="sum">Zusammenfassung</button><button id="ping">Verbindung</button></div></div>
<div id="out"></div>
<script>
const $=s=>document.querySelector(s), out=$('#out');
try{$('#pw').value=localStorage.getItem('formwerk_pw')||''}catch(e){}
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function call(path){const pw=$('#pw').value.trim();try{localStorage.setItem('formwerk_pw',pw)}catch(e){}
  out.innerHTML='<div class="card mu">Lade … (beim ersten Mal bis 20 s)</div>';
  const r=await fetch(path,{headers:{Authorization:'Bearer '+pw}});const t=await r.text();let j;try{j=JSON.parse(t)}catch(e){j={error:t}}
  if(!r.ok){out.innerHTML='<div class="card err">'+esc(j.message||j.error||r.status)+'</div>';return null}return j}
const h=s=>s==null?'–':(s/3600).toFixed(1).replace('.',',');
const v=x=>x==null?'<span class="mu">–</span>':esc(typeof x==='number'?Math.round(x*10)/10:x);
async function raw(days){const j=await call('/v1/raw?days='+days);if(!j)return;
  if(j.error){out.innerHTML='<div class="card err"><b>'+esc(j.error)+'</b><pre>'+esc(j.body||'')+'</pre></div>';return}
  const ds=Object.keys(j.parsed||{}).sort().reverse();
  const rows=ds.map(d=>{const x=j.parsed[d],s=x.sleep||{};return '<tr><td>'+d.slice(5)+'</td><td>'+v(x.hrv)+'</td><td>'+v(x.hrvWeek)+'</td><td>'+v(x.hrvStatus)+'</td><td>'+v(x.rhr)+'</td><td>'+h(s.total)+'</td><td>'+h(s.deep)+'</td><td>'+h(s.light)+'</td><td>'+h(s.rem)+'</td><td>'+h(s.awake)+'</td><td>'+v(s.score)+'</td><td>'+v(x.bbHigh)+'</td><td>'+v(x.bbLow)+'</td><td>'+v(x.stress)+'</td><td>'+v(x.steps)+'</td></tr>'}).join('');
  const calls=Object.entries(j.calls||{}).map(([k,c])=>'<details><summary><span class="dot '+(c.ok?'y':'n')+'"></span>'+esc(k)+(c.ok?'':' <span class="err sm">'+esc(c.status||'')+'</span>')+'</summary><div class="mu sm">'+esc(c.path)+'</div><pre>'+esc(c.ok?JSON.stringify(c.data,null,1):(c.error+'\\n'+(c.body||'')))+'</pre></details>').join('');
  const acts=(j.activities||[]).map(a=>'<tr><td>'+esc(a.date||'')+' '+esc(a.time||'')+'</td><td style="text-align:left">'+esc(a.name||a.type)+'</td><td>'+Math.round((a.dur||0)/60)+'</td><td>'+v(a.avgHr)+'</td><td>'+v(a.maxHr)+'</td><td>'+(a.zones?a.zones.map(z=>Math.round(z/60)).join('/'):'–')+'</td></tr>').join('');
  out.innerHTML='<div class="card"><div class="lbl">Was Formwerk daraus liest · '+esc(j.range.join(' bis '))+'</div><div class="tw"><table><tr><th>Tag</th><th>HRV</th><th>HRV 7T</th><th>Status</th><th>Ruhepuls</th><th>Schlaf h</th><th>Tief</th><th>Leicht</th><th>REM</th><th>Wach</th><th>Score</th><th>BB max</th><th>BB min</th><th>Stress</th><th>Schritte</th></tr>'+(rows||'<tr><td colspan="15">Keine Tageswerte erkannt</td></tr>')+'</table></div></div>'
   +'<div class="card"><div class="lbl">Aktivitäten</div><div class="tw"><table><tr><th>Start</th><th style="text-align:left">Name</th><th>Min</th><th>Ø HF</th><th>Max</th><th>Zonen 1–5 (min)</th></tr>'+(acts||'<tr><td colspan="6">Keine</td></tr>')+'</table></div></div>'
   +'<div class="card"><div class="lbl">Rohdaten von Garmin ('+esc(j.garminCalls)+' Abrufe)</div>'+calls+'</div>'}
$('#go7').onclick=()=>raw(7);$('#go14').onclick=()=>raw(14);
$('#sum').onclick=async()=>{const j=await call('/v1/summary');if(j)out.innerHTML='<div class="card"><div class="lbl">/v1/summary</div><pre>'+esc(JSON.stringify(j,null,1))+'</pre></div>'};
$('#ping').onclick=async()=>{const j=await call('/v1/ping');if(j)out.innerHTML='<div class="card"><div class="ok"><b>Verbunden.</b></div><div class="mu sm">Garmin-Schlüssel hinterlegt: '+(j.garminKey?'ja':'<span class=err>nein</span>')+'</div><pre>'+esc(JSON.stringify(j,null,1))+'</pre></div>'};
</script></body></html>`;
