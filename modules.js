/* ═══════════════════════════════════════════════════════════════════
   MediCore HMS  —  modules.js
   Loaded on: doctors.html, appointments.html, billing.html, wards.html

   Contains four self-contained sections:
   ① DOCTORS        — cards grid, filter, search, email/call/schedule
   ② APPOINTMENTS   — timeline list, filter, schedule modal
   ③ BILLING        — invoice table, filter, mark paid, new invoice, export
   ④ WARDS & BEDS   — bed grid maps, ward summary table, bed tooltip
═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   ①  D O C T O R S
═══════════════════════════════════════════════════════════════ */

const doctorsData = [
  { name: 'Dr. Robert Chen',   spec: 'Cardiologist',       exp: '12 yrs', patients: 18, appts: 6,  rating: 4.9, avail: 'on',  col: '#3d8ef8', email: 'r.chen@smarthealth.hospital',    phone: '+1 555-2001' },
  { name: 'Dr. Priya Patel',   spec: 'Neurologist',        exp: '9 yrs',  patients: 14, appts: 4,  rating: 4.8, avail: 'on',  col: '#a78bfa', email: 'p.patel@smarthealth.hospital',   phone: '+1 555-2002' },
  { name: 'Dr. Jisoo Kim',     spec: 'Orthopedic Surgeon', exp: '7 yrs',  patients: 11, appts: 5,  rating: 4.7, avail: 'on',  col: '#14b8a6', email: 'j.kim@smarthealth.hospital',     phone: '+1 555-2003' },
  { name: 'Dr. Carlos Torres', spec: 'General Physician',  exp: '15 yrs', patients: 22, appts: 8,  rating: 4.6, avail: 'on',  col: '#f59e0b', email: 'c.torres@smarthealth.hospital',  phone: '+1 555-2004' },
  { name: 'Dr. Sara Martinez', spec: 'Pediatrician',       exp: '6 yrs',  patients:  9, appts: 3,  rating: 4.9, avail: 'off', col: '#22c55e', email: 's.martinez@smarthealth.hospital',phone: '+1 555-2005' },
  { name: 'Dr. Nina Volkov',   spec: 'Radiologist',        exp: '11 yrs', patients:  0, appts: 12, rating: 4.7, avail: 'on',  col: '#f97316', email: 'n.volkov@smarthealth.hospital',  phone: '+1 555-2006' },
];

const savedDoctors = Store.get('medicore_doctors', null);
if (Array.isArray(savedDoctors)) doctorsData.splice(0, doctorsData.length, ...savedDoctors);

let docFilter = 'all';
let docSearch = '';

/* Render doctor cards grid */
function renderDoctors() {
  let list = doctorsData;
  if (docFilter === 'on')  list = list.filter(d => d.avail === 'on');
  if (docFilter === 'off') list = list.filter(d => d.avail === 'off');
  if (docSearch) {
    const q = docSearch.toLowerCase();
    list = list.filter(d => d.name.toLowerCase().includes(q) || d.spec.toLowerCase().includes(q));
  }

  /* Update mini stat cards */
  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setEl('s-duty', doctorsData.filter(d => d.avail === 'on').length);
  setEl('s-off',  doctorsData.filter(d => d.avail === 'off').length);
  setEl('s-doctors', doctorsData.length);

  const countLabel = document.getElementById('count-label');
  if (countLabel) countLabel.textContent = `${list.length} doctor${list.length !== 1 ? 's' : ''}`;

  const grid = document.getElementById('docs-grid');
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = `<div style="color:var(--text2);padding:44px;text-align:center;grid-column:1/-1;font-size:14px">No doctors match your search.</div>`;
    return;
  }

  grid.innerHTML = list.map(d => {
    /* Initials from surname(s) */
    const initials = d.name.split(' ').slice(1).map(n => n[0]).join('');
    const avBadge  = d.avail === 'on' ? 'b-green' : 'b-red';
    const avLabel  = d.avail === 'on' ? 'On Duty'  : 'Off Duty';
    const stars    = '★'.repeat(Math.round(d.rating)) + '☆'.repeat(5 - Math.round(d.rating));

    return `
      <div class="doctor-card">
        <div class="doc-top">
          <div class="avatar" style="width:46px;height:46px;font-size:14px;background:${d.col}">${initials}</div>
          <div>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:2px">${d.name}</div>
            <div style="font-size:12px;color:var(--text2)">${d.spec} · ${d.exp}</div>
          </div>
        </div>
        <div class="doc-stats-wrap">
          <div class="doc-stat-item"><span class="ds-val">${d.patients}</span><span class="ds-lbl">Patients</span></div>
          <div class="doc-stat-item"><span class="ds-val">${d.appts}</span><span class="ds-lbl">Today</span></div>
          <div class="doc-stat-item"><span class="ds-val">${d.rating}</span><span class="ds-lbl">Rating</span></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="badge ${avBadge}">${avLabel}</span>
          <span style="color:var(--amber);font-size:13px;letter-spacing:1px">${stars}</span>
        </div>
        <div class="doc-actions">
          <button class="btn btn-ghost" onclick="Toast.show('📧','${d.email}',6000)">Email</button>
          <button class="btn btn-ghost" onclick="Toast.show('📞','${d.phone}',6000)">Call</button>
          <button class="btn btn-primary" onclick="Toast.show('📅','Opening schedule for ${d.name}')">Schedule</button>
        </div>
      </div>`;
  }).join('');
}

