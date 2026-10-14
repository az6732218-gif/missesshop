let products=[],site={offers:[]},cart={},cat="الكل",seas="",cpPct=0;
try{cart=JSON.parse(localStorage.getItem("misses_cart2")||"{}")}catch(e){}
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const save=()=>{try{localStorage.setItem("misses_cart2",JSON.stringify(cart))}catch(e){}};
const GOVS=["القاهرة","الجيزة","الإسكندرية","الدقهلية","الشرقية","القليوبية","الغربية","المنوفية","البحيرة","كفر الشيخ","دمياط","بورسعيد","الإسماعيلية","السويس","الفيوم","بني سويف","المنيا","أسيوط","سوهاج","قنا","الأقصر","أسوان","البحر الأحمر","الوادي الجديد","مطروح","شمال سيناء","جنوب سيناء"];
$("gov").innerHTML+=GOVS.map(g=>`<option>${g}</option>`).join("");
function renderFilters(){
  const cats=["الكل",...new Set(products.map(p=>p.category))],S=[["","كل المواسم"],["summer","☀️ ركن الصيف"],["winter","❄️ ركن الشتاء"]];
  $("filters").innerHTML=`<div class="fr">${S.map(([k,t])=>`<button class="se ${k===seas?"on":""}" data-s="${k}">${t}</button>`).join("")}</div><div class="fr">${cats.map(c=>`<button class="${c===cat?"on":""}" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
  $("filters").querySelectorAll("button").forEach(b=>b.onclick=()=>{if("s" in b.dataset)seas=b.dataset.s;else cat=b.dataset.c;renderFilters();renderGrid()});
}
function renderGrid(){
  const L=products.filter(p=>(cat==="الكل"||p.category===cat)&&(!seas||p.season===seas));
  $("grid").innerHTML=L.map(p=>`
  <div class="card" data-id="${p.id}"><div class="im"><img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy"><div class="bds">${p.badge?`<span class="bd cu">${esc(p.badge)}</span>`:""}${p.discount?`<span class="bd">خصم ${p.discount}%</span>`:""}</div>${p.soldout?'<span class="bd so">نفذت الكمية</span>':""}</div>
  <div class="info">${p.season?`<small class="meta">${p.season==="summer"?"☀️ صيفي":"❄️ شتوي"}</small>`:""}<h3>${esc(p.name)}</h3><div class="price">${p.old_price?`<s>${p.old_price}</s>`:""}${p.price} ج.م</div>
  ${p.sizes.length?`<select class="sz">${p.sizes.map(s=>`<option value="${esc(s)}">مقاس ${esc(s)}</option>`).join("")}</select>`:""}
  ${p.colors.length?`<select class="cl">${p.colors.map(s=>`<option value="${esc(s)}">لون ${esc(s)}</option>`).join("")}</select>`:""}
  <button class="btn add" ${p.soldout?"disabled":""}>أضيفي للسلة</button></div></div>`).join("")||"<p class='muted empty'>قريبًا… مفيش قطع في القسم ده دلوقتي</p>";
  reveal();
}
$("grid").onclick=e=>{const b=e.target.closest(".add");if(!b||b.disabled)return;const c=b.closest(".card"),k=[c.dataset.id,c.querySelector(".sz")?.value||"",c.querySelector(".cl")?.value||""].join("|");cart[k]=(cart[k]||0)+1;save();renderCart();toggle(true)};
const prod=id=>products.find(x=>x.id==id);
function lines(){const o=[];for(const k in cart){const[id,size,color]=k.split("|"),p=prod(id);if(!p||p.soldout){delete cart[k];continue}o.push({k,p,size,color,qty:cart[k]})}return o}
const sub=()=>lines().reduce((a,l)=>a+l.p.price*l.qty,0);
const cpVal=()=>Math.round(sub()*cpPct/100);
const ship=()=>{const f=+site.shipping_fee||0,o=+site.free_shipping_over||0;return o>0&&sub()-cpVal()>=o?0:f};
function renderCart(){
  const L=lines();
  $("items").innerHTML=L.map(l=>`<div class="row ln" data-k="${esc(l.k)}"><div class="lt"><b>${esc(l.p.name)}</b><small>${l.p.price} ج.م</small>
  ${l.p.sizes.length?`<select class="esz">${l.p.sizes.map(s=>`<option value="${esc(s)}" ${s===l.size?"selected":""}>مقاس ${esc(s)}</option>`).join("")}</select>`:""}
  ${l.p.colors.length?`<select class="ecl">${l.p.colors.map(s=>`<option value="${esc(s)}" ${s===l.color?"selected":""}>لون ${esc(s)}</option>`).join("")}</select>`:""}</div>
  <span class="q"><button data-d="1">+</button> ${l.qty} <button data-d="-1">−</button> <button data-d="del" class="rm" aria-label="حذف">🗑</button></span></div>`).join("")||"<p class='muted' style='padding:20px 0'>السلة فاضية</p>";
  $("total").textContent=sub();$("count").textContent=L.reduce((a,l)=>a+l.qty,0);
}
$("items").onclick=e=>{const b=e.target.closest("button");if(!b)return;const k=b.closest(".ln").dataset.k;
  if(b.dataset.d==="del")delete cart[k];else{cart[k]+=+b.dataset.d;if(cart[k]<=0)delete cart[k]}save();renderCart()};
