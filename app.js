/**
 * שאלון עומק לשידוכים בעזרת ה' - שאלות למועמדת
 * ניהול שלבים, שמירה מקומית, תצוגה מקדימה של כרטיס המועמדת ויצוא ל-WhatsApp
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
    'היכרות אישית ורקע',
    'השקפה, תורה וקדושת הבית',
    'כשרות, שבת וקדושת המטבח',
    'ניהול הבית, כלכלה וטכנולוגיה',
    'חינוך ילדים והורות',
    'דינמיקה זוגית, שלום בית ומידות',
    'קווים אדומים והתאמה סופית'
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
      showToast('אנא בחרי קובץ תמונה תקין (JPG, PNG וכד\')', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('גודל התמונה גדול מ-5MB. אנא בחרי תמונה קטנה יותר.', 'warning');
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
    const hasChildrenVal = document.querySelector('input[name="has_children"]:checked')?.value;
    if (boxChildrenDetails) {
      if (hasChildrenVal === 'יש') {
        boxChildrenDetails.classList.remove('hidden');
      } else {
        boxChildrenDetails.classList.add('hidden');
      }
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
    const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'מועמדת לשידוכים';
    
    // Top Profile Header
    document.getElementById('card-display-fullname').textContent = fullName;
    dockPreviewName.textContent = fullName;

    document.getElementById('card-badge-status').innerHTML = `<i class="fa-solid fa-heart"></i> ${data.marital_status || 'רווקה'}`;
    document.getElementById('card-badge-age').innerHTML = `<i class="fa-solid fa-cake-candles"></i> גיל: ${data.age || '-'}`;
    document.getElementById('card-badge-height').innerHTML = `<i class="fa-solid fa-ruler-vertical"></i> ${data.height || '-'}`;
    document.getElementById('card-badge-city').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${data.city || '-'}`;

    document.getElementById('card-display-ethnicity').textContent = data.ethnicity || 'לא צוין';
    document.getElementById('card-display-profession').textContent = data.occupation_aspiration ? (data.occupation_aspiration.length > 40 ? data.occupation_aspiration.slice(0, 40) + '...' : data.occupation_aspiration) : 'לא צוין';
    document.getElementById('card-display-phone').textContent = data.phone || 'לא צוין';

    // Torah & Modesty
    setCardText('card-val-husband-torah', data.husband_torah_aspiration);
    setCardText('card-val-head-covering', data.head_covering_preference);
    setCardText('card-val-modesty', data.modesty_style);
    setCardText('card-val-rabbi', data.guiding_rabbi);

    // Kashrut & Shabbat
    setCardText('card-val-kashrut-home', data.home_kashrut);
    setCardText('card-val-kashrut-out', data.outside_kashrut);
    setCardText('card-val-husband-customs', data.husband_customs);
    setCardText('card-val-shabbat', data.shabbat_atmosphere);

    // Household & Tech
    setCardText('card-val-finance', data.financial_outlook);
    setCardText('card-val-chores', data.chores_expectations);
    setCardText('card-val-tech', data.tech_screens_policy);
    setCardText('card-val-hospitality', data.hospitality_preference);

    // Kids & Parenting
    setCardText('card-val-schools', data.kids_schooling_type);
    setCardText('card-val-parenting', data.parenting_philosophy);
    setCardText('card-val-father-role', data.father_role_kids);

    // Husband Expectation & Reconciliation
    setCardText('card-val-husband-expectation', data.husband_role_expectation || 'טרם מולא פירוט זה...');
    setCardText('card-val-love-lang', data.love_language);
    setCardText('card-val-reconciliation', data.reconciliation_approach ? (data.reconciliation_approach.length > 45 ? data.reconciliation_approach.slice(0, 45) + '...' : data.reconciliation_approach) : '-');

    // Red Lines & Crucial Notes
    let redLinesCombined = '';
    if (data.red_lines) redLinesCombined += `⛔ קווים אדומים: ${data.red_lines}\n`;
    if (data.crucial_facts_her) redLinesCombined += `📌 דברים שחשוב לדעת: ${data.crucial_facts_her}`;
    setCardText('card-val-redlines', redLinesCombined || 'אין עניינים מיוחדים שצוינו');

    // Calculate Completion
    calculateCompletion(data);
  }

  function setCardText(id, val) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = val && val.trim().length > 0 ? val : '-';
    }
  }

  function calculateCompletion(data) {
    const importantFields = [
      'first_name', 'last_name', 'age', 'city', 'phone', 'marital_status',
      'teshuva_journey', 'occupation_aspiration',
      'husband_torah_aspiration', 'head_covering_preference', 'modesty_style',
      'home_kashrut', 'outside_kashrut', 'shabbat_atmosphere', 'husband_customs',
      'financial_outlook', 'chores_expectations', 'tech_screens_policy',
      'kids_schooling_type', 'parenting_philosophy',
      'husband_role_expectation', 'reconciliation_approach', 'love_language',
      'red_lines', 'crucial_facts_her'
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
      localStorage.setItem('shidduch_candidate_form_data_v2', JSON.stringify(data));
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
      const saved = localStorage.getItem('shidduch_candidate_form_data_v2');
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
      first_name: 'מרים',
      last_name: 'כהן',
      age: '26',
      birth_date: 'י"ב אלול תשנ"ח (03/09/1998)',
      height: '1.67 מ\'',
      city: 'ירושלים (בית וגן)',
      phone: '052-7164920',
      ethnicity: 'ספרדייה',
      marital_status: 'רווקה',
      has_children: 'אין',
      teshuva_journey: 'גדלתי בבית מסורתי-חם. לפני כ-4 שנים התחזקתי בעקבות שיעורי תורה ומדרשייה בירושלים. כיום שומרת תורה ומצוות מלאות מתוך אהבה, שמחה ורצון עז להקים בית תורני יציב.',
      occupation_aspiration: 'עובדת כיועצת חינוכית ומורה במשרה חלקית (עד 14:00). חשוב לי מאוד להיות נוכחת בבית, לגדל את הילדים ברוגע ולהשרות שלווה.',
      husband_torah_aspiration: 'משלב עבודה עם קביעות עתים עמוקה',
      head_covering_preference: 'מטפחת / שביס מלא',
      modesty_style: 'צניעות מוקפדת ואלגנטית, שרוולים מלאים, חצאיות ארוכות וצבעים נעימים ולא מושכים תשומת לב.',
      guiding_rabbi: 'הרב ראובן אלבז / מתייעצת עם הרבנית של המדרשייה',
      dating_boundaries: 'שמירת נגיעה מלאה, ללא ייחוד כלל, פגישות במקומות שקטים ומכבדים, התקדמות עניינית לבירור התאמה ללא מריחת זמן.',
      home_kashrut: 'מהדרין מובהק (עדה חרדית, רובין, לנדא, בית יוסף)',
      outside_kashrut: 'במסעדות רק מהדרין מובהק ומוכר. אצל המשפחה אוכלת בכבוד לפי גדרי ההלכה דברים סגורים או מוצרים בהכשר מהדרין ללא פגיעה בכבודם.',
      shabbat_atmosphere: 'שולחן שבת שמח ומרומם, שירי שבת, דברי תורה קצרים ומאירים של הבעל, אוכל טעים ומוקפד, אווירה של מנוחת נפש ללא לחץ.',
      husband_customs: 'כן, בשמחה ובטבעיות',
      financial_outlook: 'איזון מחושב ותקציב מסודר ללא חובות',
      chores_expectations: 'אני שמחה לקחת על עצמי את עיקר ניהול הבית, הבישול והטיפול בשוטף, ומצפה שהבעל יהיה שותף אכפתי – בקניות, עזרה בהורדת הפח ובהכנות לקראת שבת.',
      tech_screens_policy: 'אינטרנט מסונן נטפרי בלבד וללא טלוויזיה',
      hospitality_preference: 'אוהבת מאוד לארח בשמחה וברוחב לב, אך חשוב לי לשמור גם שבתות אינטימיות ושקטות רק לנו כזוג.',
      kids_schooling_type: 'תלמודי תורה ובית יעקב חרדי קלאסי',
      parenting_philosophy: 'הרבה חום, חיבוקים, מילים מעצימות ואהבה ללא תנאי, יחד עם גבולות ברורים ועקביים שמקנים לילד ביטחון ושמחת חיים.',
      child_crisis_reaction: 'לקרב בימין, להקשיב לכאב של הילד, לא לכפות בכוח, להרבות בתפילות וחיזוק הקשר האישי, ולהתייעץ יחד עם איש מקצוע תורני.',
      father_role_kids: 'דוגמה אישית של יראת שמיים ואהבת תורה, שיחות אישיות עם הילדים, משחקים משותפים ולימוד מתוק וסבלני.',
      husband_role_expectation: 'עוגן רוחני ורגשי של הבית, אדם שמכבד ומעריך, בעל מידות טובות וסבלנות, שמשרה ביטחון, אהבה ושמחה בבית.',
      reconciliation_approach: 'לתת לי 15 דקות של שקט להירגע. לא להגיב בציניות או תוקפנות, אלא לגשת ברוגע עם חיבוק ומילה טובה, ולהקשיב בלי להאשים.',
      love_language: 'מילות הערכה, מחמאות ופרגון',
      inlaws_boundaries: 'כיבוד הורים מלא באהבה וברוחב לב, אך ברור שהזוגיות שלנו היא קודש הקודשים. החלטות מתקבלות אך ורק בינינו בשיח פנימי.',
      personal_traits_reflection: 'מעריכה בי נאמנות, לב רגיש ואוהב, וסדר. עובדת לשפר דאגנות יתר ולפתח יותר ביטחון בהשם יתברך.',
      red_lines: 'כעס ותוקפנות, קמצנות, חוסר אמינות ושקרים, התמכרויות מכל סוג, חוסר יציבות נפשית או זלזול באחרים.',
      wants_to_know_about_him: 'איך אתה מתמודד עם כעס, מה משמח אותך ביומיום, מה מקום התורה בחייך, ואיזה אבא אתה חולם להיות.',
      crucial_facts_her: 'בריאה לחלוטין ברוך השם, מגיעה ממשפחה חמה ותומכת, מחפשת קשר תכליתי וטהור לחתונה מתוך רצון אמיתי לבנות בית של תורה וחסד.',
      dating_pace: 'מהיר ותכליתי (חודש עד 3 חודשים)'
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
    showToast('הנתונים לדוגמה עבור המועמדת מולאו בהצלחה!');
  }

  // WhatsApp Export
  function exportToWhatsApp() {
    const data = getFormData();
    const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'מועמדת לשידוכים';
    
    let text = `*בס"ד | שאלון בירור והתאמה לשידוכים - מועמדת*\n`;
    text += `*${fullName}*\n\n`;
    
    text += `👤 *פרטים אישיים ורקע:*\n`;
    text += `• סטטוס: ${data.marital_status || 'רווקה'}\n`;
    text += `• גיל: ${data.age || '-'}\n`;
    text += `• עיר מגורים: ${data.city || '-'}\n`;
    text += `• גובה: ${data.height || '-'}\n`;
    text += `• עדה / מוצא: ${data.ethnicity || '-'}\n`;
    text += `• טלפון: ${data.phone || '-'}\n`;
    if (data.occupation_aspiration) text += `• עיסוק ושאיפות: ${data.occupation_aspiration}\n`;
    if (data.teshuva_journey) text += `• רקע ומסלול חיים: ${data.teshuva_journey}\n`;
    
    text += `\n📖 *השקפה, תורה וקדושת הבית:*\n`;
    if (data.husband_torah_aspiration) text += `• שאיפה מתורת הבעל: ${data.husband_torah_aspiration}\n`;
    if (data.head_covering_preference) text += `• כיסוי ראש: ${data.head_covering_preference}\n`;
    if (data.modesty_style) text += `• קו צניעות: ${data.modesty_style}\n`;
    if (data.guiding_rabbi) text += `• רב / קהילה: ${data.guiding_rabbi}\n`;
    
    text += `\n🍽️ *כשרות ושבת קודש:*\n`;
    if (data.home_kashrut) text += `• כשרות בבית: ${data.home_kashrut}\n`;
    if (data.outside_kashrut) text += `• אכילה בחוץ: ${data.outside_kashrut}\n`;
    if (data.shabbat_atmosphere) text += `• שולחן שבת: ${data.shabbat_atmosphere}\n`;
    if (data.husband_customs) text += `• מנהגי הבעל: ${data.husband_customs}\n`;
    
    text += `\n🏡 *ניהול בית, כלכלה וטכנולוגיה:*\n`;
    if (data.financial_outlook) text += `• גישה כלכלית: ${data.financial_outlook}\n`;
    if (data.chores_expectations) text += `• שותפות הבעל במטלות: ${data.chores_expectations}\n`;
    if (data.tech_screens_policy) text += `• אינטרנט ומסכים: ${data.tech_screens_policy}\n`;
    if (data.hospitality_preference) text += `• אירוח: ${data.hospitality_preference}\n`;
    
    text += `\n👶 *חינוך ילדים:*\n`;
    if (data.kids_schooling_type) text += `• מוסדות חינוך: ${data.kids_schooling_type}\n`;
    if (data.parenting_philosophy) text += `• קו חינוכי: ${data.parenting_philosophy}\n`;
    
    text += `\n❤️ *זוגיות, שלום בית ומידות:*\n`;
    if (data.husband_role_expectation) text += `• ציפייה מהבעל: ${data.husband_role_expectation}\n`;
    if (data.reconciliation_approach) text += `• התנהלות בפיוס וכעס: ${data.reconciliation_approach}\n`;
    if (data.love_language) text += `• שפת אהבה: ${data.love_language}\n`;
    if (data.inlaws_boundaries) text += `• גבולות מול משפחות: ${data.inlaws_boundaries}\n`;

    if (data.red_lines) {
      text += `\n⛔ *קווים אדומים:*\n${data.red_lines}\n`;
    }

    if (data.crucial_facts_her) {
      text += `\n📌 *דברים שחשוב לדעת:*\n${data.crucial_facts_her}\n`;
    }

    text += `\n_לבירורים ופרטים נוספים ניתן לפנות בכבוד וצניעות._`;

    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('הסיכום הועתק ללוח! פותח כעת את WhatsApp...');
      }).catch(() => {});
    }

    // Open WhatsApp
    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  }

  // Copy Full Profile Text
  function copyFullProfileText() {
    const data = getFormData();
    let text = `שאלון עומק לשידוכים - תשובות המועמדת\n====================================\n`;
    for (let key in data) {
      if (key === 'photo_base64') continue;
      if (data[key]) {
        text += `${key}: ${data[key]}\n`;
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('כל פרטי השאלון הועתקו ללוח בהצלחה!');
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
