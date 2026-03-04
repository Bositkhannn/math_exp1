// Make sure THEMES is available
if (typeof THEMES === 'undefined') {
    window.THEMES = {
        blue: { label: "Ko'k", bg: "#0f172a", accent: "#38bdf8" },
        ocean: { label: "Okean", bg: "#0a1628", accent: "#22d3ee" },
        forest: { label: "O'rmon", bg: "#0a1a0e", accent: "#4ade80" },
        sunset: { label: "Quyosh", bg: "#1a0a0a", accent: "#fb923c" },
        lavender: { label: "Binafsha", bg: "#0d0b1e", accent: "#a78bfa" },
        light: { label: "Yorug'", bg: "#f0f4ff", accent: "#3b82f6" }
    };
}

// Global filter variables
let rGradeFilter = 'all';
let rTestFilter = 'all';
let rViewMode = 'list';

// Question editor variables
let editingQId = null;
let qImgData = null;
let qCurrentStep = 1;

// ALLOWED_GRADES is already defined in db.js – use it directly
if (typeof ALLOWED_GRADES === 'undefined') {
    window.ALLOWED_GRADES = ["7-F", "8-F", "9-F", "10-F", "11-F"];
}

// Helper to render a grade dropdown
function renderGradeDropdown(selectId, selectedGrade = '') {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = ALLOWED_GRADES.map(g =>
        `<option value="${g}"${g === selectedGrade ? ' selected' : ''}>${g}</option>`
    ).join('');
}

