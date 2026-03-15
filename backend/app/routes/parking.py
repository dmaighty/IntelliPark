from fastapi import APIRouter

router = APIRouter(prefix="/parking", tags=["parking"])


@router.get("")
def list_parking():
    return []
