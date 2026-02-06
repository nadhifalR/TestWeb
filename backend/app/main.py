from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Nexus Enterprise API", version="1.0.0")

# Configure CORS for frontend communication
# In production, replace ["*"] with your actual frontend domain from Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "operational", "system": "Nexus Enterprise API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
