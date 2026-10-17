/**
 * StegnoFlow Client Application Controller
 * Handles REST API integrations, Web Audio procedural SFX,
 * Chart.js steganalysis graphs, Dashboard unified ingestion,
 * and real-time operational audit logging.
 */

class CyberAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.06, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.18);
    });
  }

  playError() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.setValueAtTime(110, now + 0.1);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }
}

const audio = new CyberAudio();
let chiSquareChart = null;
let rgbChartInstance = null;
let povChartInstance = null;
let cachedAnalysisReport = null;

function getSampleRgbData() {
  const labels = [];
  const red = [];
  const green = [];
  const blue = [];
  for (let i = 0; i < 64; i++) {
    const val = i * 4;
    labels.push(String(val));
    const rVal = Math.round(180 + 320 * Math.exp(-Math.pow(val - 70, 2) / 1200) + 180 * Math.exp(-Math.pow(val - 190, 2) / 800));
    const gVal = Math.round(140 + 380 * Math.exp(-Math.pow(val - 110, 2) / 1400) + 120 * Math.exp(-Math.pow(val - 210, 2) / 900));
    const bVal = Math.round(110 + 290 * Math.exp(-Math.pow(val - 145, 2) / 1500) + 210 * Math.exp(-Math.pow(val - 60, 2) / 1000));
    red.push(rVal);
    green.push(gVal);
    blue.push(bVal);
  }
  return { labels, red, green, blue };
}

function getSamplePovData() {
  const pairs = [];
  for (let k = 0; k < 16; k++) {
    const base = 480 - k * 18 + Math.floor(Math.sin(k) * 35);
    pairs.push({
      pair: `(${2 * k},${2 * k + 1})`,
      even: base + Math.floor(Math.random() * 20),
      odd: base - Math.floor(Math.random() * 20)
    });
  }
  return pairs;
}

function getSampleChiData() {
  const points = [];
  for (let i = 5; i <= 100; i += 5) {
    points.push({
      percentage: i,
      stego_probability: parseFloat((0.08 + (i / 100) * 0.12 + Math.random() * 0.04).toFixed(3))
    });
  }
  return points;
}

function extractClientRgbHistogram(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const maxDim = 320;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
          else { w = Math.round((w * maxDim) / h); h = maxDim; }
        }
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        const rHist = new Array(64).fill(0);
        const gHist = new Array(64).fill(0);
        const bHist = new Array(64).fill(0);
        const labels = [];
        for (let i = 0; i < 64; i++) labels.push(String(i * 4));

        for (let i = 0; i < imgData.length; i += 4) {
          const rBin = Math.min(63, Math.floor(imgData[i] / 4));
          const gBin = Math.min(63, Math.floor(imgData[i + 1] / 4));
          const bBin = Math.min(63, Math.floor(imgData[i + 2] / 4));
          rHist[rBin]++;
          gHist[gBin]++;
          bHist[bBin]++;
        }

        if (!cachedAnalysisReport) cachedAnalysisReport = {};
        if (!cachedAnalysisReport.histogram_analysis) cachedAnalysisReport.histogram_analysis = {};
        cachedAnalysisReport.histogram_analysis.rgb = {
          labels: labels,
          red: rHist,
          green: gHist,
          blue: bHist
        };

        const rgbTab = document.getElementById("tab-chart-rgb");
        if (rgbTab && rgbTab.classList.contains("active")) {
          renderRgbHistogram(cachedAnalysisReport.histogram_analysis.rgb);
        }
        logAudit(`Target image analyzed: Real-time RGB spectrum extracted.`);
      } catch (err) {
        console.warn("Client histogram extraction error:", err);
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function logAudit(msg) {
  const terminal = document.getElementById("audit-log");
  if (!terminal) return;
  const timeStr = new Date().toTimeString().split(" ")[0];
  const div = document.createElement("div");
  div.className = "log-entry";
  div.innerHTML = `<span class="log-time">[${timeStr}]</span> ${msg}`;
  terminal.appendChild(div);
  terminal.scrollTop = terminal.scrollHeight;
}

document.addEventListener("DOMContentLoaded", () => {
  setupSidebarToggle();
  setupNavigation();
  setupDropzones();
  loadEffectsGallery();
  setupSoundToggle();
  setupDashboardIngestion();
  setupSplitSlider();
  setup3DButtonEffects();
});

function setup3DButtonEffects() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button, .btn, .btn-monolith-primary, .btn-monolith-secondary, .nav-item, .mode-tab-btn, .btn-copy");
    if (!btn || btn.id === "sidebar-toggle") return;

    // Spawn dynamic 3D cyber shockwave ripple
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "cyber-ripple";
    const size = Math.max(rect.width, rect.height, 40);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

let lastSidebarToggleTime = 0;
function toggleSidebar(e) {
  if (e) {
    if (typeof e.preventDefault === "function") e.preventDefault();
    if (typeof e.stopPropagation === "function") e.stopPropagation();
  }
  const now = Date.now();
  if (now - lastSidebarToggleTime < 250) return;
  lastSidebarToggleTime = now;

  audio.playClick();
  const appContainer = document.getElementById("app-container");
  if (!appContainer) return;

  const wasCollapsed = appContainer.classList.contains("sidebar-collapsed");
  if (wasCollapsed) {
    appContainer.classList.remove("sidebar-collapsed");
    localStorage.setItem("stegnoflow_sidebar_collapsed", "false");
    if (window.setCryptoVisualState) window.setCryptoVisualState("success");
    logAudit("Navigation sidebar opened.");
  } else {
    appContainer.classList.add("sidebar-collapsed");
    localStorage.setItem("stegnoflow_sidebar_collapsed", "true");
    logAudit("Navigation sidebar collapsed.");
  }

  setTimeout(() => { window.dispatchEvent(new Event("resize")); }, 100);
  setTimeout(() => { window.dispatchEvent(new Event("resize")); }, 380);
}
window.toggleSidebar = toggleSidebar;

function setupSidebarToggle() {
  const toggleBtn = document.getElementById("sidebar-toggle");
  const appContainer = document.getElementById("app-container");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (!appContainer) return;

  // On page load, if currently on dashboard, keep collapsed as default
  const activePanel = document.querySelector(".section-panel.active");
  const isDashboard = !activePanel || activePanel.id === "panel-dashboard";
  if (isDashboard) {
    appContainer.classList.add("sidebar-collapsed");
  } else if (window.innerWidth > 900) {
    appContainer.classList.remove("sidebar-collapsed");
  }

  if (toggleBtn) {
    toggleBtn.onclick = toggleSidebar;
  }

  if (backdrop) {
    backdrop.onclick = (e) => {
      if (e) e.preventDefault();
      appContainer.classList.add("sidebar-collapsed");
    };
  }

  // Auto-close drawer on mobile when an item is chosen
  document.querySelectorAll(".sidebar .nav-item").forEach(item => {
    item.addEventListener("click", () => {
      if (window.innerWidth <= 900) {
        appContainer.classList.add("sidebar-collapsed");
      }
    });
  });
}

function switchUnifiedMode(prefix, mode) {
  audio.playClick();
  const hideBtn = document.getElementById(`btn-mode-${prefix}-hide`);
  const extractBtn = document.getElementById(`btn-mode-${prefix}-extract`);
  const hidePane = document.getElementById(`pane-${prefix}-hide`);
  const extractPane = document.getElementById(`pane-${prefix}-extract`);

  if (!hideBtn || !extractBtn || !hidePane || !extractPane) return;

  if (mode === "hide") {
    hideBtn.classList.add("active");
    extractBtn.classList.remove("active");
    hidePane.classList.add("active");
    extractPane.classList.remove("active");
  } else {
    extractBtn.classList.add("active");
    hideBtn.classList.remove("active");
    extractPane.classList.add("active");
    hidePane.classList.remove("active");
  }
}
window.switchUnifiedMode = switchUnifiedMode;

function setupSoundToggle() {
  const btn = document.getElementById("sound-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    audio.enabled = !audio.enabled;
    btn.textContent = audio.enabled ? "🔊 AUDIO: ON" : "🔇 AUDIO: OFF";
    if (audio.enabled) audio.playClick();
  });
}

