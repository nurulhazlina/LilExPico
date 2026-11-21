/**
 * LilEx LMS — Google Apps Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Single Web App endpoint for ALL LMS pages:
 *   index.html · activity-1..13.html (metacog.js) · activity2/4/5/8/10/13-tiers.html
 *   pre-test.html · post-test.html
 *
 * HOW TO DEPLOY
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Paste this entire file, replacing any existing code
 * 3. Fill in SPREADSHEET_ID below (copy from your Sheet URL)
 * 4. Click Deploy → New deployment → Web app
 *    · Execute as: Me
 *    · Who has access: Anyone
 * 5. Copy the deployment URL and paste it into every HTML file's GAS_URL / METACOG.SHEETS_URL
 *
 * TAB NAMES REQUIRED IN YOUR SHEET (23 tabs):
 *   Log, Students,
 *   Act1, Act2, Act3, Act4, Act5, Act6, Act7, Act8, Act9, Act10, Act11, Act12, Act13,
 *   Act2_Tiered, Act4_Tiered, Act5_Tiered, Act8_Tiered, Act10_Tiered, Act13_Tiered,
 *   PreTest, PostTest
 */

// ── CONFIG ────────────────────────────────────────────────────────────────────
var SPREADSHEET_ID = ''; // ← Paste your Google Sheet ID here (from the URL)

// ── Section label → short column name map (for PreTest / PostTest) ────────────
var SEC_MAP = {
  'Module 1 &middot; Loops &amp; Timing'   : 'M1',
  'Module 1 · Loops &amp; Timing'          : 'M1',
  'Module 1 · Loops & Timing'              : 'M1',
  'Module 2 &middot; Digital Input'        : 'M2',
  'Module 2 · Digital Input'               : 'M2',
  'Module 3 &middot; Making Decisions'     : 'M3',
  'Module 3 · Making Decisions'            : 'M3',
  'Module 4 &middot; Sensors &amp; Numbers': 'M4',
  'Module 4 · Sensors &amp; Numbers'       : 'M4',
  'Module 4 · Sensors & Numbers'           : 'M4',
  'Module 5 &middot; Internet &amp; Data'  : 'M5',
  'Module 5 · Internet &amp; Data'         : 'M5',
  'Module 5 · Internet & Data'             : 'M5',
  'Module 6 &middot; Live Dashboard'       : 'M6',
  'Module 6 · Live Dashboard'              : 'M6'
};

function shortSec(label) {
  return SEC_MAP[label] || label;
}

// ── Entry point ───────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss   = SpreadsheetApp.openById(SPREADSHEET_ID);

    appendLog(ss, data);                   // always log everything raw

    var event = data.event || '';
    var phase = data.phase || '';

    // ── index.html registration
    if (event === 'index_register') {
      upsert(ss, 'Students', data.matric, studentsRow(data));

    // ── Regular activities via metacog.js (activity-1 to activity-13)
    } else if (phase === 'activity_complete') {
      var actTab = 'Act' + (data.activity_id || '');
      upsert(ss, actTab, data.student_matric, activityRow(data));

    // ── Tiered activities (activity2/4/5/8/10/13-tiers.html)
    } else if (event === 'act_complete') {
      var TIERED_MAP = {
        a2: 'Act2_Tiered', a4: 'Act4_Tiered', a5:  'Act5_Tiered',
        a8: 'Act8_Tiered', a10:'Act10_Tiered', a13: 'Act13_Tiered'
      };
      var tieredTab = TIERED_MAP[data.activity];
      if (tieredTab) upsert(ss, tieredTab, data.matric, tieredRow(data));

    // ── Pre-test
    } else if (event === 'pretest_submit') {
      upsert(ss, 'PreTest', data.student_matric, pretestRow(data));

    // ── Post-test
    } else if (event === 'posttest_submit') {
      upsert(ss, 'PostTest', data.student_matric, posttestRow(data));
    }

    return ok();
  } catch (err) {
    Logger.log('LilEx GAS error: ' + err.toString());
    return ok('error');
  }
}

