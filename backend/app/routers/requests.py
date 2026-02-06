from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models import RequestForm, PaginatedRequestsResponse, RequestFormCreate
from app.supabase_client import supabase

router = APIRouter(prefix="/api/requests", tags=["requests"])

@router.get("/", response_model=PaginatedRequestsResponse)
async def get_requests(
    page: int = Query(0, ge=0),
    page_size: int = Query(10, ge=1, le=1000),
    requester_id: Optional[str] = None
):
    try:
        query = supabase.table("requests").select("*, items:request_items(*)", count="exact").is_("deleted_at", "null")
        
        if requester_id:
            query = query.eq("requester_id", requester_id)
            
        start = page * page_size
        end = start + page_size - 1
        
        response = query.range(start, end).order("created_at", desc=True).execute()
        
        data = response.data
        count = response.count
        
        print(f"DEBUG: Fetched {len(data) if data else 0} requests")
        
        # Format data to match Pydantic model
        formatted_data = []
        for r in data:
            try:
                formatted_data.append({
                    "id": str(r["id"]),
                    "name": r["name"],
                    "category": r["category"],
                    "budget_source": r.get("budget_source", ""),
                    "cash_advance": float(r.get("cash_advance") or 0),
                    "event_date": r["event_date"],
                    "status": r["status"],
                    "total_cost": float(r.get("total_cost") or 0),
                    "created_at": r["created_at"],
                    "requester_id": r.get("requester_id", ""),
                    "items": [
                        {
                            "id": str(i["id"]),
                            "name": i["name"],
                            "quantity": float(i["quantity"]),
                            "unit": i["unit"],
                            "price": float(i["price"]),
                            "request_id": str(i["request_id"])
                        } for i in (r.get("items") or [])
                    ]
                })
            except Exception as format_error:
                print(f"DEBUG: Formatting error for request {r.get('id')}: {format_error}")
                # Log the specific row that failed
                print(f"DEBUG: Row data: {r}")
                raise format_error
            
        return PaginatedRequestsResponse(data=formatted_data, total=count or 0)
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"CRITICAL ERROR: {e}\n{error_trace}")
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")

@router.post("/", response_model=RequestForm)
async def create_request(request_data: RequestFormCreate, requester_id: str):
    # Note: requester_id should ideally come from auth token in a real app
    try:
        # 1. Insert request
        request_payload = {
            "name": request_data.name,
            "category": request_data.category,
            "budget_source": request_data.budget_source,
            "cash_advance": request_data.cash_advance,
            "event_date": request_data.event_date,
            "status": request_data.status.value if request_data.status else "DRAFT",
            "requester_id": requester_id,
            "total_cost": sum(item.quantity * item.price for item in request_data.items)
        }
        
        res = supabase.table("requests").insert(request_payload).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create request")
        
        new_request = res.data[0]
        request_id = new_request["id"]
        
        # 2. Insert items
        if request_data.items:
            items_payload = [
                {
                    "name": item.name,
                    "quantity": item.quantity,
                    "unit": item.unit,
                    "price": item.price,
                    "request_id": request_id
                } for item in request_data.items
            ]
            supabase.table("request_items").insert(items_payload).execute()
            
        # 3. Fetch full request with items for response
        full_res = supabase.table("requests").select("*, items:request_items(*)").eq("id", request_id).single().execute()
        r = full_res.data
        
        return {
            "id": str(r["id"]),
            "name": r["name"],
            "category": r["category"],
            "budget_source": r["budget_source"],
            "cash_advance": float(r["cash_advance"] or 0),
            "event_date": r["event_date"],
            "status": r["status"],
            "total_cost": float(r["total_cost"] or 0),
            "created_at": r["created_at"],
            "requester_id": r["requester_id"],
            "items": [
                {
                    "id": str(i["id"]),
                    "name": i["name"],
                    "quantity": float(i["quantity"]),
                    "unit": i["unit"],
                    "price": float(i["price"]),
                    "request_id": str(i["request_id"])
                } for i in r.get("items", [])
            ]
        }
    except Exception as e:
        print(f"Error creating request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{request_id}", response_model=RequestForm)
async def update_request(request_id: int, request_data: RequestFormCreate):
    try:
        # 1. Update request
        request_payload = {
            "name": request_data.name,
            "category": request_data.category,
            "budget_source": request_data.budget_source,
            "cash_advance": request_data.cash_advance,
            "event_date": request_data.event_date,
            "status": request_data.status.value if request_data.status else "DRAFT",
            "total_cost": sum(item.quantity * item.price for item in request_data.items)
        }
        
        res = supabase.table("requests").update(request_payload).eq("id", request_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # 2. Update items (delete and re-insert)
        supabase.table("request_items").delete().eq("request_id", request_id).execute()
        
        if request_data.items:
            items_payload = [
                {
                    "name": item.name,
                    "quantity": item.quantity,
                    "unit": item.unit,
                    "price": item.price,
                    "request_id": request_id
                } for item in request_data.items
            ]
            supabase.table("request_items").insert(items_payload).execute()
            
        # 3. Fetch full updated request
        full_res = supabase.table("requests").select("*, items:request_items(*)").eq("id", request_id).single().execute()
        r = full_res.data
        
        return {
            "id": str(r["id"]),
            "name": r["name"],
            "category": r["category"],
            "budget_source": r["budget_source"],
            "cash_advance": float(r["cash_advance"] or 0),
            "event_date": r["event_date"],
            "status": r["status"],
            "total_cost": float(r["total_cost"] or 0),
            "created_at": r["created_at"],
            "requester_id": r["requester_id"],
            "items": [
                {
                    "id": str(i["id"]),
                    "name": i["name"],
                    "quantity": float(i["quantity"]),
                    "unit": i["unit"],
                    "price": float(i["price"]),
                    "request_id": str(i["request_id"])
                } for i in r.get("items", [])
            ]
        }
    except Exception as e:
        print(f"Error updating request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{request_id}/review")
async def process_review(request_id: int, decision: str, reviewer_id: str):
    try:
        status_map = {
            "approve": "APPROVED",
            "deny": "DENIED",
            "revision": "REVISION"
        }
        
        if decision not in status_map:
            raise HTTPException(status_code=400, detail="Invalid decision")
            
        res = supabase.table("requests").update({"status": status_map[decision]}).eq("id", request_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Request not found")
            
        return {"status": "success", "new_status": status_map[decision]}
    except Exception as e:
        print(f"Error processing review: {e}")
        raise HTTPException(status_code=500, detail=str(e))