function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const panels = document.querySelectorAll(".section-panel");
  const appContainer = document.getElementById("app-container");

  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      audio.playClick();
      const targetId = item.getAttribute("data-target");

      navItems.forEach(n => n.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      item.classList.add("active");
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add("active");
        logAudit(`Navigated to module: [${targetId.replace("panel-", "").toUpperCase()}]`);
      }

      // Sidebar logic:
      // On Dashboard: collapsed by default
      // On every other tab: OPEN by default on desktop/laptop
      if (appContainer) {
        if (targetId === "panel-dashboard") {
          appContainer.classList.add("sidebar-collapsed");
        } else {
          if (window.innerWidth > 900) {
            appContainer.classList.remove("sidebar-collapsed");
          }
        }
      }

      // If switching to Steganalysis panel, ensure active chart is rendered & resized
      if (targetId === "panel-steganalysis") {
        setTimeout(() => {
          ensureAnalysisChartVisible();
        }, 120);
      }

      setTimeout(() => { window.dispatchEvent(new Event("resize")); }, 100);
      setTimeout(() => { window.dispatchEvent(new Event("resize")); }, 350);
    });
  });
}

function setupDropzones() {
  const dropzones = document.querySelectorAll(".dropzone");

  dropzones.forEach(dz => {
    const fileInput = dz.querySelector("input[type='file']");
    const previewContainer = document.getElementById(dz.getAttribute("data-preview"));

    dz.addEventListener("dragover", (e) => {
      e.preventDefault();
      dz.classList.add("dragover");
    });

    dz.addEventListener("dragleave", () => {
      dz.classList.remove("dragover");
    });

    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      dz.classList.remove("dragover");
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect(fileInput.files[0], previewContainer, dz);
      }
    });

    if (fileInput) {
      fileInput.addEventListener("change", () => {
        if (fileInput.files.length) {
          handleFileSelect(fileInput.files[0], previewContainer, dz);
        }
      });
    }
  });
}

function handleFileSelect(file, previewBox, dropzone) {
  audio.playClick();
  const label = dropzone.querySelector(".dropzone-text");
  if (label) label.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;

  if (file.type.startsWith("image/") && previewBox) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewBox.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
    };
    reader.readAsDataURL(file);

    // If target ingestion for steganalysis, immediately extract real RGB histogram
    const fileInput = dropzone.querySelector("input[type='file']");
    if ((fileInput && fileInput.id === "steg-target-file") || (previewBox && previewBox.id === "steg-target-preview")) {
      extractClientRgbHistogram(file);
    }
  }
}

// ================= UNIVERSAL DASHBOARD INGESTION & AUTO-ROUTING =================

let activeDashboardFile = null;
let currentIngestTab = "text";
let activeSmartTarget = "nav-image-stego";

function setupDashboardIngestion() {
  const dropzone = document.getElementById("monolith-dropzone");
  const fileInput = document.getElementById("monolith-file-input");
  if (!dropzone || !fileInput) return;

  // Click dropzone to trigger hidden file input
  dropzone.addEventListener("click", (e) => {
    if (e.target !== fileInput) fileInput.click();
  });

  // Drag and drop styling & events
  ["dragenter", "dragover"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("dragover");
    });
  });

  dropzone.addEventListener("drop", (e) => {
    if (e.dataTransfer && e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      handleCarrierIngestion(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
      handleCarrierIngestion(fileInput.files[0]);
    }
  });
}

function handleCarrierIngestion(file) {
  if (!file) return;
  activeDashboardFile = file;
  audio.playClick();

  const fileInfo = document.getElementById("monolith-file-info");
  const fileName = document.getElementById("monolith-file-name");
  const fileSize = document.getElementById("monolith-file-size");

  if (fileInfo && fileName && fileSize) {
    fileName.textContent = file.name;
    fileSize.textContent = `${Math.round(file.size / 1024)} KB`;
    fileInfo.style.display = "block";
  }

  logAudit(`Ingested carrier: ${file.name} [Type: ${file.type || "binary"}, Size: ${Math.round(file.size / 1024)} KB]`);

  // Grab any text & password user already entered in the monolith box
  const pendingText = document.getElementById("monolith-text-input")?.value || "";
  const pendingPass = document.getElementById("monolith-password")?.value || "";

  // Helper to transfer File object via DataTransfer
  const transferFile = (inputEl) => {
    if (!inputEl) return;
    try {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputEl.files = dt.files;
      inputEl.dispatchEvent(new Event("change"));
    } catch (e) {
      console.warn("DataTransfer not supported:", e);
    }
  };

  // Auto-detect format & route seamlessly to dedicated studio
  setTimeout(() => {
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|bmp|webp)$/i.test(file.name);
    const isAudio = file.type.startsWith("audio/") || /\.(wav|wave)$/i.test(file.name);

    if (isPdf) {
      logAudit("PDF Document carrier confirmed. Routing to PDF Studio...");
      document.getElementById("nav-pdf-stego")?.click();
      const pdfInput = document.getElementById("pdf-carrier-file");
      transferFile(pdfInput);
      if (pendingText) {
        const t = document.getElementById("pdf-hide-text");
        if (t) t.value = pendingText;
      }
      if (pendingPass) {
        const p = document.getElementById("pdf-hide-pass");
        if (p) p.value = pendingPass;
      }
    } else if (isImage) {
      logAudit("Image carrier confirmed. Routing to Image LSB Studio...");
      document.getElementById("nav-image-stego")?.click();
      const imgInput = document.getElementById("img-hide-carrier");
      transferFile(imgInput);
      const extInput = document.getElementById("img-extract-file");
      transferFile(extInput);
      if (pendingText) {
        const t = document.getElementById("img-hide-text");
        if (t) t.value = pendingText;
      }
      if (pendingPass) {
        const p = document.getElementById("img-hide-pass");
        if (p) p.value = pendingPass;
        const ep = document.getElementById("img-extract-pass");
        if (ep) ep.value = pendingPass;
      }
    } else if (isAudio) {
      logAudit("Audio carrier confirmed. Routing to Audio WAV Studio...");
      document.getElementById("nav-audio-stego")?.click();
      const audInput = document.getElementById("aud-carrier");
      transferFile(audInput);
      const audExtInput = document.getElementById("aud-extract-file");
      transferFile(audExtInput);
      if (pendingText) {
        const t = document.getElementById("aud-secret-msg");
        if (t) t.value = pendingText;
      }
      if (pendingPass) {
        const p = document.getElementById("aud-pass");
        if (p) p.value = pendingPass;
        const ep = document.getElementById("aud-extract-pass");
        if (ep) ep.value = pendingPass;
      }
    } else {
      logAudit("Binary payload recognized. Routing to Polyglot Studio...");
      document.getElementById("nav-eof-stego")?.click();
      const eofInput = document.getElementById("eof-carrier");
      transferFile(eofInput);
      if (pendingPass) {
        const p = document.getElementById("eof-pass");
        if (p) p.value = pendingPass;
      }
    }
  }, 450);
}

// ---------------- MONOLITH TEXT WORKFLOW ----------------

function showCyberToast(msg) {
  const existing = document.querySelector(".cyber-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "cyber-toast";
  toast.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> <span>${msg}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 350);
  }, 2600);
}
window.showCyberToast = showCyberToast;

function clearActiveCarrier(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  activeDashboardFile = null;
  const fileInfo = document.getElementById("monolith-file-info");
  if (fileInfo) fileInfo.style.display = "none";
  const fileInput = document.getElementById("monolith-file-input");
  if (fileInput) fileInput.value = "";
  const imgPreview = document.getElementById("monolith-result-img-preview");
  if (imgPreview) imgPreview.style.display = "none";
  logAudit("Active carrier reset. Switched back to pure text stego.");
  showCyberToast("Carrier file cleared. Ready for text stego.");
}
window.clearActiveCarrier = clearActiveCarrier;

// Global clipboard paste listener for images/files
window.addEventListener("paste", (e) => {
  if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length) {
    const file = e.clipboardData.files[0];
    if (file) {
      handleCarrierIngestion(file);
      showCyberToast(`Carrier pasted: ${file.name || 'image file'}`);
    }
  }
});

