let ME = null;

function initAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            if (user.email === 'teacher@mathclass.local') {
                ME = { uid: user.uid, name: "O'qituvchi", role: 'teacher' };
                navigateTo('teacher');
                setTimeout(() => {
                    if (typeof tTab === 'function') {
                        const first = document.querySelector('#t-bnav .bnav-item');
                        if (first) tTab('overview', first);
                    }
                }, 200);
            } else {
                const userDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, user.uid));
                if (userDoc.exists() && !userDoc.data().deleted) {
                    ME = { uid: user.uid, ...userDoc.data() };
                    navigateTo('student');
                    setTimeout(() => {
                        const info = document.getElementById('st-nav-info');
                        if (info && ME) info.textContent = `👤 ${ME.name} · ${ME.grade || ''}`;
                        if (typeof stTab === 'function') {
                            const first = document.querySelector('#st-bnav .bnav-item');
                            if (first) stTab('daily', first);
                        }
                    }, 200);
                } else {
                    await signOut(auth);
                    renderLanding();
                }
            }
        } else {
            ME = null;
            renderLanding();
        }
    });
}

async function doStudentLogin(username, password) {
    if (!username || !password) { toast("Login va parolni kiriting", 'err'); return false; }
    try {
        const email = username.toLowerCase().trim() + '@mathclass.local';
        await signInWithEmailAndPassword(auth, email, password);
        toast('Xush kelibsiz! ✓', 'ok');
        return true;
    } catch (e) {
        if (['auth/user-not-found','auth/wrong-password','auth/invalid-credential'].includes(e.code)) {
            toast("Login yoki parol noto'g'ri", 'err');
        } else { toast(e.message, 'err'); }
        return false;
    }
}

async function doTeacherLogin(password) {
    if (!password) { toast("Parolni kiriting", 'err'); return false; }
    try {
        await signInWithEmailAndPassword(auth, 'teacher@mathclass.local', password);
        toast("Xush kelibsiz, o'qituvchi! ✓", 'ok');
        return true;
    } catch (e) {
        if (['auth/user-not-found','auth/invalid-credential'].includes(e.code)) {
            const ok = await createTeacherAccount(password);
            if (ok) return doTeacherLogin(password);
        } else if (e.code === 'auth/wrong-password') {
            toast("Noto'g'ri parol", 'err');
        } else { toast(e.message, 'err'); }
        return false;
    }
}

async function createTeacherAccount(pass = 'teacher123') {
    try {
        await createUserWithEmailAndPassword(auth, 'teacher@mathclass.local', pass);
        return true;
    } catch (e) {
        if (e.code === 'auth/email-already-in-use') return true;
        return false;
    }
}

// Student account creation with password stored (plaintext – only teacher sees)
async function createStudentAccount(username, password, grade, fullName = '') {
    if (!username || !password || !grade) return { ok: false, msg: "Barcha maydonlarni to'ldiring" };
    const email = username.toLowerCase().trim() + '@mathclass.local';
    const tPass = DB.settings.pass || 'teacher123';
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const uid  = cred.user.uid;
        const data = {
            name: fullName || username.trim(),
            grade: grade.trim().toUpperCase(),
            email,
            username: username.toLowerCase().trim(),
            password: password,   // ⚠️ stored plaintext – only teacher can view
            createdAt: new Date().toISOString(),
            deleted: false
        };
        await setDoc(doc(db, COLLECTIONS.STUDENTS, uid), data);
        DB.students[uid] = data;
        // Re‑login as teacher
        await signInWithEmailAndPassword(auth, 'teacher@mathclass.local', tPass);
        return { ok: true, uid };
    } catch (e) {
        try { await signInWithEmailAndPassword(auth, 'teacher@mathclass.local', tPass); } catch(_) {}
        if (e.code === 'auth/email-already-in-use') return { ok: false, msg: `"${username}" logini band` };
        return { ok: false, msg: e.message };
    }
}

// Reset student password (generates random, updates Firestore)
async function resetStudentPassword(uid) {
    const student = DB.students[uid];
    if (!student) return { ok: false, msg: "O'quvchi topilmadi" };
    const newPass = Math.random().toString(36).slice(-8); // random 8 chars

    try {
        // Only update Firestore – teacher must give the new password to student
        student.password = newPass;
        await setDoc(doc(db, COLLECTIONS.STUDENTS, uid), student);
        DB.students[uid] = student;
        return { ok: true, newPass };
    } catch (e) {
        return { ok: false, msg: e.message };
    }
}

// Update teacher username (email) and password
async function updateTeacherAccount(currentPass, newUsername, newPass) {
    const user = auth.currentUser;
    if (!user || user.email !== 'teacher@mathclass.local') {
        return { ok: false, msg: "Avtorizatsiyadan o'ting" };
    }
    try {
        // Reauthenticate
        const credential = EmailAuthProvider.credential('teacher@mathclass.local', currentPass);
        await reauthenticateWithCredential(user, credential);
        
        if (newUsername && newUsername !== 'teacher') {
            const newEmail = newUsername.toLowerCase() + '@mathclass.local';
            await updateEmail(user, newEmail);
            DB.settings.teacherUsername = newUsername;
        }
        if (newPass) {
            await updatePassword(user, newPass);
        }
        await saveToCloud();
        return { ok: true };
    } catch (e) {
        return { ok: false, msg: e.message };
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
window.doTeacherLogin = doTeacherLogin;
window.doLogout = doLogout;
window.createTeacherAccount = createTeacherAccount;
window.createStudentAccount = createStudentAccount;
window.resetStudentPassword = resetStudentPassword;
window.updateTeacherAccount = updateTeacherAccount;