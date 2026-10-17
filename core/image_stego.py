"""
StegnoFlow Image Steganography Engine
Supports LSB (1, 2, 4 bits per channel), RGB/RGBA channel selection,
deterministic PRNG pixel scattering (anti-sequential inspection),
and capacity validation with PSNR metrics.
"""

import io
import math
import numpy as np
from PIL import Image
import hashlib
from typing import Tuple, Optional
from core.crypto import encrypt_payload, decrypt_payload

def calculate_capacity(img: Image.Image, bits_per_channel: int = 1, channels: str = "RGB") -> dict:
    """Calculates max storage capacity of an image in bytes and bit rate."""
    width, height = img.size
    active_channels = len(channels)
    total_bits = width * height * active_channels * bits_per_channel
    # Subtract 32 bits for the length header and container overhead
    usable_bytes = max(0, (total_bits // 8) - 4)
    return {
        "width": width,
        "height": height,
        "total_pixels": width * height,
        "bits_per_channel": bits_per_channel,
        "active_channels": channels,
        "max_capacity_bytes": usable_bytes,
        "max_capacity_kb": round(usable_bytes / 1024, 2),
    }

def get_channel_indices(channel_str: str) -> list[int]:
    """Map channel string to RGB indices (0=R, 1=G, 2=B)."""
    mapping = {'R': 0, 'G': 1, 'B': 2, 'A': 3}
    return [mapping[c] for c in channel_str.upper() if c in mapping]

def generate_permutation(total_slots: int, seed_key: str) -> np.ndarray:
    """
    Generates a deterministic pseudorandom permutation of slot indices
    using a hash-derived seed for spatial scattering.
    """
    seed_hash = hashlib.sha256(seed_key.encode('utf-8')).digest()
    seed_int = int.from_bytes(seed_hash[:8], byteorder='big')
    rng = np.random.default_rng(seed_int)
    return rng.permutation(total_slots)

def hide_in_image(
    image: Image.Image,
    payload: bytes,
    passphrase: Optional[str] = None,
    bits_per_channel: int = 1,
    channels: str = "RGB",
    scatter: bool = True
) -> Tuple[Image.Image, dict]:
    """
    Encodes secret payload into an image.
    Optionally encrypts with AES-256-GCM.
    Returns: (stego_image: PIL.Image, metadata: dict)
    """
    # 1. Prepare and wrap payload (with AES-256-GCM if passphrase given)
    packed_payload = encrypt_payload(payload, passphrase)
    payload_len = len(packed_payload)
    
    # Prefix with 4-byte big-endian payload length
    full_data = payload_len.to_bytes(4, byteorder="big") + packed_payload
    data_bits = np.unpackbits(np.frombuffer(full_data, dtype=np.uint8))
    
    # 2. Convert image to RGB (or RGBA if alpha selected)
    if 'A' in channels and image.mode == 'RGBA':
        img_arr = np.array(image.convert('RGBA'), dtype=np.uint8)
    else:
        img_arr = np.array(image.convert('RGB'), dtype=np.uint8)
        channels = channels.replace('A', '')

    height, width, ch_count = img_arr.shape
    ch_indices = get_channel_indices(channels)
    
    total_slots = width * height * len(ch_indices) * bits_per_channel
    if len(data_bits) > total_slots:
        raise ValueError(
            f"Payload too large! Required: {len(data_bits) // 8} bytes. "
            f"Available capacity: {total_slots // 8} bytes with {bits_per_channel}-bit LSB."
        )

    # 3. Flatten selected channel coordinates
    flat_pixels = img_arr[:, :, ch_indices].reshape(-1)
    
    if scatter and passphrase:
        # Scatter indices across carrier using passkey seed
        perm = generate_permutation(len(flat_pixels), passphrase)
    else:
        perm = np.arange(len(flat_pixels))

    # 4. Bit embedding
    bit_cursor = 0
    num_bits = len(data_bits)
    mask = ~((1 << bits_per_channel) - 1) & 0xFF

    for idx in perm:
        if bit_cursor >= num_bits:
            break
        # Take chunk of bits
        remaining = num_bits - bit_cursor
        chunk_size = min(bits_per_channel, remaining)
        
        chunk_bits = data_bits[bit_cursor:bit_cursor + chunk_size]
        bit_val = 0
        for b in chunk_bits:
            bit_val = (bit_val << 1) | int(b)
        
        # If fewer bits remain than bits_per_channel, shift to align
        if chunk_size < bits_per_channel:
            bit_val <<= (bits_per_channel - chunk_size)

        current_val = flat_pixels[idx]
        new_val = (current_val & mask) | bit_val
        flat_pixels[idx] = new_val
        bit_cursor += chunk_size

    # Reconstruct modified image array
    img_arr[:, :, ch_indices] = flat_pixels.reshape(height, width, len(ch_indices))
    stego_img = Image.fromarray(img_arr)

    # Calculate embedding statistics
    carrier_bytes = width * height * 3
    embedding_rate = round((len(full_data) / carrier_bytes) * 100, 4)

    return stego_img, {
        "status": "success",
        "payload_bytes": payload_len,
        "total_bits_written": len(data_bits),
        "embedding_rate_percent": embedding_rate,
        "scatter_mode": scatter and bool(passphrase),
        "bits_per_channel": bits_per_channel,
        "channels": channels
    }

def extract_from_image(
    image: Image.Image,
    passphrase: Optional[str] = None,
    bits_per_channel: int = 1,
    channels: str = "RGB",
    scatter: bool = True
) -> Tuple[bool, bytes, str]:
    """
    Extracts and decrypts secret payload from a stego image.
    Returns: (success: bool, payload: bytes, message: str)
    """
    if 'A' in channels and image.mode == 'RGBA':
        img_arr = np.array(image.convert('RGBA'), dtype=np.uint8)
    else:
        img_arr = np.array(image.convert('RGB'), dtype=np.uint8)
        channels = channels.replace('A', '')

    height, width, ch_count = img_arr.shape
    ch_indices = get_channel_indices(channels)
    flat_pixels = img_arr[:, :, ch_indices].reshape(-1)

    if scatter and passphrase:
        perm = generate_permutation(len(flat_pixels), passphrase)
    else:
        perm = np.arange(len(flat_pixels))

    # First, read 32 bits (4 bytes) to get payload length
    extracted_bits = []
    bit_mask = (1 << bits_per_channel) - 1
    
    # We need 32 bits for length
    bits_needed = 32
    idx_cursor = 0

    while len(extracted_bits) < bits_needed and idx_cursor < len(perm):
        pix_val = flat_pixels[perm[idx_cursor]]
        idx_cursor += 1
        extracted_chunk = pix_val & bit_mask
        for b in range(bits_per_channel - 1, -1, -1):
            extracted_bits.append((extracted_chunk >> b) & 1)

    if len(extracted_bits) < 32:
        return False, b"", "Insufficient data to read length header."

    len_bytes = np.packbits(np.array(extracted_bits[:32], dtype=np.uint8)).tobytes()
    payload_len = int.from_bytes(len_bytes, byteorder="big")

    # Safety check on payload length
    max_possible = (len(flat_pixels) * bits_per_channel) // 8
    if payload_len <= 0 or payload_len > max_possible:
        return False, b"", f"Invalid payload length ({payload_len} bytes). Likely unencoded carrier or incorrect parameters/passphrase."

    total_bits_needed = 32 + (payload_len * 8)
    while len(extracted_bits) < total_bits_needed and idx_cursor < len(perm):
        pix_val = flat_pixels[perm[idx_cursor]]
        idx_cursor += 1
        extracted_chunk = pix_val & bit_mask
        for b in range(bits_per_channel - 1, -1, -1):
            extracted_bits.append((extracted_chunk >> b) & 1)

    if len(extracted_bits) < total_bits_needed:
        return False, b"", "Carrier ended prematurely while reading payload."

    raw_payload_bits = np.array(extracted_bits[32:total_bits_needed], dtype=np.uint8)
    packed_payload = np.packbits(raw_payload_bits).tobytes()

    # Attempt decryption / unwrap
    return decrypt_payload(packed_payload, passphrase)