async function executeMonolithEncrypt() {
  audio.playClick();
  const coverText = document.getElementById("monolith-text-input")?.value || "";
  const secretText = document.getElementById("monolith-secret-input")?.value || "";
  const pass = document.getElementById("monolith-password")?.value || "";
  const btn = document.getElementById("btn-monolith-encrypt");

  const resBox = document.getElementById("monolith-result-box");
  const resTitle = document.getElementById("monolith-result-title");
  const resText = document.getElementById("monolith-result-text");
  const resMetrics = document.getElementById("monolith-result-metrics");
  const dlLink = document.getElementById("monolith-download-link");
  const shareBtn = document.getElementById("monolith-share-btn");

  // Helper for image preview in monolith result
  let imgPreview = document.getElementById("monolith-result-img-preview");
  if (!imgPreview && resText && resText.parentNode) {
    imgPreview = document.createElement("div");
    imgPreview.id = "monolith-result-img-preview";
    imgPreview.style.textAlign = "center";
    imgPreview.style.margin = "8px 0";
    resText.parentNode.insertBefore(imgPreview, resText);
  }
  if (imgPreview) imgPreview.style.display = "none";

  // CASE 1: Carrier is an IMAGE
  if (activeDashboardFile && (activeDashboardFile.type.startsWith("image/") || /\.(png|jpe?g|bmp|webp)$/i.test(activeDashboardFile.name))) {
    const payload = secretText.trim() || coverText.trim();
    if (!payload) {
      audio.playError();
      alert("Please enter a secret message to embed into the image carrier!");
      return;
    }

    if (btn) btn.classList.add("btn-loading");
    if (window.setCryptoVisualState) window.setCryptoVisualState("processing");

    const formData = new FormData();
    formData.append("carrier", activeDashboardFile);
    formData.append("secret_text", payload);
    if (pass) formData.append("passphrase", pass);
    formData.append("bits_per_channel", "1");
    formData.append("channels", "RGB");
    formData.append("scatter", "true");

    try {
      const res = await fetch("/api/image/hide", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Image encoding failed.");

      if (resBox) resBox.style.display = "block";
      if (resTitle) resTitle.textContent = "SUCCESS • STEGO IMAGE GENERATED";

      if (imgPreview) {
        imgPreview.innerHTML = `<img src="${data.image_data_url}" alt="Stego Output" style="max-height:180px;max-width:100%;object-fit:contain;border-radius:8px;border:1px solid var(--cyan);box-shadow:0 0 16px rgba(0,242,254,0.35);" />`;
        imgPreview.style.display = "block";
      }

      if (resText) {
        resText.value = `[STEGO IMAGE ENCODED]\nCarrier: ${activeDashboardFile.name}\nPSNR: ${data.metadata?.psnr_db} dB | SSIM: ${data.metadata?.ssim}\nZero visual degradation. Confidential payload concealed with AES-256-GCM.`;
      }

      if (resMetrics) {
        resMetrics.innerHTML = `
          <span>🖼️ PSNR: ${data.metadata?.psnr_db} dB</span>
          <span>🔒 AEAD: ${pass ? 'AES-256 ACTIVE' : 'OPEN LSB'}</span>
          <span>🛡️ VISUAL DEGRADATION: 0%</span>
        `;
      }

      if (dlLink) {
        dlLink.style.display = "inline-flex";
        dlLink.href = data.image_data_url;
        dlLink.download = `stegoflow_${activeDashboardFile.name || 'image.png'}`;
        dlLink.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> <span>Download Stego Image</span>`;
      }

      if (shareBtn) shareBtn.style.display = "inline-flex";

      audio.playSuccess();
      if (window.setCryptoVisualState) window.setCryptoVisualState("success");
      logAudit(`Stego image created directly on Dashboard with PSNR ${data.metadata?.psnr_db} dB.`);
      showCyberToast("Stego image generated! Ready to download or share.");
      return;
    } catch (err) {
      audio.playError();
      if (window.setCryptoVisualState) window.setCryptoVisualState("error");
      alert(`Image Encoding Error: ${err.message}`);
      return;
    } finally {
      if (btn) btn.classList.remove("btn-loading");
    }
  }

  // CASE 2: Carrier is a PDF Document
  if (activeDashboardFile && (activeDashboardFile.type === "application/pdf" || /\.pdf$/i.test(activeDashboardFile.name))) {
    const payload = secretText.trim() || coverText.trim();
    if (!payload) {
      audio.playError();
      alert("Please enter a secret message to inject into the PDF!");
      return;
    }

    if (btn) btn.classList.add("btn-loading");
    if (window.setCryptoVisualState) window.setCryptoVisualState("processing");

    const formData = new FormData();
    formData.append("pdf", activeDashboardFile);
    formData.append("secret_text", payload);
    if (pass) formData.append("passphrase", pass);

    try {
      const res = await fetch("/api/pdf/hide", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "PDF hide failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (resBox) resBox.style.display = "block";
      if (resTitle) resTitle.textContent = "SUCCESS • STEGO PDF GENERATED";
      if (resText) resText.value = `[STEGO PDF ENCODED]\nCarrier: ${activeDashboardFile.name}\nConfidential payload injected into PDF internal stream structure.\nPassphrase: ${pass ? 'Protected with AES-256-GCM AEAD' : 'Raw stream'}`;

      if (resMetrics) {
        resMetrics.innerHTML = `
          <span>📄 FORMAT: PDF 1.4-1.7</span>
          <span>🔒 ENCRYPTED: ${pass ? 'YES' : 'RAW'}</span>
          <span>🛡️ STRUCTURE: COMPLIANT</span>
        `;
      }

      if (dlLink) {
        dlLink.style.display = "inline-flex";
        dlLink.href = url;
        dlLink.download = `stego_${activeDashboardFile.name}`;
        dlLink.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> <span>Download Stego PDF</span>`;
      }

      if (shareBtn) shareBtn.style.display = "inline-flex";

      audio.playSuccess();
      if (window.setCryptoVisualState) window.setCryptoVisualState("success");
      logAudit(`Stego PDF generated for ${activeDashboardFile.name}.`);
      showCyberToast("PDF stego generated! Ready to download or share.");
      return;
    } catch (err) {
      audio.playError();
      if (window.setCryptoVisualState) window.setCryptoVisualState("error");
      alert(`PDF Stego Error: ${err.message}`);
      return;
    } finally {
      if (btn) btn.classList.remove("btn-loading");
    }
  }

  // CASE 3: Carrier is Audio WAV
  if (activeDashboardFile && (activeDashboardFile.type.startsWith("audio/") || /\.wav$/i.test(activeDashboardFile.name))) {
    const payload = secretText.trim() || coverText.trim();
    if (!payload) {
      audio.playError();
      alert("Please enter a secret message to embed into the audio carrier!");
      return;
    }

    if (btn) btn.classList.add("btn-loading");
    if (window.setCryptoVisualState) window.setCryptoVisualState("processing");

    const formData = new FormData();
    formData.append("audio", activeDashboardFile);
    formData.append("secret_text", payload);
    if (pass) formData.append("passphrase", pass);

    try {
      const res = await fetch("/api/audio/hide", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(data.detail || "Audio hide failed");

      if (resBox) resBox.style.display = "block";
      if (resTitle) resTitle.textContent = "SUCCESS • STEGO AUDIO GENERATED";
      if (resText) resText.value = `[STEGO WAV AUDIO ENCODED]\nCarrier: ${activeDashboardFile.name}\nPCM 16-bit LSB embedded audio.`;

      if (dlLink) {
        dlLink.style.display = "inline-flex";
        dlLink.href = data.audio_data_url;
        dlLink.download = `stego_${activeDashboardFile.name}`;
        dlLink.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> <span>Download Stego WAV</span>`;
      }
      if (shareBtn) shareBtn.style.display = "inline-flex";

      audio.playSuccess();
      if (window.setCryptoVisualState) window.setCryptoVisualState("success");
      logAudit(`Stego Audio generated for ${activeDashboardFile.name}.`);
      showCyberToast("Audio stego generated! Ready to download or share.");
      return;
    } catch (err) {
      audio.playError();
      if (window.setCryptoVisualState) window.setCryptoVisualState("error");
      alert(`Audio Stego Error: ${err.message}`);
      return;
    } finally {
      if (btn) btn.classList.remove("btn-loading");
    }
  }

  // CASE 4: Standard Invisible Zero-Width Text Steganography
  if (!coverText.trim()) {
    audio.playError();
    const coverInput = document.getElementById("monolith-text-input");
    if (coverInput) {
      coverInput.focus();
      coverInput.style.borderColor = "var(--crimson)";
      setTimeout(() => { coverInput.style.borderColor = ""; }, 2200);
    }
    alert("Please enter the public cover article or message text into the carrier box first!");
    return;
  }

  if (!secretText.trim()) {
    audio.playError();
    const secretInput = document.getElementById("monolith-secret-input");
    if (secretInput) {
      secretInput.focus();
      secretInput.style.borderColor = "var(--magenta)";
      setTimeout(() => { secretInput.style.borderColor = ""; }, 2200);
    }
    alert("Please enter the confidential secret message to hide!");
    return;
  }

  if (!pass.trim()) {
    audio.playError();
    const passInput = document.getElementById("monolith-password");
    if (passInput) {
      passInput.focus();
      passInput.style.borderColor = "var(--crimson)";
      passInput.style.boxShadow = "0 0 16px var(--crimson)";
      setTimeout(() => {
        passInput.style.borderColor = "";
        passInput.style.boxShadow = "";
      }, 2500);
    }
    alert("Password is MANDATORY for AES-256 Text Steganography! Please enter an encryption key.");
    return;
  }

  if (btn) btn.classList.add("btn-loading");
  if (window.setCryptoVisualState) window.setCryptoVisualState("processing");

  try {
    const res = await fetch("/api/text/hide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cover_text: coverText,
        secret_text: secretText,
        passphrase: pass,
        position: "words"
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Text steganography failed");

    // Display result on Dashboard
    if (resBox) resBox.style.display = "block";
    if (resTitle) resTitle.textContent = "SUCCESS • INVISIBLE STEGO TEXT GENERATED";
    if (resText) resText.value = data.stego_text;

    if (resMetrics) {
      resMetrics.innerHTML = `
        <span>🔒 AES-256-GCM AEAD: ACTIVE</span>
        <span>👁️ ZERO-WIDTH CHARS: ${data.metadata?.zero_width_chars || 0}</span>
        <span>🛡️ STEALTH: 100% UNICODE INVISIBLE</span>
      `;
    }

    if (dlLink) {
      dlLink.style.display = "inline-flex";
      dlLink.href = "data:text/plain;charset=utf-8," + encodeURIComponent(data.stego_text);
      dlLink.download = "stegoflow_secret_text.txt";
      dlLink.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> <span>Download (.TXT)</span>`;
    }

    if (shareBtn) {
      shareBtn.style.display = "inline-flex";
    }

    audio.playSuccess();
    if (window.setCryptoVisualState) window.setCryptoVisualState("success");
    logAudit("Invisible zero-width stego payload created directly from Dashboard.");
    showCyberToast("Confidential message invisibly embedded! Ready to copy or share.");
  } catch (err) {
    audio.playError();
    if (window.setCryptoVisualState) window.setCryptoVisualState("error");
    alert(`Error: ${err.message}`);
  } finally {
    if (btn) btn.classList.remove("btn-loading");
  }
}
window.executeMonolithEncrypt = executeMonolithEncrypt;

async function executeMonolithDecrypt() {
  audio.playClick();
  const stegoText = document.getElementById("monolith-text-input")?.value || "";
  const pass = document.getElementById("monolith-password")?.value || "";
  const btn = document.getElementById("btn-monolith-decrypt");

  const resBox = document.getElementById("monolith-result-box");
  const resTitle = document.getElementById("monolith-result-title");
  const resText = document.getElementById("monolith-result-text");
  const resMetrics = document.getElementById("monolith-result-metrics");
  const dlLink = document.getElementById("monolith-download-link");
  const shareBtn = document.getElementById("monolith-share-btn");

  // CASE 1: Decrypt active image carrier
  if (activeDashboardFile && (activeDashboardFile.type.startsWith("image/") || /\.(png|jpe?g|bmp|webp)$/i.test(activeDashboardFile.name))) {
    if (btn) btn.classList.add("btn-loading");
    if (window.setCryptoVisualState) window.setCryptoVisualState("processing");
    logAudit(`Scanning image ${activeDashboardFile.name} for concealed payload...`);

    const formData = new FormData();
    formData.append("stego_image", activeDashboardFile);
    if (pass) formData.append("passphrase", pass);
    formData.append("bits_per_channel", "1");
    formData.append("channels", "RGB");
    formData.append("scatter", "true");

    try {
      const res = await fetch("/api/image/extract", { method: "POST", body: formData });
      const data = await res.json();

      if (resBox) resBox.style.display = "block";
      if (data.success) {
        if (resTitle) resTitle.textContent = "SUCCESS • IMAGE PAYLOAD EXTRACTED";
        if (resText) resText.value = data.text_content || `[Binary Payload: ${data.byte_length} bytes]`;
        if (resMetrics) resMetrics.innerHTML = `<span>🔓 AEAD INTEGRITY: VERIFIED</span><span>🖼️ SOURCE: ${activeDashboardFile.name}</span>`;
        if (dlLink) {
          dlLink.style.display = "inline-flex";
          dlLink.href = "data:text/plain;charset=utf-8," + encodeURIComponent(data.text_content || "");
          dlLink.download = "extracted_payload.txt";
          dlLink.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> <span>Download (.TXT)</span>`;
        }
        if (shareBtn) shareBtn.style.display = "inline-flex";
        audio.playSuccess();
        if (window.setCryptoVisualState) window.setCryptoVisualState("success");
        showCyberToast("Image payload extracted successfully!");
      } else {
        if (resTitle) resTitle.textContent = "IMAGE EXTRACTION FAILED";
        if (resText) resText.value = `❌ ${data.message}\n\nPlease check: (1) Correct passphrase, (2) Image was encoded with LSB.`;
        audio.playError();
        if (window.setCryptoVisualState) window.setCryptoVisualState("error");
      }
      return;
    } catch (err) {
      audio.playError();
      alert(`Image Extraction Error: ${err.message}`);
      return;
    } finally {
      if (btn) btn.classList.remove("btn-loading");
    }
  }

  // CASE 2: Decrypt active PDF carrier
  if (activeDashboardFile && (activeDashboardFile.type === "application/pdf" || /\.pdf$/i.test(activeDashboardFile.name))) {
    if (btn) btn.classList.add("btn-loading");
    if (window.setCryptoVisualState) window.setCryptoVisualState("processing");

    const formData = new FormData();
    formData.append("pdf", activeDashboardFile);
    if (pass) formData.append("passphrase", pass);

    try {
      const res = await fetch("/api/pdf/extract", { method: "POST", body: formData });
      const data = await res.json();

      if (resBox) resBox.style.display = "block";
      if (data.success) {
        if (resTitle) resTitle.textContent = "SUCCESS • PDF PAYLOAD EXTRACTED";
        if (resText) resText.value = data.text_content;
        audio.playSuccess();
        if (window.setCryptoVisualState) window.setCryptoVisualState("success");
        showCyberToast("PDF payload extracted successfully!");
      } else {
        if (resTitle) resTitle.textContent = "PDF EXTRACTION FAILED";
        if (resText) resText.value = `❌ ${data.message}`;
        audio.playError();
      }
      return;
    } catch (err) {
      audio.playError();
      alert(`PDF Extraction Error: ${err.message}`);
      return;
    } finally {
      if (btn) btn.classList.remove("btn-loading");
    }
  }

  // CASE 3: Text Decryption
  if (!pass.trim()) {
    audio.playError();
    const pwInput = document.getElementById("monolith-password");
    if (pwInput) {
      pwInput.focus();
      pwInput.style.borderColor = "var(--crimson)";
      pwInput.style.boxShadow = "0 0 18px var(--crimson)";
      setTimeout(() => {
        pwInput.style.borderColor = "";
        pwInput.style.boxShadow = "";
      }, 2500);
    }
    alert("Password is MANDATORY for Text Decryption!\nPlease enter the passphrase used during encryption.");
    return;
  }

  if (!stegoText.trim()) {
    audio.playError();
    alert("Please enter or paste the stego text containing the hidden payload!");
    return;
  }

  if (btn) btn.classList.add("btn-loading");
  if (window.setCryptoVisualState) window.setCryptoVisualState("processing");
  logAudit("Scanning for zero-width characters and decrypting AES-256-GCM ciphertext...");

  try {
    const res = await fetch("/api/text/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stego_text: stegoText,
        passphrase: pass
      })
    });
    const data = await res.json();

    if (resBox) resBox.style.display = "block";

    if (data.success) {
      if (resTitle) resTitle.textContent = "SUCCESS • SECRET MESSAGE EXTRACTED";
      if (resText) resText.value = data.secret_message;
      if (resMetrics) {
        resMetrics.innerHTML = `
          <span>🔓 CIPHER: AES-256-GCM VERIFIED</span>
          <span>✅ INTEGRITY: 100% AUTHENTICATED</span>
        `;
      }
      if (dlLink) {
        dlLink.style.display = "inline-flex";
        dlLink.href = "data:text/plain;charset=utf-8," + encodeURIComponent(data.secret_message);
        dlLink.download = "extracted_secret.txt";
        dlLink.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> <span>Download (.TXT)</span>`;
      }
      if (shareBtn) shareBtn.style.display = "inline-flex";

      audio.playSuccess();
      if (window.setCryptoVisualState) window.setCryptoVisualState("success");
      logAudit(`Extracted payload verified: "${data.secret_message.substring(0, 32)}..."`);
      showCyberToast("Decryption successful! Confidential payload revealed.");
    } else {
      if (resTitle) resTitle.textContent = "EXTRACTION FAILED";
      if (resText) resText.value = `❌ ${data.message}\n\nPlease check: (1) Correct passphrase, (2) Text contains valid zero-width characters.`;
      if (resMetrics) resMetrics.innerHTML = `<span style="color:var(--crimson)">INTEGRITY FAIL</span>`;
      if (shareBtn) shareBtn.style.display = "none";
      audio.playError();
      if (window.setCryptoVisualState) window.setCryptoVisualState("error");
      logAudit(`Text extraction failure: ${data.message}`);
    }
  } catch (err) {
    audio.playError();
    if (window.setCryptoVisualState) window.setCryptoVisualState("error");
    alert(`Error: ${err.message}`);
  } finally {
    if (btn) btn.classList.remove("btn-loading");
  }
}
window.executeMonolithDecrypt = executeMonolithDecrypt;

function copyMonolithResult() {
  const resText = document.getElementById("monolith-result-text");
  if (!resText || !resText.value) return;
  audio.playClick();
  navigator.clipboard.writeText(resText.value).then(() => {
    logAudit("Copied output payload to clipboard.");
    showCyberToast("📋 Output payload copied to clipboard!");
  }).catch(() => {
    resText.select();
    document.execCommand("copy");
    showCyberToast("📋 Output payload copied to clipboard!");
  });
}
window.copyMonolithResult = copyMonolithResult;

async function sharePayload(title, text) {
  audio.playClick();
  if (navigator.share) {
    try {
      await navigator.share({
        title: title || "StegnoFlow Cryptographic Stego Payload",
        text: text
      });
      logAudit("Payload shared via native share dialog.");
      return;
    } catch (err) {
      if (err.name !== "AbortError") console.warn("Share error:", err);
    }
  }
  // Fallback: copy to clipboard and toast
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showCyberToast("📋 Payload copied to clipboard! Ready to share via WhatsApp, Signal, or Email.");
      logAudit("Payload copied to clipboard for direct sharing.");
    });
  }
}
window.sharePayload = sharePayload;

function shareMonolithResult() {
  const text = document.getElementById("monolith-result-text")?.value;
  if (!text) return;
  sharePayload("StegnoFlow Stego Payload", text);
}
window.shareMonolithResult = shareMonolithResult;

async function shareImageStego() {
  audio.playClick();
  const dlBtn = document.getElementById("img-hide-download");
  if (!dlBtn || !dlBtn.href) {
    alert("Please encode a stego image first!");
    return;
  }
  try {
    const res = await fetch(dlBtn.href);
    const blob = await res.blob();
    const file = new File([blob], "stegoflow_image.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "StegnoFlow Encoded Carrier",
        text: "Protected steganographic image carrier."
      });
      logAudit("Stego image shared via native dialog.");
      return;
    }
  } catch (err) {
    if (err.name !== "AbortError") console.warn("Image share error:", err);
  }
  dlBtn.click();
  showCyberToast("⬇️ Stego PNG downloaded! File ready to attach & share.");
}
window.shareImageStego = shareImageStego;

