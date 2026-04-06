// =============================
// gulimi: локальный псевдо-ИИ
// =============================

const STORAGE_KEYS = {
  chat: "gulimi_chat_history",
  theme: "gulimi_theme",
  memory: "gulimi_memory",
};

const ui = {
  body: document.body,
  chatWrap: document.getElementById("chatWrap"),
  chatForm: document.getElementById("chatForm"),
  messageInput: document.getElementById("messageInput"),
  themeBtn: document.getElementById("themeBtn"),
  newChatBtn: document.getElementById("newChatBtn"),
};

const state = {
  userName: "",
  history: [],
  recentUserMessages: [],
  theme: "light",
};

const dictionary = {
  greetings: ["привет", "здравствуй", "hello", "hi", "добрый", "салют"],
  aboutName: ["как меня зовут", "моё имя", "мое имя", "кто я", "помнишь имя"],
  saveName: ["меня зовут", "я ", "называй меня"],
  mood: ["как дела", "как ты", "что нового"],
  thanks: ["спасибо", "благодарю", "круто"],
  story: ["историю", "история", "рассказ", "придумай сюжет"],
  ideas: ["идею", "идеи", "придумай идею", "стартап", "проект"],
};

const responses = {
  fallback: [
    "Я пока учусь и не до конца понял запрос. Попробуй уточнить — я адаптируюсь.",
    "Хороший вопрос. Я ещё в процессе обучения, но могу помочь, если переформулируешь чуть точнее.",
    "Похоже, мне не хватило контекста. Добавь деталей, и gulimi ответит лучше.",
  ],
  greet: [
    "Привет! Я gulimi — локальный ИИ без API, но с характером 😎",
    "Здравствуйте! gulimi на связи. Готов общаться и генерировать идеи.",
    "Привет-привет! Я gulimi. Давайте сделаем что-то полезное.",
  ],
  mood: [
    "Отлично! Мой виртуальный процессор в хорошем настроении ⚡",
    "Работаю стабильно и рад помочь. Чем займёмся?",
    "Я в форме: анализирую, генерирую и поддерживаю беседу.",
  ],
  thanks: ["Всегда пожалуйста!", "Рад помочь 💚", "Обращайся, я рядом."],
};

// ---------- Инициализация ----------
function init() {
  loadTheme();
  loadMemory();
  loadChat();
  bindEvents();

  if (state.history.length === 0) {
    addBotMessage(
      "Привет! Я **gulimi** — имитация ИИ на локальной логике. Напиши /help, чтобы увидеть команды."
    );
  }
}

function bindEvents() {
  ui.chatForm.addEventListener("submit", handleSubmit);
  ui.themeBtn.addEventListener("click", toggleTheme);
  ui.newChatBtn.addEventListener("click", resetChat);
}

// ---------- Работа с localStorage ----------
function saveTheme() {
  localStorage.setItem(STORAGE_KEYS.theme, state.theme);
}

function loadTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  state.theme = savedTheme === "dark" ? "dark" : "light";
  ui.body.classList.toggle("dark", state.theme === "dark");
}

function saveMemory() {
  localStorage.setItem(
    STORAGE_KEYS.memory,
    JSON.stringify({
      userName: state.userName,
      recentUserMessages: state.recentUserMessages,
    })
  );
}

function loadMemory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.memory);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    state.userName = parsed.userName || "";
    state.recentUserMessages = Array.isArray(parsed.recentUserMessages)
      ? parsed.recentUserMessages.slice(-8)
      : [];
  } catch {
    state.userName = "";
    state.recentUserMessages = [];
  }
}

function saveChat() {
  localStorage.setItem(STORAGE_KEYS.chat, JSON.stringify(state.history));
}

function loadChat() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.chat);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    state.history = parsed;
    parsed.forEach((item) => renderMessage(item.role, item.text, item.time));
    scrollToBottom();
  } catch {
    state.history = [];
  }
}

// ---------- UI helper ----------
function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderMessage(role, text, time = nowTime()) {
  const box = document.createElement("article");
  box.className = `message ${role}`;

  const content = document.createElement("div");
  content.textContent = text;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `${role === "user" ? "Вы" : "gulimi"} • ${time}`;

  box.append(content, meta);
  ui.chatWrap.appendChild(box);
  scrollToBottom();
}

function addUserMessage(text) {
  const item = { role: "user", text, time: nowTime() };
  state.history.push(item);
  renderMessage(item.role, item.text, item.time);
  saveChat();
}

function addBotMessage(text) {
  const item = { role: "bot", text, time: nowTime() };
  state.history.push(item);
  renderMessage(item.role, item.text, item.time);
  saveChat();
}

function scrollToBottom() {
  ui.chatWrap.scrollTop = ui.chatWrap.scrollHeight;
}

function showTyping() {
  const typing = document.createElement("article");
  typing.className = "message bot";
  typing.id = "typingIndicator";

  typing.innerHTML = `
    <div class="typing" aria-label="gulimi печатает">
      <span>gulimi печатает</span>
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    </div>
  `;

  ui.chatWrap.appendChild(typing);
  scrollToBottom();
}

