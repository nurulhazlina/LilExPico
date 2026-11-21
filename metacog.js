/* metacog.js — Metacognitive measurement layer for LilEx5 activities
   Research: Direction B — Metacognitive vs Content Scaffolding (J3)
   UMPSA STEM Lab · hazlina@umpsa.edu.my · 2026
   ─────────────────────────────────────────────────────────────────
   Drop this file in the same folder as activity.js and add to each
   activity page just before </body>:
     <script src="metacog.js"></script>
*/

'use strict';

// ── Configuration ─────────────────────────────────────────────────────────────
const METACOG = {
  // ▶ Replace this with your deployed Google Apps Script Web App URL
  SHEETS_URL: 'https://script.google.com/macros/s/AKfycbwEKS3VdUL8CaenRJ80wQ7ynRGE2lUNMdNs9BR5iqfMsD_rsu18e17t5JblEiuLP2RM/exec',

  // Activity metadata: week, scaffold tier (1/2/3), transfer concept for Q8
  // Tier 0 = orientation (no research data collected)
  activities: {
    0:  { week: 7,  tier: 0, title: 'Getting Started',
          concept: 'the difference between a simulator and a real board' },
    1:  { week: 7,  tier: 1, title: 'Light Up an LED',
          concept: 'GPIO pin numbering and output mode' },
    2:  { week: 7,  tier: 1, title: 'Make an LED Blink',
          concept: 'a while loop and the sleep function' },
    3:  { week: 8,  tier: 1, title: 'Digital Output & Servo',
          concept: 'PWM signals and duty cycle' },
    4:  { week: 8,  tier: 1, title: 'Digital Input',
          concept: 'input pins and pull-up resistors' },
    5:  { week: 9,  tier: 2, title: 'Making Decisions',
          concept: 'if / elif / else conditional logic' },
    6:  { week: 9,  tier: 2, title: 'And, Or, Not',
          concept: 'boolean operators in a condition' },
    7:  { week: 10, tier: 2, title: 'Words on a Screen',
          concept: 'I2C communication and the LCD display library' },
    8:  { week: 10, tier: 2, title: 'Sensors and Numbers',
          concept: 'reading and interpreting analog sensor values' },
    9:  { week: 11, tier: 2, title: 'Soil Moisture',
          concept: 'sensor calibration and threshold-based logic' },
    10: { week: 11, tier: 3, title: 'Internet and Data',
          concept: 'connecting to WiFi and sending sensor data to the cloud' },
    11: { week: 12, tier: 3, title: 'Control from Anywhere',
          concept: 'MQTT publish and subscribe' },
    12: { week: 12, tier: 3, title: 'Sending Messages by Radio',
          concept: 'radio communication between two Pico devices' },
    13: { week: 13, tier: 3, title: 'Sending Data to a Live Dashboard',
          concept: 'building an end-to-end IoT sensor-to-dashboard pipeline' },
  }
};

// ── Derive activity number from URL ──────────────────────────────────────────
const _actMatch = location.pathname.match(/activity-(\d+)/);
const ACT_NUM   = _actMatch ? parseInt(_actMatch[1], 10) : null;
const ACT_META  = ACT_NUM !== null ? METACOG.activities[ACT_NUM] : null;

if (ACT_NUM === null) { /* not an activity page — do nothing */ }

