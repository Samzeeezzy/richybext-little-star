// LIVE REGISTRATION: replace these two values with your Supabase project details.
const SUPABASE_URL = "https://gnrnlbnzionwsbhmfsfx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_cjntSHQxdX5CTMkMn7zLxA_jDrCILai";

const configured = !SUPABASE_URL.startsWith("YOUR_") && !SUPABASE_PUBLISHABLE_KEY.startsWith("YOUR_");
const db = configured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;
const form = document.getElementById("registrationForm");
const msg = document.getElementById("formMessage");
const btn = document.getElementById("submitBtn");

document.getElementById("menuBtn").addEventListener("click",()=>{const n=document.getElementById("nav");n.style.display=n.style.display==="flex"?"none":"flex"});

function show(text,error=false){msg.textContent=text;msg.style.color=error?"#b42318":"#2f7d32"}

form.addEventListener("submit", async e=>{
 e.preventDefault();
 if(!configured){show("Connect Supabase first: add your Project URL and Publishable Key in script.js.",true);return}
 const photo=document.getElementById("photo").files[0];
 if(!photo){show("Please select a photo.",true);return}
 if(!["image/jpeg","image/png","image/webp"].includes(photo.type)){show("Photo must be JPG, PNG or WEBP.",true);return}
 if(photo.size>5*1024*1024){show("Photo must be 5MB or smaller.",true);return}
 if(!form.consent.checked){show("Parent/guardian consent is required.",true);return}
 const d=Object.fromEntries(new FormData(form).entries());
 btn.disabled=true;btn.textContent="Submitting...";
 try{
   const ext=photo.name.split(".").pop().toLowerCase();
   const path=`pending/${crypto.randomUUID()}-${d.child_name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.${ext}`;
   const up=await db.storage.from("contestant-photos").upload(path,photo,{contentType:photo.type,cacheControl:"3600",upsert:false});
   if(up.error) throw up.error;
   const pub=db.storage.from("contestant-photos").getPublicUrl(path).data.publicUrl;
   const ins=await db.from("registrations").insert({
     guardian_name:d.guardian_name.trim(),guardian_email:d.guardian_email.trim().toLowerCase(),
     guardian_phone:d.guardian_phone.trim(),child_name:d.child_name.trim(),
     child_age:Number(d.child_age),bio:(d.bio||"").trim(),photo_path:path,photo_url:pub,
     consent:true,status:"pending"
   });
   if(ins.error) throw ins.error;
   form.reset();show("Registration submitted successfully! The entry is now pending review.");
 }catch(err){console.error(err);show("Registration could not be submitted. Please try again.",true)}
 finally{btn.disabled=false;btn.textContent="Submit Registration"}
});

async function loadContestants(){
 if(!configured)return;
 const {data,error}=await db.from("contestants_public").select("id,contestant_number,child_name,bio,photo_url,vote_count").order("contestant_number");
 if(error){console.error(error);return}
 const grid=document.getElementById("contestantGrid");
 if(!data?.length)return;
 grid.innerHTML=data.map(c=>`<article class="card"><img src="${esc(c.photo_url)}" alt="${esc(c.child_name)}" style="width:100%;height:240px;object-fit:cover;border-radius:16px"><b>CONTESTANT #${String(c.contestant_number).padStart(3,"0")}</b><h3>${esc(c.child_name)}</h3><p>${esc(c.bio||"Richybext Little Star")}</p><strong>Votes: ${Number(c.vote_count||0)}</strong></article>`).join("");
}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
loadContestants();
