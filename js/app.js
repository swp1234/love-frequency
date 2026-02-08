// Love Frequency Test - Main Application
let currentQ = 0;
let allScores = []; // array of score arrays per question
let resultData = null;
let resultIndex = -1;
let audioCtx = null;
let oscillator = null;
let gainNode = null;
let oscillator2 = null;
let gainNode2 = null;
let isPlaying = false;
let loadingInterval = null;
let loadingTimeout = null;
let freqDisplayInterval = null;
let adCountdownTimer = null;

const introScreen = document.getElementById('intro-screen');
const questionScreen = document.getElementById('question-screen');
const loadingScreen = document.getElementById('loading-screen');
const resultScreen = document.getElementById('result-screen');
const adOverlay = document.getElementById('ad-overlay');

// Initialize i18n
(async function initI18n() {
    await i18n.loadTranslations(i18n.getCurrentLanguage());
    i18n.updateUI();
    const langToggle = document.getElementById('lang-toggle');
    const langMenu = document.getElementById('lang-menu');
    const langOptions = document.querySelectorAll('.lang-option');
    document.querySelector(`[data-lang="${i18n.getCurrentLanguage()}"]`)?.classList.add('active');
    langToggle?.addEventListener('click', () => langMenu.classList.toggle('hidden'));
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.language-selector')) langMenu?.classList.add('hidden');
    });
    langOptions.forEach(opt => {
        opt.addEventListener('click', async () => {
            await i18n.setLanguage(opt.getAttribute('data-lang'));
            langOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            langMenu.classList.add('hidden');
        });
    });
})();

function show(screen) {
    // Cleanup timers and audio on screen transition
    if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null; }
    if (loadingTimeout) { clearTimeout(loadingTimeout); loadingTimeout = null; }
    if (freqDisplayInterval) { clearInterval(freqDisplayInterval); freqDisplayInterval = null; }
    if (isPlaying) stopFrequency();
    stopWaveVisualization();
    [introScreen, questionScreen, loadingScreen, resultScreen].forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// Test count
function getTestCount() {
    return parseInt(localStorage.getItem('love_freq_test_count') || '0');
}
function incrementTestCount() {
    const c = getTestCount() + 1;
    localStorage.setItem('love_freq_test_count', c.toString());
    updateTestCount();
}
function updateTestCount() {
    const el = document.getElementById('test-count');
    const c = getTestCount();
    if (c > 0) el.textContent = `${c.toLocaleString()}명이 참여했어요!`;
}
updateTestCount();

// Start
document.getElementById('btn-start').addEventListener('click', () => {
    currentQ = 0;
    allScores = [];
    show(questionScreen);
    showQuestion();
    if (typeof gtag === 'function') gtag('event', 'test_start', { event_category: 'love_frequency' });
});

