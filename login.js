/* ═══════════════════════════════════════════════════════════════════
   MediCore HMS  —  login.js
   Handles everything on index.html:
   - Role selection
   - Form validation  (inline errors)
   - Login with lockout after 5 failed attempts
   - Show / hide password
   - Remember Me (persists employee ID)
   - Forgot Password modal + send reset flow
   - Demo credential hint
   - Shake animation on bad login
   - Keyboard Enter navigation
   - Redirect if already logged in
   - Show messages from redirect (logout, expired)
═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ─── State ─── */
let selectedRole = 'admin';   /* currently selected role tab        */
let rememberMe   = false;     /* remember-me checkbox state         */
let pwVisible    = false;     /* password visibility toggle         */
let loginAttempts = 0;        /* failed attempt counter             */
const MAX_ATTEMPTS = 5;       /* lockout threshold                  */
const LOCKOUT_DURATION = 15 * 60 * 1000;  /* 15 minutes in ms      */
let lockoutUntil = 0;         /* timestamp when lockout expires     */

/* ─────────────────────────────────────────────────────────────────
   PAGE INIT
───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* Already logged in? Skip login page */
  if (Session.isLoggedIn()) {
    window.location.replace('dashboard.html');
    return;
  }

  /* Inject shake keyframe CSS once */
  injectShakeCSS();

  /* Restore remembered Employee ID */
  const savedId = localStorage.getItem('medicore_remember_id');
  if (savedId) {
    const empInput = document.getElementById('emp-id');
    if (empInput) empInput.value = savedId;
    rememberMe = true;
    const chk = document.getElementById('chk');
    if (chk) chk.classList.add('checked');
  }

  /* Restore lockout state across page refreshes */
  const savedLockout = localStorage.getItem('medicore_lockout');
  if (savedLockout) {
    lockoutUntil  = parseInt(savedLockout, 10);
    loginAttempts = MAX_ATTEMPTS;
  }

  /* Show redirect messages (logout / session expired) */
  const msg = new URLSearchParams(window.location.search).get('msg');
  if (msg === 'logout') {
    setTimeout(() => Toast.show('👋', 'You have been signed out successfully.'), 400);
  }
  if (msg === 'expired') {
    setTimeout(() => Toast.show('⏰', 'Your session expired. Please sign in again.'), 400);
  }
});

/* ─────────────────────────────────────────────────────────────────
   ROLE SELECTION
───────────────────────────────────────────────────────────────── */
function selectRole(btn) {
  /* Remove selected from all role buttons */
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedRole = btn.dataset.role;

  /* Update placeholder text to match role */
  const placeholders = {
    admin:  'e.g. ADM-001 or admin@smarthealth.hospital',
    doctor: 'e.g. DR-2048 or doctor@smarthealth.hospital',
    nurse:  'e.g. NR-1190 or nurse@smarthealth.hospital',
  };
  const empInput = document.getElementById('emp-id');
  if (empInput) empInput.placeholder = placeholders[selectedRole] || '';

  /* Clear any previous errors */
  clearFieldError('emp-id');
  clearFieldError('password');

  /* Friendly toast */
  const icons = { admin: '⚙️', doctor: '🩺', nurse: '💉' };
  const label = selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1);
  Toast.show(icons[selectedRole] || '👤', `Signing in as ${label}`);
}

/* ─────────────────────────────────────────────────────────────────
   REMEMBER ME CHECKBOX
───────────────────────────────────────────────────────────────── */
function toggleRemember() {
  rememberMe = !rememberMe;
  const chk = document.getElementById('chk');
  if (chk) chk.classList.toggle('checked', rememberMe);
}

/* ─────────────────────────────────────────────────────────────────
   PASSWORD VISIBILITY
───────────────────────────────────────────────────────────────── */
function togglePW() {
  pwVisible = !pwVisible;
  const input = document.getElementById('password');
  const eye   = document.getElementById('pw-eye');
  if (input) input.type = pwVisible ? 'text' : 'password';
  if (eye)   eye.textContent = pwVisible ? '🙈' : '👁';
}

