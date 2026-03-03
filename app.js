// ... (helpers unchanged) ...

function showTeacherLogin() {
    document.getElementById('app').innerHTML = `
        <div class="form-screen">
            <div class="form-box">
                <div class="form-icon">📐</div>
                <div class="form-title">O'qituvchi paneli</div>
                <div class="form-sub">Login va parolni kiriting</div>
                <div class="field">
                    <label>Login</label>
                    <input type="text" id="tl-username" value="teacher" placeholder="teacher">
                </div>
                <div class="field">
                    <label>Parol</label>
                    <input type="password" id="tl-pass" placeholder=""
                        onkeydown="if(event.key==='Enter') handleTeacherAuth()">
                </div>
                <button class="btn btn-primary btn-full btn-lg" onclick="handleTeacherAuth()" style="margin-bottom:.6rem">Kirish →</button>
                <button class="btn btn-ghost btn-full" onclick="renderLanding()">← Orqaga</button>
                <hr class="divider">
                <p class="muted" style="font-size:.78rem">Boshlang'ich parol: <span class="mono">teacher123</span></p>
            </div>
        </div>
    `;
}

async function handleTeacherAuth() {
    const username = document.getElementById('tl-username')?.value.trim();
    const pass = document.getElementById('tl-pass')?.value;
    if (!username) { toast("Loginni kiriting", 'err'); return; }
    if (!pass)     { toast("Parolni kiriting", 'err'); return; }
    // For now, only 'teacher' works, but we'll allow any username that maps to teacher@mathclass.local?
    // Actually teacher email is fixed, so username is just for display.
    await doTeacherLogin(pass);
}

// ... (rest of app.js unchanged) ...

// ==================== GLOBAL HELPERS ====================
let toastTimer;
function toast(msg, type = 'ok') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

function esc(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        return '&#039;';
    });
}

function emptyHTML(icon, text) {
    return `<div class="empty"><div class="empty-icon">${icon}</div><div class="empty-text">${text.replace(/\n/g,'<br>')}</div></div>`;
}

function gradeBadge(score, total) {
    const p = score / total;
    return p >= 0.8 ? 'badge-green' : p >= 0.5 ? 'badge-yellow' : 'badge-red';
}

function resultCardHTML(r) {
    const pct = Math.round(r.score / r.total * 100);
    return `<div class="card"><div class="card-row"><div class="card-info"><div class="card-title">${esc(r.student)} <span class="badge badge-blue">${esc(r.grade)}</span></div><div class="card-meta">${esc(r.title)} · ${esc(r.date)}</div></div><div style="text-align:right;flex-shrink:0"><div style="font-weight:900;font-size:1.1rem">${r.score}/${r.total}</div><span class="badge ${gradeBadge(r.score,r.total)}">${pct}%</span></div></div></div>`;
}

// ==================== THEMES ====================
const THEMES = {
    blue: { label:"Ko'k", bg:"#0f172a", accent:"#38bdf8" },
    ocean: { label:"Okean", bg:"#0a1628", accent:"#22d3ee" },
    forest: { label:"O'rmon", bg:"#0a1a0e", accent:"#4ade80" },
    sunset: { label:"Quyosh", bg:"#1a0a0a", accent:"#fb923c" },
    lavender: { label:"Binafsha", bg:"#0d0b1e", accent:"#a78bfa" },
    light: { label:"Yorug'", bg:"#f0f4ff", accent:"#3b82f6" }
};

function buildThemeDots() {
    const wrap = document.getElementById('theme-dots');
    if (!wrap) return;
    wrap.innerHTML = Object.entries(THEMES).map(([k,v]) => 
        `<button class="tdot${DB.settings.theme===k?' active':''}" data-t="${k}" title="${v.label}" style="background:linear-gradient(135deg,${v.bg},${v.accent})" onclick="applyTheme('${k}')"></button>`
    ).join('');
}

function applyTheme(key) {
    document.body.setAttribute('data-theme', key === 'blue' ? '' : key);
    DB.settings.theme = key;
    saveToCloud();
    buildThemeDots();
}

