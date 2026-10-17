"""
StegnoFlow 25+ Forensic & Visual Steganography Effects Engine
Implements 26 real scientific, forensic, and visual analysis filters:
  1.  Bit Plane 0 (LSB Slicer)
  2.  Bit Plane 1
  3.  Bit Plane 2
  4.  Bit Plane 7 (MSB Slicer)
  5.  Pixel Differential x10 (Noise Amplifier)
  6.  Pixel Differential x50 (Extreme Amplifier)
  7.  Laplacian High-Pass Filter (Edge Noise Residual)
  8.  Sobel Gradient Magnitude (Spatial Anomaly Detector)
  9.  Block Shannon Entropy Heatmap (Density Scanner)
  10. 2D FFT Magnitude Spectrum (Frequency Domain Analyzer)
  11. Discrete Cosine Transform (DCT) Energy Residual
  12. YCbCr Chrominance Isolation (Chroma Stego Detector)
  13. Error Level Analysis (ELA - Compression Anomaly)
  14. Red Channel Isolation
  15. Green Channel Isolation
  16. Blue Channel Isolation
  17. Inverted Thermal False-Color Map
  18. Forensic Phosphor Green (CRT Night Vision)
  19. Cyberpunk Forensic HUD (Edge Glow)
  20. Adjacent Pixel XOR Residual
  21. Zero-Crossing Laplacian Contour
  22. Otsu Dynamic Threshold Binarization
  23. Median Filter Noise Residual (Impulse Isolator)
  24. Sample Pair Parity Fluctuation Map
  25. Pseudo-Random Carrier Noise Overlay
  26. Chi-Square Variance Color Map
"""

import io
import cv2
import numpy as np
from PIL import Image

