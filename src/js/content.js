// Math Topics and Quiz Data - 6th Grade Curriculum
export const topics = [
    {
        id: 'fractions',
        title: 'Kasrlar',
        icon: '🍰',
        theory: 'Kasr - bu butun narsaning bir qismi. Masalan, pitssaning yarmi bu 1/2 qismini anglatadi. Kasr surati narsaning necha qismi olinganini, maxraji esa butun narsa nechta teng bo\'lakka bo\'linganini ko\'rsatadi.',
        quizzes: [
            { type: 'mcq', q: '1/2 + 1/2 nimaga teng?', options: ['1', '1/4', '2/4', '0'], correct: 0, difficulty: 'easy' },
            { type: 'fib', q: '3/4 kasrning surati necha?', correct: '3', difficulty: 'easy' },
            { type: 'mcq', q: 'Qaysi kasr katta: 1/3 yoki 1/4?', options: ['1/3', '1/4', 'Teng', 'Noma\'lum'], correct: 0, difficulty: 'medium' },
            { type: 'mcq', q: '2/5 ni o\'nli kasr ko\'rinishida yozing:', options: ['0.4', '0.2', '0.5', '2.5'], correct: 0, difficulty: 'medium' },
            { type: 'mcq', q: 'Kasrning maxraji nimani bildiradi?', options: ['Necha bo\'lakka bo\'linganini', 'Necha bo\'lak olinganini', 'Butun sonni', 'Nolga tengligini'], correct: 0, difficulty: 'easy' },
            { type: 'mcq', q: '4/8 kasrni qisqartiring:', options: ['1/2', '1/4', '2/3', '1/8'], correct: 0, difficulty: 'easy' },
            { type: 'mcq', q: 'Aralash sonni toping:', options: ['2 butun 1/3', '5/2', '0.5', '10'], correct: 0, difficulty: 'easy' },
            { type: 'mcq', q: '5/5 nimaga teng?', options: ['1', '5', '0', '10'], correct: 0, difficulty: 'easy' },
            { type: 'mcq', q: '1/10 ni o\'nli kasrda yozing:', options: ['0.1', '0.01', '1.0', '10'], correct: 0, difficulty: 'easy' },
            { type: 'mcq', q: 'To\'g\'ri kasrni ko\'rsating:', options: ['3/4', '5/4', '7/2', '1 butun 1/2'], correct: 0, difficulty: 'easy' },
            { type: 'mcq', q: 'Noto\'g\'ri kasrni ko\'rsating:', options: ['9/5', '1/2', '3/8', '0.7'], correct: 0, difficulty: 'easy' },
            { type: 'mcq', q: '1/4 + 1/4 nimaga teng?', options: ['1/2', '1/8', '2/8', '1/4'], correct: 0, difficulty: 'easy' },
            { type: 'fib', q: '1 dan 1/3 ni ayirsak necha qoladi? (Kasr ko\'rinishida yozing, masalan 2/3)', correct: '2/3', difficulty: 'medium' },
            { type: 'mcq', q: 'Kasr chizig\'i qanday amalni bildiradi?', options: ['Bo\'lish', 'Ko\'paytirish', 'Qo\'shish', 'Ayirish'], correct: 0, difficulty: 'easy' },
            { type: 'fib', q: '2/3 va 3/2 ning ko\'paytmasi necha?', correct: '1', difficulty: 'hard' }
        ],
        videos: [
            { title: 'Kasrlar haqida tushuncha', url: 'https://www.youtube.com/embed/z8hYf9h_u90', xp: 20 }
        ]
    },
    {
        id: 'decimals',
        title: 'O\'nli kasrlar',
        icon: '🔢',
        theory: 'O\'nli kasrlar - maxraji 10, 100, 1000 bo\'lgan kasrlarning maxsus ko\'rinishidir. Ular vergul yordamida yoziladi.',
        quizzes: [
            { type: 'mcq', q: '0.5 ni oddiy kasrda yozing:', options: ['1/2', '1/5', '5/100', '1/10'], correct: 0, difficulty: 'easy' },
            { type: 'fib', q: '1.2 + 0.8 = ?', correct: '2', difficulty: 'easy' },
            { type: 'mcq', q: '0.25 qaysi oddiy kasrga teng?', options: ['1/4', '1/2', '1/5', '1/10'], correct: 0, difficulty: 'easy' },
            { type: 'fib', q: '1.2 ni 10 ga ko\'paytirsak necha bo\'ladi?', correct: '12', difficulty: 'easy' },
            { type: 'mcq', q: '0.75 ni foizda ifodalang:', options: ['75%', '7.5%', '0.75%', '750%'], correct: 0, difficulty: 'medium' },
            { type: 'fib', q: '0.1 * 0.1 = ?', correct: '0.01', difficulty: 'medium' },
            { type: 'mcq', q: '3.5 da nechta butun bor?', options: ['3', '5', '35', '0.5'], correct: 0, difficulty: 'easy' },
            { type: 'fib', q: '2.8 ni 2 ga bo\'ling:', correct: '1.4', difficulty: 'easy' },
            { type: 'mcq', q: '0.333... qaysi oddiy kasrga yaqin?', options: ['1/3', '1/2', '1/4', '1/5'], correct: 0, difficulty: 'medium' },
            { type: 'mcq', q: '5.06 qanday o\'qiladi?', options: ['Besh butun yuzdan olti', 'Besh butun o\'ndan olti', 'Ellik butun olti', 'Besh butun olti'], correct: 0, difficulty: 'medium' },
            { type: 'fib', q: '10 ni 0.1 ga bo\'lsak necha bo\'ladi?', correct: '100', difficulty: 'hard' },
            { type: 'mcq', q: '0.9 - 0.4 nimaga teng?', options: ['0.5', '0.13', '0.05', '1.3'], correct: 0, difficulty: 'easy' },
            { type: 'mcq', q: '0.125 oddiy kasrda qanday yoziladi?', options: ['1/8', '1/4', '1/2', '1/5'], correct: 0, difficulty: 'hard' },
            { type: 'fib', q: '4.5 + 5.5 = ?', correct: '10', difficulty: 'easy' },
            { type: 'fib', q: '2.5 ning yarmi necha?', correct: '1.25', difficulty: 'medium' }
        ],
        videos: [
            { title: 'O\'nli kasrlarni qo\'shish', url: 'https://www.youtube.com/embed/y79o-e-Q8Vw', xp: 25 }
        ]
    },
    {
        id: 'algebra',
        title: 'Algebra asoslari',
        icon: '🧠',
        theory: 'Algebra - harfiy ifodalar va tenglamalar bilan ishlash fanidir. Unda sonlar o\'rniga harflar ishlatilishi mumkin.',
        quizzes: [
            { type: 'mcq', q: 'x + 5 = 12 bo\'lsa, x = ?', options: ['7', '6', '17', '5'], correct: 0, difficulty: 'easy' },
            { type: 'fib', q: '2x = 20 bo\'lsa, x necha?', correct: '10', difficulty: 'easy' },
            { type: 'fib', q: 'x - 10 = 5 bo\'lsa, x ni toping:', correct: '15', difficulty: 'easy' },
            { type: 'mcq', q: 'x / 3 = 4 bo\'lsa, x = ?', options: ['12', '7', '1', '1.5'], correct: 0, difficulty: 'easy' },
            { type: 'fib', q: '3x + 1 = 10 ekanligi ma\'lum bo\'lsa, x necha?', correct: '3', difficulty: 'medium' },
            { type: 'mcq', q: 'Noma\'lum sonni belgilash uchun ko\'pincha qaysi harf ishlatiladi?', options: ['x', 'a', 'y', 'Hammasi'], correct: 3, difficulty: 'easy' },
            { type: 'mcq', q: 'Tenglamani yechish nima degani?', options: ['Ildizini topish', 'Harfni o\'chirish', 'Misolni ko\'chirish', 'Hech narsa'], correct: 0, difficulty: 'medium' },
            { type: 'fib', q: '5 * (x + 2) = 25 bo\'lsa, x = ?', correct: '3', difficulty: 'hard' },
            { type: 'mcq', q: 'x + x + x nimaga teng?', options: ['3x', 'x3', '2x', '3+x'], correct: 0, difficulty: 'easy' },
            { type: 'fib', q: 'Agar a = 2 bo\'lsa, 5a + 3 ifodaning qiymati necha?', correct: '13', difficulty: 'medium' },
            { type: 'mcq', q: '100 - 2x = 80 bo\'lsa, x = ?', options: ['10', '20', '40', '5'], correct: 0, difficulty: 'medium' },
            { type: 'fib', q: 'x / 2 + 5 = 10 bo\'lsa, x necha?', correct: '10', difficulty: 'medium' },
            { type: 'mcq', q: 'Ifodani soddalashtiring: 3a + 2a', options: ['5a', '6a', 'a', '5'], correct: 0, difficulty: 'easy' },
            { type: 'mcq', q: 'Qavslarni oching: 2(a + b)', options: ['2a + 2b', '2a + b', 'a + 2b', '2ab'], correct: 0, difficulty: 'medium' },
            { type: 'mcq', q: '0 * x nimaga teng?', options: ['0', 'x', '1', 'Noma\'lum'], correct: 0, difficulty: 'easy' }
        ],
        videos: [
            { title: 'Tenglamalar yechish', url: 'https://www.youtube.com/embed/L_n9-I4yI0Y', xp: 30 }
        ]
    },
    {
        id: 'geometry',
        title: 'Geometriya',
        icon: '📐',
        theory: 'Geometriya - shakllar, ularning o\'lchamlari va xossalarini o\'rganadi.',
        quizzes: [
            { type: 'mcq', q: 'To\'g\'ri burchak necha gradus?', options: ['90', '180', '45', '60'], correct: 0, difficulty: 'easy' },
            { type: 'fib', q: 'Yoyiq burchak necha gradus?', correct: '180', difficulty: 'easy' },
            { type: 'mcq', q: 'Kvadratning necha tomoni bor?', options: ['4', '3', '5', '6'], correct: 0, difficulty: 'easy' },
            { type: 'fib', q: 'Uchburchak burchaklari yig\'indisi nechaga teng?', correct: '180', difficulty: 'easy' },
            { type: 'mcq', q: 'Doira yuzi va radiusi bog\'liqlik formulasi:', options: ['pi*r^2', '2*pi*r', 'a*b', 'a^2'], correct: 0, difficulty: 'medium' },
            { type: 'mcq', q: 'Perimetr nima?', options: ['Tomonlar yig\'indisi', 'Yuzasi', 'Ichki qismi', 'Burchagi'], correct: 0, difficulty: 'easy' },
            { type: 'fib', q: 'Tomoni 5 bo\'lgan kvadrat yuzi necha?', correct: '25', difficulty: 'medium' },
            { type: 'fib', q: 'To\'g\'ri to\'rtburchak tomonlari 3 va 4 bo\'lsa, uning perimetri necha?', correct: '14', difficulty: 'medium' },
            { type: 'mcq', q: 'Radius diametrning qancha qismi?', options: ['Yarmi', 'Ikki baravari', 'Choragi', 'Teng'], correct: 0, difficulty: 'easy' },
            { type: 'mcq', q: 'O\'tkir burchak 90 gradusdan ...', options: ['Kichik', 'Katta', 'Teng', 'Farqi yo\'q'], correct: 0, difficulty: 'easy' },
            { type: 'mcq', q: 'O\'tmas burchak 90 gradusdan ...', options: ['Katta', 'Kichik', 'Teng', 'Farqi yo\'q'], correct: 0, difficulty: 'easy' },
            { type: 'fib', q: 'Kubning nechta yog\'i (tomonli tomoni) bor?', correct: '6', difficulty: 'medium' },
            { type: 'mcq', q: 'Kesma nima?', options: ['Ikki nuqta bilan chegaralangan chiziq', 'Cheksiz chiziq', 'Nuqta', 'Burchak'], correct: 0, difficulty: 'easy' },
            { type: 'mcq', q: 'Parallel chiziqlar kesishadimi?', options: ['Yo\'q', 'Ha', 'Ba\'zan', 'Bilmayman'], correct: 0, difficulty: 'easy' },
            { type: 'mcq', q: 'Burchakni o\'lchaydigan asbob nima?', options: ['Transportir', 'Chizg\'ich', 'Sirkul', 'Qalam'], correct: 0, difficulty: 'easy' }
        ],
        videos: [
            { title: 'Burchaklar turlari', url: 'https://www.youtube.com/embed/mG7v_fVwI-4', xp: 30 }
        ]
    }
];