function hideTyping() {
  const typing = document.getElementById("typingIndicator");
  if (typing) typing.remove();
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  ui.body.classList.toggle("dark", state.theme === "dark");
  ui.themeBtn.textContent = state.theme === "dark" ? "☀️ Тема" : "🌙 Тема";
  saveTheme();
}

function resetChat() {
  state.history = [];
  ui.chatWrap.innerHTML = "";
  saveChat();
  addBotMessage("Новый чат начат. Я gulimi и снова готов к работе.");
}

// ---------- Логика команд ----------
function getHelpText() {
  return [
    "Доступные команды:",
    "/help — список команд",
    "/clear — очистить чат",
    "/theme — переключить тему",
    "",
    "Подсказки:",
    "• Напиши: 'меня зовут Анна' — я запомню имя",
    "• Напиши: 'придумай идею' или 'придумай историю'",
  ].join("\n");
}

function handleCommand(input) {
  switch (input.trim()) {
    case "/help":
      return getHelpText();
    case "/clear":
      resetChat();
      return null;
    case "/theme":
      toggleTheme();
      return `Готово. Текущая тема: ${state.theme === "dark" ? "тёмная" : "светлая"}.`;
    default:
      return "Неизвестная команда. Введите /help для списка команд.";
  }
}

// ---------- Псевдо-ИИ ----------
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalize(text) {
  return text.trim().toLowerCase();
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function extractName(text) {
  const patterns = [
    /меня зовут\s+([а-яa-zё\-]{2,30})/i,
    /называй меня\s+([а-яa-zё\-]{2,30})/i,
    /я\s+([а-яa-zё\-]{2,30})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    }
  }

  return "";
}

function generateStory(seed) {
  const heroes = ["разработчик", "дизайнер", "студент", "предприниматель", "музыкант"];
  const places = ["в цифровом городе", "на орбитальной станции", "в тихом приморском городе"];
  const twists = [
    "нашёл старый ноутбук с необычным ассистентом",
    "получил сообщение из будущего",
    "создал проект, который объединил тысячи людей",
  ];

  const h = pickRandom(heroes);
  const p = pickRandom(places);
  const t = pickRandom(twists);

  return `Мини-история от gulimi: Однажды ${h} ${p} ${t}. Всё началось с фразы «${seed.slice(
    0,
    30
  )}...». Это изменило его путь и открыло новую главу.`;
}

function generateIdea() {
  const domains = ["образование", "здоровье", "продуктивность", "контент", "финансы"];
  const formats = ["мобильное приложение", "веб-сервис", "бот-помощник", "мини-SaaS"];
  const features = [
    "персональные рекомендации",
    "геймификацию привычек",
    "ежедневные микро-цели",
    "умные напоминания",
  ];

  return `Идея от gulimi: ${pickRandom(formats)} в сфере ${pickRandom(
    domains
  )}, который предлагает ${pickRandom(features)} и помогает пользователю видеть прогресс каждую неделю.`;
}

function composeReply(inputRaw) {
  const input = normalize(inputRaw);

  if (input.startsWith("/")) {
    return handleCommand(inputRaw);
  }

  state.recentUserMessages.push(inputRaw);
  state.recentUserMessages = state.recentUserMessages.slice(-8);

  const maybeName = extractName(inputRaw);
  if (maybeName && includesAny(input, dictionary.saveName)) {
    state.userName = maybeName;
    saveMemory();
    return `Приятно познакомиться, ${state.userName}! Я запомнил ваше имя.`;
  }

  if (includesAny(input, dictionary.aboutName)) {
    if (state.userName) {
      return `Конечно, вас зовут ${state.userName}. Я это помню.`;
    }
    return "Пока не знаю вашего имени. Напишите: 'меня зовут ...'";
  }

  if (includesAny(input, dictionary.greetings)) {
    return pickRandom(responses.greet) + (state.userName ? ` Рад вас видеть, ${state.userName}.` : "");
  }

  if (includesAny(input, dictionary.mood)) {
    return pickRandom(responses.mood);
  }

  if (includesAny(input, dictionary.thanks)) {
    return pickRandom(responses.thanks);
  }

  if (includesAny(input, dictionary.story)) {
    return generateStory(inputRaw);
  }

  if (includesAny(input, dictionary.ideas)) {
    return generateIdea();
  }

  // Демонстрация "памяти последних сообщений"
  if (input.includes("что я писал") || input.includes("последние сообщения")) {
    if (state.recentUserMessages.length === 0) {
      return "Пока не накопил сообщения в памяти.";
    }

    const recent = state.recentUserMessages.slice(-3).join(" | ");
    return `Я помню ваши последние сообщения: ${recent}`;
  }

  return pickRandom(responses.fallback);
}

// ---------- Обработка отправки ----------
async function handleSubmit(event) {
  event.preventDefault();

  const text = ui.messageInput.value.trim();
  if (!text) return;

  addUserMessage(text);
  ui.messageInput.value = "";

  // Сохранение памяти после каждого пользовательского сообщения
  saveMemory();

  const reply = composeReply(text);
  if (reply === null) return;

  // Имитация "мышления" и печати
  showTyping();
  const thinkingDelay = 700 + Math.floor(Math.random() * 1200);

  await new Promise((resolve) => setTimeout(resolve, thinkingDelay));
  hideTyping();
  addBotMessage(reply);
  saveMemory();
}

init();

