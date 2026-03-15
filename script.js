/* ============================================================
   SPHOṬA — Site Script
   Progress data lives here. Update this to update the site.
   No external dependencies.

   THREE.JS INTEGRATION POINT: see bottom of file.
   ============================================================ */

// ── PROGRESS DATA ──────────────────────────────────────────────
// Status options: 'done' | 'active' | 'upcoming'
// date: ISO string or human string — shown as metadata

const PROGRESS = {
  a: [
    {
      status: 'done',
      label: 'Idea & conception — Sanskrit\'s grammar as a formal AI substrate',
      date: 'July 2023',
    },
    {
      status: 'done',
      label: 'Prior art survey — 19 reference papers verified, adversarial stress-test complete',
      date: 'March 2026',
    },
    {
      status: 'active',
      label: 'arXiv submission — cs.CL, paper in preparation',
      date: 'In progress',
    },
    {
      status: 'upcoming',
      label: 'Tokenizer benchmark — Pāṇini vs BPE vs SentencePiece on Sanskrit corpus',
      date: 'After arXiv',
    },
    {
      status: 'upcoming',
      label: 'Paper 1 publication',
      date: 'After experiment',
    },
  ],
};

// ── RENDER PROGRESS TRACKS ──────────────────────────────────────

function renderTrack(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = items.map(item => `
    <div class="track-item ${item.status}">
      <div class="status">${
        item.status === 'done' ? '✓' :
        item.status === 'active' ? '◉' : '○'
      }</div>
      <div>
        <span class="label">${item.label}</span>
        <span class="meta">${item.date}</span>
      </div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderTrack(PROGRESS.a, 'track-a');

  initCanvasBg();
});

// ── SANSKRIT FIREFLY BACKGROUND ─────────────────────────────────
// Devanagari characters drifting slowly, glowing like fireflies.
// One random character acts as the "spotlight" — glows bright,
// then fades and passes to another. Pure 2D canvas.

function initCanvasBg() {
  const canvas = document.getElementById('canvas-bg');
  const ctx = canvas.getContext('2d');

  const CHARS = [
    '\u0913\u092E', // ॐ
    '\u0938', '\u0915', '\u0924', '\u0930', '\u092E',
    '\u0928', '\u092A', '\u0939', '\u0936', '\u0927',
    '\u092D', '\u0935', '\u0932', '\u0917', '\u091F',
    '\u0925', '\u0916', '\u0918', '\u091A', '\u091D',
    '\u0923', '\u0937', '\u0921', '\u091C', '\u0925',
  ];

  let W, H, fireflies, spotlightIndex = 0, spotlightTimer = 0;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeFirefly() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      char: CHARS[Math.floor(Math.random() * CHARS.length)],
      size: Math.random() * 14 + 16,
      opacity: Math.random() * 0.06 + 0.02,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      spotlight: false,
      spotOpacity: 0,
    };
  }

  function init() {
    resize();
    const COUNT = Math.min(65, Math.floor((W * H) / 12000));
    fireflies = Array.from({ length: COUNT }, makeFirefly);
    spotlightIndex = Math.floor(Math.random() * fireflies.length);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Rotate spotlight every ~220 frames
    spotlightTimer++;
    if (spotlightTimer > 220) {
      spotlightTimer = 0;
      fireflies[spotlightIndex].spotlight = false;
      const next = Math.floor(Math.random() * fireflies.length);
      spotlightIndex = next;
      fireflies[spotlightIndex].spotlight = true;
      fireflies[spotlightIndex].spotOpacity = 0;
    }

    for (let i = 0; i < fireflies.length; i++) {
      const f = fireflies[i];
      const isSpot = f.spotlight;

      // Dim ambient drift for all chars
      f.opacity = 0.04 + Math.sin(Date.now() * 0.0003 + i * 1.7) * 0.03;

      // Spotlight: fade in then hold then fade out via timer position
      let spotO = 0;
      if (isSpot) {
        const t = spotlightTimer / 220;
        if (t < 0.25) spotO = t / 0.25;
        else if (t < 0.75) spotO = 1;
        else spotO = 1 - (t - 0.75) / 0.25;
        f.spotOpacity = spotO;
      }

      const baseFont = `${f.size}px Georgia, serif`;

      ctx.save();

      if (isSpot && spotO > 0.05) {
        // Layered bloom: 4 passes — wide soft halo → mid glow → tight glow → sharp char
        const passes = [
          { blur: 90,  alpha: spotO * 0.12, color: '#e86020' },
          { blur: 55,  alpha: spotO * 0.25, color: '#f07830' },
          { blur: 28,  alpha: spotO * 0.45, color: '#f0a060' },
          { blur: 10,  alpha: spotO * 0.85, color: '#f8d080' },
        ];
        ctx.font = baseFont;
        for (const p of passes) {
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = p.blur;
          ctx.fillText(f.char, f.x, f.y);
        }
        // Final crisp character on top
        ctx.globalAlpha = Math.min(spotO * 1.1, 0.98);
        ctx.fillStyle = '#ffeebb';
        ctx.shadowColor = '#ffcc66';
        ctx.shadowBlur = 6;
        ctx.fillText(f.char, f.x, f.y);
      } else {
        // Ambient dim state
        ctx.globalAlpha = f.opacity;
        ctx.font = baseFont;
        ctx.fillStyle = '#c8a97a';
        ctx.shadowColor = '#c8a97a';
        ctx.shadowBlur = 8;
        ctx.fillText(f.char, f.x, f.y);
      }

      ctx.restore();

      f.x += f.vx;
      f.y += f.vy;
      if (f.x < -40) f.x = W + 40;
      if (f.x > W + 40) f.x = -40;
      if (f.y < -40) f.y = H + 40;
      if (f.y > H + 40) f.y = -40;
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); });
  init();
  draw();
}

/* ============================================================
   THREE.JS INTEGRATION — WHEN READY
   ============================================================

   Step 1: Add to index.html <head>:
     <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>

   Step 2: Replace initCanvasBg() above with this:

   function initCanvasBg() {
     const canvas = document.getElementById('canvas-bg');

     const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
     renderer.setPixelRatio(window.devicePixelRatio);
     renderer.setSize(window.innerWidth, window.innerHeight);

     const scene = new THREE.Scene();
     const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
     camera.position.z = 5;

     // ── SCENE CONCEPT: Floating Binary Matrix Glyphs (BMG metaphor)
     // Each object = a tiny N×N binary grid, floating and slowly rotating.
     // Represents morphemes "waiting to be read."

     const geometry = new THREE.PlaneGeometry(0.3, 0.3);
     const material = new THREE.MeshBasicMaterial({
       color: 0xc8a97a,
       transparent: true,
       opacity: 0.08,
       wireframe: true,
     });

     for (let i = 0; i < 120; i++) {
       const mesh = new THREE.Mesh(geometry, material.clone());
       mesh.position.set(
         (Math.random() - 0.5) * 14,
         (Math.random() - 0.5) * 10,
         (Math.random() - 0.5) * 6
       );
       mesh.rotation.set(
         Math.random() * Math.PI,
         Math.random() * Math.PI,
         Math.random() * Math.PI
       );
       mesh.userData.rotSpeed = {
         x: (Math.random() - 0.5) * 0.003,
         y: (Math.random() - 0.5) * 0.003,
       };
       scene.add(mesh);
     }

     window.addEventListener('resize', () => {
       camera.aspect = window.innerWidth / window.innerHeight;
       camera.updateProjectionMatrix();
       renderer.setSize(window.innerWidth, window.innerHeight);
     });

     function animate() {
       requestAnimationFrame(animate);
       scene.children.forEach(mesh => {
         mesh.rotation.x += mesh.userData.rotSpeed.x;
         mesh.rotation.y += mesh.userData.rotSpeed.y;
       });
       renderer.render(scene, camera);
     }
     animate();
   }

   ============================================================ */

// ── LANGUAGE SWITCHER ────────────────────────────────────────

const I18N = {
  en: {
    'diff-label': 'The Difference',
    'diff-heading': 'Most AI research is optimizing the building.<br/>This attempts to restructure the foundation itself.',
    'diff-sub': 'Nearly every breakthrough in LLMs operates at the architecture layer. Sphoṭa attacks a layer below that: the vocabulary itself.',
    'diff-c1-h': 'The abstraction level: pre-training, pre-architecture',
    'diff-c2-h': 'Not a new model. A new substrate.',
    'diff-c3-h': 'First, second, and third order effects',
    'diff-first': 'First order:', 'diff-second': 'Second order:', 'diff-third': 'Third order:',
    'diff-first-p': 'A better tokenizer for Sanskrit. 2× fewer tokens, formally complete vocabulary, zero training data needed.',
    'diff-second-p': 'A grammar-aware substrate for the 23 official Indian languages. Lower compute cost. Better representation without massive corpora.',
    'diff-third-p': 'If the substrate language shapes what representations are easy to learn, a formally generative substrate may produce models that reason differently about causality and meaning. Testable. Not yet tested.',
    'intuition-label': "A Founder's Intuition",
    'intuition-heading': "What I hold beyond<br/>what I can prove.",
    'intuition-sub': 'The technical claim is narrow. But there are questions underneath it I cannot stop thinking about. Not in the paper. Not proven. Put here, under my name.',
    'intuition-1-h': 'Why Sanskrit and not English?',
    'intuition-2-h': 'Does the substrate language shape how an AI reasons?',
    'intuition-3-h': 'Could it produce less biased AI?',
    'intuition-4-h': 'Machines as a different kind of intelligence',
    'progress-label': 'Research Progress', 'progress-heading': 'Built in public.',
    'collab-label': 'Collaborate', 'collab-heading': 'Build what this points at.',
    'collab-ask': 'If this catches your interest — and you have a complementary skill set that could help further this research in any way — please don\'t hesitate to reach out.',
    'track-a-label': 'Track A — Publication', 'track-b-label': 'Track B — Outreach', 'track-c-label': 'Track C — Platform',
  },
  hi: {
    'diff-label': 'अंतर',
    'diff-heading': 'अधिकांश AI शोध मशीन को बेहतर बनाता है।<br/>यह भाषा को बदलता है।',
    'diff-sub': 'LLMs में लगभग हर सफलता आर्किटेक्चर स्तर पर काम करती है। Sphoṭa उससे नीचे के स्तर पर प्रहार करता है: शब्दकोश पर।',
    'diff-c1-h': 'अमूर्तता का स्तर: प्रशिक्षण-पूर्व, आर्किटेक्चर-पूर्व',
    'diff-c2-h': 'नया मॉडल नहीं। नया आधार।',
    'diff-c3-h': 'प्रथम, द्वितीय और तृतीय क्रम के प्रभाव',
    'diff-first': 'प्रथम क्रम:', 'diff-second': 'द्वितीय क्रम:', 'diff-third': 'तृतीय क्रम:',
    'diff-first-p': 'संस्कृत के लिए बेहतर टोकनाइज़र। 2× कम टोकन, औपचारिक रूप से पूर्ण शब्दकोश।',
    'diff-second-p': '23 आधिकारिक भारतीय भाषाओं के लिए व्याकरण-जागरूक आधार। कम कम्प्यूट लागत।',
    'diff-third-p': 'यदि आधार भाषा सीखने को आकार देती है, तो औपचारिक रूप से उत्पादक आधार अलग तर्क पैदा कर सकता है।',
    'intuition-label': 'एक संस्थापक की अंतर्दृष्टि',
    'intuition-heading': 'जो मैं जानता हूँ उससे परे<br/>जो मैं मानता हूँ।',
    'intuition-sub': 'तकनीकी दावा संकीर्ण है। लेकिन इसके नीचे ऐसे प्रश्न हैं जिनके बारे में मैं सोचना बंद नहीं कर सकता।',
    'intuition-1-h': 'संस्कृत क्यों, अंग्रेज़ी क्यों नहीं?',
    'intuition-2-h': 'क्या आधार भाषा AI के तर्क को आकार देती है?',
    'intuition-3-h': 'क्या यह कम पक्षपाती AI बना सकती है?',
    'intuition-4-h': 'मशीनें — एक अलग प्रकार की बुद्धिमत्ता',
    'progress-label': 'शोध प्रगति', 'progress-heading': 'सार्वजनिक रूप से निर्मित।',
    'collab-label': 'सहयोग', 'collab-heading': 'इसकी दिशा में निर्माण करें।',
    'collab-ask': 'क्या आप प्रयोग चला सकते हैं? परिणामों के सह-लेखक बनना चाहते हैं?',
    'track-a-label': 'ट्रैक A — प्रकाशन', 'track-b-label': 'ट्रैक B — आउटरीच', 'track-c-label': 'ट्रैक C — प्लेटफ़ॉर्म',
  },
  ta: {
    'diff-label': 'வித்தியாசம்',
    'diff-heading': 'பெரும்பாலான AI ஆராய்ச்சி இயந்திரத்தை மேம்படுத்துகிறது।<br/>இது மொழியை மாற்றுகிறது।',
    'diff-sub': 'LLM-களில் கிட்டத்தட்ட எல்லா முன்னேற்றங்களும் கட்டிடக்கலை அடுக்கில் செயல்படுகின்றன। Sphoṭa அதற்கு கீழே உள்ள அடுக்கில் தாக்குகிறது: சொல்லகராதி.',
    'diff-c1-h': 'சுருக்கத்தின் நிலை: பயிற்சிக்கு முன், கட்டிடத்திற்கு முன்',
    'diff-c2-h': 'புதிய மாதிரி அல்ல. புதிய அடிப்படை.',
    'diff-c3-h': 'முதல், இரண்டாம் மற்றும் மூன்றாம் வரிசை விளைவுகள்',
    'diff-first': 'முதல் வரிசை:', 'diff-second': 'இரண்டாம் வரிசை:', 'diff-third': 'மூன்றாம் வரிசை:',
    'diff-first-p': 'சமஸ்கிருதத்திற்கு சிறந்த டோக்கனைசர். 2× குறைவான டோக்கன்கள்.',
    'diff-second-p': '23 அதிகாரப்பூர்வ இந்திய மொழிகளுக்கான இலக்கண-விழிப்புடன் கூடிய அடிப்படை.',
    'diff-third-p': 'அடிப்படை மொழி கற்றலை வடிவமைத்தால், முறையான உற்பத்தி அடிப்படை வேறுபட்ட தர்க்கத்தை உருவாக்கலாம்.',
    'intuition-label': 'ஒரு நிறுவனரின் உள்ளுணர்வு',
    'intuition-heading': 'என்னால் நிரூபிக்க முடியாத<br/>என்னால் நம்புவது.',
    'intuition-sub': 'தொழில்நுட்ப கூற்று குறுகியது. ஆனால் அதற்கு கீழே நான் சிந்திப்பதை நிறுத்த முடியாத கேள்விகள் உள்ளன.',
    'intuition-1-h': 'சமஸ்கிருதம் ஏன், ஆங்கிலம் ஏன் இல்லை?',
    'intuition-2-h': 'அடிப்படை மொழி AI-யின் சிந்தனையை வடிவமைக்கிறதா?',
    'intuition-3-h': 'இது குறைவான சார்பு AI-யை உருவாக்க முடியுமா?',
    'intuition-4-h': 'இயந்திரங்கள் — ஒரு வேறுபட்ட வகை நுண்ணறிவு',
    'progress-label': 'ஆய்வு முன்னேற்றம்', 'progress-heading': 'பொதுவில் கட்டப்பட்டது.',
    'collab-label': 'ஒத்துழைப்பு', 'collab-heading': 'இது சுட்டும் திசையில் கட்டுங்கள்.',
    'collab-ask': 'நீங்கள் சோதனை நடத்த முடியுமா? முடிவுகளை இணை-ஆசிரியராக வரைய விரும்புகிறீர்களா?',
    'track-a-label': 'பாதை A — வெளியீடு', 'track-b-label': 'பாதை B — தொடர்பு', 'track-c-label': 'பாதை C — தளம்',
  },
  te: {
    'diff-label': 'తేడా',
    'diff-heading': 'చాలా AI పరిశోధన యంత్రాన్ని మెరుగుపరుస్తుంది।<br/>ఇది భాషను మారుస్తుంది.',
    'diff-sub': 'LLMs లో దాదాపు అన్ని పురోగతులు నిర్మాణ పొరలో పనిచేస్తాయి. Sphoṭa దానికి దిగువ పొరపై దాడి చేస్తుంది: పదకోశం.',
    'diff-c1-h': 'అమూర్తత స్థాయి: శిక్షణకు ముందు, నిర్మాణానికి ముందు',
    'diff-c2-h': 'కొత్త మోడల్ కాదు. కొత్త పునాది.',
    'diff-c3-h': 'మొదటి, రెండవ మరియు మూడవ క్రమ ప్రభావాలు',
    'diff-first': 'మొదటి క్రమం:', 'diff-second': 'రెండవ క్రమం:', 'diff-third': 'మూడవ క్రమం:',
    'diff-first-p': 'సంస్కృతానికి మెరుగైన టోకనైజర్. 2× తక్కువ టోకన్లు.',
    'diff-second-p': '23 అధికారిక భారతీయ భాషలకు వ్యాకరణ-అవగాహన కలిగిన పునాది.',
    'diff-third-p': 'పునాది భాష నేర్చుకోవడాన్ని రూపొందిస్తే, అధికారికంగా ఉత్పత్తి చేసే పునాది వేరే తర్కాన్ని ఉత్పత్తి చేయవచ్చు.',
    'intuition-label': 'ఒక స్థాపకుడి అంతర్దృష్టి',
    'intuition-heading': 'నేను నిరూపించగలిగే దాని కంటే<br/>నేను నమ్మేది.',
    'intuition-sub': 'సాంకేతిక వాదన సంకుచితమైనది. కానీ దాని క్రింద నేను ఆలోచించడం ఆపలేని ప్రశ్నలు ఉన్నాయి.',
    'intuition-1-h': 'సంస్కృతం ఎందుకు, ఆంగ్లం ఎందుకు కాదు?',
    'intuition-2-h': 'సబ్‌స్ట్రేట్ భాష AI తర్కాన్ని రూపొందిస్తుందా?',
    'intuition-3-h': 'ఇది తక్కువ పక్షపాత AI ని ఉత్పత్తి చేయగలదా?',
    'intuition-4-h': 'యంత్రాలు — ఒక భిన్నమైన రకమైన మేధస్సు',
    'progress-label': 'పరిశోధన పురోగతి', 'progress-heading': 'బహిరంగంగా నిర్మించబడింది.',
    'collab-label': 'సహకారం', 'collab-heading': 'ఇది సూచించే దిశలో నిర్మించండి.',
    'collab-ask': 'మీరు ప్రయోగాన్ని నిర్వహించగలరా? ఫలితాలను సహ-రచించాలనుకుంటున్నారా?',
    'track-a-label': 'ట్రాక్ A — ప్రచురణ', 'track-b-label': 'ట్రాక్ B — అవుట్‌రీచ్', 'track-c-label': 'ట్రాక్ C — ప్లాట్‌ఫారమ్',
  },
};

// ── LANGUAGE SWITCHING LOGIC ─────────────────────────────────

function applyLang(lang) {
  const dict = I18N[lang];
  if (!dict) return;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      el.innerHTML = dict[key];
    }
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  localStorage.setItem('sphota-lang', lang);
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('sphota-lang') || 'en';
  applyLang(saved);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      applyLang(btn.getAttribute('data-lang'));
    });

  // Hamburger menu
  const navToggle = document.getElementById('nav-toggle');
  const navLinksGroup = document.getElementById('nav-links');
  if (navToggle && navLinksGroup) {
    navToggle.addEventListener('click', () => {
      navLinksGroup.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinksGroup.contains(e.target)) {
        navLinksGroup.classList.remove('open');
      }
    });
  }
  });
});
