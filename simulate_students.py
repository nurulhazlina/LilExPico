"""
LilEx LMS — 5-student simulation
Sends realistic POST data to GAS for every tab:
  Students, PreTest, Act1–Act13, Act2/4/5/8/10/13_Tiered, PostTest
"""

import requests, json, time, random

GAS_URL = 'https://script.google.com/macros/s/AKfycbwEKS3VdUL8CaenRJ80wQ7ynRGE2lUNMdNs9BR5iqfMsD_rsu18e17t5JblEiuLP2RM/exec'

# ── 5 sample students ────────────────────────────────────────────────
STUDENTS = [
    dict(matric='RE25001', name='Ahmad bin Ali',           gender='M', age='19',
         kelas='2BET',  mykid='071203010001', phone='0123456789',
         email='ahmad@student.umpsa.edu.my', school='UMPSA',
         school_code='UMPSA', state='Pahang'),
    dict(matric='RE25002', name='Nurul Izzati binti Hassan', gender='F', age='18',
         kelas='3SCI',  mykid='080512020002', phone='0134567890',
         email='izzati@student.umpsa.edu.my', school='SMK Shah Alam',
         school_code='SKSA02', state='Selangor'),
    dict(matric='RE25003', name='Muhammad Haziq bin Zakaria', gender='M', age='20',
         kelas='BKTC2', mykid='060823030003', phone='0145678901',
         email='haziq@student.umpsa.edu.my', school='SMK Skudai Johor',
         school_code='SKSJ03', state='Johor'),
    dict(matric='RE25004', name='Siti Rahimah binti Mohd',  gender='F', age='19',
         kelas='4SN1',  mykid='070615040004', phone='0156789012',
         email='rahimah@student.umpsa.edu.my', school='SMK Alor Setar',
         school_code='SKAS04', state='Kedah'),
    dict(matric='RE25005', name='Amirul Faiz bin Ibrahim',  gender='M', age='21',
         kelas='BEET3', mykid='051120050005', phone='0167890123',
         email='faiz@student.umpsa.edu.my', school='SMK Ipoh Timur',
         school_code='SKIT05', state='Perak'),
]

ACTIVITIES = [
    (1,  'Introduction to Raspberry Pi & Python', 1),
    (2,  'Loops & Timing',                        1),
    (3,  'GPIO Digital Output',                   2),
    (4,  'GPIO Digital Input',                    2),
    (5,  'PWM & Analog Signals',                  3),
    (6,  'Sensors & Data Reading',                3),
    (7,  'Display & Output Devices',              4),
    (8,  'Motion & Motor Control',                4),
    (9,  'Networking Basics',                     5),
    (10, 'APIs & Web Requests',                   5),
    (11, 'Data Logging & Storage',                6),
    (12, 'Project Planning & Design',             6),
    (13, 'Final Integrated Project',              7),
]

TIERED_ACTS = [2, 4, 5, 8, 10, 13]

PRE_TEXTS  = ['I think I can do most of it','Quite nervous about the coding part',
              'I have some prior experience','Not sure what to expect','Ready to try']
MID_TEXTS  = ['Breaking the problem step by step','Reviewing the examples helped',
              'Collaboration with peers was useful','Referencing past activities',
              'Trial and error approach']
SURPRISES  = ['The GPIO part was easier than I thought','Timing loops were tricky but doable',
              'Python syntax is more intuitive than expected','I did not expect sensors to be this fun',
              'The error messages were actually helpful']
TRANSFERS  = ['I can apply this to my robotics club project','Useful for home automation ideas',
              'I want to build a weather station next','Can use this in my FYP',
              'Thinking of making a smart alarm system']
CAL_REF1   = ['I am confident in my Python basics','I know loops but not GPIO',
               'Some concepts are still unclear','I have done similar projects before',
               'I need to review the timing functions']
JR_TEXTS   = ['The tiered structure helped me build confidence','I struggled at tier 2 but got through it',
               'Concept questions were well-designed','I preferred working through challenges step by step',
               'The calibration phase made me reflect more']
REFLECTIONS= ['Overall a positive learning experience','I want to revisit the harder tiers',
               'This helped me understand the topic deeply','I feel more confident after completing this',
               'I would like more practice on the last tier']

def post(payload, label):
    try:
        r = requests.post(GAS_URL, json=payload, timeout=15,
                          headers={'Content-Type':'application/json'})
        status = json.loads(r.text).get('status','?') if r.text else r.status_code
        print(f"  {'✔' if status=='ok' else '?'} {label} → {status}")
    except Exception as e:
        print(f"  ✘ {label} → {e}")
    time.sleep(0.4)   # be gentle with GAS rate limits

def rnd(lo, hi):  return random.randint(lo, hi)
def pick(lst):    return random.choice(lst)