/* Filter tabs */
function filterDocs(filter, tabEl) {
  docFilter = filter;
  document.querySelectorAll('.tab-row .tab').forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');
  renderDoctors();
}

function addDoctor() {
  const nameEl = document.getElementById('doctor-name');
  const specEl = document.getElementById('doctor-spec');
  const expEl = document.getElementById('doctor-exp');
  const emailEl = document.getElementById('doctor-email');
  const phoneEl = document.getElementById('doctor-phone');
  const name = (nameEl?.value || '').trim();
  const spec = (specEl?.value || '').trim();
  const email = (emailEl?.value || '').trim();

  if (!name || !spec || !email || !email.includes('@')) {
    Toast.show('⚠️', 'Enter a doctor name, specialty, and valid email.');
    return;
  }
  if (doctorsData.some(doctor => doctor.email.toLowerCase() === email.toLowerCase())) {
    Toast.show('⚠️', 'A doctor with this email is already registered.');
    return;
  }

  doctorsData.push({
    name,
    spec,
    exp: (expEl?.value || '').trim() || 'New',
    patients: 0,
    appts: 0,
    rating: 5,
    avail: 'on',
    col: '#14b8a6',
    email,
    phone: (phoneEl?.value || '').trim() || '—',
  });
  Store.set('medicore_doctors', doctorsData);
  closeModal('doctor-modal');
  renderDoctors();
  [nameEl, specEl, expEl, emailEl, phoneEl].forEach(field => { if (field) field.value = ''; });
  Toast.show('✅', `${name} added to the medical staff.`);
}

/* ═══════════════════════════════════════════════════════════════
   ②  A P P O I N T M E N T S
═══════════════════════════════════════════════════════════════ */

let appointmentsData = [
  { time: '08:30', patient: 'Emma Wilson',      initials: 'EW', doctor: 'Dr. Chen',    type: 'Cardio Checkup',    room: 'A-201', status: 'done',     col: '#3d8ef8' },
  { time: '10:00', patient: 'James Park',       initials: 'JP', doctor: 'Dr. Kim',     type: 'Post-op Review',    room: 'B-104', status: 'progress', col: '#a78bfa' },
  { time: '11:30', patient: 'Maria Santos',     initials: 'MS', doctor: 'Dr. Patel',   type: 'Neuro Scan',        room: 'C-302', status: 'upcoming', col: '#14b8a6' },
  { time: '13:00', patient: 'Li Wei',           initials: 'LW', doctor: 'Dr. Chen',    type: 'ECG Follow-up',     room: 'A-201', status: 'upcoming', col: '#f59e0b' },
  { time: '14:00', patient: 'Kevin Osei',       initials: 'KO', doctor: 'Dr. Torres',  type: 'Discharge Eval',    room: 'D-110', status: 'upcoming', col: '#22c55e' },
  { time: '15:30', patient: 'Anna Johansson',   initials: 'AJ', doctor: 'Dr. Martinez',type: 'Vaccination',       room: 'E-005', status: 'upcoming', col: '#f97316' },
  { time: '16:30', patient: 'Fatima Al-Hassan', initials: 'FA', doctor: 'Dr. Patel',   type: 'Neurology Consult', room: 'C-301', status: 'upcoming', col: '#ef4444' },
];

const savedAppointments = Store.get('medicore_appointments', null);
if (Array.isArray(savedAppointments)) appointmentsData = savedAppointments;

