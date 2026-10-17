"""
StegnoFlow - Enterprise Production Steganography & Steganalysis Suite
FastAPI High-Performance Backend & Web Service.
Ready for deployment on Render, Docker, and local environments.
"""

import io
import os
import base64
import json
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

# Core Modules
from core.crypto import encrypt_payload, decrypt_payload
from core.image_stego import hide_in_image, extract_from_image, calculate_capacity
from core.steganalysis import (
    run_comprehensive_steganalysis,
    compute_psnr_mse,
    extract_bit_plane
)
from core.effects import apply_effect, EFFECTS_LIST
from core.text_stego import (
    hide_text_in_text,
    extract_text_from_text,
    generate_homoglyphs,
    detect_homoglyphs
)
from core.audio_stego import (
    hide_in_audio,
    extract_from_audio,
    get_audio_capacity
)
from core.file_stego import (
    inject_eof_payload,
    extract_eof_payload
)
from core.utils import (
    compute_multi_hashes,
    calculate_password_strength,
    generate_synthetic_audio_carrier,
    strip_image_metadata,
    hide_in_pdf,
    extract_from_pdf,
    batch_scan_images
)

app = FastAPI(
    title="StegnoFlow - Enterprise Cyber Intelligence Steganography Platform",
    description="Full-spectrum multi-medium carrier encoder, statistical forensic detector, and intelligence analysis suite.",
    version="2.5.0"
)

