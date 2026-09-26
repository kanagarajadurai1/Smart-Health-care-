/* ═══════════════════════════════════════════════════════════════════
   MediCore HMS  —  app.js
   Core module: auth, session, theme, toast, notifications, cursor,
   sidebar, clock, shortcuts, CSV export, print, modal helpers
   Loaded on EVERY page (index.html + all dashboard pages)
═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   1. CREDENTIALS  (role-based accounts)
   In production replace this with a real API call.
───────────────────────────────────────────────────────────────── */
const USERS = [
  {
    id:       'ADM-001',
    email:    'admin@smarthealth.hospital',
    password: 'Admin@123',
    role:     'admin',
    name:     'Dr. Robert Chen',
    dept:     'Administration',
  },
  {
    id:       'DR-2048',
    email:    'doctor@smarthealth.hospital',
    password: 'Doctor@123',
    role:     'doctor',
    name:     'Dr. Priya Patel',
    dept:     'Neurology',
  },
  {
    id:       'NR-1190',
    email:    'nurse@smarthealth.hospital',
    password: 'Nurse@123',
    role:     'nurse',
    name:     'Nurse Emily Ross',
    dept:     'General Ward',
  },
];

/* Browser-only persistence for this demo. This is not a secure clinical datastore. */
const Store = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      Toast.show('⚠️', 'Could not save changes in this browser.');
      return false;
    }
  },
};

/* ─────────────────────────────────────────────────────────────────
   2. SESSION  — localStorage-backed, expiry aware
───────────────────────────────────────────────────────────────── */
const Session = {
  KEY: 'medicore_session',

  /** Persist a logged-in user. remember=true → 30 days, else 8 hours. */
  set(user, remember) {
    const expires = Date.now() + (remember ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000);
    const payload = {
      id:        user.id,
      email:     user.email,
      name:      user.name,
      role:      user.role,
      dept:      user.dept,
      loginTime: Date.now(),
      expires,
    };
    localStorage.setItem(this.KEY, JSON.stringify(payload));
  },

  /** Return the current session object, or null if absent / expired. */
  get() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || Date.now() > s.expires) {
        this.clear();
        return null;
      }
      return s;
    } catch (_) {
      return null;
    }
  },

  /** Remove the session entirely. */
  clear() {
    localStorage.removeItem(this.KEY);
  },

  /** Quick boolean: is a valid session active? */
  isLoggedIn() {
    return this.get() !== null;
  },
};

/* ─────────────────────────────────────────────────────────────────
   3. AUTH GUARD  — call once at the top of every protected page
───────────────────────────────────────────────────────────────── */
function requireAuth() {
  if (!Session.isLoggedIn()) {
    window.location.replace('index.html?msg=expired');
  }
}

/* ─────────────────────────────────────────────────────────────────
   4. LOGOUT
───────────────────────────────────────────────────────────────── */
function logout() {
  showConfirm(
    'Sign Out',
    'Are you sure you want to sign out of Smart Health HMS?',
    () => {
      Session.clear();
      window.location.replace('index.html?msg=logout');
    }
  );
}

/* ─────────────────────────────────────────────────────────────────
   5. THEME  — dark / light, persisted in localStorage
───────────────────────────────────────────────────────────────── */
const Theme = {
  KEY: 'medicore_theme',

  get() {
    return localStorage.getItem(this.KEY) || 'dark';
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.KEY, theme);
    /* Sync all toggle buttons on the page */
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.textContent = theme === 'dark' ? '🌙' : '☀️';
      btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    });
  },

  toggle() {
    this.apply(this.get() === 'dark' ? 'light' : 'dark');
  },

  /** Call this on every page DOMContentLoaded to restore persisted theme */
  init() {
    this.apply(this.get());
  },
};

/* ─────────────────────────────────────────────────────────────────
   6. TOAST  — bottom-right notification
───────────────────────────────────────────────────────────────── */
const Toast = {
  _timer: null,

  show(icon, message, duration = 4000) {
    const toast   = document.getElementById('toast');
    const iconEl  = document.getElementById('t-icon');
    const msgEl   = document.getElementById('t-msg');
    if (!toast) return;

    iconEl.textContent = icon;
    msgEl.textContent  = message;
    toast.classList.add('show');

    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.hide(), duration);
  },

  hide() {
    const toast = document.getElementById('toast');
    if (toast) toast.classList.remove('show');
  },
};

