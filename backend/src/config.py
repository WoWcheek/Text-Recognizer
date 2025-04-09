import os
from dotenv import load_dotenv

load_dotenv()

config = {
    'mongodb_url': os.getenv('MONGODB_URL'),
    'GOOGLE_CLIENT_SECRET': os.getenv('GOOGLE_CLIENT_SECRET'),
    'REDIRECT_URI': os.getenv('REDIRECT_URI'),
    'GOOGLE_CLIENT_ID': os.getenv('GOOGLE_CLIENT_ID'),
    'SECRET': os.getenv('SECRET'),

    # Monobank Personal API
    'MONOBANK_PERSONAL_TOKEN': os.getenv('MONOBANK_PERSONAL_TOKEN'),
    'MONOBANK_ACCOUNT_ID': os.getenv('MONOBANK_ACCOUNT_ID'),
}