let apptFilter = 'all';
let apptSearch = '';

/* Render timeline list */
function renderAppts() {
  let list = appointmentsData;
  if (apptFilter !== 'all') list = list.filter(a => a.status === apptFilter);
  if (apptSearch) {
    const q = apptSearch.toLowerCase();
    list = list.filter(a => a.patient.toLowerCase().includes(q) || a.doctor.toLowerCase().includes(q) || a.type.toLowerCase().includes(q));
  }

  /* Update mini stats */
  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setEl('stat-total',    appointmentsData.length);
  setEl('stat-done',     appointmentsData.filter(a => a.status === 'done').length);
  setEl('stat-progress', appointmentsData.filter(a => a.status === 'progress').length);
  setEl('stat-upcoming', appointmentsData.filter(a => a.status === 'upcoming').length);

  const timeline = document.getElementById('timeline');
  if (!timeline) return;

  if (!list.length) {
    timeline.innerHTML = `<div style="color:var(--text2);padding:44px;text-align:center;font-size:14px">No appointments match your filter.</div>`;
    return;
  }

  const badgeClass = { done: 'b-green', progress: 'b-amber', upcoming: 'b-blue' };
  const badgeLabel = { done: 'Done',    progress: 'In Progress', upcoming: 'Upcoming' };

  timeline.innerHTML = list.map(a => `
    <div class="appt-card${a.status === 'progress' ? ' appt-now' : ''}${a.status === 'done' ? ' appt-done' : ''}">
      <div class="appt-time-col">${a.time}</div>
      <div style="width:36px;height:36px;border-radius:50%;background:${a.col};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0">${a.initials}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:500;color:var(--text);margin-bottom:2px">${a.patient}</div>
        <div style="font-size:12px;color:var(--text2)">${a.doctor} · ${a.type}</div>
      </div>
      <div class="appt-room-tag">${a.room}</div>
      <span class="badge ${badgeClass[a.status]}">${badgeLabel[a.status]}</span>
      <button class="btn btn-ghost btn-sm" onclick="editAppt('${a.patient}','${a.status}')">Edit</button>
    </div>`).join('');
}

/* Filter tabs */
function setApptFilter(filter, tabEl) {
  apptFilter = filter;
  document.querySelectorAll('.tab-row .tab').forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');
  renderAppts();
}

/* Edit appointment (placeholder) */
function editAppt(patient, status) {
  if (status === 'done') {
    Toast.show('ℹ️', `${patient}'s appointment is already completed.`);
  } else {
    Toast.show('📝', `Opening edit form for ${patient}'s appointment…`);
  }
}

/* Schedule new appointment from modal */
function scheduleAppt() {
  const patientEl = document.getElementById('f-patient');
  const timeEl    = document.getElementById('f-time');
  const docEl     = document.getElementById('f-doc');
  const typeEl    = document.getElementById('f-type');
  const roomEl    = document.getElementById('f-room');

  const patient = (patientEl?.value || '').trim();
  if (!patient) {
    if (patientEl) patientEl.style.borderColor = 'var(--red)';
    Toast.show('⚠️', 'Patient name is required.');
    return;
  }

  const time    = timeEl?.value    || '09:00';
  const doctor  = docEl?.value     || 'Dr. Torres';
  const type    = typeEl?.value    || 'Consultation';
  const room    = (roomEl?.value   || 'TBD').trim() || 'TBD';
  const initials = patient.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const colors   = ['#3d8ef8','#a78bfa','#14b8a6','#f59e0b','#22c55e','#f97316','#ef4444'];
  const col      = colors[appointmentsData.length % colors.length];

  appointmentsData.push({ time, patient, initials, doctor, type, room, status: 'upcoming', col });
  appointmentsData.sort((a, b) => a.time.localeCompare(b.time));
  Store.set('medicore_appointments', appointmentsData);

  closeModal('appt-modal');
  renderAppts();
  Toast.show('✅', `${patient} scheduled at ${time} with ${doctor}`);
  Notifs.add('📅', `New appointment: ${patient} at ${time}`);

  /* Reset form */
  if (patientEl) { patientEl.value = ''; patientEl.style.borderColor = ''; }
  if (roomEl)    { roomEl.value    = ''; }
}

/* ═══════════════════════════════════════════════════════════════
   ③  B I L L I N G
═══════════════════════════════════════════════════════════════ */