/* ─────────────────────────────────────────────────────────────────
   FIELD ERROR HELPERS
───────────────────────────────────────────────────────────────── */
function clearErr(fieldId) {
  clearFieldError(fieldId);
}

function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  if (input) {
    input.classList.remove('error');
    input.style.borderColor = '';
  }
  /* Map field id → error element id */
  const errMap = { 'emp-id': 'err-emp', 'password': 'err-pw' };
  const errEl  = document.getElementById(errMap[fieldId]);
  if (errEl) errEl.classList.remove('show');
}

function showFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  if (input) input.classList.add('error');

  const errMap = { 'emp-id': 'err-emp', 'password': 'err-pw' };
  const errEl  = document.getElementById(errMap[fieldId]);
  if (errEl) {
    if (message) errEl.textContent = '⚠ ' + message;
    errEl.classList.add('show');
  }
}

/* ─────────────────────────────────────────────────────────────────
   FORM VALIDATION
───────────────────────────────────────────────────────────────── */
function validateLoginForm() {
  const empVal = (document.getElementById('emp-id')?.value || '').trim();
  const pwVal  =  document.getElementById('password')?.value || '';
  let valid    = true;

  if (!empVal) {
    showFieldError('emp-id', 'Please enter your Employee ID or email.');
    valid = false;
  }
  if (pwVal.length < 6) {
    showFieldError('password', 'Password must be at least 6 characters.');
    valid = false;
  }
  return valid;
}

/* ─────────────────────────────────────────────────────────────────
   LOCKOUT HELPERS
───────────────────────────────────────────────────────────────── */
function isLockedOut() {
  if (loginAttempts < MAX_ATTEMPTS) return false;
  if (Date.now() < lockoutUntil)    return true;
  /* Lockout expired — reset */
  loginAttempts = 0;
  lockoutUntil  = 0;
  localStorage.removeItem('medicore_lockout');
  return false;
}

function handleFailedAttempt() {
  loginAttempts++;
  if (loginAttempts >= MAX_ATTEMPTS) {
    lockoutUntil = Date.now() + LOCKOUT_DURATION;
    localStorage.setItem('medicore_lockout', lockoutUntil.toString());
  }
}

/* ─────────────────────────────────────────────────────────────────
   MAIN LOGIN HANDLER
───────────────────────────────────────────────────────────────── */
function doLogin() {
  /* Locked out? */
  if (isLockedOut()) {
    const remaining = Math.ceil((lockoutUntil - Date.now()) / 60000);
    Toast.show('🔒', `Account temporarily locked. Try again in ${remaining} minute${remaining !== 1 ? 's' : ''}.`, 7000);
    return;
  }

  /* Validate form */
  if (!validateLoginForm()) return;

  const empId    = document.getElementById('emp-id').value.trim();
  const password = document.getElementById('password').value;

  /* UI: loading state */
  const btn     = document.getElementById('login-btn');
  const spinner = document.getElementById('spinner');
  const btnText = document.querySelector('.btn-text');

  if (btn)     btn.classList.add('loading');
  if (spinner) spinner.style.display = 'block';
  if (btnText) btnText.style.opacity = '0';

  /* Simulate network delay (replace with real fetch in production) */
  setTimeout(() => {
    /* Match against USERS array (from app.js) */
    const match = USERS.find(u =>
      (u.id === empId || u.email === empId) &&
      u.password === password &&
      u.role === selectedRole
    );

    /* Reset loading state */
    if (btn)     btn.classList.remove('loading');
    if (spinner) spinner.style.display = 'none';
    if (btnText) btnText.style.opacity = '1';

    if (match) {
      /* ── SUCCESS ── */
      loginAttempts = 0;
      lockoutUntil  = 0;
      localStorage.removeItem('medicore_lockout');

      /* Persist the session */
      Session.set(match, rememberMe);

      /* Remember the employee ID if opted-in */
      if (rememberMe) {
        localStorage.setItem('medicore_remember_id', empId);
      } else {
        localStorage.removeItem('medicore_remember_id');
      }

      Toast.show('✅', `Welcome back, ${match.name}!`);
      setTimeout(() => window.location.replace('dashboard.html'), 900);

    } else {
      /* ── FAILURE ── */
      handleFailedAttempt();
      const remaining = MAX_ATTEMPTS - loginAttempts;

      let msg = 'Invalid credentials. Please check your Employee ID, password, and selected role.';
      if (remaining > 0 && remaining <= 2) {
        msg += ` (${remaining} attempt${remaining !== 1 ? 's' : ''} remaining)`;
      } else if (loginAttempts >= MAX_ATTEMPTS) {
        msg = `Account locked for 15 minutes due to too many failed attempts. Contact IT Support if needed.`;
      }

      Toast.show('❌', msg, 7000);
      shakeLoginCard();
    }
  }, 1400);
}

