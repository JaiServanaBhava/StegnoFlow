"""
StegnoFlow File-Carving, Polyglot & EOF Steganography Engine
Supports:
  1. Embedding arbitrary files (PDF, ZIP, DOCX, Keys) into carriers.
  2. Polyglot / EOF (End of File) marker injection for JPEG/PNG.
  3. Polyglot detection and file-carving payload extractor.
"""

import io
import os
from typing import Tuple, Optional, Dict, Any
from core.crypto import encrypt_payload, decrypt_payload

JPEG_EOI = b"\xFF\xD9"
PNG_IEND = b"\x49\x45\x4E\x44\xAE\x42\x60\x82"
POLYGLOT_MAGIC = b"SGF_POLYGLOT_V2"

def inject_eof_payload(
    carrier_bytes: bytes,
    file_bytes: bytes,
    filename: str,
    passphrase: Optional[str] = None
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Appends an authenticated, encrypted file payload past the natural End-Of-Image marker.
    Standard image viewers read up to the EOI/IEND marker and display the image flawlessly,
    while StegnoFlow extracts the appended polyglot payload.
    """
    # Pack filename + file_bytes
    name_encoded = filename.encode("utf-8")
    name_len = len(name_encoded).to_bytes(2, byteorder="big")
    raw_bundle = name_len + name_encoded + file_bytes

    encrypted_bundle = encrypt_payload(raw_bundle, passphrase)
    bundle_len = len(encrypted_bundle).to_bytes(4, byteorder="big")

    eof_trailer = POLYGLOT_MAGIC + bundle_len + encrypted_bundle
    output_bytes = carrier_bytes + eof_trailer

    return output_bytes, {
        "status": "success",
        "carrier_size_bytes": len(carrier_bytes),
        "payload_size_bytes": len(file_bytes),
        "total_output_size": len(output_bytes),
        "filename_hidden": filename,
        "encrypted": bool(passphrase)
    }

def extract_eof_payload(
    carrier_bytes: bytes,
    passphrase: Optional[str] = None
) -> Tuple[bool, str, bytes, str]:
    """
    Detects and extracts EOF / Polyglot hidden file from carrier.
    Returns: (success: bool, filename: str, file_bytes: bytes, message: str)
    """
    pos = carrier_bytes.rfind(POLYGLOT_MAGIC)
    if pos == -1:
        return False, "", b"", "No StegnoFlow Polyglot / EOF marker found in file."

    offset = pos + len(POLYGLOT_MAGIC)
    if len(carrier_bytes) < offset + 4:
        return False, "", b"", "Truncated polyglot length header."

    bundle_len = int.from_bytes(carrier_bytes[offset:offset + 4], byteorder="big")
    offset += 4

    if len(carrier_bytes) < offset + bundle_len:
        return False, "", b"", "Incomplete polyglot payload data."

    encrypted_bundle = carrier_bytes[offset:offset + bundle_len]
    success, decrypted_bundle, msg = decrypt_payload(encrypted_bundle, passphrase)
    if not success:
        return False, "", b"", msg

    if len(decrypted_bundle) < 2:
        return False, "", b"", "Corrupted unpacked file structure."

    name_len = int.from_bytes(decrypted_bundle[:2], byteorder="big")
    if len(decrypted_bundle) < 2 + name_len:
        return False, "", b"", "Corrupted file name header in payload."

    filename = decrypted_bundle[2:2 + name_len].decode("utf-8", errors="replace")
    file_bytes = decrypted_bundle[2 + name_len:]

    return True, filename, file_bytes, f"Extracted hidden file: '{filename}' ({len(file_bytes)} bytes). {msg}"
