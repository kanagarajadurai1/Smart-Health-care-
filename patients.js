/* ═══════════════════════════════════════════════════════════════════
   MediCore HMS  —  patients.js
   Handles everything on patients.html:
   - Patient data store
   - Filter tabs (All / Inpatient / Outpatient / Discharged)
   - Live search
   - Add Patient modal with full validation
   - View Patient details modal
   - Discharge with confirmation dialog
   - Stat counters
   - CSV export
   - URL ?q= search param (from global search)
═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   PATIENT DATA STORE
───────────────────────────────────────────────────────────────── */
const defaultPatientsData = [
  { id: 'P-1041', name: 'Emma Wilson',      age: 45, dept: 'Cardiology',  doctor: 'Dr. Chen',    phone: '+1 555-0101', status: 'inpatient',  stext: 'Admitted',   notes: 'Cardiac monitoring required. Atrial fibrillation under management.'  },
  { id: 'P-1040', name: 'James Park',       age: 32, dept: 'Orthopedics', doctor: 'Dr. Kim',     phone: '+1 555-0102', status: 'inpatient',  stext: 'Stable',     notes: 'Post-operative care following left knee replacement. Physio daily.'   },
  { id: 'P-1039', name: 'Maria Santos',     age: 57, dept: 'Neurology',   doctor: 'Dr. Patel',   phone: '+1 555-0103', status: 'inpatient',  stext: 'Recovery',   notes: 'Ischemic stroke recovery. Mild left-side weakness improving.'         },
  { id: 'P-1038', name: 'Kevin Osei',       age: 28, dept: 'General',     doctor: 'Dr. Torres',  phone: '+1 555-0104', status: 'outpatient', stext: 'Outpatient', notes: 'Follow-up appointment required in 2 weeks. Blood pressure normalised.' },
  { id: 'P-1037', name: 'Li Wei',           age: 63, dept: 'Cardiology',  doctor: 'Dr. Chen',    phone: '+1 555-0105', status: 'outpatient', stext: 'Outpatient', notes: 'ECG stable. Dietary management for cholesterol. Monthly review.'       },
  { id: 'P-1036', name: 'Anna Johansson',   age: 41, dept: 'Pediatrics',  doctor: 'Dr. Martinez',phone: '+1 555-0106', status: 'discharged', stext: 'Discharged', notes: 'Full recovery confirmed. No further hospital care required.'           },
  { id: 'P-1035', name: 'Tom Bradley',      age: 19, dept: 'General',     doctor: 'Dr. Torres',  phone: '+1 555-0107', status: 'discharged', stext: 'Discharged', notes: 'Minor sports injury resolved. Cleared for normal activity.'            },
  { id: 'P-1034', name: 'Fatima Al-Hassan', age: 34, dept: 'Neurology',   doctor: 'Dr. Patel',   phone: '+1 555-0108', status: 'inpatient',  stext: 'Admitted',   notes: 'Chronic migraine treatment protocol initiated. Responding well.'       },
  { id: 'P-1033', name: 'Samuel Okeke',     age: 52, dept: 'Cardiology',  doctor: 'Dr. Chen',    phone: '+1 555-0109', status: 'outpatient', stext: 'Outpatient', notes: 'Hypertension management. ACE inhibitor adjusted. 3-month review.'      },
  { id: 'P-1032', name: 'Yuki Tanaka',      age: 29, dept: 'General',     doctor: 'Dr. Torres',  phone: '+1 555-0110', status: 'outpatient', stext: 'Outpatient', notes: 'Post-viral fatigue. Rest advised. Vitamin D supplementation.'           },
  { id: 'P-1031', name: 'Carlos Rivera',    age: 67, dept: 'Cardiology',  doctor: 'Dr. Chen',    phone: '+1 555-0111', status: 'inpatient',  stext: 'Admitted',   notes: 'Myocardial infarction — stable post-catheterisation.'                  },
  { id: 'P-1030', name: 'Sophie Turner',    age: 38, dept: 'Neurology',   doctor: 'Dr. Patel',   phone: '+1 555-0112', status: 'discharged', stext: 'Discharged', notes: 'Epilepsy medication optimised. Seizure-free for 4 weeks.'              },
];

let patientsData = Store.get('medicore_patients', defaultPatientsData);

/* ─── UI State ─── */
let patientFilter  = 'all';   /* current tab filter */
let patientSearch  = '';      /* current search query */
let viewingPatient = null;    /* patient being viewed in modal */

/* ─────────────────────────────────────────────────────────────────
   FILTERING + SEARCH
───────────────────────────────────────────────────────────────── */
function getFilteredPatients() {
  let list = patientsData;

  /* Status filter */
  if (patientFilter !== 'all') {
    list = list.filter(p => p.status === patientFilter);
  }

  /* Search query (name, id, department, doctor) */
  if (patientSearch) {
    const q = patientSearch.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q)   ||
      p.id.toLowerCase().includes(q)     ||
      p.dept.toLowerCase().includes(q)   ||
      p.doctor.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  }

  return list;
}

