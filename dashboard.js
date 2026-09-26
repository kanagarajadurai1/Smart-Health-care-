/* ═══════════════════════════════════════════════════════════════════
   MediCore HMS  —  dashboard.js
   Handles everything on dashboard.html:
   - Auth guard
   - Recent admissions table
   - Today's schedule list
   - Activity feed
   - Animated stat counters
   - Quick add patient modal
   - Live dashboard refresh simulation
═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   DASHBOARD DATA
───────────────────────────────────────────────────────────────── */
const dashPatients = [
  { id: 'P-1041', name: 'Emma Wilson',      dept: 'Cardiology',  admitted: 'Today',     stext: 'Admitted'   },
  { id: 'P-1040', name: 'James Park',       dept: 'Orthopedics', admitted: 'Yesterday', stext: 'Stable'     },
  { id: 'P-1039', name: 'Maria Santos',     dept: 'Neurology',   admitted: 'Mar 15',    stext: 'Recovery'   },
  { id: 'P-1038', name: 'Kevin Osei',       dept: 'General',     admitted: 'Mar 14',    stext: 'Stable'     },
  { id: 'P-1037', name: 'Li Wei',           dept: 'Cardiology',  admitted: 'Mar 13',    stext: 'Recovery'   },
];

const dashSchedule = [
  { time: '08:30', patient: 'Emma Wilson',      initials: 'EW', type: 'Cardio Checkup',    status: 'done',     col: '#3d8ef8' },
  { time: '10:00', patient: 'James Park',       initials: 'JP', type: 'Post-op Review',    status: 'progress', col: '#a78bfa' },
  { time: '11:30', patient: 'Maria Santos',     initials: 'MS', type: 'Neuro Scan',        status: 'upcoming', col: '#14b8a6' },
  { time: '14:00', patient: 'Kevin Osei',       initials: 'KO', type: 'Discharge Eval',    status: 'upcoming', col: '#f59e0b' },
  { time: '16:00', patient: 'Li Wei',           initials: 'LW', type: 'ECG Follow-up',     status: 'upcoming', col: '#f97316' },
];

const dashActivity = [
  { col: '#22c55e', text: 'Lab results for P-1041 ready',             time: '2 min ago'  },
  { col: '#3d8ef8', text: 'Invoice #INV-2048 paid — $3,400',          time: '18 min ago' },
  { col: '#f59e0b', text: 'Bed A-12 marked for maintenance',           time: '1 hr ago'   },
  { col: '#a78bfa', text: 'Dr. Chen scheduled 6 new appointments',    time: '2 hr ago'   },
  { col: '#ef4444', text: 'Emergency case P-1041 admitted to ICU',    time: '3 hr ago'   },
];

/* Runtime counter that mirrors the patients module */
let dashPatientCount = Store.get('medicore_dashboard_patient_count', 1248);

/* ─────────────────────────────────────────────────────────────────
   RENDER RECENT ADMISSIONS TABLE
───────────────────────────────────────────────────────────────── */
function renderAdmissions() {
  const tbody = document.getElementById('admissions-tbody');
  if (!tbody) return;

  tbody.innerHTML = dashPatients.map(p => `
    <tr>
      <td>
        <strong>${p.name}</strong>
        <div class="pid">${p.id}</div>
      </td>
      <td>${p.dept}</td>
      <td>${p.admitted}</td>
      <td><span class="badge ${Fmt.badge(p.stext)}">${p.stext}</span></td>
    </tr>`).join('');
}

/* ─────────────────────────────────────────────────────────────────
   RENDER TODAY'S SCHEDULE
───────────────────────────────────────────────────────────────── */
function renderSchedule() {
  const container = document.getElementById('schedule-list');
  if (!container) return;

  const statusClass = { done: 'b-green', progress: 'b-amber', upcoming: 'b-blue' };
  const statusLabel = { done: 'Done',    progress: 'Now',     upcoming: 'Upcoming' };

  container.innerHTML = dashSchedule.map(a => `
    <div class="appt-item">
      <div class="appt-time">${a.time}</div>
      <div class="appt-av" style="background:${a.col}">${a.initials}</div>
      <div class="appt-info">
        <div class="appt-name">${a.patient}</div>
        <div class="appt-type">${a.type}</div>
      </div>
      <span class="badge ${statusClass[a.status]}">${statusLabel[a.status]}</span>
    </div>`).join('');
}

/* ─────────────────────────────────────────────────────────────────
   RENDER ACTIVITY FEED
───────────────────────────────────────────────────────────────── */
function renderActivity() {
  const container = document.getElementById('activity-feed');
  if (!container) return;

  container.innerHTML = dashActivity.map(a => `
    <div class="act-item">
      <div class="act-dot" style="background:${a.col}"></div>
      <div>
        <div class="act-text">${a.text}</div>
        <div class="act-time">${a.time}</div>
      </div>
    </div>`).join('');
}

