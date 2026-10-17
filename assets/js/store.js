let all=[],activeCat="";
const fmt=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
const flash=p=>p.flash_sale&&p.promo_start&&p.promo_end&&new Date(p.promo_start)<=new Date()&&new Date(p.promo_end)>new Date()&&Number(p.old_price)>0;
const statusInfo=p=>({ready:["READY","ready"],ordered:["🟡 SUDAH DIPESAN","ordered"],processing:["🔵 SEDANG DIPROSES","processing"],shipped:["🚚 SEDANG DIKIRIM","shipped"],sold:["✓ TERJUAL","sold"]}[p.product_status||"ready"]||["READY","ready"]);
function wa(p,price){return "https://wa.me/?text="+encodeURIComponent("Halo MR ALL IN, saya tertarik "+p.name+" — "+fmt(price)+". Masih tersedia?")}
function card(p){const sale=flash(p), price=Number(p.price)||0, old=sale?Number(p.old_price):0, d=sale&&old?Math.max(0,Math.round((1-price/old)*100)):0, si=statusInfo(p);
return '<article class="card"><a class="product-pic" href="#produk"><div class="shine"></div>'+(p.image_url?'<img loading="lazy" src="'+p.image_url+'" alt="'+p.name+'">':'<div class="noimg">MR<br><b>ALL IN</b></div>')+(sale?'<span class="sale">-'+d+'%</span>':'')+'<span class="stockbadge status-'+si[1]+'">'+si[0]+'</span></a><div class="cardbody"><small>'+(p.category||"Hardware")+'</small><h3>'+p.name+'</h3><div class="price">'+fmt(price)+'</div>'+(sale?'<del>'+fmt(old)+'</del>':'')+'<div class="stockline"><span>'+(Number(p.stock)>0?'● Stok tersedia':'● Stok habis')+'</span>'+(Number(p.stock)>0?'<b>'+p.stock+' unit</b>':'')+'</div><a class="buy" target="_blank" href="'+wa(p,price)+'">Pesan via WhatsApp <b>→</b></a></div></article>'}
function normalizeName(value){return String(value||"").normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ")}
function mergePublishedInventory(products,published){
  const variants=new Map();
  (published||[]).forEach(row=>{
    const key=String(row.owner_id||"")+"::"+String(row.source_key||"");
    if(!row.source_key||!row.match_key)return;
    if(!variants.has(key))variants.set(key,{...row,familyKey:normalizeName(row.match_key)});
  });
  const inventory=[...variants.values()];
  const used=new Set(), suppressed=new Set();
  const merged=[];
  (products||[]).forEach(p=>{
    const nameKey=normalizeName(p.name);
    const tokens=new Set(nameKey.split(" ").filter(Boolean));
    const candidates=inventory.filter(inv=>{
      const familyTokens=inv.familyKey.split(" ").filter(Boolean);
      return familyTokens.length>1&&familyTokens.every(token=>tokens.has(token));
    });
    if(candidates.length===1){
      const inv=candidates[0];
      used.add(String(inv.owner_id||"")+"::"+String(inv.source_key));
      merged.push({...p,price:Number(inv.price)||0,stock:Math.max(0,Number(inv.stock)||0),product_status:Number(inv.stock)>0?"ready":"sold",category:inv.category||p.categories?.name||"Hardware",image_url:p.image_url||inv.image_url||null,business_sync:true});
    }else if(candidates.length>1){
      // The published stock has distinct variants (e.g. different HDD health).
      // Hide the ambiguous legacy aggregate so variants are not double-counted.
      suppressed.add(p.id);
    }else{
      merged.push({...p,category:p.categories?.name||"Hardware"});
    }
  });
  inventory.forEach(inv=>{
    const key=String(inv.owner_id||"")+"::"+String(inv.source_key);
    if(used.has(key))return;
    merged.push({id:"business-sync-"+key,name:inv.name,price:Number(inv.price)||0,old_price:null,stock:Math.max(0,Number(inv.stock)||0),category_id:null,category:inv.category||"Hardware",image_url:inv.image_url||null,flash_sale:false,promo_start:null,promo_end:null,active:true,product_status:Number(inv.stock)>0?"ready":"sold",business_sync:true,created_at:inv.updated_at||""});
  });
  return merged;
}
async function load(){
 const {data,error}=await sb.from("products").select("*,categories(name)").eq("active",true).order("created_at",{ascending:false});
 if(error){document.querySelector("#products").innerHTML='<div class="empty">Gagal memuat produk: '+error.message+'</div>';return}
 let published=[];const syncResult=await sb.from("mrall_store_inventory").select("owner_id,source_key,match_key,name,price,stock,category,image_url,product_status,published,updated_at").eq("published",true).order("updated_at",{ascending:false});
 if(syncResult.error){console.warn("Business inventory bridge belum tersedia; katalog biasa tetap digunakan.",syncResult.error.message)}else published=syncResult.data||[];
 all=mergePublishedInventory(data||[],published);renderCats();render();
 document.querySelector("#waHero").href="https://wa.me/?text="+encodeURIComponent("Halo MR ALL IN, saya mau konsultasi hardware.");
}
function renderCats(){const cats=[...new Set(all.map(p=>p.category||"Hardware"))];document.querySelector("#catBar").innerHTML='<button class="cat active" data-c="">Semua</button>'+cats.map(c=>'<button class="cat" data-c="'+c+'">'+c+'</button>').join("");document.querySelectorAll(".cat").forEach(b=>b.onclick=()=>{activeCat=b.dataset.c;document.querySelectorAll(".cat").forEach(x=>x.classList.remove("active"));b.classList.add("active");render()});document.querySelector("#categoryCards").innerHTML=cats.map((c,i)=>'<button class="category-card" onclick="activeCat=\''+c+'\';document.querySelectorAll(\'.cat\').forEach(x=>x.classList.toggle(\'active\',x.dataset.c===\''+c+'\'));render()"><span>'+["◈","⚡","▣","◆","▤","◉","◌","◇"][i%8]+'</span><b>'+c+'</b><small>'+all.filter(p=>p.category===c).length+' produk</small></button>').join("")}
function render(){const q=document.querySelector("#search").value.toLowerCase();const arr=all.filter(p=>(!activeCat||p.category===activeCat)&&String(p.name||"").toLowerCase().includes(q));document.querySelector("#products").innerHTML=arr.length?arr.map(card).join(""):'<div class="empty">Produk tidak ditemukan.</div>';const fs=all.filter(flash);document.querySelector("#flash").innerHTML=fs.length?fs.map(card).join(""):'<div class="empty">Belum ada Flash Sale aktif.</div>';document.querySelector("#resultCount").textContent=arr.length+" produk";tick(fs)}
function tick(fs){if(!fs.length){document.querySelector("#countdown").textContent="SIAPKAN PROMO";return}const end=new Date(Math.min(...fs.map(x=>new Date(x.promo_end).getTime())));clearInterval(window._timer);window._timer=setInterval(()=>{let d=end-Date.now();if(d<=0){clearInterval(window._timer);load();return}let h=String(Math.floor(d/36e5)).padStart(2,"0"),m=String(Math.floor(d%36e5/6e4)).padStart(2,"0"),s=String(Math.floor(d%6e4/1e3)).padStart(2,"0");document.querySelector("#countdown").textContent=h+":"+m+":"+s},1000)}
document.querySelector("#search").addEventListener("input",render);load();