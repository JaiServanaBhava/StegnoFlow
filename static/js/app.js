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
  setupNavigation();
  setupDropzones();
  loadEffectsGallery();
  setupSoundToggle();
  setupDashboardIngestion();
  setupSplitSlider();
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
        logAudit(`Navigated to module: [${targetId.replace("panel-", "").toUpperCase()}]`);
      }
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
  }
}

// ================= UNIVERSAL DASHBOARD INGESTION =================

let activeDashboardFile = null;

function setupDashboardIngestion() {
  const fileInput = document.getElementById("dash-carrier-file");
  if (!fileInput) return;

  fileInput.addEventListener("change", async () => {
    if (!fileInput.files.length) return;
    activeDashboardFile = fileInput.files[0];
    const previewBox = document.getElementById("dash-carrier-preview");

    document.getElementById("dash-drop-text").textContent = 
      `${activeDashboardFile.name} (${Math.round(activeDashboardFile.size / 1024)} KB)`;

    logAudit(`Ingested carrier: ${activeDashboardFile.name} [Type: ${activeDashboardFile.type || "binary"}]`);

    if (activeDashboardFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewBox.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
      };
      reader.readAsDataURL(activeDashboardFile);
    } else if (activeDashboardFile.type === "application/pdf") {
      previewBox.innerHTML = `<div style="color:var(--magenta);font-size:2rem;text-align:center;">📄<br><span style="font-size:0.8rem;color:var(--text-main)">PDF Document Carrier Ready</span></div>`;
    } else if (activeDashboardFile.type.startsWith("audio/")) {
      previewBox.innerHTML = `<div style="color:var(--cyan);font-size:2rem;text-align:center;">🎵<br><span style="font-size:0.8rem;color:var(--text-main)">PCM WAV Audio Carrier Ready</span></div>`;
    } else {
      previewBox.innerHTML = `<div style="color:var(--amber);font-size:2rem;text-align:center;">📦<br><span style="font-size:0.8rem;color:var(--text-main)">Binary Carrier Ready</span></div>`;
    }

    // Compute cryptographic multi-hashes
    const formData = new FormData();
    formData.append("file", activeDashboardFile);
    try {
      const res = await fetch("/api/tools/hash", { method: "POST", body: formData });
      const hashes = await res.json();
      document.getElementById("dash-hash-sha256").textContent = `SHA-256: ${hashes.sha256}`;
      document.getElementById("dash-hash-md5").textContent = `MD5: ${hashes.md5}`;
      logAudit(`Fingerprint generated: SHA-256=${hashes.sha256.substring(0, 16)}...`);
    } catch (err) {
      console.error(err);
    }
  });
}

