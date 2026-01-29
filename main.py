
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import mimetypes
import os

# Ensure .tsx and .ts are served as javascript for the browser-native ESM setup
mimetypes.add_type('application/javascript', '.ts')
mimetypes.add_type('application/javascript', '.tsx')

app = FastAPI(title="Nexus Enterprise API")

# Production CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Tighten this in production to your Render URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock API Route Example (To be expanded into full controllers)
@app.get("/api/v1/health")
async def health_check():
    return {"status": "operational", "node": "nexus-alpha-1"}

# Static Files - This serves your frontend files
# We mount the root directory. FastAPI will look for files requested by index.html
app.mount("/", StaticFiles(directory=".", html=True), name="static")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # This ensures that if a user refreshes on a sub-route, 
    # and you aren't using HashRouter, they still get the index.html
    # Since you ARE using HashRouter, this is a secondary safety net.
    return FileResponse("index.html")

if __name__ == "__main__":
    import uvicorn
    # Render provides the PORT environment variable
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