/* ─────────────────────────────────────────────────────────────────
   ADD AN ACTIVITY ENTRY  (called from other dashboard actions)
───────────────────────────────────────────────────────────────── */
function addActivityEntry(color, text) {
  dashActivity.unshift({ col: color, text, time: 'Just now' });
  if (dashActivity.length > 8) dashActivity.pop();
  renderActivity();
  Notifs.add('💙', text);
}

/* ─────────────────────────────────────────────────────────────────
   ANIMATED STAT COUNTERS
───────────────────────────────────────────────────────────────── */
function runStatCounters() {
  animateCounter('stat-patients', dashPatientCount, '', '',  true);
  animateCounter('stat-appts',    38,               '', '',  false);
  animateCounter('stat-beds',     74,               '', '%', false);
  animateCounter('stat-revenue',  84,               '$', 'k',false);
}

/* ─────────────────────────────────────────────────────────────────
   UPDATE PATIENT COUNT STAT CARD
───────────────────────────────────────────────────────────────── */
function updatePatientStatCard(newCount) {
  const el = document.getElementById('stat-patients');
  if (el) el.textContent = newCount.toLocaleString();
}

/* ─────────────────────────────────────────────────────────────────
   QUICK ADD PATIENT  (from dashboard modal)
───────────────────────────────────────────────────────────────── */
function addPatientDash() {
  const fnEl   = document.getElementById('qp-fn');
  const lnEl   = document.getElementById('qp-ln');
  const deptEl = document.getElementById('qp-dept');

  const fn   = (fnEl?.value   || '').trim();
  const ln   = (lnEl?.value   || '').trim();
  const dept = (deptEl?.value || 'General');

  /* Validation */
  if (!fn) {
    if (fnEl) fnEl.style.borderColor = 'var(--red)';
    Toast.show('⚠️', 'Please enter the patient\'s first name.');
    return;
  }
  if (!ln) {
    if (lnEl) lnEl.style.borderColor = 'var(--red)';
    Toast.show('⚠️', 'Please enter the patient\'s last name.');
    return;
  }

  /* Generate ID */
  dashPatientCount++;
  const patientStore = Store.get('medicore_patients', []);
  const latestId = patientStore.reduce((max, patient) => Math.max(max, Number(String(patient.id).replace('P-', '')) || 0), 1041);
  const newId = `P-${latestId + 1}`;
  patientStore.unshift({
    id: newId, name: `${fn} ${ln}`, age: '—', dept, doctor: 'Unassigned',
    phone: '—', status: 'inpatient', stext: 'Admitted', notes: '',
  });
  Store.set('medicore_patients', patientStore);
  Store.set('medicore_dashboard_patient_count', dashPatientCount);

  /* Add to local admission list */
  dashPatients.unshift({ id: newId, name: `${fn} ${ln}`, dept, admitted: 'Today', stext: 'Admitted' });
  if (dashPatients.length > 5) dashPatients.pop();

  /* Update UI */
  closeModal('add-patient-modal');
  renderAdmissions();
  updatePatientStatCard(dashPatientCount);
  addActivityEntry('#22c55e', `New patient registered: ${fn} ${ln} (${newId})`);
  Toast.show('✅', `${fn} ${ln} registered as ${newId}`);

  /* Reset form */
  if (fnEl)   { fnEl.value   = ''; fnEl.style.borderColor   = ''; }
  if (lnEl)   { lnEl.value   = ''; lnEl.style.borderColor   = ''; }
  if (deptEl) { deptEl.value = 'General'; }
}

/* ─────────────────────────────────────────────────────────────────
   SIMULATED LIVE REFRESH  (every 60 seconds, minimal DOM touch)
───────────────────────────────────────────────────────────────── */
function startLiveRefresh() {
  setInterval(() => {
    /* Age all "Just now" timestamps */
    dashActivity.forEach(a => {
      if (a.time === 'Just now') a.time = '1 min ago';
    });
    renderActivity();
  }, 60000);
}

/* ─────────────────────────────────────────────────────────────────
   PAGE INIT
───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  requireAuth();

  /* Render static sections */
  renderAdmissions();
  renderSchedule();
  renderActivity();

  /* Animate counters after a short pause so they're visible */
  setTimeout(runStatCounters, 350);

  /* Set up modal close-on-outside-click */
  closeOnOutside('add-patient-modal');

  /* Live refresh */
  startLiveRefresh();
});