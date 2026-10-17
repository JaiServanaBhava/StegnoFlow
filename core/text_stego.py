"""
StegnoFlow Invisible Text & Unicode Homoglyph Steganography Engine
Hides encrypted secret messages invisibly inside ordinary plain text
using Zero-Width Unicode characters and Homoglyph substitution.
"""

from typing import Tuple, Optional
from core.crypto import encrypt_payload, decrypt_payload

# Unicode Zero-Width Steganography Codepoints
ZW_ZERO = "\u200B"   # Zero-Width Space -> binary 0
ZW_ONE = "\u200C"    # Zero-Width Non-Joiner -> binary 1
ZW_START = "\u200D"  # Zero-Width Joiner -> Stream Start Marker
ZW_END = "\uFEFF"    # Zero-Width No-Break Space (BOM) -> Stream End Marker

ZW_MAP = {"0": ZW_ZERO, "1": ZW_ONE}
REV_ZW_MAP = {ZW_ZERO: "0", ZW_ONE: "1"}

# Homoglyph lookalike mapping (Latin -> Cyrillic/Greek visually identical)
HOMOGLYPH_MAP = {
    'a': '\u0430',  # Cyrillic small a
    'c': '\u0441',  # Cyrillic small es
    'e': '\u0435',  # Cyrillic small ie
    'i': '\u0456',  # Cyrillic small byelorussian-ukrainian i
    'j': '\u0458',  # Cyrillic small je
    'o': '\u043E',  # Cyrillic small o
    'p': '\u0440',  # Cyrillic small er
    's': '\u0455',  # Cyrillic small dze
    'x': '\u0445',  # Cyrillic small ha
    'y': '\u0443',  # Cyrillic small u
    'A': '\u0410',  # Cyrillic capital A
    'B': '\u0412',  # Cyrillic capital Ve
    'C': '\u0421',  # Cyrillic capital Es
    'E': '\u0415',  # Cyrillic capital Ie
    'H': '\u041D',  # Cyrillic capital En
    'I': '\u0406',  # Cyrillic capital Byelorussian-Ukrainian I
    'M': '\u041C',  # Cyrillic capital Em
    'O': '\u041E',  # Cyrillic capital O
    'P': '\u0420',  # Cyrillic capital Er
    'T': '\u0422',  # Cyrillic capital Te
    'X': '\u0425',  # Cyrillic capital Ha
}
REV_HOMOGLYPH_MAP = {v: k for k, v in HOMOGLYPH_MAP.items()}

def hide_text_in_text(
    cover_text: str,
    secret_text: str,
    passphrase: Optional[str] = None,
    position: str = "words"
) -> Tuple[str, dict]:
    """
    Encodes secret text using Zero-Width Unicode characters.
    Optionally AES-256-GCM encrypted.
    Can be interspersed between words of cover_text or appended at the end.
    """
    if not cover_text.strip():
        cover_text = "The meeting has been confirmed for tomorrow morning at the central library."

    raw_secret_bytes = secret_text.encode("utf-8")
    packed_payload = encrypt_payload(raw_secret_bytes, passphrase)
    
    # Convert packed payload to binary string
    bit_stream = "".join(f"{b:08b}" for b in packed_payload)
    encoded_zw = ZW_START + "".join(ZW_MAP[bit] for bit in bit_stream) + ZW_END

    if position == "append":
        stego_text = cover_text + encoded_zw
    else:
        # Interleave bits across space characters
        words = cover_text.split(" ")
        if len(words) <= 1:
            stego_text = cover_text + encoded_zw
        else:
            # Distribute zero-width chunks across word spaces
            chunk_size = max(1, len(encoded_zw) // (len(words) - 1))
            stego_parts = []
            zw_idx = 0
            for i, word in enumerate(words):
                stego_parts.append(word)
                if i < len(words) - 1:
                    chunk = encoded_zw[zw_idx:zw_idx + chunk_size]
                    zw_idx += chunk_size
                    stego_parts.append(" " + chunk)
            if zw_idx < len(encoded_zw):
                stego_parts.append(encoded_zw[zw_idx:])
            stego_text = "".join(stego_parts)

    return stego_text, {
        "status": "success",
        "secret_bytes": len(raw_secret_bytes),
        "packed_bytes": len(packed_payload),
        "zero_width_chars_injected": len(encoded_zw),
        "visible_char_length": len(cover_text),
        "total_char_length": len(stego_text),
        "encrypted": bool(passphrase)
    }

def extract_text_from_text(
    stego_text: str,
    passphrase: Optional[str] = None
) -> Tuple[bool, str, str]:
    """
    Extracts, decodes, and decrypts secret zero-width text payload.
    Returns: (success: bool, secret_message: str, info: str)
    """
    start_pos = stego_text.find(ZW_START)
    if start_pos == -1:
        return False, "", "No StegnoFlow zero-width start marker found in text."

    end_pos = stego_text.find(ZW_END, start_pos)
    if end_pos == -1:
        # If no explicit end marker, gather all ZW chars after start
        zw_slice = stego_text[start_pos + 1:]
    else:
        zw_slice = stego_text[start_pos + 1:end_pos]

    # Filter to only ZW_ZERO and ZW_ONE
    bits = [REV_ZW_MAP[ch] for ch in zw_slice if ch in REV_ZW_MAP]
    if not bits or len(bits) % 8 != 0:
        # Trim to multiple of 8
        trimmed_len = (len(bits) // 8) * 8
        if trimmed_len == 0:
            return False, "", "Insufficient or malformed zero-width bitstream."
        bits = bits[:trimmed_len]

    bit_str = "".join(bits)
    byte_list = [int(bit_str[i:i+8], 2) for i in range(0, len(bit_str), 8)]
    packed_payload = bytes(byte_list)

    success, raw_bytes, msg = decrypt_payload(packed_payload, passphrase)
    if success:
        try:
            return True, raw_bytes.decode("utf-8"), msg
        except UnicodeDecodeError:
            return True, f"[Hex Payload]: {raw_bytes.hex()}", f"{msg} (Decoded as raw hex/binary)."
    return False, "", msg

def generate_homoglyphs(text: str) -> Tuple[str, int]:
    """Substitutes standard ASCII characters with visually identical Cyrillic homoglyphs."""
    substituted = []
    count = 0
    for ch in text:
        if ch in HOMOGLYPH_MAP:
            substituted.append(HOMOGLYPH_MAP[ch])
            count += 1
        else:
            substituted.append(ch)
    return "".join(substituted), count

def detect_homoglyphs(text: str) -> dict:
    """Inspects text for hidden Cyrillic/Greek homoglyphs and zero-width characters."""
    homoglyphs_found = []
    zw_found_count = 0
    for idx, ch in enumerate(text):
        if ch in REV_HOMOGLYPH_MAP:
            homoglyphs_found.append({
                "index": idx,
                "character": ch,
                "codepoint": f"U+{ord(ch):04X}",
                "mimics": REV_HOMOGLYPH_MAP[ch]
            })
        elif ch in [ZW_ZERO, ZW_ONE, ZW_START, ZW_END]:
            zw_found_count += 1

    return {
        "has_homoglyphs": len(homoglyphs_found) > 0,
        "homoglyph_count": len(homoglyphs_found),
        "homoglyphs": homoglyphs_found[:50],  # sample
        "zero_width_chars_count": zw_found_count,
        "verdict": "ANOMALOUS TEXT: CONTAINS UNICODE OBFUSCATION" if (homoglyphs_found or zw_found_count) else "CLEAN ASCII/UNICODE"
    }
