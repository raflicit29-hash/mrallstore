
let editingId = null;
const $ = s => document.querySelector(s);

const fmtAdmin = n =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(n) || 0);

const statusLabels = {
  ready: "READY",
  ordered: "DIPESAN",
  processing: "DIPROSES",
  shipped: "DIKIRIM",
  sold: "TERJUAL"
};

async function init() {
  const { data: { session }, error } = await sb.auth.getSession();
  const box = $("#authState");

  if (error) {
    box.textContent = "Gagal memeriksa sesi login: " + error.message;
    return;
  }

  if (!session) {
    box.innerHTML = `
      <div class="loginbox">
        <p>Login admin untuk mengelola toko.</p>
        <input id="loginEmail" type="email"
          placeholder="Email admin" autocomplete="username">
        <input id="loginPassword" type="password"
          placeholder="Password" autocomplete="current-password">

        <button class="btn gold" id="passwordLoginBtn" type="button">
          Login dengan Password
        </button>

        <button class="btn dark" id="loginBtn" type="button">
          Kirim Magic Link
        </button>

        <button class="btn dark" id="resetBtn" type="button">
          Lupa Password?
        </button>

        <small id="loginMsg" role="status"></small>
      </div>`;

    $("#passwordLoginBtn").onclick = loginWithPassword;
    $("#loginBtn").onclick = login;
    $("#resetBtn").onclick = resetPassword;
    return;
  }

  if ((session.user.email || "").toLowerCase() !==
      "raflicit29@gmail.com") {
    box.innerHTML = `
      <p class="danger">Akses ditolak. Akun ini bukan admin.</p>
      <button class="btn dark" id="logoutBtn">Keluar</button>`;

    $("#logoutBtn").onclick = async () => {
      await sb.auth.signOut();
      location.reload();
    };
    return;
  }

  box.innerHTML = `
    <span class="logged">✓ Login: ${esc(session.user.email)}</span>
    <button class="btn dark smallbtn" id="logoutBtn">Keluar</button>`;

  $("#logoutBtn").onclick = async () => {
    await sb.auth.signOut();
    location.reload();
  };

  await loadCats();
  await loadProducts();
}

async function loginWithPassword() {
  const email = $("#loginEmail").value.trim().toLowerCase();
  const password = $("#loginPassword").value;
  const msg = $("#loginMsg");
  const btn = $("#passwordLoginBtn");

  if (email !== "raflicit29@gmail.com") {
    msg.textContent = "Email admin tidak sesuai.";
    return;
  }

  if (!password) {
    msg.textContent = "Masukkan password terlebih dahulu.";
    $("#loginPassword").focus();
    return;
  }

  btn.disabled = true;
  msg.textContent = "Memeriksa email dan password...";

  try {
    const { error } = await sb.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      msg.textContent = "Login gagal: " + error.message;
      return;
    }

    location.reload();
  } catch (err) {
    msg.textContent = "Terjadi kesalahan: " + err.message;
  } finally {
    btn.disabled = false;
  }
}

async function login() {
  const email = $("#loginEmail").value.trim().toLowerCase();
  const msg = $("#loginMsg");
  const btn = $("#loginBtn");

  if (email !== "raflicit29@gmail.com") {
    msg.textContent = "Email admin tidak sesuai.";
    return;
  }

  btn.disabled = true;
  msg.textContent = "Mengirim Magic Link...";

  try {
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: new URL("admin.html", location.href).href,
        shouldCreateUser: false
      }
    });

    msg.textContent = error
      ? "Gagal: " + error.message
      : "Magic Link dikirim. Periksa Inbox/Spam email.";
  } catch (err) {
    msg.textContent = "Terjadi kesalahan: " + err.message;
  } finally {
    btn.disabled = false;
  }
}

async function resetPassword() {
  const email = $("#loginEmail").value.trim().toLowerCase();
  const msg = $("#loginMsg");
  const btn = $("#resetBtn");

  if (email !== "raflicit29@gmail.com") {
    msg.textContent = "Masukkan email admin yang benar.";
    $("#loginEmail").focus();
    return;
  }

  btn.disabled = true;
  msg.textContent = "Mengirim email reset password...";

  try {
    const resetUrl =
      new URL("reset-password.html", location.href).href;

    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: resetUrl
    });

    msg.textContent = error
      ? "Gagal mengirim reset: " + error.message
      : "Email reset dikirim. Buka email terbaru, lalu klik tautannya.";
  } catch (err) {
    msg.textContent = "Terjadi kesalahan: " + err.message;
  } finally {
    btn.disabled = false;
  }
}

