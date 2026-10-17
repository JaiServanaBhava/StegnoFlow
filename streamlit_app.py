"""
StegnoFlow - Streamlit Companion Application
Specifically tailored for Academic Lab Demonstrations, Viva Evaluations,
and College Syllabus Requirements (JNTUK R23 CyberSecurity Project 20).
Tech Stack: Python, PIL/Pillow, NumPy, Streamlit, Matplotlib.
"""

import io
import streamlit as st
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image

from core.crypto import encrypt_payload, decrypt_payload
from core.image_stego import hide_in_image, extract_from_image, calculate_capacity
from core.steganalysis import (
    run_comprehensive_steganalysis,
    compute_psnr_mse,
    extract_bit_plane,
    chi_square_attack,
    histogram_pov_analysis
)
from core.text_stego import hide_text_in_text, extract_text_from_text, detect_homoglyphs
from core.audio_stego import hide_in_audio, extract_from_audio, get_audio_capacity
from core.effects import apply_effect, EFFECTS_LIST

# Page Configuration
st.set_page_config(
    page_title="StegnoFlow | Dual Steganography & Forensic Steganalysis",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Cyber CSS styling
st.markdown("""
<style>
    .reportview-container {
        background: #0b0f19;
    }
    .main-header {
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(90deg, #00f2fe 0%, #4facfe 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0px;
    }
    .sub-header {
        color: #8892b0;
        font-size: 1rem;
        margin-bottom: 25px;
    }
    .metric-box {
        background: rgba(16, 26, 46, 0.7);
        border: 1px solid rgba(0, 242, 254, 0.2);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
    }
</style>
""", unsafe_allow_html=True)

st.markdown("<div class='main-header'>🛡️ StegnoFlow: Dual Steganography & Forensic Suite</div>", unsafe_allow_html=True)
st.markdown("<div class='sub-header'>Project 20 — Hide & Detect Secret Messages | Cyber Security U2 + Python U1/U2</div>", unsafe_allow_html=True)

# Navigation
menu = st.sidebar.radio(
    "Navigation Menu",
    [
        "1. Image Steganography (LSB & PRNG)",
        "2. Forensic Steganalysis Lab (Chi-Square & PoV)",
        "3. 25+ Forensic Effects Gallery",
        "4. Invisible Zero-Width Text Stego",
        "5. Audio WAV Steganography",
        "6. JNTUK Project 20 Syllabus Guide & Viva Q&A"
    ]
)

# ================= 1. IMAGE STEGANOGRAPHY =================
if menu == "1. Image Steganography (LSB & PRNG)":
    st.subheader("🖼️ Image Steganography: LSB Encoder & Decoder")
    
    tab1, tab2 = st.tabs(["🔒 Hide Secret Message", "🔓 Extract Secret Message"])
    
    with tab1:
        st.markdown("##### Carrier Image Upload & Encoding Settings")
        col1, col2 = st.columns([1, 1])
        
        with col1:
            uploaded_carrier = st.file_uploader("Upload Carrier Image (PNG/JPG)", type=["png", "jpg", "jpeg"], key="carrier_up")
            if uploaded_carrier:
                carrier_img = Image.open(uploaded_carrier)
                st.image(carrier_img, caption="Carrier Preview", use_container_width=True)
                cap = calculate_capacity(carrier_img, bits_per_channel=1)
                st.info(f"📏 Dimensions: {cap['width']}x{cap['height']} | 📦 Max 1-bit LSB Capacity: **{cap['max_capacity_kb']} KB**")

        with col2:
            st.markdown("##### Secret Payload Configuration")
            payload_type = st.radio("Payload Type", ["Secret Text", "Secret File"], horizontal=True)
            secret_data = b""
            if payload_type == "Secret Text":
                text_input = st.text_area("Enter Confidential Message", "TOP SECRET: Infiltration coordinates 48.8584, 2.2945 confirmed.")
                secret_data = text_input.encode("utf-8")
            else:
                up_file = st.file_uploader("Select Any Secret File (PDF/TXT/ZIP/DOCX)", key="sec_file")
                if up_file:
                    secret_data = up_file.read()
                    st.caption(f"File size: {len(secret_data)} bytes")

            passphrase = st.text_input("AES-256-GCM Password (Optional for authenticated encryption)", type="password")
            
            c_bits, c_channels = st.columns(2)
            with c_bits:
                bits = st.selectbox("Bits per Channel", [1, 2, 4], index=0, help="1 bit = highest stealth; 4 bits = maximum capacity")
            with c_channels:
                channels = st.selectbox("Color Channels", ["RGB", "R", "G", "B", "RG"], index=0)
            
            scatter = st.checkbox("PRNG Keystream Spatial Scattering (Prevents sequential detection)", value=True)

            if st.button("🚀 Encode & Generate Stego Image", type="primary", use_container_width=True):
                if not uploaded_carrier:
                    st.error("Please upload a carrier image first.")
                elif not secret_data:
                    st.error("Please provide a secret payload.")
                else:
                    try:
                        with st.spinner("Encrypting and embedding payload..."):
                            stego_img, meta = hide_in_image(
                                carrier_img,
                                secret_data,
                                passphrase=passphrase if passphrase else None,
                                bits_per_channel=bits,
                                channels=channels,
                                scatter=scatter
                            )
                            psnr = compute_psnr_mse(carrier_img, stego_img)

                        st.success("Embedding complete!")
                        
                        m_col1, m_col2, m_col3 = st.columns(3)
                        m_col1.metric("PSNR Stealth Score", f"{psnr['psnr']} dB", "Excellent (>50dB)")
                        m_col2.metric("SSIM Structure Index", f"{psnr['ssim_approx']}")
                        m_col3.metric("Capacity Used", f"{meta['embedding_rate_percent']}%")

                        buf = io.BytesIO()
                        stego_img.save(buf, format="PNG")
                        st.download_button(
                            label="⬇️ Download Stego Image (Lossless PNG)",
                            data=buf.getvalue(),
                            file_name="stegoflow_encoded.png",
                            mime="image/png",
                            use_container_width=True
                        )
                        st.image(stego_img, caption="Stego Output Image (Imperceptible)", use_container_width=True)
                    except Exception as e:
                        st.error(f"Error during encoding: {str(e)}")

    with tab2:
        st.markdown("##### Extract & Decrypt Secret Payload")
        up_stego = st.file_uploader("Upload Stego Image (PNG)", type=["png"], key="stego_extr")
        ex_pass = st.text_input("Decryption Password (if encrypted)", type="password", key="extr_pass")
        
        c1, c2 = st.columns(2)
        with c1:
            ex_bits = st.selectbox("Bits per Channel Used", [1, 2, 4], index=0, key="ex_bits")
        with c2:
            ex_chan = st.selectbox("Channels Used", ["RGB", "R", "G", "B", "RG"], index=0, key="ex_chan")
            
        ex_scatter = st.checkbox("Scattered Mode (PRNG enabled)", value=True, key="ex_scat")

        if st.button("🔍 Extract & Decrypt Payload", type="primary"):
            if not up_stego:
                st.error("Please upload a stego image.")
            else:
                with st.spinner("Extracting bitstream..."):
                    img_in = Image.open(up_stego)
                    success, raw_bytes, msg = extract_from_image(
                        img_in,
                        passphrase=ex_pass if ex_pass else None,
                        bits_per_channel=ex_bits,
                        channels=ex_chan,
                        scatter=ex_scatter
                    )

                if success:
                    st.success(f"Success: {msg}")
                    try:
                        text_val = raw_bytes.decode("utf-8")
                        st.text_area("Extracted Secret Message", text_val, height=150)
                    except UnicodeDecodeError:
                        st.warning("Binary file payload detected.")
                        st.download_button(
                            "⬇️ Download Extracted File Payload",
                            data=raw_bytes,
                            file_name="extracted_secret_payload.bin",
                            mime="application/octet-stream"
                        )
                else:
                    st.error(f"Extraction failed: {msg}")

# ================= 2. FORENSIC STEGANALYSIS LAB =================
elif menu == "2. Forensic Steganalysis Lab (Chi-Square & PoV)":
    st.subheader("🔬 Statistical Steganalysis Lab (Industry Intelligence Training)")
    st.markdown("""
    *As specified in Syllabus Cyber Security U2:* Analysts detect hidden content using pixel-level statistical analysis,
    Chi-Square probability test on Pairs of Values (PoVs), and histogram equalization differentials.
    """)

    sample_target = st.file_uploader("Upload Target Image to Inspect", type=["png", "jpg", "jpeg"], key="steg_inspect")
    orig_target = st.file_uploader("Upload Suspected Original Carrier (Optional - for differential comparison)", type=["png", "jpg", "jpeg"], key="orig_inspect")

    if sample_target:
        target_img = Image.open(sample_target)
        c1, c2 = st.columns([1, 1])
        with c1:
            st.image(target_img, caption="Investigated Target", use_container_width=True)

        with c2:
            with st.spinner("Running statistical analysis algorithms..."):
                report = run_comprehensive_steganalysis(target_img)
            
            score = report["suspicion_score"]
            risk = report["risk_level"]
            
            st.markdown(f"### Forensic Verdict: **{report['verdict']}**")
            st.progress(score / 100.0)
            st.metric("Suspicion Index", f"{score}%", f"Risk: {risk}")
            st.info(f"**Analyst Notes:** {report['analyst_notes']}")

        st.markdown("---")
        st.markdown("#### 1. Chi-Square ($\chi^2$) Attack Analysis (Westfeld & Pfitzmann)")
        
        chi = report["chi_square"]
        col_c1, col_c2, col_c3 = st.columns(3)
        col_c1.metric("Chi-Square Statistic", f"{chi['chi_square_stat']}")
        col_c2.metric("Degrees of Freedom", f"{chi['degrees_of_freedom']}")
        col_c3.metric("Stego Probability", f"{round(chi['stego_probability'] * 100, 2)}%")

        # Matplotlib Chi-Square Curve
        fig, ax = plt.subplots(figsize=(10, 3.5), facecolor="#0e1626")
        ax.set_facecolor("#0e1626")
        
        pts = chi["curve_points"]
        x_pct = [p["percentage"] for p in pts]
        y_prob = [p["stego_probability"] for p in pts]
        
        ax.plot(x_pct, y_prob, marker='o', color='#00f2fe', linewidth=2, label="Calculated LSB Stego Probability")
        ax.axhline(0.65, color='#ff007f', linestyle='--', label="Suspicion Threshold (65%)")
        ax.set_xlabel("Pixel Trajectory Scanning (%)", color="#a0aec0")
        ax.set_ylabel("Probability of Steganography", color="#a0aec0")
        ax.tick_params(colors="#a0aec0")
        ax.grid(True, linestyle=":", alpha=0.3, color="#4facfe")
        ax.legend(facecolor="#1a202c", edgecolor="#4facfe", labelcolor="#e2e8f0")
        ax.set_title("Westfeld-Pfitzmann Chi-Square Sequential Probability Curve", color="#e2e8f0")
        st.pyplot(fig)

        st.markdown("---")
        st.markdown("#### 2. Pairs of Values (PoV) Histogram Analysis")
        pov = report["pov_histogram"]
        
        p_c1, p_c2, p_c3 = st.columns(3)
        for i, (cname, col) in enumerate(zip(["Red", "Green", "Blue"], [p_c1, p_c2, p_c3])):
            data = pov[cname]
            col.markdown(f"**{cname} Channel**")
            col.write(f"- Mean PoV Disparity: `{data['mean_disparity']}`")
            col.write(f"- Equalization Index: `{data['equalization_index']}`")

        st.markdown("---")
        st.markdown("#### 3. Bit-Plane Slicing (Plane 0 vs Plane 7)")
        s1, s2 = st.columns(2)
        with s1:
            plane0 = extract_bit_plane(target_img, plane=0, channel="R")
            st.image(plane0, caption="Bit Plane 0 (LSB - Least Significant Bit)", use_container_width=True)
            st.caption("Pure random noise in Plane 0 confirms LSB manipulation.")
        with s2:
            plane7 = extract_bit_plane(target_img, plane=7, channel="R")
            st.image(plane7, caption="Bit Plane 7 (MSB - Most Significant Bit)", use_container_width=True)
            st.caption("MSB contains primary visual structure and edge contours.")

        if orig_target:
            st.markdown("---")
            st.markdown("#### 4. Ground-Truth Degradation Comparison (Original vs Stego)")
            orig_img = Image.open(orig_target)
            if orig_img.size == target_img.size:
                comp = compute_psnr_mse(orig_img, target_img)
                cc1, cc2, cc3 = st.columns(3)
                cc1.metric("Peak Signal-to-Noise Ratio (PSNR)", f"{comp['psnr']} dB")
                cc2.metric("Mean Squared Error (MSE)", f"{comp['mse']}")
                cc3.metric("Structural Similarity (SSIM)", f"{comp['ssim_approx']}")
            else:
                st.warning("Original and target image dimensions must match for PSNR comparison.")

# ================= 3. 25+ FORENSIC EFFECTS GALLERY =================
elif menu == "3. 25+ Forensic Effects Gallery":
    st.subheader("🎨 25+ Scientific, Forensic & Steganographic Effects")
    st.markdown("Apply real mathematical transformations to uncover hidden tampering, noise residuals, and frequency anomalies.")

    effect_img_up = st.file_uploader("Upload Image for Forensic Filter Application", type=["png", "jpg", "jpeg"], key="fx_up")
    
    if effect_img_up:
        img_fx = Image.open(effect_img_up)
        
        effect_choice = st.selectbox(
            "Select Forensic / Visual Filter",
            [f"{eff['id']} — {eff['name']} ({eff['category']})" for eff in EFFECTS_LIST]
        )
        selected_id = effect_choice.split(" — ")[0]
        selected_info = next(e for e in EFFECTS_LIST if e["id"] == selected_id)
        
        st.info(f"**{selected_info['name']}**: {selected_info['desc']}")
        
        col_orig, col_fx = st.columns(2)
        with col_orig:
            st.image(img_fx, caption="Original Input", use_container_width=True)
        with col_fx:
            with st.spinner("Processing filter..."):
                processed_img = apply_effect(img_fx, selected_id)
            st.image(processed_img, caption=f"Processed: {selected_info['name']}", use_container_width=True)
            
            buf = io.BytesIO()
            processed_img.save(buf, format="PNG")
            st.download_button(
                "⬇️ Download Forensic Render (PNG)",
                data=buf.getvalue(),
                file_name=f"forensic_{selected_id}.png",
                mime="image/png"
            )

# ================= 4. INVISIBLE ZERO-WIDTH TEXT STEGO =================
elif menu == "4. Invisible Zero-Width Text Stego":
    st.subheader("📝 Invisible Text Steganography (Zero-Width Characters)")
    st.markdown("""
    Hides encrypted secret binary messages completely invisibly inside ordinary plain text
    using Unicode Zero-Width spaces (`\\u200B`, `\\u200C`, `\\u200D`, `\\uFEFF`).
    The resulting text can be copied, pasted, and shared across emails, chats, or social media!
    """)

    t_tab1, t_tab2, t_tab3 = st.tabs(["🔒 Hide Secret in Text", "🔓 Extract from Text", "🕵️ Homoglyph Inspector"])

    with t_tab1:
        c_text = st.text_area("Innocent Cover Text", "The university project exhibition is scheduled for next Monday. All teams must submit their documentation on time.")
        s_text = st.text_input("Secret Confidential Message", "CONFIDENTIAL: Transfer protocol access key 9871-AF-2026.")
        t_pass = st.text_input("AES-256-GCM Password (Optional)", type="password", key="t_pass")
        
        if st.button("✨ Inject Invisible Message", type="primary"):
            if not s_text:
                st.error("Please enter a secret message.")
            else:
                stego_txt, meta = hide_text_in_text(c_text, s_text, t_pass if t_pass else None)
                st.success("Secret message embedded invisibly!")
                st.write(f"- Zero-width characters injected: `{meta['zero_width_chars_injected']}`")
                st.write(f"- Visible text appearance length: `{meta['visible_char_length']}` characters")
                st.text_area("Output Stego Text (Copy this text - secret is invisible inside!):", stego_txt, height=120)

    with t_tab2:
        in_stego = st.text_area("Paste Stego Text Containing Invisible Message:", "")
        t_extr_pass = st.text_input("Decryption Password (if encrypted)", type="password", key="t_extr_pass")
        
        if st.button("🔍 Extract Invisible Message", type="primary"):
            if not in_stego:
                st.error("Please paste stego text.")
            else:
                success, secret, msg = extract_text_from_text(in_stego, t_extr_pass if t_extr_pass else None)
                if success:
                    st.success(f"Success: {msg}")
                    st.text_area("Decrypted Secret Message", secret, height=100)
                else:
                    st.error(f"Failed: {msg}")

    with t_tab3:
        st.markdown("##### Unicode Homoglyph & Zero-Width Detector")
        txt_inspect = st.text_area("Enter text to scan for obfuscation:", "The cаt is resting.")
        if st.button("Scan for Obfuscation"):
            res = detect_homoglyphs(txt_inspect)
            st.write(f"Verdict: **{res['verdict']}**")
            st.write(f"Zero-width characters detected: `{res['zero_width_chars_count']}`")
            st.write(f"Homoglyphs detected: `{res['homoglyph_count']}`")
            if res["has_homoglyphs"]:
                st.json(res["homoglyphs"])

# ================= 5. AUDIO WAV STEGANOGRAPHY =================
elif menu == "5. Audio WAV Steganography":
    st.subheader("🎵 Audio Steganography (WAV PCM LSB)")
    st.markdown("Embeds encrypted secret messages inside 16-bit PCM WAV audio samples with zero audible degradation.")

    aud_up = st.file_uploader("Upload 16-bit PCM WAV Audio File", type=["wav"], key="aud_up")
    if aud_up:
        aud_bytes = aud_up.read()
        cap_aud = get_audio_capacity(aud_bytes)
        st.info(f"Duration: {cap_aud['duration_seconds']}s | Channels: {cap_aud['channels']} | Max Capacity: **{cap_aud['max_capacity_kb']} KB**")
        st.audio(aud_bytes, format="audio/wav")

        aud_msg = st.text_input("Secret Message for Audio Carrier", "Agent 007 payload confirmed at rendezvous point.")
        aud_pass = st.text_input("AES Password for Audio Payload", type="password", key="aud_pass")

        if st.button("🎙️ Embed Secret in Audio", type="primary"):
            try:
                stego_aud, a_meta = hide_in_audio(aud_bytes, aud_msg.encode("utf-8"), aud_pass if aud_pass else None)
                st.success("Secret message embedded into audio waveform!")
                st.metric("Audio Samples Modified", f"{a_meta['bits_embedded']} / {a_meta['total_audio_samples']}")
                st.audio(stego_aud, format="audio/wav")
                st.download_button("⬇️ Download Stego Audio (WAV)", data=stego_aud, file_name="stego_carrier.wav", mime="audio/wav")
            except Exception as e:
                st.error(f"Audio embedding error: {str(e)}")

# ================= 6. JNTUK SYLLABUS GUIDE & VIVA Q&A =================
elif menu == "6. JNTUK Project 20 Syllabus Guide & Viva Q&A":
    st.subheader("🎓 JNTUK R23 CyberSecurity Project 20 Reference & Viva Guide")
    st.markdown("""
    ### Project Overview
    - **Title:** 20 Steganography Tool — Hide & Detect Secret Messages
    - **Syllabus Units:** Cyber Security U2 (Steganography) | Python U1+U2 (Data types, File ops, Functions)
    - **Industry Problem:** An intelligence training institute needs to teach analysts how criminals hide messages inside innocent-looking images and how to detect hidden content using pixel-level statistical analysis.
    - **What Students Learn:** LSB steganography technique; steganalysis via histogram analysis; PIL image manipulation.
    - **Tech Stack:** Python, PIL/Pillow, NumPy, Streamlit, Matplotlib.
    - **Expected Output:** Dual steganography tool — image message encoder + statistical hidden-message detector.

    ---
    ### 🎯 Comprehensive Viva Q&A for Judges
    **Q1: What is LSB steganography and how does it work?**
    *A:* Least Significant Bit (LSB) steganography modifies the lowest order bit(s) of pixel color values (0–255). Because changing the 0th bit alters the color intensity by at most $\pm 1$ part in 256 ($\approx 0.39\%$), the human visual system (HVS) cannot perceive the modification.

    **Q2: How does Chi-Square ($\chi^2$) steganalysis detect LSB steganography?**
    *A:* In natural unedited images, adjacent pixel values (Pairs of Values: $2k$ and $2k+1$) have distinct frequencies. When sequential LSB steganography occurs, 0s and 1s are replaced uniformly by message bits, causing the counts of $2k$ and $2k+1$ to equalize. The Chi-Square test measures this deviation from natural disparity. As p-value approaches 1.0, steganography presence is statistically confirmed.

    **Q3: How does StegnoFlow prevent sequential LSB detection?**
    *A:* StegnoFlow implements **PRNG Keystream Spatial Permutation**. Instead of modifying pixels sequentially from top-left to bottom-right, the pixel coordinates are scattered pseudo-randomly across the entire carrier using a seed derived from the user's secret passkey.

    **Q4: What encryption is applied to the payload before embedding?**
    *A:* Military-grade **AES-256-GCM** (Galois/Counter Mode) authenticated encryption with PBKDF2 key derivation (200,000 iterations) and 12-byte random IV. Even if an adversary extracts the raw embedded bits, they cannot read or tamper with the payload without the key.
    """)
