/**
 * שאלון מועמדות לשידוכים אינטראקטיבי - בעזרת ה'
 * ניהול שלבים, שמירה מקומית, תצוגה מקדימה של כרטיס השידוך ויצוא ל-WhatsApp
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const form = document.getElementById('shidduch-form');
  const sections = document.querySelectorAll('.form-section-card');
  const stepButtons = document.querySelectorAll('.step-btn');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const currentStepDisplay = document.getElementById('current-step-display');
  const stepTitleDisplay = document.getElementById('step-title-display');
  const saveStatus = document.getElementById('save-status');

  // Photo Upload Elements
  const photoDropzone = document.getElementById('photo-dropzone');
  const inputPhoto = document.getElementById('input-photo');
  const photoPlaceholder = document.getElementById('photo-placeholder');
  const photoImgPreview = document.getElementById('photo-img-preview');
  const btnRemovePhoto = document.getElementById('btn-remove-photo');
  const cardAvatarImg = document.getElementById('card-avatar-img');
  const cardAvatarFallback = document.getElementById('card-avatar-fallback');

  // Conditionals
  const hasChildrenRadios = document.querySelectorAll('input[name="has_children"]');
  const boxChildrenDetails = document.getElementById('box-children-details');
  const setsTorahRadios = document.querySelectorAll('input[name="sets_torah_time"]');
  const boxTorahFrequency = document.getElementById('box-torah-frequency');
  const shomerNegiahRadios = document.querySelectorAll('input[name="shomer_negiah"]');
  const boxNegiahTime = document.getElementById('box-negiah-time');

  // View Mode
  const btnToggleView = document.getElementById('btn-toggle-view');
  const viewModeText = document.getElementById('view-mode-text');
  const wizardTracker = document.getElementById('wizard-tracker');

  // Card Modal
  const cardModal = document.getElementById('card-modal');
  const btnOpenPreview = document.getElementById('btn-open-preview');
  const btnFinishModal = document.getElementById('btn-finish-modal');
  const btnCloseCardModal = document.getElementById('btn-close-card-modal');
  const dockBtnCard = document.getElementById('dock-btn-card');
  const dockPreviewName = document.getElementById('dock-preview-name');
  const dockCompletionText = document.getElementById('dock-completion-text');

  // Export / Print
  const btnExportWhatsapp = document.getElementById('btn-export-whatsapp');
  const modalBtnWhatsapp = document.getElementById('modal-btn-whatsapp');
  const dockBtnWhatsapp = document.getElementById('dock-btn-whatsapp');
  const modalBtnPrint = document.getElementById('modal-btn-print');
  const dockBtnPrint = document.getElementById('dock-btn-print');
  const modalBtnCopyRaw = document.getElementById('modal-btn-copy-raw');
  const btnSampleData = document.getElementById('btn-sample-data');
  const toastContainer = document.getElementById('toast-container');

  // State
  let currentStep = 1;
  const totalSteps = 7;
  let isWizardMode = true;
  let uploadedPhotoBase64 = '';

  const stepTitles = [
    'פרטים אישיים ותמונה',
    'סטטוס ומשפחה',
    'עולם התורה והאמונה',
    'שמירת נגיעה וצניעות',
    'אופי, זוגיות ובניית בית',
    'מידות ועבודת הנפש',
    'התאמה לשידוך ובירורים'
  ];

  // Initialize
  initForm();

  function initForm() {
    restoreFromLocalStorage();
    setupEventListeners();
    updateStepUI();
    updateLiveCard();
    checkConditionals();
  }

  // Event Listeners Setup
  function setupEventListeners() {
    // Step navigation buttons
    document.querySelectorAll('.btn-next-step').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetStep = parseInt(btn.dataset.targetStep, 10);
        goToStep(targetStep);
      });
    });

    document.querySelectorAll('.btn-prev-step').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetStep = parseInt(btn.dataset.targetStep, 10);
        goToStep(targetStep);
      });
    });

    stepButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetStep = parseInt(btn.dataset.step, 10);
        goToStep(targetStep);
      });
    });

    // Form inputs change/save
    form.addEventListener('input', () => {
      saveToLocalStorage();
      updateLiveCard();
    });

    form.addEventListener('change', () => {
      checkConditionals();
      saveToLocalStorage();
      updateLiveCard();
    });

    // Toggle view mode (Wizard vs Full)
    btnToggleView.addEventListener('click', toggleViewMode);

    // Photo Upload Handlers
    photoDropzone.addEventListener('click', (e) => {
      if (e.target.closest('#btn-remove-photo')) return;
      inputPhoto.click();
    });

    photoDropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inputPhoto.click();
      }
    });

    inputPhoto.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handlePhotoFile(file);
    });

    btnRemovePhoto.addEventListener('click', (e) => {
      e.stopPropagation();
      removePhoto();
    });

    // Drag & Drop
    photoDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      photoDropzone.style.borderColor = 'var(--color-primary)';
      photoDropzone.style.backgroundColor = '#f0f7ff';
    });

    photoDropzone.addEventListener('dragleave', () => {
      photoDropzone.style.borderColor = 'var(--color-gold)';
      photoDropzone.style.backgroundColor = '#ffffff';
    });

    photoDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      photoDropzone.style.borderColor = 'var(--color-gold)';
      photoDropzone.style.backgroundColor = '#ffffff';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handlePhotoFile(e.dataTransfer.files[0]);
      }
    });

    // Modal triggers
    [btnOpenPreview, btnFinishModal, dockBtnCard].forEach(btn => {
      if (btn) btn.addEventListener('click', openCardModal);
    });

    btnCloseCardModal.addEventListener('click', closeCardModal);
    cardModal.addEventListener('click', (e) => {
      if (e.target === cardModal) closeCardModal();
    });

    // WhatsApp Export
    [btnExportWhatsapp, modalBtnWhatsapp, dockBtnWhatsapp].forEach(btn => {
      if (btn) btn.addEventListener('click', exportToWhatsApp);
    });

    // Print & PDF
    [modalBtnPrint, dockBtnPrint].forEach(btn => {
      if (btn) btn.addEventListener('click', () => {
        openCardModal();
        setTimeout(() => window.print(), 350);
      });
    });

    // Copy full raw text
    if (modalBtnCopyRaw) {
      modalBtnCopyRaw.addEventListener('click', copyFullProfileText);
    }

    // Sample Data
    if (btnSampleData) {
      btnSampleData.addEventListener('click', fillSampleData);
    }
  }

  // Handle Photo File
  function handlePhotoFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('אנא בחר קובץ תמונה תקין (JPG, PNG וכד\')', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('גודל התמונה גדול מ-5MB. אנא בחר תמונה קטנה יותר.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedPhotoBase64 = e.target.result;
      setPhotoPreview(uploadedPhotoBase64);
      saveToLocalStorage();
      showToast('התמונה הועלתה בהצלחה!');
    };
    reader.readAsDataURL(file);
  }

  function setPhotoPreview(src) {
    photoImgPreview.src = src;
    photoImgPreview.classList.remove('hidden');
    photoPlaceholder.classList.add('hidden');
    btnRemovePhoto.classList.remove('hidden');

    if (cardAvatarImg && cardAvatarFallback) {
      cardAvatarImg.src = src;
      cardAvatarImg.classList.remove('hidden');
      cardAvatarFallback.classList.add('hidden');
    }
  }

  function removePhoto() {
    uploadedPhotoBase64 = '';
    inputPhoto.value = '';
    photoImgPreview.src = '';
    photoImgPreview.classList.add('hidden');
    photoPlaceholder.classList.remove('hidden');
    btnRemovePhoto.classList.add('hidden');

    if (cardAvatarImg && cardAvatarFallback) {
      cardAvatarImg.src = '';
      cardAvatarImg.classList.add('hidden');
      cardAvatarFallback.classList.remove('hidden');
    }
    saveToLocalStorage();
    showToast('התמונה הוסרה');
  }

  // Conditionals logic
  function checkConditionals() {
    // Children
    const hasChildrenVal = document.querySelector('input[name="has_children"]:checked')?.value;
    if (hasChildrenVal === 'יש') {
      boxChildrenDetails.classList.remove('hidden');
    } else {
      boxChildrenDetails.classList.add('hidden');
    }

    // Torah
    const setsTorahVal = document.querySelector('input[name="sets_torah_time"]:checked')?.value;
    if (setsTorahVal === 'כן') {
      boxTorahFrequency.classList.remove('hidden');
    } else {
      boxTorahFrequency.classList.add('hidden');
    }

    // Shmirat Negiah
    const shomerNegiahVal = document.querySelector('input[name="shomer_negiah"]:checked')?.value;
    if (shomerNegiahVal === 'כן') {
      boxNegiahTime.classList.remove('hidden');
    } else {
      boxNegiahTime.classList.add('hidden');
    }
  }

  // Navigation between steps
  function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > totalSteps) return;
    currentStep = stepNumber;
    updateStepUI();
    window.scrollTo({ top: form.offsetTop - 80, behavior: 'smooth' });
  }

  function updateStepUI() {
    if (!isWizardMode) return;

    sections.forEach(sec => {
      const stepIdx = parseInt(sec.dataset.stepIndex, 10);
      sec.classList.toggle('active-step', stepIdx === currentStep);
    });

    stepButtons.forEach(btn => {
      const stepIdx = parseInt(btn.dataset.step, 10);
      btn.classList.toggle('active', stepIdx === currentStep);
      btn.classList.toggle('completed', stepIdx < currentStep);
    });

    currentStepDisplay.textContent = currentStep;
    stepTitleDisplay.textContent = stepTitles[currentStep - 1] || '';

    const percent = Math.round((currentStep / totalSteps) * 100);
    progressBarFill.style.width = `${percent}%`;
  }

  // Toggle View Mode (Wizard vs Full Document)
  function toggleViewMode() {
    isWizardMode = !isWizardMode;
    if (isWizardMode) {
      form.classList.remove('mode-full');
      form.classList.add('mode-wizard');
      wizardTracker.classList.remove('hidden');
      viewModeText.textContent = 'תצוגת מסמך מלא';
      updateStepUI();
    } else {
      form.classList.remove('mode-wizard');
      form.classList.add('mode-full');
      wizardTracker.classList.add('hidden');
      viewModeText.textContent = 'מצב שלבים (שאלון)';
    }
  }

  // Live Card Update & Form Completion
  function updateLiveCard() {
    const data = getFormData();
    const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'מועמד לשידוכים';
    
    // Top Profile
    document.getElementById('card-display-fullname').textContent = fullName;
    dockPreviewName.textContent = fullName;

    document.getElementById('card-badge-status').innerHTML = `<i class="fa-solid fa-heart"></i> ${data.marital_status || 'רווק'}`;
    document.getElementById('card-badge-age').innerHTML = `<i class="fa-solid fa-cake-candles"></i> גיל: ${data.age || '-'}`;
    document.getElementById('card-badge-height').innerHTML = `<i class="fa-solid fa-ruler-vertical"></i> גובה: ${data.height || '-'}`;
    document.getElementById('card-badge-city').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${data.city || '-'}`;

    document.getElementById('card-display-ethnicity').textContent = data.ethnicity || 'לא צוין';
    document.getElementById('card-display-profession').textContent = data.profession || 'לא צוין';
    document.getElementById('card-display-phone').textContent = data.phone || 'לא צוין';

    // Torah
    document.getElementById('card-val-teshuva').textContent = data.teshuva_time || '-';
    
    let torahText = data.sets_torah_time || 'לא צוין';
    if (data.sets_torah_time === 'כן' && data.torah_frequency) {
      torahText += ` (${data.torah_frequency})`;
    }
    document.getElementById('card-val-torah').textContent = torahText;

    let rabbiComm = [];
    if (data.rabbi_name) rabbiComm.push(`הרב: ${data.rabbi_name}`);
    if (data.community) rabbiComm.push(`קהילה: ${data.community}`);
    if (data.travel_uman) rabbiComm.push(`אומן: ${data.travel_uman}`);
    document.getElementById('card-val-rabbi-comm').textContent = rabbiComm.length ? rabbiComm.join(' | ') : 'לא צוין';

    let negiahStr = data.shomer_negiah || 'לא צוין';
    if (data.shomer_negiah === 'כן' && data.negiah_time) {
      negiahStr += ` (כ-${data.negiah_time})`;
    }
    document.getElementById('card-val-negiah').textContent = negiahStr;

    document.getElementById('card-val-kashrut').textContent = data.shabbat_kashrut || 'שמירה מלאה';

    // Traits
    document.getElementById('card-trait-1').textContent = data.trait_1 || '1. -';
    document.getElementById('card-trait-2').textContent = data.trait_2 || '2. -';
    document.getElementById('card-trait-3').textContent = data.trait_3 || '3. -';

    document.getElementById('card-val-trait-loved').textContent = data.trait_loved || '-';
    document.getElementById('card-val-finance').textContent = data.financial_conduct || 'מאוזן';

    // Big Text Boxes
    document.getElementById('card-val-looking-for').textContent = data.looking_for_in_wife || 'טרם מולא פירוט זה...';
    document.getElementById('card-val-shalom-bayit').textContent = data.shalom_bayit || 'טרם מולא פירוט זה...';
    document.getElementById('card-val-crucial').textContent = data.crucial_facts || 'אין עניינים מיוחדים';

    // New Relationship Dynamics
    if (document.getElementById('card-val-love-lang')) {
      document.getElementById('card-val-love-lang').textContent = data.primary_love_language || 'לא נבחר';
    }
    if (document.getElementById('card-val-conflict')) {
      document.getElementById('card-val-conflict').textContent = data.conflict_reaction || 'לא צוין';
    }
    if (document.getElementById('card-val-household')) {
      document.getElementById('card-val-household').textContent = data.household_sharing || 'לא צוין';
    }
    if (document.getElementById('card-val-space')) {
      document.getElementById('card-val-space').textContent = data.personal_space || 'איזון בריא';
    }

    // New Middot Fields
    if (document.getElementById('card-val-flexibility')) {
      document.getElementById('card-val-flexibility').textContent = data.flexibility_compromise ? (data.flexibility_compromise.length > 55 ? data.flexibility_compromise.slice(0, 55) + '...' : data.flexibility_compromise) : 'גמיש ונוח לבריות';
    }
    if (document.getElementById('card-val-gratitude')) {
      document.getElementById('card-val-gratitude').textContent = data.gratitude_expression ? (data.gratitude_expression.length > 55 ? data.gratitude_expression.slice(0, 55) + '...' : data.gratitude_expression) : 'רואה ומודה על הטוב';
    }
    if (document.getElementById('card-val-feedback')) {
      document.getElementById('card-val-feedback').textContent = data.receiving_feedback || 'מקשיב ומפנים';
    }
    if (document.getElementById('card-val-dan-zechut')) {
      document.getElementById('card-val-dan-zechut').textContent = data.dan_lechaf_zechut || 'דן לכף זכות';
    }

    // Calculate Completion
    calculateCompletion(data);
  }

  function calculateCompletion(data) {
    const importantFields = [
      'first_name', 'last_name', 'age', 'city', 'phone',
      'marital_status', 'teshuva_time', 'sets_torah_time',
      'shomer_negiah', 'dating_boundaries', 'trait_1', 'trait_2', 'trait_3',
      'looking_for_in_wife', 'shalom_bayit', 'conflict_reaction',
      'primary_love_language', 'household_sharing', 'profession',
      'trait_loved', 'trait_to_improve', 'anger_handling',
      'flexibility_compromise', 'gratitude_expression',
      'open_divorcee_kids', 'crucial_facts'
    ];

    let filled = 0;
    importantFields.forEach(f => {
      if (data[f] && data[f].toString().trim().length > 0) filled++;
    });

    const percent = Math.round((filled / importantFields.length) * 100);
    dockCompletionText.textContent = `${percent}% הושלם`;
  }

  // Get Form Data Object
  function getFormData() {
    const formData = new FormData(form);
    const obj = {};
    for (let [key, val] of formData.entries()) {
      obj[key] = val;
    }
    if (uploadedPhotoBase64) {
      obj.photo_base64 = uploadedPhotoBase64;
    }
    return obj;
  }

  // Save to LocalStorage
  function saveToLocalStorage() {
    try {
      const data = getFormData();
      localStorage.setItem('shidduch_candidate_form_data', JSON.stringify(data));
      saveStatus.innerHTML = '<i class="fa-solid fa-check"></i> נשמר';
      setTimeout(() => {
        saveStatus.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> נשמר מקומית';
      }, 1500);
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  // Restore from LocalStorage
  function restoreFromLocalStorage() {
    try {
      const saved = localStorage.getItem('shidduch_candidate_form_data');
      if (!saved) return;
      const data = JSON.parse(saved);

      for (let key in data) {
        if (key === 'photo_base64') {
          if (data[key]) {
            uploadedPhotoBase64 = data[key];
            setPhotoPreview(uploadedPhotoBase64);
          }
          continue;
        }

        const input = form.elements[key];
        if (!input) continue;

        if (input instanceof RadioNodeList || input.type === 'radio') {
          const radio = form.querySelector(`input[name="${key}"][value="${data[key]}"]`);
          if (radio) radio.checked = true;
        } else {
          input.value = data[key];
        }
      }
    } catch (e) {
      console.warn('Storage restore failed:', e);
    }
  }

  // Fill Realistic Sample Data for testing
  function fillSampleData() {
    const sample = {
      first_name: 'יוסף אליהו',
      last_name: 'לוי',
      age: '29',
      birth_date: 'י"ד ניסן תשנ"ז (21/04/1997)',
      height: '1.80 מ\'',
      city: 'ירושלים (רחביה/נחלאות)',
      phone: '054-8493021',
      ethnicity: 'ספרדי / ישראלי',
      languages: 'עברית שפת אם, אנגלית שוטפת',
      marital_status: 'רווק',
      has_children: 'אין',
      family_relation: 'קשר חם, תומך ומכבד מאוד. הורים ואחים מסורתיים-דתיים.',
      family_involved: 'חלקית',
      teshuva_time: '5 שנים',
      teshuva_trigger: 'חיפוש עומק ומשמעות בחיים, קריאת ספרי מוסר וחסידות, סמינר עמוק ששינה את נקודת המבט.',
      sets_torah_time: 'כן',
      torah_frequency: 'שיעור גמרא יומי בשעה 20:00, חברותא בהלכה פעמיים בשבוע, לימוד מוסר בבוקר',
      rabbi_name: 'הרב שלום ארוש / הרב יגאל כהן',
      community: 'ספרדי בני תורה / חסידות עם אור ופנימיות',
      travel_uman: 'כן, לפעמים / תלוי',
      spiritual_routine: 'שחרית עם נץ החמה, חצי שעה התבודדות בשדה או בגינה, תפילות במניין, קביעות שיעורי תורה יומיים.',
      shabbat_kashrut: 'שמירת שבת בהקפדה ושמחה, כשרות מהדרין (בד"ץ העדה החרדית / בית יוסף)',
      shomer_negiah: 'כן',
      negiah_time: '4 שנים בהקפדה מלאה',
      dating_boundaries: 'פגישות במקומות שקטים ומכבדים (לובי מלון, טיילת, בית קפה צנוע). שמירה מוקפדת על נגיעה וללא ייחוד. תקשורת כנה ומכבדת ללא מריחת זמן.',
      trait_1: 'סבלני ובעל שקט פנימי',
      trait_2: 'אוהב לעזור ומקשיב מכל הלב',
      trait_3: 'בעל חוש הומור ושמחת חיים',
      looking_for_in_wife: 'מחפש בחורה עם יראת שמיים פנימית ואמיתית, לב טוב, עדינות, שמחת חיים ושאיפה לבנות בית של תורה, חסד ושלום בית. אחת שמעריכה התפתחות אישית וחיבור עמוק.',
      shalom_bayit: 'הקשבה אמיתית לצד השני, לוותר מתוך אהבה, לדעת להחמיא ולפרגן, לעולם לא ללכת לישון בכעס, ותמיד לשים את שלום הבית מעל כל צדק רגעי.',
      conflict_reaction: 'צריך פסק זמן להירגע ואז מדבר בנחת',
      primary_love_language: 'מילות הערכה, מחמאות וחיזוק',
      household_sharing: 'שותפות מלאה וטבעית בכל המטלות',
      personal_space: 'חשוב לי שילוב בריא - זמן איכות זוגי ומשפחתי קבוע בכל יום, לצד שעה של לימוד והתבודדות אישית.',
      roles_husband_wife: 'שותפות שוויונית מתוך כבוד הדדי, שבה הבעל מכבד את אשתו יותר מגופו ואוהבה כגופו, עוגן רוחני ורגשי, והאישה היא עקרת הבית ומאירה את הנשמה של הבית.',
      financial_conduct: 'מאוזן',
      lifestyle_habits: 'לא מעשן, כוסית יין בשבת ומועדים בלבד, שומר על תזונה בריאה וכושר גופני פעמיים בשבוע.',
      hobbies: 'נגינה בגיטרה ופיוטים, טיולי טבע ומעיינות, קריאת ספרות הגות ותורה, בישול לשבת.',
      profession: 'מהנדס תוכנה בהייטק (משלב עבודה וקביעות עתים לתורה)',
      education: 'תואר ראשון במדעי המחשב + לימוד בישיבה לבעלי תשובה',
      future_plans: 'להקים בית של תורה וחסד, להמשיך להתפתח מקצועית במקביל להגדלת שעות הלימוד, ולגדל ילדים בריאים ושמחים.',
      raising_children: 'חשוב לי לגדל ילדים באווירה של אהבה ללא תנאי, יראת שמיים מתוך מתיקות, חינוך למידות טובות, כבוד הבריות ושמחה פנימית.',
      trait_loved: 'מידת החסד ואהבת חינם, היכולת לראות את הטוב בכל יהודי.',
      trait_to_improve: 'לפעמים נוטה לחשוב יותר מדי (overthinking) ולוקח דברים ללב, עובד על שחרור וביטחון בה\'.',
      anger_handling: 'נושם עמוק, שותה מים קרים, לא מגיב בכעס ברגע הראשון, ומחכה לרגיעה כדי לדבר בצורה בוגרת ומכבדת.',
      flexibility_compromise: 'משתדל לזרום בנחת כשדברים משתנים. למדתי שבזוגיות הוויתור הוא הניצחון האמיתי של שלום הבית.',
      gratitude_expression: 'אומר תודה מכל הלב על כל מחווה קטנה. מאמין שהכרת הטוב היא הבסיס לכל קשר בריא ושמח.',
      receiving_feedback: 'מקשיב ומפנים גם אם בהתחלה לא קל',
      dan_lechaf_zechut: 'משתדל תמיד לדון לכף זכות',
      stress_joy_handling: 'תפילה אישית, שמיעת ניגון שמח, ריצה בטבע, ושינון שהכל מאת השם יתברך לטובה.',
      working_on_traits: 'לימוד יומי בספר "מסילת ישרים", התבודדות וחשבון נפש אישי לפני השינה.',
      preferred_age: '24-29',
      preferred_location: 'ירושלים / בית שמש / מרכז (גמיש)',
      open_divorcee_kids: 'לגרושה ללא ילדים בלבד',
      crucial_facts: 'בריא ברוך ה\' גופנית ונפשית. עובד מסודר, מחפש קשר תכליתי ורציני לחתונה תוך כמה חודשים של היכרות בריאה.',
      additional_notes: 'שנזכה לבשורות טובות בקרוב ולבניין עדי עד!'
    };

    for (let key in sample) {
      const input = form.elements[key];
      if (!input) continue;
      if (input instanceof RadioNodeList || input.type === 'radio') {
        const radio = form.querySelector(`input[name="${key}"][value="${sample[key]}"]`);
        if (radio) radio.checked = true;
      } else {
        input.value = sample[key];
      }
    }

    checkConditionals();
    saveToLocalStorage();
    updateLiveCard();
    showToast('הנתונים לדוגמה מולאו בהצלחה!');
  }

  // WhatsApp Export
  function exportToWhatsApp() {
    const data = getFormData();
    const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'מועמד לשידוכים';
    
    let text = `*בס"ד | כרטיס מועמד לשידוכים - בעזרת ה'*\n`;
    text += `*${fullName}*\n\n`;
    
    text += `👤 *פרטים אישיים:*\n`;
    text += `• סטטוס: ${data.marital_status || 'רווק'}\n`;
    text += `• גיל: ${data.age || '-'}\n`;
    text += `• גובה: ${data.height || '-'}\n`;
    text += `• עיר מגורים: ${data.city || '-'}\n`;
    text += `• טלפון: ${data.phone || '-'}\n`;
    if (data.ethnicity) text += `• מוצא / עדה: ${data.ethnicity}\n`;
    if (data.profession) text += `• מקצוע / עיסוק: ${data.profession}\n`;
    if (data.languages) text += `• שפות: ${data.languages}\n`;
    
    text += `\n📖 *עולם התורה והרוח:*\n`;
    text += `• זמן בתשובה: ${data.teshuva_time || '-'}\n`;
    text += `• קובע עתים לתורה: ${data.sets_torah_time || '-'}${data.torah_frequency ? ' (' + data.torah_frequency + ')' : ''}\n`;
    if (data.rabbi_name) text += `• רב: ${data.rabbi_name}\n`;
    if (data.community) text += `• קהילה: ${data.community}\n`;
    text += `• שמירת נגיעה: ${data.shomer_negiah || '-'}${data.negiah_time ? ' (' + data.negiah_time + ')' : ''}\n`;
    text += `• שבת וכשרות: ${data.shabbat_kashrut || 'שמירה מלאה'}\n`;
    
    text += `\n✨ *תכונות, אופי ומידות:*\n`;
    if (data.trait_1 || data.trait_2 || data.trait_3) {
      text += `• תכונות מאפיינות: 1. ${data.trait_1 || '-'} | 2. ${data.trait_2 || '-'} | 3. ${data.trait_3 || '-'}\n`;
    }
    if (data.trait_loved) text += `• מידה אהובה: ${data.trait_loved}\n`;
    if (data.trait_to_improve) text += `• מידה בעבודה: ${data.trait_to_improve}\n`;
    if (data.financial_conduct) text += `• התנהלות כלכלית: ${data.financial_conduct}\n`;
    if (data.flexibility_compromise) text += `• גמישות וויתור: ${data.flexibility_compromise}\n`;
    if (data.gratitude_expression) text += `• הכרת הטוב: ${data.gratitude_expression}\n`;

    text += `\n❤️ *זוגיות ותקשורת:*\n`;
    if (data.primary_love_language) text += `• שפת אהבה: ${data.primary_love_language}\n`;
    if (data.conflict_reaction) text += `• פתרון ויכוחים: ${data.conflict_reaction}\n`;
    if (data.household_sharing) text += `• שותפות בבית: ${data.household_sharing}\n`;
    if (data.personal_space) text += `• מרחב אישי מול יחד: ${data.personal_space}\n`;
    
    if (data.looking_for_in_wife) {
      text += `\n🔍 *מה מחפש באישה:*\n${data.looking_for_in_wife}\n`;
    }
    
    if (data.shalom_bayit) {
      text += `\n🕊️ *מה חשוב בשלום בית:*\n${data.shalom_bayit}\n`;
    }

    if (data.crucial_facts) {
      text += `\n⚠️ *דברים שחשוב לדעת מראש:*\n${data.crucial_facts}\n`;
    }

    text += `\n_לבירורים ופרטים נוספים ניתן לפנות בכבוד._`;

    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('הסיכום הועתק ללוח! פותח כעת את WhatsApp...');
      }).catch(() => {});
    }

    // Open WhatsApp Web or mobile app
    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  }

  // Copy Full Profile Text
  function copyFullProfileText() {
    const data = getFormData();
    let text = `טופס מועמדות לשידוכים בעזרת ה'\n====================================\n`;
    for (let key in data) {
      if (key === 'photo_base64') continue;
      if (data[key]) {
        text += `${key}: ${data[key]}\n`;
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('כל פרטי הטופס הועתקו ללוח בהצלחה!');
      });
    }
  }

  // Modal Controls
  function openCardModal() {
    updateLiveCard();
    cardModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeCardModal() {
    cardModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // Toast Notification System
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let icon = 'fa-check';
    if (type === 'warning') icon = 'fa-triangle-exclamation';
    if (type === 'error') icon = 'fa-circle-xmark';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
});