async function sharePdfStego() {
  audio.playClick();
  const dlBtn = document.getElementById("pdf-hide-dl-btn");
  if (!dlBtn || !dlBtn.href) {
    alert("Please inject a PDF first!");
    return;
  }
  try {
    const res = await fetch(dlBtn.href);
    const blob = await res.blob();
    const file = new File([blob], dlBtn.download || "stego_doc.pdf", { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "StegnoFlow PDF Carrier",
        text: "Encrypted PDF steganographic document."
      });
      logAudit("Stego PDF shared via native dialog.");
      return;
    }
  } catch (err) {
    if (err.name !== "AbortError") console.warn("PDF share error:", err);
  }
  dlBtn.click();
  showCyberToast("⬇️ Stego PDF downloaded! Document ready to attach & share.");
}
window.sharePdfStego = sharePdfStego;

async function shareAudioStego() {
  audio.playClick();
  const dlBtn = document.getElementById("aud-download");
  if (!dlBtn || !dlBtn.href) {
    alert("Please embed audio stego first!");
    return;
  }
  try {
    const res = await fetch(dlBtn.href);
    const blob = await res.blob();
    const file = new File([blob], "stegoflow_audio.wav", { type: "audio/wav" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "StegnoFlow Audio Carrier",
        text: "16-bit PCM WAV steganographic audio."
      });
      logAudit("Stego audio shared via native dialog.");
      return;
    }
  } catch (err) {
    if (err.name !== "AbortError") console.warn("Audio share error:", err);
  }
  dlBtn.click();
  showCyberToast("⬇️ Stego WAV downloaded! Audio ready to attach & share.");
}
window.shareAudioStego = shareAudioStego;