$("items").onchange=e=>{const s=e.target.closest("select");if(!s)return;const ln=s.closest(".ln"),k=ln.dataset.k,[id,sz,cl]=k.split("|"),
  nk=[id,ln.querySelector(".esz")?.value??sz,ln.querySelector(".ecl")?.value??cl].join("|");
  if(nk!==k){const n={};for(const x in cart){if(x===k)n[nk]=(n[nk]||0)+cart[k];else n[x]=(n[x]||0)+cart[x]}cart=n}save();renderCart()};
function toggle(o){$("cart").classList.toggle("open",o);$("ov").style.display=o?"block":"none"}
$("open").onclick=()=>toggle(true);$("close").onclick=()=>toggle(false);$("ov").onclick=()=>toggle(false);
// ---- إتمام الطلب
const pm=()=>document.querySelector("[name=payment]:checked").value;
function payUI(){const v=pm(),i=$("payInfo");i.hidden=v==="cod";$("ref").hidden=v==="cod";$("ref").required=v!=="cod";
  if(v==="vodafone")i.innerHTML=`حوّلي المبلغ على فودافون كاش رقم <b>${esc(site.vodafone)}</b> ثم اكتبي رقم العملية تحت.`;
  if(v==="instapay")i.innerHTML=`حوّلي المبلغ على إنستا باي <b>${esc(site.instapay)}</b> ثم اكتبي رقم العملية تحت.`}
function sumUI(){const s=sub(),c=cpVal(),sh=ship();$("coSum").innerHTML=`المنتجات: ${s} ج.م${c?`<br>خصم الكود: −${c} ج.م`:""}<br>الشحن: ${sh?sh+" ج.م":"مجاني"}<br>الإجمالي: ${s-c+sh} ج.م`}
document.querySelectorAll("[name=payment]").forEach(r=>r.onchange=payUI);
$("cpBtn").onclick=async()=>{const code=$("cpn").value.trim();if(!code){cpPct=0;$("cpMsg").textContent="";sumUI();return}
  const r=await fetch("/api/coupon",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code})}),d=await r.json();
  cpPct=r.ok?d.percent:0;$("cpMsg").textContent=r.ok?`تم تطبيق خصم ${d.percent}% ✓`:d.error;sumUI()};
