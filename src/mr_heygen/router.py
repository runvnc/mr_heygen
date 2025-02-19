from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from lib.templates import render
import os
import requests
import json
from loguru import logger
from dotenv import load_dotenv
load_dotenv(override=True)

HEYGEN_API_KEY = os.getenv("HEY_API_KEY")

router = APIRouter()

@router.get("/mr_heygen/tempkey", response_class=HTMLResponse)
async def get_tempkey(request: Request):
    user = request.state.user if hasattr(request.state, "user") else {"username": "guest"}

    # Create HeyGen streaming token
    url = "https://api.heygen.com/v1/streaming.create_token"
    headers = {
        "x-api-key": HEYGEN_API_KEY
    }
    
    response = requests.post(url, headers=headers)
    data = response.json()
    return data["token"]