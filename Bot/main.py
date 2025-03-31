import json
import logging
import asyncio
import aiohttp
from aiogram.types import Message
from aiogram import Bot, Dispatcher, Router

with open("appsettings.json", "r") as file:
    config = json.load(file)
    TOKEN = config.get("TelegramBotToken")
    BACKEND_URL = config.get("BackendServerUrl")

bot = Bot(token=TOKEN)
dp = Dispatcher()
router = Router()
dp.include_router(router)

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

async def main():
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())