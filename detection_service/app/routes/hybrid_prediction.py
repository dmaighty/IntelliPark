import httpx
from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.hybrid_detector import predict_hybrid_from_bytes
from app.image_fetch import fetch_image_from_url

router = APIRouter(tags=["hybrid-prediction"])


@router.post("/hybrid-predict")
async def hybrid_predict_frame(
    file: UploadFile | None = File(
        None,
        description="",
    ),
    url: str | None = Query(
        None,
        description="",
    ),
    conf: float = Query(0.25, ge=0.0, le=1.0, description="Minimum vehicle-detection confidence"),
):
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
            detail="",
        )

    try:
        return predict_hybrid_from_bytes(raw, conf=conf)
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
            detail=f"Hybrid inference failed: {e}",
        ) from e
