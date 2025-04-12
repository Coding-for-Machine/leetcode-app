# from typing import Any, Dict, Optional
# from ninja.errors import HttpError

# class MyHttpError(Exception):
#     def __init__(self, status_code: int, message: str, error: Optional[dict]) -> None:
#         self.status_code = status_code
#         self.message = message
#         self.error = error
#         super().__init__(status_code, message, error)

#     def __str__(self) -> str:
#         return self.message