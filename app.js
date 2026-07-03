const keywordSets = {
  smalltalk: {
    label: "스몰토크",
    colors: ["#f28796", "#83ddd2", "#ffd866", "#f7c4b8", "#ffffff", "#25b7ad"],
    items: ["급식", "시험 전날 밤", "용돈", "스마트폰", "최애와 덕질", "부모님과 다툰 날", "쉬는 시간", "요즘 빠진 것"]
  },
  school: {
    label: "학교",
    colors: ["#83ddd2", "#ffffff", "#f28796", "#ffd866", "#25b7ad", "#f7c4b8"],
    items: ["단짝", "대회", "수학여행", "동아리", "선생님", "반 분위기", "방학", "학교 축제"]
  },
  study: {
    label: "공부",
    colors: ["#ffd866", "#f28796", "#ffffff", "#83ddd2", "#f7c4b8", "#25b7ad"],
    items: ["공부법", "학원과 야자", "벼락치기", "성적", "못하는 과목", "수행평가", "슬럼프", "시간관리"]
  },
  mind: {
    label: "마음",
    colors: ["#25b7ad", "#f7c4b8", "#ffffff", "#f28796", "#83ddd2", "#ffd866"],
    items: ["마음 상태", "집중력", "흑역사", "인간관계", "기분", "자존감", "스트레스", "실패와 회복"]
  },
  career: {
    label: "진로",
    colors: ["#f28796", "#83ddd2", "#ffd866", "#f7c4b8", "#ffffff", "#25b7ad"],
    items: ["궁금한 산업", "직업 전망", "희망 직업", "진학", "입시 준비", "자격증", "대외활동", "진로 고민이 시작된 순간"]
  }
};

const canvas = document.querySelector("#wheelCanvas");
const ctx = canvas.getContext("2d");
const categoryBar = document.querySelector("#categoryBar");
const spinButton = document.querySelector("#spinButton");
const resultKeyword = document.querySelector("#resultKeyword");
const currentSetLabel = document.querySelector("#currentSetLabel");
const timerDisplay = document.querySelector("#timerDisplay");
const timerToggle = document.querySelector("#timerToggle");
const timerInput = document.querySelector("#timerInput");
const timerReset = document.querySelector("#timerReset");
const fullscreenButton = document.querySelector("#fullscreenButton");

let currentSetKey = "smalltalk";
let currentItems = keywordSets[currentSetKey].items;
let currentRotation = 0;
let spinning = false;
let timerSeconds = 45;
let timerInitial = 45;
let timerId = null;

function readTimerInput(fallback = 45) {
  const seconds = Number(timerInput.value);
  if (!Number.isFinite(seconds) || seconds < 1) return fallback;
  return Math.min(999, Math.round(seconds));
}

function syncTimerFromInput() {
  const seconds = readTimerInput(timerInitial || 45);
  timerInput.value = String(seconds);
  setTimer(seconds);
}

function renderCategories() {
  categoryBar.innerHTML = "";
  Object.entries(keywordSets).forEach(([key, set]) => {
    const button = document.createElement("button");
    button.className = "category-button";
    button.type = "button";
    button.dataset.set = key;
    button.textContent = set.label;
    button.addEventListener("click", () => setCategory(key));
    categoryBar.appendChild(button);
  });

  const allButton = document.createElement("button");
  allButton.className = "category-button";
  allButton.type = "button";
  allButton.dataset.set = "all";
  allButton.textContent = "전체";
  allButton.addEventListener("click", () => setCategory("all"));
  categoryBar.appendChild(allButton);
}

function setCategory(key) {
  currentSetKey = key;
  currentItems = key === "all"
    ? Object.values(keywordSets).flatMap((set) => set.items)
    : keywordSets[key].items;
  const arc = (Math.PI * 2) / currentItems.length;
  currentRotation = Math.PI / 2 - arc / 2;

  [...categoryBar.querySelectorAll(".category-button")].forEach((button) => {
    button.classList.toggle("is-active", button.dataset.set === key);
  });

  currentSetLabel.textContent = key === "all" ? "전체" : keywordSets[key].label;
  showItem(currentItems[0]);
  drawWheel();
}

function getActiveColors() {
  if (currentSetKey === "all") {
    return ["#f28796", "#83ddd2", "#ffd866", "#ffffff", "#f7c4b8", "#25b7ad"];
  }
  return keywordSets[currentSetKey].colors;
}