function showQuestion() {
    const q = QUESTIONS[currentQ];
    const progress = ((currentQ + 1) / QUESTIONS.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
    document.getElementById('progress-text').textContent = `${currentQ + 1} / ${QUESTIONS.length}`;
    document.getElementById('q-text').textContent = q.text;

    const optionsEl = document.getElementById('q-options');
    optionsEl.innerHTML = '';

    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span class="opt-emoji">${opt.emoji}</span><span class="opt-text">${opt.text}</span>`;
        btn.dataset.index = i;
        btn.addEventListener('click', () => selectOption(btn, opt.scores));
        optionsEl.appendChild(btn);
    });

    const card = document.querySelector('.question-card');
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = 'slideIn 0.4s ease';
}

function selectOption(btn, scores) {
    document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
    btn.classList.add('selected');
    allScores.push(scores);

    setTimeout(() => {
        currentQ++;
        if (currentQ < QUESTIONS.length) {
            showQuestion();
        } else {
            showLoading();
        }
    }, 400);
}

function showLoading() {
    show(loadingScreen);
    const bar = document.getElementById('loading-fill');
    const text = document.getElementById('loading-text');
    let progress = 0;

    const messages = [
        '사랑의 파동을 감지하는 중...',
        '감정 주파수를 분석 중...',
        '영혼의 공명 패턴 해석 중...',
        '당신만의 사랑 주파수 튜닝 중...',
        '최종 주파수 확정 중...'
    ];

    loadingInterval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
            progress = 100;
            if (bar) bar.style.width = '100%';
            clearInterval(loadingInterval);
            loadingInterval = null;
            loadingTimeout = setTimeout(() => {
                showResult();
                loadingTimeout = null;
            }, 500);
        } else {
            if (bar) bar.style.width = progress + '%';
        }
        const msgIdx = Math.min(Math.floor(progress / 20), messages.length - 1);
        if (text) text.textContent = messages[msgIdx];
    }, 400);
}

function showResult() {
    // Calculate total scores for each frequency
    const totals = [0, 0, 0, 0, 0, 0, 0];
    allScores.forEach(s => {
        s.forEach((val, i) => { totals[i] += val; });
    });

    // Find dominant frequency
    let maxScore = 0;
    resultIndex = 0;
    totals.forEach((s, i) => {
        if (s > maxScore) { maxScore = s; resultIndex = i; }
    });

    resultData = RESULTS[resultIndex];
    show(resultScreen);

    // Wave animation color
    document.documentElement.style.setProperty('--result-color', resultData.color);

    // Clear previous premium content
    const premiumContent = document.getElementById('premium-content');
    if (premiumContent) { premiumContent.style.display = 'none'; premiumContent.innerHTML = ''; }

    // Frequency display animation
    if (freqDisplayInterval) { clearInterval(freqDisplayInterval); freqDisplayInterval = null; }
    const freqValue = document.getElementById('freq-value');
    let animFreq = 0;
    const targetFreq = resultData.freq;
    freqDisplayInterval = setInterval(() => {
        animFreq += Math.ceil(targetFreq / 30);
        if (animFreq >= targetFreq) {
            animFreq = targetFreq;
            clearInterval(freqDisplayInterval);
            freqDisplayInterval = null;
        }
        if (freqValue) freqValue.textContent = animFreq;
    }, 50);

    // Fill result content
    document.getElementById('result-emoji').textContent = resultData.emoji;
    document.getElementById('result-name').textContent = resultData.name;
    document.getElementById('result-title').textContent = resultData.title;
    document.getElementById('result-subtitle').textContent = resultData.subtitle;
    document.getElementById('result-desc').textContent = resultData.desc;

    const traitsEl = document.getElementById('result-traits');
    traitsEl.innerHTML = resultData.traits.map(t => `<li>${t}</li>`).join('');

    document.getElementById('result-love-style').textContent = resultData.loveStyle;
    document.getElementById('result-best-match').textContent = resultData.bestMatch;
    document.getElementById('result-tip').textContent = resultData.tip;

    // Frequency spectrum bars
    renderSpectrumBars(totals);

    // Auto-start wave visualization (visual only, no audio)
    startWaveVisualization();

    incrementTestCount();
    if (typeof gtag === 'function') gtag('event', 'test_complete', { event_category: 'love_frequency', event_label: resultData.name, value: resultData.freq });
}

function renderSpectrumBars(totals) {
    const container = document.getElementById('spectrum-bars');
    container.innerHTML = '';
    const maxTotal = Math.max(...totals);

    FREQ_LABELS.forEach((label, i) => {
        const pct = maxTotal > 0 ? Math.round((totals[i] / maxTotal) * 100) : 0;
        const isActive = i === resultIndex;
        const bar = document.createElement('div');
        bar.className = 'spectrum-bar' + (isActive ? ' active' : '');
        bar.innerHTML = `
            <div class="bar-label">${label}</div>
            <div class="bar-track">
                <div class="bar-fill" style="height:${pct}%;background:${RESULTS[i].color};transition-delay:${i * 0.1}s"></div>
            </div>
            <div class="bar-pct">${pct}%</div>
        `;
        container.appendChild(bar);
    });

    // Trigger animation
    setTimeout(() => {
        container.querySelectorAll('.bar-fill').forEach(f => f.classList.add('animated'));
    }, 100);
}

// Audio: Play frequency tone using Web Audio API
document.getElementById('btn-play-freq').addEventListener('click', toggleFrequency);

function toggleFrequency() {
    const btn = document.getElementById('btn-play-freq');
    if (isPlaying) {
        stopFrequency();
        btn.textContent = `🎧 ${resultData.freq}Hz 주파수 듣기`;
        btn.classList.remove('playing');
    } else {
        playFrequency(resultData.freq);
        btn.textContent = `⏹️ 주파수 멈추기`;
        btn.classList.add('playing');
    }
}

function playFrequency(freq) {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch(e) {
        console.error('Audio not supported:', e);
        return;
    }

    // Main tone
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.5);

    // Soft overtone
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, audioCtx.currentTime);
    gain2.gain.setValueAtTime(0, audioCtx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.03, audioCtx.currentTime + 0.5);

    oscillator.connect(gainNode).connect(audioCtx.destination);
    osc2.connect(gain2).connect(audioCtx.destination);
    oscillator.start();
    osc2.start();

    oscillator2 = osc2;
    gainNode2 = gain2;
    isPlaying = true;

    // Start wave visualization
    startWaveVisualization();

    if (typeof gtag === 'function') gtag('event', 'play_frequency', { event_category: 'love_frequency', value: freq });
}

function stopFrequency() {
    if (oscillator && gainNode && audioCtx) {
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        if (gainNode2) gainNode2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        const oldOsc = oscillator;
        const oldOsc2 = oscillator2;
        setTimeout(() => {
            try { oldOsc.stop(); } catch(e) {}
            try { if (oldOsc2) oldOsc2.stop(); } catch(e) {}
        }, 400);
        oscillator = null;
        gainNode = null;
        oscillator2 = null;
        gainNode2 = null;
    }
    isPlaying = false;
    stopWaveVisualization();
}

// Wave visualization
let waveAnimId = null;
function startWaveVisualization() {
    if (waveAnimId) { cancelAnimationFrame(waveAnimId); waveAnimId = null; }
    const canvas = document.getElementById('wave-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width = canvas.offsetWidth * dpr;
    const h = canvas.height = canvas.offsetHeight * dpr;

    let phase = 0;
    function drawWave() {
        ctx.clearRect(0, 0, w, h);
        const freq = resultData.freq;
        const waveFreq = freq / 100;

        for (let layer = 0; layer < 3; layer++) {
            ctx.beginPath();
            ctx.strokeStyle = resultData.color;
            ctx.globalAlpha = 0.3 - layer * 0.08;
            ctx.lineWidth = 3 - layer;

            for (let x = 0; x < w; x++) {
                const y = h / 2 + Math.sin((x / w) * waveFreq * Math.PI + phase + layer * 0.5) * (h * 0.3) * (1 - layer * 0.2);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        phase += 0.05;
        waveAnimId = requestAnimationFrame(drawWave);
    }
    drawWave();
}

function stopWaveVisualization() {
    if (waveAnimId) { cancelAnimationFrame(waveAnimId); waveAnimId = null; }
    const canvas = document.getElementById('wave-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// Premium
document.getElementById('btn-premium').addEventListener('click', () => {
    if (adCountdownTimer) { clearInterval(adCountdownTimer); adCountdownTimer = null; }

    adOverlay.classList.add('active');
    let countdown = 5;
    const countEl = document.getElementById('ad-countdown');
    const closeBtn = document.getElementById('ad-close');
    if (countEl) countEl.textContent = countdown;
    if (closeBtn) closeBtn.style.display = 'none';

    adCountdownTimer = setInterval(() => {
        countdown--;
        if (countEl) countEl.textContent = countdown;
        if (countdown <= 0) {
            clearInterval(adCountdownTimer);
            adCountdownTimer = null;
            if (closeBtn) closeBtn.style.display = 'block';
        }
    }, 1000);

    if (typeof gtag === 'function') gtag('event', 'premium_click', { event_category: 'love_frequency' });
});

document.getElementById('ad-close').addEventListener('click', () => {
    if (adCountdownTimer) { clearInterval(adCountdownTimer); adCountdownTimer = null; }
    adOverlay.classList.remove('active');
    displayPremiumContent();
});

function displayPremiumContent() {
    const premiumCard = document.getElementById('premium-content');
    premiumCard.style.display = 'block';

    const advice = PREMIUM_ADVICE[resultIndex];

    // Compatibility chart
    let compatHTML = '<div class="detail-section"><h3>💞 주파수 궁합표</h3><div class="compat-grid">';
    const myCompat = COMPATIBILITY[resultIndex];
    const sortedCompat = FREQ_LABELS.map((label, i) => ({ label, score: myCompat[i], result: RESULTS[i] }))
        .sort((a, b) => b.score - a.score);

    sortedCompat.forEach(c => {
        const level = c.score >= 90 ? '완벽' : c.score >= 75 ? '좋음' : c.score >= 60 ? '보통' : '노력필요';
        const levelClass = c.score >= 90 ? 'perfect' : c.score >= 75 ? 'good' : c.score >= 60 ? 'normal' : 'low';
        compatHTML += `<div class="compat-item ${levelClass}">
            <span class="compat-emoji">${c.result.emoji}</span>
            <span class="compat-label">${c.label}</span>
            <div class="compat-bar-bg"><div class="compat-bar" style="width:${c.score}%;background:${c.result.color}"></div></div>
            <span class="compat-score">${c.score}%</span>
            <span class="compat-level">${level}</span>
        </div>`;
    });
    compatHTML += '</div></div>';

    // Weekly routine
    let routineHTML = '<div class="detail-section"><h3>📅 커플 주간 루틴</h3><ul>';
    advice.weeklyRoutine.forEach(r => { routineHTML += `<li>${r}</li>`; });
    routineHTML += '</ul></div>';

    // Date ideas
    let dateHTML = '<div class="detail-section"><h3>💑 추천 데이트</h3><ul>';
    advice.dateIdeas.forEach(d => { dateHTML += `<li>${d}</li>`; });
    dateHTML += '</ul></div>';

    // Music recommendation
    let musicHTML = `<div class="detail-section"><h3>🎵 추천 음악 장르</h3><p class="music-rec">${advice.musicRec}</p></div>`;

    premiumCard.innerHTML = compatHTML + routineHTML + dateHTML + musicHTML;
    premiumCard.scrollIntoView({ behavior: 'smooth' });

    if (typeof gtag === 'function') gtag('event', 'premium_view', { event_category: 'love_frequency' });
}

// Share
document.getElementById('btn-share').addEventListener('click', shareResult);
function shareResult() {
    const text = `💕 나의 사랑 주파수: ${resultData.freq}Hz\n${resultData.emoji} ${resultData.title}\n"${resultData.subtitle}"\n\n당신의 사랑 주파수는?\n👉 https://dopabrain.com/love-frequency/\n\n#사랑주파수 #연애테스트 #LoveFrequency`;
    if (navigator.share) {
        navigator.share({ title: '사랑 주파수 테스트', text, url: 'https://dopabrain.com/love-frequency/' }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text).then(() => alert('결과가 복사되었습니다!')).catch(() => {});
    }
    if (typeof gtag === 'function') gtag('event', 'share', { event_category: 'love_frequency' });
}

// Save image
document.getElementById('btn-save-image').addEventListener('click', generateShareImage);
function generateShareImage() {
    const canvas = document.getElementById('share-canvas');
    const ctx = canvas.getContext('2d');
    const w = 1080, h = 1080;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, resultData.colorEnd);
    grad.addColorStop(1, resultData.color);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative circles
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.arc(w * Math.random(), h * Math.random(), 100 + Math.random() * 200, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
    }

    // Wave pattern at bottom
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
        const y = h - 150 + Math.sin(x * 0.02) * 30;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.globalAlpha = 1;

    // Top label
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '600 32px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('나의 사랑 주파수는', w / 2, 160);

    // Frequency number
    ctx.fillStyle = '#fff';
    ctx.font = '900 140px -apple-system, sans-serif';
    ctx.fillText(resultData.freq + 'Hz', w / 2, 340);

    // Emoji
    ctx.font = '100px sans-serif';
    ctx.fillText(resultData.emoji, w / 2, 470);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = '700 48px -apple-system, sans-serif';
    ctx.fillText(resultData.title, w / 2, 580);

    // Subtitle
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '400 30px -apple-system, sans-serif';
    ctx.fillText(resultData.subtitle, w / 2, 640);

    // Love style
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '400 26px -apple-system, sans-serif';
    ctx.fillText(resultData.loveStyle, w / 2, 720);

    // Best match
    ctx.fillText(`Best Match: ${resultData.bestMatch}`, w / 2, 770);

    // CTA
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '400 26px -apple-system, sans-serif';
    ctx.fillText('당신의 사랑 주파수는? 👉 사랑 주파수 테스트', w / 2, 900);

    // Branding
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '400 22px -apple-system, sans-serif';
    ctx.fillText('DopaBrain', w / 2, 1020);

    // Download
    const link = document.createElement('a');
    link.download = `LoveFreq_${resultData.freq}Hz.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    if (typeof gtag === 'function') gtag('event', 'save_image', { event_category: 'love_frequency' });
}

// Retry
document.getElementById('btn-retry').addEventListener('click', () => {
    stopFrequency();
    const btn = document.getElementById('btn-play-freq');
    if (btn) { btn.classList.remove('playing'); }
    const premiumContent = document.getElementById('premium-content');
    premiumContent.style.display = 'none';
    premiumContent.innerHTML = '';
    show(introScreen);
    updateTestCount();
});

// Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}
