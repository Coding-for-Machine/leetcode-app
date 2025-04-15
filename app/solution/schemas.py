from typing import List, Optional
from pydantic import BaseModel

class BaseCustomInput(BaseModel):  # Typo tuzatildi
    input_txt: str

class SolutionSchema(BaseModel):
    problem_id: int
    language_id: int
    code: str
    # custom_inputs: Optional[List[BaseCustomInput]] = None  # Typo tuzatildi

class SolutionResponseSchema(BaseModel):
    id: int
    user_id: int
    problem_id: int
    language_id: int
    code: str
    is_accepted: bool
    execution_time: float
    memory_usage: int
    testcases_json: str  # Test holatlarining natijalari JSON formatida


class RunCodeSchema(BaseModel):
    language_id: int  # Dasturlash tili ID
    code: str  # Foydalanuvchining kiritgan kodi