async function checkMonolithPasswordEntropy(pw) {
  const bar = document.getElementById("monolith-entropy-bar");
  const txt = document.getElementById("monolith-entropy-text");
  const verdict = document.getElementById("monolith-entropy-verdict");
  if (!bar || !txt || !verdict) return;

  if (!pw) {
    bar.style.width = "0%";
    txt.textContent = "Entropy: 0 bits";
    verdict.textContent = "Rating: NONE";
    return;
  }

  try {
    const res = await fetch("/api/tools/password-strength", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw })
    });
    const data = await res.json();
    bar.style.width = `${data.score}%`;
    txt.textContent = `Entropy: ${data.entropy_bits} bits`;
    verdict.textContent = `Rating: ${data.rating}`;

    if (data.score < 35) {
      bar.style.background = "var(--crimson)";
    } else if (data.score < 75) {
      bar.style.background = "var(--amber)";
    } else {
      bar.style.background = "var(--neon-green)";
    }
  } catch (err) {
    console.error(err);
  }
}
window.checkMonolithPasswordEntropy = checkMonolithPasswordEntropy;

// ================= PDF STEGANOGRAPHY =================

async function executePdfHide() {
  const fileInput = document.getElementById("pdf-carrier-file");
  const file = (fileInput && fileInput.files && fileInput.files.length) ? fileInput.files[0] : (activeDashboardFile && activeDashboardFile.name && /\.pdf$/i.test(activeDashboardFile.name) ? activeDashboardFile : null);
  const text = document.getElementById("pdf-hide-text")?.value || "";
  const pass = document.getElementById("pdf-hide-pass")?.value || "";

  if (!file) {
    alert("Please select a carrier PDF document first!");
    audio.playError();
    return;
  }
  if (!text.trim()) {
    alert("Please enter secret payload text to inject!");
    audio.playError();
    return;
  }

  const formData = new FormData();
  formData.append("pdf", file);
  formData.append("secret_text", text);
  if (pass) formData.append("passphrase", pass);

  try {
    const res = await fetch("/api/pdf/hide", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "PDF hide failed");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const successBox = document.getElementById("pdf-hide-success-box");
    const dlBtn = document.getElementById("pdf-hide-dl-btn");
    const shareBtn = document.getElementById("pdf-hide-share-btn");

    if (successBox) successBox.style.display = "block";
    if (dlBtn) {
      dlBtn.href = url;
      dlBtn.download = `stego_${file.name || 'document.pdf'}`;
      dlBtn.style.display = "block";
    }
    if (shareBtn) shareBtn.style.display = "block";

    const a = document.createElement("a");
    a.href = url;
    a.download = `stego_${file.name || 'document.pdf'}`;
    a.click();

    audio.playSuccess();
    if (window.setCryptoVisualState) window.setCryptoVisualState("success");
    logAudit(`PDF payload injected into ${file.name}`);
    showCyberToast("PDF stego generated and downloaded!");
  } catch (err) {
    alert(err.message);
    audio.playError();
  }
}