/* ─────────────────────────────────────────────────────────────────
   RENDER PATIENTS TABLE
───────────────────────────────────────────────────────────────── */
function renderPatients() {
  const list  = getFilteredPatients();
  const tbody = document.getElementById('patients-tbody');
  if (!tbody) return;

  /* Update stat counters */
  updatePatientStats();

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;color:var(--text2);padding:44px 20px;font-size:14px">
          No patients match your search.
          <span style="color:var(--accent);cursor:pointer;margin-left:8px" onclick="clearPatientSearch()">Clear filter</span>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => {
    const badgeClass = Fmt.badge(p.status);
    const actionBtns = p.status !== 'discharged'
      ? `<button class="btn btn-ghost btn-sm" onclick="openViewModal('${p.id}')">👁 View</button>
         <button class="btn btn-danger btn-sm" onclick="confirmDischarge('${p.id}')">Discharge</button>`
      : `<button class="btn btn-ghost btn-sm" onclick="openViewModal('${p.id}')">👁 View</button>`;

    return `
      <tr>
        <td><span style="font-family:var(--font-mono);font-size:11px;color:var(--text2)">${p.id}</span></td>
        <td><strong>${p.name}</strong></td>
        <td>${p.age}</td>
        <td>${p.dept}</td>
        <td>${p.doctor}</td>
        <td style="font-size:12px;color:var(--text2)">${p.phone}</td>
        <td><span class="badge ${badgeClass}">${p.stext}</span></td>
        <td><div style="display:flex;gap:6px;flex-wrap:wrap">${actionBtns}</div></td>
      </tr>`;
  }).join('');
}

/* ─────────────────────────────────────────────────────────────────
   STAT COUNTERS  (mini cards at top of page)
───────────────────────────────────────────────────────────────── */
function updatePatientStats() {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set('s-total', patientsData.length);
  set('s-in',    patientsData.filter(p => p.status === 'inpatient').length);
  set('s-out',   patientsData.filter(p => p.status === 'outpatient').length);
  set('s-dis',   patientsData.filter(p => p.status === 'discharged').length);

  /* Update sidebar badge */
  const badge = document.getElementById('nav-count');
  if (badge) badge.textContent = patientsData.filter(p => p.status !== 'discharged').length;
}

/* ─────────────────────────────────────────────────────────────────
   FILTER TABS
───────────────────────────────────────────────────────────────── */
function filterPats(filter, tabEl) {
  patientFilter = filter;

  /* Highlight active tab */
  document.querySelectorAll('.tab-row .tab').forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');

  renderPatients();
}

/* ─────────────────────────────────────────────────────────────────
   SEARCH  (called from global search & inline search input)
───────────────────────────────────────────────────────────────── */
function filterPatientsBySearch(query) {
  patientSearch = (query || '').trim();
  renderPatients();
}

function clearPatientSearch() {
  patientSearch = '';
  const searchInput = document.getElementById('search-inp');
  if (searchInput) searchInput.value = '';
  renderPatients();
}

/* ─────────────────────────────────────────────────────────────────
   ADD PATIENT MODAL  — open / save
───────────────────────────────────────────────────────────────── */
function openAddModal() {
  /* Reset form */
  const fields = ['f-fn', 'f-ln', 'f-dob', 'f-phone', 'f-notes'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.style.borderColor = ''; }
  });
  const dept   = document.getElementById('f-dept');
  const doc    = document.getElementById('f-doc');
  const status = document.getElementById('f-status');
  const gender = document.getElementById('f-gender');
  if (dept)   dept.selectedIndex   = 0;
  if (doc)    doc.selectedIndex    = 0;
  if (status) status.selectedIndex = 0;
  if (gender) gender.selectedIndex = 0;

  openModal('patient-modal');
}

function savePatient() {
  /* Gather values */
  const fn     = (document.getElementById('f-fn')?.value     || '').trim();
  const ln     = (document.getElementById('f-ln')?.value     || '').trim();
  const dob    = (document.getElementById('f-dob')?.value    || '');
  const gender = (document.getElementById('f-gender')?.value || 'Male');
  const dept   = (document.getElementById('f-dept')?.value   || 'General');
  const doctor = (document.getElementById('f-doc')?.value    || 'Dr. Torres');
  const phone  = (document.getElementById('f-phone')?.value  || '—');
  const status = (document.getElementById('f-status')?.value || 'inpatient');
  const notes  = (document.getElementById('f-notes')?.value  || '').trim();

  /* Validate required fields */
  let valid = true;
  if (!fn) {
    const el = document.getElementById('f-fn');
    if (el) el.style.borderColor = 'var(--red)';
    Toast.show('⚠️', 'First name is required.');
    valid = false;
  }
  if (!ln) {
    const el = document.getElementById('f-ln');
    if (el) el.style.borderColor = 'var(--red)';
    Toast.show('⚠️', 'Last name is required.');
    valid = false;
  }
  if (!valid) return;

  /* Calculate age from DOB */
  let age = '—';
  if (dob) {
    const born = new Date(dob);
    const today = new Date();
    age = today.getFullYear() - born.getFullYear();
    const m = today.getMonth() - born.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age--;
  }

  /* Generate new ID */
  const maxId = patientsData.reduce((max, p) => {
    const num = parseInt(p.id.replace('P-', ''), 10);
    return num > max ? num : max;
  }, 1041);
  const newId = 'P-' + (maxId + 1);

  /* Map status to stext */
  const stextMap = { inpatient: 'Admitted', outpatient: 'Outpatient', discharged: 'Discharged' };
  const stext = stextMap[status] || status;

  /* Add to store */
  patientsData.unshift({ id: newId, name: `${fn} ${ln}`, age, dept, doctor, phone, status, stext, notes });
  Store.set('medicore_patients', patientsData);

  /* Update UI */
  closeModal('patient-modal');
  renderPatients();
  Toast.show('✅', `${fn} ${ln} registered successfully as ${newId}`);
  Notifs.add('🟢', `New patient registered: ${fn} ${ln} (${newId})`);
}

