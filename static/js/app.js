/**
 * StegnoFlow Client Application Controller
 * Handles REST API integrations, Web Audio procedural SFX,
 * Chart.js steganalysis graphs, and UI transitions.
 */

// Web Audio API Synthesizer (Zero external audio asset dependency)
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

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupDropzones();
  loadEffectsGallery();
  setupSoundToggle();
});

function setupSoundToggle() {
  const btn = document.getElementById("sound-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    audio.enabled = !audio.enabled;
    btn.textContent = audio.enabled ? "🔊 AUDIO: ON" : "🔇 AUDIO: OFF";
    if (audio.enabled) audio.playClick();
  });
}

// Navigation Tab Switcher
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const panels = document.querySelectorAll(".section-panel");

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
      }
    });
  });
}

// Dropzone file handling & previews
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

    fileInput.addEventListener("change", () => {
      if (fileInput.files.length) {
        handleFileSelect(fileInput.files[0], previewContainer, dz);
      }
    });
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
  }
}

// ================= IMAGE STEGANOGRAPHY =================

async function executeImageHide() {
  const carrierInput = document.getElementById("img-hide-carrier");
  const secretText = document.getElementById("img-hide-text").value;
  const password = document.getElementById("img-hide-pass").value;
  const bits = document.getElementById("img-hide-bits").value;
  const channels = document.getElementById("img-hide-chan").value;
  const scatter = document.getElementById("img-hide-scatter").checked;

  if (!carrierInput.files.length) {
    alert("Please select a carrier image first!");
    audio.playError();
    return;
  }
  if (!secretText.trim()) {
    alert("Please enter a secret message to embed!");
    audio.playError();
    return;
  }

  const formData = new FormData();
  formData.append("carrier", carrierInput.files[0]);
  formData.append("secret_text", secretText);
  if (password) formData.append("passphrase", password);
  formData.append("bits_per_channel", bits);
  formData.append("channels", channels);
  formData.append("scatter", scatter);

  const statusText = document.getElementById("img-hide-status");
  statusText.textContent = "⚙️ Encrypting (AES-256-GCM) & Vector Embedding...";
  if (window.setCryptoVisualState) window.setCryptoVisualState("processing");

  try {
    const res = await fetch("/api/image/hide", {
      method: "POST",
      body: formData
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.detail || "Encoding failed.");

    statusText.textContent = "✅ Stego Image Ready (Zero Visual Degradation)";
    audio.playSuccess();
    if (window.setCryptoVisualState) window.setCryptoVisualState("success");

    // Display output image
    const outBox = document.getElementById("img-hide-out-preview");
    outBox.innerHTML = `<img src="${data.image_data_url}" alt="Stego Output" />`;

    // Setup download button
    const dlBtn = document.getElementById("img-hide-download");
    dlBtn.href = data.image_data_url;
    dlBtn.download = "steganoflow_encoded.png";
    dlBtn.style.display = "inline-flex";

    // Update metrics
    document.getElementById("metric-psnr").textContent = `${data.metadata.psnr_db} dB`;
    document.getElementById("metric-ssim").textContent = data.metadata.ssim;
    document.getElementById("metric-rate").textContent = `${data.metadata.embedding_rate_percent}%`;
  } catch (err) {
    statusText.textContent = `❌ ${err.message}`;
    audio.playError();
    if (window.setCryptoVisualState) window.setCryptoVisualState("error");
  }
}

async function executeImageExtract() {
  const stegoInput = document.getElementById("img-extract-file");
  const password = document.getElementById("img-extract-pass").value;
  const bits = document.getElementById("img-extract-bits").value;
  const channels = document.getElementById("img-extract-chan").value;
  const scatter = document.getElementById("img-extract-scatter").checked;

  if (!stegoInput.files.length) {
    alert("Please upload a stego image!");
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
  outArea.value = "🔍 Scanning carrier bitstream and verifying AEAD tag...";
  if (window.setCryptoVisualState) window.setCryptoVisualState("processing");

  try {
    const res = await fetch("/api/image/extract", {
      method: "POST",
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      audio.playSuccess();
      if (window.setCryptoVisualState) window.setCryptoVisualState("success");
      outArea.value = data.text_content || `[Extracted Binary Payload (${data.byte_length} bytes)]`;
    } else {
      audio.playError();
      if (window.setCryptoVisualState) window.setCryptoVisualState("error");
      outArea.value = `❌ Extraction Failed: ${data.message}`;
    }
  } catch (err) {
    audio.playError();
    outArea.value = `❌ Error: ${err.message}`;
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
  if (origInput.files.length) {
    formData.append("original", origInput.files[0]);
  }

  const statusText = document.getElementById("steg-status");
  statusText.textContent = "🔬 Computing Chi-Square test, PoVs, and entropy map...";
  if (window.setCryptoVisualState) window.setCryptoVisualState("processing");

  try {
    const res = await fetch("/api/analyze/steganalysis", {
      method: "POST",
      body: formData
    });
    const report = await res.json();

    statusText.textContent = `Verdict: ${report.verdict}`;
    audio.playSuccess();
    if (window.setCryptoVisualState) window.setCryptoVisualState("success");

    // Metrics
    document.getElementById("steg-score").textContent = `${report.suspicion_score}%`;
    document.getElementById("steg-chi").textContent = report.chi_square.chi_square_stat;
    document.getElementById("steg-entropy").textContent = report.global_entropy;

    // Bit Plane 0 Display
    if (report.lsb_plane_data_url) {
      const lsbBox = document.getElementById("steg-lsb-preview");
      lsbBox.innerHTML = `<img src="${report.lsb_plane_data_url}" alt="LSB Plane 0" />`;
    }

    // Render Chi-Square Chart using Chart.js
    renderChiChart(report.chi_square.curve_points);
  } catch (err) {
    statusText.textContent = `❌ ${err.message}`;
    audio.playError();
  }
}

function renderChiChart(points) {
  const ctx = document.getElementById("chiChart");
  if (!ctx || typeof Chart === "undefined") return;

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
        legend: { labels: { color: "#e2e8f0", font: { family: "monospace" } } }
      },
      scales: {
        x: { ticks: { color: "#8892b0" }, grid: { color: "rgba(255,255,255,0.05)" } },
        y: { min: 0, max: 1, ticks: { color: "#8892b0" }, grid: { color: "rgba(255,255,255,0.05)" } }
      }
    }
  });
}

// ================= 25+ FORENSIC EFFECTS GALLERY =================

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
    const res = await fetch("/api/effects/apply", {
      method: "POST",
      body: formData
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    outBox.innerHTML = `<img src="${url}" alt="Processed Effect" />`;
    audio.playSuccess();
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
    const res = await fetch("/api/audio/hide", {
      method: "POST",
      body: formData
    });
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
    const res = await fetch("/api/audio/extract", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    const out = document.getElementById("aud-extracted-result");
    if (data.success) {
      out.value = data.text_content;
      audio.playSuccess();
    } else {
      out.value = `❌ ${data.message}`;
      audio.playError();
    }
  } catch (err) {
    alert(err.message);
  }
}
