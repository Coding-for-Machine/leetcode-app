import random
import string
import uuid


def generate_slug_with_case(length=8):
    characters = string.ascii_lowercase + string.ascii_uppercase + string.digits
    slug = ''.join(random.choice(characters) for _ in range(length))
    return slug