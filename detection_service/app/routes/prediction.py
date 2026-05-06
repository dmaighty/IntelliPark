import httpx
from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.detector import predict_from_bytes
from app.image_fetch import fetch_image_from_url

router = APIRouter(tags=["prediction"])


@router.post("/predict")
async def predict_frame(
    file: UploadFile | None = File(
        None,
        description="",
    ),
    url: str | None = Query(
        None,
        description="",
    ),
    conf: float = Query(0.25, ge=0.0, le=1.0, description="Minimum confidence"),
    imgsz: int = Query(640, ge=32, le=1280, description="Inference square size"),
):
    """
    Run detection on either a multipart **file** or a remote **url** (not both).
    """
    url_stripped = (url or "").strip()
    file_bytes = b""
    if file is not None:
        file_bytes = await file.read()

    if url_stripped and file_bytes:
        raise HTTPException(
            status_code=400,
            detail="",
        )

    if url_stripped:
        try:
            raw = await fetch_image_from_url(url_stripped)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=502,
                detail=f"URL returned {e.response.status_code}: {e.response.reason_phrase}",
            ) from e
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Could not fetch URL: {e}",
            ) from e
    elif file_bytes:
        raw = file_bytes
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide either `url` (query) or non-empty multipart `file`.",
        )

    try:
        return predict_from_bytes(raw, conf=conf, imgsz=imgsz)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except OSError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not decode image: {e}",
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inference failed: {e}",
        ) from e