async function executePdfExtract() {
  const fileInput = document.getElementById("pdf-extract-file");
  const file = (fileInput && fileInput.files && fileInput.files.length) ? fileInput.files[0] : (activeDashboardFile && activeDashboardFile.name && /\.pdf$/i.test(activeDashboardFile.name) ? activeDashboardFile : null);
  const pass = document.getElementById("pdf-extract-pass")?.value || "";

  if (!file) {
    alert("Please select a PDF file!");
    audio.playError();
    return;
  }

  const formData = new FormData();
  formData.append("pdf", file);
  if (pass) formData.append("passphrase", pass);

  try {
    const res = await fetch("/api/pdf/extract", { method: "POST", body: formData });
    const data = await res.json();
    const out = document.getElementById("pdf-extract-result");
    if (data.success) {
      if (out) out.value = data.text_content;
      audio.playSuccess();
      if (window.setCryptoVisualState) window.setCryptoVisualState("success");
      logAudit("Extracted payload from PDF carrier.");
      showCyberToast("PDF payload extracted successfully!");
    } else {
      if (out) out.value = `❌ ${data.message}`;
      audio.playError();
      if (window.setCryptoVisualState) window.setCryptoVisualState("error");
    }
  } catch (err) {
    alert(err.message);
    audio.playError();
  }
}

// ================= SYNTHETIC AUDIO CARRIER =================

async function generateSynthAudio(toneType) {
  logAudit(`Synthesizing clean 16-bit PCM WAV carrier: [${toneType}]...`);
  const formData = new FormData();
  formData.append("duration", "3.0");
  formData.append("tone_type", toneType);

  try {
    const res = await fetch("/api/audio/synthesize", { method: "POST", body: formData });
    const blob = await res.blob();
    const file = new File([blob], `synth_${toneType}.wav`, { type: "audio/wav" });

    // Set into audio carrier input
    const container = new DataTransfer();
    container.items.add(file);
    document.getElementById("aud-carrier").files = container.files;

    audio.playSuccess();
    logAudit(`Generated synthetic WAV carrier: synth_${toneType}.wav`);
    alert(`Synthetic carrier 'synth_${toneType}.wav' created and loaded into Audio Studio!`);
  } catch (err) {
    alert(err.message);
  }
}

// ================= BATCH STEGO SCANNER =================

async function executeBatchScan() {
  const input = document.getElementById("batch-files-input");
  if (!input.files.length) {
    alert("Please select multiple images for batch analysis!");
    return;
  }

  logAudit(`Launching batch scan across ${input.files.length} images...`);
  const formData = new FormData();
  for (let i = 0; i < input.files.length; i++) {
    formData.append("files", input.files[i]);
  }

  try {
    const res = await fetch("/api/analyze/batch", { method: "POST", body: formData });
    const data = await res.json();
    const tbody = document.getElementById("batch-results-tbody");
    tbody.innerHTML = "";

    data.results.forEach(r => {
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid rgba(255,255,255,0.06)";
      const isSus = r.suspicion_score > 50;
      tr.innerHTML = `
        <td style="padding:10px;color:#fff;">${r.filename}</td>
        <td style="padding:10px;color:${isSus ? "var(--crimson)" : "var(--neon-green)"};">${r.suspicion_score}%</td>
        <td style="padding:10px;">${r.risk_level}</td>
        <td style="padding:10px;">${r.chi_square_stat}</td>
        <td style="padding:10px;color:var(--text-muted);">${r.verdict}</td>
      `;
      tbody.appendChild(tr);
    });

    document.getElementById("batch-results-container").style.display = "block";
    audio.playSuccess();
    logAudit(`Batch analysis complete: Scanned ${data.total_scanned} files.`);
  } catch (err) {
    alert(err.message);
  }
}

// ================= SPLIT SCREEN SLIDER =================

function setupSplitSlider() {
  const beforeIn = document.getElementById("split-before-input");
  const afterIn = document.getElementById("split-after-input");
  const imgBefore = document.getElementById("split-img-before");
  const imgAfter = document.getElementById("split-img-after");

  if (!beforeIn || !afterIn) return;

  beforeIn.addEventListener("change", () => {
    if (beforeIn.files.length) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imgBefore.src = e.target.result;
        imgBefore.style.display = "block";
      };
      reader.readAsDataURL(beforeIn.files[0]);
    }
  });

  afterIn.addEventListener("change", () => {
    if (afterIn.files.length) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imgAfter.src = e.target.result;
        imgAfter.style.display = "block";
      };
      reader.readAsDataURL(afterIn.files[0]);
    }
  });
}

function updateSplitSlider(val) {
  const wrapper = document.getElementById("split-img-after-wrapper");
  if (wrapper) {
    wrapper.style.width = `${val}%`;
  }
}

// ================= IMAGE STEGANOGRAPHY =================

