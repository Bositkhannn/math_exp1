const DB = {
    questions: [],
    tests: [],
    dailyTasks: [],
    results: [],        // each result now includes `answers` (object)
    students: {},
    topics: [],
    settings: {
        pass: 'teacher123',
        token: '',
        chatId: '',
        theme: 'blue',
        teacherUsername: 'teacher'   // added for future use
    }
};

const COLLECTIONS = {
    QUESTIONS: 'questions',
    TESTS: 'tests',
    DAILY_TASKS: 'dailyTasks',
    RESULTS: 'results',
    STUDENTS: 'students',
    TOPICS: 'topics',
    SETTINGS: 'settings'
};

// Allowed grades constant
const ALLOWED_GRADES = ["7-F", "8-F", "9-F", "10-F", "11-F"];

async function loadFromCloud() {
    try {
        const qSnap = await getDocs(collection(db, COLLECTIONS.QUESTIONS));
        DB.questions = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const tSnap = await getDocs(collection(db, COLLECTIONS.TESTS));
        DB.tests = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const dSnap = await getDocs(collection(db, COLLECTIONS.DAILY_TASKS));
        DB.dailyTasks = dSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const rSnap = await getDocs(collection(db, COLLECTIONS.RESULTS));
        DB.results = rSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const sSnap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
        DB.students = {};
        sSnap.docs.forEach(d => { DB.students[d.id] = d.data(); });

        const topSnap = await getDocs(collection(db, COLLECTIONS.TOPICS));
        DB.topics = topSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const settingsDoc = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'main'));
        if (settingsDoc.exists()) DB.settings = settingsDoc.data();

        console.log('✅ Data loaded from cloud');
    } catch (e) { console.error('Load error:', e); }
}

async function saveToCloud() {
    try {
        const batch = writeBatch(db);
        DB.questions.forEach(q => batch.set(doc(db, COLLECTIONS.QUESTIONS, q.id), q));
        DB.tests.forEach(t => batch.set(doc(db, COLLECTIONS.TESTS, t.id), t));
        DB.dailyTasks.forEach(d => batch.set(doc(db, COLLECTIONS.DAILY_TASKS, d.id), d));
        DB.results.forEach(r => batch.set(doc(db, COLLECTIONS.RESULTS, r.id), r));
        DB.topics.forEach(t => batch.set(doc(db, COLLECTIONS.TOPICS, t.id), t));
        Object.entries(DB.students).forEach(([id, s]) => batch.set(doc(db, COLLECTIONS.STUDENTS, id), s));
        batch.set(doc(db, COLLECTIONS.SETTINGS, 'main'), DB.settings);
        await batch.commit();
        console.log('✅ Data saved to cloud');
    } catch (e) { console.error('Save error:', e); }
}

async function seedInitialData() {
    if (DB.questions.length === 0) {
        DB.questions.push(
            { id: 'q1', text: '7 × 8 nechiga teng?', opts: ['48','56','54','64'], correct:1, img:null, tag:'Arifmetika', topicId:'' },
            { id: 'q2', text: '2x + 5 = 13. x = ?', opts: ['3','4','5','6'], correct:1, img:null, tag:'Algebra', topicId:'' },
            { id: 'q3', text: 'Radiusi 5 bo\'lgan aylana yuzi (π≈3.14)', opts: ['78.5','31.4','15.7','25'], correct:0, img:null, tag:'Geometriya', topicId:'' },
            { id: 'q4', text: '200 ning 15% i qancha?', opts: ['25','30','35','40'], correct:1, img:null, tag:'Foizlar', topicId:'' },
            { id: 'q5', text: '√144 = ?', opts: ['11','12','13','14'], correct:1, img:null, tag:'Arifmetika', topicId:'' }
        );
        DB.tests.push({ id:'t1', title:"Boshlang'ich test", qids:['q1','q2','q3','q4','q5'], time:10, isUniversal:true, grades:[] });
        DB.dailyTasks.push({ id:'dt1', title:'Yangi kunlik mashq', qids:['q1','q5'], isUniversal:true, grades:[] }); // changed title
        // No classCodes seeded
        await saveToCloud();
    }
}

window.DB = DB;
window.COLLECTIONS = COLLECTIONS;
window.ALLOWED_GRADES = ALLOWED_GRADES;
window.loadFromCloud = loadFromCloud;
window.saveToCloud = saveToCloud;
window.seedInitialData = seedInitialData;