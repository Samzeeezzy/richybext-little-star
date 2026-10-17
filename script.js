const SUPABASE_URL = "https://gnrnlbnzionwsbhmfsfx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_cjntSHQxdX5CTMkMn7zLxA_jDrCILai";

const configured = Boolean(
  SUPABASE_URL &&
  SUPABASE_PUBLISHABLE_KEY &&
  window.supabase
);
const db = configured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;

const menuBtn = document.querySelector(".menu-btn");
const nav = document.querySelector("#mainNav");
menuBtn?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
});
document.querySelectorAll(".nav a").forEach(link => link.addEventListener("click", () => nav.classList.remove("open")));

const form = document.getElementById("registrationForm");
const msg = document.getElementById("formMessage");
const btn = document.getElementById("submitBtn");

function showMessage(text, error=false){
  if(!msg) return;
  msg.textContent = text;
  msg.style.color = error ? "#b42318" : "#2f7d32";
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if(!configured){ showMessage("Registration is not connected yet. Please contact the organisers.", true); return; }
  const photo = document.getElementById("photo")?.files?.[0];
  if(!photo){ showMessage("Please select the child's photo.", true); return; }
  if(!["image/jpeg","image/png","image/webp"].includes(photo.type)){ showMessage("Photo must be JPG, PNG or WEBP.", true); return; }
  if(photo.size > 5 * 1024 * 1024){ showMessage("Photo must be 5MB or smaller.", true); return; }
  if(!form.consent.checked){ showMessage("Parent/guardian consent is required.", true); return; }

  const d = Object.fromEntries(new FormData(form).entries());
  btn.disabled = true;
  btn.textContent = "Submitting...";
  showMessage("Sending your registration...");
  try {
    const ext = photo.name.split(".").pop().toLowerCase();
    const safeName = d.child_name.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || "child";
    const path = `pending/${crypto.randomUUID()}-${safeName}.${ext}`;
    const upload = await db.storage.from("contestant-photos").upload(path, photo, { contentType: photo.type, cacheControl: "3600", upsert: false });
    if(upload.error) throw upload.error;
    const photoUrl = db.storage.from("contestant-photos").getPublicUrl(path).data.publicUrl;
    const insert = await db.from("registrations").insert({
      guardian_name: d.guardian_name.trim(),
      guardian_email: d.guardian_email.trim().toLowerCase(),
      guardian_phone: d.guardian_phone.trim(),
      child_name: d.child_name.trim(),
      child_age: Number(d.child_age),
      bio: (d.bio || "").trim(),
      photo_path: path,
      photo_url: photoUrl,
      consent: true,
      status: "pending"
    });
    if(insert.error) throw insert.error;
    form.reset();
    showMessage("Registration submitted successfully! Your child's entry is now pending review.");
    const toast = document.getElementById("toast");
    if(toast){ toast.textContent = "Registration submitted successfully!"; toast.classList.add("show"); setTimeout(()=>toast.classList.remove("show"),4500); }
  } catch(error) {
    console.error(error);
    showMessage("Registration could not be submitted. Please try again.", true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Start Registration →";
  }
});

async function loadContestants(){
  if(!db) return;
  const grid = document.querySelector(".contestant-grid");
  if(!grid) return;
  const { data, error } = await db.from("contestants_public").select("id,contestant_number,child_name,bio,photo_url,vote_count").order("contestant_number");
  if(error){ console.error(error); return; }
  if(!data?.length) return;
  grid.innerHTML = data.map(c => `
    <article class="contestant live-contestant">
      <div class="avatar-placeholder">${c.photo_url ? `<img class="live-contestant-image" src="${esc(c.photo_url)}" alt="${esc(c.child_name)}">` : "★"}</div>
      <div class="contestant-info"><span>Contestant #${String(c.contestant_number).padStart(3,"0")}</span><h3>${esc(c.child_name)}</h3><p>${esc(c.bio || "Richybext Little Star")}</p></div>
      <button class="vote-btn" type="button">Vote</button>
    </article>`).join("");
  document.querySelectorAll(".vote-btn").forEach(button => button.addEventListener("click", () => showToast("Voting will be activated when the official voting system opens.")));
}

function showToast(text){
  const toast = document.getElementById("toast");
  if(!toast) return;
  toast.textContent = text;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"),4500);
}
function esc(value){ return String(value ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }

document.querySelectorAll(".vote-btn").forEach(button => button.addEventListener("click", () => showToast("Voting will be activated when the official voting system opens.")));
loadContestants();