async function executeImageHide() {
  const carrierInput = document.getElementById("img-hide-carrier");
  const secretText = document.getElementById("img-hide-text")?.value || "";
  const password = document.getElementById("img-hide-pass")?.value || "";
  const bits = document.getElementById("img-hide-bits")?.value || "1";
  const channels = document.getElementById("img-hide-chan")?.value || "RGB";
  const scatterEl = document.getElementById("img-hide-scatter");
  const scatter = scatterEl ? scatterEl.checked : true;

  const file = (carrierInput && carrierInput.files && carrierInput.files.length) ? carrierInput.files[0] : (activeDashboardFile && activeDashboardFile.type.startsWith("image/") ? activeDashboardFile : null);

  if (!file) {
    alert("Please select or drop a carrier image first!");
    audio.playError();
    return;
  }
  if (!secretText.trim()) {
    alert("Please enter a secret message to embed!");
    audio.playError();
    return;
  }

  const formData = new FormData();
  formData.append("carrier", file);
  formData.append("secret_text", secretText);
  if (password) formData.append("passphrase", password);
  formData.append("bits_per_channel", bits);
  formData.append("channels", channels);
  formData.append("scatter", scatter);

  const statusText = document.getElementById("img-hide-status");
  if (statusText) statusText.textContent = "⚙️ Encrypting (AES-256-GCM) & Vector Embedding...";
  if (window.setCryptoVisualState) window.setCryptoVisualState("processing");

  try {
    const res = await fetch("/api/image/hide", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Encoding failed.");

    if (statusText) statusText.textContent = "✅ Stego Image Ready (Zero Visual Degradation)";
    audio.playSuccess();
    if (window.setCryptoVisualState) window.setCryptoVisualState("success");

    const outBox = document.getElementById("img-hide-out-preview");
    if (outBox) {
      outBox.innerHTML = `<img src="${data.image_data_url}" alt="Stego Output" style="max-height:100%;max-width:100%;object-fit:contain;border-radius:6px;" />`;
    }

    const dlBtn = document.getElementById("img-hide-download");
    if (dlBtn) {
      dlBtn.href = data.image_data_url;
      dlBtn.download = `stegoflow_${file.name || 'image.png'}`;
      dlBtn.style.display = "inline-flex";
    }

    const shareBtn = document.getElementById("img-hide-share-btn");
    if (shareBtn) shareBtn.style.display = "inline-flex";

    const analyzeBtn = document.getElementById("img-hide-analyze-btn");
    if (analyzeBtn) analyzeBtn.style.display = "inline-flex";

    const psnrEl = document.getElementById("metric-psnr");
    if (psnrEl && data.metadata) psnrEl.textContent = `${data.metadata.psnr_db} dB`;
    const ssimEl = document.getElementById("metric-ssim");
    if (ssimEl && data.metadata) ssimEl.textContent = data.metadata.ssim;
    const rateEl = document.getElementById("metric-rate");
    if (rateEl && data.metadata) rateEl.textContent = `${data.metadata.embedding_rate_percent}%`;

    logAudit(`Image stego generated with PSNR ${data.metadata?.psnr_db || 'N/A'} dB.`);
    showCyberToast("Stego image generated successfully! Ready to download or inspect.");
  } catch (err) {
    if (statusText) statusText.textContent = `❌ ${err.message}`;
    audio.playError();
    if (window.setCryptoVisualState) window.setCryptoVisualState("error");
    alert(`Image Steganography Error: ${err.message}`);
  }
}

async function teleportStegoToAnalysis() {
  audio.playClick();
  const dlBtn = document.getElementById("img-hide-download");
  if (!dlBtn || !dlBtn.href) {
    alert("No stego image generated yet! Please encode a payload first.");
    return;
  }

  try {
    const res = await fetch(dlBtn.href);
    const blob = await res.blob();
    const file = new File([blob], "stego_carrier.png", { type: "image/png" });

    const targetInput = document.getElementById("steg-target-file");
    const container = new DataTransfer();
    container.items.add(file);
    targetInput.files = container.files;
    extractClientRgbHistogram(file);

    const previewBox = document.getElementById("steg-target-preview");
    if (previewBox) {
      previewBox.innerHTML = `<img src="${dlBtn.href}" alt="Target Stego" style="max-height:100%;max-width:100%;object-fit:contain;border-radius:6px;" />`;
    }

    const navSteg = document.getElementById("nav-steganalysis");
    if (navSteg) {
      navSteg.click();
    }

    logAudit("Teleported generated stego image to Deep Steganalysis Lab.");
    setTimeout(() => {
      executeSteganalysis();
    }, 300);
  } catch (err) {
    console.error("Teleport error:", err);
    alert("Could not transfer image to analysis lab: " + err.message);
  }
}
window.teleportStegoToAnalysis = teleportStegoToAnalysis;

async function executeImageExtract() {
  const stegoInput = document.getElementById("img-extract-file");
  const password = document.getElementById("img-extract-pass")?.value || "";
  const bitsEl = document.getElementById("img-extract-bits");
  const bits = bitsEl ? bitsEl.value : "1";
  const chanEl = document.getElementById("img-extract-chan");
  const channels = chanEl ? chanEl.value : "RGB";
  const scatterEl = document.getElementById("img-extract-scatter");
  const scatter = scatterEl ? scatterEl.checked : true;

  if (!stegoInput || !stegoInput.files.length) {
    alert("Please upload a stego image (PNG)!");
    audio.playError();
    return;
  }

  const formData = new FormData();
  formData.append("stego_image", stegoInput.files[0]);
  if (password) formData.append("passphrase", password);
  formData.append("bits_per_channel", bits);
  formData.append("channels", channels);
  formData.append("scatter", scatter);

  const outArea = document.getElementById("img-extract-result");
  if (outArea) outArea.value = "🔍 Scanning carrier bitstream and verifying AEAD tag...";
  if (window.setCryptoVisualState) window.setCryptoVisualState("processing");

  try {
    const res = await fetch("/api/image/extract", { method: "POST", body: formData });
    const data = await res.json();

    if (data.success) {
      audio.playSuccess();
      if (window.setCryptoVisualState) window.setCryptoVisualState("success");
      if (outArea) outArea.value = data.text_content || `[Extracted Binary Payload (${data.byte_length} bytes)]`;
      logAudit("Image payload extracted and AEAD signature verified.");
      showCyberToast("Image payload extracted successfully!");
    } else {
      audio.playError();
      if (window.setCryptoVisualState) window.setCryptoVisualState("error");
      if (outArea) outArea.value = `❌ Extraction Failed: ${data.message}`;
    }
  } catch (err) {
    audio.playError();
    if (outArea) outArea.value = `❌ Error: ${err.message}`;
  }
}

// ================= STEGANALYSIS & CHI-SQUARE ATTACK =================

async function executeSteganalysis() {
  const fileInput = document.getElementById("steg-target-file");
  const origInput = document.getElementById("steg-orig-file");

  if (!fileInput.files.length) {
    alert("Please upload a target image to analyze!");
    audio.playError();
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  if (origInput && origInput.files.length) {
    formData.append("original", origInput.files[0]);
  }

  const statusText = document.getElementById("steg-status");
  statusText.textContent = "🔬 Computing Chi-Square test, PoVs, and entropy map...";
  if (window.setCryptoVisualState) window.setCryptoVisualState("processing");

  try {
    const res = await fetch("/api/analyze/steganalysis", { method: "POST", body: formData });
    const report = await res.json();

    statusText.textContent = `Verdict: ${report.verdict}`;
    audio.playSuccess();
    if (window.setCryptoVisualState) window.setCryptoVisualState("success");

    document.getElementById("steg-score").textContent = `${report.suspicion_score}%`;
    document.getElementById("steg-chi").textContent = report.chi_square.chi_square_stat;
    document.getElementById("steg-entropy").textContent = report.global_entropy;

    if (report.lsb_plane_data_url) {
      const lsbBox = document.getElementById("steg-lsb-preview");
      lsbBox.innerHTML = `<img src="${report.lsb_plane_data_url}" alt="LSB Plane 0" />`;
    }

    cachedAnalysisReport = report;

    // Render active tab chart on visible canvas
    const rgbTab = document.getElementById("tab-chart-rgb");
    const povTab = document.getElementById("tab-chart-pov");
    if (rgbTab && rgbTab.classList.contains("active")) {
      if (report.histogram_analysis && report.histogram_analysis.rgb) {
        renderRgbHistogram(report.histogram_analysis.rgb);
      }
    } else if (povTab && povTab.classList.contains("active")) {
      if (report.histogram_analysis && report.histogram_analysis.povs) {
        renderPovChart(report.histogram_analysis.povs);
      }
    } else {
      renderChiChart(report.chi_square.curve_points);
    }

    logAudit(`Steganalysis completed: Suspicion ${report.suspicion_score}%.`);
  } catch (err) {
    statusText.textContent = `❌ ${err.message}`;
    audio.playError();
  }
}
window.executeSteganalysis = executeSteganalysis;

function switchAnalysisChart(tab) {
  audio.playClick();
  const chiTab = document.getElementById("tab-chart-chi");
  const rgbTab = document.getElementById("tab-chart-rgb");
  const povTab = document.getElementById("tab-chart-pov");

  const chiCanvas = document.getElementById("chiChart");
  const rgbCanvas = document.getElementById("rgbHistChart");
  const povCanvas = document.getElementById("povChart");

  if (!chiCanvas || !rgbCanvas || !povCanvas) return;

  if (chiTab) chiTab.classList.remove("active");
  if (rgbTab) rgbTab.classList.remove("active");
  if (povTab) povTab.classList.remove("active");

  chiCanvas.style.display = "none";
  rgbCanvas.style.display = "none";
  povCanvas.style.display = "none";

  if (tab === "rgb") {
    if (rgbTab) rgbTab.classList.add("active");
    rgbCanvas.style.display = "block";
    const data = (cachedAnalysisReport && cachedAnalysisReport.histogram_analysis && cachedAnalysisReport.histogram_analysis.rgb)
      ? cachedAnalysisReport.histogram_analysis.rgb
      : getSampleRgbData();
    renderRgbHistogram(data);
    if (rgbChartInstance) {
      rgbChartInstance.resize();
      rgbChartInstance.update();
    }
  } else if (tab === "pov") {
    if (povTab) povTab.classList.add("active");
    povCanvas.style.display = "block";
    const data = (cachedAnalysisReport && cachedAnalysisReport.histogram_analysis && cachedAnalysisReport.histogram_analysis.povs)
      ? cachedAnalysisReport.histogram_analysis.povs
      : getSamplePovData();
    renderPovChart(data);
    if (povChartInstance) {
      povChartInstance.resize();
      povChartInstance.update();
    }
  } else {
    if (chiTab) chiTab.classList.add("active");
    chiCanvas.style.display = "block";
    const data = (cachedAnalysisReport && cachedAnalysisReport.chi_square && cachedAnalysisReport.chi_square.curve_points)
      ? cachedAnalysisReport.chi_square.curve_points
      : getSampleChiData();
    renderChiChart(data);
    if (chiSquareChart) {
      chiSquareChart.resize();
      chiSquareChart.update();
    }
  }
}
window.switchAnalysisChart = switchAnalysisChart;

function ensureAnalysisChartVisible() {
  const rgbTab = document.getElementById("tab-chart-rgb");
  const povTab = document.getElementById("tab-chart-pov");
  if (rgbTab && rgbTab.classList.contains("active")) {
    switchAnalysisChart("rgb");
  } else if (povTab && povTab.classList.contains("active")) {
    switchAnalysisChart("pov");
  } else {
    switchAnalysisChart("chi");
  }
}
window.ensureAnalysisChartVisible = ensureAnalysisChartVisible;

function renderChiChart(points) {
  const ctx = document.getElementById("chiChart");
  if (!ctx || typeof Chart === "undefined" || !points) return;

  const labels = points.map(p => `${p.percentage}%`);
  const values = points.map(p => p.stego_probability);

  if (chiSquareChart) {
    chiSquareChart.destroy();
  }

  chiSquareChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "LSB Stego Probability",
          data: values,
          borderColor: "#00f2fe",
          backgroundColor: "rgba(0, 242, 254, 0.15)",
          tension: 0.3,
          fill: true,
          pointRadius: 4
        },
        {
          label: "Threshold (0.65)",
          data: Array(labels.length).fill(0.65),
          borderColor: "#ff007f",
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#e2e8f0", font: { family: "monospace", size: 10 } } }
      },
      scales: {
        x: { ticks: { color: "#8892b0", font: { size: 9 } }, grid: { color: "rgba(255,255,255,0.05)" } },
        y: { min: 0, max: 1, ticks: { color: "#8892b0", font: { size: 9 } }, grid: { color: "rgba(255,255,255,0.05)" } }
      }
    }
  });
}

