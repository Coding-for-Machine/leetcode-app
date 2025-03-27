import os
from dotenv import load_dotenv
import httpx

# .env faylini yuklash
load_dotenv()

# Docker API manzilini yuklash
DOCKER_API = os.getenv("DOCKER_BACKEND_API", "http://ip172-18-0-76-cupi9liim2rg00eath6g-3000.direct.labs.play-with-docker.com/run-test")

def post_server(data):
    try:
        print(f"DOCKER_API manzili: {DOCKER_API}")
        print(f"So‘rov yuborilmoqda: {data}")

        response = httpx.post(DOCKER_API, json=data, timeout=60)

        if response.status_code in [200, 201]:
            result = response.json()
            if "error" in result:
                print(f"Docker API xatosi: {result['error']}")
                return None
            return result
        else:
            print(f"Xatolik! Status code: {response.status_code}, Javob: {response.text}")
    except httpx.RequestError as e:
        print(f"API so‘rovda xatolik: {e}")
    return None  