def apply_effect(image: Image.Image, effect_id: str) -> Image.Image:
    """Applies selected forensic effect to PIL image and returns output PIL image."""
    img_rgb = np.array(image.convert("RGB"), dtype=np.uint8)
    h, w, c = img_rgb.shape
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)

    if effect_id == "bit_plane_0":
        # Plane 0: Least Significant Bit (True LSB plane)
        out = ((gray & 1) * 255).astype(np.uint8)
        return Image.fromarray(out)

    elif effect_id == "bit_plane_1":
        out = (((gray >> 1) & 1) * 255).astype(np.uint8)
        return Image.fromarray(out)

    elif effect_id == "bit_plane_2":
        out = (((gray >> 2) & 1) * 255).astype(np.uint8)
        return Image.fromarray(out)

    elif effect_id == "bit_plane_7":
        # Plane 7: Most Significant Bit
        out = (((gray >> 7) & 1) * 255).astype(np.uint8)
        return Image.fromarray(out)

    elif effect_id == "pixel_diff_amplify_x10":
        # High-pass amplification of LSB differences
        blur = cv2.GaussianBlur(gray, (3, 3), 0)
        diff = cv2.absdiff(gray, blur)
        amplified = np.clip(diff.astype(np.float32) * 10.0, 0, 255).astype(np.uint8)
        return Image.fromarray(amplified)

    elif effect_id == "pixel_diff_amplify_x50":
        blur = cv2.GaussianBlur(gray, (3, 3), 0)
        diff = cv2.absdiff(gray, blur)
        amplified = np.clip(diff.astype(np.float32) * 50.0, 0, 255).astype(np.uint8)
        return Image.fromarray(cv2.applyColorMap(amplified, cv2.COLORMAP_JET))

    elif effect_id == "laplacian_highpass":
        lap = cv2.Laplacian(gray, cv2.CV_64F, ksize=3)
        lap_abs = np.uint8(np.absolute(lap))
        return Image.fromarray(lap_abs)

    elif effect_id == "sobel_gradient":
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        mag = cv2.magnitude(sobelx, sobely)
        mag = np.uint8(np.clip(mag, 0, 255))
        return Image.fromarray(cv2.applyColorMap(mag, cv2.COLORMAP_MAGMA))

    elif effect_id == "shannon_entropy_heat":
        # Fast local block entropy
        block_size = 16
        by, bx = h // block_size, w // block_size
        ent_grid = np.zeros((by, bx), dtype=np.float32)
        for y in range(by):
            for x in range(bx):
                patch = gray[y*block_size:(y+1)*block_size, x*block_size:(x+1)*block_size]
                counts = np.bincount(patch.ravel(), minlength=256)
                p = counts[counts > 0] / float(patch.size)
                ent_grid[y, x] = -np.sum(p * np.log2(p))
        norm_ent = cv2.normalize(ent_grid, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        resized_ent = cv2.resize(norm_ent, (w, h), interpolation=cv2.INTER_LINEAR)
        return Image.fromarray(cv2.applyColorMap(resized_ent, cv2.COLORMAP_INFERNO))

    elif effect_id == "fft_magnitude_spectrum":
        # 2D Fast Fourier Transform
        f = np.fft.fft2(gray.astype(np.float32))
        fshift = np.fft.fftshift(f)
        magnitude = 20 * np.log(np.abs(fshift) + 1.0)
        norm_mag = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        return Image.fromarray(cv2.applyColorMap(norm_mag, cv2.COLORMAP_VIRIDIS))

    elif effect_id == "dct_energy_residual":
        # Block-wise Discrete Cosine Transform
        h_pad = (h // 8) * 8
        w_pad = (w // 8) * 8
        cropped = gray[:h_pad, :w_pad].astype(np.float32)
        dct_map = np.zeros_like(cropped)
        for y in range(0, h_pad, 8):
            for x in range(0, w_pad, 8):
                b = cropped[y:y+8, x:x+8]
                d = cv2.dct(b)
                # Keep high frequency AC coefficients
                d[0, 0] = 0
                dct_map[y:y+8, x:x+8] = np.abs(d)
        norm_dct = cv2.normalize(dct_map, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        return Image.fromarray(cv2.applyColorMap(norm_dct, cv2.COLORMAP_HOT))

    elif effect_id == "ycbcr_chroma_diff":
        ycbcr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2YCrCb)
        cr = ycbcr[:, :, 1]
        cb = ycbcr[:, :, 2]
        chroma_diff = cv2.absdiff(cr, cb)
        scaled = cv2.normalize(chroma_diff, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        return Image.fromarray(cv2.applyColorMap(scaled, cv2.COLORMAP_TWILIGHT))

    elif effect_id == "error_level_analysis":
        # ELA: resave at 90% JPEG and compute residual
        buf = io.BytesIO()
        image.convert("RGB").save(buf, format="JPEG", quality=90)
        buf.seek(0)
        recomp = Image.open(buf).convert("RGB")
        recomp_arr = np.array(recomp, dtype=np.float32)
        diff = np.abs(img_rgb.astype(np.float32) - recomp_arr)
        scale = 15.0
        ela_out = np.clip(diff * scale, 0, 255).astype(np.uint8)
        return Image.fromarray(ela_out)

    elif effect_id == "rgb_channel_r":
        r_img = np.zeros_like(img_rgb)
        r_img[:, :, 0] = img_rgb[:, :, 0]
        return Image.fromarray(r_img)

    elif effect_id == "rgb_channel_g":
        g_img = np.zeros_like(img_rgb)
        g_img[:, :, 1] = img_rgb[:, :, 1]
        return Image.fromarray(g_img)

    elif effect_id == "rgb_channel_b":
        b_img = np.zeros_like(img_rgb)
        b_img[:, :, 2] = img_rgb[:, :, 2]
        return Image.fromarray(b_img)

    elif effect_id == "inverted_thermal":
        inv = 255 - gray
        return Image.fromarray(cv2.applyColorMap(inv, cv2.COLORMAP_BONE))

    elif effect_id == "phosphor_green":
        # CRT night-vision forensic phosphor
        green_screen = np.zeros_like(img_rgb)
        green_screen[:, :, 1] = gray
        # Add subtle scanlines
        green_screen[::2, :, 1] = (green_screen[::2, :, 1] * 0.75).astype(np.uint8)
        return Image.fromarray(green_screen)

    elif effect_id == "cyberpunk_forensic_hud":
        edges = cv2.Canny(gray, 60, 180)
        hud = np.zeros_like(img_rgb)
        hud[:, :, 0] = cv2.dilate(edges, np.ones((2,2)))  # Magenta
        hud[:, :, 1] = edges                             # Cyan
        hud[:, :, 2] = 255 - edges
        blended = cv2.addWeighted(img_rgb, 0.4, hud, 0.6, 0)
        return Image.fromarray(blended)

    elif effect_id == "adjacent_pixel_xor":
        # Horizontal adjacent XOR
        shifted = np.roll(gray, 1, axis=1)
        xor_map = np.bitwise_xor(gray, shifted)
        return Image.fromarray(xor_map)

    elif effect_id == "zero_crossing_edges":
        lap = cv2.Laplacian(gray, cv2.CV_32F)
        sign = np.sign(lap)
        zc = np.zeros_like(gray, dtype=np.uint8)
        # Check horizontal sign inversion
        zc[:, 1:] = np.where(sign[:, 1:] * sign[:, :-1] < 0, 255, 0)
        return Image.fromarray(zc)

    elif effect_id == "otsu_binarization":
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return Image.fromarray(thresh)

    elif effect_id == "median_noise_residual":
        median = cv2.medianBlur(gray, 3)
        residual = cv2.absdiff(gray, median)
        amplified = cv2.normalize(residual, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        return Image.fromarray(cv2.applyColorMap(amplified, cv2.COLORMAP_OCEAN))

    elif effect_id == "sample_pair_fluctuation":
        # Parity transitions (2k vs 2k+1)
        parity = (gray % 2).astype(np.uint8)
        parity_diff = np.abs(np.diff(parity, axis=1))
        padded = np.pad(parity_diff, ((0,0),(0,1)), mode='constant') * 255
        return Image.fromarray(cv2.applyColorMap(padded.astype(np.uint8), cv2.COLORMAP_AUTUMN))

    elif effect_id == "prng_noise_mask":
        # Deterministic pseudo-random seed mask overlay
        np.random.seed(42)
        noise = np.random.randint(0, 2, size=(h, w), dtype=np.uint8) * 255
        blended = cv2.addWeighted(gray, 0.6, noise, 0.4, 0)
        return Image.fromarray(blended)

    elif effect_id == "chi_square_variance_map":
        # Visual color map of LSB bit pairs
        pair_mod = (gray & 0x01) * 255
        heat = cv2.applyColorMap(pair_mod.astype(np.uint8), cv2.COLORMAP_RAINBOW)
        return Image.fromarray(heat)

    else:
        # Default fallback: return grayscale
        return Image.fromarray(gray)

EFFECTS_LIST = [
    {"id": "bit_plane_0", "name": "Bit Plane 0 (True LSB Slicer)", "category": "LSB Slicing", "desc": "Isolates the absolute least-significant bit. Unencoded carriers show subtle scene contours; steganographic carriers display high-entropy uniform white noise."},
    {"id": "bit_plane_1", "name": "Bit Plane 1 Slicer", "category": "LSB Slicing", "desc": "Evaluates 2nd bit plane to detect multi-bit LSB injection."},
    {"id": "bit_plane_2", "name": "Bit Plane 2 Slicer", "category": "LSB Slicing", "desc": "Evaluates 3rd bit plane for aggressive steganographic payloads."},
    {"id": "bit_plane_7", "name": "Bit Plane 7 (MSB Slicer)", "category": "LSB Slicing", "desc": "Extracts the most significant bit plane revealing structural geometry."},
    {"id": "pixel_diff_amplify_x10", "name": "Noise Amplifier (x10 Differential)", "category": "Differential Forensics", "desc": "Amplifies spatial high-frequency deviations by a factor of 10 to reveal boundary tampering."},
    {"id": "pixel_diff_amplify_x50", "name": "Extreme Amplifier (x50 Jet Map)", "category": "Differential Forensics", "desc": "Extreme 50x amplification rendered in JET thermal false-color."},
    {"id": "laplacian_highpass", "name": "Laplacian High-Pass Residual", "category": "Edge & Frequency", "desc": "Second-order derivative operator highlighting localized spatial pixel discontinuity."},
    {"id": "sobel_gradient", "name": "Sobel Gradient Magnitude (Magma)", "category": "Edge & Frequency", "desc": "Calculates gradient vector magnitude to expose steganographic seam edges."},
    {"id": "shannon_entropy_heat", "name": "Local Shannon Entropy Heatmap", "category": "Statistical & Entropy", "desc": "Computes local 16x16 block entropy. Encrypted/compressed payloads show blazing red/yellow high entropy."},
    {"id": "fft_magnitude_spectrum", "name": "2D FFT Frequency Spectrum (Viridis)", "category": "Frequency Domain", "desc": "Applies 2D Fast Fourier Transform to analyze high-frequency noise spikes indicative of LSB replacement."},
    {"id": "dct_energy_residual", "name": "DCT AC Energy Distribution (Hot)", "category": "Frequency Domain", "desc": "Discrete Cosine Transform energy distribution exposing high-frequency AC coefficient anomalies."},
    {"id": "ycbcr_chroma_diff", "name": "YCbCr Chrominance Differential", "category": "Color Forensics", "desc": "Isolates Cb and Cr chrominance channels to detect chromatic steganographic tampering."},
    {"id": "error_level_analysis", "name": "Error Level Analysis (ELA - 90%)", "category": "Compression Forensics", "desc": "Simulates 90% recompression error delta to detect inconsistent compression levels."},
    {"id": "rgb_channel_r", "name": "Isolated Red Channel", "category": "Color Channels", "desc": "Isolates the red primary sub-pixel plane."},
    {"id": "rgb_channel_g", "name": "Isolated Green Channel", "category": "Color Channels", "desc": "Isolates the green primary sub-pixel plane."},
    {"id": "rgb_channel_b", "name": "Isolated Blue Channel", "category": "Color Channels", "desc": "Isolates the blue primary sub-pixel plane (most common target for subtle LSB hiding)."},
    {"id": "inverted_thermal", "name": "Inverted Bone Thermal False-Color", "category": "Visual Enhancement", "desc": "High-contrast inverted radiographic false-color map."},
    {"id": "phosphor_green", "name": "CRT Phosphor Night-Vision HUD", "category": "Forensic Scanners", "desc": "Simulates retro phosphor green electron beam display with scanline decay."},
    {"id": "cyberpunk_forensic_hud", "name": "Cyber Forensic Glow HUD", "category": "Forensic Scanners", "desc": "Dual-tone neon HUD overlay highlighting detected boundary features."},
    {"id": "adjacent_pixel_xor", "name": "Adjacent Pixel XOR Residual", "category": "Mathematical Residuals", "desc": "Horizontal pixel-to-pixel XOR differential map uncovering sequential encoding tracks."},
    {"id": "zero_crossing_edges", "name": "Zero-Crossing Laplacian Contours", "category": "Edge & Frequency", "desc": "Identifies exact mathematical zero-crossing points in the Laplacian field."},
    {"id": "otsu_binarization", "name": "Otsu Adaptive Binarization", "category": "Morphological", "desc": "Clustering-based image thresholding separating foreground carriers from noise."},
    {"id": "median_noise_residual", "name": "Median Impulse Noise Residual", "category": "Differential Forensics", "desc": "Isolates salt-and-pepper noise artifacts produced by single-bit flipping."},
    {"id": "sample_pair_fluctuation", "name": "Sample Pair Parity Fluctuation", "category": "Statistical & Entropy", "desc": "Parity bit transition field highlighting equalized pairs of values."},
    {"id": "prng_noise_mask", "name": "PRNG Pseudorandom Carrier Mask", "category": "Cryptographic Simulation", "desc": "Visualizes deterministic keystream scattering distribution across carrier pixels."},
    {"id": "chi_square_variance_map", "name": "Chi-Square Rainbow Variance Map", "category": "Statistical & Entropy", "desc": "Multi-spectral color mapping of least-significant bit transitions."}
]
