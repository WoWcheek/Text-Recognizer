import json
import base64
import logging
import asyncio
import aiohttp
from aiogram.types import Message, PhotoSize
from aiogram import Bot, Dispatcher, Router

with open("appsettings.json", "r") as file:
    config = json.load(file)
    TOKEN = config.get("TelegramBotToken")
    BACKEND_URL = config.get("BackendServerUrl")

bot = Bot(token=TOKEN)
dp = Dispatcher()
router = Router()
dp.include_router(router)

@router.message(lambda message: message.photo)
async def process_image(message: Message):
    photo: PhotoSize = message.photo[-1]
    file = await bot.get_file(photo.file_id)
    file_path = file.file_path
    file_url = f"https://api.telegram.org/file/bot{TOKEN}/{file_path}"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(file_url) as resp:
            image_data = await resp.read()
            image_b64 = "data:image/png;base64," + base64.b64encode(image_data).decode("utf-8")

            logging.info(f"Encoded image: {image_b64[:50]}...")
            
            payload = {"image": image_b64}
            async with session.post(f"{BACKEND_URL}/image/telegram-read-from-image?telegram_id={message.from_user.id}", json=payload) as response:
                response_json = await response.json()
                logging.info(f"Response from image processing: {response_json}")
                decoded_text = response_json.get("decoded_text", "Не вдалося розпізнати текст.")
                await message.answer(f"Розпізнаний текст: {decoded_text}")

@router.message(lambda message: message.text == "/start")
async def start_command(message: Message):
    await message.answer("Вітаю! Введіть вашу email-адресу для підключення.")

@router.message(lambda message: "@" in message.text and "." in message.text)
async def get_email(message: Message):
    user_data = {
        "telegram_id": str(message.from_user.id),
        "name": message.from_user.full_name,
        "email": message.text.strip()
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{BACKEND_URL}/auth/telegram", json=user_data) as response:
            response_data = await response.json()
            logging.info(f"Response from server for telegram auth: {response_data}")
            if response_data.get("ok") == True:
                await message.answer("Ваш email було збережено та відправлено на сервер!")
            elif response_data.get("code") == 1:
                await message.answer("Акаунту з вказаним email-ом не існує.")
            elif response_data.get("code") == 2:
                await message.answer("Ви вже підключили свій акаунт до Telegram.")
            else:
                await message.answer("Виникла помилка при обробці запиту.")

@router.message(lambda message: message.text == "/me")
async def get_user_info(message: Message):
    user_data = {"telegram_id": str(message.from_user.id)}
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{BACKEND_URL}/telegram/me", json=user_data) as response:
            response_json = await response.json()
            logging.info(f"Response from /telegram/me: {response_json}")
            await message.answer(f"Ваше ім'я: {response_json.get('user').get('name')}\n"
                                 f"Ваша пошта: {response_json.get('user').get('email')}\n"
                                 f"Ваша підписка: {response_json.get('user').get('subscription').get('type')}\n"
                                 f"Ваш поточний ліміт: {response_json.get('user').get('limits').get('count')} запитів\n")

@router.message(lambda message: message.text == "/image")
async def request_image(message: Message):
    await message.answer("Будь ласка, надішліть зображення з текстом для розпізнавання.")

async def main():
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())