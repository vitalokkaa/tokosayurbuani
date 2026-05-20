/* =========================================================
   script_praktek.js — Toko Sayur Bu Ani
   Fitur:
   1. Keranjang belanja (cart) dengan counter & ringkasan
   2. Toast notification saat produk ditambahkan/dihapus
   3. Validasi & submit form kontak
   4. Navbar active link saat scroll (Intersection Observer)
   5. Hamburger menu untuk mobile
   ========================================================= */

/* ── 1. DATA PRODUK ─────────────────────────────────────── */
// Ambil nama & harga dari tabel HTML secara dinamis
function getProductData(row) {
  const nama   = row.querySelector("td:nth-child(1)").textContent.trim();
  const satuan = row.querySelector("td:nth-child(2)").textContent.trim();
  const hargaTeks = row.querySelector("td:nth-child(3)").textContent.trim();
  // Ubah "Rp 3.000" → 3000
  const harga = parseInt(hargaTeks.replace(/[^\d]/g, ""), 10);
  return { nama, satuan, harga };
}

/* ── 2. STATE KERANJANG ─────────────────────────────────── */
const cart = {}; // { namaProduct: { nama, satuan, harga, qty } }

function addToCart(product) {
  if (cart[product.nama]) {
    cart[product.nama].qty += 1;
  } else {
    cart[product.nama] = { ...product, qty: 1 };
  }
  renderCart();
  showToast(`${product.nama} ditambahkan ke keranjang! 🛒`);
}

function removeFromCart(nama) {
  if (!cart[nama]) return;
  if (cart[nama].qty > 1) {
    cart[nama].qty -= 1;
  } else {
    delete cart[nama];
  }
  renderCart();
}

function clearCart() {
  Object.keys(cart).forEach((k) => delete cart[k]);
  renderCart();
  showToast("Keranjang dikosongkan.", "warning");
}

/* ── 3. RENDER KERANJANG (UI) ───────────────────────────── */
function renderCart() {
  const totalItem = Object.values(cart).reduce((s, p) => s + p.qty, 0);
  const totalHarga = Object.values(cart).reduce((s, p) => s + p.harga * p.qty, 0);

  // Badge counter di tombol keranjang
  const badge = document.getElementById("cart-badge");
  if (badge) {
    badge.textContent = totalItem;
    badge.style.display = totalItem > 0 ? "flex" : "none";
  }

  // Isi panel keranjang
  const cartBody = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  const cartEmpty = document.getElementById("cart-empty");
  const cartCheckout = document.getElementById("cart-checkout");

  if (!cartBody) return;

  cartBody.innerHTML = "";

  const items = Object.values(cart);

  if (items.length === 0) {
    if (cartEmpty) cartEmpty.style.display = "block";
    if (cartCheckout) cartCheckout.style.display = "none";
  } else {
    if (cartEmpty) cartEmpty.style.display = "none";
    if (cartCheckout) cartCheckout.style.display = "block";

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML = `
        <div class="cart-item-info">
          <span class="cart-item-nama">${item.nama}</span>
          <span class="cart-item-satuan">${item.satuan}</span>
        </div>
        <div class="cart-item-ctrl">
          <button class="cart-qty-btn" data-action="kurang" data-nama="${item.nama}">−</button>
          <span class="cart-qty">${item.qty}</span>
          <button class="cart-qty-btn" data-action="tambah" data-nama="${item.nama}">+</button>
        </div>
        <span class="cart-item-subtotal">${formatRupiah(item.harga * item.qty)}</span>
      `;
      cartBody.appendChild(row);
    });
  }

  if (cartTotal) {
    cartTotal.textContent = formatRupiah(totalHarga);
  }
}

