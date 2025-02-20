from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from lib.templates import render
import os
import requests
import json
from loguru import logger
from dotenv import load_dotenv
load_dotenv(override=True)

HEYGEN_API_KEY = os.getenv("HEYGEN_API_KEY")

router = APIRouter()

@router.get("/heygen/tempkey", response_class=HTMLResponse)
async def get_tempkey(request: Request):
    user = request.state.user if hasattr(request.state, "user") else {"username": "guest"}

    # Create HeyGen streaming token
    url = "https://api.heygen.com/v1/streaming.create_token"
    headers = {
        "x-api-key": HEYGEN_API_KEY
    }
    
    response = requests.post(url, headers=headers)
    data = response.json()
    print(data)
    return data["data"]["token"]

ex = """
    {
    quality: AvatarQuality.Medium,
    transparent: true,
    scale: 1.5,
    voice: {
      voiceId: '166aa8d7acd1495a839d34024ccb1505',
      rate: 1.0,
      emotion: VoiceEmotion.FRIENDLY,
      elevenlabs_settings: {
        stability:0.55,
        similarity_boost:0.55,
        style: 0,
        use_speaker_boost: true
      }
    },
    knowledgeBase: `Your name is assistant`,
    avatarName: "default" */
  });
"""


@router.get("/heygen/avatarsettings/{persona_name}", response_class=JSONResponse)
async def get_avatarsettings(request: Request, persona_name: str):
    user = request.state.user if hasattr(request.state, "user") else {"username": "guest"}
    pwd = os.getcwd()
    heygen_path = os.path.join(pwd, 'personas', 'local', user.username, persona_name, 'heygen.json')
    # if there is no file, return default settings
    if not os.path.exists(heygen_path):
        return {
            "quality": "AvatarQuality.Medium",
            "transparent": True,
            "scale": 1.5,
            "voice": {
                "voiceId": "166aa8d7acd1495a839d34024ccb1505",
                "rate": 1.0,
                "emotion": "VoiceEmotion.FRIENDLY",
                "elevenlabs_settings": {
                    "stability": 0.55,
                    "similarity_boost": 0.55,
                    "style": 0,
                    "use_speaker_boost": True
                }
            },
            "knowledgeBase": "Your name is assistant",
            "avatarName": "default"
        }
    with open(heygen_path, 'r') as f:
        return json.load(f)

@router.post("/heygen/avatarsettings/{persona_name}", response_class=JSONResponse)
async def post_avatarsettings(request: Request, persona_name: str):
    user = request.state.user if hasattr(request.state, "user") else {"username": "guest"}
    # Get the JSON data from the request body
    try:
        settings_data = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON data")
    # Validate required fields
    required_fields = ["quality", "transparent", "scale", "voice", "knowledgeBase", "avatarName"]
    for field in required_fields:
        if field not in settings_data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

    # Save the settings to the heygen.json file
    pwd = os.getcwd()
    heygen_path = os.path.join(pwd, 'personas', 'local', user.username, persona_name, 'heygen.json')
    os.makedirs(os.path.dirname(heygen_path), exist_ok=True)
    with open(heygen_path, 'w') as f:
        json.dump(settings_data, f, indent=4)
    return settings_data

