const menuBtn = document.querySelector(".menu-btn");
const nav = document.querySelector("#mainNav");

menuBtn?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
});

document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => nav.classList.remove("open"));
});

function showNotice(event) {
  event.preventDefault();
  const toast = document.getElementById("toast");
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4500);
  event.target.reset();
  return false;
}

document.querySelectorAll(".vote-btn").forEach(button => {
  button.addEventListener("click", () => {
    const toast = document.getElementById("toast");
    toast.textContent = "Voting will be activated when the contest database is connected.";
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
      toast.textContent = "Registration form ready — database connection will be added next.";
    }, 4000);
  });
});