/* ─────────────────────────────────────────────────────────────────
   VIEW PATIENT MODAL
───────────────────────────────────────────────────────────────── */
function openViewModal(patientId) {
  const p = patientsData.find(x => x.id === patientId);
  if (!p) return;
  viewingPatient = p;

  const nameEl = document.getElementById('view-name');
  const bodyEl = document.getElementById('view-body');

  if (nameEl) nameEl.textContent = p.name;
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--text2);margin-bottom:4px">Patient ID</div>
          <div style="font-family:var(--font-mono);font-size:14px;font-weight:600">${p.id}</div>
        </div>
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--text2);margin-bottom:4px">Age / Gender</div>
          <div style="font-size:14px">${p.age} years</div>
        </div>
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--text2);margin-bottom:4px">Department</div>
          <div style="font-size:14px">${p.dept}</div>
        </div>
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--text2);margin-bottom:4px">Assigned Doctor</div>
          <div style="font-size:14px">${p.doctor}</div>
        </div>
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--text2);margin-bottom:4px">Contact</div>
          <div style="font-size:14px">${p.phone}</div>
        </div>
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--text2);margin-bottom:4px">Status</div>
          <span class="badge ${Fmt.badge(p.status)}">${p.stext}</span>
        </div>
      </div>
      <div style="border-top:1px solid var(--border);padding-top:16px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--text2);margin-bottom:8px">Clinical Notes</div>
        <div style="font-size:13px;line-height:1.75;color:var(--text2)">${p.notes || 'No clinical notes recorded.'}</div>
      </div>
      ${p.status !== 'discharged' ? `
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px">
        <button class="btn btn-danger" onclick="closeModal('view-modal');confirmDischarge('${p.id}')">Discharge Patient</button>
      </div>` : ''}`;
  }

  openModal('view-modal');
}

/* ─────────────────────────────────────────────────────────────────
   DISCHARGE PATIENT
───────────────────────────────────────────────────────────────── */
function confirmDischarge(patientId) {
  const p = patientsData.find(x => x.id === patientId);
  if (!p) return;

  showConfirm(
    'Discharge Patient',
    `Are you sure you want to discharge ${p.name} (${p.id})? This action will update their status to Discharged.`,
    () => dischargePatient(patientId)
  );
}

function dischargePatient(patientId) {
  const p = patientsData.find(x => x.id === patientId);
  if (!p) return;

  p.status = 'discharged';
  p.stext  = 'Discharged';
  Store.set('medicore_patients', patientsData);

  renderPatients();
  Toast.show('✅', `${p.name} has been discharged successfully.`);
  Notifs.add('🟡', `Patient ${p.name} (${p.id}) discharged.`);
}

/* ─────────────────────────────────────────────────────────────────
   CSV EXPORT
───────────────────────────────────────────────────────────────── */
function exportPatients() {
  const list = getFilteredPatients();
  exportCSV(
    ['Patient ID', 'Name', 'Age', 'Department', 'Doctor', 'Phone', 'Status', 'Notes'],
    list.map(p => [p.id, p.name, p.age, p.dept, p.doctor, p.phone, p.stext, p.notes]),
    'smart_health_patients.csv'
  );
}

/* ─────────────────────────────────────────────────────────────────
   PAGE INIT
───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  requireAuth();

  /* Handle ?q= from global search redirect */
  const urlQuery = new URLSearchParams(window.location.search).get('q');
  if (urlQuery) {
    patientSearch = urlQuery;
    const searchInput = document.getElementById('search-inp');
    if (searchInput) searchInput.value = urlQuery;
  }

  /* Initial render */
  renderPatients();

  /* Modal close-on-outside setup */
  closeOnOutside('patient-modal');
  closeOnOutside('view-modal');
  closeOnOutside('confirm-modal');

  /* Wire up inline search input on this page */
  const searchInput = document.getElementById('search-inp');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(e => {
      filterPatientsBySearch(e.target.value);
    }, 250));
  }
});