function drawWheel() {
  const items = currentItems.length ? currentItems : ["키워드"];
  const colors = getActiveColors();
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.455;
  const innerRadius = size * 0.14;
  const arc = (Math.PI * 2) / items.length;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(currentRotation);

  items.forEach((label, index) => {
    const start = index * arc - Math.PI / 2;
    const end = start + arc;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + arc / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#0d0d0f";
    ctx.font = "900 42px Paperlogy, Malgun Gothic, sans-serif";

    const lines = splitLabel(label);
    lines.forEach((line, lineIndex) => {
      ctx.fillText(line, radius - 48, (lineIndex - (lines.length - 1) / 2) * 46);
    });
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0d0d0f";
  ctx.fill();
  ctx.lineWidth = 12;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 62px Paperlogy, Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("KIT", 0, -14);
  ctx.font = "900 26px Paperlogy, Malgun Gothic, sans-serif";
  ctx.fillText("ROULETTE", 0, 38);
  ctx.restore();
}

function splitLabel(label) {
  if (label.length <= 5) return [label];
  if (label.includes(" ")) return label.split(" ").slice(0, 2);
  if (label.includes("와")) return label.replace("와", "와\n").split("\n").slice(0, 2);
  const mid = Math.ceil(label.length / 2);
  return [label.slice(0, mid), label.slice(mid)];
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function normalizeRotation(value) {
  const tau = Math.PI * 2;
  return ((value % tau) + tau) % tau;
}

function spin() {
  if (spinning || !currentItems.length) return;
  spinning = true;
  spinButton.disabled = true;

  const itemCount = currentItems.length;
  const selectedIndex = Math.floor(Math.random() * itemCount);
  const arc = (Math.PI * 2) / itemCount;
  const rounds = 5 + Math.floor(Math.random() * 3);
  const base = normalizeRotation(currentRotation);
  let target = rounds * Math.PI * 2 - selectedIndex * arc + Math.PI / 2 - arc / 2;
  while (target < base + Math.PI * 6) target += Math.PI * 2;

  const start = currentRotation;
  const change = target - start;
  const duration = 4200;
  const startedAt = performance.now();

  function frame(now) {
    const t = Math.min(1, (now - startedAt) / duration);
    currentRotation = start + change * easeOutCubic(t);
    drawWheel();
    if (t < 1) {
      requestAnimationFrame(frame);
      return;
    }

    currentRotation = target;
    spinning = false;
    spinButton.disabled = false;
    showItem(currentItems[selectedIndex]);
  }

  requestAnimationFrame(frame);
}

function showItem(item) {
  resultKeyword.textContent = item || "키워드";
}

function setTimer(seconds) {
  const normalizedSeconds = Math.min(999, Math.max(1, Math.round(Number(seconds) || 45)));
  stopTimer();
  timerInitial = normalizedSeconds;
  timerSeconds = normalizedSeconds;
  timerDisplay.textContent = String(timerSeconds);
  timerInput.value = String(timerSeconds);
}

function startTimer() {
  if (timerId) return;
  timerToggle.textContent = "정지";
  timerId = window.setInterval(() => {
    timerSeconds -= 1;
    timerDisplay.textContent = String(Math.max(timerSeconds, 0));
    if (timerSeconds <= 0) {
      stopTimer();
      timerDisplay.textContent = "끝";
      window.setTimeout(() => setTimer(timerInitial), 900);
    }
  }, 1000);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  timerToggle.textContent = "시작";
}

function toggleTimer() {
  if (timerId) {
    stopTimer();
    return;
  }
  if (timerSeconds <= 0 || timerDisplay.textContent === "끝") {
    timerSeconds = timerInitial;
    timerDisplay.textContent = String(timerSeconds);
  }
  startTimer();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
    return;
  }
  document.exitFullscreen?.();
}

spinButton.addEventListener("click", spin);
timerToggle.addEventListener("click", toggleTimer);
timerReset.addEventListener("click", syncTimerFromInput);
timerInput.addEventListener("input", () => {
  if (timerInput.value.trim() === "" || timerId) return;
  const seconds = readTimerInput(timerInitial || 45);
  timerInitial = seconds;
  timerSeconds = seconds;
  timerDisplay.textContent = String(seconds);
});
timerInput.addEventListener("change", syncTimerFromInput);
fullscreenButton.addEventListener("click", toggleFullscreen);

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !event.repeat) {
    event.preventDefault();
    spin();
  }
});

window.addEventListener("resize", drawWheel);

renderCategories();
setCategory("smalltalk");