/* ─────────────────────────────────────────────────────────────────
   7. NOTIFICATIONS  — bell dropdown with unread badge
───────────────────────────────────────────────────────────────── */
const Notifs = {
  list: [
    { icon: '🟢', text: 'Lab results for P-1041 ready',              time: '2 min ago',  read: false },
    { icon: '💙', text: 'Invoice #INV-2048 paid — $3,400',           time: '18 min ago', read: false },
    { icon: '🟡', text: 'Bed A-12 marked for maintenance',            time: '1 hr ago',   read: true  },
    { icon: '🟣', text: 'Dr. Chen scheduled 6 new appointments',     time: '2 hr ago',   read: true  },
    { icon: '🔴', text: 'Emergency: P-1041 admitted to ICU',         time: '3 hr ago',   read: true  },
    { icon: '💙', text: 'Patient P-1040 post-op vitals stable',      time: '4 hr ago',   read: true  },
    { icon: '🟢', text: 'Ward A capacity restored to 80%',           time: '5 hr ago',   read: true  },
  ],

  /** Count unread notifications */
  unread() {
    return this.list.filter(n => !n.read).length;
  },

  /** Update the red badge counter on the bell button */
  updateBadge() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    const count = this.unread();
    badge.textContent    = count;
    badge.style.display  = count > 0 ? 'flex' : 'none';
  },

  /** Render the dropdown list */
  renderPanel() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    if (this.list.length === 0) {
      panel.innerHTML = '<div style="padding:20px;text-align:center;font-size:13px;color:var(--text2)">No notifications</div>';
      return;
    }
    panel.innerHTML = this.list.map(n => `
      <div class="notif-item${n.read ? '' : ' unread'}">
        <span class="notif-ic">${n.icon}</span>
        <div>
          <div class="notif-txt">${n.text}</div>
          <div class="notif-time">${n.time}</div>
        </div>
      </div>`).join('');
  },

  /** Mark all as read and update UI */
  markAllRead() {
    this.list.forEach(n => { n.read = true; });
    this.updateBadge();
    this.renderPanel();
  },

  /** Toggle dropdown open / closed */
  toggle() {
    const dropdown = document.getElementById('notif-dropdown');
    if (!dropdown) return;
    const isOpen = dropdown.classList.toggle('open');
    if (isOpen) {
      this.renderPanel();
      /* mark all read after 1.5 s */
      setTimeout(() => this.markAllRead(), 1500);
    }
  },

  /** Add a new notification at runtime */
  add(icon, text) {
    this.list.unshift({ icon, text, time: 'Just now', read: false });
    this.updateBadge();
  },
};

/* ─────────────────────────────────────────────────────────────────
   8. CUSTOM CURSOR
───────────────────────────────────────────────────────────────── */
function initCursor() {
  const cursor = document.getElementById('cursor');
  const trail  = document.getElementById('trail');
  if (!cursor || !trail) return;

  let mx = 0, my = 0, tx = 0, ty = 0;

  /* Follow mouse precisely */
  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  /* Trailing ring animation */
  (function loop() {
    tx += (mx - tx) * 0.13;
    ty += (my - ty) * 0.13;
    trail.style.left = tx + 'px';
    trail.style.top  = ty + 'px';
    requestAnimationFrame(loop);
  })();

  /* Enlarge on interactive elements */
  const interactive = 'a, button, input, select, textarea, .nav-item, .role-btn, .tab, .bed, .sso-btn, [onclick], label';
  document.querySelectorAll(interactive).forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(2.4)';
      trail.style.opacity    = '0';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      trail.style.opacity    = '1';
    });
  });
}

