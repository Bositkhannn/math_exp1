let ME = null;

function initAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, user.uid));
            if (userDoc.exists()) {
                ME = { uid: user.uid, ...userDoc.data() };
                if (user.email === 'teacher@mathclass.local') {
                    navigateTo('teacher');
                    setTimeout(() => {
                        if (typeof tTab === 'function') {
                            const first = document.querySelector('#t-bnav .bnav-item');
                            if (first) tTab('overview', first);
                        }
                    }, 200);
                } else {
                    navigateTo('student');
                    setTimeout(() => {
                        const info = document.getElementById('st-nav-info');
                        if (info) info.textContent = `👤 ${ME.name} · ${ME.grade}`;
                        if (typeof stTab === 'function') {
                            const first = document.querySelector('#st-bnav .bnav-item');
                            if (first) stTab('daily', first);
                        }
                    }, 200);
                }
            } else if (user.email === 'teacher@mathclass.local') {
                ME = { uid: user.uid, name: 'Teacher', role: 'teacher' };
                navigateTo('teacher');
                setTimeout(() => {
                    if (typeof tTab === 'function') {
                        const first = document.querySelector('#t-bnav .bnav-item');
                        if (first) tTab('overview', first);
                    }
                }, 200);
            } else {
                await signOut(auth);
                renderLanding();
            }
        } else {
            ME = null;
            renderLanding();
        }
    });
}

async function doStudentLogin(name, password) {
    if (!password) { toast("Parolni kiriting", 'err'); return false; }
    try {
        const email = name.toLowerCase().replace(/\s+/g, '.') + '@mathclass.local';
        await signInWithEmailAndPassword(auth, email, password);
        toast('Xush kelibsiz! ✓', 'ok');
        return true;
    } catch (e) {
        if (e.code === 'auth/user-not-found') toast("Foydalanuvchi topilmadi", 'err');
        else if (e.code === 'auth/wrong-password') toast("Noto'g'ri parol", 'err');
        else toast(e.message, 'err');
        return false;
    }
}

async function doStudentRegister(name, grade, password) {
    if (!password) { toast("Parolni kiriting", 'err'); return false; }
    try {
        const email = name.toLowerCase().replace(/\s+/g, '.') + '@mathclass.local';
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, COLLECTIONS.STUDENTS, cred.user.uid), {
            name, grade: grade.toUpperCase(), email, createdAt: new Date().toISOString()
        });
        toast("Ro'yxatdan o'tildi ✓", 'ok');
        return true;
    } catch (e) {
        if (e.code === 'auth/email-already-in-use') toast("Bu foydalanuvchi mavjud", 'err');
        else toast(e.message, 'err');
        return false;
    }
}

async function doTeacherLogin(password) {
    if (!password) { toast("Parolni kiriting", 'err'); return false; }
    try {
        await signInWithEmailAndPassword(auth, 'teacher@mathclass.local', password);
        toast('Xush kelibsiz, o\'qituvchi!', 'ok');
        return true;
    } catch (e) {
        if (e.code === 'auth/user-not-found') {
            toast("Teacher yaratilmoqda...", 'ok');
            const created = await createTeacherAccount(password);
            if (created) return doTeacherLogin(password);
        } else if (e.code === 'auth/wrong-password') {
            toast('Noto\'g\'ri parol! To\'g\'ri parol: teacher123', 'err');
        } else toast(e.message, 'err');
        return false;
    }
}

async function createTeacherAccount(pass = 'teacher123') {
    try {
        await createUserWithEmailAndPassword(auth, 'teacher@mathclass.local', pass);
        toast("Teacher yaratildi! Parol: teacher123", 'ok');
        return true;
    } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
            toast("Teacher mavjud. Parol: teacher123", 'ok');
            return true;
        }
        return false;
    }
}

async function doLogout() {
    await signOut(auth);
    ME = null;
    renderLanding();
}

window.ME = ME;
window.initAuth = initAuth;
window.doStudentLogin = doStudentLogin;
window.doStudentRegister = doStudentRegister;
window.doTeacherLogin = doTeacherLogin;
window.doLogout = doLogout;
window.createTeacherAccount = createTeacherAccount;