// ── localStorage helpers ──────────────────────────────────────────────────────
function lsGet(k)      { try { return localStorage.getItem(k); }            catch { return null; } }
function lsSet(k, v)   { try { localStorage.setItem(k, String(v)); }        catch {} }
function lsGetObj(k)   { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function lsSetObj(k,v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function getProfile()  { return lsGetObj('lilex_profile'); }
function saveProfile(p){ lsSetObj('lilex_profile', p); }

// ── Google Sheets submission ──────────────────────────────────────────────────
async function submitToSheets(payload) {
  const p = getProfile() || {};
  const row = Object.assign({
    student_name:    p.name    || '',
    student_gender:  p.gender  || '',
    student_mykid:   p.mykid   || '',
    student_matric:  p.matric  || '',
    student_class:        p.kelas       || '',
    student_school_code:  p.school_code || '',
    student_school:       p.school      || '',
    student_state:        p.state       || '',
    student_age:     p.age     || '',
    student_phone:   p.phone   || '',
    student_email:   p.email   || '',
    activity_id:    ACT_NUM,
    activity_title: ACT_META?.title || '',
    week:           ACT_META?.week  || '',
    tier:           ACT_META?.tier  || '',
    timestamp:      new Date().toISOString(),
  }, payload);

  try {
    await fetch(METACOG.SHEETS_URL, {
      method:  'POST',
      mode:    'no-cors',           // required for Apps Script endpoints
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(row),
    });
    _flushQueue();                  // retry any queued offline submissions
  } catch {
    // Offline — queue for later
    const q = lsGetObj('lilex_queue') || [];
    q.push(row);
    lsSetObj('lilex_queue', q);
  }
}

async function _flushQueue() {
  const q = lsGetObj('lilex_queue') || [];
  if (!q.length) return;
  const remaining = [];
  for (const item of q) {
    try {
      await fetch(METACOG.SHEETS_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
    } catch { remaining.push(item); break; } // still offline
  }
  lsSetObj('lilex_queue', remaining);
}

// ── Styles ────────────────────────────────────────────────────────────────────
function _injectStyles() {
  const css = `
/* ── metacog.js styles ── */
.mc-overlay{position:fixed;inset:0;z-index:9999;background:rgba(2,30,30,.72);
  display:flex;align-items:center;justify-content:center;padding:1rem;}
.mc-modal{background:#fff;border:1px solid #d0dde0;border-radius:12px;
  width:100%;max-width:520px;max-height:92vh;overflow-y:auto;
  box-shadow:0 24px 64px rgba(0,0,0,.32);}
.mc-modal-head{background:var(--teal,#02ADA5);color:#fff;padding:1.25rem 1.5rem;
  border-radius:12px 12px 0 0;}
.mc-modal-head h2{font-size:1.05rem;margin:0 0 .3rem;}
.mc-modal-head p{font-size:.8rem;margin:0;opacity:.88;}
.mc-modal-body{padding:1.5rem;}
.mc-field{margin-bottom:1.1rem;}
.mc-field>label{display:block;font-size:.82rem;font-weight:700;margin-bottom:.35rem;color:#1a3340;}
.mc-field input,.mc-field select{width:100%;padding:.55rem .75rem;
  border:1.5px solid #ccd8dd;border-radius:6px;font-size:.88rem;
  font-family:inherit;background:#fff;color:#1a3340;transition:border-color .15s;}
.mc-field input:focus,.mc-field select:focus{outline:none;border-color:var(--teal,#02ADA5);}
.mc-note{font-size:.73rem;color:#7a9099;margin:.3rem 0 0;}
.mc-radio-grp{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.2rem;}
.mc-radio-grp label{display:flex;align-items:center;gap:.35rem;cursor:pointer;
  padding:.35rem .7rem;border:1.5px solid #ccd8dd;border-radius:100px;
  font-size:.8rem;font-weight:400;transition:border-color .15s,background .15s;}
.mc-radio-grp input[type=radio]{display:none;}
.mc-radio-grp label:has(input:checked){
  border-color:var(--teal,#02ADA5);
  background:rgba(2,173,165,.1);color:var(--teal,#02ADA5);font-weight:600;}
.mc-err{color:#c0392b;font-size:.78rem;margin:.4rem 0 0;display:none;}
.mc-save-btn,.mc-submit-btn{
  display:inline-flex;align-items:center;gap:.4rem;
  padding:.6rem 1.2rem;background:var(--teal,#02ADA5);color:#fff;
  border:none;border-radius:6px;font-size:.85rem;font-weight:700;
  cursor:pointer;transition:opacity .15s;font-family:inherit;}
.mc-save-btn{display:block;width:100%;justify-content:center;margin-top:.75rem;}
.mc-save-btn:hover,.mc-submit-btn:hover{opacity:.85;}
.mc-save-btn:disabled,.mc-submit-btn:disabled{opacity:.45;cursor:default;}

/* panels */
.mc-panel{border:2px solid var(--teal,#02ADA5);border-radius:10px;
  margin:1.75rem 0;overflow:hidden;}
.mc-panel-head{background:var(--teal,#02ADA5);color:#fff;
  padding:.65rem 1.2rem;display:flex;align-items:center;gap:.65rem;}
.mc-badge{background:rgba(255,255,255,.22);border-radius:100px;
  font-size:.67rem;font-weight:800;padding:.2rem .65rem;
  letter-spacing:.06em;white-space:nowrap;}
.mc-panel-head-text{flex:1;}
.mc-panel-head-text h3{margin:0;font-size:.95rem;}
.mc-panel-head-text p{margin:.15rem 0 0;font-size:.77rem;opacity:.88;}
.mc-timer{background:rgba(255,255,255,.18);border-radius:100px;
  font-size:.73rem;font-weight:600;padding:.2rem .65rem;white-space:nowrap;}
.mc-panel-body{padding:1.2rem 1.25rem;}
.mc-q{margin-bottom:1.1rem;}
.mc-q>label{display:block;font-size:.83rem;font-weight:600;margin-bottom:.4rem;color:#1a3340;}
.mc-q textarea{width:100%;min-height:74px;padding:.55rem .75rem;
  border:1.5px solid #ccd8dd;border-radius:6px;font-size:.83rem;
  font-family:inherit;resize:vertical;background:#fff;color:#1a3340;
  transition:border-color .15s;}
.mc-q textarea:focus{outline:none;border-color:var(--teal,#02ADA5);}
.mc-q select{width:100%;padding:.55rem .75rem;border:1.5px solid #ccd8dd;
  border-radius:6px;font-size:.83rem;font-family:inherit;
  background:#fff;color:#1a3340;}
.mc-slider-row{display:flex;align-items:center;gap:.75rem;margin-top:.3rem;}
.mc-slider-row input[type=range]{flex:1;accent-color:var(--teal,#02ADA5);cursor:pointer;}
.mc-slider-val{min-width:2.75rem;text-align:center;font-size:1.05rem;
  font-weight:700;color:var(--teal,#02ADA5);}
.mc-scale-lbl{display:flex;justify-content:space-between;
  font-size:.68rem;color:#7a9099;margin-top:.2rem;}
.mc-row-hint{font-size:.73rem;color:#7a9099;margin-top:.25rem;}

/* done markers */
.mc-done{display:flex;align-items:center;gap:.5rem;
  margin:1.25rem 0;padding:.65rem 1rem;
  background:#e6faf4;color:#0a7a5a;border:1.5px solid #0a7a5a;
  border-radius:8px;font-size:.85rem;font-weight:600;}
.mc-done.pre-done{border-color:var(--teal,#02ADA5);background:rgba(2,173,165,.08);color:var(--teal,#02ADA5);}

/* profile bar */
.mc-profile-bar{display:none;}
.mc-profile-bar .mc-pb-name{font-weight:700;margin-right:.25rem;}
.mc-profile-bar .mc-pb-detail{opacity:.82;font-size:.75rem;}
.mc-profile-bar button{display:none;}
.mc-profile-bar button:hover{background:rgba(255,255,255,.35);}
`;
  const s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);
}

// ── Profile bar ───────────────────────────────────────────────────────────────
function _renderProfileBar() {
  const p = getProfile();
  if (!p) return;
  const bar = document.createElement('div');
  bar.className = 'mc-profile-bar';
  bar.id = 'mc-profile-bar';
  bar.innerHTML = `
    <span class="mc-pb-name">👤 ${_esc(p.name)}</span>
    <span class="mc-pb-detail">${_esc(p.kelas)}</span>
    <span class="mc-pb-detail">&middot; ${_esc(p.matric)}</span>
    <button id="mc-edit-btn" title="Edit your details">Edit details</button>`;
  document.body.insertBefore(bar, document.body.firstChild);
  document.getElementById('mc-edit-btn').addEventListener('click', () => {
    bar.remove();
    _showProfileModal(() => { _renderProfileBar(); _initPanels(); });
  });
}

// ── Profile modal ─────────────────────────────────────────────────────────────
function _showProfileModal(onDone) {
  const existing = document.getElementById('mc-overlay');
  if (existing) existing.remove();

  const ov = document.createElement('div');
  ov.className = 'mc-overlay';
  ov.id = 'mc-overlay';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-label', 'Student Registration');

  ov.innerHTML = `
<div class="mc-modal">
  <div class="mc-modal-head">
    <h2>🎓 Student Registration</h2>
    <p>Your details are saved on this device and sent to your instructor's spreadsheet.
       You will not be asked again after this.</p>
  </div>
  <div class="mc-modal-body">
    <div class="mc-field">
      <label for="mc-f-name">Full Name</label>
      <input type="text" id="mc-f-name" placeholder="e.g. Ahmad bin Ibrahim" autocomplete="name">
    </div>
    <div class="mc-field">
      <label>Gender</label>
      <div class="mc-radio-grp">
        <label><input type="radio" name="mc-gender" value="Male"><span>Male</span></label>
        <label><input type="radio" name="mc-gender" value="Female"><span>Female</span></label>
        <label><input type="radio" name="mc-gender" value="Prefer not to say"><span>Prefer not to say</span></label>
      </div>
    </div>
    <div class="mc-field">
      <label for="mc-f-mykid">MyKid / IC Number</label>
      <input type="text" id="mc-f-mykid" placeholder="e.g. 050312-06-1234" autocomplete="off"
             inputmode="numeric">
      <p class="mc-note">School students: MyKid number &nbsp;·&nbsp; University students: MyKAD / IC number.</p>
    </div>
    <div class="mc-field">
      <label for="mc-f-matric">Matric ID / Student ID</label>
      <input type="text" id="mc-f-matric" placeholder="e.g. CA21057" autocomplete="off">
    </div>
    <div class="mc-field">
      <label for="mc-f-kelas">Class / Programme</label>
      <input type="text" id="mc-f-kelas" placeholder="e.g. BKTC 2, or 4 Sains 1" autocomplete="off">
      <p class="mc-note">Write your class name or programme as shown on your timetable.</p>
    </div>
    <div class="mc-field">
      <label for="mc-f-school-code">School / Institution Code <span style="color:#e55">✱</span></label>
      <input type="text" id="mc-f-school-code" placeholder="e.g. SKB001 or UMPSA" autocomplete="off">
    </div>
    <div>
      <label for="mc-f-school">Institution / School Name <span style="color:#e55">✱</span></label>
      <input type="text" id="mc-f-school" placeholder="e.g. SMK Semambu Kuantan" autocomplete="organization">
    </div>
    <div class="mc-field">
      <label for="mc-f-age">Age</label>
      <input type="number" id="mc-f-age" placeholder="e.g. 16" min="7" max="99" inputmode="numeric">
    </div>
    <div class="mc-field">
      <label for="mc-f-state">State</label>
      <select id="mc-f-state">
        <option value="">— select state —</option>
        <option>Johor</option>
        <option>Kedah</option>
        <option>Kelantan</option>
        <option>Melaka</option>
        <option>Negeri Sembilan</option>
        <option>Pahang</option>
        <option>Perak</option>
        <option>Perlis</option>
        <option>Pulau Pinang</option>
        <option>Sabah</option>
        <option>Sarawak</option>
        <option>Selangor</option>
        <option>Terengganu</option>
        <option>Kuala Lumpur</option>
        <option>Labuan</option>
        <option>Putrajaya</option>
      </select>
    </div>
    <div class="mc-field">
      <label for="mc-f-phone">Contact Number</label>
      <input type="tel" id="mc-f-phone" placeholder="e.g. 0123456789" autocomplete="tel" inputmode="tel">
    </div>
    <div class="mc-field">
      <label for="mc-f-email">Email Address</label>
      <input type="email" id="mc-f-email" placeholder="e.g. ahmad@student.edu.my" autocomplete="email" inputmode="email">
    </div>
    <p class="mc-err" id="mc-reg-err">Please fill in all fields before continuing.</p>
    <button class="mc-save-btn" id="mc-reg-btn">Save &amp; begin &#8594;</button>
  </div>
</div>`;

  document.body.appendChild(ov);
  document.getElementById('mc-f-name').focus();

  document.getElementById('mc-reg-btn').addEventListener('click', () => {
    const name   = document.getElementById('mc-f-name').value.trim();
    const gender = (document.querySelector('input[name="mc-gender"]:checked') || {}).value || '';
    const mykid  = document.getElementById('mc-f-mykid').value.trim();
    const matric = document.getElementById('mc-f-matric').value.trim();
    const kelas  = document.getElementById('mc-f-kelas').value.trim();
    const school = document.getElementById('mc-f-school').value.trim();
    const school_code = document.getElementById('mc-f-school-code').value.trim();
    const state  = document.getElementById('mc-f-state').value;
    const age    = document.getElementById('mc-f-age').value.trim();
    const phone  = document.getElementById('mc-f-phone').value.trim();
    const email  = document.getElementById('mc-f-email').value.trim();
    const errEl  = document.getElementById('mc-reg-err');

    if (!name || !gender || !mykid || !matric || !kelas || !school_code || !school || !state || !age || !phone || !email) {
      errEl.style.display = 'block'; return;
    }
    errEl.style.display = 'none';

    const profile = { name, gender, mykid, matric, kelas, school, school_code, state, age, phone, email };
    saveProfile(profile);
    // Registration data saved to localStorage; bundled into post-activity POST

    ov.remove();
    onDone(profile);
  });
}

// ── Stored pre-data and timers ────────────────────────────────────────────────
let _preData     = {};
let _startTime   = null;
let _midTimer    = null;

// ── Pre-activity panel ────────────────────────────────────────────────────────
function _renderPrePanel() {
  if (ACT_META.tier === 0) return;           // Activity 0 — no pre panel

  const doneKey = `mc_pre_done_${ACT_NUM}`;
  if (lsGet(doneKey) === '1') {
    _preData   = lsGetObj(`mc_pre_data_${ACT_NUM}`) || {};
    _startTime = Date.now();
    _startMidTimer();
    _insertAfterProgressBar(_doneMark('✓ Before-activity answers already recorded', 'pre-done'));
    return;
  }

  const panel = document.createElement('div');
  panel.className = 'mc-panel';
  panel.id = 'mc-pre-panel';
  panel.innerHTML = `
<div class="mc-panel-head">
  <span class="mc-badge">BEFORE YOU START</span>
  <div class="mc-panel-head-text">
    <h3>Before-Activity Check-In</h3>
    <p>Answer these three questions first, then work through the activity below.</p>
  </div>
  <span class="mc-timer">~2 min</span>
</div>
<div class="mc-panel-body">
  <div class="mc-q">
    <label>How confident are you that you can complete this activity?
      &nbsp;<strong id="mc-pre-cv">5</strong> / 10</label>
    <div class="mc-slider-row">
      <span style="font-size:.75rem">Not sure</span>
      <input type="range" id="mc-pre-conf" min="1" max="10" value="5">
      <span style="font-size:.75rem">Very sure</span>
    </div>
    <div class="mc-scale-lbl"><span>1</span><span>5</span><span>10</span></div>
  </div>
  <div class="mc-q">
    <label>What percentage of this activity do you predict you will successfully complete?
      &nbsp;<strong id="mc-pre-pv">50</strong>%</label>
    <div class="mc-slider-row">
      <span style="font-size:.75rem">0 %</span>
      <input type="range" id="mc-pre-pred" min="0" max="100" value="50" step="5">
      <span style="font-size:.75rem">100 %</span>
    </div>
    <div class="mc-scale-lbl"><span>0%</span><span>50%</span><span>100%</span></div>
  </div>
  <div class="mc-q">
    <label for="mc-pre-hard">What do you think will be the hardest step in this activity, and why?</label>
    <textarea id="mc-pre-hard" placeholder="Write a sentence or two about where you expect to get stuck…"></textarea>
  </div>
  <p class="mc-err" id="mc-pre-err">Please write something in the text box before starting.</p>
  <button class="mc-submit-btn" id="mc-pre-btn">&#9654; Save answers &amp; start activity</button>
</div>`;

  _insertAfterProgressBar(panel);

  const confSl = panel.querySelector('#mc-pre-conf');
  const predSl = panel.querySelector('#mc-pre-pred');
  confSl.addEventListener('input', () => { panel.querySelector('#mc-pre-cv').textContent = confSl.value; });
  predSl.addEventListener('input', () => { panel.querySelector('#mc-pre-pv').textContent = predSl.value; });

  panel.querySelector('#mc-pre-btn').addEventListener('click', () => {
    const hard = panel.querySelector('#mc-pre-hard').value.trim();
    const errEl = panel.querySelector('#mc-pre-err');
    if (!hard) { errEl.style.display = 'block'; panel.querySelector('#mc-pre-hard').focus(); return; }
    errEl.style.display = 'none';

    _preData = { pre_confidence: +confSl.value, pre_prediction: +predSl.value, pre_hardest: hard };
    _startTime = Date.now();
    lsSet(doneKey, '1');
    lsSetObj(`mc_pre_data_${ACT_NUM}`, _preData);
    // Pre data saved to localStorage; bundled into final POST

    panel.replaceWith(_doneMark('✓ Before-activity answers saved — you can now work through the activity', 'pre-done'));
    _startMidTimer();
  });
}

function _insertAfterProgressBar(el) {
  const pb   = document.querySelector('.progress-bar');
  const wrap = document.querySelector('.wrap');
  if (pb && pb.nextSibling) {
    pb.parentNode.insertBefore(el, pb.nextSibling);
  } else if (wrap) {
    wrap.insertBefore(el, wrap.firstChild);
  }
}

// ── Mid-activity checkpoint ───────────────────────────────────────────────────
function _startMidTimer() {
  clearTimeout(_midTimer);
  _midTimer = setTimeout(_showMidPanel, 20 * 60 * 1000); // 20 minutes
}

function _showMidPanel() {
  if (ACT_META.tier === 0) return;
  const doneKey = `mc_mid_done_${ACT_NUM}`;
  if (lsGet(doneKey) === '1') return;

  const existing = document.getElementById('mc-mid-panel');
  if (existing) { existing.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

  const panel = document.createElement('div');
  panel.className = 'mc-panel';
  panel.id = 'mc-mid-panel';
  panel.innerHTML = `
<div class="mc-panel-head">
  <span class="mc-badge">CHECKPOINT</span>
  <div class="mc-panel-head-text">
    <h3>Mid-Activity Check-In</h3>
    <p>Pause for two minutes and reflect on how it is going.</p>
  </div>
  <span class="mc-timer">~2 min</span>
</div>
<div class="mc-panel-body">
  <div class="mc-q">
    <label for="mc-mid-w">Is your current approach working?</label>
    <select id="mc-mid-w">
      <option value="">— choose one —</option>
      <option value="Yes">Yes — it is working</option>
      <option value="Partially">Partially — making progress but stuck on something</option>
      <option value="No">No — I am stuck and not sure what to try next</option>
    </select>
  </div>
  <div class="mc-q">
    <label for="mc-mid-r">Describe what you just figured out, or what is currently blocking you.</label>
    <textarea id="mc-mid-r" placeholder="Write honestly — no marks for this, only for your own learning…"></textarea>
  </div>
  <p class="mc-err" id="mc-mid-err">Please select an option and write something before saving.</p>
  <button class="mc-submit-btn" id="mc-mid-btn">Save checkpoint &amp; continue</button>
</div>`;

  // Insert before the quiz section, or before stepnav, or at end of wrap
  const quiz    = document.getElementById('quiz');
  const stepnav = document.querySelector('.stepnav');
  const wrap    = document.querySelector('.wrap');
  if (quiz)         quiz.parentNode.insertBefore(panel, quiz);
  else if (stepnav) stepnav.parentNode.insertBefore(panel, stepnav);
  else if (wrap)    wrap.appendChild(panel);

  panel.scrollIntoView({ behavior: 'smooth', block: 'center' });

  panel.querySelector('#mc-mid-btn').addEventListener('click', () => {
    const w    = panel.querySelector('#mc-mid-w').value;
    const r    = panel.querySelector('#mc-mid-r').value.trim();
    const errEl = panel.querySelector('#mc-mid-err');
    if (!w || !r) { errEl.style.display = 'block'; return; }
    errEl.style.display = 'none';

    lsSet(doneKey, '1');
    lsSetObj(`mc_mid_data_${ACT_NUM}`, { mid_working: w, mid_reflection: r });
    panel.replaceWith(_doneMark('✓ Checkpoint saved'));
  });
}

// ── Post-activity panel ───────────────────────────────────────────────────────
function _renderPostPanel() {
  if (ACT_META.tier === 0) return;

  const doneKey = `mc_post_done_${ACT_NUM}`;
  if (lsGet(doneKey) === '1') {
    _insertBeforeStepnav(_doneMark('✓ After-activity reflection already recorded'));
    return;
  }

  const concept = ACT_META.concept || 'the key concept from this activity';

  const panel = document.createElement('div');
  panel.className = 'mc-panel';
  panel.id = 'mc-post-panel';
  panel.innerHTML = `
<div class="mc-panel-head">
  <span class="mc-badge">AFTER YOU FINISH</span>
  <div class="mc-panel-head-text">
    <h3>After-Activity Reflection</h3>
    <p>Four questions before you move to the next activity. About 5 minutes.</p>
  </div>
  <span class="mc-timer">~5 min</span>
</div>
<div class="mc-panel-body">
  <div class="mc-q">
    <label>What percentage of this activity did you successfully complete?
      &nbsp;<strong id="mc-post-cpv">70</strong>%</label>
    <div class="mc-slider-row">
      <span style="font-size:.75rem">0 %</span>
      <input type="range" id="mc-post-comp" min="0" max="100" value="70" step="5">
      <span style="font-size:.75rem">100 %</span>
    </div>
    <div class="mc-scale-lbl"><span>0%</span><span>50%</span><span>100%</span></div>
    <p class="mc-row-hint">Be honest — this is for your own reflection, not your grade.</p>
  </div>
  <div class="mc-q">
    <label>How confident do you feel about this topic now?
      &nbsp;<strong id="mc-post-cfv">5</strong> / 10</label>
    <div class="mc-slider-row">
      <span style="font-size:.75rem">Not sure</span>
      <input type="range" id="mc-post-conf" min="1" max="10" value="5">
      <span style="font-size:.75rem">Very sure</span>
    </div>
    <div class="mc-scale-lbl"><span>1</span><span>5</span><span>10</span></div>
  </div>
  <div class="mc-q">
    <label for="mc-post-surp">What surprised you most about how this worked?</label>
    <textarea id="mc-post-surp"
      placeholder="Something you did not expect, or that made you think differently…"></textarea>
  </div>
  <div class="mc-q">
    <label for="mc-post-xfr">How would you explain <em style="color:var(--teal,#02ADA5)">${_esc(concept)}</em> to a classmate who is stuck?</label>
    <textarea id="mc-post-xfr"
      placeholder="Write as if you are explaining out loud to someone who has not done this yet…"></textarea>
  </div>
  <p class="mc-err" id="mc-post-err">Please fill in the two text boxes before saving.</p>
  <button class="mc-submit-btn" id="mc-post-btn">Save reflection &#10003;</button>
</div>`;

  _insertBeforeStepnav(panel);

  const compSl = panel.querySelector('#mc-post-comp');
  const confSl = panel.querySelector('#mc-post-conf');
  compSl.addEventListener('input', () => { panel.querySelector('#mc-post-cpv').textContent = compSl.value; });
  confSl.addEventListener('input', () => { panel.querySelector('#mc-post-cfv').textContent = confSl.value; });

  panel.querySelector('#mc-post-btn').addEventListener('click', () => {
    const surp = panel.querySelector('#mc-post-surp').value.trim();
    const xfr  = panel.querySelector('#mc-post-xfr').value.trim();
    const errEl = panel.querySelector('#mc-post-err');
    if (!surp || !xfr) { errEl.style.display = 'block'; return; }
    errEl.style.display = 'none';

    const stored    = lsGetObj(`mc_pre_data_${ACT_NUM}`) || _preData;
    const completion = +compSl.value;
    const delta      = (stored.pre_prediction != null)
                       ? completion - stored.pre_prediction : null;

    lsSet(doneKey, '1');
    // Bundle ALL phases into one consolidated row (1 student = 1 row per activity)
    const _mid = lsGetObj(`mc_mid_data_${ACT_NUM}`) || {};
    submitToSheets({
      phase:             'activity_complete',
      pre_confidence:    stored.pre_confidence    ?? null,
      pre_prediction:    stored.pre_prediction    ?? null,
      pre_hardest:       stored.pre_hardest       ?? null,
      mid_working:       _mid.mid_working         ?? null,
      mid_reflection:    _mid.mid_reflection      ?? null,
      post_completion:   completion,
      post_confidence:   +confSl.value,
      post_surprise:     surp,
      post_transfer:     xfr,
      calibration_delta: delta,
      time_on_task_min:  _startTime
                         ? Math.round((Date.now() - _startTime) / 60000) : null,
    });

    panel.replaceWith(_doneMark('✓ Reflection saved — you can now move to the next activity'));
  });
}

function _insertBeforeStepnav(el) {
  const stepnav = document.querySelector('.stepnav');
  const wrap    = document.querySelector('.wrap');
  if (stepnav) stepnav.parentNode.insertBefore(el, stepnav);
  else if (wrap) wrap.appendChild(el);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function _doneMark(msg, extra) {
  const d = document.createElement('div');
  d.className = 'mc-done' + (extra ? ' ' + extra : '');
  d.innerHTML = '<span aria-hidden="true">✓</span> ' + _esc(msg);
  return d;
}
function _esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (ACT_NUM === null || !ACT_META) return;

  _injectStyles();

  const profile = getProfile();
  if (!profile) {
    _showProfileModal(() => { _renderProfileBar(); _initPanels(); });
  } else {
    _renderProfileBar();
    _initPanels();
  }
});

function _initPanels() {
  _renderPrePanel();
  _renderPostPanel();
}

/* ── Public API: open edit-profile modal from anywhere (e.g. nav chip) ── */
window.mcEditProfile = function() {
  var bar = document.getElementById('mc-profile-bar');
  if (bar) bar.remove();
  _showProfileModal(function() { _renderProfileBar(); _initPanels(); });
};