// Render teacher panel
function renderTeacherPanel() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <nav class="navbar">
        <div class="navbar-brand" style="display:flex;align-items:center;gap:.5rem">
        <img src="${getLogoSrc()}" class="navbar-logo theme-logo" alt="">
        O'qituvchi paneli
    </div>
            <button class="btn btn-ghost btn-sm" onclick="doLogout()">Chiqish</button>
        </nav>

        <div class="main">
            <div class="tab-section active" id="t-sec-overview"></div>
            <div class="tab-section" id="t-sec-questions"></div>
            <div class="tab-section" id="t-sec-tests"></div>
            <div class="tab-section" id="t-sec-daily"></div>
            <div class="tab-section" id="t-sec-results"></div>
            <div class="tab-section" id="t-sec-settings"></div>
            <div class="tab-section" id="t-sec-students"></div>
        </div>

        <!-- Question Editor Drawer -->
        <div class="overlay" id="ov-q" onclick="if(event.target===this) closeDrawer('ov-q')">
            <div class="drawer">
                <div class="drawer-handle"></div>
                <div class="drawer-title" id="qd-title">Yangi savol qo'shish</div>
                <div class="step-dots" id="qd-steps"></div>

                <!-- Step 1 -->
                <div id="qd-step1">
                    <p class="muted" style="margin-bottom:.85rem;font-size:.82rem">1-qadam: Savol matni va rasmini kiriting</p>
                    <div class="field">
                        <label>Savol matni *</label>
                        <textarea id="qd-text" rows="3" placeholder="Masalan: 7 × 8 nechiga teng?"></textarea>
                    </div>
                    <div class="field">
                        <label>Mavzu / Teg</label>
                        <input type="text" id="qd-tag" placeholder="Algebra, Geometriya...">
                    </div>
                    <div class="field">
                        <label>Rasm (ixtiyoriy)</label>
                        <input type="file" id="qd-img-file" accept="image/*" style="color:var(--muted);font-size:.85rem;padding:.4rem 0">
                        <img id="qd-img-preview" style="display:none;max-width:100%;border-radius:10px;margin-top:.5rem;border:1px solid var(--border)">
                    </div>
                    <div class="flex" style="justify-content:space-between">
                        <button class="btn btn-ghost" onclick="closeDrawer('ov-q')">Bekor</button>
                        <button class="btn btn-primary" onclick="qStep(2)">Keyingi →</button>
                    </div>
                </div>

                <!-- Step 2 -->
                <div id="qd-step2" style="display:none">
                    <p class="muted" style="margin-bottom:.85rem;font-size:.82rem">2-qadam: ✅ tugmasini bosib to'g'ri javobni belgilang</p>
                    <div id="qd-opts-container"></div>
                    <button class="btn btn-ghost btn-sm" onclick="addOptRow()" style="margin-bottom:1rem">+ Variant qo'shish</button>
                    <div class="flex" style="justify-content:space-between">
                        <button class="btn btn-ghost" onclick="qStep(1)">← Orqaga</button>
                        <button class="btn btn-primary" onclick="qStep(3)">Keyingi →</button>
                    </div>
                </div>

                <!-- Step 3: Preview -->
                <div id="qd-step3" style="display:none">
                    <p class="muted" style="margin-bottom:.85rem;font-size:.82rem">3-qadam: Tekshirib saqlang</p>
                    <div id="qd-preview" style="background:var(--bg2);border-radius:12px;padding:1rem;margin-bottom:1rem"></div>
                    <div class="flex" style="justify-content:space-between">
                        <button class="btn btn-ghost" onclick="qStep(2)">← Orqaga</button>
                        <button class="btn btn-primary" onclick="saveQuestion()">✓ Saqlash</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Test Creator Drawer -->
        <div class="overlay" id="ov-test" onclick="if(event.target===this) closeDrawer('ov-test')">
            <div class="drawer">
                <div class="drawer-handle"></div>
                <div class="drawer-title">Test yaratish</div>
                <div class="field">
                    <label>Test nomi *</label>
                    <input type="text" id="td-name" placeholder="Masalan: 3-bob tekshiruvi">
                </div>
                <div class="field">
                    <label>Vaqt chegarasi (daqiqa, 0 = chegarasiz)</label>
                    <input type="number" id="td-time" value="0" min="0">
                </div>
                <div class="field">
                    <label>Sinf</label>
                    <select id="td-grade" onchange="toggleTestUniversal(this.value)">
                        <option value="">— Hammasi (universal) —</option>
                        ${ALLOWED_GRADES.map(g => `<option value="${g}">${g}</option>`).join('')}
                    </select>
                </div>
                <div class="field">
                    <label>Savollarni tanlang</label>
                    <div class="q-picker" id="td-picker"></div>
                </div>
                <div class="flex" style="justify-content:space-between;margin-top:.5rem">
                    <button class="btn btn-ghost" onclick="closeDrawer('ov-test')">Bekor</button>
                    <button class="btn btn-primary" onclick="saveTest()">✓ Test yaratish</button>
                </div>
            </div>
        </div>

        <!-- Daily Task Creator Drawer -->
        <div class="overlay" id="ov-daily" onclick="if(event.target===this) closeDrawer('ov-daily')">
            <div class="drawer">
                <div class="drawer-handle"></div>
                <div class="drawer-title">Kunlik topshiriq qo'shish</div>
                <div class="field">
                    <label>Topshiriq nomi *</label>
                    <input type="text" id="dd-name" placeholder="Bugungi arifmetika mashqi">
                </div>
                <div class="field">
                    <label>Sinf</label>
                    <select id="dd-grade" onchange="toggleDailyUniversal(this.value)">
                        <option value="">— Hammasi (universal) —</option>
                        ${ALLOWED_GRADES.map(g => `<option value="${g}">${g}</option>`).join('')}
                    </select>
                </div>
                <div class="field">
                    <label>Savollarni tanlang</label>
                    <div class="q-picker" id="dd-picker"></div>
                </div>
                <div class="flex" style="justify-content:space-between;margin-top:.5rem">
                    <button class="btn btn-ghost" onclick="closeDrawer('ov-daily')">Bekor</button>
                    <button class="btn btn-primary" onclick="saveDaily()">✓ Saqlash</button>
                </div>
            </div>
        </div>

        <!-- Student Creator Drawer (with placeholders) -->
        <div class="overlay" id="ov-student" onclick="if(event.target===this) closeDrawer('ov-student')">
            <div class="drawer">
                <div class="drawer-handle"></div>
                <div class="drawer-title">O'quvchi qo'shish</div>
                <div class="green-info">
                    <div class="green-info-title">ℹ️ Login formati</div>
                    <p>Faqat lotin harflari va nuqta: <span class="mono">ali.karimov</span><br>
                    O'quvchi shu login va parol bilan kiradi.</p>
                </div>
                <div class="field"><label>Login *</label>
                    <input type="text" id="std-user" placeholder="ali.karimov" autocapitalize="none" spellcheck="false"></div>
                <div class="field"><label>Parol *</label>
                    <input type="text" id="std-pass" placeholder="Kamida 6 belgi"></div>
                <div class="field"><label>Sinf *</label>
                    <select id="std-grade">${ALLOWED_GRADES.map(g => `<option>${g}</option>`).join('')}</select></div>
                <div class="field"><label>To‘liq ism</label>
                    <input type="text" id="std-name" placeholder="Ali Karimov"></div>
                <div id="std-msg" style="min-height:1.2rem;font-size:.82rem;color:var(--muted);margin-bottom:.5rem"></div>
                <div class="flex" style="justify-content:space-between">
                    <button class="btn btn-ghost" onclick="closeDrawer('ov-student')">Yopish</button>
                    <button class="btn btn-primary" id="std-btn" onclick="saveNewStudent()">+ Qo'shish</button>
                </div>
            </div>
        </div>

        <!-- Student Detail Drawer -->
        <div class="overlay" id="ov-student-detail" onclick="if(event.target===this) closeDrawer('ov-student-detail')">
            <div class="drawer">
                <div class="drawer-handle"></div>
                <div class="drawer-title" id="stdetail-title">O'quvchi ma'lumotlari</div>
                <div id="stdetail-content"></div>
                <div class="flex" style="justify-content:flex-end; margin-top:1rem">
                    <button class="btn btn-ghost" onclick="closeDrawer('ov-student-detail')">Yopish</button>
                </div>
            </div>
        </div>

        <!-- Bulk Import Students Drawer (updated column order) -->
        <div class="overlay" id="ov-import-students" onclick="if(event.target===this) closeDrawer('ov-import-students')">
            <div class="drawer">
                <div class="drawer-handle"></div>
                <div class="drawer-title">Excel orqali o‘quvchilarni qo‘shish</div>
                <div class="green-info">
                    <div class="green-info-title">📋 Excel ustunlari tartibi</div>
                    <p>
                        <b>A</b> — Sinf (7-F, 8-F, …)<br>
                        <b>B</b> — To‘liq ism<br>
                        <b>C</b> — Login (username)<br>
                        <b>D</b> — Parol<br><br>
                        1-qator sarlavha bo‘lsa avtomatik o‘tkazib yuboriladi.
                    </p>
                </div>
                <div class="field">
                    <label>Excel fayl (.xlsx)</label>
                    <input type="file" id="imp-students-file" accept=".xlsx,.xls" style="color:var(--muted);font-size:.85rem;padding:.4rem 0" onchange="previewStudentExcel()">
                </div>
                <div id="imp-student-preview" style="max-height:150px;overflow-y:auto;font-size:.82rem;color:var(--muted);margin-bottom:.75rem"></div>
                <div class="flex" style="justify-content:space-between">
                    <button class="btn btn-ghost" onclick="closeDrawer('ov-import-students')">Bekor</button>
                    <button class="btn btn-primary" onclick="doImportStudents()">⬆ Import qilish</button>
                </div>
            </div>
        </div>

        <nav class="bottom-nav" id="t-bnav">
            <div class="bnav-item active" onclick="tTab('overview', this)"><div class="bnav-icon">📊</div><div>Asosiy</div></div>
            <div class="bnav-item" onclick="tTab('questions', this)"><div class="bnav-icon">❓</div><div>Savollar</div></div>
            <div class="bnav-item" onclick="tTab('tests', this)"><div class="bnav-icon">📋</div><div>Testlar</div></div>
            <div class="bnav-item" onclick="tTab('daily', this)"><div class="bnav-icon">📅</div><div>Kunlik</div></div>
            <div class="bnav-item" onclick="tTab('students', this)"><div class="bnav-icon">👥</div><div>O‘quvchilar</div></div>
            <div class="bnav-item" onclick="tTab('results', this)"><div class="bnav-icon">📨</div><div>Natijalar</div></div>
            <div class="bnav-item" onclick="tTab('settings', this)"><div class="bnav-icon">⚙️</div><div>Sozlama</div></div>
        </nav>
    `;

    setTimeout(() => {
        renderTOverview();
    }, 100);
}

// Teacher tab navigation
function tTab(name, el) {
    document.querySelectorAll('#t-sec-overview, #t-sec-questions, #t-sec-tests, #t-sec-daily, #t-sec-results, #t-sec-settings, #t-sec-students')
        .forEach(s => s.classList.remove('active'));
    document.querySelectorAll('#t-bnav .bnav-item').forEach(b => b.classList.remove('active'));

    document.getElementById('t-sec-' + name).classList.add('active');
    if (el) el.classList.add('active');

    if (name === 'overview') renderTOverview();
    if (name === 'questions') renderTQuestions();
    if (name === 'tests') renderTTests();
    if (name === 'daily') renderTDaily();
    if (name === 'students') renderTStudents();
    if (name === 'results') renderTResults();
    if (name === 'settings') renderTSettings();
}

// ==================== TEST/DAILY HELPERS ====================

function toggleTestUniversal(grade) {}
function toggleDailyUniversal(grade) {}

// ==================== QUESTION FUNCTIONS (unchanged) ====================

function openAddQuestion() {
    editingQId = null;
    qImgData = null;
    document.getElementById('qd-title').textContent = "Yangi savol qo'shish";
    document.getElementById('qd-text').value = '';
    document.getElementById('qd-tag').value = '';
    document.getElementById('qd-img-file').value = '';
    document.getElementById('qd-img-preview').style.display = 'none';
    buildOptRows([{ v: '', c: false }, { v: '', c: false }, { v: '', c: false }, { v: '', c: false }]);
    qStep(1);
    openDrawer('ov-q');
}

function editQuestion(id) {
    const q = DB.questions.find(x => x.id === id);
    if (!q) return;

    editingQId = id;
    qImgData = q.img || null;
    document.getElementById('qd-title').textContent = "Savolni tahrirlash";
    document.getElementById('qd-text').value = q.text;
    document.getElementById('qd-tag').value = q.tag || '';
    document.getElementById('qd-img-file').value = '';

    const prev = document.getElementById('qd-img-preview');
    if (q.img) {
        prev.src = q.img;
        prev.style.display = 'block';
    } else {
        prev.style.display = 'none';
    }

    buildOptRows(q.opts.map((v, i) => ({ v, c: i === q.correct })));
    qStep(1);
    openDrawer('ov-q');
}

function buildOptRows(opts) {
    const cont = document.getElementById('qd-opts-container');
    cont.innerHTML = '';
    opts.forEach(o => _addOptRow(o.v, o.c));
}

function addOptRow() {
    _addOptRow('', false);
}

function _addOptRow(val, isCorrect) {
    const cont = document.getElementById('qd-opts-container');
    const idx = cont.children.length;
    const div = document.createElement('div');
    div.className = 'opt-edit-row' + (isCorrect ? ' is-correct' : '');
    div.innerHTML = `
        <span style="font-family:'JetBrains Mono',monospace;font-size:.78rem;color:var(--muted);min-width:1.2rem;flex-shrink:0">${'ABCD'[idx] || idx}</span>
        <input class="opt-edit-input" placeholder="Variant ${idx + 1}" value="${esc(val)}">
        <button type="button" class="correct-btn${isCorrect ? ' active' : ''}" onclick="markCorrect(this)" title="To'g'ri javob">✓</button>
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">✕</button>`;
    cont.appendChild(div);
}

