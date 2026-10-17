"""
StegnoFlow Core Cryptography Module
Implements Military-Grade AES-256-GCM authenticated encryption,
PBKDF2 key derivation with high iteration count, salt and IV generation,
and SHA-256 HMAC integrity checks for zero-leakage steganography.
"""

import os
import hashlib
import hmac
from typing import Tuple, Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

SALT_SIZE = 16
IV_SIZE = 12
PBKDF2_ITERATIONS = 200000
MAGIC_HEADER = b"SGF20"  # StegnoFlow v2.0 Magic bytes

def derive_key(passphrase: str, salt: bytes) -> bytes:
    """Derives a 256-bit AES key using PBKDF2-HMAC-SHA256."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
    )
    return kdf.derive(passphrase.encode("utf-8"))

def encrypt_payload(data: bytes, passphrase: Optional[str] = None) -> bytes:
    """
    Encrypts arbitrary byte payload.
    If passphrase is provided, applies AES-256-GCM with PBKDF2 salt and nonce.
    If no passphrase is provided, wraps with magic header and SHA-256 integrity tag.
    Format when encrypted:
      [MAGIC 5B][FLAG 1B (0x01 = Encrypted)][SALT 16B][IV 12B][CIPHERTEXT + 16B TAG]
    Format when unencrypted:
      [MAGIC 5B][FLAG 1B (0x00 = Plain)][SHA256 32B][RAW DATA]
    """
    if passphrase:
        salt = os.urandom(SALT_SIZE)
        iv = os.urandom(IV_SIZE)
        key = derive_key(passphrase, salt)
        aesgcm = AESGCM(key)
        # Encrypt with authentication
        ciphertext = aesgcm.encrypt(iv, data, associated_data=MAGIC_HEADER)
        packed = MAGIC_HEADER + b"\x01" + salt + iv + ciphertext
        return packed
    else:
        checksum = hashlib.sha256(data).digest()
        packed = MAGIC_HEADER + b"\x00" + checksum + data
        return packed

def decrypt_payload(packed: bytes, passphrase: Optional[str] = None) -> Tuple[bool, bytes, str]:
    """
    Validates and decrypts packed payload.
    Returns: (success: bool, raw_data: bytes, message: str)
    """
    if len(packed) < len(MAGIC_HEADER) + 1:
        return False, b"", "Data too small to be valid StegnoFlow container."

    if not packed.startswith(MAGIC_HEADER):
        return False, b"", "Invalid container header (Missing StegnoFlow signature)."

    offset = len(MAGIC_HEADER)
    flag = packed[offset:offset + 1]
    offset += 1

    if flag == b"\x01":
        # Encrypted mode
        if not passphrase:
            return False, b"", "Payload is AES-256-GCM encrypted. Password required."
        
        min_len = offset + SALT_SIZE + IV_SIZE + 16
        if len(packed) < min_len:
            return False, b"", "Corrupted encrypted block: insufficient length."

        salt = packed[offset:offset + SALT_SIZE]
        offset += SALT_SIZE
        iv = packed[offset:offset + IV_SIZE]
        offset += IV_SIZE
        ciphertext = packed[offset:]

        try:
            key = derive_key(passphrase, salt)
            aesgcm = AESGCM(key)
            decrypted = aesgcm.decrypt(iv, ciphertext, associated_data=MAGIC_HEADER)
            return True, decrypted, "Decryption and authentication successful (AES-256-GCM verified)."
        except Exception:
            return False, b"", "Authentication failed: Incorrect password or corrupted payload (AEAD tag mismatch)."

    elif flag == b"\x00":
        # Unencrypted mode
        min_len = offset + 32
        if len(packed) < min_len:
            return False, b"", "Corrupted container: missing checksum."

        checksum = packed[offset:offset + 32]
        offset += 32
        raw_data = packed[offset:]

        computed = hashlib.sha256(raw_data).digest()
        if not hmac.compare_digest(checksum, computed):
            return False, b"", "Data integrity failure: SHA-256 checksum mismatch (Payload modified)."

        return True, raw_data, "Payload extracted and SHA-256 verified."

    else:
        return False, b"", f"Unknown container format flag: {flag}"