for idx, stu in enumerate(STUDENTS):
    print(f"\n{'─'*55}")
    print(f"  Student {idx+1}: {stu['name']} ({stu['matric']})")
    print(f"{'─'*55}")

    # ── 1. Registration ─────────────────────────────────────────
    post({**{'event':'index_register'}, **stu}, 'Registration → Students tab')

    # ── 2. Pre-test ─────────────────────────────────────────────
    pre_score = rnd(20, 40)
    sections  = {f'M{i}': rnd(2,7) for i in range(1,7)}
    answers   = {str(i): pick(['A','B','C','D']) for i in range(1,61)}
    post({
        'event':          'pretest_submit',
        'student_matric': stu['matric'],
        'student_name':   stu['name'],
        'student':        stu,
        'score': pre_score, 'total': 60, 'pct': round(pre_score/60*100,1),
        'sections':  sections,
        'outcomes':  {'PO1': rnd(5,12), 'PO2': rnd(5,12), 'PO3': rnd(5,12)},
        'answers':   answers,
    }, 'Pre-test → PreTest tab')

    # ── 3. Regular activities 1–13 (metacog) ────────────────────
    for act_id, act_title, week in ACTIVITIES:
        pre_conf = rnd(2, 5)
        post_conf = min(5, pre_conf + rnd(-1, 2))
        post({
            'phase':              'activity_complete',
            'student_matric':     stu['matric'],
            'student_name':       stu['name'],
            'student_gender':     stu['gender'],
            'student_age':        stu['age'],
            'student_mykid':      stu['mykid'],
            'student_state':      stu['state'],
            'student_class':      stu['kelas'],
            'student_school_code':stu['school_code'],
            'student_school':     stu['school'],
            'student_phone':      stu['phone'],
            'student_email':      stu['email'],
            'activity_id':        str(act_id),
            'activity_title':     act_title,
            'week':               str(week),
            'tier':               str(rnd(1,3)),
            'pre_confidence':     pre_conf,
            'pre_prediction':     pick(PRE_TEXTS),
            'pre_hardest':        f'Understanding {act_title.split()[0].lower()} concepts',
            'mid_working':        pick(MID_TEXTS),
            'mid_reflection':     f'Found the {act_title.split()[-1].lower()} part challenging',
            'post_completion':    rnd(60, 100),
            'post_confidence':    post_conf,
            'post_surprise':      pick(SURPRISES),
            'post_transfer':      pick(TRANSFERS),
            'calibration_delta':  post_conf - pre_conf,
            'time_on_task_min':   rnd(15, 55),
        }, f'Act{act_id} metacog → Act{act_id} tab')

    # ── 4. Tiered activities ────────────────────────────────────
    for act_num in TIERED_ACTS:
        act_key  = f'a{act_num}'
        cal_conf = rnd(50, 90)
        cal_pred = rnd(55, 95)
        concept  = rnd(5, 10)
        post_pct = rnd(60, 100)
        post({
            'event':            'act_complete',
            'activity':         act_key,
            'matric':           stu['matric'],
            'name':             stu['name'],
            'gender':           stu['gender'],
            'age':              stu['age'],
            'mykid':            stu['mykid'],
            'home_state':       stu['state'],
            'class':            stu['kelas'],
            'school_code':      stu['school_code'],
            'institution_name': stu['school'],
            'phone':            stu['phone'],
            'email':            stu['email'],
            'cal_confidence':      cal_conf,
            'cal_predicted_score': cal_pred,
            'cal_reflection_1':    pick(CAL_REF1),
            't1_first_attempt_pct': rnd(40, 90),
            't1_score_pct':     rnd(60, 100),
            't1_attempts':      rnd(1, 3),
            't1_passed':        True,
            't2_attempts':      rnd(1, 3),
            't2_passed':        True,
            't3_attempts':      rnd(1, 4),
            't4_attempts':      rnd(1, 3),
            'calibration_delta': post_pct - cal_pred,
            'concept_score':    concept,
            'concept_pct':      round(concept/10*100,1),
            'post_confidence':  rnd(50, 90),
            'post_actual_pct':  post_pct,
            'jr1':              pick(JR_TEXTS),
            'jr2':              pick(JR_TEXTS),
            'jr3':              pick(JR_TEXTS),
            'reflection_2':     pick(REFLECTIONS),
            'ts':               int(time.time()*1000),
        }, f'Act{act_num} tiered → Act{act_num}_Tiered tab')

    # ── 5. Post-test ────────────────────────────────────────────
    post_score = rnd(35, 55)
    sections   = {f'M{i}': rnd(4,9) for i in range(1,7)}
    answers    = {str(i): pick(['A','B','C','D']) for i in range(1,61)}
    post({
        'event':          'posttest_submit',
        'student_matric': stu['matric'],
        'student_name':   stu['name'],
        'student':        stu,
        'score': post_score, 'total': 60, 'pct': round(post_score/60*100,1),
        'sections':   sections,
        'outcomes':   {f'L{i}': rnd(2,5) for i in range(1,13)},
        'openEnded':  {f'OE{i}': pick(REFLECTIONS) for i in range(1,5)},
        'answers':    answers,
    }, 'Post-test → PostTest tab')

print(f"\n{'═'*55}")
print("  Simulation complete — check your Google Sheet!")
print(f"{'═'*55}\n")