// ── UPSERT: find existing row by matric, update it; else append ───────────────
function upsert(ss, tabName, matric, rowObj) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) { Logger.log('Tab not found: ' + tabName); return; }

  var headers = ensureHeaders(sheet, Object.keys(rowObj));
  var values  = headers.map(function(h) {
    return rowObj[h] !== undefined && rowObj[h] !== null ? rowObj[h] : '';
  });

  if (!matric) { sheet.appendRow(values); return; }

  // Search for existing matric in column index
  var matricIdx = headers.indexOf('matric');
  if (matricIdx < 0) { sheet.appendRow(values); return; }

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var matricCol  = sheet.getRange(2, matricIdx + 1, lastRow - 1, 1).getValues();
    for (var r = 0; r < matricCol.length; r++) {
      if (String(matricCol[r][0]).toLowerCase() === String(matric).toLowerCase()) {
        sheet.getRange(r + 2, 1, 1, values.length).setValues([values]);
        return;
      }
    }
  }
  sheet.appendRow(values);
}

// ── ENSURE HEADERS: add any missing columns to row 1 ─────────────────────────
function ensureHeaders(sheet, keys) {
  var existing = [];
  if (sheet.getLastRow() > 0 && sheet.getLastColumn() > 0) {
    existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
               .filter(function(h) { return h !== ''; });
  }
  var toAdd = keys.filter(function(k) { return existing.indexOf(k) === -1; });
  if (toAdd.length) {
    toAdd.forEach(function(k) { existing.push(k); });
    sheet.getRange(1, 1, 1, existing.length).setValues([existing]);
  }
  return existing;
}

// ── LOG: append one raw row ───────────────────────────────────────────────────
function appendLog(ss, data) {
  var sheet = ss.getSheetByName('Log');
  if (!sheet) return;
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['timestamp', 'event', 'matric', 'raw_json']);
  }
  sheet.appendRow([
    new Date().toISOString(),
    data.event || data.phase || '',
    data.matric || data.student_matric || '',
    JSON.stringify(data)
  ]);
}

// ── ROW BUILDERS ─────────────────────────────────────────────────────────────

// Students tab — from index.html index_register event
function studentsRow(d) {
  return {
    timestamp : d.ts ? new Date(d.ts).toISOString() : new Date().toISOString(),
    name      : d.name      || '',
    matric    : d.matric    || '',
    kelas     : d.kelas     || '',
    mykid     : d.mykid     || '',
    age       : d.age       || '',
    gender    : d.gender    || '',
    phone     : d.phone     || '',
    email     : d.email     || '',
    school    : d.school    || '',
    state     : d.state     || '',
    lat       : d.lat       || '',
    lng       : d.lng       || '',
    geo_acc   : d.geo_acc   || '',
    geo_place : d.geo_place || ''
  };
}

// Act1–Act13 tabs — from metacog.js activity_complete phase
function activityRow(d) {
  return {
    timestamp         : d.timestamp || new Date().toISOString(),
    matric            : d.student_matric  || '',
    name              : d.student_name    || '',
    gender            : d.student_gender  || '',
    kelas             : d.student_class   || '',
    school            : d.student_school  || '',
    state             : d.student_state   || '',
    activity_id       : d.activity_id     || '',
    activity_title    : d.activity_title  || '',
    week              : d.week            || '',
    tier              : d.tier            || '',
    pre_confidence    : val(d.pre_confidence),
    pre_prediction    : val(d.pre_prediction),
    pre_hardest       : d.pre_hardest     || '',
    mid_working       : d.mid_working     || '',
    mid_reflection    : d.mid_reflection  || '',
    post_completion   : val(d.post_completion),
    post_confidence   : val(d.post_confidence),
    post_surprise     : d.post_surprise   || '',
    post_transfer     : d.post_transfer   || '',
    calibration_delta : val(d.calibration_delta),
    time_on_task_min  : val(d.time_on_task_min)
  };
}

// Act2/4/5/8/10/13_Tiered tabs — from tiered activity act_complete event
function tieredRow(d) {
  var cal   = d.cal            || {};
  var t1    = d.t1_submitted   || {};
  var t2    = d.t2_submitted   || {};
  var t3    = d.t3_submitted   || {};
  var t4    = d.t4_submitted   || {};
  var cc    = d.concept_check  || {};
  var pc    = d.post_cal       || {};
  var refl2 = d.reflection_2   || {};

  return {
    timestamp            : new Date().toISOString(),
    matric               : d.matric                || '',
    name                 : d.name                  || '',
    activity             : d.activity              || '',
    // Calibration (pre)
    cal_confidence       : val(cal.confidence),
    cal_predicted_score  : val(cal.predicted_score),
    cal_reflection_1     : cal.reflection_1        || '',
    // Tier 1 MCQ
    t1_first_attempt_pct : val(d.t1_first_attempt_pct),
    t1_score_pct         : val(t1.score),
    t1_attempts          : val(t1.attempts),
    t1_passed            : t1.passed !== undefined ? t1.passed : '',
    // Tier 2 coding
    t2_attempts          : val(t2.attempts),
    t2_passed            : t2.passed !== undefined ? t2.passed : '',
    // Tier 3 & 4
    t3_attempts          : val(t3.attempts),
    t4_attempts          : val(t4.attempts),
    // Metacognition
    calibration_delta    : val(d.calibration_delta),
    // Concept check (10 MCQ)
    concept_score        : val(cc.score),
    concept_pct          : val(cc.pct),
    // Post calibration
    post_confidence      : val(pc.post_confidence),
    post_actual_pct      : val(pc.actual_pct),
    jr1                  : pc.jr1  || '',
    jr2                  : pc.jr2  || '',
    jr3                  : pc.jr3  || '',
    // Reflection
    reflection_2         : refl2.text || (typeof refl2 === 'string' ? refl2 : ''),
    activity_complete_ts : d.activity_complete
                           ? new Date(d.activity_complete).toISOString() : ''
  };
}

