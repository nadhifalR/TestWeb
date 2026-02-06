from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class RequestStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DENIED = "DENIED"
    REVISION = "REVISION"
    SUBMITTED = "SUBMITTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class RequestItemBase(BaseModel):
    name: str
    quantity: float
    unit: str
    price: float

class RequestItemCreate(RequestItemBase):
    pass

class RequestItem(RequestItemBase):
    id: str
    request_id: str

    class Config:
        from_attributes = True

class RequestFormBase(BaseModel):
    name: str
    category: str
    budget_source: str
    cash_advance: float = 0.0
    event_date: str

class RequestFormCreate(RequestFormBase):
    items: List[RequestItemCreate]
    status: Optional[RequestStatus] = RequestStatus.DRAFT

class RequestForm(RequestFormBase):
    id: str
    requester_id: Optional[str] = None
    status: RequestStatus
    total_cost: float
    created_at: datetime
    items: List[RequestItem] = []

    class Config:
        from_attributes = True

class PaginatedRequestsResponse(BaseModel):
    data: List[RequestForm]
    total: int