let invoicesData = [
  { id: 'INV-2048', patient: 'Emma Wilson',   date: 'Mar 17', services: 'Cardio + Lab',    amount: 3400, ins: 'BlueCross', status: 'Paid'        },
  { id: 'INV-2047', patient: 'James Park',    date: 'Mar 16', services: 'Surgery + Room',  amount: 8200, ins: 'Aetna',     status: 'Pending'     },
  { id: 'INV-2046', patient: 'Maria Santos',  date: 'Mar 15', services: 'Neuro + MRI',     amount: 5600, ins: 'Cigna',     status: 'Outstanding' },
  { id: 'INV-2045', patient: 'Kevin Osei',    date: 'Mar 14', services: 'Consultation',    amount:  450, ins: 'None',      status: 'Paid'        },
  { id: 'INV-2044', patient: 'Li Wei',        date: 'Mar 13', services: 'ECG + Meds',      amount: 1100, ins: 'BlueCross', status: 'Paid'        },
  { id: 'INV-2043', patient: 'Samuel Okeke',  date: 'Mar 12', services: 'Cardio Checkup',  amount:  780, ins: 'Aetna',     status: 'Paid'        },
  { id: 'INV-2042', patient: 'Tom Bradley',   date: 'Mar 11', services: 'General + X-Ray', amount:  620, ins: 'None',      status: 'Outstanding' },
  { id: 'INV-2041', patient: 'Carlos Rivera', date: 'Mar 10', services: 'Cardiac Cath',    amount:12000, ins: 'BlueCross', status: 'Pending'     },
  { id: 'INV-2040', patient: 'Yuki Tanaka',   date: 'Mar 9',  services: 'GP Consultation', amount:  220, ins: 'None',      status: 'Paid'        },
];

const savedInvoices = Store.get('medicore_invoices', null);
if (Array.isArray(savedInvoices)) invoicesData = savedInvoices;

let billFilter = 'all';
let billSearch = '';

/* Render invoices table */
function renderBilling() {
  let list = invoicesData;
  if (billFilter !== 'all') list = list.filter(i => i.status === billFilter);
  if (billSearch) {
    const q = billSearch.toLowerCase();
    list = list.filter(i => i.patient.toLowerCase().includes(q) || i.id.toLowerCase().includes(q) || i.services.toLowerCase().includes(q));
  }

  const countLabel = document.getElementById('count-label');
  if (countLabel) countLabel.textContent = `${list.length} invoice${list.length !== 1 ? 's' : ''}`;

  const tbody = document.getElementById('inv-tbody');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text2);padding:44px;font-size:14px">No invoices match your filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(inv => {
    const markPaidBtn = inv.status !== 'Paid'
      ? `<button class="btn btn-ghost btn-sm" style="color:var(--green);border-color:rgba(34,197,94,.35)" onclick="markPaid('${inv.id}')">Mark Paid</button>`
      : '';

    return `
      <tr>
        <td class="inv-id">${inv.id}</td>
        <td><strong>${inv.patient}</strong></td>
        <td style="font-size:12px;color:var(--text2)">${inv.date}</td>
        <td style="font-size:12px">${inv.services}</td>
        <td style="font-family:var(--font-mono);font-weight:600">${Fmt.currency(inv.amount)}</td>
        <td style="font-size:12px;color:var(--text2)">${inv.ins}</td>
        <td><span class="badge ${Fmt.badge(inv.status)}">${inv.status}</span></td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" onclick="printInvoice('${inv.id}')">🖨️ Print</button>
            ${markPaidBtn}
          </div>
        </td>
      </tr>`;
  }).join('');
}

/* Filter tabs */
function setBillFilter(filter, tabEl) {
  billFilter = filter;
  document.querySelectorAll('.tab-row .tab').forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');
  renderBilling();
}

/* Mark invoice as paid */
function markPaid(invoiceId) {
  const inv = invoicesData.find(i => i.id === invoiceId);
  if (!inv) return;

  showConfirm(
    'Mark as Paid',
    `Mark invoice ${invoiceId} (${Fmt.currency(inv.amount)}) as Paid?`,
    () => {
      inv.status = 'Paid';
      Store.set('medicore_invoices', invoicesData);
      renderBilling();
      Toast.show('✅', `${invoiceId} marked as paid.`);
      Notifs.add('💙', `Invoice ${invoiceId} — ${Fmt.currency(inv.amount)} marked as Paid.`);
    }
  );
}