/* ── 4. PANEL KERANJANG (DRAWER) ───────────────────────── */
function buildCartUI() {
  // Buat tombol keranjang di navbar
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  const cartBtn = document.createElement("button");
  cartBtn.id = "cart-toggle";
  cartBtn.setAttribute("aria-label", "Buka keranjang belanja");
  cartBtn.innerHTML = `
    🛒 Keranjang
    <span id="cart-badge" style="display:none">0</span>
  `;
  navbar.appendChild(cartBtn);

  // Overlay
  const overlay = document.createElement("div");
  overlay.id = "cart-overlay";
  overlay.setAttribute("aria-hidden", "true");
  document.body.appendChild(overlay);

  // Drawer panel
  const panel = document.createElement("aside");
  panel.id = "cart-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Keranjang Belanja");
  panel.innerHTML = `
    <div class="cart-header">
      <h3>🛒 Keranjang Belanja</h3>
      <button id="cart-close" aria-label="Tutup keranjang">✕</button>
    </div>
    <div id="cart-body">
      <p id="cart-empty" class="cart-empty-msg">Keranjang masih kosong.<br>Yuk tambahkan sayuran! 🌿</p>
      <div id="cart-items"></div>
    </div>
    <div id="cart-footer">
      <div class="cart-total-row">
        <span>Total</span>
        <strong id="cart-total">Rp 0</strong>
      </div>
      <div id="cart-checkout">
        <a id="cart-wa-btn" href="#" target="_blank" rel="noopener" class="tombol tombol-full">
          📲 Pesan via WhatsApp
        </a>
        <button id="cart-clear-btn" class="cart-clear-link">Kosongkan keranjang</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // Event: buka/tutup
  cartBtn.addEventListener("click", toggleCart);
  overlay.addEventListener("click", closeCart);
  document.getElementById("cart-close").addEventListener("click", closeCart);

  // Event: qty buttons (delegasi)
  document.getElementById("cart-items").addEventListener("click", (e) => {
    const btn = e.target.closest(".cart-qty-btn");
    if (!btn) return;
    const nama = btn.dataset.nama;
    if (btn.dataset.action === "tambah") {
      cart[nama].qty += 1;
      renderCart();
    } else {
      removeFromCart(nama);
    }
  });

  // Kosongkan keranjang
  document.getElementById("cart-clear-btn").addEventListener("click", clearCart);

  // WhatsApp checkout
  document.getElementById("cart-wa-btn").addEventListener("click", buildWALink);

  // Keyboard: Escape menutup panel
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCart();
  });
}

function toggleCart() {
  const panel = document.getElementById("cart-panel");
  const overlay = document.getElementById("cart-overlay");
  const isOpen = panel.classList.contains("cart-open");
  if (isOpen) closeCart();
  else openCart();
}

function openCart() {
  document.getElementById("cart-panel").classList.add("cart-open");
  document.getElementById("cart-overlay").classList.add("cart-open");
  document.getElementById("cart-toggle").setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  document.getElementById("cart-panel").classList.remove("cart-open");
  document.getElementById("cart-overlay").classList.remove("cart-open");
  document.getElementById("cart-toggle").setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

/* ── 5. WHATSAPP LINK GENERATOR ─────────────────────────── */
function buildWALink(e) {
  e.preventDefault();
  const items = Object.values(cart);
  if (items.length === 0) return;

  const baris = items
    .map((p) => `• ${p.nama} x${p.qty} (${p.satuan}) = ${formatRupiah(p.harga * p.qty)}`)
    .join("%0A");

  const total = formatRupiah(
    items.reduce((s, p) => s + p.harga * p.qty, 0)
  );

  const pesan =
    `Halo Bu Ani, saya ingin memesan:%0A%0A${baris}%0A%0A*Total: ${total}*%0A%0ATerima kasih! 🙏`;

  window.open(`https://wa.me/6281234567890?text=${pesan}`, "_blank");
}

/* ── 6. TOAST NOTIFICATION ──────────────────────────────── */
let toastTimer = null;

function showToast(pesan, tipe = "success") {
  let toast = document.getElementById("toast-notif");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notif";
    document.body.appendChild(toast);
  }

  toast.textContent = pesan;
  toast.className = `toast-show toast-${tipe}`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = "";
  }, 2800);
}

/* ── 7. FORM KONTAK — VALIDASI & SUBMIT ─────────────────── */
function initFormKontak() {
  const form = document.getElementById("form-kontak");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nama     = form.querySelector("#nama");
    const telepon  = form.querySelector("#telepon");
    const pesan    = form.querySelector("#pesan");

    let valid = true;

    // Reset error
    [nama, telepon, pesan].forEach((el) => el.classList.remove("input-error"));

    // Validasi nama
    if (nama.value.trim().length < 3) {
      setError(nama, "Nama minimal 3 karakter.");
      valid = false;
    }

    // Validasi nomor HP Indonesia
    const hpRegex = /^(\+62|62|0)8[1-9][0-9]{7,11}$/;
    if (!hpRegex.test(telepon.value.trim().replace(/[\s-]/g, ""))) {
      setError(telepon, "Nomor WhatsApp tidak valid.");
      valid = false;
    }

    // Validasi pesan
    if (pesan.value.trim().length < 10) {
      setError(pesan, "Pesan minimal 10 karakter.");
      valid = false;
    }

    if (!valid) return;

    // Simulasi kirim — tampilkan sukses
    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.textContent = "⏳ Mengirim...";
    submitBtn.disabled = true;

    setTimeout(() => {
      form.reset();
      submitBtn.textContent = "📨 Kirim Pesan";
      submitBtn.disabled = false;
      showToast("Pesan berhasil dikirim! Kami akan segera menghubungi Anda. 💚", "success");
      // Hapus semua error message yang mungkin tersisa
      form.querySelectorAll(".error-msg").forEach((el) => el.remove());
    }, 1200);
  });

  // Hapus error saat user mulai mengetik
  form.querySelectorAll("input, textarea").forEach((el) => {
    el.addEventListener("input", () => {
      el.classList.remove("input-error");
      const errMsg = el.parentElement.querySelector(".error-msg");
      if (errMsg) errMsg.remove();
    });
  });
}

