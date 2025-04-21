import json
from ninja import Router
from django.http import StreamingHttpResponse
import asyncio
from django.shortcuts import get_object_or_404
from typing import List
from django.contrib.auth.models import User
from .models import Solution
from problems.models import TestCase
from problems.models import Problem, Language, ExecutionTestCase
from .schemas import RunCodeSchema, SolutionSchema, SolutionResponseSchema
from .run_code import post_server
from problems.run_code import run
from users.auth import JWTBaseAuth

solution_url_api = Router(tags=["Run-Code"])

@solution_url_api.post("/create/", response=dict, auth=JWTBaseAuth())
def create_solution(request, payload: SolutionSchema):
    user = request.user
    print(user)
    problem = get_object_or_404(Problem, id=payload.problem_id)
    language = get_object_or_404(Language, id=payload.language_id)
    execution_test_case = get_object_or_404(ExecutionTestCase, problem=problem, language=language)

    test_cases = [
        {"input_txt": test.input_txt, "output_txt": test.output_txt, "is_correct": test.is_correct}
        for test in TestCase.objects.filter(problem=problem)
    ]

    def generate():
        test_results = []
        total_time_ms = 0
        total_memory_kb = 0
        all_passed = True  # Barcha testlardan o'tganligini tekshirish uchun
        
        for result in run(f"\n{payload.code}\n\n{execution_test_case.code}", test_cases):
            test_results.append(result)
            print(result)
            # Har bir test natijasini qayta ishlash
            for test_data in result.values():
                total_time_ms += test_data.get("time_ms", 0)
                total_memory_kb += test_data.get("memory_kb", 0)
                
                # Agar birorta test o'tmasa, is_accepted=False
                if not test_data.get("passed", False):
                    all_passed = False
            
            yield json.dumps(result) + "\n"
        
        # O'rtacha vaqt va xotira hisoblash
        avg_time_ms = total_time_ms / len(test_cases) if test_cases else 0
        avg_memory_kb = total_memory_kb / len(test_cases) if test_cases else 0
        
        # Solution yaratish
        Solution.objects.create(
            user=user,
            problem=problem,
            language=language,
            code=payload.code,
            is_accepted=all_passed,
            execution_time=avg_time_ms,
            memory_usage=avg_memory_kb,
            testcases_json=json.dumps(test_results)
        )

    return StreamingHttpResponse(generate(), content_type="application/json")


@solution_url_api.get("/read/", response=List[SolutionResponseSchema])
def get_solutions(request):
    return Solution.objects.all()


@solution_url_api.get("/{user_id}", response=List[SolutionResponseSchema])
def get_user_solutions(request, user_id: int):
    return Solution.objects.filter(user__id=user_id)


@solution_url_api.get("/problem/{problem_id}", response=List[SolutionResponseSchema])
def get_problem_solutions(request, problem_id: int):
    return Solution.objects.filter(problem__id=problem_id)