async function loadCats() {
  const { data, error } = await sb.from("categories")
    .select("id,name")
    .eq("active", true)
    .order("sort_order");

  if (error) {
    alert("Gagal memuat kategori: " + error.message);
    return;
  }

  $("#category").innerHTML = (data || [])
    .map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`)
    .join("");
}

async function loadProducts() {
  const { data, error } = await sb.from("products")
    .select("*,categories(name)")
    .order("created_at", { ascending: false });

  if (error) {
    $("#list").innerHTML =
      `<div class="empty">${esc(error.message)}</div>`;
    return;
  }

  const products = data || [];

  $("#pCount").textContent = products.length;
  $("#sCount").textContent =
    products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  $("#fCount").textContent =
    products.filter(p => p.flash_sale).length;

  $("#list").innerHTML = products.length
    ? products.map(p => `
      <div class="admin-item">
        <div>
          <b>${esc(p.name)}</b>
          <small>
            ${esc(p.categories?.name || "Hardware")}
            • Stok ${Number(p.stock) || 0}
            • ${fmtAdmin(p.price)}
            • <strong>${statusLabels[p.product_status || "ready"] || "READY"}</strong>
          </small>
        </div>
        <div class="admin-actions">
          <span class="mini ${p.active ? "on" : "off"}">
            ${p.active ? "AKTIF" : "NONAKTIF"}
          </span>
          <button class="btn dark smallbtn"
            onclick="editProduct('${esc(p.id)}')">Edit</button>
          <button class="btn gold smallbtn"
            onclick="deleteProduct('${esc(p.id)}')">Hapus</button>
        </div>
      </div>`).join("")
    : '<div class="empty">Belum ada produk.</div>';
}

function esc(s) {
  return String(s ?? "").replace(/[&<>'"]/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[m]);
}

function resetForm() {
  editingId = null;
  $("#formTitle").textContent = "Tambah Produk";
  $("#saveBtn").textContent = "+ Simpan Produk";
  $("#cancelBtn").style.display = "none";
  $("#form").reset();
  $("#active").checked = true;
  $("#status").value = "ready";
}

async function editProduct(id) {
  const { data, error } = await sb.from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  editingId = id;
  $("#formTitle").textContent = "Edit Produk";
  $("#saveBtn").textContent = "Simpan Perubahan";
  $("#cancelBtn").style.display = "inline-flex";

  ["name", "price", "promo", "stock", "image"].forEach(k => {
    const field = ({ promo: "old_price", image: "image_url" })[k] || k;
    $("#" + k).value = data[field] ?? "";
  });

  $("#category").value = data.category_id;
  $("#flash").checked = !!data.flash_sale;
  $("#active").checked = data.active !== false;
  $("#status").value = data.product_status || "ready";

  $("#start").value = data.promo_start
    ? new Date(data.promo_start).toISOString().slice(0, 16)
    : "";

  $("#end").value = data.promo_end
    ? new Date(data.promo_end).toISOString().slice(0, 16)
    : "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteProduct(id) {
  if (!confirm("Hapus produk ini? Data produk akan dihapus dari katalog.")) {
    return;
  }

  const { error } = await sb.from("products")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
  } else {
    if (editingId === id) resetForm();
    await loadProducts();
  }
}

$("#form").addEventListener("submit", async e => {
  e.preventDefault();

  const start = $("#start").value
    ? new Date($("#start").value).toISOString()
    : null;

  const end = $("#end").value
    ? new Date($("#end").value).toISOString()
    : null;

  const product = {
    name: $("#name").value.trim(),
    price: +$("#price").value,
    old_price: +$("#promo").value || null,
    stock: +$("#stock").value,
    category_id: $("#category").value,
    image_url: $("#image").value.trim() || null,
    flash_sale: $("#flash").checked,
    promo_start: start,
    promo_end: end,
    active: $("#active").checked,
    product_status: $("#status").value
  };

  if (product.flash_sale &&
      (!start || !end || new Date(end) <= new Date(start))) {
    alert("Tanggal Flash Sale belum benar.");
    return;
  }

  if (product.stock <= 0 && product.product_status === "ready") {
    product.product_status = "sold";
  }

  const query = editingId
    ? sb.from("products").update(product).eq("id", editingId)
    : sb.from("products").insert(product);

  const { error } = await query;

  if (error) {
    alert("Gagal menyimpan produk: " + error.message);
  } else {
    alert(editingId
      ? "Perubahan tersimpan ✓"
      : "Produk tersimpan ✓");

    resetForm();
    await loadProducts();
  }
});

$("#cancelBtn").onclick = resetForm;

init();
