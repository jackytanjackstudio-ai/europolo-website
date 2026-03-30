/* ═══════════════════════════════════════════════════
   EURO POLO ADMIN · auth.js
   Shared across all admin pages
═══════════════════════════════════════════════════ */

const EP_USERS = {
  admin:     { password:'europolo2026', role:'admin',     name:'Admin',           path:'dashboard.html' },
  marketing: { password:'mkt@polo',     role:'marketing', name:'Marketing Team',  path:'marketing.html' },
  content:   { password:'cnt@polo',     role:'content',   name:'Content Team',    path:'content.html' },
  cs:        { password:'cs@polo',      role:'cs',        name:'Customer Service',path:'customer-service.html' },
  host:      { password:'host@polo',    role:'host',      name:'Live Host',       path:'live-host.html' },
};

const ROLE_ACCESS = {
  admin:     ['dashboard.html','marketing.html','content.html','customer-service.html','live-host.html','page-editor.html'],
  marketing: ['marketing.html'],
  content:   ['content.html','page-editor.html'],
  cs:        ['customer-service.html'],
  host:      ['live-host.html'],
};

/* ── Store helper ── */
const Store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem('ep_' + key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, val) { localStorage.setItem('ep_' + key, JSON.stringify(val)); },
  push(key, item) {
    const arr = this.get(key, []);
    item.id = item.id || Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    arr.unshift(item);
    this.set(key, arr);
    return item;
  },
  remove(key, id) {
    const arr = this.get(key, []);
    this.set(key, arr.filter(i => i.id !== id));
  },
  update(key, id, changes) {
    const arr = this.get(key, []);
    const idx = arr.findIndex(i => i.id === id);
    if (idx !== -1) { arr[idx] = { ...arr[idx], ...changes }; this.set(key, arr); }
  },
  log(action) {
    this.push('activity', { action, user: Auth.user()?.username || 'system', ts: new Date().toISOString() });
  }
};

/* ── Auth helper ── */
const Auth = {
  login(username, password) {
    const u = EP_USERS[username];
    if (!u || u.password !== password) return null;
    sessionStorage.setItem('ep_user', username);
    sessionStorage.setItem('ep_role', u.role);
    return u;
  },
  logout() {
    sessionStorage.removeItem('ep_user');
    sessionStorage.removeItem('ep_role');
    window.location.href = 'index.html';
  },
  user() {
    const username = sessionStorage.getItem('ep_user');
    if (!username) return null;
    const u = EP_USERS[username];
    return u ? { ...u, username } : null;
  },
  guard() {
    const user = this.user();
    if (!user) { window.location.href = 'index.html'; return false; }
    const page = window.location.pathname.split('/').pop();
    const allowed = ROLE_ACCESS[user.role] || [];
    if (page !== 'index.html' && !allowed.includes(page)) {
      window.location.href = user.path;
      return false;
    }
    return true;
  },
};