# Enable CORS for cross-origin or API testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
os.makedirs("static/css", exist_ok=True)
os.makedirs("static/js", exist_ok=True)
os.makedirs("templates", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/health")
def health_check():
    """Render health check endpoint."""
    return {"status": "healthy", "service": "StegnoFlow", "version": "2.0.0"}

@app.get("/", response_class=HTMLResponse)
def index():
    """Serves the main 3D Cyberpunk GUI."""
    template_path = os.path.join("templates", "index.html")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h2>StegnoFlow Initializing...</h2>")

# ----------------- IMAGE STEGANOGRAPHY ENDPOINTS -----------------

@app.post("/api/image/capacity")
async def api_image_capacity(file: UploadFile = File(...)):
    """Computes exact embedding capacity across bit depths."""
    content = await file.read()
    img = Image.open(io.BytesIO(content))
    cap_1bit = calculate_capacity(img, bits_per_channel=1, channels="RGB")
    cap_2bit = calculate_capacity(img, bits_per_channel=2, channels="RGB")
    cap_4bit = calculate_capacity(img, bits_per_channel=4, channels="RGB")
    return {
        "dimensions": f"{img.width}x{img.height}",
        "total_pixels": img.width * img.height,
        "format": img.format or "PNG",
        "capacity_1bit_lsb": cap_1bit,
        "capacity_2bit_lsb": cap_2bit,
        "capacity_4bit_lsb": cap_4bit
    }

@app.post("/api/image/hide")
async def api_image_hide(
    carrier: UploadFile = File(...),
    secret_text: Optional[str] = Form(None),
    secret_file: Optional[UploadFile] = File(None),
    passphrase: Optional[str] = Form(None),
    bits_per_channel: int = Form(1),
    channels: str = Form("RGB"),
    scatter: bool = Form(True)
):
    """Encodes text or arbitrary file into image with optional AES-256-GCM."""
    carrier_bytes = await carrier.read()
    carrier_img = Image.open(io.BytesIO(carrier_bytes))

    if secret_file and secret_file.filename:
        payload_bytes = await secret_file.read()
    elif secret_text:
        payload_bytes = secret_text.encode("utf-8")
    else:
        raise HTTPException(status_code=400, detail="Either secret_text or secret_file must be provided.")

    try:
        stego_img, meta = hide_in_image(
            carrier_img,
            payload_bytes,
            passphrase=passphrase if passphrase else None,
            bits_per_channel=bits_per_channel,
            channels=channels,
            scatter=scatter
        )
        
        # Calculate PSNR degradation metrics
        psnr_metrics = compute_psnr_mse(carrier_img, stego_img)
        meta["psnr_db"] = psnr_metrics["psnr"]
        meta["mse"] = psnr_metrics["mse"]
        meta["ssim"] = psnr_metrics["ssim_approx"]

        buf = io.BytesIO()
        stego_img.save(buf, format="PNG")
        buf.seek(0)
        img_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        return {
            "success": True,
            "metadata": meta,
            "image_data_url": f"data:image/png;base64,{img_b64}"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/image/extract")
async def api_image_extract(
    stego_image: UploadFile = File(...),
    passphrase: Optional[str] = Form(None),
    bits_per_channel: int = Form(1),
    channels: str = Form("RGB"),
    scatter: bool = Form(True)
):
    """Extracts and decrypts secret payload from stego image."""
    content = await stego_image.read()
    img = Image.open(io.BytesIO(content))

    success, payload_bytes, msg = extract_from_image(
        img,
        passphrase=passphrase if passphrase else None,
        bits_per_channel=bits_per_channel,
        channels=channels,
        scatter=scatter
    )

    if not success:
        return {"success": False, "message": msg}

    # Detect if payload is utf-8 text or binary
    try:
        text_content = payload_bytes.decode("utf-8")
        is_text = True
    except UnicodeDecodeError:
        text_content = ""
        is_text = False

    b64_content = base64.b64encode(payload_bytes).decode("utf-8")

    return {
        "success": True,
        "message": msg,
        "is_text": is_text,
        "text_content": text_content,
        "byte_length": len(payload_bytes),
        "base64_data": b64_content
    }

# ----------------- STEGANALYSIS & FORENSIC LAB -----------------

@app.post("/api/analyze/steganalysis")
async def api_steganalysis(
    file: UploadFile = File(...),
    original: Optional[UploadFile] = File(None)
):
    """Runs comprehensive statistical steganalysis suite."""
    content = await file.read()
    img = Image.open(io.BytesIO(content))

    report = run_comprehensive_steganalysis(img)

    # If original image is supplied, calculate PSNR/SSIM
    if original and original.filename:
        orig_content = await original.read()
        orig_img = Image.open(io.BytesIO(orig_content))
        if orig_img.size == img.size:
            report["psnr_metrics"] = compute_psnr_mse(orig_img, img)

    # Generate preview of LSB bit plane 0
    lsb_img = extract_bit_plane(img, plane=0, channel="R")
    buf = io.BytesIO()
    lsb_img.save(buf, format="PNG")
    buf.seek(0)
    report["lsb_plane_data_url"] = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"

    # Compute RGB Pixel Histograms (64 bins for clean Chart.js plotting)
    rgb_arr = np.array(img.convert("RGB"))
    r_hist, _ = np.histogram(rgb_arr[:, :, 0], bins=64, range=(0, 256))
    g_hist, _ = np.histogram(rgb_arr[:, :, 1], bins=64, range=(0, 256))
    b_hist, _ = np.histogram(rgb_arr[:, :, 2], bins=64, range=(0, 256))

    # Compute Pairs-of-Values (PoVs) Even/Odd Histogram Comparison
    gray_arr = np.array(img.convert("L")).flatten()
    gray_hist, _ = np.histogram(gray_arr, bins=256, range=(0, 256))
    pov_pairs = []
    for k in range(16):
        pov_pairs.append({
            "pair": f"({2*k},{2*k+1})",
            "even": int(gray_hist[2 * k]),
            "odd": int(gray_hist[2 * k + 1])
        })

    report["histogram_analysis"] = {
        "rgb": {
            "labels": [str(i * 4) for i in range(64)],
            "red": r_hist.tolist(),
            "green": g_hist.tolist(),
            "blue": b_hist.tolist()
        },
        "povs": pov_pairs
    }

    return report

# ----------------- 25+ FORENSIC EFFECTS GALLERY -----------------

@app.get("/api/effects/list")
def api_effects_list():
    """Lists all available 25+ forensic and visual filters."""
    return {"total": len(EFFECTS_LIST), "effects": EFFECTS_LIST}

@app.post("/api/effects/apply")
async def api_effects_apply(
    image: UploadFile = File(...),
    effect_id: str = Form(...)
):
    """Applies specific forensic filter to uploaded image."""
    content = await image.read()
    img = Image.open(io.BytesIO(content))

    processed = apply_effect(img, effect_id)
    buf = io.BytesIO()
    processed.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")

# ----------------- INVISIBLE TEXT STEGANOGRAPHY -----------------

@app.post("/api/text/hide")
async def api_text_hide(payload: dict):
    """Encodes secret text using zero-width Unicode characters."""
    cover_text = payload.get("cover_text", "")
    secret_text = payload.get("secret_text", "")
    passphrase = payload.get("passphrase", None)
    position = payload.get("position", "words")

    if not secret_text:
        raise HTTPException(status_code=400, detail="secret_text is required.")

    stego_text, meta = hide_text_in_text(cover_text, secret_text, passphrase, position)
    return {"success": True, "stego_text": stego_text, "metadata": meta}

@app.post("/api/text/extract")
async def api_text_extract(payload: dict):
    """Extracts and decrypts zero-width text payload."""
    stego_text = payload.get("stego_text", "")
    passphrase = payload.get("passphrase", None)

    if not stego_text:
        raise HTTPException(status_code=400, detail="stego_text is required.")

    success, secret_msg, info = extract_text_from_text(stego_text, passphrase)
    return {"success": success, "secret_message": secret_msg, "message": info}

@app.post("/api/text/homoglyphs")
async def api_text_homoglyphs(payload: dict):
    """Generates Cyrillic lookalike homoglyphs for anti-detection / bypass."""
    text = payload.get("text", "")
    substituted, count = generate_homoglyphs(text)
    return {"substituted_text": substituted, "replacements_count": count}

@app.post("/api/text/detect")
async def api_text_detect(payload: dict):
    """Scans text for zero-width characters and homoglyph substitution."""
    text = payload.get("text", "")
    return detect_homoglyphs(text)

# ----------------- AUDIO WAV STEGANOGRAPHY -----------------

@app.post("/api/audio/capacity")
async def api_audio_capacity(audio: UploadFile = File(...)):
    """Calculates capacity of WAV carrier."""
    content = await audio.read()
    return get_audio_capacity(content)

@app.post("/api/audio/hide")
async def api_audio_hide(
    audio: UploadFile = File(...),
    secret_text: Optional[str] = Form(None),
    secret_file: Optional[UploadFile] = File(None),
    passphrase: Optional[str] = Form(None)
):
    """Embeds encrypted payload into WAV audio PCM LSB."""
    wav_bytes = await audio.read()
    if secret_file and secret_file.filename:
        payload_bytes = await secret_file.read()
    elif secret_text:
        payload_bytes = secret_text.encode("utf-8")
    else:
        raise HTTPException(status_code=400, detail="No secret payload supplied.")

    try:
        stego_wav, meta = hide_in_audio(wav_bytes, payload_bytes, passphrase)
        b64_audio = base64.b64encode(stego_wav).decode("utf-8")
        return {
            "success": True,
            "metadata": meta,
            "audio_data_url": f"data:audio/wav;base64,{b64_audio}"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/audio/extract")
async def api_audio_extract(
    audio: UploadFile = File(...),
    passphrase: Optional[str] = Form(None)
):
    """Extracts payload from WAV PCM LSB."""
    wav_bytes = await audio.read()
    success, payload_bytes, msg = extract_from_audio(wav_bytes, passphrase)
    if not success:
        return {"success": False, "message": msg}

    try:
        text_content = payload_bytes.decode("utf-8")
        is_text = True
    except UnicodeDecodeError:
        text_content = ""
        is_text = False

    return {
        "success": True,
        "message": msg,
        "is_text": is_text,
        "text_content": text_content,
        "byte_length": len(payload_bytes),
        "base64_data": base64.b64encode(payload_bytes).decode("utf-8")
    }

# ----------------- POLYGLOT & FILE CARVING STEGO -----------------

@app.post("/api/eof/hide")
async def api_eof_hide(
    carrier: UploadFile = File(...),
    secret_file: UploadFile = File(...),
    passphrase: Optional[str] = Form(None)
):
    """Appends encrypted file payload past EOF marker (Polyglot)."""
    carrier_bytes = await carrier.read()
    file_bytes = await secret_file.read()
    filename = secret_file.filename or "secret.bin"

    output_bytes, meta = inject_eof_payload(carrier_bytes, file_bytes, filename, passphrase)
    buf = io.BytesIO(output_bytes)
    return StreamingResponse(
        buf,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename=stego_{carrier.filename}"}
    )

@app.post("/api/eof/extract")
async def api_eof_extract(
    carrier: UploadFile = File(...),
    passphrase: Optional[str] = Form(None)
):
    """Extracts polyglot payload appended to file trailer."""
    carrier_bytes = await carrier.read()
    success, filename, file_bytes, msg = extract_eof_payload(carrier_bytes, passphrase)
    if not success:
        return {"success": False, "message": msg}

    return {
        "success": True,
        "filename": filename,
        "size_bytes": len(file_bytes),
        "message": msg,
        "base64_data": base64.b64encode(file_bytes).decode("utf-8")
    }

# ----------------- ADVANCED FORENSIC TOOLS & EXTENSIONS -----------------

@app.post("/api/pdf/hide")
async def api_pdf_hide(
    pdf: UploadFile = File(...),
    secret_text: Optional[str] = Form(None),
    secret_file: Optional[UploadFile] = File(None),
    passphrase: Optional[str] = Form(None)
):
    """Injects encrypted payload into PDF document."""
    pdf_bytes = await pdf.read()
    if secret_file and secret_file.filename:
        payload_bytes = await secret_file.read()
    elif secret_text:
        payload_bytes = secret_text.encode("utf-8")
    else:
        raise HTTPException(status_code=400, detail="No secret payload provided.")

    stego_pdf, meta = hide_in_pdf(pdf_bytes, payload_bytes, passphrase)
    buf = io.BytesIO(stego_pdf)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=stego_{pdf.filename}"}
    )

@app.post("/api/pdf/extract")
async def api_pdf_extract(
    pdf: UploadFile = File(...),
    passphrase: Optional[str] = Form(None)
):
    """Extracts encrypted payload from PDF document."""
    pdf_bytes = await pdf.read()
    success, payload_bytes, msg = extract_from_pdf(pdf_bytes, passphrase)
    if not success:
        return {"success": False, "message": msg}

    try:
        text_content = payload_bytes.decode("utf-8")
        is_text = True
    except UnicodeDecodeError:
        text_content = ""
        is_text = False

    return {
        "success": True,
        "message": msg,
        "is_text": is_text,
        "text_content": text_content,
        "byte_length": len(payload_bytes),
        "base64_data": base64.b64encode(payload_bytes).decode("utf-8")
    }

@app.post("/api/audio/synthesize")
async def api_audio_synthesize(
    duration: float = Form(3.0),
    tone_type: str = Form("ambient")
):
    """Generates synthetic WAV audio carrier for instant steganography."""
    wav_bytes = generate_synthetic_audio_carrier(duration_sec=duration, tone_type=tone_type)
    buf = io.BytesIO(wav_bytes)
    return StreamingResponse(
        buf,
        media_type="audio/wav",
        headers={"Content-Disposition": f"attachment; filename=synth_{tone_type}.wav"}
    )

@app.post("/api/tools/hash")
async def api_tools_hash(file: UploadFile = File(...)):
    """Computes cryptographic hashes (MD5, SHA1, SHA256, SHA512) for file integrity."""
    content = await file.read()
    return compute_multi_hashes(content)

@app.post("/api/tools/password-strength")
async def api_password_strength(payload: dict):
    """Computes cryptographic password entropy bits and rating."""
    pw = payload.get("password", "")
    return calculate_password_strength(pw)

@app.post("/api/tools/sanitize-image")
async def api_sanitize_image(image: UploadFile = File(...)):
    """Strips all EXIF, GPS, and camera metadata from image."""
    content = await image.read()
    img = Image.open(io.BytesIO(content))
    clean_img, stripped_count = strip_image_metadata(img)
    
    buf = io.BytesIO()
    clean_img.save(buf, format="PNG")
    buf.seek(0)
    
    return StreamingResponse(
        buf,
        media_type="image/png",
        headers={"X-Metadata-Keys-Stripped": str(stripped_count), "Content-Disposition": f"attachment; filename=clean_{image.filename}"}
    )

@app.post("/api/analyze/batch")
async def api_analyze_batch(files: list[UploadFile] = File(...)):
    """Scans multiple images for steganographic anomalies in batch."""
    images = []
    for f in files:
        b = await f.read()
        images.append((f.filename, b))
    
    results = batch_scan_images(images)
    return {"total_scanned": len(results), "results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=False)
