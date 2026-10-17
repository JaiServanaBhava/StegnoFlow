"""
StegnoFlow Audio Steganography Engine (WAV PCM Carrier)
Hides encrypted secret messages or binary files inside the LSB
of 16-bit PCM audio samples with imperceptible SNR degradation.
"""

import io
import wave
import numpy as np
from typing import Tuple, Optional, Dict, Any
from core.crypto import encrypt_payload, decrypt_payload

def get_audio_capacity(wav_bytes: bytes) -> Dict[str, Any]:
    """Inspects a WAV file and computes its steganographic capacity."""
    with io.BytesIO(wav_bytes) as bio:
        with wave.open(bio, 'rb') as wf:
            channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()
            nframes = wf.getnframes()
            duration = nframes / float(framerate) if framerate > 0 else 0
            
            total_samples = nframes * channels
            # 1 bit per sample, minus 32-bit header
            usable_bytes = max(0, (total_samples // 8) - 4)

            return {
                "channels": channels,
                "sample_width_bytes": sampwidth,
                "sample_rate_hz": framerate,
                "total_samples": total_samples,
                "duration_seconds": round(duration, 2),
                "max_capacity_bytes": usable_bytes,
                "max_capacity_kb": round(usable_bytes / 1024, 2)
            }

def hide_in_audio(
    wav_bytes: bytes,
    payload: bytes,
    passphrase: Optional[str] = None
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Embeds encrypted payload into the least significant bit (LSB)
    of 16-bit or 8-bit WAV audio samples.
    """
    packed = encrypt_payload(payload, passphrase)
    payload_len = len(packed)
    full_data = payload_len.to_bytes(4, byteorder="big") + packed
    data_bits = np.unpackbits(np.frombuffer(full_data, dtype=np.uint8))

    with io.BytesIO(wav_bytes) as in_bio:
        with wave.open(in_bio, 'rb') as wf:
            params = wf.getparams()
            raw_frames = wf.readframes(wf.getnframes())

    sampwidth = params.sampwidth
    if sampwidth == 2:
        # 16-bit PCM
        samples = np.frombuffer(raw_frames, dtype=np.int16).copy()
    elif sampwidth == 1:
        # 8-bit unsigned PCM
        samples = np.frombuffer(raw_frames, dtype=np.uint8).copy()
    else:
        raise ValueError(f"Unsupported sample width ({sampwidth} bytes). Must be 8-bit or 16-bit PCM WAV.")

    if len(data_bits) > len(samples):
        raise ValueError(
            f"Payload too large for this audio! Required: {len(data_bits)//8} bytes. "
            f"Available audio capacity: {len(samples)//8} bytes."
        )

    # Embed bits into LSB
    if sampwidth == 2:
        # Clear bit 0 and inject
        samples[:len(data_bits)] = (samples[:len(data_bits)] & ~1) | data_bits
    else:
        samples[:len(data_bits)] = (samples[:len(data_bits)] & ~1) | data_bits

    out_bio = io.BytesIO()
    with wave.open(out_bio, 'wb') as wf:
        wf.setparams(params)
        wf.writeframes(samples.tobytes())

    stego_wav_bytes = out_bio.getvalue()
    
    # Calculate sample waveform preview (100 points for frontend visualization)
    preview_samples = samples[::max(1, len(samples) // 100)][:100].tolist()

    return stego_wav_bytes, {
        "status": "success",
        "payload_bytes": payload_len,
        "bits_embedded": len(data_bits),
        "total_audio_samples": len(samples),
        "audio_capacity_used_percent": round((len(data_bits) / len(samples)) * 100, 3),
        "preview_waveform": preview_samples
    }

def extract_from_audio(
    wav_bytes: bytes,
    passphrase: Optional[str] = None
) -> Tuple[bool, bytes, str]:
    """
    Extracts, validates, and decrypts secret payload from WAV audio carrier.
    """
    with io.BytesIO(wav_bytes) as in_bio:
        with wave.open(in_bio, 'rb') as wf:
            sampwidth = wf.getsampwidth()
            raw_frames = wf.readframes(wf.getnframes())

    if sampwidth == 2:
        samples = np.frombuffer(raw_frames, dtype=np.int16)
    elif sampwidth == 1:
        samples = np.frombuffer(raw_frames, dtype=np.uint8)
    else:
        return False, b"", f"Unsupported sample width: {sampwidth}"

    if len(samples) < 32:
        return False, b"", "Audio is too short to contain StegnoFlow container header."

    # Extract first 32 bits (4 bytes length)
    len_bits = (samples[:32] & 1).astype(np.uint8)
    len_bytes = np.packbits(len_bits).tobytes()
    payload_len = int.from_bytes(len_bytes, byteorder="big")

    max_possible = (len(samples) - 32) // 8
    if payload_len <= 0 or payload_len > max_possible:
        return False, b"", f"Invalid audio payload length ({payload_len} bytes). Not a stego carrier or corrupt."

    total_bits_needed = 32 + (payload_len * 8)
    if len(samples) < total_bits_needed:
        return False, b"", "Audio terminated unexpectedly before entire payload was read."

    payload_bits = (samples[32:total_bits_needed] & 1).astype(np.uint8)
    packed_payload = np.packbits(payload_bits).tobytes()

    return decrypt_payload(packed_payload, passphrase)