/* ── UI Helpers ── */
const UI = {
  toast(msg, type = 'info') {
    let c = document.getElementById('toast-container');
    if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 3000);
  },
  confirm(msg) {
    return new Promise(resolve => {
      const bg = document.createElement('div');
      bg.className = 'modal-bg open';
      bg.innerHTML = `<div class="modal" style="max-width:380px"><div class="modal-header"><span class="modal-title" style="font-size:1rem">Confirm Action</span></div><div class="modal-body"><p style="font-size:0.85rem;color:var(--mid)">${msg}</p></div><div class="modal-footer"><button class="btn btn--outline" id="cfNo">Cancel</button><button class="btn btn--danger" id="cfYes">Confirm</button></div></div>`;
      document.body.appendChild(bg);
      bg.querySelector('#cfYes').onclick = () => { bg.remove(); resolve(true); };
      bg.querySelector('#cfNo').onclick  = () => { bg.remove(); resolve(false); };
    });
  },
  fillUser() {
    const u = Auth.user();
    if (!u) return;
    const nameEls = document.querySelectorAll('.sb-user-name');
    const roleEls = document.querySelectorAll('.sb-user-role');
    const avEls   = document.querySelectorAll('.sb-avatar');
    nameEls.forEach(el => el.textContent = u.name);
    roleEls.forEach(el => el.textContent = u.role.toUpperCase());
    avEls.forEach(el => el.textContent = u.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase());
  },
  initSidebar() {
    document.querySelectorAll('.sb-logout').forEach(btn => btn.addEventListener('click', () => Auth.logout()));
    const toggle = document.getElementById('sbToggle');
    const overlay = document.getElementById('sbOverlay');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => { sidebar.classList.toggle('open'); if (overlay) overlay.classList.toggle('show'); });
      if (overlay) overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); });
    }
    // active nav link
    const page = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sb-nav a').forEach(a => {
      if (a.getAttribute('href') === page || a.getAttribute('href') === './' + page) a.classList.add('active');
    });
  },
  initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.group || 'default';
        document.querySelectorAll(`.tab-btn[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
        document.querySelectorAll(`.tab-panel[data-group="${group}"]`).forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = document.getElementById(btn.dataset.target);
        if (panel) panel.classList.add('active');
      });
    });
  },
  initDrawer(openBtnSel, drawerId, closeBtnSel) {
    const drawer = document.getElementById(drawerId);
    const bg = document.getElementById(drawerId + 'Bg');
    if (!drawer) return;
    document.querySelectorAll(openBtnSel).forEach(btn => {
      btn.addEventListener('click', () => { drawer.classList.add('open'); if (bg) bg.classList.add('open'); });
    });
    document.querySelectorAll(closeBtnSel || '.drawer-close').forEach(btn => {
      btn.addEventListener('click', () => { drawer.classList.remove('open'); if (bg) bg.classList.remove('open'); });
    });
    if (bg) bg.addEventListener('click', () => { drawer.classList.remove('open'); bg.classList.remove('open'); });
  }
};

/* ── Media Upload Helper ── */
const Media = {
  // Compress image via Canvas → base64 JPEG
  compress(file, maxW = 900, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) { reject(new Error('Please select an image file (JPG, PNG, WebP)')); return; }
      if (file.size > 15 * 1024 * 1024) { reject(new Error('File too large. Max 15MB.')); return; }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = e => {
        const img = new Image();
        img.onerror = () => reject(new Error('Invalid image'));
        img.onload = () => {
          const scale = Math.min(1, maxW / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  // Save image to media library store
  saveToLibrary(dataUrl, name) {
    const lib = Store.get('media_library', []);
    const item = { id: Date.now().toString(36), name: name || 'Image', url: dataUrl, date: new Date().toISOString().slice(0,10) };
    lib.unshift(item);
    // Keep max 60 items to avoid localStorage overflow
    Store.set('media_library', lib.slice(0, 60));
    return item;
  },

  // Bind a file input → compress → preview → populate url field
  bindUploadBtn(fileInputId, previewId, urlFieldId, onDone) {
    const fileInput = document.getElementById(fileInputId);
    if (!fileInput) return;
    fileInput.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      UI.toast('Uploading…', 'info');
      try {
        const dataUrl = await Media.compress(file);
        const preview = document.getElementById(previewId);
        if (preview) { preview.src = dataUrl; preview.style.display = 'block'; }
        const urlField = document.getElementById(urlFieldId);
        if (urlField) urlField.value = dataUrl;
        Media.saveToLibrary(dataUrl, file.name);
        UI.toast('Image uploaded ✓', 'success');
        if (onDone) onDone(dataUrl);
      } catch (err) {
        UI.toast(err.message, 'error');
      }
      fileInput.value = '';
    });
    // Also sync URL field to preview
    const urlField = document.getElementById(urlFieldId);
    const preview = document.getElementById(previewId);
    if (urlField && preview) {
      urlField.addEventListener('input', () => {
        const v = urlField.value.trim();
        if (v) { preview.src = v; preview.style.display = 'block'; }
        else preview.style.display = 'none';
      });
    }
  },

  // Render upload zone HTML (call before bindUploadBtn)
  zone(fileInputId, previewId, urlFieldId, opts = {}) {
    const accept = opts.accept || 'image/*';
    const label = opts.label || 'Photo / Image';
    const hint = opts.hint || 'Click or drag & drop · JPG, PNG, WebP · max 15MB';
    return `
      <div class="form-group mb-2">
        <label class="form-label">${label}</label>
        <div class="upload-zone" id="${fileInputId}Zone" onclick="document.getElementById('${fileInputId}').click()"
          ondragover="event.preventDefault();this.classList.add('drag-over')"
          ondragleave="this.classList.remove('drag-over')"
          ondrop="event.preventDefault();this.classList.remove('drag-over');document.getElementById('${fileInputId}').files=event.dataTransfer.files;document.getElementById('${fileInputId}').dispatchEvent(new Event('change'))">
          <img id="${previewId}" style="display:none;max-height:140px;max-width:100%;border-radius:4px;margin:0 auto;display:none"/>
          <div class="upload-zone-inner" id="${fileInputId}Placeholder">
            <div style="font-size:1.6rem;margin-bottom:.35rem">📷</div>
            <div style="font-size:.82rem;font-weight:600;color:var(--text);margin-bottom:.2rem">Upload ${label}</div>
            <div style="font-size:.72rem;color:var(--muted)">${hint}</div>
          </div>
          <input type="file" id="${fileInputId}" accept="${accept}" style="display:none"/>
        </div>
        <input class="form-input mt-1" id="${urlFieldId}" placeholder="Or paste image URL (https://...)" style="font-size:.78rem"/>
      </div>`;
  },

  // Get YouTube embed URL from various YT link formats
  youtubeEmbed(url) {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : null;
  },

  // Get TikTok video ID
  tiktokId(url) {
    const m = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    return m ? m[1] : null;
  }
};

/* ── Seed demo data if empty ── */
function seedIfEmpty() {
  if (!Store.get('seeded')) {
    Store.set('campaigns', [
      {id:'c1',name:'Raya 2026 Campaign',type:'Social',start:'2026-03-01',end:'2026-04-15',status:'Active',budget:'RM 5,000',audience:'Men 25-45, MY'},
      {id:'c2',name:'New Arrivals — Bags',type:'Email',start:'2026-03-15',end:'2026-04-01',status:'Active',budget:'RM 800',audience:'Newsletter List'},
      {id:'c3',name:'Luggage Launch',type:'Social',start:'2026-05-01',end:'2026-05-31',status:'Scheduled',budget:'RM 3,000',audience:'IG + FB'},
    ]);
    Store.set('promos', [
      {id:'p1',code:'RAYA2026',type:'Percent',value:'10',min:'200',expiry:'2026-04-15',uses:12,active:true},
      {id:'p2',code:'WELCOME15',type:'Percent',value:'15',min:'150',expiry:'2026-12-31',uses:5,active:true},
      {id:'p3',code:'LUGGAGE50',type:'Flat',value:'50',min:'800',expiry:'2026-06-30',uses:3,active:true},
    ]);
    Store.set('enquiries', [
      {id:'e1',name:'Ahmad Faris',email:'faris@email.com',phone:'012-3456789',interest:'Milano Briefcase',message:'Hi, I would like to know if the Milano Briefcase is available in dark brown. Also what is the warranty?',date:'2026-03-29',status:'Unread',reply:'',notes:''},
      {id:'e2',name:'Daniel Lim',email:'daniel@email.com',phone:'016-7654321',interest:'Luggage Set',message:'Interested in the Euro Journey Set. Do you have showroom in KL I can visit?',date:'2026-03-28',status:'Replied',reply:'Hi Daniel, thank you for your interest! Our showroom is at...', notes:'VIP potential'},
      {id:'e3',name:'Reza Hakim',email:'reza@email.com',phone:'011-2345678',interest:'Wallets',message:'Looking for a slim wallet for daily use. Budget around RM200. Any recommendations?',date:'2026-03-27',status:'Pending',reply:'',notes:''},
    ]);
    Store.set('faq', [
      {id:'f1',q:'Do you offer warranty on your products?',a:'All Euro Polo products come with a 12-month manufacturer warranty against defects in material and workmanship.',cat:'After-Sale',order:1,status:'Published'},
      {id:'f2',q:'How do I clean my leather bag?',a:'Use a soft dry cloth to wipe surface dust. For deeper cleaning, apply a small amount of leather conditioner on a cloth and buff gently.',cat:'Care',order:2,status:'Published'},
      {id:'f3',q:'Do you ship nationwide?',a:'Yes, we ship to all states in Malaysia via J&T Express and Pos Laju. Free shipping on orders above RM 300.',cat:'Shipping',order:3,status:'Published'},
      {id:'f4',q:'Can I return or exchange a product?',a:'We accept returns within 7 days if the product is unused and in original packaging. Please WhatsApp us to initiate.',cat:'Returns',order:4,status:'Published'},
    ]);
    Store.set('checklist', {});
    Store.set('site_config', {
      whatsapp:'601160601277',
      wa_msg:'Hello Euro Polo, I\'m interested in your products',
      email:'hello@europolo.my',
      instagram:'europolomy',
      facebook:'europolomy',
      tiktok:'europolomy',
      ga4:'G-XXXXXXXXXX',
      pixel:'XXXXXXXXXXXXXXXXX',
      site_name:'Euro Polo',
      tagline:'Refined by European Taste. Built for Modern Life.',
      currency:'RM',
      maintenance:false,
    });
    Store.set('seeded', true);
  }
}