function setError(input, pesan) {
  input.classList.add("input-error");
  // Hapus error lama jika ada
  const old = input.parentElement.querySelector(".error-msg");
  if (old) old.remove();
  const msg = document.createElement("span");
  msg.className = "error-msg";
  msg.textContent = pesan;
  input.parentElement.appendChild(msg);
  input.focus();
}

/* ── 8. ACTIVE NAV LINK (SCROLL SPY) ────────────────────── */
function initScrollSpy() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks  = document.querySelectorAll(".nav-links a");

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle(
              "nav-active",
              link.getAttribute("href") === `#${entry.target.id}`
            );
          });
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );

  sections.forEach((s) => observer.observe(s));
}

/* ── 9. HAMBURGER MENU (MOBILE) ─────────────────────────── */
function initHamburger() {
  const navbar   = document.querySelector(".navbar");
  const navLinks = document.querySelector(".nav-links");
  if (!navbar || !navLinks) return;

  const btn = document.createElement("button");
  btn.id = "hamburger";
  btn.setAttribute("aria-label", "Buka menu navigasi");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = `<span></span><span></span><span></span>`;

  // Sisipkan sebelum cart toggle (jika sudah ada) atau di akhir navbar
  const cartToggle = document.getElementById("cart-toggle");
  if (cartToggle) {
    navbar.insertBefore(btn, cartToggle);
  } else {
    navbar.appendChild(btn);
  }

  btn.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("nav-open");
    btn.classList.toggle("ham-open", isOpen);
    btn.setAttribute("aria-expanded", isOpen);
  });

  // Tutup menu saat link diklik
  navLinks.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      navLinks.classList.remove("nav-open");
      btn.classList.remove("ham-open");
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