function markCorrect(btn) {
    document.querySelectorAll('.opt-edit-row').forEach(row => {
        row.classList.remove('is-correct');
        row.querySelector('.correct-btn').classList.remove('active');
    });
    btn.classList.add('active');
    btn.closest('.opt-edit-row').classList.add('is-correct');
}

function qStep(step) {
    qCurrentStep = step;
    ['qd-step1', 'qd-step2', 'qd-step3'].forEach((id, i) => {
        document.getElementById(id).style.display = i + 1 === step ? '' : 'none';
    });

    const dots = document.getElementById('qd-steps');
    dots.innerHTML = [1, 2, 3].map(i => `<div class="step-dot${i <= step ? ' done' : ''}"></div>`).join('');

    if (step === 3) buildQPreview();
}

function buildQPreview() {
    const text = document.getElementById('qd-text').value.trim() || '(Matn kiritilmagan)';
    const rows = [...document.querySelectorAll('.opt-edit-row')];
    const opts = rows.map(r => r.querySelector('.opt-edit-input').value.trim());
    const correctIdx = rows.findIndex(r => r.querySelector('.correct-btn').classList.contains('active'));

    document.getElementById('qd-preview').innerHTML = `
        <div style="font-weight:700;margin-bottom:.75rem;line-height:1.5">${esc(text)}</div>
        ${qImgData ? `<img src="${qImgData}" style="max-width:100%;border-radius:8px;margin-bottom:.75rem">` : ''}
        ${opts.map((o, i) => `
            <div style="display:flex;gap:.5rem;align-items:center;padding:.5rem;border-radius:8px;margin-bottom:.4rem;
                       background:${i === correctIdx ? 'rgba(34,211,160,.15)' : 'var(--bg)'};
                       border:2px solid ${i === correctIdx ? 'var(--green)' : 'var(--border)'}">
                <span style="font-weight:800;font-family:'JetBrains Mono',monospace">${'ABCD'[i]}</span>
                <span style="flex:1">${esc(o) || '(bo\'sh)'}</span>
                ${i === correctIdx ? '<span style="color:var(--green)">✓</span>' : ''}
            </div>
        `).join('')}`;
}

async function saveQuestion() {
    const text = document.getElementById('qd-text').value.trim();
    if (!text) {
        toast("Savol matni kiriting", 'err');
        qStep(1);
        return;
    }

    const rows = [...document.querySelectorAll('.opt-edit-row')];
    const opts = rows.map(r => r.querySelector('.opt-edit-input').value.trim()).filter(Boolean);

    if (opts.length < 2) {
        toast("Kamida 2 ta variant kiriting", 'err');
        qStep(2);
        return;
    }

    const correctRow = rows.find(r => r.querySelector('.correct-btn').classList.contains('active'));
    const correctVal = correctRow ? correctRow.querySelector('.opt-edit-input').value.trim() : '';
    const correct = opts.indexOf(correctVal);

    if (correct === -1) {
        toast("To'g'ri javobni belgilang", 'err');
        qStep(2);
        return;
    }

    const q = {
        id: editingQId || Date.now() + '',
        text,
        opts,
        correct,
        img: qImgData || null,
        tag: document.getElementById('qd-tag').value.trim()
    };

    if (editingQId) {
        const i = DB.questions.findIndex(x => x.id === editingQId);
        DB.questions[i] = q;
    } else {
        DB.questions.push(q);
    }

    await saveToCloud();
    closeDrawer('ov-q');
    toast("Savol saqlandi ✓");
    renderTQuestions();
}

async function deleteQuestion(id) {
    if (!confirm("Savol o'chirilsinmi?")) return;
    DB.questions = DB.questions.filter(q => q.id !== id);
    await saveToCloud();
    renderTQuestions();
    toast("O'chirildi");
}

