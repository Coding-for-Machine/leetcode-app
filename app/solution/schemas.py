from pydantic import BaseModel

# 🔹 Yechim so‘rovlarini olish uchun Pydantic schema
class SolutionSchema(BaseModel):
    problem_id: int
    language_id: int
    code: str

class SolutionResponseSchema(BaseModel):
    id: int
    user_id: int
    problem_id: int
    language_id: int
    code: str
    is_accepted: bool
    execution_time: float
    memory_usage: int
    created_at: str  # datetime -> string
    updated_at: str  # datetime -> string

    @staticmethod
    def from_orm(obj):
        return SolutionResponseSchema(
            id=obj.id,
            user_id=obj.user.id,
            problem_id=obj.problem.id,
            language_id=obj.language.id,
            code=obj.code,
            is_accepted=obj.is_accepted,
            execution_time=obj.execution_time,
            memory_usage=obj.memory_usage,
            created_at=obj.created_at.isoformat(),
            updated_at=obj.updated_at.isoformat()
        )