async function checkPasswordEntropy(pw) {
  const bar = document.getElementById("entropy-bar");
  const txt = document.getElementById("entropy-text");
  const verdict = document.getElementById("entropy-verdict");
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

async function sanitizeUploadedImage() {
  if (!activeDashboardFile) {
    alert("Please drop an image carrier into the Ingestion Hub first!");
    return;
  }
  const formData = new FormData();
  formData.append("image", activeDashboardFile);
  logAudit("Sanitizing image carrier: Stripping EXIF, GPS, and camera metadata tags...");

  try {
    const res = await fetch("/api/tools/sanitize-image", { method: "POST", body: formData });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const dl = document.getElementById("dash-download-btn");
    dl.href = url;
    dl.download = `sanitized_${activeDashboardFile.name}`;
    dl.style.display = "inline-flex";
    dl.textContent = "⬇️ Download Sanitized Clean Image (No EXIF)";
    audio.playSuccess();
    logAudit("EXIF Sanitization Complete: Image scrubbed of all identifying metadata.");
  } catch (err) {
    alert(err.message);
  }
}

async function executeDashboardHide() {
  if (!activeDashboardFile) {
    alert("Please upload a carrier file first!");
    audio.playError();
    return;
  }
  const secretText = document.getElementById("dash-payload-text").value;
  const pass = document.getElementById("dash-passphrase").value;

  if (!secretText.trim()) {
    alert("Please enter a secret message to embed!");
    audio.playError();
    return;
  }

  if (window.setCryptoVisualState) window.setCryptoVisualState("processing");
  logAudit(`Initiating multi-medium steganographic injection into [${activeDashboardFile.name}]...`);

  const formData = new FormData();
  formData.append("passphrase", pass || "");
  formData.append("secret_text", secretText);

  try {
    if (activeDashboardFile.type.startsWith("image/")) {
      formData.append("carrier", activeDashboardFile);
      formData.append("bits_per_channel", "1");
      formData.append("channels", "RGB");
      formData.append("scatter", "true");

      const res = await fetch("/api/image/hide", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      document.getElementById("dash-result-text").value = 
        `✅ SUCCESS: Payload encrypted with AES-256-GCM and embedded!\nPSNR Stealth: ${data.metadata.psnr_db} dB | SSIM: ${data.metadata.ssim}\nScattered Bits: ${data.metadata.total_bits_written}`;

      const dl = document.getElementById("dash-download-btn");
      dl.href = data.image_data_url;
      dl.download = "stego_carrier.png";
      dl.style.display = "inline-flex";
      dl.textContent = "⬇️ Download Stego Protected Carrier";
    } else if (activeDashboardFile.type === "application/pdf") {
      formData.append("pdf", activeDashboardFile);
      const res = await fetch("/api/pdf/hide", { method: "POST", body: formData });
      if (!res.ok) throw new Error("PDF injection failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      document.getElementById("dash-result-text").value = "✅ SUCCESS: Encrypted payload embedded invisibly into PDF document stream!";
      const dl = document.getElementById("dash-download-btn");
      dl.href = url;
      dl.download = `stego_${activeDashboardFile.name}`;
      dl.style.display = "inline-flex";
      dl.textContent = "⬇️ Download Stego Protected PDF";
    } else if (activeDashboardFile.type.startsWith("audio/")) {
      formData.append("audio", activeDashboardFile);
      const res = await fetch("/api/audio/hide", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      document.getElementById("dash-result-text").value = "✅ SUCCESS: Encrypted payload modulated into WAV PCM audio LSB!";
      const dl = document.getElementById("dash-download-btn");
      dl.href = data.audio_data_url;
      dl.download = "stego_audio.wav";
      dl.style.display = "inline-flex";
      dl.textContent = "⬇️ Download Stego Protected WAV Audio";
    }

    audio.playSuccess();
    if (window.setCryptoVisualState) window.setCryptoVisualState("success");
    logAudit("Steganographic payload embedding successfully verified.");
  } catch (err) {
    audio.playError();
    if (window.setCryptoVisualState) window.setCryptoVisualState("error");
    document.getElementById("dash-result-text").value = `❌ Error: ${err.message}`;
    logAudit(`Error during injection: ${err.message}`);
  }
}

async function executeDashboardExtract() {
  if (!activeDashboardFile) {
    alert("Please upload a stego carrier to extract from!");
    audio.playError();
    return;
  }
  const pass = document.getElementById("dash-passphrase").value;
  if (window.setCryptoVisualState) window.setCryptoVisualState("processing");
  logAudit(`Scanning carrier [${activeDashboardFile.name}] for embedded signatures...`);

  const formData = new FormData();
  formData.append("passphrase", pass || "");

  try {
    let resultText = "";
    if (activeDashboardFile.type.startsWith("image/")) {
      formData.append("stego_image", activeDashboardFile);
      formData.append("bits_per_channel", "1");
      formData.append("channels", "RGB");
      formData.append("scatter", "true");

      const res = await fetch("/api/image/extract", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        resultText = `🔓 EXTRACTED CONFIDENTIAL CONTENT:\n${data.text_content || "[Binary Payload]"}\n\n[Status: ${data.message}]`;
        audio.playSuccess();
        if (window.setCryptoVisualState) window.setCryptoVisualState("success");
      } else {
        resultText = `❌ Extraction Failed: ${data.message}`;
        audio.playError();
        if (window.setCryptoVisualState) window.setCryptoVisualState("error");
      }
    } else if (activeDashboardFile.type === "application/pdf") {
      formData.append("pdf", activeDashboardFile);
      const res = await fetch("/api/pdf/extract", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        resultText = `🔓 EXTRACTED FROM PDF:\n${data.text_content}`;
        audio.playSuccess();
        if (window.setCryptoVisualState) window.setCryptoVisualState("success");
      } else {
        resultText = `❌ PDF Extraction Failed: ${data.message}`;
        audio.playError();
        if (window.setCryptoVisualState) window.setCryptoVisualState("error");
      }
    } else if (activeDashboardFile.type.startsWith("audio/")) {
      formData.append("audio", activeDashboardFile);
      const res = await fetch("/api/audio/extract", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        resultText = `🔓 EXTRACTED FROM AUDIO:\n${data.text_content}`;
        audio.playSuccess();
        if (window.setCryptoVisualState) window.setCryptoVisualState("success");
      } else {
        resultText = `❌ Audio Extraction Failed: ${data.message}`;
        audio.playError();
        if (window.setCryptoVisualState) window.setCryptoVisualState("error");
      }
    }

    document.getElementById("dash-result-text").value = resultText;
    logAudit(resultText.split("\n")[0]);
  } catch (err) {
    audio.playError();
    document.getElementById("dash-result-text").value = `❌ Error: ${err.message}`;
  }
}

// ================= PDF STEGANOGRAPHY =================

async function executePdfHide() {
  const file = document.getElementById("pdf-carrier-file").files[0];
  const text = document.getElementById("pdf-hide-text").value;
  const pass = document.getElementById("pdf-hide-pass").value;

  if (!file || !text.trim()) {
    alert("Please provide carrier PDF and secret payload!");
    return;
  }

  const formData = new FormData();
  formData.append("pdf", file);
  formData.append("secret_text", text);
  if (pass) formData.append("passphrase", pass);

  try {
    const res = await fetch("/api/pdf/hide", { method: "POST", body: formData });
    if (!res.ok) throw new Error("PDF hide failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stego_${file.name}`;
    a.click();
    audio.playSuccess();
    logAudit(`PDF payload injected into ${file.name}`);
  } catch (err) {
    alert(err.message);
  }
}

async function executePdfExtract() {
  const file = document.getElementById("pdf-extract-file").files[0];
  const pass = document.getElementById("pdf-extract-pass").value;

  if (!file) {
    alert("Please select a PDF file!");
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
      out.value = data.text_content;
      audio.playSuccess();
      logAudit("Extracted payload from PDF carrier.");
    } else {
      out.value = `❌ ${data.message}`;
      audio.playError();
    }
  } catch (err) {
    alert(err.message);
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
    const res = await fetch("/api/image/hide", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Encoding failed.");

    statusText.textContent = "✅ Stego Image Ready (Zero Visual Degradation)";
    audio.playSuccess();
    if (window.setCryptoVisualState) window.setCryptoVisualState("success");

    const outBox = document.getElementById("img-hide-out-preview");
    outBox.innerHTML = `<img src="${data.image_data_url}" alt="Stego Output" />`;

    const dlBtn = document.getElementById("img-hide-download");
    dlBtn.href = data.image_data_url;
    dlBtn.download = "stegoflow_encoded.png";
    dlBtn.style.display = "inline-flex";

    document.getElementById("metric-psnr").textContent = `${data.metadata.psnr_db} dB`;
    document.getElementById("metric-ssim").textContent = data.metadata.ssim;
    document.getElementById("metric-rate").textContent = `${data.metadata.embedding_rate_percent}%`;
    logAudit(`Image stego generated with PSNR ${data.metadata.psnr_db} dB.`);
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
    const res = await fetch("/api/image/extract", { method: "POST", body: formData });
    const data = await res.json();

    if (data.success) {
      audio.playSuccess();
      if (window.setCryptoVisualState) window.setCryptoVisualState("success");
      outArea.value = data.text_content || `[Extracted Binary Payload (${data.byte_length} bytes)]`;
      logAudit("Image payload extracted and AEAD signature verified.");
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

    renderChiChart(report.chi_square.curve_points);
    logAudit(`Steganalysis completed: Suspicion ${report.suspicion_score}%.`);
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