// Image upload handler
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'qd-img-file') {
        const f = e.target.files[0];
        if (!f) return;

        const r = new FileReader();
        r.onload = function(ev) {
            qImgData = ev.target.result;
            const prev = document.getElementById('qd-img-preview');
            prev.src = ev.target.result;
            prev.style.display = 'block';
        };
        r.readAsDataURL(f);
    }
});

// ==================== TEST FUNCTIONS ====================

function openCreateTest() {
    document.getElementById('td-name').value = '';
    document.getElementById('td-time').value = '0';
    document.getElementById('td-grade').value = '';
    buildPicker('td-picker', []);
    openDrawer('ov-test');
}

async function saveTest() {
    const title = document.getElementById('td-name').value.trim();
    if (!title) {
        toast("Test nomini kiriting", 'err');
        return;
    }

    const time = parseInt(document.getElementById('td-time').value) || 0;
    const grade = document.getElementById('td-grade').value;
    const isUniversal = grade === '';
    const grades = isUniversal ? [] : [grade];
    const qids = getPickedIds('td-picker');

    if (!qids.length) {
        toast("Kamida 1 ta savol tanlang", 'err');
        return;
    }

    DB.tests.push({
        id: Date.now() + '',
        title,
        qids,
        time,
        isUniversal,
        grades
    });

    await saveToCloud();
    closeDrawer('ov-test');
    renderTTests();
    toast("Test yaratildi ✓");
}

async function deleteTest(id) {
    if (!confirm("Test o'chirilsinmi?")) return;
    DB.tests = DB.tests.filter(t => t.id !== id);
    await saveToCloud();
    renderTTests();
    toast("O'chirildi");
}

// ==================== DAILY TASK FUNCTIONS ====================

function openCreateDaily() {
    document.getElementById('dd-name').value = '';
    document.getElementById('dd-grade').value = '';
    buildPicker('dd-picker', []);
    openDrawer('ov-daily');
}

async function saveDaily() {
    const title = document.getElementById('dd-name').value.trim();
    if (!title) {
        toast("Nom kiriting", 'err');
        return;
    }

    const grade = document.getElementById('dd-grade').value;
    const isUniversal = grade === '';
    const grades = isUniversal ? [] : [grade];
    const qids = getPickedIds('dd-picker');

    if (!qids.length) {
        toast("Kamida 1 ta savol tanlang", 'err');
        return;
    }

    DB.dailyTasks.push({
        id: Date.now() + '',
        title,
        qids,
        isUniversal,
        grades
    });

    await saveToCloud();
    closeDrawer('ov-daily');
    renderTDaily();
    toast("Saqlandi ✓");
}

async function deleteDaily(id) {
    if (!confirm("O'chirilsinmi?")) return;
    DB.dailyTasks = DB.dailyTasks.filter(d => d.id !== id);
    await saveToCloud();
    renderTDaily();
    toast("O'chirildi");
}

// ==================== STUDENT MANAGEMENT ====================

function renderTStudents() {
    const el = document.getElementById('t-sec-students');
    if (!el) return;

    const list = Object.entries(DB.students).filter(([, s]) => !s.deleted);
    const byGrade = {};
    list.forEach(([uid, s]) => {
        const g = s.grade || '?';
        if (!byGrade[g]) byGrade[g] = [];
        byGrade[g].push({ uid, ...s });
    });

    el.innerHTML = `
        <div class="flex" style="justify-content:space-between;margin-bottom:1rem">
            <div class="page-title">O'quvchilar (${list.length})</div>
            <div>
                <button class="btn btn-ghost btn-sm" onclick="openImportStudentsDrawer()">📥 Excel</button>
                <button class="btn btn-primary btn-sm" onclick="openAddStudentDrawer()">+ Qo'shish</button>
            </div>
        </div>
        ${!list.length
            ? emptyHTML('👥', "Hozircha o'quvchi yo'q.\n\"+ Qo'shish\" tugmasini bosing!")
            : Object.entries(byGrade).sort().map(([grade, students]) => `
                <div style="font-size:.75rem;font-weight:800;color:var(--muted);text-transform:uppercase;
                            letter-spacing:.06em;margin:.85rem 0 .4rem">${grade} · ${students.length} o'quvchi</div>
                ${students.map(s => `
                    <div class="card" style="cursor:pointer" onclick="showStudentDetail('${s.uid}')">
                        <div class="card-row">
                            <div class="card-info">
                                <div class="card-title">${esc(s.name || s.username)}</div>
                                <div class="card-meta">Login: <span class="mono">${esc(s.username)}</span> · ${esc(s.grade)}</div>
                            </div>
                            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); removeStudent('${s.uid}','${esc(s.name)}')">🗑</button>
                        </div>
                    </div>
                `).join('')}
            `).join('')
        }
    `;
}

function openAddStudentDrawer() {
    document.getElementById('std-user').value = '';
    document.getElementById('std-pass').value = '';
    document.getElementById('std-name').value = '';
    document.getElementById('std-msg').textContent = '';
    openDrawer('ov-student');
}

async function saveNewStudent() {
    const username = document.getElementById('std-user')?.value.trim();
    const password = document.getElementById('std-pass')?.value.trim();
    const grade    = document.getElementById('std-grade')?.value;
    const fullName = document.getElementById('std-name')?.value.trim() || username;
    const msg      = document.getElementById('std-msg');
    const btn      = document.getElementById('std-btn');

    if (!username || !password || !grade) {
        toast("Login, parol va sinfni to‘ldiring", 'err');
        return;
    }

    if (msg) { msg.style.color = 'var(--muted)'; msg.textContent = 'Yaratilmoqda...'; }
    if (btn) btn.disabled = true;

    const res = await window.createStudentAccount(username, password, grade, fullName);
    if (btn) btn.disabled = false;

    if (res.ok) {
        toast(`${username} qo'shildi ✓`);
        if (msg) msg.textContent = '';
        document.getElementById('std-user').value = '';
        document.getElementById('std-pass').value = '';
        document.getElementById('std-name').value = '';
        closeDrawer('ov-student');
        renderTStudents();
    } else {
        if (msg) { msg.style.color = 'var(--red)'; msg.textContent = res.msg; }
    }
}

async function removeStudent(uid, name) {
    if (!confirm(`"${name}" o'chirilsinmi?`)) return;
    if (DB.students[uid]) {
        DB.students[uid].deleted = true;
        await setDoc(doc(db, COLLECTIONS.STUDENTS, uid), DB.students[uid]);
    }
    toast(`${name} o'chirildi`);
    renderTStudents();
}