/* ─────────────────────────────────────────────────────────────────
   SHAKE ANIMATION  (bad login feedback)
───────────────────────────────────────────────────────────────── */
function shakeLoginCard() {
  const card = document.querySelector('.login-card');
  if (!card) return;
  card.style.animation = 'shake 0.45s ease';
  setTimeout(() => { card.style.animation = ''; }, 450);
}

function injectShakeCSS() {
  if (document.getElementById('shake-css')) return;
  const style = document.createElement('style');
  style.id    = 'shake-css';
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      15%       { transform: translateX(-9px); }
      30%       { transform: translateX(9px); }
      45%       { transform: translateX(-7px); }
      60%       { transform: translateX(7px); }
      75%       { transform: translateX(-4px); }
      90%       { transform: translateX(4px); }
    }`;
  document.head.appendChild(style);
}

/* ─────────────────────────────────────────────────────────────────
   FORGOT PASSWORD MODAL
───────────────────────────────────────────────────────────────── */
function openFP(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('fp-email');
  if (emailInput) { emailInput.value = ''; emailInput.style.borderColor = ''; }
  openModal('fp-overlay');
}

function closeFP(event) {
  /* Close if clicking the dark backdrop */
  if (!event || event.target.id === 'fp-overlay') {
    closeModal('fp-overlay');
  }
}

function sendReset() {
  const emailInput = document.getElementById('fp-email');
  const email      = (emailInput?.value || '').trim();

  if (!email || !email.includes('@') || !email.includes('.')) {
    if (emailInput) emailInput.style.borderColor = 'var(--red)';
    Toast.show('⚠️', 'Please enter a valid hospital email address.');
    return;
  }

  /* Check if email belongs to a known user (optional UX improvement) */
  const knownUser = USERS.find(u => u.email === email);
  if (emailInput) emailInput.style.borderColor = '';
  closeModal('fp-overlay');

  if (knownUser) {
    Toast.show('📧', `Password reset link sent to ${email}. Check your inbox within 2 minutes.`, 6000);
  } else {
    /* Don't reveal whether email exists (security best practice) */
    Toast.show('📧', `If ${email} is registered, a reset link has been sent.`, 6000);
  }
}

/* ─────────────────────────────────────────────────────────────────
   DEMO CREDENTIAL HINT
───────────────────────────────────────────────────────────────── */
function showHint() {
  Toast.show(
    '💡',
    'Admin: ADM-001 / Admin@123  ·  Doctor: DR-2048 / Doctor@123  ·  Nurse: NR-1190 / Nurse@123',
    9000
  );
}

/* ─────────────────────────────────────────────────────────────────
   KEYBOARD NAVIGATION  (Enter key flow)
───────────────────────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;

  const active = document.activeElement;
  const empInput = document.getElementById('emp-id');
  const pwInput  = document.getElementById('password');

  if (active === empInput) {
    /* Tab to password field */
    if (pwInput) pwInput.focus();
  } else if (active === pwInput) {
    /* Submit form */
    doLogin();
  }
});