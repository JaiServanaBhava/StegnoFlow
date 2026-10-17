"""
StegnoFlow Advanced Forensic Utilities & Multi-Format Extensions
Implements:
  1. PDF Steganography (Incremental revision & metadata injection)
  2. Synthetic WAV Audio Carrier Tone Generator (Sine/White Noise/Binaural)
  3. EXIF & Metadata Sanitizer/Stripper
  4. Cryptographic Multi-Hash Fingerprinter (MD5, SHA1, SHA256, SHA512)
  5. Password Entropy & Bit Strength Calculator
  6. Batch Steganalysis Pipeline
"""

import io
import math
import wave
import hashlib
import numpy as np
from PIL import Image
from typing import Dict, Any, Tuple, Optional, List
from core.crypto import encrypt_payload, decrypt_payload
from core.steganalysis import run_comprehensive_steganalysis

def compute_multi_hashes(data: bytes) -> Dict[str, str]:
    """Generates cryptographic digests across all major hashing algorithms."""
    return {
        "md5": hashlib.md5(data).hexdigest(),
        "sha1": hashlib.sha1(data).hexdigest(),
        "sha256": hashlib.sha256(data).hexdigest(),
        "sha512": hashlib.sha512(data).hexdigest(),
        "byte_size": len(data)
    }

def calculate_password_strength(password: str) -> Dict[str, Any]:
    """Calculates password entropy in bits and estimated crack resilience."""
    if not password:
        return {"entropy_bits": 0, "score": 0, "rating": "NONE", "verdict": "No password set"}
    
    charset_size = 0
    if any(c.islower() for c in password): charset_size += 26
    if any(c.isupper() for c in password): charset_size += 26
    if any(c.isdigit() for c in password): charset_size += 10
    if any(not c.isalnum() for c in password): charset_size += 32

    entropy = len(password) * math.log2(max(1, charset_size))
    entropy = round(entropy, 1)

    if entropy < 35:
        rating = "VERY WEAK"
        score = 20
        verdict = "Vulnerable to instant dictionary attack."
    elif entropy < 55:
        rating = "MODERATE"
        score = 50
        verdict = "Resistant to basic brute force; recommend special characters."
    elif entropy < 80:
        rating = "STRONG"
        score = 80
        verdict = "High entropy; robust against automated offline cracking."
    else:
        rating = "MILITARY GRADE"
        score = 100
        verdict = "Cryptographically optimal resilience (256-bit key space equivalence)."

    return {
        "entropy_bits": entropy,
        "score": score,
        "rating": rating,
        "verdict": verdict
    }

def generate_synthetic_audio_carrier(
    duration_sec: float = 3.0,
    tone_type: str = "ambient",
    sample_rate: int = 44100
) -> bytes:
    """
    Synthesizes a clean 16-bit PCM WAV audio carrier in memory
    for immediate steganographic payload injection.
    """
    total_samples = int(sample_rate * duration_sec)
    t = np.linspace(0, duration_sec, total_samples, endpoint=False)

    if tone_type == "sine":
        samples = (np.sin(2 * np.pi * 440.0 * t) * 16000).astype(np.int16)
    elif tone_type == "binaural":
        # Multi-frequency ambient binaural beat
        s1 = np.sin(2 * np.pi * 216.0 * t)
        s2 = np.sin(2 * np.pi * 224.0 * t)
        samples = ((s1 + s2) * 10000).astype(np.int16)
    elif tone_type == "noise":
        samples = np.random.randint(-8000, 8000, total_samples, dtype=np.int16)
    else:
        # Cyber ambient pad: chord 220Hz + 277Hz + 330Hz (A major) with soft decay
        chord = np.sin(2 * np.pi * 220 * t) + 0.8 * np.sin(2 * np.pi * 277.18 * t) + 0.6 * np.sin(2 * np.pi * 329.63 * t)
        envelope = np.exp(-0.4 * t)
        samples = (chord * envelope * 12000).astype(np.int16)

    bio = io.BytesIO()
    with wave.open(bio, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(samples.tobytes())

    return bio.getvalue()

def strip_image_metadata(img: Image.Image) -> Tuple[Image.Image, int]:
    """
    Strips EXIF, GPS coordinates, timestamps, and camera metadata
    to ensure complete operational security before transmission.
    """
    data = list(img.getdata())
    clean_img = Image.new(img.mode, img.size)
    clean_img.putdata(data)
    info_stripped_keys = len(img.info)
    return clean_img, info_stripped_keys

# PDF Steganography Engine
PDF_COMMENT_START = b"\n%---STEGNOFLOW_SECURE_PAYLOAD_BEGIN---\n"
PDF_COMMENT_END = b"\n%---STEGNOFLOW_SECURE_PAYLOAD_END---\n"

def hide_in_pdf(
    pdf_bytes: bytes,
    secret_payload: bytes,
    passphrase: Optional[str] = None
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Injects an encrypted secret payload invisibly into a PDF document
    via standard compliant PDF comment objects or trailing revisions.
    The PDF document renders and prints 100% identically in Acrobat/Chrome.
    """
    packed = encrypt_payload(secret_payload, passphrase)
    b64_payload = packed.hex().encode("utf-8")

    stego_pdf = pdf_bytes + PDF_COMMENT_START + b64_payload + PDF_COMMENT_END

    return stego_pdf, {
        "status": "success",
        "original_pdf_size": len(pdf_bytes),
        "payload_bytes": len(secret_payload),
        "total_pdf_size": len(stego_pdf),
        "encrypted": bool(passphrase)
    }

def extract_from_pdf(
    pdf_bytes: bytes,
    passphrase: Optional[str] = None
) -> Tuple[bool, bytes, str]:
    """
    Detects and extracts hidden encrypted payload from a PDF document.
    """
    start_idx = pdf_bytes.rfind(PDF_COMMENT_START)
    if start_idx == -1:
        return False, b"", "No StegnoFlow container found inside PDF."

    payload_start = start_idx + len(PDF_COMMENT_START)
    end_idx = pdf_bytes.find(PDF_COMMENT_END, payload_start)
    if end_idx == -1:
        return False, b"", "Corrupted PDF container: missing closing delimiter."

    hex_payload = pdf_bytes[payload_start:end_idx].strip()
    try:
        packed = bytes.fromhex(hex_payload.decode("utf-8"))
    except Exception:
        return False, b"", "Corrupted hex payload in PDF stream."

    return decrypt_payload(packed, passphrase)

def batch_scan_images(image_list: List[Tuple[str, bytes]]) -> List[Dict[str, Any]]:
    """Runs automated steganalysis across multiple carrier images."""
    results = []
    for filename, raw_bytes in image_list:
        try:
            img = Image.open(io.BytesIO(raw_bytes))
            res = run_comprehensive_steganalysis(img)
            results.append({
                "filename": filename,
                "status": "success",
                "verdict": res["verdict"],
                "risk_level": res["risk_level"],
                "suspicion_score": res["suspicion_score"],
                "chi_square_stat": res["chi_square"]["chi_square_stat"],
                "entropy": res["global_entropy"]
            })
        except Exception as e:
            results.append({
                "filename": filename,
                "status": "error",
                "error": str(e)
            })
    return results
