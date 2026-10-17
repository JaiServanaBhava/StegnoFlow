<div align="center">

  <!-- Project Logo -->
  <img src="watermarked_img_2113765465483755682.png" alt="StegnoFlow Shield Logo" width="280"/>

  # 🛡️ StegnoFlow
  ### Dual Steganography & Forensic Steganalysis Suite
  *JNTUK R23 Cyber Security — Project 20: Steganography Tool (Hide & Detect Secret Messages)*

  <!-- Row 1: Core Technologies & Badges -->
  [![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
  [![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![Streamlit](https://img.shields.io/badge/Academic%20UI-Streamlit-FF4B4B.svg?style=for-the-badge&logo=streamlit&logoColor=white)](https://streamlit.io/)
  [![Three.js](https://img.shields.io/badge/3D%20Frontend-Three.js%20WebGL-black.svg?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)

  <!-- Row 2: Status & Maintenance -->
  [![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg?style=for-the-badge&logo=github-actions&logoColor=white)](#-quick-start-local-setup)
  [![Security](https://img.shields.io/badge/Security-AES--256--GCM-red.svg?style=for-the-badge&logo=shield&logoColor=white)](#-12-unique-professional--cursed-features)
  [![Deploy](https://img.shields.io/badge/Deploy-Render.com-46E3B7.svg?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
  [![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📋 Academic Syllabus Alignment (JNTUK R23 Project 20)

| Field | Syllabus Specification |
| :--- | :--- |
| **Project Number** | **20: Steganography Tool — Hide & Detect Secret Messages** |
| **Syllabus Units** | **Cyber Security U2 — Steganography** \| **Python U1+U2 — Data types, file ops, functions** |
| **Industry Problem** | An intelligence training institute needs to teach analysts how criminals hide messages inside innocent-looking images and how to detect hidden content using pixel-level statistical analysis. |
| **What Students Learn** | LSB steganography technique; steganalysis via histogram analysis; PIL image manipulation. |
| **Tech Stack** | Python, PIL/Pillow, NumPy, Streamlit, Matplotlib, OpenCV, Cryptography. |
| **Expected Output** | **Dual steganography tool** — image message encoder + statistical hidden-message detector. |

---

## 🌟 12+ Unique, Professional & "Cursed" Features

1. **Dual Core Architecture (Encoder + Detector)**: Complete end-to-end embedding and forensic detection pipeline.
2. **Military-Grade AES-256-GCM Encryption**: All payloads are encrypted using AES-256-GCM with PBKDF2 (200,000 rounds) key derivation, 16-byte salt, and 12-byte nonce before carrier injection.
3. **PRNG Spatial Permutation Scattering**: Evades traditional sequential LSB inspection by pseudo-randomly scattering bit coordinates across the carrier using a deterministic cryptographic keystream.
4. **Configurable LSB Bit Depths & Color Channels**: 1-bit, 2-bit, or 4-bit LSB per pixel; selectable across Red, Green, Blue, or all RGB channels.
5. **Westfeld & Pfitzmann Chi-Square ($\chi^2$) Steganalysis Attack**: Evaluates Pairs of Values (PoVs $2k$ vs $2k+1$) and computes continuous $p$-value trajectory curves.
6. **Ground-Truth Degradation Telemetry**: Real-time calculations of Peak Signal-to-Noise Ratio (PSNR > 65 dB), Mean Squared Error (MSE), and Structural Similarity Index (SSIM).
7. **26 Scientific & Forensic Effects Gallery**: Real-time mathematical image operators including Bit Plane 0 (LSB Slicer), Bit Plane 7 (MSB Slicer), 2D Fast Fourier Transform (FFT) spectrum, Discrete Cosine Transform (DCT) energy, Laplacian high-pass, Error Level Analysis (ELA 90%), and Thermal false-color.
8. **Invisible Zero-Width Text Steganography**: Encodes encrypted secrets into invisible Unicode spaces (`\u200B`, `\u200C`, `\u200D`, `\uFEFF`) hidden inside ordinary public sentences for copy-pasting across social media and email.
9. **Cyrillic Homoglyph Obfuscation Scanner & Generator**: Detects and crafts visually identical Unicode lookalikes (`a` vs `\u0430`) for evasion and anti-detection analysis.
10. **Audio WAV PCM LSB Steganography**: Hides confidential data directly inside 16-bit uncompressed WAV PCM audio waveforms with zero audible distortion.
11. **Polyglot & File-Carving EOF Injection**: Appends authenticated file archives past JPEG EOI (`\xFF\xD9`) and PNG IEND markers; files open normally in image viewers while preserving payloads.
12. **3D WebGL Holographic Cyber HUD**: Interactive 3D rotating cryptographic lattice powered by Three.js and real-time Web Audio API procedural sound synthesizers.
13. **Dual Delivery Modes**:
    - `python app.py`: High-performance FastAPI server serving the 3D Cyberpunk HUD (ideal for Render and cloud hosting).
    - `streamlit run streamlit_app.py`: Native Streamlit companion app tailored directly for academic viva presentations.

---

## 🏗️ Architecture & Pipeline

```mermaid
flowchart TD
    subgraph Multi_Medium_Carriers["1. Multi-Medium Carriers"]
        A1["Image (PNG / JPEG)"]
        A2["Audio (WAV 16-bit PCM)"]
        A3["Plain Text (ASCII/Unicode)"]
        A4["Polyglot Files (ZIP/PDF/EXE)"]
    end

    subgraph Security_Engine["2. Cryptographic Pre-Processing"]
        B1["Input Payload (Secret Text / File)"]
        B2["PBKDF2 Key Derivation (200,000 Rounds)"]
        B3["AES-256-GCM AEAD Encryption + IV + Salt"]
        B1 --> B2 --> B3
    end

    subgraph Spatial_Distribution["3. Spatial & Frequency Embedding"]
        C1["PRNG Keystream Permutation Scattering"]
        C2["Multi-Bit LSB Injection (1, 2, 4 bits)"]
        C3["Zero-Width Invisible Codepoints (\\u200B, \\u200C)"]
        C4["PCM Audio Sample LSB Modulation"]
        B3 --> C1 --> C2
        B3 --> C3
        B3 --> C4
    end

    subgraph Forensic_Steganalysis["4. Forensic Detection & Analysis Lab"]
        D1["Westfeld & Pfitzmann Chi-Square (χ²) Attack"]
        D2["Pairs-of-Values (PoV) Equalization Differential"]
        D3["Bit-Plane 0 (LSB Slicer) & Shannon Entropy Map"]
        D4["PSNR, MSE & SSIM Ground-Truth Metrics"]
        D5["26 Forensic & Visual Effects Filters"]
    end

    Multi_Medium_Carriers --> Security_Engine
    C2 --> Forensic_Steganalysis
    C3 --> Forensic_Steganalysis
    C4 --> Forensic_Steganalysis
