
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const toast = $("#toast");
  let toastTimer;

  function notify(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 3200);
  }

  // NAVIGÁCIA

  const titles = {
    home: "Prehľad",
    internet: "Internet Speed Test",
    keyboard: "Test klávesnice",
    mouse: "Test myši",
    display: "Test obrazovky",
    reaction: "Reakčný čas",
    typing: "Rýchlosť písania",
    audio: "Test zvuku",
    system: "Informácie o PC"
  };

  const sidebar = $("#sidebar");

  function navigate(page) {
    if (!titles[page]) page = "home";

    $$(".page").forEach(section => {
      section.classList.toggle("active", section.id === `page-${page}`);
    });

    $$(".nav-link").forEach(link => {
      const active = link.dataset.page === page;
      link.classList.toggle("active", active);

      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    $("#currentPageTitle").textContent = titles[page];
    sidebar?.classList.remove("open");

    if (page === "system") renderSystemInfo();

    if (page === "keyboard") {
      window.setTimeout(() => {
        $("#keyboardVisual")?.setAttribute("aria-label",
          "Vizuálna klávesnica. Stláčaj fyzické klávesy.");
      }, 0);
    }

    if (page === "reaction") updateReactionDisplay();
  }

  function handleNavigation() {
    navigate(location.hash.replace(/^#/, "") || "home");
  }

  document.addEventListener("click", event => {
    const link = event.target.closest("[data-page]");
    if (!link) return;

    const page = link.dataset.page;
    if (!titles[page]) return;

    event.preventDefault();

    if (location.hash === `#${page}`) {
      navigate(page);
    } else {
      location.hash = page;
    }
  });

  window.addEventListener("hashchange", handleNavigation);

  $("#menuToggle")?.addEventListener("click", () => {
    sidebar?.classList.toggle("open");
  });

  document.addEventListener("click", event => {
    if (
      window.innerWidth <= 760 &&
      sidebar?.classList.contains("open") &&
      !sidebar.contains(event.target) &&
      !event.target.closest("#menuToggle")
    ) {
      sidebar.classList.remove("open");
    }
  });

  handleNavigation();

  // INFORMÁCIE O PREHLIADAČI

  const platformSummary = $("#platformSummary");

  if (platformSummary) {
    const ua = navigator.userAgent;
    platformSummary.textContent =
      /Windows/i.test(ua) ? "Windows" :
      /Macintosh|Mac OS/i.test(ua) ? "macOS" :
      /Android/i.test(ua) ? "Android" :
      /iPhone|iPad/i.test(ua) ? "iOS" :
      /Linux/i.test(ua) ? "Linux" : "Neznámy systém";
  }

  // TEST KLÁVESNICE

  const keyboard = $("#keyboardVisual");
  const pressedKeys = new Set();
  const testedKeys = new Set();
  const keyElements = new Map();
  let keyPressCount = 0;

  const keyboardRows = [
    [
      ["Esc", "Escape", "w15"],
      ["F1", "F1"], ["F2", "F2"], ["F3", "F3"], ["F4", "F4"],
      ["F5", "F5"], ["F6", "F6"], ["F7", "F7"], ["F8", "F8"],
      ["F9", "F9"], ["F10", "F10"], ["F11", "F11"], ["F12", "F12"]
    ],
    [
      ["`", "Backquote"], ["1", "Digit1"], ["2", "Digit2"],
      ["3", "Digit3"], ["4", "Digit4"], ["5", "Digit5"],
      ["6", "Digit6"], ["7", "Digit7"], ["8", "Digit8"],
      ["9", "Digit9"], ["0", "Digit0"], ["-", "Minus"],
      ["=", "Equal"], ["Backspace", "Backspace", "w2"]
    ],
    [
      ["Tab", "Tab", "w15"], ["Q", "KeyQ"], ["W", "KeyW"],
      ["E", "KeyE"], ["R", "KeyR"], ["T", "KeyT"],
      ["Y", "KeyY"], ["U", "KeyU"], ["I", "KeyI"],
      ["O", "KeyO"], ["P", "KeyP"], ["[", "BracketLeft"],
      ["]", "BracketRight"], ["\\", "Backslash", "w15"]
    ],
    [
      ["Caps", "CapsLock", "w2"], ["A", "KeyA"], ["S", "KeyS"],
      ["D", "KeyD"], ["F", "KeyF"], ["G", "KeyG"],
      ["H", "KeyH"], ["J", "KeyJ"], ["K", "KeyK"],
      ["L", "KeyL"], [";", "Semicolon"], ["'", "Quote"],
      ["Enter", "Enter", "w2"]
    ],
    [
      ["Shift", "ShiftLeft", "w25"], ["Z", "KeyZ"], ["X", "KeyX"],
      ["C", "KeyC"], ["V", "KeyV"], ["B", "KeyB"],
      ["N", "KeyN"], ["M", "KeyM"], [",", "Comma"],
      [".", "Period"], ["/", "Slash"], ["Shift", "ShiftRight", "w25"]
    ],
    [
      ["Ctrl", "ControlLeft", "w15"], ["Win", "MetaLeft"],
      ["Alt", "AltLeft"], ["Space", "Space", "space"],
      ["Alt", "AltRight"], ["Fn", "Fn"], ["Menu", "ContextMenu"],
      ["Ctrl", "ControlRight", "w15"]
    ],
    [
      ["Ins", "Insert"], ["Home", "Home"], ["PgUp", "PageUp"],
      ["Del", "Delete"], ["End", "End"], ["PgDn", "PageDown"],
      ["↑", "ArrowUp"], ["←", "ArrowLeft"],
      ["↓", "ArrowDown"], ["→", "ArrowRight"]
    ]
  ];

  function buildKeyboard() {
    if (!keyboard) return;

    keyboard.replaceChildren();
    keyElements.clear();

    keyboardRows.forEach(row => {
      const rowElement = document.createElement("div");
      rowElement.className = "key-row";

      row.forEach(([label, code, width]) => {
        const key = document.createElement("div");
        key.className = `key ${width || ""}`.trim();
        key.textContent = label;
        key.dataset.code = code;
        key.setAttribute("aria-label", label);

        rowElement.appendChild(key);
        keyElements.set(code, key);
      });

      keyboard.appendChild(rowElement);
    });
  }

  buildKeyboard();

  function updateKeyboardStats() {
    $("#keyCount").textContent = testedKeys.size;
    $("#heldKeys").textContent = pressedKeys.size;
  }

  function keyboardDown(event) {
    if (event.repeat) return;

    const code = event.code || event.key;
    if (!code) return;

    if (!pressedKeys.has(code)) {
      pressedKeys.add(code);
      testedKeys.add(code);
      keyPressCount++;

      const element = keyElements.get(code);
      element?.classList.add("pressed");

      $("#lastKey").textContent =
        event.key === " " ? "Space" :
        event.key.length === 1 ? event.key : event.key;

      updateKeyboardStats();
    }
  }

  function keyboardUp(event) {
    const code = event.code || event.key;
    pressedKeys.delete(code);
    keyElements.get(code)?.classList.remove("pressed");
    updateKeyboardStats();
  }

  document.addEventListener("keydown", keyboardDown);
  document.addEventListener("keyup", keyboardUp);

  window.addEventListener("blur", () => {
    pressedKeys.forEach(code => keyElements.get(code)?.classList.remove("pressed"));
    pressedKeys.clear();
    updateKeyboardStats();
  });

  $("#resetKeyboard")?.addEventListener("click", () => {
    pressedKeys.clear();
    testedKeys.clear();
    keyPressCount = 0;

    keyElements.forEach(element => element.classList.remove("pressed"));

    $("#keyCount").textContent = "0";
    $("#heldKeys").textContent = "0";
    $("#lastKey").textContent = "—";

    notify("Test klávesnice bol resetovaný.");
  });

  // TEST MYŠI

  const mouseArea = $("#mouseTestArea");
  const mouseCounts = {
    0: 0,
    1: 0,
    2: 0
  };

  let scrollCount = 0;
  let totalMovement = 0;
  let lastMousePosition = null;
  let recentClicks = [];
  let cpsTimer = null;

  function updateMouseStats() {
    $("#leftClicks").textContent = mouseCounts[0];
    $("#middleClicks").textContent = mouseCounts[1];
    $("#rightClicks").textContent = mouseCounts[2];
    $("#scrollCount").textContent = scrollCount;
    $("#mouseMovement").textContent = `${Math.round(totalMovement)} px`;

    const now = performance.now();
    recentClicks = recentClicks.filter(time => now - time <= 1000);
    $("#cpsValue").textContent = recentClicks.length.toFixed(1);
  }

  function updateMouseIllustration(button, active) {
    if (button === 0) {
      $(".mouse-left", mouseArea)?.classList.toggle("active", active);
    } else if (button === 2) {
      $(".mouse-right", mouseArea)?.classList.toggle("active", active);
    } else if (button === 1) {
      $(".mouse-wheel", mouseArea)?.classList.toggle("active", active);
    }
  }

  mouseArea?.addEventListener("contextmenu", event => {
    event.preventDefault();
  });

  mouseArea?.addEventListener("mousedown", event => {
    if (![0, 1, 2].includes(event.button)) return;

    mouseCounts[event.button]++;
    recentClicks.push(performance.now());

    updateMouseIllustration(event.button, true);

    const names = {
      0: "Ľavé tlačidlo zaznamenané",
      1: "Stredné tlačidlo zaznamenané",
      2: "Pravé tlačidlo zaznamenané"
    };

    $("#mouseFeedback").textContent = names[event.button];
    updateMouseStats();
  });

  document.addEventListener("mouseup", event => {
    updateMouseIllustration(event.button, false);
  });

  mouseArea?.addEventListener("mousemove", event => {
    if (lastMousePosition) {
      const dx = event.clientX - lastMousePosition.x;
      const dy = event.clientY - lastMousePosition.y;
      totalMovement += Math.sqrt(dx * dx + dy * dy);
    }

    lastMousePosition = {
      x: event.clientX,
      y: event.clientY
    };

    updateMouseStats();
  });

  mouseArea?.addEventListener("mouseleave", () => {
    lastMousePosition = null;
  });

  mouseArea?.addEventListener("wheel", () => {
    scrollCount++;
    $("#mouseFeedback").textContent = "Koliesko myši zaznamenané";
    updateMouseStats();
  }, { passive: true });

  cpsTimer = setInterval(updateMouseStats, 150);

  $("#resetMouse")?.addEventListener("click", () => {
    mouseCounts[0] = 0;
    mouseCounts[1] = 0;
    mouseCounts[2] = 0;
    scrollCount = 0;
    totalMovement = 0;
    recentClicks = [];
    lastMousePosition = null;

    $$(".mouse-left, .mouse-right, .mouse-wheel").forEach(element => {
      element.classList.remove("active");
    });

    $("#mouseFeedback").textContent = "Čakám na vstup…";
    updateMouseStats();
    notify("Test myši bol resetovaný.");
  });

  // TEST OBRAZOVKY

  const colors = [
    { color: "#ffffff", name: "Biela" },
    { color: "#000000", name: "Čierna" },
    { color: "#ff0000", name: "Červená" },
    { color: "#00ff00", name: "Zelená" },
    { color: "#0000ff", name: "Modrá" },
    { color: "#808080", name: "Sivá" }
  ];

  let colorIndex = 0;
  const preview = $("#displayPreview");
  const overlay = $("#displayOverlay");
  const overlayColor = $("#overlayColor");

  function setDisplayColor(color, name = "") {
    if (!preview) return;

    preview.style.background = color;
    preview.classList.add("active");

    const text = $("span", preview);
    if (text) {
      text.textContent = name;
      text.style.color = ["#ffffff", "#ffff00", "#00ff00"].includes(color.toLowerCase())
        ? "#111111"
        : "#ffffff";
    }

    if (overlay && !overlay.hidden) {
      overlayColor.style.background = color;
    }
  }

  $$(".color-option").forEach((button, index) => {
    button.addEventListener("click", () => {
      colorIndex = index;
      setDisplayColor(colors[index].color, colors[index].name);
    });
  });

  $("#nextDisplayColor")?.addEventListener("click", () => {
    colorIndex = (colorIndex + 1) % colors.length;
    setDisplayColor(colors[colorIndex].color, colors[colorIndex].name);
  });

  async function openDisplayOverlay() {
    if (!overlay) return;

    overlay.hidden = false;
    overlayColor.style.background = colors[colorIndex].color;

    try {
      if (overlay.requestFullscreen) {
        await overlay.requestFullscreen();
      }
    } catch {
      notify("Režim celej obrazovky nebol povolený. Test môže pokračovať v okne.");
    }
  }

  async function closeDisplayOverlay() {
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch {
        // Prehliadač môže odmietnuť ukončenie režimu.
      }
    }

    if (overlay) overlay.hidden = true;
  }

  $("#fullscreenDisplay")?.addEventListener("click", openDisplayOverlay);
  $("#closeDisplayOverlay")?.addEventListener("click", closeDisplayOverlay);
  $("#exitDisplay")?.addEventListener("click", closeDisplayOverlay);

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && overlay && !overlay.hidden) {
      overlay.hidden = true;
    }
  });

  // REAKČNÝ ČAS

  const reactionArea = $("#reactionArea");

  let reactionState = "idle";
  let reactionTimeout = null;
  let reactionStart = 0;
  let reactionResults = [];

  function updateReactionDisplay() {
    $("#reactionResult").textContent =
      reactionResults.length
        ? `${reactionResults[reactionResults.length - 1]} ms`
        : "— ms";

    $("#reactionAverage").textContent =
      reactionResults.length
        ? `${Math.round(reactionResults.reduce((a, b) => a + b, 0) /
          reactionResults.length)} ms`
        : "— ms";
  }

  function setReactionState(state) {
    reactionState = state;

    reactionArea.classList.remove("waiting", "ready", "early");

    const config = {
      idle: ["Pripravený?", "Stlač tlačidlo a počkaj na zelenú.", "ϟ"],
      waiting: ["Počkaj…", "Neklikaj, kým sa plocha nezmení na zelenú.", "⌛"],
      ready: ["TERAZ!", "Klikni čo najrýchlejšie.", "✓"],
      early: ["Priskoro!", "Klikol si pred zeleným signálom. Skús to znova.", "!"]
    };

    const [title, message, symbol] = config[state];

    $("#reactionTitle").textContent = title;
    $("#reactionMessage").textContent = message;
    $("#reactionSymbol").textContent = symbol;

    if (state === "waiting") reactionArea.classList.add("waiting");
    if (state === "ready") reactionArea.classList.add("ready");
    if (state === "early") reactionArea.classList.add("early");

    $("#startReaction").textContent =
      state === "waiting" ? "Čakaj na signál…" :
      state === "ready" ? "Klikni na zelenú plochu" :
      state === "idle" ? "Začať test" : "Skúsiť znova";
  }

  function startReactionTest() {
    clearTimeout(reactionTimeout);

    setReactionState("waiting");

    const delay = 1500 + Math.random() * 3500;

    reactionTimeout = setTimeout(() => {
      if (reactionState !== "waiting") return;

      setReactionState("ready");
      reactionStart = performance.now();
    }, delay);
  }

  function reactionInput() {
    if (reactionState === "waiting") {
      clearTimeout(reactionTimeout);
      setReactionState("early");
      return;
    }

    if (reactionState === "ready") {
      const elapsed = Math.round(performance.now() - reactionStart);

      reactionResults.push(elapsed);
      if (reactionResults.length > 10) reactionResults.shift();

      updateReactionDisplay();
      setReactionState("idle");
      $("#reactionMessage").textContent = `Tvoj reakčný čas je ${elapsed} ms.`;
      $("#startReaction").textContent = "Skúsiť znova";
      return;
    }

    if (reactionState === "early") {
      startReactionTest();
    }
  }

  $("#startReaction")?.addEventListener("click", () => {
    if (reactionState === "waiting" || reactionState === "ready") {
      reactionInput();
    } else {
      startReactionTest();
    }
  });

  reactionArea?.addEventListener("click", reactionInput);

  reactionArea?.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      reactionInput();
    }
  });

  // RÝCHLOSŤ PÍSANIA

  const typingText = $("#typingPrompt").textContent.trim().replace(/\s+/g, " ");
  let typingActive = false;
  let typingStart = 0;
  let typingEnd = 0;
  let typingTimer = null;
  let typingDuration = 60;

  function typingStats() {
    const input = $("#typingInput").value;
    const elapsed = typingActive
      ? Math.min(typingDuration, (performance.now() - typingStart) / 1000)
      : typingEnd
        ? Math.min(typingDuration, (typingEnd - typingStart) / 1000)
        : 0;

    let correct = 0;
    let errors = 0;

    for (let i = 0; i < input.length; i++) {
      if (input[i] === typingText[i]) correct++;
      else errors++;
    }

    const minutes = elapsed / 60;
    const wpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0;
    const accuracy = input.length
      ? Math.round((correct / input.length) * 100)
      : 100;

    $("#typingWpm").textContent = wpm;
    $("#typingAccuracy").textContent = `${accuracy}%`;
    $("#typingErrors").textContent = errors;

    const remaining = Math.max(0, typingDuration - elapsed);
    $("#typingTime").textContent = `${Math.ceil(remaining)} s`;
  }

  function stopTyping() {
    if (!typingActive) return;

    typingActive = false;
    typingEnd = performance.now();
    clearInterval(typingTimer);

    $("#typingInput").disabled = true;
    $("#startTyping").textContent = "Spustiť znova";

    typingStats();
    notify("Test písania dokončený.");
  }

  function startTyping() {
    clearInterval(typingTimer);

    typingActive = true;
    typingStart = performance.now();
    typingEnd = 0;

    $("#typingInput").value = "";
    $("#typingInput").disabled = false;
    $("#typingInput").focus();

    $("#startTyping").textContent = "Test prebieha…";
    $("#typingTime").textContent = `${typingDuration} s`;

    typingStats();

    typingTimer = setInterval(() => {
      typingStats();

      if ((performance.now() - typingStart) / 1000 >= typingDuration) {
        stopTyping();
      }
    }, 100);
  }

  $("#startTyping")?.addEventListener("click", () => {
    if (typingActive) return;
    startTyping();
  });

  $("#resetTyping")?.addEventListener("click", () => {
    clearInterval(typingTimer);
    typingActive = false;
    typingStart = 0;
    typingEnd = 0;

    $("#typingInput").value = "";
    $("#typingInput").disabled = true;
    $("#startTyping").textContent = "Začať test";
    $("#typingTime").textContent = `${typingDuration} s`;
    $("#typingWpm").textContent = "0";
    $("#typingAccuracy").textContent = "100%";
    $("#typingErrors").textContent = "0";

    notify("Test písania bol resetovaný.");
  });

  $("#typingInput")?.addEventListener("input", () => {
    if (!typingActive) return;

    typingStats();

    if ($("#typingInput").value.length >= typingText.length) {
      stopTyping();
    }
  });

  // TEST ZVUKU

  let audioContext = null;
  let audioOscillator = null;
  let audioGain = null;

  const volumeInput = $("#audioVolume");

  function updateVolumeLabel() {
    $("#audioVolumeValue").textContent = `${volumeInput.value} %`;
  }

  volumeInput?.addEventListener("input", updateVolumeLabel);
  updateVolumeLabel();

  async function playTone() {
    stopTone();

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        notify("Tento prehliadač nepodporuje generovanie zvuku.");
        return;
      }

      audioContext = new AudioContextClass();
      await audioContext.resume();

      audioOscillator = audioContext.createOscillator();
      audioGain = audioContext.createGain();

      audioOscillator.type = "sine";
      audioOscillator.frequency.value = Number($("#audioFrequency").value);

      audioGain.gain.value = Number(volumeInput.value) / 100;

      audioOscillator.connect(audioGain);
      audioGain.connect(audioContext.destination);
      audioOscillator.start();

      notify("Prehráva sa testovací tón.");
    } catch {
      stopTone();
      notify("Zvuk sa nepodarilo spustiť. Skontroluj nastavenia prehliadača.");
    }
  }

  function stopTone() {
    if (audioOscillator) {
      try {
        audioOscillator.stop();
      } catch {
        // Oscilátor už môže byť zastavený.
      }

      try {
        audioOscillator.disconnect();
      } catch {
        // Už odpojený.
      }

      audioOscillator = null;
    }

    if (audioGain) {
      try {
        audioGain.disconnect();
      } catch {
        // Už odpojený.
      }

      audioGain = null;
    }

    if (audioContext) {
      const context = audioContext;
      audioContext = null;

      if (context.state !== "closed") {
        context.close().catch(() => {});
      }
    }
  }

  $("#playAudio")?.addEventListener("click", playTone);
  $("#stopAudio")?.addEventListener("click", stopTone);

  // INFORMÁCIE O SYSTÉME

  function addSystemItem(label, value) {
    const item = document.createElement("div");
    item.className = "system-item";

    const title = document.createElement("span");
    title.textContent = label;

    const content = document.createElement("strong");
    content.textContent = value == null || value === ""
      ? "Nie je dostupné"
      : String(value);

    item.append(title, content);
    $("#systemInfoGrid").appendChild(item);
  }

  function renderSystemInfo() {
    const grid = $("#systemInfoGrid");
    if (!grid) return;

    grid.replaceChildren();

    const connection = navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    const memory = navigator.deviceMemory;
    const cores = navigator.hardwareConcurrency;

    const info = [
      ["Operačný systém", navigator.userAgentData?.platform || navigator.platform],
      ["Prehliadač", navigator.userAgentData?.brands?.map(b =>
        `${b.brand} ${b.version}`).join(", ") || navigator.userAgent],
      ["Jazyk", navigator.language],
      ["Online stav", navigator.onLine ? "Pripojený podľa prehliadača" : "Offline"],
      ["Rozlíšenie obrazovky", `${screen.width} × ${screen.height}`],
      ["Dostupná plocha", `${screen.availWidth} × ${screen.availHeight}`],
      ["Veľkosť okna", `${window.innerWidth} × ${window.innerHeight}`],
      ["Farebná hĺbka", `${screen.colorDepth} bitov`],
      ["Logické CPU jadrá", cores ? String(cores) : "Nie je dostupné"],
      ["Približná RAM", memory ? `Asi ${memory} GB` : "Nie je dostupné"],
      ["Typ pripojenia", connection?.effectiveType || "Nie je dostupné"],
      ["Odhad rýchlosti siete", connection?.downlink != null
        ? `${connection.downlink} Mbps`
        : "Nie je dostupné"],
      ["Úspora dát", connection?.saveData == null
        ? "Nie je dostupné"
        : connection.saveData ? "Zapnutá" : "Vypnutá"],
      ["Cookies", navigator.cookieEnabled ? "Povolené" : "Zakázané"],
      ["Časové pásmo", Intl.DateTimeFormat().resolvedOptions().timeZone],
      ["Počet dotykových bodov", navigator.maxTouchPoints ?? "Nie je dostupné"],
      ["Používateľský agent", navigator.userAgent]
    ];

    info.forEach(([label, value]) => addSystemItem(label, value));
  }

  $("#refreshSystem")?.addEventListener("click", () => {
    renderSystemInfo();
    notify("Systémové informácie boli obnovené.");
  });

  renderSystemInfo();

  // INTERNET SPEED TEST

  const speedButton = $("#startSpeedTest");

  const SPEED_ENDPOINTS = {
    ping: "https://www.cloudflare.com/cdn-cgi/trace",
    download: "https://speed.cloudflare.com/__down?bytes=5000000",
    upload: "https://speed.cloudflare.com/__up"
  };

  let speedTesting = false;

  async function measurePing() {
    const results = [];

    for (let i = 0; i < 5; i++) {
      const start = performance.now();

      const response = await fetch(
        `${SPEED_ENDPOINTS.ping}?_=${Date.now()}-${i}`,
        { cache: "no-store", mode: "cors" }
      );

      if (!response.ok) {
        throw new Error("Ping server neodpovedá.");
      }

      await response.text();
      results.push(performance.now() - start);
    }

    const average = results.reduce((sum, value) => sum + value, 0) /
      results.length;

    const deviations = results.map(value => Math.abs(value - average));
    const jitter = deviations.reduce((sum, value) => sum + value, 0) /
      deviations.length;

    return {
      ping: Math.round(average),
      jitter: Math.round(jitter)
    };
  }

  async function measureDownload() {
    const bytes = 5000000;
    const start = performance.now();

    const response = await fetch(
      `${SPEED_ENDPOINTS.download}&_=${Date.now()}`,
      { cache: "no-store", mode: "cors" }
    );

    if (!response.ok) {
      throw new Error("Download server neodpovedá.");
    }

    const data = await response.arrayBuffer();
    const elapsed = (performance.now() - start) / 1000;

    if (elapsed <= 0 || data.byteLength === 0) {
      throw new Error("Neplatný výsledok sťahovania.");
    }

    return (data.byteLength * 8) / elapsed / 1000000;
  }

  async function measureUpload() {
    const bytes = 1000000;
    const data = new Uint8Array(bytes);

    if (window.crypto?.getRandomValues) {
      // Naplnenie menšími časťami kvôli limitu Web Crypto.
      for (let offset = 0; offset < bytes; offset += 65536) {
        window.crypto.getRandomValues(
          data.subarray(offset, Math.min(offset + 65536, bytes))
        );
      }
    }

    const start = performance.now();

    const response = await fetch(SPEED_ENDPOINTS.upload, {
      method: "POST",
      body: data,
      cache: "no-store",
      mode: "cors"
    });

    if (!response.ok) {
      throw new Error("Upload server neodpovedá.");
    }

    await response.text();

    const elapsed = (performance.now() - start) / 1000;

    if (elapsed <= 0) {
      throw new Error("Neplatný výsledok odosielania.");
    }

    return (bytes * 8) / elapsed / 1000000;
  }

  function formatSpeed(value) {
    return Number.isFinite(value) ? value.toFixed(2) : "—";
  }

  async function runSpeedTest() {
    if (speedTesting) return;

    speedTesting = true;
    speedButton.disabled = true;
    speedButton.textContent = "Meranie prebieha…";

    $("#speedGauge").classList.add("testing");
    $("#speedStatus").textContent = "MERANIE";
    $("#speedValue").textContent = "…";
    $("#speedMessage").textContent = "Meriam odozvu pripojenia…";

    ["downloadResult", "uploadResult", "pingResult", "jitterResult"]
      .forEach(id => {
        const element = $(`#${id}`);
        element.innerHTML = "— <small>" +
          (id === "pingResult" || id === "jitterResult" ? "ms" : "Mbps") +
          "</small>";
      });

    try {
      const ping = await measurePing();

      $("#pingResult").innerHTML = `${ping.ping} <small>ms</small>`;
      $("#jitterResult").innerHTML = `${ping.jitter} <small>ms</small>`;
      $("#speedMessage").textContent = "Meriam rýchlosť sťahovania…";

      const download = await measureDownload();

      $("#downloadResult").innerHTML =
        `${formatSpeed(download)} <small>Mbps</small>`;
      $("#speedValue").textContent = formatSpeed(download);
      $("#speedUnit").textContent = "Mbps";
      $("#speedMessage").textContent = "Meriam rýchlosť odosielania…";

      const upload = await measureUpload();

      $("#uploadResult").innerHTML =
        `${formatSpeed(upload)} <small>Mbps</small>`;

      $("#speedStatus").textContent = "DOKONČENÉ";
      $("#speedMessage").textContent =
        "Meranie dokončené. Výsledky sú orientačné.";

      notify("Internetový test bol dokončený.");
    } catch (error) {
      $("#speedStatus").textContent = "CHYBA";
      $("#speedValue").textContent = "—";
      $("#speedMessage").textContent =
        "Meranie zlyhalo. Skontroluj pripojenie alebo dostupnosť externého servera.";

      notify(error.message || "Internetový test sa nepodarilo dokončiť.");
    } finally {
      speedTesting = false;
      speedButton.disabled = false;
      speedButton.innerHTML = 'Spustiť meranie <span>→</span>';
      $("#speedGauge").classList.remove("testing");
    }
  }

  speedButton?.addEventListener("click", runSpeedTest);

  // UPRATANIE PRI OPUSTENÍ STRÁNKY

  window.addEventListener("pagehide", () => {
    clearTimeout(toastTimer);
    clearTimeout(reactionTimeout);
    clearInterval(typingTimer);
    clearInterval(cpsTimer);
    stopTone();
  });

  // HOTOVO

  console.info("PC Test Lab je pripravený.");
});