// Student detail drawer
async function showStudentDetail(uid) {
    const student = DB.students[uid];
    if (!student) return;

    const results = DB.results
        .filter(r => r.student === student.name && r.grade === student.grade)
        .reverse();

    const content = document.getElementById('stdetail-content');
    content.innerHTML = `
        <div class="card">
            <div class="field"><label>Login</label><input type="text" value="${esc(student.username)}" readonly></div>
            <div class="field"><label>Ism</label><input type="text" value="${esc(student.name || '')}" readonly></div>
            <div class="field"><label>Sinf</label><input type="text" value="${esc(student.grade)}" readonly></div>
            <div class="field"><label>Parol</label>
                <input type="password" id="stdetail-pass" value="${esc(student.password || '')}" readonly>
                <button class="btn btn-ghost btn-sm" style="margin-top:.3rem" onclick="togglePassVisibility()">👁 Ko'rsat</button>
            </div>
            <button class="btn btn-warning btn-sm" onclick="resetStudentPassword('${uid}')">🔄 Parolni tiklash</button>
        </div>
        <div class="page-title" style="margin-top:1rem">Natijalar (${results.length})</div>
        ${results.length === 0 ? '<div class="muted">Hali natija yo‘q</div>' : ''}
        ${results.map(r => `
            <div class="card" style="cursor:pointer" onclick="reviewResult('${r.id}')">
                <div class="card-row">
                    <div class="card-info">
                        <div class="card-title">${esc(r.title)}</div>
                        <div class="card-meta">${r.date} · ${r.score}/${r.total}</div>
                    </div>
                    <span class="badge ${gradeBadge(r.score, r.total)}">${Math.round(r.score/r.total*100)}%</span>
                </div>
            </div>
        `).join('')}
    `;
    openDrawer('ov-student-detail');
}

function togglePassVisibility() {
    const pass = document.getElementById('stdetail-pass');
    if (pass.type === 'password') pass.type = 'text';
    else pass.type = 'password';
}

async function resetStudentPassword(uid) {
    const res = await window.resetStudentPassword(uid);
    if (res.ok) {
        toast(`Yangi parol: ${res.newPass} — O'quvchiga xabardor qiling`, 'ok');
        showStudentDetail(uid); // refresh
    } else {
        toast(res.msg, 'err');
    }
}

// Bulk import students (updated column order)
function openImportStudentsDrawer() {
    document.getElementById('imp-students-file').value = '';
    document.getElementById('imp-student-preview').innerHTML = '';
    openDrawer('ov-import-students');
}

function previewStudentExcel() {
    const file = document.getElementById('imp-students-file')?.files[0];
    const prev = document.getElementById('imp-student-preview');
    if (!file || !prev) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const wb = XLSX.read(e.target.result, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            const real = rows.filter(r => String(r[0] || '').trim());
            const skip = !real.length ? 0 : (real[0][0] === 'sinf' ? 1 : 0);
            prev.innerHTML = `<b>${real.length - skip} ta o'quvchi topildi:</b><br>` +
                real.slice(skip, skip + 5).map(r => `${r[1]} (${r[0]})`).join('<br>') +
                (real.length - skip > 5 ? '<br>...' : '');
        } catch (err) {
            prev.innerHTML = '<span style="color:var(--red)">Fayl o‘qilmadi</span>';
        }
    };
    reader.readAsArrayBuffer(file);
}

async function doImportStudents() {
    const file = document.getElementById('imp-students-file')?.files[0];
    if (!file) { toast("Excel faylini tanlang", 'err'); return; }

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const wb = XLSX.read(e.target.result, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            const real = rows.filter(r => String(r[0] || '').trim());
            const start = (!real.length || real[0][0] === 'sinf') ? 1 : 0;

            let added = 0, errors = 0;
            for (let i = start; i < real.length; i++) {
                const [grade, fullName, username, password] = real[i];
                if (!grade || !fullName || !username || !password) {
                    errors++;
                    continue;
                }
                if (!ALLOWED_GRADES.includes(grade)) {
                    errors++;
                    continue;
                }
                const res = await window.createStudentAccount(
                    username.trim(),
                    password.trim(),
                    grade.trim(),
                    fullName.trim()
                );
                if (res.ok) added++;
                else errors++;
            }
            closeDrawer('ov-import-students');
            toast(`${added} ta o'quvchi qo'shildi, ${errors} ta xato`, errors ? 'err' : 'ok');
            renderTStudents();
        } catch (err) {
            toast("Import xatoligi: " + err.message, 'err');
        }
    };
    reader.readAsArrayBuffer(file);
}

// ==================== REVIEW RESULT (teacher view) ====================