/* Print individual invoice */
function printInvoice(invoiceId) {
  const inv = invoicesData.find(i => i.id === invoiceId);
  if (!inv) return;

  printSection(`
    <h2>Smart Health HMS — Invoice ${inv.id}</h2>
    <p>Patient: <strong>${inv.patient}</strong> &nbsp;|&nbsp; Date: ${inv.date} &nbsp;|&nbsp; Insurance: ${inv.ins}</p>
    <table>
      <tr><th>Services</th><th>Amount</th><th>Insurance</th><th>Status</th></tr>
      <tr><td>${inv.services}</td><td>${Fmt.currency(inv.amount)}</td><td>${inv.ins}</td><td>${inv.status}</td></tr>
    </table>
    <p style="margin-top:24px;font-size:12px;color:#64748b">Smart Health Hospital Management System · Printed ${new Date().toLocaleString()}</p>`,
    `Invoice ${inv.id} — Smart Health HMS`
  );
}

/* Create new invoice from modal */
function createInvoice() {
  const patientEl  = document.getElementById('f-patient');
  const svcEl      = document.getElementById('f-svc');
  const amtEl      = document.getElementById('f-amt');
  const insEl      = document.getElementById('f-ins');

  const patient = (patientEl?.value || '').trim();
  if (!patient) {
    if (patientEl) patientEl.style.borderColor = 'var(--red)';
    Toast.show('⚠️', 'Patient name is required.');
    return;
  }

  const services = (svcEl?.value || 'General Services').trim() || 'General Services';
  const amount   = parseFloat(amtEl?.value || '0');
  if (!Number.isFinite(amount) || amount <= 0) {
    if (amtEl) amtEl.style.borderColor = 'var(--red)';
    Toast.show('⚠️', 'Enter an invoice amount greater than zero.');
    return;
  }
  const ins      = insEl?.value || 'None';

  /* Generate new invoice ID */
  const maxNum = invoicesData.reduce((max, i) => {
    const n = parseInt(i.id.replace('INV-', ''), 10);
    return n > max ? n : max;
  }, 2048);
  const newId = 'INV-' + (maxNum + 1);

  const dateInput = document.getElementById('f-date');
  const selectedDate = dateInput?.value ? new Date(`${dateInput.value}T00:00:00`) : new Date();
  const date = Fmt.shortDate(selectedDate);

  invoicesData.unshift({ id: newId, patient, date, services, amount, ins, status: 'Pending' });
  Store.set('medicore_invoices', invoicesData);

  closeModal('bill-modal');
  renderBilling();
  Toast.show('✅', `Invoice ${newId} created for ${patient} — ${Fmt.currency(amount)}`);
  Notifs.add('💙', `Invoice ${newId} created: ${patient} — ${Fmt.currency(amount)}`);

  /* Reset form */
  if (patientEl) { patientEl.value = ''; patientEl.style.borderColor = ''; }
  if (svcEl)     svcEl.value  = '';
  if (amtEl)     amtEl.value  = '';
  if (insEl)     insEl.selectedIndex = 0;
}

/* Export invoices CSV */
function exportInvoices() {
  const list = invoicesData.filter(i => billFilter === 'all' || i.status === billFilter);
  exportCSV(
    ['Invoice ID', 'Patient', 'Date', 'Services', 'Amount', 'Insurance', 'Status'],
    list.map(i => [i.id, i.patient, i.date, i.services, i.amount, i.ins, i.status]),
    'smart_health_invoices.csv'
  );
}

/* ═══════════════════════════════════════════════════════════════
   ④  W A R D S  &  B E D S
═══════════════════════════════════════════════════════════════ */

/*
  Bed status codes:
    0 = available (green)
    1 = occupied  (red)
    2 = maintenance (amber)
*/
const wardsConfig = [
  {
    name:   'General Ward',
    floor:  '2',
    total:  24,
    prefix: 'A-',
    col:    'var(--amber)',
    gridId: 'gen-grid',
    beds:   [1,1,1,1,0,1,1,2,1,1,0,0,1,1,1,1,0,1,1,1,1,0,1,1],
  },
  {
    name:   'ICU',
    floor:  '4',
    total:  10,
    prefix: 'I-',
    col:    'var(--red)',
    gridId: 'icu-grid',
    beds:   [1,1,1,1,1,1,2,1,0,1],
  },
  {
    name:   'Cardiology Ward',
    floor:  '3',
    total:  16,
    prefix: 'C-',
    col:    'var(--accent)',
    gridId: 'cardio-grid',
    beds:   [1,1,0,1,1,1,0,1,1,1,2,1,1,0,1,1],
  },
  {
    name:   'Pediatrics Ward',
    floor:  '1',
    total:  12,
    prefix: 'P-',
    col:    'var(--green)',
    gridId: 'pedi-grid',
    beds:   [1,0,1,0,1,0,0,2,0,0,1,0],
  },
];