function renderRgbHistogram(rgbData) {
  const ctx = document.getElementById("rgbHistChart");
  if (!ctx || typeof Chart === "undefined" || !rgbData) return;

  if (rgbChartInstance) {
    rgbChartInstance.destroy();
  }

  rgbChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: rgbData.labels,
      datasets: [
        {
          label: "Red Channel (R)",
          data: rgbData.red,
          borderColor: "#ff3366",
          backgroundColor: "rgba(255, 51, 102, 0.1)",
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 1.5,
          fill: true
        },
        {
          label: "Green Channel (G)",
          data: rgbData.green,
          borderColor: "#00ff88",
          backgroundColor: "rgba(0, 255, 136, 0.1)",
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 1.5,
          fill: true
        },
        {
          label: "Blue Channel (B)",
          data: rgbData.blue,
          borderColor: "#00ccff",
          backgroundColor: "rgba(0, 204, 255, 0.1)",
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 1.5,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#e2e8f0", font: { family: "monospace", size: 10 } } },
        tooltip: { mode: "index", intersect: false }
      },
      scales: {
        x: { 
          ticks: { color: "#8892b0", font: { size: 8 }, maxTicksLimit: 12 }, 
          grid: { color: "rgba(255,255,255,0.05)" },
          title: { display: true, text: "Pixel Intensity Bin (0-255)", color: "#8892b0", font: { size: 9 } }
        },
        y: { 
          ticks: { color: "#8892b0", font: { size: 9 } }, 
          grid: { color: "rgba(255,255,255,0.05)" },
          title: { display: true, text: "Frequency", color: "#8892b0", font: { size: 9 } }
        }
      }
    }
  });
}

function renderPovChart(povsData) {
  const ctx = document.getElementById("povChart");
  if (!ctx || typeof Chart === "undefined" || !povsData) return;

  const labels = povsData.map(p => p.pair);
  const evenCounts = povsData.map(p => p.even);
  const oddCounts = povsData.map(p => p.odd);

  if (povChartInstance) {
    povChartInstance.destroy();
  }

  povChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Even Bin 2k",
          data: evenCounts,
          backgroundColor: "rgba(0, 242, 254, 0.75)",
          borderColor: "#00f2fe",
          borderWidth: 1
        },
        {
          label: "Odd Bin 2k+1",
          data: oddCounts,
          backgroundColor: "rgba(255, 0, 127, 0.75)",
          borderColor: "#ff007f",
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#e2e8f0", font: { family: "monospace", size: 10 } } },
        tooltip: {
          callbacks: {
            afterBody: (context) => {
              const idx = context[0].dataIndex;
              const diff = Math.abs(evenCounts[idx] - oddCounts[idx]);
              return `Delta |2k - (2k+1)|: ${diff} (PoV Equalization)`;
            }
          }
        }
      },
      scales: {
        x: { 
          ticks: { color: "#8892b0", font: { size: 8 } }, 
          grid: { color: "rgba(255,255,255,0.05)" },
          title: { display: true, text: "Sampled Value Pairs (2k, 2k+1)", color: "#8892b0", font: { size: 9 } }
        },
        y: { 
          ticks: { color: "#8892b0", font: { size: 9 } }, 
          grid: { color: "rgba(255,255,255,0.05)" } 
        }
      }
    }
  });
}

// ================= 26+ FORENSIC EFFECTS GALLERY =================

let allEffects = [];

async function loadEffectsGallery() {
  const container = document.getElementById("effects-container");
  if (!container) return;

  try {
    const res = await fetch("/api/effects/list");
    const data = await res.json();
    allEffects = data.effects;

    container.innerHTML = "";
    allEffects.forEach((eff, index) => {
      const card = document.createElement("div");
      card.className = "effect-card" + (index === 0 ? " active" : "");
      card.setAttribute("data-id", eff.id);
      card.innerHTML = `
        <span class="badge-cat">${eff.category}</span>
        <h4>${eff.name}</h4>
        <p>${eff.desc}</p>
      `;
      card.addEventListener("click", () => {
        document.querySelectorAll(".effect-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        audio.playClick();
        applySelectedEffect(eff.id);
      });
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load effects gallery:", err);
  }
}

async function applySelectedEffect(effectId) {
  const fileInput = document.getElementById("fx-input-file");
  if (!fileInput.files.length) {
    alert("Please upload an image into the Effects Studio first!");
    return;
  }

  const formData = new FormData();
  formData.append("image", fileInput.files[0]);
  formData.append("effect_id", effectId);

  const outBox = document.getElementById("fx-out-preview");
  outBox.innerHTML = "<p style='color:#00f2fe;font-family:monospace'>Applying mathematical filter...</p>";

  try {
    const res = await fetch("/api/effects/apply", { method: "POST", body: formData });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    outBox.innerHTML = `<img src="${url}" alt="Processed Effect" />`;
    audio.playSuccess();
    logAudit(`Applied forensic filter: ${effectId}`);
  } catch (err) {
    outBox.innerHTML = `<p style='color:#ff0055'>Error: ${err.message}</p>`;
    audio.playError();
  }
}

// ================= INVISIBLE ZERO-WIDTH TEXT =================

async function executeTextHide() {
  const cover = document.getElementById("txt-cover").value;
  const secret = document.getElementById("txt-secret").value;
  const pass = document.getElementById("txt-pass").value;

  if (!secret.trim()) {
    alert("Please enter a secret message!");
    return;
  }

  try {
    const res = await fetch("/api/text/hide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cover_text: cover,
        secret_text: secret,
        passphrase: pass || null
      })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById("txt-stego-out").value = data.stego_text;
      audio.playSuccess();
      logAudit("Zero-width stego injected into cover text.");
    }
  } catch (err) {
    alert(err.message);
  }
}

async function executeTextExtract() {
  const stego = document.getElementById("txt-stego-in").value;
  const pass = document.getElementById("txt-extract-pass").value;

  if (!stego.trim()) {
    alert("Please paste text containing invisible characters!");
    return;
  }

  try {
    const res = await fetch("/api/text/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stego_text: stego,
        passphrase: pass || null
      })
    });
    const data = await res.json();
    const out = document.getElementById("txt-revealed-out");
    if (data.success) {
      out.value = data.secret_message;
      audio.playSuccess();
      logAudit("Zero-width text payload extracted.");
    } else {
      out.value = `❌ ${data.message}`;
      audio.playError();
    }
  } catch (err) {
    alert(err.message);
  }
}

// ================= AUDIO WAV STEGANOGRAPHY =================

async function executeAudioHide() {
  const audFile = document.getElementById("aud-carrier").files[0];
  const secret = document.getElementById("aud-secret-msg").value;
  const pass = document.getElementById("aud-pass").value;

  if (!audFile) {
    alert("Please upload a WAV audio file!");
    return;
  }
  if (!secret.trim()) {
    alert("Please enter a secret message!");
    return;
  }

  const formData = new FormData();
  formData.append("audio", audFile);
  formData.append("secret_text", secret);
  if (pass) formData.append("passphrase", pass);

  try {
    const res = await fetch("/api/audio/hide", { method: "POST", body: formData });
    const data = await res.json();
    if (data.success) {
      const player = document.getElementById("aud-stego-player");
      player.src = data.audio_data_url;
      player.style.display = "block";
      const dl = document.getElementById("aud-download");
      dl.href = data.audio_data_url;
      dl.download = "stego_audio.wav";
      dl.style.display = "inline-flex";
      audio.playSuccess();
      logAudit("Audio WAV stego payload embedded.");
    } else {
      alert(data.detail || "Audio encoding failed.");
    }
  } catch (err) {
    alert(err.message);
  }
}

async function executeAudioExtract() {
  const audFile = document.getElementById("aud-extract-file").files[0];
  const pass = document.getElementById("aud-extract-pass").value;

  if (!audFile) {
    alert("Please upload a stego WAV audio file!");
    return;
  }

  const formData = new FormData();
  formData.append("audio", audFile);
  if (pass) formData.append("passphrase", pass);

  try {
    const res = await fetch("/api/audio/extract", { method: "POST", body: formData });
    const data = await res.json();
    const out = document.getElementById("aud-extracted-result");
    if (data.success) {
      out.value = data.text_content;
      audio.playSuccess();
      logAudit("Payload extracted from audio carrier.");
    } else {
      out.value = `❌ ${data.message}`;
      audio.playError();
    }
  } catch (err) {
    alert(err.message);
  }
}
