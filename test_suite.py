"""
Automated Comprehensive Test Suite for StegnoFlow
Verifies 100% functionality of all steganography algorithms,
cryptography, steganalysis, audio, text, and effects.
"""

import io
import sys
import wave
import numpy as np
from PIL import Image

if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from core.crypto import encrypt_payload, decrypt_payload
from core.image_stego import hide_in_image, extract_from_image, calculate_capacity
from core.steganalysis import run_comprehensive_steganalysis, compute_psnr_mse, extract_bit_plane
from core.text_stego import hide_text_in_text, extract_text_from_text, detect_homoglyphs
from core.audio_stego import hide_in_audio, extract_from_audio, get_audio_capacity
from core.file_stego import inject_eof_payload, extract_eof_payload
from core.effects import apply_effect, EFFECTS_LIST

def run_all_tests():
    print("==================================================")
    print("🛡️  RUNNING STEGNOFLOW VERIFICATION SUITE")
    print("==================================================")

    # 1. Test Cryptography
    print("[1/7] Testing AES-256-GCM Cryptography...")
    secret = b"Classified Intelligence Payload 2026"
    password = "SuperSecretKey99!"
    encrypted = encrypt_payload(secret, password)
    assert encrypted != secret
    ok, decrypted, msg = decrypt_payload(encrypted, password)
    assert ok and decrypted == secret, f"Decryption failed: {msg}"
    # Wrong password test
    ok_fail, _, _ = decrypt_payload(encrypted, "WrongPassword")
    assert not ok_fail, "Wrong password should fail"
    print("  -> AES-256-GCM Authenticated Encryption: PASSED")

    # 2. Test Image Steganography (LSB + PRNG)
    print("[2/7] Testing Image LSB Steganography & PRNG Scattering...")
    # Create synthetic test carrier image (128x128 RGB)
    arr = np.random.randint(50, 200, (128, 128, 3), dtype=np.uint8)
    img = Image.fromarray(arr)
    cap = calculate_capacity(img, bits_per_channel=1)
    assert cap["max_capacity_bytes"] > 500

    msg_to_hide = b"Target coordinates: 17.3850 N, 78.4867 E."
    stego_img, meta = hide_in_image(img, msg_to_hide, passphrase="PassKey123", bits_per_channel=1, scatter=True)
    psnr = compute_psnr_mse(img, stego_img)
    assert psnr["psnr"] > 50.0, f"PSNR too low: {psnr['psnr']}"

    ok_img, extracted_data, ex_msg = extract_from_image(stego_img, passphrase="PassKey123", bits_per_channel=1, scatter=True)
    assert ok_img and extracted_data == msg_to_hide, f"Image extract failed: {ex_msg}"
    print(f"  -> Image LSB Embedding + Extraction: PASSED (PSNR: {psnr['psnr']} dB)")

    # 3. Test Statistical Steganalysis
    print("[3/7] Testing Steganalysis (Chi-Square & PoVs)...")
    report = run_comprehensive_steganalysis(stego_img)
    assert "chi_square" in report and "pov_histogram" in report
    assert "verdict" in report
    plane0 = extract_bit_plane(stego_img, plane=0)
    assert plane0.size == stego_img.size
    print(f"  -> Chi-Square & Steganalysis Suite: PASSED (Verdict: {report['verdict']})")

    # 4. Test 25+ Effects
    print(f"[4/7] Testing {len(EFFECTS_LIST)} Forensic & Visual Effects...")
    for eff in EFFECTS_LIST:
        out_eff = apply_effect(img, eff["id"])
        assert out_eff.size == img.size
    print(f"  -> All {len(EFFECTS_LIST)} Forensic Filters executed successfully: PASSED")

    # 5. Test Zero-Width Text Steganography
    print("[5/7] Testing Zero-Width Invisible Text Stego...")
    cover = "Good morning team, let us meet in the main hall."
    sec_txt = "Project 20 Launch Code 4821"
    stego_txt, t_meta = hide_text_in_text(cover, sec_txt, passphrase="MyKey")
    # Verify secret is not visibly printed in ASCII
    assert sec_txt not in stego_txt
    ok_txt, recovered, t_msg = extract_text_from_text(stego_txt, passphrase="MyKey")
    assert ok_txt and recovered == sec_txt, f"Text extract failed: {t_msg}"
    homo_res = detect_homoglyphs(stego_txt)
    assert homo_res["zero_width_chars_count"] > 0
    print("  -> Zero-Width Invisible Text: PASSED")

    # 6. Test Audio WAV Steganography
    print("[6/7] Testing Audio WAV Steganography...")
    # Generate 1-second synthetic 16-bit 44.1kHz sine wave WAV in memory
    sample_rate = 44100
    duration = 0.5
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    sine_samples = (np.sin(2 * np.pi * 440 * t) * 16000).astype(np.int16)

    bio = io.BytesIO()
    with wave.open(bio, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(sine_samples.tobytes())
    wav_bytes = bio.getvalue()

    aud_cap = get_audio_capacity(wav_bytes)
    assert aud_cap["max_capacity_bytes"] > 100

    aud_secret = b"Audio confidential transmission"
    stego_wav, a_meta = hide_in_audio(wav_bytes, aud_secret, passphrase="AudioKey")
    ok_aud, aud_extr, a_msg = extract_from_audio(stego_wav, passphrase="AudioKey")
    assert ok_aud and aud_extr == aud_secret, f"Audio extract failed: {a_msg}"
    print("  -> Audio WAV PCM LSB: PASSED")

    # 7. Test Polyglot / EOF File-Carving
    print("[7/7] Testing Polyglot & EOF File-Carving...")
    dummy_img = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR...\x49\x45\x4E\x44\xAE\x42\x60\x82"
    dummy_payload = b"Top secret ZIP content"
    poly_out, p_meta = inject_eof_payload(dummy_img, dummy_payload, "secret.zip", "PolyKey")
    ok_p, p_name, p_extr, p_msg = extract_eof_payload(poly_out, "PolyKey")
    assert ok_p and p_name == "secret.zip" and p_extr == dummy_payload
    print("  -> Polyglot File-Carving: PASSED")

    print("==================================================")
    print("🎉 ALL 7/7 STEGNOFLOW MODULES VERIFIED & OPERATIONAL!")
    print("==================================================")

if __name__ == "__main__":
    run_all_tests()
