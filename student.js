// Render student dashboard
function renderStudentDashboard() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <nav class="navbar">
            <div class="navbar-brand">📐 MathClass</div>
            <div class="navbar-info" id="st-nav-info">👤 ${ME?.name || ''} · ${ME?.grade || ''}</div>
            <button class="btn btn-ghost btn-sm" onclick="doLogout()">Chiqish</button>
        </nav>
        
        <div class="main">
            <div class="tab-section active" id="st-sec-daily"></div>
            <div class="tab-section" id="st-sec-tests"></div>
            <div class="tab-section" id="st-sec-history"></div>
        </div>
        
        <nav class="bottom-nav" id="st-bnav">
            <div class="bnav-item active" onclick="stTab('daily', this)">
                <div class="bnav-icon">📅</div>
                <div>Kunlik</div>
            </div>
            <div class="bnav-item" onclick="stTab('tests', this)">
                <div class="bnav-icon">📋</div>
                <div>Testlar</div>
            </div>
            <div class="bnav-item" onclick="stTab('history', this)">
                <div class="bnav-icon">📊</div>
                <div>Natijalar</div>
            </div>
        </nav>
    `;
    
    // Load daily section by default
    setTimeout(() => {
        const navInfo = document.getElementById('st-nav-info');
        if (navInfo && ME) {
            navInfo.textContent = '👤 ' + ME.name + ' · ' + ME.grade;
        }
        stTab('daily', document.querySelector('#st-bnav .bnav-item'));
    }, 100);
}

// Student tab navigation
function stTab(name, el) {
    document.querySelectorAll('#st-sec-daily, #st-sec-tests, #st-sec-history').forEach(s => {
        if (s) s.classList.remove('active');
    });
    document.querySelectorAll('#st-bnav .bnav-item').forEach(b => {
        if (b) b.classList.remove('active');
    });
    
    const section = document.getElementById('st-sec-' + name);
    if (section) section.classList.add('active');
    if (el) el.classList.add('active');
    
    if (name === 'daily') renderStDaily();
    if (name === 'tests') renderStTests();
    if (name === 'history') renderStHistory();
}

// Get student's tests
function getMyTests() {
    if (!ME) return [];
    return DB.tests.filter(t => t.isUniversal || (t.grades || []).includes(ME.grade));
}

// Get student's daily tasks
function getMyDaily() {
    if (!ME) return [];
    return DB.dailyTasks.filter(d => d.isUniversal || (d.grades || []).includes(ME.grade));
}

// Get student's results
function getMyResults() {
    if (!ME) return [];
    return DB.results.filter(r => r.student === ME.name && r.grade === ME.grade);
}

// Render daily tasks
function renderStDaily() {
    const el = document.getElementById('st-sec-daily');
    if (!el) return;
    
    const tasks = getMyDaily();
    const today = new Date().toDateString();
    
    if (!tasks.length) {
        el.innerHTML = emptyHTML('📅', "Bugun kunlik topshiriq yo'q");
        return;
    }
    
    el.innerHTML = tasks.map(dt => {
        const qs = (dt.qids || []).map(id => DB.questions.find(q => q.id === id)).filter(Boolean);
        const done = DB.results.find(r => 
            r.student === ME?.name && 
            r.grade === ME?.grade && 
            r.testId === dt.id && 
            r.type === 'daily' && 
            new Date(r.timestamp).toDateString() === today
        );
        
        return `<div class="daily-hero${done ? ' daily-done' : ''}">
            <div class="daily-label">📅 KUNLIK TOPSHIRIQ</div>
            <div class="daily-title">${esc(dt.title)}</div>
            <div class="daily-sub">${qs.length} ta savol</div>
            ${done 
                ? `<div class="daily-done-msg">✅ Bajarildi! Ball: ${done.score}/${done.total}</div>`
                : `<button class="btn btn-primary" style="margin-top:.85rem; border-radius:10px" 
                    onclick="startActivity('${dt.id}', 'daily')">Boshlash →</button>`
            }
        </div>`;
    }).join('');
}

// Render tests
function renderStTests() {
    const el = document.getElementById('st-sec-tests');
    if (!el) return;
    
    const tests = getMyTests();
    const myR = getMyResults();
    
    if (!tests.length) {
        el.innerHTML = emptyHTML('📋', "Hozircha test yo'q");
        return;
    }
    
    el.innerHTML = `<div class="page-title">Testlar</div>` + 
        tests.map(t => {
            const done = myR.find(r => r.testId === t.id && r.type !== 'daily');
            const qs = (t.qids || []).map(id => DB.questions.find(q => q.id === id)).filter(Boolean);
            
            return `<div class="card">
                <div class="card-row">
                    <div class="card-info">
                        <div class="card-title">${esc(t.title)}</div>
                        <div class="card-meta">
                            ${qs.length} ta savol${t.time ? ` · ⏱ ${t.time} daqiqa` : ''}
                        </div>
                    </div>
                    ${done 
                        ? `<span class="badge ${gradeBadge(done.score, done.total)}">
                            ✓ ${done.score}/${done.total}
                        </span>`
                        : `<button class="btn btn-primary btn-sm" 
                            onclick="startActivity('${t.id}', 'test')">Boshlash →</button>`
                    }
                </div>
            </div>`;
        }).join('');
}

// Render history
function renderStHistory() {
    const el = document.getElementById('st-sec-history');
    if (!el) return;
    
    const mine = getMyResults().reverse();
    
    if (!mine.length) {
        el.innerHTML = emptyHTML('📊', "Hozircha natija yo'q");
        return;
    }
    
    el.innerHTML = `<div class="page-title">Mening natijalarim</div>` +
        mine.map(r => {
            const pct = Math.round(r.score / r.total * 100);
            return `<div class="card">
                <div class="card-row">
                    <div class="card-info">
                        <div class="card-title">${esc(r.title)}</div>
                        <div class="card-meta">${r.date}</div>
                    </div>
                    <div style="text-align:right;flex-shrink:0">
                        <div style="font-weight:900;font-size:1.1rem">${r.score}/${r.total}</div>
                        <span class="badge ${gradeBadge(r.score, r.total)}">${pct}%</span>
                    </div>
                </div>
            </div>`;
        }).join('');
}

// Start test/daily activity
let activeTestObj = null;
let testAnswers = {};
let timerInt = null;
let timerSec = 0;

function startActivity(id, type) {
    const obj = type === 'daily'
        ? DB.dailyTasks.find(d => d.id === id)
        : DB.tests.find(t => t.id === id);
    
    if (!obj) {
        toast("Topshiriq topilmadi", 'err');
        return;
    }
    
    activeTestObj = { ...obj, type };
    testAnswers = {};
    
    if (timerInt) clearInterval(timerInt);
    
    // Build questions
    const qs = (obj.qids || []).map(id => DB.questions.find(q => q.id === id)).filter(Boolean);
    
    // Create test screen
    const app = document.getElementById('app');
    app.innerHTML = `
        <nav class="navbar">
            <div class="navbar-brand" style="font-size:.95rem">${esc(obj.title)}</div>
            <div class="timer" id="test-timer" style="display:none">00:00</div>
            <button class="btn btn-primary btn-sm" onclick="submitTest()">Yuborish →</button>
        </nav>
        <div class="main">
            <div class="progress-wrap">
                <div class="progress-label">
                    <span id="test-prog-txt">0/${qs.length}</span>
                    <span id="test-prog-pct">0%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="test-progress" style="width:0%"></div>
                </div>
            </div>
            <div id="test-questions"></div>
        </div>
    `;
    
    document.getElementById('test-questions').innerHTML = qs.map((q, i) => buildQBlock(q, i)).join('');
    updateTestProgress(qs.length);
    
    // Timer
    const timerEl = document.getElementById('test-timer');
    if (obj.time > 0) {
        timerSec = obj.time * 60;
        timerEl.style.display = '';
        updateTimerDisplay();
        timerInt = setInterval(() => {
            timerSec--;
            updateTimerDisplay();
            if (timerSec <= 0) {
                clearInterval(timerInt);
                submitTest();
            }
        }, 1000);
    } else {
        timerEl.style.display = 'none';
    }
}

function buildQBlock(q, i) {
    return `<div class="q-block">
        <div class="q-num">SAVOL ${i + 1}${q.tag ? ' · ' + esc(q.tag) : ''}</div>
        <div class="q-text">${esc(q.text)}</div>
        ${q.img ? `<img class="q-img" src="${q.img}" alt="">` : ''}
        <div class="options-grid">
            ${q.opts.map((o, j) => `
                <button class="opt-btn" id="opt_${q.id}_${j}" onclick="pickAnswer('${q.id}', ${j}, ${q.opts.length})">
                    <span class="opt-letter">${'ABCD'[j]}</span>
                    <span>${esc(o)}</span>
                </button>
            `).join('')}
        </div>
    </div>`;
}

function pickAnswer(qid, idx, count) {
    for (let j = 0; j < count; j++) {
        const el = document.getElementById(`opt_${qid}_${j}`);
        if (el) {
            el.classList.remove('selected');
        }
    }
    const sel = document.getElementById(`opt_${qid}_${idx}`);
    if (sel) sel.classList.add('selected');
    testAnswers[qid] = idx;
    
    const qs = (activeTestObj?.qids || []);
    updateTestProgress(qs.length);
}

function updateTestProgress(total) {
    const answered = Object.keys(testAnswers).length;
    const pct = total ? Math.round(answered / total * 100) : 0;
    
    const progTxt = document.getElementById('test-prog-txt');
    const progPct = document.getElementById('test-prog-pct');
    const progress = document.getElementById('test-progress');
    
    if (progTxt) progTxt.textContent = `Javob berildi: ${answered}/${total}`;
    if (progPct) progPct.textContent = pct + '%';
    if (progress) progress.style.width = pct + '%';
}

function updateTimerDisplay() {
    const m = String(Math.floor(timerSec / 60)).padStart(2, '0');
    const s = String(timerSec % 60).padStart(2, '0');
    const el = document.getElementById('test-timer');
    if (el) {
        el.textContent = `${m}:${s}`;
        el.className = 'timer' + (timerSec < 30 ? ' danger' : timerSec < 60 ? ' warn' : '');
    }
}

async function submitTest() {
    clearInterval(timerInt);
    
    const obj = activeTestObj;
    if (!obj) return;
    
    const qs = (obj.qids || []).map(id => DB.questions.find(q => q.id === id)).filter(Boolean);
    let score = 0;
    
    qs.forEach(q => {
        if (testAnswers[q.id] !== undefined && testAnswers[q.id] === q.correct) {
            score++;
        }
    });
    
    const today = new Date().toDateString();
    const uid = `${ME.name}_${obj.id}_${obj.type === 'daily' ? today : 'once'}`;
    
    // Check if already submitted
    if (DB.results.find(r => r.uid === uid)) {
        toast("Bu testni allaqachon topshirgansiz!", 'err');
        navigateTo('student');
        return;
    }
    
    const res = {
        uid,
        id: Date.now() + '',
        student: ME.name,
        grade: ME.grade,
        title: obj.title,
        type: obj.type,
        testId: obj.id,
        score,
        total: qs.length,
        date: new Date().toLocaleString('uz-UZ'),
        timestamp: new Date().toISOString()
    };
    
    DB.results.push(res);
    await saveToCloud();
    sendTG(res);
    showResult(res);
}

function showResult(res) {
    const pct = Math.round(res.score / res.total * 100);
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="result-box" style="margin: 2rem auto; padding: 1rem;">
            <div class="score-circle">
                <svg viewBox="0 0 150 150">
                    <circle cx="75" cy="75" r="65" fill="none" stroke="var(--bg2)" stroke-width="14"/>
                    <circle cx="75" cy="75" r="65" fill="none" stroke="var(--accent)" stroke-width="14"
                        stroke-linecap="round" stroke-dasharray="408" stroke-dashoffset="${408 - 408 * pct / 100}"
                        id="score-arc"/>
                </svg>
                <div class="score-inner">
                    <span class="score-pct">${pct}%</span>
                    <span class="score-lbl">BALL</span>
                </div>
            </div>
            <div class="result-title">${pct >= 80 ? 'Ajoyib!' : pct >= 50 ? 'Yaxshi!' : 'Harakat qiling!'}</div>
            <div class="result-sub">${res.total} savoldan ${res.score} tasiga to'g'ri javob berdingiz</div>
            <div class="result-table">
                <div class="rt-row"><span>Topshiriq</span><span>${esc(res.title)}</span></div>
                <div class="rt-row"><span>Ball</span><span>${res.score} / ${res.total}</span></div>
                <div class="rt-row"><span>Foiz</span><span>${pct}%</span></div>
                <div class="rt-row"><span>Sinf</span><span>${esc(res.grade)}</span></div>
                <div class="rt-row"><span>Sana</span><span>${esc(res.date)}</span></div>
                <div class="rt-row"><span>Holat</span><span class="badge ${gradeBadge(res.score, res.total)}">${pct >= 60 ? 'O\'tdi' : 'Qoldi'}</span></div>
            </div>
            <button class="btn btn-ghost btn-full btn-lg" onclick="navigateTo('student')">← Bosh sahifaga</button>
        </div>
    `;
}

async function sendTG(res) {
    const { token, chatId } = DB.settings;
    if (!token || !chatId) return;
    
    const pct = Math.round(res.score / res.total * 100);
    const e = pct >= 80 ? '⭐' : pct >= 60 ? '✅' : '⚠️';
    const msg = `${e} <b>Yangi natija!</b>\n\n👤 <b>O'quvchi:</b> ${res.student}\n🏫 <b>Sinf:</b> ${res.grade}\n📝 <b>Topshiriq:</b> ${res.title}\n🔢 <b>Ball:</b> ${res.score}/${res.total} (${pct}%)\n📅 <b>Sana:</b> ${res.date}`;
    
    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' })
        });
    } catch (e) {
        console.log('Telegram error:', e);
    }
}

// Make functions global
window.renderStudentDashboard = renderStudentDashboard;
window.stTab = stTab;
window.getMyTests = getMyTests;
window.getMyDaily = getMyDaily;
window.getMyResults = getMyResults;
window.renderStDaily = renderStDaily;
window.renderStTests = renderStTests;
window.renderStHistory = renderStHistory;
window.startActivity = startActivity;
window.pickAnswer = pickAnswer;
window.submitTest = submitTest;