

function showErr(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('show');
  document.getElementById(id.replace('Msg','Text')).textContent = text;
}

function showOk(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('show');
  document.getElementById(id.replace('Msg','Text')).textContent = text;
}

function clearMsgs() {
  document.querySelectorAll('.msg').forEach(m => m.classList.remove('show'));
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.dataset.orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i>Please wait…';
    btn.classList.add('loading');
  } else {
    btn.innerHTML = btn.dataset.orig || btn.innerHTML;
    btn.classList.remove('loading');
  }
}

function toggleEye(inputId, btn) {
  const inp = document.getElementById(inputId);
  const icon = btn.querySelector('i');
  if (inp.type === 'password') {
    inp.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    inp.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

function formatDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

function checkStrength(val) {
  const wrap  = document.getElementById('strengthWrap');
  const bar   = document.getElementById('strengthBar');
  const label = document.getElementById('strengthLabel');
  if (!wrap) return;

  if (!val) {
    wrap.style.display = 'none';
    label.style.display = 'none';
    return;
  }

  wrap.style.display  = 'block';
  label.style.display = 'block';

  let score = 0;
  if (val.length >= 8)            score++;
  if (/[A-Z]/.test(val))          score++;
  if (/[0-9]/.test(val))          score++;
  if (/[^A-Za-z0-9]/.test(val))   score++;

  const levels = [
    { w: '20%', bg: '#ef4444', txt: 'Weak' },
    { w: '45%', bg: '#f97316', txt: 'Fair' },
    { w: '70%', bg: '#eab308', txt: 'Good' },
    { w: '100%',bg: '#22c55e', txt: 'Strong' },
  ];

  const lv = levels[Math.max(0, score - 1)];
  bar.style.width      = lv.w;
  bar.style.background = lv.bg;
  label.textContent    = lv.txt;
  label.style.color    = lv.bg;
}



async function registerUser() {
  clearMsgs();

  const username        = document.getElementById('username')?.value.trim();
  const email           = document.getElementById('email')?.value.trim();
  const password        = document.getElementById('password')?.value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;

  // Validation
  if (!username || !email || !password || !confirmPassword) {
    showErr('errMsg', 'All fields are required.'); return;
  }
  if (username.length < 3) {
    showErr('errMsg', 'Username must be at least 3 characters.'); return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showErr('errMsg', 'Please enter a valid email address.'); return;
  }
  if (password.length < 6) {
    showErr('errMsg', 'Password must be at least 6 characters.'); return;
  }
  if (password !== confirmPassword) {
    showErr('errMsg', 'Passwords do not match.'); return;
  }

  setLoading('regBtn', true);

  try {
    const res  = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
      credentials: 'include',
    });
    const data = await res.json();

    if (res.status === 201) {
      showOk('okMsg', 'Account created! Redirecting to login…');
      setTimeout(() => window.location.href = '/login-page', 1400);
    } else {
      showErr('errMsg', data.message || 'Registration failed.');
    }
  } catch {
    showErr('errMsg', 'Network error — is the server running?');
  } finally {
    setLoading('regBtn', false);
  }
}



async function loginUser() {
  clearMsgs();

  const username = document.getElementById('username')?.value.trim();
  const password = document.getElementById('password')?.value;
  const remember = document.getElementById('remember')?.checked ?? false;

  if (!username || !password) {
    showErr('errMsg', 'Username and password are required.'); return;
  }

  setLoading('loginBtn', true);

  try {
    const res  = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, remember }),
      credentials: 'include',
    });
    const data = await res.json();

    if (res.status === 200) {
      window.location.href = '/dashboard-page';
    } else {
      showErr('errMsg', data.message || 'Invalid credentials.');
    }
  } catch {
    showErr('errMsg', 'Network error — is the server running?');
  } finally {
    setLoading('loginBtn', false);
  }
}


async function loadDashboard() {
  if (!window.location.pathname.includes('dashboard')) return;

  try {
    const res = await fetch('/profile', {
      method: 'GET',
      credentials: 'include',
    });

    if (res.status === 401) {
      window.location.href = '/login-page';
      return;
    }

    const u = await res.json();

    // Welcome
    const nameEl = document.getElementById('welcomeName');
    if (nameEl) nameEl.textContent = u.username;

    // Badge
    const badge = document.getElementById('roleBadge');
    if (badge) {
      badge.textContent = u.role === 'admin' ? '👑 Admin' : '🟣 User';
      if (u.role === 'admin') badge.classList.add('admin-badge');
    }

  
    setText('roleVal',   u.role === 'admin' ? '👑 Administrator' : '🔵 Regular User');
    setText('emailVal',  u.email);
    setText('joinedVal', formatDate(u.created_at));


    if (u.role === 'admin') {
      const sec = document.getElementById('adminSection');
      if (sec) {
        sec.style.display = 'block';
        loadAllUsers();
      }
    }

  } catch {
    window.location.href = '/login-page';
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || '—';
}

async function loadAllUsers() {
  try {
    const res  = await fetch('/admin/users', { credentials: 'include' });
    const data = await res.json();
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="color:var(--muted)">No users found.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(u => `
      <tr>
        <td>${u.id}</td>
        <td><strong style="color:var(--text)">${u.username}</strong></td>
        <td>${u.email}</td>
        <td><span class="role-pill ${u.role}">${u.role}</span></td>
        <td>${formatDate(u.created_at)}</td>
      </tr>
    `).join('');
  } catch {
    
  }
}


async function logoutUser() {
  try {
    await fetch('/logout', { method: 'GET', credentials: 'include' });
  } finally {
    window.location.href = '/login-page';
  }
}