function reviewResult(resultId) {
    const result = DB.results.find(r => r.id === resultId);
    if (!result) return;

    const qids = result.qids || (() => {
        const test = DB.tests.find(t => t.id === result.testId);
        const daily = DB.dailyTasks.find(d => d.id === result.testId);
        return (test || daily)?.qids || [];
    })();

    const qs = qids.map(id => DB.questions.find(q => q.id === id)).filter(Boolean);

    const app = document.getElementById('app');
    app.innerHTML = `
        <nav class="navbar">
            <div class="navbar-brand">Ko‘rib chiqish</div>
            <button class="btn btn-ghost btn-sm" onclick="renderTeacherPanel();setTimeout(()=>tTab('results',document.querySelector('#t-bnav .bnav-item:nth-child(6)')),150)">← Natijalar</button>
        </nav>
        <div class="main">
            <div class="page-title">${esc(result.title)}</div>
            <div class="muted">${result.date} · Ball: ${result.score}/${result.total}</div>
            ${qs.map((q, i) => {
                const userAns = result.answers?.[q.id];
                return `
                    <div class="q-block">
                        <div class="q-num">SAVOL ${i + 1}</div>
                        <div class="q-text">${esc(q.text)}</div>
                        ${q.img ? `<img src="${q.img}" class="q-img">` : ''}
                        <div class="options-grid">
                            ${q.opts.map((o, j) => `
                                <div class="opt-btn ${j === q.correct ? 'correct' : (j === userAns && j !== q.correct ? 'wrong' : '')}">
                                    <span class="opt-letter">${'ABCD'[j]}</span>
                                    <span>${esc(o)}</span>
                                    ${j === userAns ? ' ✓' : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ==================== SETTINGS TAB ====================

function renderTSettings() {
    const el = document.getElementById('t-sec-settings');
    if (!el) return;

    el.innerHTML = `
        <div class="page-title">Sozlamalar</div>

        <div class="green-info">
            <div class="green-info-title">🤖 Telegram sozlash</div>
            <p>1. Telegramda <b>@BotFather</b> → <b>/newbot</b> → Token oling<br>
            2. Botingizga xabar yuboring<br>
            3. <span class="mono">https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</span><br>
            manzilidan Chat ID toping (raqam)</p>
        </div>

        <div class="card">
            <div class="field">
                <label>Telegram Bot Token</label>
                <input type="text" id="set-token" value="${esc(DB.settings.token || '')}"
                    placeholder="123456789:ABCdef...">
            </div>
            <div class="field">
                <label>Telegram Chat ID</label>
                <input type="text" id="set-chatid" value="${esc(DB.settings.chatId || '')}"
                    placeholder="123456789">
            </div>
            <div class="flex">
                <button class="btn btn-primary" style="flex:1" onclick="saveSettings()">✓ Saqlash</button>
                <button class="btn btn-ghost" onclick="testTelegram()">📬 Sinab ko'rish</button>
            </div>
        </div>

        <!-- Teacher account settings -->
        <div class="card">
            <div style="font-weight:800;margin-bottom:.85rem">🔐 O'qituvchi hisobi</div>
            <div class="field">
                <label>Joriy parol</label>
                <input type="password" id="set-current-pass" placeholder="Joriy parol">
            </div>
            <div class="field">
                <label>Yangi login (ixtiyoriy)</label>
                <input type="text" id="set-new-username" placeholder="${esc(DB.settings.teacherUsername || 'teacher')}">
            </div>
            <div class="field">
                <label>Yangi parol (ixtiyoriy)</label>
                <input type="password" id="set-new-pass" placeholder="Yangi parol">
            </div>
            <button class="btn btn-primary" onclick="handleUpdateTeacherAccount()">O'zgartirish</button>
        </div>

        <div class="card">
            <div style="font-weight:800;margin-bottom:.85rem">🎨 Mavzu tanlash</div>
            <div class="flex" style="flex-wrap:wrap">
                ${Object.entries(THEMES).map(([k, v]) => `
                    <button onclick="applyTheme('${k}')" title="${v.label}"
                        style="display:flex;align-items:center;gap:.4rem;padding:.35rem .75rem;
                               border-radius:8px;border:2px solid ${DB.settings.theme === k ? 'var(--accent)' : 'var(--border)'};
                               background:${DB.settings.theme === k ? 'var(--accent)' : 'var(--surface2)'};
                               color:${DB.settings.theme === k ? '#000' : 'var(--muted)'};
                               font-weight:800;font-size:.78rem;cursor:pointer;margin:.2rem">
                        <span style="width:14px;height:14px;border-radius:50%;
                                   background:linear-gradient(135deg,${v.bg},${v.accent});
                                   flex-shrink:0;display:inline-block"></span>
                        ${v.label}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

// Renamed to avoid recursion
async function handleUpdateTeacherAccount() {
    const current = document.getElementById('set-current-pass')?.value;
    const newUser = document.getElementById('set-new-username')?.value.trim();
    const newPass = document.getElementById('set-new-pass')?.value;

    if (!current) { toast("Joriy parolni kiriting", 'err'); return; }

    const res = await window.updateTeacherAccount(current, newUser || 'teacher', newPass);
    if (res.ok) {
        toast("O'qituvchi ma'lumotlari yangilandi", 'ok');
        if (DB.settings.token && DB.settings.chatId) {
            sendTelegramMessage(`🔐 O'qituvchi ma'lumotlari o'zgartirildi.\nYangi login: ${newUser || 'teacher'}\nYangi parol: ${newPass ? '***' : 'ozgartirilmadi'}`);
        }
        document.getElementById('set-current-pass').value = '';
        document.getElementById('set-new-username').value = '';
        document.getElementById('set-new-pass').value = '';
    } else {
        toast(res.msg, 'err');
    }
}

function sendTelegramMessage(text) {
    const { token, chatId } = DB.settings;
    if (!token || !chatId) return;
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    }).catch(() => {});
}

// ==================== OVERVIEW, TESTS, DAILY, RESULTS (unchanged except results) ====================

function renderTOverview() {
    const el = document.getElementById('t-sec-overview');
    if (!el) return;

    const allGrades = [...new Set(DB.results.map(r => r.grade))].filter(Boolean).sort();
    const students = [...new Set(DB.results.map(r => r.student))].length;
    const avg = DB.results.length
        ? Math.round(DB.results.reduce((a, r) => a + (r.score / r.total * 100), 0) / DB.results.length)
        : 0;

    el.innerHTML = `
        <div class="page-title">Umumiy ko'rinish</div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-num">${DB.questions.length}</div>
                <div class="stat-label">Savollar</div>
            </div>
            <div class="stat-card">
                <div class="stat-num">${DB.tests.length}</div>
                <div class="stat-label">Testlar</div>
            </div>
            <div class="stat-card">
                <div class="stat-num">${DB.results.length}</div>
                <div class="stat-label">Topshirishlar</div>
            </div>
            <div class="stat-card">
                <div class="stat-num">${students}</div>
                <div class="stat-label">O'quvchilar</div>
            </div>
        </div>
        ${DB.results.length ? `
            <div class="card">
                <div class="card-title">O'rtacha ball</div>
                <div class="progress-bar" style="margin:.5rem 0">
                    <div class="progress-fill" style="width:${avg}%"></div>
                </div>
                <div style="font-size:1.3rem;font-weight:900;color:var(--accent)">${avg}%</div>
            </div>
        ` : ''}
        <div class="page-title">So'nggi natijalar</div>
        ${DB.results.length === 0
            ? emptyHTML('📨', "Hozircha natija yo'q")
            : [...DB.results].reverse().slice(0, 10).map(r => resultCardHTML(r)).join('')
        }
    `;
}

