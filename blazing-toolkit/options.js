// Options page script
document.addEventListener('DOMContentLoaded', () => {
  // ========== COLLAPSIBLE SECTIONS ==========
  const sectionHeaders = document.querySelectorAll('.section-header');
  const COLLAPSED_SECTIONS_KEY = 'collapsedSections';
  const FIRST_VISIT_KEY = 'optionsFirstVisit';
  const allSectionIds = ['section-general', 'section-personnalisation', 'section-modules', 'section-ia', 'section-backup', 'section-updates', 'section-data'];

  // Check if first visit and initialize sections
  chrome.storage.local.get([COLLAPSED_SECTIONS_KEY, FIRST_VISIT_KEY], (data) => {
    const isFirstVisit = !data[FIRST_VISIT_KEY];

    if (isFirstVisit) {
      // First visit: collapse all except modules section
      allSectionIds.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section && sectionId !== 'section-modules') {
          section.classList.add('collapsed');
        }
      });

      // Show welcome message
      showWelcomeMessage();

      // Mark as visited
      chrome.storage.local.set({ [FIRST_VISIT_KEY]: true });
    } else {
      // Not first visit: use saved state or collapse all by default
      const collapsedSections = data[COLLAPSED_SECTIONS_KEY];

      if (collapsedSections && collapsedSections.length > 0) {
        // Restore saved state
        collapsedSections.forEach(sectionId => {
          const section = document.getElementById(sectionId);
          if (section) {
            section.classList.add('collapsed');
          }
        });
      } else {
        // No saved state: collapse all by default
        allSectionIds.forEach(sectionId => {
          const section = document.getElementById(sectionId);
          if (section) {
            section.classList.add('collapsed');
          }
        });
      }
    }
  });

  // Welcome message for first-time users
  function showWelcomeMessage() {
    const modulesSection = document.getElementById('section-modules');
    if (!modulesSection) return;

    const welcomeBanner = document.createElement('div');
    welcomeBanner.id = 'welcome-banner';
    welcomeBanner.innerHTML = `
      <div class="welcome-content">
        <span class="welcome-icon">👋</span>
        <div class="welcome-text">
          <strong>Bienvenue!</strong>
          <p>Commencez par ajouter vos premiers outils depuis la colonne de gauche, ou creez vos propres raccourcis!</p>
        </div>
        <button class="welcome-close" title="Fermer">✕</button>
      </div>
    `;

    // Insert after section-content starts
    const sectionContent = modulesSection.querySelector('.section-content');
    if (sectionContent && sectionContent.firstChild) {
      sectionContent.insertBefore(welcomeBanner, sectionContent.firstChild.nextSibling);
    }

    // Close button handler
    welcomeBanner.querySelector('.welcome-close').addEventListener('click', () => {
      welcomeBanner.style.animation = 'slideUp 0.3s ease forwards';
      setTimeout(() => welcomeBanner.remove(), 300);
    });
  }

  // Add click handlers to section headers
  sectionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const section = header.parentElement;
      section.classList.toggle('collapsed');

      // Save collapsed state
      const allSections = document.querySelectorAll('.section[id]');
      const collapsedSections = [];
      allSections.forEach(s => {
        if (s.classList.contains('collapsed')) {
          collapsedSections.push(s.id);
        }
      });
      chrome.storage.local.set({ [COLLAPSED_SECTIONS_KEY]: collapsedSections });
    });
  });

  // ========== DEFAULT VALUES ==========
  const DEFAULT_COLORS = {
    bgColor: '#f5f5f5',
    textColor: '#333333',
    primaryColor: '#3498db',
    primaryHover: '#2980b9',
    secondaryColor: '#2c3e50',
    buttonBg: '#ffffff',
    buttonText: '#666666',
    panelBg: '#ffffff',
    borderColor: '#eeeeee',
    successColor: '#27ae60',
    errorColor: '#e74c3c',
    categoryBg: '#ffffff',
    categoryHeader: '#f5f5f5',
    footerBg: '#f5f5f5',
    footerText: '#999999'
  };

  const POPULAR_EMOJIS = [
    '🏠', '🏢', '💼', '📊', '📈', '🔧', '⚙️', '🛠️',
    '🌐', '🔗', '📧', '📩', '💬', '📱', '💻', '🖥️',
    '📁', '📂', '📄', '📝', '✏️', '🔍', '🔎', '📌',
    '⭐', '🌟', '💡', '🎯', '🚀', '🎨', '🎭', '🎪',
    '🛒', '🛍️', '💳', '💰', '📦', '🎁', '🔒', '🔑',
    '❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍'
  ];

  // Comprehensive emoji categories
  const EMOJI_CATEGORIES = {
    '😀 Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😎', '🤩', '🥳', '😏', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '🥸', '😈', '👿', '👹', '👺', '💀', '👻', '👽', '🤖', '💩', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
    '👋 Gestes': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '👀', '👁️', '👅', '👄'],
    '👤 Personnes': ['👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '🧑‍🦱', '👨‍🦱', '👩‍🦰', '🧑‍🦰', '👨‍🦰', '👱‍♀️', '👱', '👱‍♂️', '👩‍🦳', '🧑‍🦳', '👨‍🦳', '👩‍🦲', '🧑‍🦲', '👨‍🦲', '🧔', '👵', '🧓', '👴', '👲', '👳‍♀️', '👳', '👳‍♂️', '🧕', '👮‍♀️', '👮', '👮‍♂️', '👷‍♀️', '👷', '👷‍♂️', '💂‍♀️', '💂', '💂‍♂️', '🕵️‍♀️', '🕵️', '🕵️‍♂️', '👩‍⚕️', '🧑‍⚕️', '👨‍⚕️', '👩‍🌾', '🧑‍🌾', '👨‍🌾', '👩‍🍳', '🧑‍🍳', '👨‍🍳', '👩‍🎓', '🧑‍🎓', '👨‍🎓', '👩‍🎤', '🧑‍🎤', '👨‍🎤', '👩‍🏫', '🧑‍🏫', '👨‍🏫', '👩‍🏭', '🧑‍🏭', '👨‍🏭', '👩‍💻', '🧑‍💻', '👨‍💻', '👩‍💼', '🧑‍💼', '👨‍💼', '👩‍🔧', '🧑‍🔧', '👨‍🔧', '👩‍🔬', '🧑‍🔬', '👨‍🔬', '👩‍🎨', '🧑‍🎨', '👨‍🎨', '👩‍🚒', '🧑‍🚒', '👨‍🚒', '👩‍✈️', '🧑‍✈️', '👨‍✈️', '👩‍🚀', '🧑‍🚀', '👨‍🚀', '👩‍⚖️', '🧑‍⚖️', '👨‍⚖️', '👰‍♀️', '👰', '👰‍♂️', '🤵‍♀️', '🤵', '🤵‍♂️', '👸', '🤴', '🥷', '🦸‍♀️', '🦸', '🦸‍♂️', '🦹‍♀️', '🦹', '🦹‍♂️', '🤶', '🧑‍🎄', '🎅', '🧙‍♀️', '🧙', '🧙‍♂️', '🧝‍♀️', '🧝', '🧝‍♂️', '🧛‍♀️', '🧛', '🧛‍♂️', '🧟‍♀️', '🧟', '🧟‍♂️', '🧞‍♀️', '🧞', '🧞‍♂️', '🧜‍♀️', '🧜', '🧜‍♂️', '🧚‍♀️', '🧚', '🧚‍♂️', '👼', '🤰', '🤱', '👩‍🍼', '🧑‍🍼', '👨‍🍼'],
    '🐶 Animaux': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'],
    '🍎 Nourriture': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥣', '🥡', '🥢', '🧂'],
    '⚽ Sport': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♀️', '🏋️', '🏋️‍♂️', '🤼‍♀️', '🤼', '🤼‍♂️', '🤸‍♀️', '🤸', '🤸‍♂️', '⛹️‍♀️', '⛹️', '⛹️‍♂️', '🤺', '🤾‍♀️', '🤾', '🤾‍♂️', '🏌️‍♀️', '🏌️', '🏌️‍♂️', '🏇', '🧘‍♀️', '🧘', '🧘‍♂️', '🏄‍♀️', '🏄', '🏄‍♂️', '🏊‍♀️', '🏊', '🏊‍♂️', '🤽‍♀️', '🤽', '🤽‍♂️', '🚣‍♀️', '🚣', '🚣‍♂️', '🧗‍♀️', '🧗', '🧗‍♂️', '🚵‍♀️', '🚵', '🚵‍♂️', '🚴‍♀️', '🚴', '🚴‍♂️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪'],
    '🚗 Transport': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '🪝', '⛽', '🚧', '🚦', '🚥', '🚏', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🛖', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🕍', '🛕', '🕋', '⛩️', '🛤️', '🛣️', '🗾', '🎑', '🏞️', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙️', '🌃', '🌌', '🌉', '🌁'],
    '💡 Objets': ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🪆', '🖼️', '🪞', '🪟', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🪄', '🪅', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '🪧', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '✏️', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓'],
    '❤️ Symboles': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧️', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '🟰', '♾️', '💲', '💱', '™️', '©️', '®️', '👁️‍🗨️', '🔚', '🔙', '🔛', '🔝', '🔜', '〰️', '➰', '➿', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'],
    '🌍 Nature': ['🌍', '🌎', '🌏', '🌐', '🗺️', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙️', '🌃', '🌌', '🌉', '🌁', '🌀', '🌈', '🌂', '☂️', '☔', '⛱️', '⚡', '❄️', '☃️', '⛄', '☄️', '🔥', '💧', '🌊', '🎄', '✨', '🎋', '🎍', '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '🌪️', '🌫️', '🌬️', '💨', '🌙', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌝', '⭐', '🌟', '💫', '✨', '☀️', '🌞']
  };

  // ========== GENERAL SETTINGS (TITLE + LANGUAGE + THEME) ==========
  const popupTitleInput = document.getElementById('popup-title-input');
  const languageSelect = document.getElementById('language-select');
  const themeSelect = document.getElementById('theme-select');
  const saveGeneralBtn = document.getElementById('btn-save-general');
  const generalStatus = document.getElementById('general-status');

  // Theme management
  function applyTheme(theme) {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.toggle('dark-mode', prefersDark);
    } else {
      document.body.classList.toggle('dark-mode', theme === 'dark');
    }
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    chrome.storage.sync.get(['theme'], (data) => {
      if (data.theme === 'system') {
        document.body.classList.toggle('dark-mode', e.matches);
        // Notify sidebar of theme change
        chrome.runtime.sendMessage({ type: 'themeChanged', theme: 'system', isDark: e.matches });
      }
    });
  });

  // Load saved settings
  chrome.storage.sync.get(['popupTitle', 'language', 'theme'], (data) => {
    if (data.popupTitle && popupTitleInput) {
      popupTitleInput.value = data.popupTitle;
    }
    if (data.language && languageSelect) {
      languageSelect.value = data.language;
    }
    if (data.theme && themeSelect) {
      themeSelect.value = data.theme;
    }
    applyTheme(data.theme || 'light');
  });

  // Apply theme immediately when changed
  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      applyTheme(themeSelect.value);
      // Notify sidebar of theme change
      chrome.runtime.sendMessage({ type: 'themeChanged', theme: themeSelect.value });
    });
  }

  // Save general settings
  if (saveGeneralBtn) {
    saveGeneralBtn.addEventListener('click', () => {
      const title = popupTitleInput.value.trim() || 'Toolkit';
      const language = languageSelect.value || 'fr';
      const theme = themeSelect.value || 'light';
      chrome.storage.sync.set({ popupTitle: title, language: language, theme: theme }, () => {
        showStatus(generalStatus, 'Parametres sauvegardes!', 'success');
        // Notify all windows of settings change
        chrome.runtime.sendMessage({ type: 'settingsChanged', settings: { popupTitle: title, language, theme } });
      });
    });
  }

  // ========== UNIFIED MODULE MANAGER ==========
  // (Implementation moved to REORDER section below)

  // ========== COLOR CUSTOMIZATION ==========
  const colorInputs = {
    bgColor: document.getElementById('color-bg'),
    textColor: document.getElementById('color-text'),
    primaryColor: document.getElementById('color-primary'),
    primaryHover: document.getElementById('color-primary-hover'),
    secondaryColor: document.getElementById('color-secondary'),
    buttonBg: document.getElementById('color-button-bg'),
    buttonText: document.getElementById('color-button-text'),
    panelBg: document.getElementById('color-panel-bg'),
    borderColor: document.getElementById('color-border'),
    successColor: document.getElementById('color-success'),
    errorColor: document.getElementById('color-error'),
    categoryBg: document.getElementById('color-category-bg'),
    categoryHeader: document.getElementById('color-category-header'),
    footerBg: document.getElementById('color-footer-bg'),
    footerText: document.getElementById('color-footer-text')
  };

  // Unified save buttons for personnalisation section
  const savePersonnalisationBtn = document.getElementById('btn-save-personnalisation');
  const resetPersonnalisationBtn = document.getElementById('btn-reset-personnalisation');
  const personnalisationStatus = document.getElementById('personnalisation-status');

  // Load saved colors
  chrome.storage.sync.get(['customColors'], (data) => {
    const colors = data.customColors || DEFAULT_COLORS;
    Object.keys(colorInputs).forEach(key => {
      if (colorInputs[key] && colors[key]) {
        colorInputs[key].value = colors[key];
      }
    });
  });

  // Live preview: broadcast color changes immediately
  Object.keys(colorInputs).forEach(key => {
    if (colorInputs[key]) {
      colorInputs[key].addEventListener('input', () => {
        const colors = {};
        Object.keys(colorInputs).forEach(k => {
          colors[k] = colorInputs[k].value;
        });
        chrome.runtime.sendMessage({ type: 'colorsChanged', colors });
      });
    }
  });

  // Save and reset handled by unified personnalisation button below

  // ========== BORDER RADIUS ==========
  const DEFAULT_RADIUS = {
    radiusSmall: 4,
    radiusMedium: 8,
    radiusLarge: 12,
    radiusCategoryTop: 8,
    radiusCategoryBottom: 8
  };

  const radiusSmall = document.getElementById('radius-small');
  const radiusMedium = document.getElementById('radius-medium');
  const radiusLarge = document.getElementById('radius-large');
  const radiusCategoryTop = document.getElementById('radius-category-top');
  const radiusCategoryBottom = document.getElementById('radius-category-bottom');
  const radiusSmallValue = document.getElementById('radius-small-value');
  const radiusMediumValue = document.getElementById('radius-medium-value');
  const radiusLargeValue = document.getElementById('radius-large-value');
  const radiusCategoryTopValue = document.getElementById('radius-category-top-value');
  const radiusCategoryBottomValue = document.getElementById('radius-category-bottom-value');

  // Update value display on slider change
  function updateRadiusDisplay() {
    if (radiusSmallValue) radiusSmallValue.textContent = radiusSmall.value + 'px';
    if (radiusMediumValue) radiusMediumValue.textContent = radiusMedium.value + 'px';
    if (radiusLargeValue) radiusLargeValue.textContent = radiusLarge.value + 'px';
    if (radiusCategoryTopValue) radiusCategoryTopValue.textContent = radiusCategoryTop.value + 'px';
    if (radiusCategoryBottomValue) radiusCategoryBottomValue.textContent = radiusCategoryBottom.value + 'px';
  }

  function broadcastRadiusChange() {
    const radius = {
      radiusSmall: parseInt(radiusSmall.value),
      radiusMedium: parseInt(radiusMedium.value),
      radiusLarge: parseInt(radiusLarge.value),
      radiusCategoryTop: parseInt(radiusCategoryTop?.value || 8),
      radiusCategoryBottom: parseInt(radiusCategoryBottom?.value || 8)
    };
    chrome.runtime.sendMessage({ type: 'radiusChanged', radius });
  }

  if (radiusSmall) radiusSmall.addEventListener('input', () => { updateRadiusDisplay(); broadcastRadiusChange(); });
  if (radiusMedium) radiusMedium.addEventListener('input', () => { updateRadiusDisplay(); broadcastRadiusChange(); });
  if (radiusLarge) radiusLarge.addEventListener('input', () => { updateRadiusDisplay(); broadcastRadiusChange(); });
  if (radiusCategoryTop) radiusCategoryTop.addEventListener('input', () => { updateRadiusDisplay(); broadcastRadiusChange(); });
  if (radiusCategoryBottom) radiusCategoryBottom.addEventListener('input', () => { updateRadiusDisplay(); broadcastRadiusChange(); });

  // Load saved radius
  chrome.storage.sync.get(['customRadius'], (data) => {
    const radius = data.customRadius || DEFAULT_RADIUS;
    if (radiusSmall) radiusSmall.value = radius.radiusSmall;
    if (radiusMedium) radiusMedium.value = radius.radiusMedium;
    if (radiusLarge) radiusLarge.value = radius.radiusLarge;
    if (radiusCategoryTop) radiusCategoryTop.value = radius.radiusCategoryTop || 8;
    if (radiusCategoryBottom) radiusCategoryBottom.value = radius.radiusCategoryBottom || 8;
    updateRadiusDisplay();
  });

  // Radius save/reset handled by unified personnalisation button

  // ========== BUTTON SIZE ==========
  const buttonSizeSlider = document.getElementById('button-size');
  const buttonSizeValue = document.getElementById('button-size-value');
  const sizePreviewBtn = document.getElementById('size-preview-btn');

  function updateSizeDisplay() {
    if (buttonSizeValue && buttonSizeSlider) {
      const percent = Math.round(parseFloat(buttonSizeSlider.value) * 100);
      buttonSizeValue.textContent = percent + '%';

      // Update preview
      if (sizePreviewBtn) {
        const size = parseFloat(buttonSizeSlider.value);
        sizePreviewBtn.style.padding = `${12 * size}px ${8 * size}px`;
        sizePreviewBtn.querySelector('span:first-child').style.fontSize = `${24 * size}px`;
        sizePreviewBtn.querySelector('span:last-child').style.fontSize = `${10 * size}px`;
      }
    }
  }

  if (buttonSizeSlider) {
    buttonSizeSlider.addEventListener('input', () => {
      updateSizeDisplay();
      // Live preview: broadcast size change
      chrome.runtime.sendMessage({ type: 'sizeChanged', size: parseFloat(buttonSizeSlider.value) });
    });
  }

  // Load saved size
  chrome.storage.sync.get(['buttonSize'], (data) => {
    const size = data.buttonSize || 1;
    if (buttonSizeSlider) buttonSizeSlider.value = size;
    updateSizeDisplay();
  });

  // ========== UNIFIED PERSONNALISATION SAVE/RESET ==========
  if (savePersonnalisationBtn) {
    savePersonnalisationBtn.addEventListener('click', () => {
      // Save colors
      const colors = {};
      Object.keys(colorInputs).forEach(key => {
        colors[key] = colorInputs[key].value;
      });

      // Save radius
      const radius = {
        radiusSmall: parseInt(radiusSmall.value),
        radiusMedium: parseInt(radiusMedium.value),
        radiusLarge: parseInt(radiusLarge.value),
        radiusCategoryTop: parseInt(radiusCategoryTop?.value || 8),
        radiusCategoryBottom: parseInt(radiusCategoryBottom?.value || 8)
      };

      // Save size
      const size = parseFloat(buttonSizeSlider.value);

      chrome.storage.sync.set({
        customColors: colors,
        customRadius: radius,
        buttonSize: size
      }, () => {
        showStatus(personnalisationStatus, 'Personnalisation sauvegardee!', 'success');
      });
    });
  }

  if (resetPersonnalisationBtn) {
    resetPersonnalisationBtn.addEventListener('click', () => {
      // Reset colors
      Object.keys(colorInputs).forEach(key => {
        colorInputs[key].value = DEFAULT_COLORS[key];
      });
      // Broadcast color change for live preview
      chrome.runtime.sendMessage({ type: 'colorsChanged', colors: DEFAULT_COLORS });

      // Reset radius
      if (radiusSmall) radiusSmall.value = DEFAULT_RADIUS.radiusSmall;
      if (radiusMedium) radiusMedium.value = DEFAULT_RADIUS.radiusMedium;
      if (radiusLarge) radiusLarge.value = DEFAULT_RADIUS.radiusLarge;
      if (radiusCategoryTop) radiusCategoryTop.value = DEFAULT_RADIUS.radiusCategoryTop;
      if (radiusCategoryBottom) radiusCategoryBottom.value = DEFAULT_RADIUS.radiusCategoryBottom;
      updateRadiusDisplay();
      // Broadcast radius change for live preview
      chrome.runtime.sendMessage({ type: 'radiusChanged', radius: DEFAULT_RADIUS });

      // Reset size
      if (buttonSizeSlider) buttonSizeSlider.value = 1;
      updateSizeDisplay();
      // Broadcast size change for live preview
      chrome.runtime.sendMessage({ type: 'sizeChanged', size: 1 });

      chrome.storage.sync.set({
        customColors: DEFAULT_COLORS,
        customRadius: DEFAULT_RADIUS,
        buttonSize: 1
      }, () => {
        showStatus(personnalisationStatus, 'Personnalisation reinitialisee!', 'success');
      });
    });
  }

  // ========== DYNAMIC BUTTONS (SHORTCUTS) ==========
  const buttonsList = document.getElementById('buttons-list');
  const shortcutsSection = document.getElementById('shortcuts-section');
  const newBtnName = document.getElementById('new-btn-name');
  const newBtnUrl = document.getElementById('new-btn-url');
  const newBtnIcon = document.getElementById('new-btn-icon');
  const addButtonBtn = document.getElementById('btn-add-button');
  const buttonsStatus = document.getElementById('buttons-status');
  const emojiPickerBtn = document.getElementById('btn-emoji-picker');
  const emojiPicker = document.getElementById('emoji-picker');
  const shortcutModal = document.getElementById('shortcut-modal');
  const btnNewShortcut = document.getElementById('btn-new-shortcut');
  const btnCancelShortcut = document.getElementById('btn-cancel-shortcut');

  let customButtons = [];

  // Initialize emoji picker with categories
  initEmojiPicker(emojiPicker, newBtnIcon, emojiPickerBtn);

  // Load saved buttons
  loadButtons();

  // Generic function to create emoji picker with categories
  function initEmojiPicker(pickerEl, inputEl, triggerBtn) {
    const emojiGrid = pickerEl.querySelector('.emoji-grid');
    emojiGrid.innerHTML = '';

    // Create category tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'emoji-tabs';

    const contentContainer = document.createElement('div');
    contentContainer.className = 'emoji-content';

    const categoryNames = Object.keys(EMOJI_CATEGORIES);
    categoryNames.forEach((catName, index) => {
      // Tab button (just the emoji part)
      const tabEmoji = catName.split(' ')[0];
      const tabBtn = document.createElement('button');
      tabBtn.type = 'button';
      tabBtn.className = 'emoji-tab' + (index === 0 ? ' active' : '');
      tabBtn.textContent = tabEmoji;
      tabBtn.title = catName;
      tabBtn.dataset.category = catName;
      tabBtn.addEventListener('click', () => {
        // Switch active tab
        tabsContainer.querySelectorAll('.emoji-tab').forEach(t => t.classList.remove('active'));
        tabBtn.classList.add('active');
        // Show corresponding content
        contentContainer.querySelectorAll('.emoji-category-content').forEach(c => c.classList.remove('active'));
        contentContainer.querySelector(`[data-category="${catName}"]`).classList.add('active');
      });
      tabsContainer.appendChild(tabBtn);

      // Category content
      const catContent = document.createElement('div');
      catContent.className = 'emoji-category-content' + (index === 0 ? ' active' : '');
      catContent.dataset.category = catName;

      EMOJI_CATEGORIES[catName].forEach(emoji => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'emoji-btn';
        btn.textContent = emoji;
        btn.addEventListener('click', () => {
          inputEl.value = emoji;
          pickerEl.classList.remove('show');
        });
        catContent.appendChild(btn);
      });
      contentContainer.appendChild(catContent);
    });

    emojiGrid.appendChild(tabsContainer);
    emojiGrid.appendChild(contentContainer);
  }

  emojiPickerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    emojiPicker.classList.toggle('show');
  });

  // Close emoji picker when clicking outside
  document.addEventListener('click', (e) => {
    if (!emojiPicker.contains(e.target) && e.target !== emojiPickerBtn) {
      emojiPicker.classList.remove('show');
    }
  });

  // Shortcut modal handling
  btnNewShortcut.addEventListener('click', () => {
    shortcutModal.classList.add('visible');
    newBtnName.focus();
  });

  btnCancelShortcut.addEventListener('click', () => {
    shortcutModal.classList.remove('visible');
    newBtnName.value = '';
    newBtnUrl.value = '';
    newBtnIcon.value = '';
  });

  // Close modal on overlay click
  shortcutModal.addEventListener('click', (e) => {
    if (e.target === shortcutModal) {
      shortcutModal.classList.remove('visible');
      newBtnName.value = '';
      newBtnUrl.value = '';
      newBtnIcon.value = '';
    }
  });

  function loadButtons() {
    chrome.storage.sync.get(['customButtons'], (data) => {
      customButtons = data.customButtons || [];
      renderButtons();
    });
  }

  function saveButtons() {
    chrome.storage.sync.set({ customButtons }, () => {
      showStatus(buttonsStatus, 'Raccourci sauvegarde!', 'success');
    });
  }

  function renderButtons() {
    buttonsList.innerHTML = '';

    // Show/hide shortcuts section based on whether there are buttons
    if (customButtons.length === 0) {
      shortcutsSection.style.display = 'none';
      return;
    }

    shortcutsSection.style.display = 'block';

    customButtons.forEach((btn, index) => {
      const item = document.createElement('div');
      item.className = 'button-item';
      item.innerHTML = `
        <div class="btn-order-controls">
          <button class="btn-move-up" data-index="${index}" title="Monter" ${index === 0 ? 'disabled' : ''}>▲</button>
          <button class="btn-move-down" data-index="${index}" title="Descendre" ${index === customButtons.length - 1 ? 'disabled' : ''}>▼</button>
        </div>
        <input type="text" value="${escapeHtml(btn.name)}" data-field="name" data-index="${index}" placeholder="Nom">
        <input type="url" value="${escapeHtml(btn.url)}" data-field="url" data-index="${index}" placeholder="URL">
        <div class="btn-icon-preview" title="${btn.icon ? 'Emoji' : 'Favicon automatique'}">
          ${btn.icon ? btn.icon : `<img src="https://www.google.com/s2/favicons?domain=${getDomain(btn.url)}&sz=32" alt="favicon">`}
        </div>
        <button class="btn-delete" data-index="${index}" title="Supprimer">X</button>
      `;
      buttonsList.appendChild(item);
    });

    // Add event listeners for editing
    buttonsList.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;
        customButtons[index][field] = e.target.value;
        saveButtons();
        if (field === 'url') {
          renderButtons(); // Re-render to update favicon
        }
      });
    });

    // Add event listeners for delete
    buttonsList.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        customButtons.splice(index, 1);
        saveButtons();
        renderButtons();
      });
    });

    // Add event listeners for move up
    buttonsList.querySelectorAll('.btn-move-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        if (index > 0) {
          const temp = customButtons[index];
          customButtons[index] = customButtons[index - 1];
          customButtons[index - 1] = temp;
          saveButtons();
          renderButtons();
        }
      });
    });

    // Add event listeners for move down
    buttonsList.querySelectorAll('.btn-move-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        if (index < customButtons.length - 1) {
          const temp = customButtons[index];
          customButtons[index] = customButtons[index + 1];
          customButtons[index + 1] = temp;
          saveButtons();
          renderButtons();
        }
      });
    });
  }

  // Add new button (from modal)
  addButtonBtn.addEventListener('click', () => {
    const name = newBtnName.value.trim();
    const url = newBtnUrl.value.trim();
    const icon = newBtnIcon.value.trim();

    if (!name) {
      alert('Veuillez entrer un nom');
      return;
    }

    if (!url) {
      alert('Veuillez entrer une URL');
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      alert('URL invalide');
      return;
    }

    customButtons.push({ name, url, icon });
    saveButtons();
    renderButtons();

    // Clear form and close modal
    newBtnName.value = '';
    newBtnUrl.value = '';
    newBtnIcon.value = '';
    shortcutModal.classList.remove('visible');
  });

  // ========== EXPORT/IMPORT ==========
  const exportBtn = document.getElementById('btn-export');
  const importTrigger = document.getElementById('btn-import-trigger');
  const importFile = document.getElementById('import-file');
  const exportStatus = document.getElementById('export-status');

  exportBtn.addEventListener('click', async () => {
    try {
      const syncData = await chrome.storage.sync.get(null);
      const localData = await chrome.storage.local.get(['colors', 'emails']);

      const exportData = {
        version: '2.0',
        exportDate: new Date().toISOString(),
        sync: syncData,
        local: {
          colors: localData.colors,
          emails: localData.emails
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `at-toolkit-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showStatus(exportStatus, 'Reglages exportes avec succes!', 'success');
    } catch (error) {
      showStatus(exportStatus, 'Erreur lors de l\'export: ' + error.message, 'error');
    }
  });

  importTrigger.addEventListener('click', () => {
    importFile.click();
  });

  importFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.version || !data.sync) {
        throw new Error('Format de fichier invalide');
      }

      // Import sync data
      if (data.sync) {
        await chrome.storage.sync.set(data.sync);
      }

      // Import local data
      if (data.local) {
        await chrome.storage.local.set(data.local);
      }

      showStatus(exportStatus, 'Reglages importes avec succes! Rechargez la page.', 'success');

      // Reload the page to apply changes
      setTimeout(() => {
        location.reload();
      }, 1500);

    } catch (error) {
      showStatus(exportStatus, 'Erreur lors de l\'import: ' + error.message, 'error');
    }

    // Reset file input
    importFile.value = '';
  });

  // ========== GITHUB UPDATE CACHE ==========
  const forceUpdateBtn = document.getElementById('btn-force-update');
  const githubStatus = document.getElementById('github-status');

  if (forceUpdateBtn) {
    forceUpdateBtn.addEventListener('click', async () => {
      await chrome.storage.local.remove(['lastUpdateCheck', 'hasUpdate', 'remoteVersion', 'updateDismissed', 'dismissedVersion']);
      showStatus(githubStatus, 'Cache MAJ efface. Ouvrez le popup pour verifier les mises a jour.', 'success');
    });
  }

  // ========== OPENAI API KEY ==========
  const apiKeyInput = document.getElementById('api-key');
  const showApiKeyCheckbox = document.getElementById('show-api-key');
  const saveApiKeyBtn = document.getElementById('btn-save-api-key');
  const apiKeyStatus = document.getElementById('api-key-status');

  // Load API key
  chrome.storage.sync.get(['openaiApiKey'], (data) => {
    if (data.openaiApiKey) {
      apiKeyInput.value = data.openaiApiKey;
    }
  });

  showApiKeyCheckbox.addEventListener('change', () => {
    apiKeyInput.type = showApiKeyCheckbox.checked ? 'text' : 'password';
  });

  saveApiKeyBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus(apiKeyStatus, 'Veuillez entrer une cle API', 'error');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      showStatus(apiKeyStatus, 'La cle API doit commencer par "sk-"', 'error');
      return;
    }

    chrome.storage.sync.set({ openaiApiKey: apiKey }, () => {
      showStatus(apiKeyStatus, 'Cle API sauvegardee avec succes!', 'success');
    });
  });

  // ========== DING SETTINGS ==========
  const enableDingCheckbox = document.getElementById('enable-ding');
  const dingVolumeSlider = document.getElementById('ding-volume');
  const saveDingBtn = document.getElementById('btn-save-ding');
  const dingStatus = document.getElementById('ding-status');

  // Load ding settings
  chrome.storage.sync.get(['enableDing', 'dingVolume'], (data) => {
    if (typeof data.enableDing === 'boolean') {
      enableDingCheckbox.checked = data.enableDing;
    }
    if (typeof data.dingVolume === 'number') {
      dingVolumeSlider.value = data.dingVolume;
    }
  });

  saveDingBtn.addEventListener('click', () => {
    const enableDing = enableDingCheckbox.checked;
    const dingVolume = parseInt(dingVolumeSlider.value);

    chrome.storage.sync.set({ enableDing, dingVolume }, () => {
      showStatus(dingStatus, 'Parametres de notification sauvegardes!', 'success');
    });
  });

  // ========== CLEAR ALL DATA ==========
  const clearAllBtn = document.getElementById('btn-clear-all');
  const clearStatus = document.getElementById('clear-status');

  clearAllBtn.addEventListener('click', () => {
    if (confirm('Etes-vous sur de vouloir effacer toutes les donnees? Cette action est irreversible.')) {
      chrome.storage.sync.clear(() => {
        chrome.storage.local.clear(() => {
          showStatus(clearStatus, 'Toutes les donnees ont ete effacees. Rechargez la page.', 'success');
          setTimeout(() => {
            location.reload();
          }, 1500);
        });
      });
    }
  });

  // ========== UTILITY FUNCTIONS ==========
  function showStatus(element, message, type) {
    element.textContent = message;
    element.className = 'status ' + type;
    element.style.display = 'block';

    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return '';
    }
  }

  // ========== UNIFIED MODULE MANAGER (Two Columns) ==========
  const CATEGORIES_CONFIG = {
    network: { emoji: '🖥️', name: 'Reseau & Remote', tools: ['myip', 'remotedesktop', 'speedtest', 'ping', 'traceroute', 'portscan', 'dnslookup'] },
    domainDns: { emoji: '🌐', name: 'Domaine & DNS', tools: ['whois', 'dnschecker', 'mailtester', 'ssl'] },
    seoAnalysis: { emoji: '📊', name: 'SEO & Analyse', tools: ['metatags', 'links', 'images', 'sitemap', 'pagespeed', 'lighthouse', 'keywords', 'headings', 'brokenlinks', 'readability', 'robotstxt', 'schema', 'socialpreview', 'mobiletest'] },
    development: { emoji: '💻', name: 'Developpement', tools: ['resize', 'css', 'js', 'headers', 'lorem', 'fonts', 'cookies', 'mixedcontent', 'accessibility', 'loadtime', 'webvitals'] },
    social: { emoji: '📱', name: 'Social & Marketing', tools: ['charcount', 'utmbuilder', 'textdiff', 'redirect'] },
    browser: { emoji: '🌍', name: 'Navigateur', tools: ['bookmarks', 'folders', 'history', 'downloads', 'cleardata'] },
    design: { emoji: '🎨', name: 'Design & Medias', tools: ['colorpicker', 'colorconvert', 'palette', 'measure', 'gridoverlay', 'favicon'] },
    utilities: { emoji: '🛠️', name: 'Utilitaires', tools: ['desktop', 'qrcode', 'emails', 'speech', 'translate', 'notes', 'pomodoro', 'jsonformat', 'base64', 'hashgen', 'urlencoder', 'passwordgen', 'regex', 'wordcount'] }
  };

  const TOOLS_CONFIG = {
    myip: '🌐 Mon IP', remotedesktop: '🖥️ Remote Desktop', speedtest: '⚡ Speed Test', ping: '📡 Ping', traceroute: '🔀 Traceroute', portscan: '🔌 Port Scan', dnslookup: '🔍 DNS Lookup',
    whois: '🔍 Whois', dnschecker: '🌐 DNS Checker', mailtester: '✉️ Mail Tester', ssl: '🔒 SSL/TLS',
    metatags: '🏷️ Meta Tags', links: '🔗 Liens', images: '🖼️ Images', sitemap: '🗺️ Sitemap', pagespeed: '⚡ PageSpeed', lighthouse: '🔦 Lighthouse', keywords: '🔑 Mots-cles', headings: '📑 Titres H1-H6', brokenlinks: '🔗 Liens casses', readability: '📖 Lisibilite', robotstxt: '🤖 robots.txt', schema: '📋 Schema.org', socialpreview: '📱 Apercu social', mobiletest: '📱 Test Mobile',
    resize: '📐 Resize', css: '🎭 CSS Injection', js: '⚡ JS Injection', headers: '📋 Headers', lorem: '📝 Lorem Ipsum', fonts: '🔤 Fonts', cookies: '🍪 Cookies', mixedcontent: '🔀 Mixed Content', accessibility: '♿ Accessibilite', loadtime: '⏱️ Temps de chargement', webvitals: '📊 Web Vitals',
    charcount: '🔢 Compteur caracteres', utmbuilder: '🏷️ UTM Builder', textdiff: '📝 Comparateur texte', redirect: '↪️ Redirect Checker',
    bookmarks: '⭐ Favoris', folders: '📁 Dossiers', history: '🕐 Historique', downloads: '📥 Downloads', cleardata: '🧹 Clear Data',
    colorpicker: '🎨 Color Picker', colorconvert: '🔄 Convertisseur couleurs', palette: '🎨 Palette', measure: '📏 Mesure', gridoverlay: '📐 Grille overlay', favicon: '🖼️ Favicon',
    desktop: '🖥️ Raccourci Bureau', qrcode: '📱 QR Code', emails: '📧 Emails', speech: '🔊 Synthese Vocale', translate: '🌍 Traducteur', notes: '📝 Notes', pomodoro: '🍅 Pomodoro', jsonformat: '📋 JSON Format', base64: '🔐 Base64', hashgen: '🔒 Hash Gen', urlencoder: '🔗 URL Encoder', passwordgen: '🔑 Password Gen', regex: '🔍 Regex', wordcount: '📊 Compteur mots'
  };

  const DEFAULT_CATEGORY_ORDER = ['network', 'domainDns', 'seoAnalysis', 'development', 'social', 'browser', 'design', 'utilities'];

  // State
  let enabledModules = {}; // { toolId: true/false }
  let categoryOrder = [...DEFAULT_CATEGORY_ORDER];
  let toolOrder = {}; // { catId: [toolId, ...] }
  let customCategories = {}; // { catId: { name, emoji } }
  let toolAssignment = {}; // { toolId: catId } - for tools moved to different categories

  // Initialize default tool order
  Object.keys(CATEGORIES_CONFIG).forEach(cat => {
    toolOrder[cat] = [...CATEGORIES_CONFIG[cat].tools];
  });

  // Initialize all modules as enabled by default
  Object.keys(TOOLS_CONFIG).forEach(toolId => {
    enabledModules[toolId] = true;
  });

  // Load saved state
  chrome.storage.sync.get(['enabledModules', 'categoryOrder', 'toolOrder', 'customCategories', 'toolAssignment'], (data) => {
    if (data.enabledModules) {
      enabledModules = { ...enabledModules, ...data.enabledModules };
    }
    if (data.categoryOrder && Array.isArray(data.categoryOrder)) {
      categoryOrder = data.categoryOrder;
    }
    if (data.toolOrder && typeof data.toolOrder === 'object') {
      toolOrder = { ...toolOrder, ...data.toolOrder };
    }
    if (data.customCategories) {
      customCategories = data.customCategories;
    }
    if (data.toolAssignment) {
      toolAssignment = data.toolAssignment;
    }
    renderModuleManager();
  });

  // Drag state
  let draggedCategory = null;
  let draggedTool = null;
  let draggedToolCategory = null;

  function clearDropIndicators() {
    document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
      el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  // Get category info (handles both default and custom categories)
  function getCategoryInfo(catId) {
    if (CATEGORIES_CONFIG[catId]) {
      return CATEGORIES_CONFIG[catId];
    }
    if (customCategories[catId]) {
      return { ...customCategories[catId], tools: [] };
    }
    return null;
  }

  // Get tools for a category (considers tool assignments)
  function getToolsForCategory(catId) {
    const baseTools = toolOrder[catId] || [];
    return baseTools.filter(toolId => {
      const assignedCat = toolAssignment[toolId];
      return !assignedCat || assignedCat === catId;
    });
  }

  // Get tool display info
  function getToolInfo(toolId) {
    const fullName = TOOLS_CONFIG[toolId] || toolId;
    const parts = fullName.split(' ');
    const emoji = parts[0];
    const name = parts.slice(1).join(' ');
    return { emoji, name, fullName };
  }

  // Check if category has any enabled tools
  function categoryHasEnabledTools(catId) {
    const tools = getToolsForCategory(catId);
    return tools.some(toolId => enabledModules[toolId]);
  }

  // Check if category has any disabled tools
  function categoryHasDisabledTools(catId) {
    const tools = getToolsForCategory(catId);
    return tools.some(toolId => !enabledModules[toolId]);
  }

  // Render the module manager
  function renderModuleManager() {
    renderAvailableColumn();
    renderActiveColumn();
  }

  // Render left column (available/disabled modules)
  function renderAvailableColumn() {
    const container = document.getElementById('available-modules');
    if (!container) return;

    container.innerHTML = '';

    // Get categories that have at least one disabled tool
    const availableCategories = categoryOrder.filter(catId => {
      const cat = getCategoryInfo(catId);
      if (!cat) return false;
      return categoryHasDisabledTools(catId);
    });

    if (availableCategories.length === 0) {
      container.innerHTML = '<div class="empty-message">Tous les modules sont actifs</div>';
      return;
    }

    availableCategories.forEach(catId => {
      const cat = getCategoryInfo(catId);
      if (!cat) return;

      const tools = getToolsForCategory(catId).filter(t => !enabledModules[t]);
      if (tools.length === 0) return;

      const catEl = document.createElement('div');
      catEl.className = 'mm-category';
      catEl.dataset.category = catId;

      catEl.innerHTML = `
        <div class="mm-category-header">
          <span class="mm-category-icon">${cat.emoji}</span>
          <span class="mm-category-name">${cat.name}</span>
          <span class="mm-category-count">${tools.length}</span>
          <div class="mm-category-actions">
            <button class="mm-btn-activate" data-action="activate-cat">Activer tout</button>
          </div>
          <span class="mm-category-toggle">▼</span>
        </div>
        <div class="mm-tools">
          ${tools.map(toolId => {
            const tool = getToolInfo(toolId);
            return `
              <div class="mm-tool" data-tool="${toolId}">
                <span class="mm-tool-icon">${tool.emoji}</span>
                <span class="mm-tool-name">${tool.name}</span>
                <button class="mm-tool-action activate" data-action="activate">→</button>
              </div>
            `;
          }).join('')}
        </div>
      `;

      // Toggle expand/collapse
      const header = catEl.querySelector('.mm-category-header');
      const toggle = catEl.querySelector('.mm-category-toggle');
      header.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        catEl.classList.toggle('expanded');
      });

      // Activate all tools in category
      catEl.querySelector('[data-action="activate-cat"]').addEventListener('click', (e) => {
        e.stopPropagation();
        tools.forEach(toolId => enabledModules[toolId] = true);
        renderModuleManager();
      });

      // Activate individual tools
      catEl.querySelectorAll('[data-action="activate"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const toolEl = btn.closest('.mm-tool');
          const toolId = toolEl.dataset.tool;
          enabledModules[toolId] = true;
          renderModuleManager();
        });
      });

      container.appendChild(catEl);
    });
  }

  // Render right column (active modules with drag & drop)
  function renderActiveColumn() {
    const container = document.getElementById('active-modules');
    if (!container) return;

    container.innerHTML = '';

    // Get categories that have at least one enabled tool
    const activeCategories = categoryOrder.filter(catId => {
      const cat = getCategoryInfo(catId);
      if (!cat) return false;
      return categoryHasEnabledTools(catId);
    });

    // Also include custom categories
    Object.keys(customCategories).forEach(catId => {
      if (!activeCategories.includes(catId)) {
        activeCategories.push(catId);
      }
    });

    if (activeCategories.length === 0) {
      container.innerHTML = '<div class="empty-message">Aucun module actif</div>';
      return;
    }

    activeCategories.forEach(catId => {
      const cat = getCategoryInfo(catId);
      if (!cat) return;

      const tools = getToolsForCategory(catId).filter(t => enabledModules[t]);
      const isCustom = !!customCategories[catId];

      const catEl = document.createElement('div');
      catEl.className = 'mm-category' + (isCustom ? ' custom' : '');
      catEl.dataset.category = catId;

      catEl.innerHTML = `
        <div class="mm-category-header" draggable="true">
          <span class="mm-drag-handle">☰</span>
          <span class="mm-category-icon">${cat.emoji}</span>
          <span class="mm-category-name">${cat.name}</span>
          <span class="mm-category-count">${tools.length}</span>
          <div class="mm-category-actions">
            ${isCustom ? `<button class="mm-btn-edit" data-action="edit-cat">✏️</button>` : ''}
            ${isCustom ? `<button class="mm-btn-delete" data-action="delete-cat">🗑️</button>` : ''}
            <button class="mm-btn-deactivate" data-action="deactivate-cat">← Retirer</button>
          </div>
          <span class="mm-category-toggle">▼</span>
        </div>
        <div class="mm-tools">
          ${tools.map(toolId => {
            const tool = getToolInfo(toolId);
            return `
              <div class="mm-tool" data-tool="${toolId}" data-cat="${catId}" draggable="true">
                <span class="mm-drag-handle">☰</span>
                <span class="mm-tool-icon">${tool.emoji}</span>
                <span class="mm-tool-name">${tool.name}</span>
                <button class="mm-tool-action deactivate" data-action="deactivate">←</button>
              </div>
            `;
          }).join('')}
        </div>
      `;

      // Toggle expand/collapse
      const header = catEl.querySelector('.mm-category-header');
      header.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.classList.contains('mm-drag-handle')) return;
        catEl.classList.toggle('expanded');
      });

      // Deactivate all tools in category
      const deactivateBtn = catEl.querySelector('[data-action="deactivate-cat"]');
      if (deactivateBtn) {
        deactivateBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          tools.forEach(toolId => enabledModules[toolId] = false);
          renderModuleManager();
        });
      }

      // Delete custom category
      const deleteBtn = catEl.querySelector('[data-action="delete-cat"]');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('Supprimer cette categorie?')) {
            delete customCategories[catId];
            categoryOrder = categoryOrder.filter(c => c !== catId);
            // Move tools back to original categories
            Object.keys(toolAssignment).forEach(toolId => {
              if (toolAssignment[toolId] === catId) {
                delete toolAssignment[toolId];
              }
            });
            delete toolOrder[catId];
            renderModuleManager();
          }
        });
      }

      // Deactivate individual tools
      catEl.querySelectorAll('[data-action="deactivate"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const toolEl = btn.closest('.mm-tool');
          const toolId = toolEl.dataset.tool;
          enabledModules[toolId] = false;
          renderModuleManager();
        });
      });

      // ========== DRAG & DROP FOR CATEGORIES ==========
      header.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        draggedCategory = catId;
        draggedTool = null;
        catEl.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'category:' + catId);
      });

      header.addEventListener('dragend', () => {
        catEl.classList.remove('dragging');
        draggedCategory = null;
        clearDropIndicators();
      });

      catEl.addEventListener('dragover', (e) => {
        // Handle category drag
        if (draggedCategory && draggedCategory !== catId) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';

          const rect = catEl.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          const isTop = e.clientY < midY;

          clearDropIndicators();
          catEl.classList.add(isTop ? 'drag-over-top' : 'drag-over-bottom');
          return;
        }

        // Handle tool drag to different category (move tool)
        if (draggedTool && draggedToolCategory !== catId) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          clearDropIndicators();
          catEl.classList.add('drag-over-bottom');
        }
      });

      catEl.addEventListener('dragleave', (e) => {
        if (!catEl.contains(e.relatedTarget)) {
          catEl.classList.remove('drag-over-top', 'drag-over-bottom');
        }
      });

      catEl.addEventListener('drop', (e) => {
        // Handle tool drop on different category (move tool)
        if (draggedTool && draggedToolCategory !== catId) {
          e.preventDefault();
          clearDropIndicators();

          // Remove from source category
          const sourceTools = toolOrder[draggedToolCategory] || [];
          const fromIndex = sourceTools.indexOf(draggedTool);
          if (fromIndex !== -1) {
            sourceTools.splice(fromIndex, 1);
            toolOrder[draggedToolCategory] = sourceTools;
          }

          // Add to target category
          if (!toolOrder[catId]) toolOrder[catId] = [];
          toolOrder[catId].push(draggedTool);

          // Update tool assignment
          toolAssignment[draggedTool] = catId;

          renderModuleManager();
          setTimeout(() => {
            document.querySelector(`#active-modules [data-category="${catId}"]`)?.classList.add('expanded');
          }, 0);
          return;
        }

        // Handle category drop
        if (!draggedCategory || draggedCategory === catId) return;
        e.preventDefault();

        const rect = catEl.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const insertAfter = e.clientY >= midY;

        clearDropIndicators();

        const fromIndex = categoryOrder.indexOf(draggedCategory);
        let toIndex = categoryOrder.indexOf(catId);

        if (fromIndex !== -1 && toIndex !== -1) {
          categoryOrder.splice(fromIndex, 1);
          if (fromIndex < toIndex) toIndex--;
          if (insertAfter) toIndex++;
          categoryOrder.splice(toIndex, 0, draggedCategory);
          renderModuleManager();
        }
      });

      // ========== DRAG & DROP FOR TOOLS ==========
      catEl.querySelectorAll('.mm-tool').forEach(toolEl => {
        const toolId = toolEl.dataset.tool;

        toolEl.addEventListener('dragstart', (e) => {
          e.stopPropagation();
          draggedTool = toolId;
          draggedToolCategory = catId;
          draggedCategory = null;
          toolEl.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', 'tool:' + toolId);
        });

        toolEl.addEventListener('dragend', () => {
          toolEl.classList.remove('dragging');
          draggedTool = null;
          draggedToolCategory = null;
          clearDropIndicators();
        });

        toolEl.addEventListener('dragover', (e) => {
          if (!draggedTool || draggedTool === toolId) return;
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'move';

          const rect = toolEl.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          const isTop = e.clientY < midY;

          clearDropIndicators();
          toolEl.classList.add(isTop ? 'drag-over-top' : 'drag-over-bottom');
        });

        toolEl.addEventListener('dragleave', () => {
          toolEl.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        toolEl.addEventListener('drop', (e) => {
          if (!draggedTool || draggedTool === toolId) return;
          e.preventDefault();
          e.stopPropagation();

          const rect = toolEl.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          const insertAfter = e.clientY >= midY;

          clearDropIndicators();

          // Check if moving from different category
          if (draggedToolCategory !== catId) {
            // Remove from source category
            const sourceTools = toolOrder[draggedToolCategory] || [];
            const fromIndex = sourceTools.indexOf(draggedTool);
            if (fromIndex !== -1) {
              sourceTools.splice(fromIndex, 1);
              toolOrder[draggedToolCategory] = sourceTools;
            }

            // Add to target category at specific position
            const targetTools = toolOrder[catId] || [];
            let toIndex = targetTools.indexOf(toolId);
            if (insertAfter) toIndex++;
            targetTools.splice(toIndex, 0, draggedTool);
            toolOrder[catId] = targetTools;

            // Update tool assignment
            toolAssignment[draggedTool] = catId;

            renderModuleManager();
            setTimeout(() => {
              document.querySelector(`#active-modules [data-category="${catId}"]`)?.classList.add('expanded');
            }, 0);
            return;
          }

          // Same category reorder
          const tools = toolOrder[catId] || [];
          const fromIndex = tools.indexOf(draggedTool);
          let toIndex = tools.indexOf(toolId);

          if (fromIndex !== -1 && toIndex !== -1) {
            tools.splice(fromIndex, 1);
            if (fromIndex < toIndex) toIndex--;
            if (insertAfter) toIndex++;
            tools.splice(toIndex, 0, draggedTool);
            toolOrder[catId] = tools;

            renderModuleManager();
            setTimeout(() => {
              document.querySelector(`#active-modules [data-category="${catId}"]`)?.classList.add('expanded');
            }, 0);
          }
        });
      });

      container.appendChild(catEl);
    });
  }

  // ========== HEADER BUTTONS ==========
  const activateAllBtn = document.getElementById('btn-activate-all');
  const deactivateAllBtn = document.getElementById('btn-deactivate-all');
  const newCategoryBtn = document.getElementById('btn-new-category');
  const saveModulesBtn = document.getElementById('btn-save-modules');
  const resetModulesBtn = document.getElementById('btn-reset-modules');
  const modulesStatus = document.getElementById('modules-status');

  if (activateAllBtn) {
    activateAllBtn.addEventListener('click', () => {
      Object.keys(TOOLS_CONFIG).forEach(toolId => enabledModules[toolId] = true);
      renderModuleManager();
    });
  }

  if (deactivateAllBtn) {
    deactivateAllBtn.addEventListener('click', () => {
      Object.keys(enabledModules).forEach(toolId => enabledModules[toolId] = false);
      renderModuleManager();
    });
  }

  if (saveModulesBtn) {
    saveModulesBtn.addEventListener('click', () => {
      chrome.storage.sync.set({
        enabledModules,
        categoryOrder,
        toolOrder,
        customCategories,
        toolAssignment
      }, () => {
        showStatus(modulesStatus, 'Configuration sauvegardee! Rechargez le popup.', 'success');
      });
    });
  }

  if (resetModulesBtn) {
    resetModulesBtn.addEventListener('click', () => {
      if (!confirm('Reinitialiser tous les modules et categories?')) return;

      enabledModules = {};
      Object.keys(TOOLS_CONFIG).forEach(toolId => enabledModules[toolId] = true);
      categoryOrder = [...DEFAULT_CATEGORY_ORDER];
      toolOrder = {};
      Object.keys(CATEGORIES_CONFIG).forEach(cat => {
        toolOrder[cat] = [...CATEGORIES_CONFIG[cat].tools];
      });
      customCategories = {};
      toolAssignment = {};

      chrome.storage.sync.remove(['enabledModules', 'categoryOrder', 'toolOrder', 'customCategories', 'toolAssignment'], () => {
        renderModuleManager();
        showStatus(modulesStatus, 'Configuration reinitialisee!', 'success');
      });
    });
  }

  // ========== CUSTOM CATEGORY MODAL ==========
  const categoryModal = document.getElementById('category-modal');
  const newCatNameInput = document.getElementById('new-cat-name');
  const newCatEmojiInput = document.getElementById('new-cat-emoji');
  const cancelCategoryBtn = document.getElementById('btn-cancel-category');
  const createCategoryBtn = document.getElementById('btn-create-category');
  const catEmojiPicker = document.getElementById('cat-emoji-picker');
  const catEmojiPickerBtn = document.getElementById('btn-cat-emoji-picker');

  // Initialize category emoji picker
  if (catEmojiPicker && newCatEmojiInput) {
    initEmojiPicker(catEmojiPicker, newCatEmojiInput, catEmojiPickerBtn);
  }

  if (catEmojiPickerBtn) {
    catEmojiPickerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      catEmojiPicker.classList.toggle('show');
    });
  }

  // Close category emoji picker when clicking outside
  document.addEventListener('click', (e) => {
    if (catEmojiPicker && !catEmojiPicker.contains(e.target) && e.target !== catEmojiPickerBtn) {
      catEmojiPicker.classList.remove('show');
    }
  });

  if (newCategoryBtn) {
    newCategoryBtn.addEventListener('click', () => {
      newCatNameInput.value = '';
      newCatEmojiInput.value = '📁';
      categoryModal.classList.add('visible');
      newCatNameInput.focus();
    });
  }

  if (cancelCategoryBtn) {
    cancelCategoryBtn.addEventListener('click', () => {
      categoryModal.classList.remove('visible');
      catEmojiPicker.classList.remove('show');
    });
  }

  if (createCategoryBtn) {
    createCategoryBtn.addEventListener('click', () => {
      const name = newCatNameInput.value.trim();
      const emoji = newCatEmojiInput.value.trim() || '📁';

      if (!name) {
        alert('Veuillez entrer un nom pour la categorie');
        return;
      }

      const catId = 'custom_' + Date.now();
      customCategories[catId] = { name, emoji };
      categoryOrder.push(catId);
      toolOrder[catId] = [];

      categoryModal.classList.remove('visible');
      catEmojiPicker.classList.remove('show');
      renderModuleManager();
    });
  }

  // Close modal on overlay click
  if (categoryModal) {
    categoryModal.addEventListener('click', (e) => {
      if (e.target === categoryModal) {
        categoryModal.classList.remove('visible');
      }
    });
  }
});