const savedWards = Store.get('medicore_wards', null);
if (Array.isArray(savedWards)) {
  savedWards.forEach(saved => {
    const ward = wardsConfig.find(item => item.name === saved.name);
    if (ward && Array.isArray(saved.beds)) {
      ward.beds = saved.beds;
      ward.total = saved.total;
    }
  });
}

/* Map bed IDs to patient names */
const bedPatients = {
  'A-01': 'Emma Wilson',
  'A-02': 'James Park',
  'A-04': 'Maria Santos',
  'A-06': 'Samuel Okeke',
  'A-07': 'Li Wei',
  'A-09': 'Kevin Osei',
  'A-14': 'Carlos Rivera',
  'I-01': 'Critical Patient A',
  'I-02': 'Critical Patient B',
  'I-03': 'Critical Patient C',
  'I-04': 'Fatima Al-Hassan',
  'C-01': 'Sophie Turner',
  'C-04': 'Yuki Tanaka',
};

const savedBedPatients = Store.get('medicore_bed_patients', null);
if (savedBedPatients && typeof savedBedPatients === 'object') {
  Object.assign(bedPatients, savedBedPatients);
}

function saveWardData() {
  Store.set('medicore_wards', wardsConfig.map(({ name, total, beds }) => ({ name, total, beds })));
  Store.set('medicore_bed_patients', bedPatients);
}

/* Render all bed grids */
function renderBeds() {
  wardsConfig.forEach(ward => {
    const grid = document.getElementById(ward.gridId);
    if (!grid) return;

    grid.innerHTML = ward.beds.map((status, idx) => {
      const num   = String(idx + 1).padStart(2, '0');
      const bedId = ward.prefix + num;
      const cls   = status === 1 ? 'bed-occ' : status === 0 ? 'bed-avail' : 'bed-maint';
      return `<div
        class="bed ${cls}"
        data-bed="${bedId}"
        data-status="${status}"
        onclick="bedClick('${bedId}', ${status})"
        onmouseenter="showBedTooltip(event, '${bedId}', ${status})"
        onmouseleave="hideBedTooltip()"
        title="${bedId}"
      >${bedId}</div>`;
    }).join('');
  });
}