/* ── 10. INJECT CSS DINAMIS ─────────────────────────────── */
// CSS untuk komponen JS (cart, toast, form error, hamburger)
// disisipkan ke <head> agar tidak mengubah file CSS asli
function injectDynamicCSS() {
  const style = document.createElement("style");
  style.textContent = `
    /* ── TOMBOL KERANJANG DI NAVBAR ── */
    #cart-toggle {
      position: relative;
      background: #16a34a;
      color: #fff;
      border: none;
      border-radius: 50px;
      padding: 8px 18px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s, transform 0.1s;
      font-family: inherit;
    }
    #cart-toggle:hover { background: #15803d; transform: translateY(-1px); }

    #cart-badge {
      background: #ef4444;
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    /* ── OVERLAY ── */
    #cart-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.35);
      z-index: 199;
      backdrop-filter: blur(2px);
    }
    #cart-overlay.cart-open { display: block; }

    /* ── DRAWER PANEL ── */
    #cart-panel {
      position: fixed;
      top: 0;
      right: -420px;
      width: min(400px, 100vw);
      height: 100%;
      background: #fff;
      z-index: 200;
      display: flex;
      flex-direction: column;
      box-shadow: -4px 0 24px rgba(0,0,0,0.15);
      transition: right 0.32s cubic-bezier(0.4,0,0.2,1);
      overflow: hidden;
    }
    #cart-panel.cart-open { right: 0; }

    .cart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
      background: #f0fdf4;
    }
    .cart-header h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: #14532d;
      margin: 0;
    }
    #cart-close {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: #6b7280;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    #cart-close:hover { background: #f3f4f6; color: #111; }

    #cart-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 24px;
    }

    .cart-empty-msg {
      text-align: center;
      color: #9ca3af;
      font-size: 0.9rem;
      margin-top: 48px;
      line-height: 1.8;
    }

    .cart-row {
      display: grid;
      grid-template-columns: 1fr auto auto;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .cart-item-info { display: flex; flex-direction: column; gap: 2px; }
    .cart-item-nama { font-size: 0.9rem; font-weight: 600; color: #1f2937; }
    .cart-item-satuan { font-size: 0.78rem; color: #9ca3af; }

    .cart-item-ctrl {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f3f4f6;
      border-radius: 50px;
      padding: 4px 8px;
    }
    .cart-qty-btn {
      background: none;
      border: none;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      color: #16a34a;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.15s;
    }
    .cart-qty-btn:hover { background: #d1fae5; }
    .cart-qty { font-size: 0.9rem; font-weight: 700; min-width: 18px; text-align: center; }

    .cart-item-subtotal { font-size: 0.88rem; font-weight: 700; color: #16a34a; white-space: nowrap; }

    #cart-footer {
      padding: 16px 24px 24px;
      border-top: 1px solid #e5e7eb;
      background: #fafafa;
    }
    .cart-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      font-size: 1rem;
      font-weight: 600;
    }
    .cart-total-row strong { color: #16a34a; font-size: 1.1rem; }

    #cart-checkout { display: none; flex-direction: column; gap: 8px; }
    #cart-wa-btn { display: block; }
    .cart-clear-link {
      background: none;
      border: none;
      color: #ef4444;
      font-size: 0.82rem;
      cursor: pointer;
      text-align: center;
      padding: 4px;
      font-family: inherit;
      text-decoration: underline;
    }
    .cart-clear-link:hover { color: #b91c1c; }

    /* ── TOAST ── */
    #toast-notif {
      position: fixed;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%) translateY(80px);
      background: #14532d;
      color: #fff;
      padding: 12px 24px;
      border-radius: 50px;
      font-size: 0.9rem;
      font-weight: 500;
      z-index: 9999;
      opacity: 0;
      transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s;
      pointer-events: none;
      white-space: nowrap;
      max-width: 90vw;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }
    #toast-notif.toast-show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    #toast-notif.toast-warning { background: #b45309; }

    /* ── FORM ERROR ── */
    .input-error {
      border-color: #ef4444 !important;
      background-color: #fef2f2 !important;
    }
    .error-msg {
      display: block;
      color: #ef4444;
      font-size: 0.8rem;
      margin-top: 4px;
      font-weight: 500;
    }

    /* ── ACTIVE NAV LINK ── */
    .nav-links a.nav-active {
      color: #16a34a;
      font-weight: 700;
      position: relative;
    }
    .nav-links a.nav-active::after {
      content: '';
      position: absolute;
      bottom: -3px;
      left: 0;
      right: 0;
      height: 2px;
      background: #16a34a;
      border-radius: 2px;
    }

    /* ── HAMBURGER MENU ── */
    #hamburger {
      display: none;
      flex-direction: column;
      justify-content: space-between;
      width: 28px;
      height: 20px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      gap: 5px;
    }
    #hamburger span {
      display: block;
      height: 2.5px;
      background: #1f2937;
      border-radius: 2px;
      transition: transform 0.25s, opacity 0.2s;
      transform-origin: center;
    }
    #hamburger.ham-open span:nth-child(1) { transform: translateY(7.5px) rotate(45deg); }
    #hamburger.ham-open span:nth-child(2) { opacity: 0; }
    #hamburger.ham-open span:nth-child(3) { transform: translateY(-7.5px) rotate(-45deg); }

    @media (max-width: 700px) {
      #hamburger { display: flex; }
      .nav-links {
        display: none;
        position: absolute;
        top: 60px;
        left: 0;
        right: 0;
        background: #fff;
        flex-direction: column;
        padding: 12px 0;
        border-bottom: 1px solid #e5e7eb;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        z-index: 99;
        gap: 0;
      }
      .nav-links.nav-open { display: flex; }
      .nav-links li { width: 100%; }
      .nav-links a {
        display: block;
        padding: 12px 24px;
        font-size: 1rem;
      }
      .nav-links a:hover { background: #f0fdf4; }
      #cart-toggle { font-size: 0.8rem; padding: 7px 12px; }
    }
  `;
  document.head.appendChild(style);
}

/* ── 11. HELPER ─────────────────────────────────────────── */
function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

/* ── 12. INIT SEMUA ─────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  injectDynamicCSS();
  buildCartUI();
  initFormKontak();
  initScrollSpy();
  initHamburger();

  // Pasang event listener pada setiap tombol "+ Tambah" di tabel
  document.querySelectorAll(".btn-tambah").forEach((btn) => {
    const row = btn.closest("tr");
    if (!row) return;
    const product = getProductData(row);
    btn.addEventListener("click", () => addToCart(product));
  });
});