// ==================== LANDING ====================
function renderLanding() {
    document.getElementById('app').innerHTML = `
        <div class="landing">
            <div class="landing-emoji">📐</div>
            <h1 class="landing-title">Math<span>Class</span></h1>
            <p class="landing-sub">Interaktiv matematika platformasi</p>
            <div class="theme-dots" id="theme-dots"></div>
            <div class="landing-btns">
                <button class="btn btn-primary btn-lg btn-full" onclick="showStudentLogin()">🎓 O'quvchi</button>
                <button class="btn btn-ghost btn-lg btn-full" onclick="showTeacherLogin()">📐 O'qituvchi</button>
            </div>
        </div>
    `;
    buildThemeDots();
}

function showStudentLogin() {
    document.getElementById('app').innerHTML = `
        <div class="form-screen">
            <div class="form-box">
                <div class="form-icon">🎓</div>
                <div class="form-title">Xush kelibsiz!</div>
                <div class="form-sub">Login va parolingizni kiriting</div>
                <div class="field">
                    <label>Login</label>
                    <input type="text" id="sl-user" placeholder=""
                        autocapitalize="none" spellcheck="false"
                        onkeydown="if(event.key==='Enter') document.getElementById('sl-pass').focus()">
                </div>
                <div class="field">
                    <label>Parol</label>
                    <input type="password" id="sl-pass" placeholder=""
                        onkeydown="if(event.key==='Enter') handleStudentAuth()">
                </div>
                <button class="btn btn-primary btn-full btn-lg" onclick="handleStudentAuth()" style="margin-bottom:.6rem">Kirish →</button>
                <button class="btn btn-ghost btn-full" onclick="renderLanding()">← Orqaga</button>
                <p class="muted" style="font-size:.75rem;text-align:center;margin-top:.85rem">Login va parol o'qituvchidan beriladi</p>
            </div>
        </div>
    `;
}

function showTeacherLogin() {
    document.getElementById('app').innerHTML = `
        <div class="form-screen">
            <div class="form-box">
                <div class="form-icon">📐</div>
                <div class="form-title">O'qituvchi paneli</div>
                <div class="form-sub">Parolingizni kiriting</div>
                <div class="field">
                    <label>Login</label>
                    <input type="text" value="teacher" disabled style="opacity:.6;cursor:not-allowed">
                </div>
                <div class="field">
                    <label>Parol</label>
                    <input type="password" id="tl-pass" placeholder="••••••"
                        onkeydown="if(event.key==='Enter') handleTeacherAuth()">
                </div>
                <button class="btn btn-primary btn-full btn-lg" onclick="handleTeacherAuth()" style="margin-bottom:.6rem">Kirish →</button>
                <button class="btn btn-ghost btn-full" onclick="renderLanding()">← Orqaga</button>
                <hr class="divider">
                <p class="muted" style="font-size:.78rem">Boshlang'ich parol: <span class="mono">teacher123</span></p>
            </div>
        </div>
    `;
}

async function handleStudentAuth() {
    const username = document.getElementById('sl-user')?.value.trim();
    const pass = document.getElementById('sl-pass')?.value;
    if (!username) { toast("Loginni kiriting", 'err'); return; }
    if (!pass)     { toast("Parol kiriting", 'err'); return; }
    await doStudentLogin(username, pass);
}

async function handleTeacherAuth() {
    const pass = document.getElementById('tl-pass')?.value;
    await doTeacherLogin(pass);
}

function navigateTo(screen) {
    if (screen === 'landing') renderLanding();
    else if (screen === 'student') renderStudentDashboard();
    else if (screen === 'teacher') renderTeacherPanel();
}

// ==================== INIT ====================
async function initApp() {
    console.log('🚀 MathClass starting...');
    await loadFromCloud();
    await seedInitialData();
    await createTeacherAccount(); // ensures teacher exists
    initAuth();
    console.log('✅ MathClass ready');
}

document.addEventListener('DOMContentLoaded', initApp);

// Make helpers global
window.toast = toast;
window.esc = esc;
window.emptyHTML = emptyHTML;
window.gradeBadge = gradeBadge;
window.resultCardHTML = resultCardHTML;
window.THEMES = THEMES;
window.buildThemeDots = buildThemeDots;
window.applyTheme = applyTheme;
window.renderLanding = renderLanding;
window.showStudentLogin = showStudentLogin;
window.showTeacherLogin = showTeacherLogin;
window.handleStudentAuth = handleStudentAuth;
window.handleTeacherAuth = handleTeacherAuth;
window.navigateTo = navigateTo;