function renderTQuestions() {
    const el = document.getElementById('t-sec-questions');
    if (!el) return;
    el.innerHTML = `
        <div class="flex" style="justify-content:space-between;margin-bottom:1rem">
            <div class="page-title">Savollar (${DB.questions.length})</div>
            <button class="btn btn-primary btn-sm" onclick="openAddQuestion()">+ Savol qo'shish</button>
        </div>
        ${!DB.questions.length
            ? emptyHTML('❓', "Hozircha savol yo'q")
            : DB.questions.map((q, i) => `
                <div class="card">
                    <div class="card-row">
                        <div class="card-info">
                            <div style="font-family:'JetBrains Mono',monospace;font-size:.68rem;color:var(--accent);margin-bottom:.25rem">
                                #${i + 1}${q.tag ? ' · ' + esc(q.tag) : ''}
                            </div>
                            <div class="card-title">${esc(q.text.substring(0, 90))}${q.text.length > 90 ? '...' : ''}</div>
                            <div class="card-meta">
                                ${q.opts.length} variant · To'g'ri: <b>${'ABCD'[q.correct]}</b>${q.img ? ' · 🖼' : ''}
                            </div>
                        </div>
                        <div class="card-actions">
                            <button class="btn btn-ghost btn-sm" onclick="editQuestion('${q.id}')">✏️</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteQuestion('${q.id}')">🗑</button>
                        </div>
                    </div>
                </div>
            `).join('')
        }
    `;
}

function renderTTests() {
    const el = document.getElementById('t-sec-tests');
    if (!el) return;

    el.innerHTML = `
        <div class="flex" style="justify-content:space-between;margin-bottom:1rem">
            <div class="page-title">Testlar (${DB.tests.length})</div>
            <button class="btn btn-primary btn-sm" onclick="openCreateTest()">+ Test yaratish</button>
        </div>
        ${!DB.tests.length
            ? emptyHTML('📋', "Hozircha test yo'q")
            : DB.tests.map(t => {
                const att = DB.results.filter(r => r.testId === t.id && r.type !== 'daily').length;
                return `<div class="card">
                    <div class="card-row">
                        <div class="card-info">
                            <div class="card-title">${esc(t.title)}</div>
                            <div class="card-meta">
                                ${t.qids.length} savol${t.time ? ` · ⏱ ${t.time} daqiqa` : ''} · ${att} ta urinish
                            </div>
                            <div style="margin-top:.4rem">
                                ${t.isUniversal
                                    ? '<span class="badge badge-blue">🌍 Umumiy</span>'
                                    : (t.grades || []).map(g => `<span class="badge badge-blue" style="margin-right:.3rem">${esc(g)}</span>`).join('')
                                }
                            </div>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="deleteTest('${t.id}')">🗑</button>
                    </div>
                </div>`;
            }).join('')
        }
    `;
}

function renderTDaily() {
    const el = document.getElementById('t-sec-daily');
    if (!el) return;

    el.innerHTML = `
        <div class="flex" style="justify-content:space-between;margin-bottom:1rem">
            <div class="page-title">Kunlik topshiriqlar (${DB.dailyTasks.length})</div>
            <button class="btn btn-primary btn-sm" onclick="openCreateDaily()">+ Qo'shish</button>
        </div>
        ${!DB.dailyTasks.length
            ? emptyHTML('📅', "Hozircha kunlik topshiriq yo'q")
            : DB.dailyTasks.map(dt => `
                <div class="card">
                    <div class="card-row">
                        <div class="card-info">
                            <div class="card-title">${esc(dt.title)}</div>
                            <div class="card-meta">${dt.qids.length} savol</div>
                            <div style="margin-top:.4rem">
                                ${dt.isUniversal
                                    ? '<span class="badge badge-blue">🌍 Umumiy</span>'
                                    : (dt.grades || []).map(g => `<span class="badge badge-blue" style="margin-right:.3rem">${esc(g)}</span>`).join('')
                                }
                            </div>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="deleteDaily('${dt.id}')">🗑</button>
                    </div>
                </div>
            `).join('')
        }
    `;
}

function renderTResults() {
    const el = document.getElementById('t-sec-results');
    if (!el) return;

    const allGrades = [...new Set(DB.results.map(r => r.grade))].filter(Boolean).sort();
    const allTests = [...new Set(DB.results.map(r => r.testId))].filter(Boolean);

    const filtered = DB.results.filter(r =>
        (rGradeFilter === 'all' || r.grade === rGradeFilter) &&
        (rTestFilter === 'all' || r.testId === rTestFilter)
    );

    let leaderboard = [];
    if (rViewMode === 'leaderboard') {
        const best = {};
        filtered.forEach(r => {
            const key = r.student + '_' + r.testId;
            if (!best[key] || r.score / r.total > best[key].score / best[key].total) {
                best[key] = r;
            }
        });
        leaderboard = Object.values(best).sort((a, b) =>
            (b.score / b.total) - (a.score / a.total)
        );
    }

    el.innerHTML = `
        <div class="flex" style="justify-content:space-between;margin-bottom:1rem">
            <div class="page-title">Natijalar</div>
            <div class="flex">
                <button class="btn btn-ghost btn-sm" onclick="exportCSV()">⬇ CSV</button>
                <button class="btn btn-danger btn-sm" onclick="clearResults()">🗑</button>
            </div>
        </div>

        <div style="margin-bottom:.75rem">
            <div style="font-size:.75rem;font-weight:800;color:var(--muted);margin-bottom:.4rem">Sinf bo'yicha</div>
            <div class="filter-row">
                <button class="filter-btn${rGradeFilter === 'all' ? ' active' : ''}"
                    onclick="rGradeFilter='all';renderTResults()">Hammasi</button>
                ${ALLOWED_GRADES.filter(g => allGrades.includes(g)).map(g => `
                    <button class="filter-btn${rGradeFilter === g ? ' active' : ''}"
                        onclick="rGradeFilter='${g}';renderTResults()">${g}</button>
                `).join('')}
            </div>
        </div>

        <div style="margin-bottom:.75rem">
            <div style="font-size:.75rem;font-weight:800;color:var(--muted);margin-bottom:.4rem">Test bo'yicha</div>
            <div class="filter-row">
                <button class="filter-btn${rTestFilter === 'all' ? ' active' : ''}"
                    onclick="rTestFilter='all';renderTResults()">Hammasi</button>
                ${allTests.map(tid => {
                    const r = DB.results.find(x => x.testId === tid);
                    return `<button class="filter-btn${rTestFilter === tid ? ' active' : ''}"
                        onclick="rTestFilter='${tid}';renderTResults()">${r ? esc(r.title) : tid}</button>`;
                }).join('')}
            </div>
        </div>

        <div class="flex" style="margin-bottom:1rem">
            <button class="filter-btn${rViewMode === 'list' ? ' active' : ''}"
                onclick="rViewMode='list';renderTResults()">📋 Ro'yxat</button>
            <button class="filter-btn${rViewMode === 'leaderboard' ? ' active' : ''}"
                onclick="rViewMode='leaderboard';renderTResults()">🏆 Reyting</button>
        </div>

        <div class="muted" style="margin-bottom:.75rem">${filtered.length} ta natija</div>

        ${rViewMode === 'leaderboard'
            ? (!leaderboard.length
                ? emptyHTML('🏆', "Natija yo'q")
                : leaderboard.map((r, i) => {
                    const pct = Math.round(r.score / r.total * 100);
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                    return `<div class="lb-card${i < 3 ? ' top3' : ''}">
                        ${medal
                            ? `<div class="lb-medal">${medal}</div>`
                            : `<div class="lb-rank">${i + 1}.</div>`
                        }
                        <div style="flex:1;min-width:0">
                            <div style="font-weight:800">${esc(r.student)}
                                <span class="badge badge-blue">${esc(r.grade)}</span>
                            </div>
                            <div class="muted" style="font-size:.78rem">${esc(r.title)}</div>
                        </div>
                        <div style="text-align:right;flex-shrink:0">
                            <div style="font-weight:900">${r.score}/${r.total}</div>
                            <span class="badge ${gradeBadge(r.score, r.total)}">${pct}%</span>
                        </div>
                    </div>`;
                }).join('')
            )
            : (!filtered.length
                ? emptyHTML('📊', "Natija yo'q")
                : [...filtered].reverse().map(r => `
                    <div style="position:relative">
                        ${resultCardHTML(r)}
                        <button class="btn btn-ghost btn-sm" 
                            style="position:absolute;right:.75rem;bottom:.75rem"
                            onclick="reviewResult('${r.id}')">👁 Ko'rish</button>
                    </div>
                `).join('')
            )
        }
    `;
}

