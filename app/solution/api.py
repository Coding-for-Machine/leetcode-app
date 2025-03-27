from ninja import Router
from django.shortcuts import get_object_or_404
from .models import Solution
from users.models import MyUser
from problems.models import Problem, Language, TestCase
from ninja import Router
from .schemas import *
from .run_code import post_server

from typing import List
solution_url_api = Router()


"""{
  "user_id": 1,
  "problem_id": 1,
  "language_id": 1,
  "code": "class Node:\n    def __init__(self, data):\n        self.data = data\n        self.next = None\n\nclass LinkedList:\n    def __init__(self):\n        self.head = None\n\n    def append(self, data):\n        new_node = Node(data)\n        if not self.head:\n            self.head = new_node\n            return\n        last = self.head\n        while last.next:\n            last = last.next\n        last.next = new_node\n\n    def find(self, data):\n        current = self.head\n        while current:\n            if current.data == data:\n                return True\n            current = current.next\n        return False\n\n    def delete(self, data):\n        current = self.head\n        if current and current.data == data:\n            self.head = current.next\n            return\n        prev = None\n        while current and current.data != data:\n            prev = current\n            current = current.next\n        if current:\n            prev.next = current.next\n\n    def to_list(self):\n        result = []\n        current = self.head\n        while current:\n            result.append(current.data)\n            current = current.next\n        return result"
}"""
#  (Foydalanuvchi yechimini yaratish)
@solution_url_api.post("/solutions/", response=SolutionResponseSchema)
def create_solution(request, payload: SolutionSchema):
    """Foydalanuvchi yechimini yaratish va Docker API orqali tekshirish"""
    
    user = request.user
    problem = get_object_or_404(Problem, id=payload.problem_id)
    language = get_object_or_404(Language, id=payload.language_id)

    test_case = TestCase.objects.filter(problem=problem, language=language).first()
    
    if not test_case:
        return {"error": "Test case topilmadi!"}

    user_code = payload.code

    docker_data = {
        "user_code": user_code,
        "language": language.name,

        "test_cases": test_case.input_data_bottom
    }
    response = post_server(docker_data)

    if response is None:
        return {"error": "Kod bajarilmadi, Docker API ishlamayapti!"}

    solution = Solution.create(
        user=user,
        problem=problem,
        language=language,
        code=user_code,
        is_accepted=response.get("is_accepted", False),
        execution_time=response.get("time", 0),
        memory_usage=response.get("memory", 0)
    )

    # 🔹 JSON formatga mos ravishda qaytarish
    return SolutionResponseSchema.from_orm(solution)


@solution_url_api.get("/solutions/", response=List[SolutionResponseSchema])
def get_solutions(request):
    return Solution.objects.all()

@solution_url_api.get("/solutions/user/{user_id}", response=List[SolutionResponseSchema])
def get_user_solutions(request, user_id: int):
    return Solution.objects.filter(user__id=user_id)

@solution_url_api.get("/solutions/problem/{problem_id}", response=List[SolutionResponseSchema])
def get_problem_solutions(request, problem_id: int):
    return Solution.objects.filter(problem__id=problem_id)