/* ─────────────────────────────────────────────────────────────────
   9. LIVE CLOCK  — real-time HH:MM:SS in topbar
───────────────────────────────────────────────────────────────── */
function initClock() {
  const el = document.getElementById('live-clock');
  if (!el) return;

  function tick() {
    el.textContent = new Date().toLocaleTimeString('en-US', {
      hour:   '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  tick();
  setInterval(tick, 1000);
}

/* ─────────────────────────────────────────────────────────────────
   10. SIDEBAR  — populate user info from session + highlight active link
───────────────────────────────────────────────────────────────── */
function initSidebar() {
  const session = Session.get();
  if (!session) return;

  /* Fill user block */
  const nameEl   = document.getElementById('sidebar-name');
  const roleEl   = document.getElementById('sidebar-role');
  const avatarEl = document.getElementById('sidebar-avatar');

  if (nameEl)   nameEl.textContent   = session.name;
  if (roleEl)   roleEl.textContent   = session.role.charAt(0).toUpperCase() + session.role.slice(1) + ' · ' + session.dept;
  if (avatarEl) avatarEl.textContent = session.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  /* Highlight the current page link */
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-item').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}

/* ─────────────────────────────────────────────────────────────────
   11. MODAL HELPERS
───────────────────────────────────────────────────────────────── */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

/** Close overlay if user clicks the dark backdrop (not the modal itself) */
function closeOnOutside(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('click', e => {
    if (e.target === el) el.classList.remove('open');
  });
}

/* ─────────────────────────────────────────────────────────────────
   12. CONFIRM DIALOG  (custom, replaces browser confirm())
───────────────────────────────────────────────────────────────── */
function showConfirm(title, message, onConfirm) {
  const modal = document.getElementById('confirm-modal');

  /* Fallback to native confirm when modal is absent */
  if (!modal) {
    if (window.confirm(message)) onConfirm();
    return;
  }

  const titleEl = document.getElementById('confirm-title');
  const msgEl   = document.getElementById('confirm-msg');
  const yesBtn  = document.getElementById('confirm-yes');

  if (titleEl) titleEl.textContent = title;
  if (msgEl)   msgEl.textContent   = message;
  if (yesBtn)  yesBtn.onclick      = () => { closeModal('confirm-modal'); onConfirm(); };

  openModal('confirm-modal');
}

/* ─────────────────────────────────────────────────────────────────
   13. FORMAT HELPERS
───────────────────────────────────────────────────────────────── */
const Fmt = {
  /** Dollar amount with commas: 3400 → "$3,400" */
  currency(n) {
    return '$' + Number(n).toLocaleString('en-US');
  },

  /** Short date string from JS Date: "Mar 18" */
  shortDate(d) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  /** Map status string → CSS badge class */
  badge(status) {
    const map = {
      /* Patient statuses */
      inpatient:   'b-amber',
      Admitted:    'b-amber',
      outpatient:  'b-blue',
      Outpatient:  'b-blue',
      discharged:  'b-green',
      Discharged:  'b-green',
      Stable:      'b-green',
      Recovery:    'b-blue',
      /* Invoice statuses */
      Paid:        'b-green',
      Pending:     'b-amber',
      Outstanding: 'b-red',
      /* Appointment statuses */
      done:        'b-green',
      Done:        'b-green',
      progress:    'b-amber',
      'In Progress': 'b-amber',
      upcoming:    'b-blue',
      Upcoming:    'b-blue',
      /* Doctor statuses */
      'On Duty':   'b-green',
      'Off Duty':  'b-red',
    };
    return map[status] || 'b-blue';
  },
};

/* ─────────────────────────────────────────────────────────────────
   14. DEBOUNCE  — throttle rapid input events
───────────────────────────────────────────────────────────────── */
function debounce(fn, delay = 280) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ─────────────────────────────────────────────────────────────────
   15. CSV EXPORT
───────────────────────────────────────────────────────────────── */
function exportCSV(headers, rows, filename = 'smart_health_export.csv') {
  const escape  = val => `"${String(val).replace(/"/g, '""')}"`;
  const lines   = [
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(',')),
  ];
  const blob    = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url     = URL.createObjectURL(blob);
  const anchor  = document.createElement('a');
  anchor.href      = url;
  anchor.download  = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  Toast.show('📥', `${filename} downloaded successfully.`);
}

/* ─────────────────────────────────────────────────────────────────
   16. PRINT  — open printable window with table content
───────────────────────────────────────────────────────────────── */
function printSection(htmlContent, title = 'Smart Health HMS') {
  const win = window.open('', '_blank', 'width=900,height=650');
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body   { font-family: 'Segoe UI', sans-serif; padding: 32px; color: #0f172a; }
    h2     { margin-bottom: 16px; font-size: 20px; }
    p      { margin-bottom: 16px; color: #4b5880; font-size: 14px; }
    table  { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th     { background: #f1f5f9; font-weight: 600; }
    tr:nth-child(even) td { background: #f8fafc; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>${htmlContent}</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

/* ─────────────────────────────────────────────────────────────────
   17. GLOBAL SEARCH  — redirects to patients page with query
───────────────────────────────────────────────────────────────── */
function initGlobalSearch() {
  const input = document.getElementById('search-inp');
  if (!input) return;

  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const query = input.value.trim();
    if (!query) return;

    const currentPage = window.location.pathname.split('/').pop();

    /* If already on patients page, call its filter function */
    if (currentPage === 'patients.html' && typeof filterPatientsBySearch === 'function') {
      filterPatientsBySearch(query);
      return;
    }

    /* Otherwise navigate to patients with ?q= param */
    window.location.href = 'patients.html?q=' + encodeURIComponent(query);
  });

  /* Also fire on input change when on patients page */
  input.addEventListener('input', debounce(e => {
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'patients.html' && typeof filterPatientsBySearch === 'function') {
      filterPatientsBySearch(e.target.value.trim());
    }
  }));
}

/* ─────────────────────────────────────────────────────────────────
   18. KEYBOARD SHORTCUTS
───────────────────────────────────────────────────────────────── */
function initShortcuts() {
  document.addEventListener('keydown', e => {
    /* Ctrl/Cmd + K  →  focus global search */
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const search = document.getElementById('search-inp');
      if (search) search.focus();
    }

    /* Escape  →  close any open modal or dropdown */
    if (e.key === 'Escape') {
      document.querySelectorAll('.overlay.open').forEach(el => el.classList.remove('open'));
      const dd = document.getElementById('notif-dropdown');
      if (dd) dd.classList.remove('open');
    }

    /* Ctrl/Cmd + P  →  open Add Patient (when on patients page) */
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      const currentPage = window.location.pathname.split('/').pop();
      if (currentPage === 'patients.html') {
        e.preventDefault();
        openModal('patient-modal');
      }
    }
  });
}

/* ─────────────────────────────────────────────────────────────────
   19. CLOSE NOTIFICATION ON OUTSIDE CLICK
───────────────────────────────────────────────────────────────── */
function initNotifOutsideClick() {
  document.addEventListener('click', e => {
    const dropdown = document.getElementById('notif-dropdown');
    const bell     = document.getElementById('notif-btn');
    if (dropdown && bell && !dropdown.contains(e.target) && !bell.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
}

/* ─────────────────────────────────────────────────────────────────
   20. ANIMATED NUMBER COUNTER  (dashboard stats)
───────────────────────────────────────────────────────────────── */
function animateCounter(elementId, target, prefix = '', suffix = '', useComma = false) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let current     = 0;
  const duration  = 1600;
  const stepTime  = 14;
  const increment = target / (duration / stepTime);

  const timer = setInterval(() => {
    current = Math.min(current + increment, target);
    const rounded = Math.round(current);
    el.innerHTML   = prefix + (useComma ? rounded.toLocaleString() : rounded) + suffix;
    if (current >= target) clearInterval(timer);
  }, stepTime);
}

/* ─────────────────────────────────────────────────────────────────
   21. GLOBAL DOMContentLoaded  — runs on every page
───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  /* Always */
  Theme.init();
  initCursor();
  initClock();
  initNotifOutsideClick();

  /* Dashboard pages only (not the login page) */
  const page = window.location.pathname.split('/').pop();
  if (page !== 'index.html' && page !== '') {
    initSidebar();
    initGlobalSearch();
    initShortcuts();
    Notifs.updateBadge();
    closeOnOutside('confirm-modal');
  }
});