// ==================== RESULT FUNCTIONS ====================

async function clearResults() {
    if (!confirm("Barcha natijalar o'chirilsinmi?")) return;
    DB.results = [];
    await saveToCloud();
    renderTResults();
    toast("Tozalandi");
}

function exportCSV() {
    if (!DB.results.length) {
        toast("Natija yo'q", 'err');
        return;
    }

    const bom = '\uFEFF';
    const header = "O'quvchi,Sinf,Topshiriq,Tur,Ball,Jami,Foiz,Sana\n";
    const rows = DB.results.map(r =>
        `"${r.student}","${r.grade}","${r.title}","${r.type}",${r.score},${r.total},${Math.round(r.score / r.total * 100)}%,"${r.date}"`
    ).join('\n');

    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mathclass_natijalar.csv';
    a.click();
}

// ==================== SETTINGS FUNCTIONS ====================

async function saveSettings() {
    const token = document.getElementById('set-token')?.value.trim() || '';
    const chatId = document.getElementById('set-chatid')?.value.trim() || '';

    DB.settings.token = token;
    DB.settings.chatId = chatId;

    await saveToCloud();
    toast("Saqlandi ✓");
    renderTSettings();
}

async function testTelegram() {
    const { token, chatId } = DB.settings;
    if (!token || !chatId) {
        toast("Token va Chat ID kiriting", 'err');
        return;
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: "✅ MathClass boti ulandi! Natijalar shu yerga keladi.",
                parse_mode: 'HTML'
            })
        });
        const data = await response.json();
        toast(data.ok ? "Telegram xabar yuborildi ✓" : "Telegram xatolik", data.ok ? 'ok' : 'err');
    } catch {
        toast("Telegram xatolik", 'err');
    }
}

// ==================== HELPER FUNCTIONS ====================

function buildPicker(containerId, selectedIds) {
    const cont = document.getElementById(containerId);
    if (!cont) return;

    if (!DB.questions.length) {
        cont.innerHTML = '<div style="padding:.85rem 1rem;color:var(--muted);font-size:.85rem">Avval savol qo\'shing!</div>';
        return;
    }

    cont.innerHTML = DB.questions.map(q => `
        <div class="picker-item${selectedIds.includes(q.id) ? ' picked' : ''}" id="pick_${containerId}_${q.id}" onclick="togglePick('${containerId}','${q.id}')">
            <div class="pick-check">${selectedIds.includes(q.id) ? '✓' : ''}</div>
            <span class="picker-text">${esc(q.text.substring(0, 70))}</span>
            <span class="picker-tag">${esc(q.tag || 'Umumiy')}</span>
        </div>
    `).join('');
}

function togglePick(containerId, qid) {
    const el = document.getElementById(`pick_${containerId}_${qid}`);
    if (!el) return;
    const isPicked = el.classList.toggle('picked');
    const check = el.querySelector('.pick-check');
    if (check) check.textContent = isPicked ? '✓' : '';
}

function getPickedIds(containerId) {
    return [...document.querySelectorAll(`#${containerId} .picker-item.picked`)].map(el =>
        el.id.replace(`pick_${containerId}_`, '')
    );
}

function openDrawer(id) {
    document.getElementById(id).classList.add('open');
}

function closeDrawer(id) {
    document.getElementById(id).classList.remove('open');
}

// Make everything global
window.renderTeacherPanel = renderTeacherPanel;
window.tTab = tTab;
window.openAddQuestion = openAddQuestion;
window.editQuestion = editQuestion;
window.deleteQuestion = deleteQuestion;
window.addOptRow = addOptRow;
window.markCorrect = markCorrect;
window.qStep = qStep;
window.saveQuestion = saveQuestion;
window.openCreateTest = openCreateTest;
window.saveTest = saveTest;
window.deleteTest = deleteTest;
window.openCreateDaily = openCreateDaily;
window.saveDaily = saveDaily;
window.deleteDaily = deleteDaily;
window.setUniversal = () => {};
window.addGradeChip = () => {};
window.togglePick = togglePick;
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.clearResults = clearResults;
window.exportCSV = exportCSV;
window.saveSettings = saveSettings;
window.testTelegram = testTelegram;
window.renderTStudents = renderTStudents;
window.openAddStudentDrawer = openAddStudentDrawer;
window.saveNewStudent = saveNewStudent;
window.removeStudent = removeStudent;
window.showStudentDetail = showStudentDetail;
window.togglePassVisibility = togglePassVisibility;
window.resetStudentPassword = resetStudentPassword;
window.openImportStudentsDrawer = openImportStudentsDrawer;
window.previewStudentExcel = previewStudentExcel;
window.doImportStudents = doImportStudents;
window.reviewResult = reviewResult;
window.sendTelegramMessage = sendTelegramMessage;
window.handleUpdateTeacherAccount = handleUpdateTeacherAccount;