/* Render ward summary table */
function renderWardSummary() {
  const tbody = document.getElementById('ward-tbody');
  if (!tbody) return;

  tbody.innerHTML = wardsConfig.map(ward => {
    const occupied    = ward.beds.filter(s => s === 1).length;
    const available   = ward.beds.filter(s => s === 0).length;
    const maintenance = ward.beds.filter(s => s === 2).length;
    const pct         = Math.round((occupied / ward.total) * 100);

    return `
      <tr>
        <td><strong>${ward.name}</strong></td>
        <td style="color:var(--text2)">Floor ${ward.floor}</td>
        <td style="font-family:var(--font-mono)">${ward.total}</td>
        <td style="font-family:var(--font-mono);color:var(--red)">${occupied}</td>
        <td style="font-family:var(--font-mono);color:var(--green)">${available}</td>
        <td style="font-family:var(--font-mono);color:var(--amber)">${maintenance}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="height:4px;border-radius:2px;background:var(--bg3);flex:1;overflow:hidden">
              <div style="width:${pct}%;height:100%;border-radius:2px;background:${ward.col}"></div>
            </div>
            <span style="font-size:12px;font-family:var(--font-mono);min-width:36px;text-align:right">${pct}%</span>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function updateWardStats() {
  const totals = wardsConfig.reduce((result, ward) => {
    result.total += ward.beds.length;
    result.occupied += ward.beds.filter(status => status === 1).length;
    result.available += ward.beds.filter(status => status === 0).length;
    result.maintenance += ward.beds.filter(status => status === 2).length;
    return result;
  }, { total: 0, occupied: 0, available: 0, maintenance: 0 });
  ['ward-total', 'ward-occupied', 'ward-available', 'ward-maintenance'].forEach((id, index) => {
    const el = document.getElementById(id);
    if (el) el.textContent = [totals.total, totals.occupied, totals.available, totals.maintenance][index];
  });
  wardsConfig.forEach((ward, index) => {
    const occupied = ward.beds.filter(status => status === 1).length;
    const badge = document.getElementById(`ward-badge-${index}`);
    if (badge) badge.textContent = `${occupied}/${ward.total} Occupied`;
  });
}

function addBed() {
  const ward = wardsConfig[0];
  ward.beds.push(0);
  ward.total = ward.beds.length;
  saveWardData();
  renderBeds();
  renderWardSummary();
  updateWardStats();
  Toast.show('✅', `Bed ${ward.prefix}${String(ward.total).padStart(2, '0')} added to ${ward.name}.`);
}

/* Bed click — show info or assign */
function bedClick(bedId, status) {
  const patient = bedPatients[bedId];
  if (status === 1 && patient) {
    Toast.show('🛏️', `Bed ${bedId} — ${patient} (Occupied)`);
  } else if (status === 1) {
    Toast.show('🛏️', `Bed ${bedId} is occupied.`);
  } else if (status === 0) {
    const patient = window.prompt(`Enter the patient name to assign to bed ${bedId}:`);
    if (!patient || !patient.trim()) return;
    const ward = wardsConfig.find(item => item.prefix === bedId.slice(0, 2));
    const index = ward?.beds[Number(bedId.slice(2)) - 1];
    if (!ward || index !== 0) {
      Toast.show('⚠️', 'That bed is no longer available. Refresh and try again.');
      return;
    }
    ward.beds[Number(bedId.slice(2)) - 1] = 1;
    bedPatients[bedId] = patient.trim();
    saveWardData();
    renderBeds();
    renderWardSummary();
    updateWardStats();
    Toast.show('✅', `${bedId} assigned to ${patient.trim()}.`);
  } else {
    Toast.show('🔧', `Bed ${bedId} is currently under maintenance.`);
  }
}

/* Bed tooltip on hover */
function showBedTooltip(event, bedId, status) {
  const tooltip = document.getElementById('bed-popup');
  if (!tooltip) return;

  const patient  = bedPatients[bedId];
  const label    = status === 1 ? '🔴 Occupied' : status === 0 ? '🟢 Available' : '🟡 Maintenance';
  const patLabel = patient ? `<br><strong style="color:var(--text)">${patient}</strong>` : '';

  tooltip.innerHTML = `
    <div style="font-size:10px;color:var(--text2);margin-bottom:3px;font-family:var(--font-mono)">Bed ${bedId}</div>
    ${label}${patLabel}`;

  tooltip.style.left = (event.pageX + 14) + 'px';
  tooltip.style.top  = (event.pageY - 10) + 'px';
  tooltip.classList.add('show');
}

function hideBedTooltip() {
  const tooltip = document.getElementById('bed-popup');
  if (tooltip) tooltip.classList.remove('show');
}

/* ═══════════════════════════════════════════════════════════════
   PAGE DETECTION & INIT
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  requireAuth();

  const page = window.location.pathname.split('/').pop();

  /* ── DOCTORS PAGE ── */
  if (page === 'doctors.html') {
    renderDoctors();
    closeOnOutside('doctor-modal');

    const searchInput = document.getElementById('search-inp');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(e => {
        docSearch = e.target.value.toLowerCase();
        renderDoctors();
      }, 250));
    }
  }

  /* ── APPOINTMENTS PAGE ── */
  if (page === 'appointments.html') {
    renderAppts();
    closeOnOutside('appt-modal');

    const searchInput = document.getElementById('search-inp');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(e => {
        apptSearch = e.target.value.toLowerCase();
        renderAppts();
      }, 250));
    }
  }

  /* ── BILLING PAGE ── */
  if (page === 'billing.html') {
    renderBilling();
    closeOnOutside('bill-modal');
    closeOnOutside('confirm-modal');

    const searchInput = document.getElementById('search-inp');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(e => {
        billSearch = e.target.value.toLowerCase();
        renderBilling();
      }, 250));
    }
  }

  /* ── WARDS PAGE ── */
  if (page === 'wards.html') {
    renderBeds();
    renderWardSummary();
    updateWardStats();
    closeOnOutside('confirm-modal');
  }
});