import uvicorn
import string
import jwt
import random
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from db.models.User import User 

from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware
from datetime import datetime, timedelta
from fastapi.openapi.utils import get_openapi
from utils.get_user import verify_token

from routes.monobank_route import monobank

from routes.user_route import user_route
from routes.image_route import image_route

from config import config


SECRET_KEY = config['SECRET']
GOOGLE_CLIENT_ID = config['GOOGLE_CLIENT_ID']
GOOGLE_CLIENT_SECRET = config['GOOGLE_CLIENT_SECRET']
REDIRECT_URI = config['REDIRECT_URI']


app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_route, prefix="/user", tags=["Users"])
app.include_router(image_route, prefix="/image")

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Your API",
        version="1.0.0",
        description="API with JWT",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    for path in openapi_schema["paths"]:
        for method in openapi_schema["paths"][path]:
            openapi_schema["paths"][path][method]["security"] = [{"BearerAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

app.include_router(monobank)

oauth = OAuth()
oauth.register(
    name="google",
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    client_kwargs={
        'scope': 'openid email profile'
    }
)

def create_jwt_token(email: str, name: str):
    payload = {
        "sub": email,
        "name": name,
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

@app.get("/")
def home():
    return {"message": "Google OAuth2 + Middleware"}

@app.get("/auth/google")
async def login(request: Request):
    return await oauth.google.authorize_redirect(request, REDIRECT_URI)

@app.get("/auth/google/callback")
async def auth_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        if not token:
            raise HTTPException(status_code=400, detail="Failed to fetch access token")

        userinfo = token.get("userinfo")
        if not userinfo:
            userinfo = await oauth.google.parse_id_token(request, token)

        if not userinfo.get("email"):
            raise HTTPException(status_code=400, detail="Failed to get user email")

        email = userinfo["email"]
        name = userinfo.get("name", "")

        if User.users_collection.count_documents({'email': email}) == 0:
            new_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=20))
            User.create({
                '_id': new_id,
                'email': email,
                'name': name,
                'role': 'user', 
                'limits': {
                    'count': 0,
                    'time': -1
                },
                'subscription': {
                    'type': 'free',
                    'time': -1,
                }
            })
        else:
            User.users_collection.update_one(
                {'email': email},
                {"$set": {"name": name}}
            )

        jwt_token = create_jwt_token(email=email, name=name)

        return RedirectResponse(url=f"http://localhost:3000?token={jwt_token}", status_code=302)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))




if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=80)