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

// Render teacher panel
function renderTeacherPanel() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <nav class="navbar">
            <div class="navbar-brand">📐 O'qituvchi paneli</div>
            <button class="btn btn-ghost btn-sm" onclick="doLogout()">Chiqish</button>
        </nav>
        
        <div class="main">
            <div class="tab-section active" id="t-sec-overview"></div>
            <div class="tab-section" id="t-sec-questions"></div>
            <div class="tab-section" id="t-sec-tests"></div>
            <div class="tab-section" id="t-sec-daily"></div>
            <div class="tab-section" id="t-sec-codes"></div>
            <div class="tab-section" id="t-sec-results"></div>
            <div class="tab-section" id="t-sec-settings"></div>
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
                    <label>Sinf kategoriyasi</label>
                    <div class="toggle-row" style="margin-bottom:.5rem">
                        <button class="toggle-btn active" id="td-univ-btn" onclick="setUniversal('td', true)">🌍 Umumiy</button>
                        <button class="toggle-btn" id="td-spec-btn" onclick="setUniversal('td', false)">🎯 Aniq sinflar</button>
                    </div>
                    <div id="td-grades-wrap" style="display:none">
                        <div class="flex" style="margin-bottom:.5rem">
                            <input type="text" id="td-grade-input" placeholder="7A..." style="flex:1;background:var(--bg2);border:2px solid var(--border);border-radius:10px;color:var(--text);padding:.55rem .85rem;outline:none;font-size:.9rem" oninput="this.value=this.value.toUpperCase()" onkeydown="if(event.key==='Enter'){event.preventDefault();addGradeChip('td')}">
                            <button class="btn btn-ghost btn-sm" onclick="addGradeChip('td')">+</button>
                        </div>
                        <div id="td-chips" class="flex"></div>
                    </div>
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
                    <label>Sinf kategoriyasi</label>
                    <div class="toggle-row" style="margin-bottom:.5rem">
                        <button class="toggle-btn active" id="dd-univ-btn" onclick="setUniversal('dd', true)">🌍 Umumiy</button>
                        <button class="toggle-btn" id="dd-spec-btn" onclick="setUniversal('dd', false)">🎯 Aniq sinflar</button>
                    </div>
                    <div id="dd-grades-wrap" style="display:none">
                        <div class="flex" style="margin-bottom:.5rem">
                            <input type="text" id="dd-grade-input" placeholder="7A..." style="flex:1;background:var(--bg2);border:2px solid var(--border);border-radius:10px;color:var(--text);padding:.55rem .85rem;outline:none;font-size:.9rem" oninput="this.value=this.value.toUpperCase()" onkeydown="if(event.key==='Enter'){event.preventDefault();addGradeChip('dd')}">
                            <button class="btn btn-ghost btn-sm" onclick="addGradeChip('dd')">+</button>
                        </div>
                        <div id="dd-chips" class="flex"></div>
                    </div>
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

        <!-- Code Creator Drawer -->
        <div class="overlay" id="ov-code" onclick="if(event.target===this) closeDrawer('ov-code')">
            <div class="drawer">
                <div class="drawer-handle"></div>
                <div class="drawer-title">Sinf kodi qo'shish</div>
                <div class="field">
                    <label>Sinf kodi *</label>
                    <input type="text" id="cd-code" placeholder="7A-2024, 8B-math...">
                </div>
                <div class="field">
                    <label>Tur</label>
                    <div class="toggle-row" style="margin-bottom:.5rem">
                        <button class="toggle-btn active" id="cd-univ-btn" onclick="setUniversal('cd', true)">🌍 Umumiy (barcha uchun)</button>
                        <button class="toggle-btn" id="cd-spec-btn" onclick="setUniversal('cd', false)">🎯 Aniq sinflar</button>
                    </div>
                    <div id="cd-grades-wrap" style="display:none">
                        <div class="flex" style="margin-bottom:.5rem">
                            <input type="text" id="cd-grade-input" placeholder="7A..." style="flex:1;background:var(--bg2);border:2px solid var(--border);border-radius:10px;color:var(--text);padding:.55rem .85rem;outline:none;font-size:.9rem" oninput="this.value=this.value.toUpperCase()" onkeydown="if(event.key==='Enter'){event.preventDefault();addGradeChip('cd')}">
                            <button class="btn btn-ghost btn-sm" onclick="addGradeChip('cd')">+</button>
                        </div>
                        <div id="cd-chips" class="flex"></div>
                    </div>
                </div>
                <div class="flex" style="justify-content:space-between;margin-top:.5rem">
                    <button class="btn btn-ghost" onclick="closeDrawer('ov-code')">Bekor</button>
                    <button class="btn btn-primary" onclick="saveCode()">+ Kod qo'shish</button>
                </div>
            </div>
        </div>

        <nav class="bottom-nav" id="t-bnav">
            <div class="bnav-item active" onclick="tTab('overview', this)"><div class="bnav-icon">📊</div><div>Asosiy</div></div>
            <div class="bnav-item" onclick="tTab('questions', this)"><div class="bnav-icon">❓</div><div>Savollar</div></div>
            <div class="bnav-item" onclick="tTab('tests', this)"><div class="bnav-icon">📋</div><div>Testlar</div></div>
            <div class="bnav-item" onclick="tTab('daily', this)"><div class="bnav-icon">📅</div><div>Kunlik</div></div>
            <div class="bnav-item" onclick="tTab('codes', this)"><div class="bnav-icon">🔑</div><div>Kodlar</div></div>
            <div class="bnav-item" onclick="tTab('results', this)"><div class="bnav-icon">📨</div><div>Natija</div></div>
            <div class="bnav-item" onclick="tTab('settings', this)"><div class="bnav-icon">⚙️</div><div>Sozlama</div></div>
        </nav>
    `;
    
    // Load overview by default
    setTimeout(() => {
        renderTOverview();
    }, 100);
}

// Teacher tab navigation
function tTab(name, el) {
    document.querySelectorAll('#t-sec-overview, #t-sec-questions, #t-sec-tests, #t-sec-daily, #t-sec-codes, #t-sec-results, #t-sec-settings')
        .forEach(s => s.classList.remove('active'));
    document.querySelectorAll('#t-bnav .bnav-item').forEach(b => b.classList.remove('active'));
    
    document.getElementById('t-sec-' + name).classList.add('active');
    if (el) el.classList.add('active');
    
    if (name === 'overview') renderTOverview();
    if (name === 'questions') renderTQuestions();
    if (name === 'tests') renderTTests();
    if (name === 'daily') renderTDaily();
    if (name === 'codes') renderTCodes();
    if (name === 'results') renderTResults();
    if (name === 'settings') renderTSettings();
}

// ==================== QUESTION FUNCTIONS ====================

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
    setUniversal('td', true);
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
    const isUniversal = document.getElementById('td-univ-btn').classList.contains('active');
    const grades = getChips('td');
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
        grades: isUniversal ? [] : grades
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
    setUniversal('dd', true);
    buildPicker('dd-picker', []);
    openDrawer('ov-daily');
}

async function saveDaily() {
    const title = document.getElementById('dd-name').value.trim();
    if (!title) {
        toast("Nom kiriting", 'err');
        return;
    }
    
    const isUniversal = document.getElementById('dd-univ-btn').classList.contains('active');
    const grades = getChips('dd');
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
        grades: isUniversal ? [] : grades
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

// ==================== CODE FUNCTIONS ====================

function openAddCode() {
    document.getElementById('cd-code').value = '';
    setUniversal('cd', true);
    document.getElementById('cd-chips').innerHTML = '';
    openDrawer('ov-code');
}

async function saveCode() {
    const code = document.getElementById('cd-code').value.trim();
    if (!code) {
        toast("Kod kiriting", 'err');
        return;
    }
    
    if (DB.classCodes.find(c => c.code === code)) {
        toast("Bu kod allaqachon mavjud", 'err');
        return;
    }
    
    const isUniversal = document.getElementById('cd-univ-btn').classList.contains('active');
    const grades = getChips('cd');
    
    DB.classCodes.push({
        code,
        isUniversal,
        grades: isUniversal ? [] : grades
    });
    
    await saveToCloud();
    closeDrawer('ov-code');
    renderTCodes();
    toast("Kod qo'shildi ✓");
}

async function deleteCode(code) {
    if (!confirm("Kod o'chirilsinmi?")) return;
    DB.classCodes = DB.classCodes.filter(c => c.code !== code);
    await saveToCloud();
    renderTCodes();
    toast("O'chirildi");
}

// ==================== HELPER FUNCTIONS ====================

function setUniversal(prefix, isUniv) {
    const univBtn = document.getElementById(prefix + '-univ-btn');
    const specBtn = document.getElementById(prefix + '-spec-btn');
    const wrap = document.getElementById(prefix + '-grades-wrap');
    
    if (univBtn) univBtn.classList.toggle('active', isUniv);
    if (specBtn) specBtn.classList.toggle('active', !isUniv);
    if (wrap) wrap.style.display = isUniv ? 'none' : '';
}

function addGradeChip(prefix) {
    const inp = document.getElementById(prefix + '-grade-input');
    if (!inp) return;
    
    const val = inp.value.trim().toUpperCase();
    if (!val) return;
    
    const chips = document.getElementById(prefix + '-chips');
    const existing = [...chips.querySelectorAll('.chip')].map(c => c.dataset.v);
    
    if (existing.includes(val)) {
        inp.value = '';
        return;
    }
    
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.dataset.v = val;
    chip.innerHTML = `${val} <span class="chip-remove" onclick="this.parentElement.remove()">✕</span>`;
    chips.appendChild(chip);
    inp.value = '';
}

function getChips(prefix) {
    const chips = document.getElementById(prefix + '-chips');
    return chips ? [...chips.querySelectorAll('.chip')].map(c => c.dataset.v) : [];
}

function buildPicker(containerId, selectedIds) {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    
    if (!DB.questions.length) {
        cont.innerHTML = '<div style="padding:.85rem 1rem;color:var(--muted);font-size:.85rem">Avval savol baniga savol qo\'shing!</div>';
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
    return [...document.querySelectorAll(`#${containerId} .picker-item.picked`)].map(el => {
        return el.id.replace(`pick_${containerId}_`, '');
    });
}