function review(){$("rv").innerHTML=lines().map(l=>`<div>• ${esc(l.p.name)}${l.color?" - لون "+esc(l.color):""}${l.size?" - مقاس "+esc(l.size):""} - ${l.qty} قطعة</div>`).join("")}
$("coEdit").onclick=()=>{$("co").classList.remove("open");toggle(true)};
$("order").onclick=()=>{if(!lines().length){alert("السلة فاضية");return}toggle(false);$("coForm").hidden=false;$("done").hidden=true;$("err").textContent="";review();payUI();sumUI();$("co").classList.add("open")};
$("coClose").onclick=()=>$("co").classList.remove("open");
$("coForm").onsubmit=async e=>{
  e.preventDefault();$("err").textContent="";$("coSend").disabled=true;
  const f=Object.fromEntries(new FormData($("coForm")));f.coupon=cpPct?$("cpn").value.trim():"";
  f.items=lines().map(l=>({id:l.p.id,qty:l.qty,size:l.size,color:l.color}));
  try{
    const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(f)}),d=await r.json();
    if(!r.ok)throw new Error(d.error||"حصل خطأ");
    const msg=d.items.map(i=>`${i.name}${i.color?" - لون "+i.color:""}${i.size?" - مقاس "+i.size:""} - ${i.qty} قطعة`).join("\n");
    const pay=f.payment;cart={};cpPct=0;save();renderCart();$("coForm").hidden=true;$("coForm").reset();$("cpMsg").textContent="";
    $("done").hidden=false;$("done").innerHTML=`<h3 class="serif" style="font-size:1.6rem">تم استلام طلبك ♥</h3><p>رقم طلبك <b>#${d.id}</b> والإجمالي <b>${d.total} ج.م</b>.${pay!=="cod"?"<br>بعد ما تبعتي الطلب على واتساب ابعتي صورة التحويل في نفس المحادثة.":"<br>هنتواصل معاكي لتأكيد الطلب."}</p><br><a class="btn" target="_blank" href="https://wa.me/${esc(site.whatsapp.replace(/\D/g,""))}?text=${encodeURIComponent(msg)}">ابعتي الطلب على واتساب</a><p class="muted">الرسالة هتتفتح جاهزة وتقدري تعدّليها قبل ما تبعتيها.</p>`;
  }catch(x){$("err").textContent=x.message}
  $("coSend").disabled=false;
};
// ---- إعدادات الموقع
function telNum(p){const d=String(p).replace(/[^\d+]/g,"");return d.startsWith("+")?d:d.startsWith("00")?"+"+d.slice(2):d.startsWith("0")?"+20"+d.slice(1):d}
function toast(html){let t=$("toast");if(!t){t=document.createElement("div");t.id="toast";t.className="toast";document.body.appendChild(t)}t.innerHTML=html;t.classList.add("on");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("on"),7000)}
document.addEventListener("click",e=>{const a=e.target.closest("a.call");if(!a)return;const n=a.querySelector("span").textContent,w=setTimeout(()=>toast(`لو الاتصال ما فتحش، الرقم: <b style="direction:ltr;display:inline-block">${esc(n)}</b>`),1500),c=()=>clearTimeout(w);addEventListener("blur",c,{once:true});document.addEventListener("visibilitychange",c,{once:true})});
function applySite(s){
  const rt=document.documentElement.style;
  [["accent","--accent"],["soft","--soft"],["bg","--bg"],["text","--text"],["band","--band"]].forEach(([k,v])=>rt.setProperty(v,s[k]));
  rt.setProperty("--ov",(+s.hero_overlay||0)/100);document.title=s.brand_name;
  const T=(id,v)=>$(id).textContent=v;
  T("hTag",s.hero_tag);T("hBtn",s.hero_button);T("sTitle",s.shop_title);T("sSub",s.shop_sub);T("aTitle",s.about_title);T("aText",s.about_text);T("fTitle",s.footer_title);T("fText",s.footer_text);
  document.querySelectorAll(".logoImg").forEach(i=>i.src=s.logo);
  const h=document.querySelector(".hero"),v=$("hv");h.classList.toggle("wh",s.hero_logo_white==="1");
  if(s.hero_video){if(!v.src.endsWith(s.hero_video))v.src=s.hero_video;s.hero_poster?v.poster=s.hero_poster:v.removeAttribute("poster");h.classList.remove("nov")}else{h.classList.add("nov");v.removeAttribute("src");v.load()}
  $("ann").textContent=s.announcement;$("ann").hidden=!s.announcement;
  $("offers").innerHTML=s.offers.length?s.offers.map(o=>`<span>🎁 ${esc(o.title)} — خصم ${o.percent}%${o.category?" على "+esc(o.category):""}</span>`).join(""):(s.no_offer_text?`<span class="no">${esc(s.no_offer_text)}</span>`:"");$("offers").hidden=!$("offers").innerHTML;
  const ig=s.instagram.replace(/^@/,""),fb=s.facebook_url||"https://www.facebook.com/search/top?q="+encodeURIComponent(s.facebook_name);
  $("contactBox").innerHTML=`<a href="https://wa.me/${esc(s.whatsapp.replace(/\D/g,""))}" target="_blank"><b>💬 واتساب</b><span>${esc(s.whatsapp)}</span></a><a class="call" href="tel:${esc(telNum(s.phone))}"><b>📞 تليفون</b><span>${esc(s.phone)}</span></a><a href="https://www.instagram.com/${encodeURIComponent(ig)}" target="_blank"><b>📸 انستجرام</b><span>${esc(ig)}</span></a><a href="${esc(fb)}" target="_blank"><b>👍 فيسبوك</b><span>${esc(s.facebook_name)}</span></a>`;
  T("snBadge",s.since_badge);T("snTitle",s.since_title);T("snText",s.since_text);[1,2,3].forEach(n=>{T("v"+n+"T",s["v"+n+"_title"]);T("v"+n+"S",s["v"+n+"_text"])});
  T("cTitle",s.contact_title);T("cSub",s.contact_sub);
  $("since").hidden=s.show_since==="0";$("seasons").hidden=s.show_seasons==="0";$("about").hidden=s.show_about==="0";
  ["cod","vodafone","instapay"].forEach(k=>document.querySelector(`.pays label[data-p="${k}"]`).hidden=s["pay_"+k+"_on"]==="0");
  const cur=document.querySelector("[name=payment]:checked");if(!cur||cur.closest("label").hidden){const f=[...document.querySelectorAll(".pays label")].find(l=>!l.hidden);if(f)f.querySelector("input").checked=true}
  $("payNote").textContent=s.pay_note;$("payNote").hidden=!s.pay_note;
  T("seTitle",s.seasons_title);T("seSub",s.seasons_sub);
  [["summer","sum"],["winter","win"]].forEach(([k,i])=>{T(i+"T",s[k+"_title"]);T(i+"S",s[k+"_sub"]);const im=$(i+"I");if(s[k+"_image"]){im.src=s[k+"_image"];im.hidden=false}else im.hidden=true;T(i+"C",products.filter(p=>p.season===k).length+" قطعة")});
  if(matchMedia("(prefers-reduced-motion:reduce)").matches){v.removeAttribute("autoplay");v.pause()}else{const p=v.play();if(p)p.catch(()=>{})}
}
(async()=>{
  try{[products,site]=await Promise.all([fetch("/api/products").then(r=>r.json()),fetch("/api/site").then(r=>r.json())]);applySite(site)}catch(e){$("grid").textContent="تعذر تحميل المنتجات"}
  renderFilters();renderGrid();renderCart();
})();

document.querySelectorAll(".sc").forEach(a=>a.onclick=()=>{seas=a.dataset.s;cat="الكل";renderFilters();renderGrid()});
const io="IntersectionObserver" in window&&!matchMedia("(prefers-reduced-motion:reduce)").matches?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.08}):null;
function reveal(){document.querySelectorAll(".sc,.card,.about>*,.contact a,section>h2,section>.sub,.val,.sbadge,.sntext").forEach(el=>{if(el.classList.contains("rv"))return;el.classList.add("rv");io?io.observe(el):el.classList.add("in")})}
reveal();