// PreTest tab — from pre-test.html pretest_submit event
function pretestRow(d) {
  var sec  = d.sec_scores  || {};
  var open = d.open        || {};
  var mcq  = d.mcq_responses || {};
  var stu  = d.student     || {};

  var row = {
    timestamp   : d.ts ? new Date(d.ts).toISOString() : new Date().toISOString(),
    matric      : d.student_matric || stu.matric || '',
    name        : d.student_name   || stu.name   || '',
    score       : val(d.score),
    total       : val(d.total),
    pct         : val(d.pct)
  };

  // Per-module section scores (out of 10 each)
  Object.keys(sec).forEach(function(label) {
    var key = 'sec_' + shortSec(label);
    row[key] = val(sec[label]);
  });

  // Open-ended prior experience questions
  row['PO1'] = open.PO1 || '';
  row['PO2'] = open.PO2 || '';
  row['PO3'] = open.PO3 || '';

  // Individual MCQ responses Q1–Q60
  for (var q = 1; q <= 60; q++) {
    row['Q' + q] = mcq[q] !== undefined ? mcq[q] : (mcq[String(q)] !== undefined ? mcq[String(q)] : '');
  }

  return row;
}

// PostTest tab — same as PreTest plus Likert + different open-ended
function posttestRow(d) {
  var open   = d.open   || {};
  var likert = d.likert || {};
  var mcq    = d.mcq_responses || {};
  var sec    = d.sec_scores    || {};
  var stu    = d.student       || {};

  var row = {
    timestamp : d.ts ? new Date(d.ts).toISOString() : new Date().toISOString(),
    matric    : d.student_matric || stu.matric || '',
    name      : d.student_name   || stu.name   || '',
    score     : val(d.score),
    total     : val(d.total),
    pct       : val(d.pct)
  };

  // Per-module section scores
  Object.keys(sec).forEach(function(label) {
    var key = 'sec_' + shortSec(label);
    row[key] = val(sec[label]);
  });

  // Likert scale L1–L12 (1–5 ratings)
  for (var l = 1; l <= 12; l++) {
    row['L' + l] = likert['L' + l] !== undefined ? likert['L' + l] : '';
  }

  // Open-ended reflection questions
  row['OE1'] = open.OE1 || '';
  row['OE2'] = open.OE2 || '';
  row['OE3'] = open.OE3 || '';
  row['OE4'] = open.OE4 || '';

  // Individual MCQ responses Q1–Q60
  for (var q = 1; q <= 60; q++) {
    row['Q' + q] = mcq[q] !== undefined ? mcq[q] : (mcq[String(q)] !== undefined ? mcq[String(q)] : '');
  }

  return row;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function val(v) {
  return (v !== undefined && v !== null) ? v : '';
}

function ok() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── SETUP: run once manually to create all 23 tabs ───────────────────────────
function setupTabs() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var TABS = [
    'Log', 'Students',
    'Act1','Act2','Act3','Act4','Act5','Act6','Act7',
    'Act8','Act9','Act10','Act11','Act12','Act13',
    'Act2_Tiered','Act4_Tiered','Act5_Tiered',
    'Act8_Tiered','Act10_Tiered','Act13_Tiered',
    'PreTest','PostTest'
  ];
  TABS.forEach(function(name) {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
      Logger.log('Created tab: ' + name);
    } else {
      Logger.log('Tab already exists: ' + name);
    }
  });
  // Remove default "Sheet1" if it exists and no data
  var def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0) ss.deleteSheet(def);
  Logger.log('Setup complete.');
}