function openDrawer(id) {
    document.getElementById(id).classList.add('open');
}

function closeDrawer(id) {
    document.getElementById(id).classList.remove('open');
}

// ==================== OVERVIEW FUNCTIONS ====================

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

// ==================== QUESTIONS TAB ====================

function renderTQuestions() {
    const el = document.getElementById('t-sec-questions');
    if (!el) return;
    
    el.innerHTML = `
        <div class="flex" style="justify-content:space-between;margin-bottom:1rem">
            <div class="page-title">Savol banki (${DB.questions.length})</div>
            <button class="btn btn-primary btn-sm" onclick="openAddQuestion()">+ Savol qo'shish</button>
        </div>
        ${!DB.questions.length 
            ? emptyHTML('❓', "Hozircha savol yo'q.\n\"Savol qo'shish\" tugmasini bosing!")
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

// ==================== TESTS TAB ====================

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

// ==================== DAILY TAB ====================

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

// ==================== CODES TAB ====================

function renderTCodes() {
    const el = document.getElementById('t-sec-codes');
    if (!el) return;
    
    el.innerHTML = `
        <div class="flex" style="justify-content:space-between;margin-bottom:.75rem">
            <div class="page-title">Sinf kodlari</div>
            <button class="btn btn-primary btn-sm" onclick="openAddCode()">+ Kod qo'shish</button>
        </div>
        <p class="muted" style="margin-bottom:1rem;font-size:.82rem">
            O'quvchilar kirish paytida ushbu kodni kiritadi. Har bir sinf yoki guruh uchun alohida kod yaratishingiz mumkin.
        </p>
        ${!DB.classCodes.length 
            ? emptyHTML('🔑', "Hozircha kod yo'q")
            : DB.classCodes.map(cc => `
                <div class="card">
                    <div class="card-row">
                        <div class="card-info">
                            <div style="font-family:'JetBrains Mono',monospace;font-size:1.1rem;font-weight:700;color:var(--accent)">
                                ${esc(cc.code)}
                            </div>
                            <div style="margin-top:.4rem">
                                ${cc.isUniversal 
                                    ? '<span class="badge badge-blue">🌍 Umumiy</span>' 
                                    : (cc.grades || []).map(g => `<span class="badge badge-blue" style="margin-right:.3rem">${esc(g)}</span>`).join('')
                                }
                            </div>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="deleteCode('${cc.code}')">🗑</button>
                    </div>
                </div>
            `).join('')
        }
    `;
}

// ==================== RESULTS TAB ====================

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
                ${allGrades.map(g => `
                    <button class="filter-btn${rGradeFilter === g ? ' active' : ''}" 
                        onclick="rGradeFilter='${g}';renderTResults()">${esc(g)}</button>
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
                : [...filtered].reverse().map(r => resultCardHTML(r)).join('')
            )
        }
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
            <div class="field">
                <label>Yangi parol (bo'sh qoldirsangiz o'zgarmaydi)</label>
                <input type="password" id="set-pass" placeholder="Yangi parol">
            </div>
            <div class="flex">
                <button class="btn btn-primary" style="flex:1" onclick="saveSettings()">✓ Saqlash</button>
                <button class="btn btn-ghost" onclick="testTelegram()">📬 Sinab ko'rish</button>
            </div>
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
    const np = document.getElementById('set-pass')?.value || '';
    
    DB.settings.token = token;
    DB.settings.chatId = chatId;
    if (np) DB.settings.pass = np;
    
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

// Make all functions global
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
window.openAddCode = openAddCode;
window.saveCode = saveCode;
window.deleteCode = deleteCode;
window.setUniversal = setUniversal;
window.addGradeChip = addGradeChip;
window.togglePick = togglePick;
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.clearResults = clearResults;
window.exportCSV = exportCSV;
window.saveSettings = saveSettings;
window.testTelegram = testTelegram;