from ninja import Router
from django.shortcuts import get_object_or_404
from .models import Solution
from problems.models import TestCase
from django.contrib.auth.models import User
from problems.models import Problem, Language, ExecutionTestCase
from .schemas import RunCodeSchema, SolutionSchema, SolutionResponseSchema
from .run_code import post_server
from typing import List

solution_url_api = Router()

@solution_url_api.post("/create/", response=SolutionResponseSchema)
def create_solution(request, payload: SolutionSchema):
    user = request.user
    problem = get_object_or_404(Problem, id=payload.problem_id)
    language = get_object_or_404(Language, id=payload.language_id)

    execution_test_cases = problem.execution_problem.all()
    if execution_test_cases.exists():
        execution_test_case = execution_test_cases.first().code
    else:
        return {"error": "Execution test case topilmadi!"}

    user_code = payload.code

    # Custom inputlar ko‘p bo‘lishi mumkin
    if payload.custom_inputs:
        custom_docker_data = {
            "language": language.name,
            "user_code": user_code,
            "custom_input": []
        }

        # To‘g‘ri custom_input list yaratish
        for custom_input in payload.custom_inputs:
            custom_docker_data["custom_input"].append({"input": custom_input.input_txt})

        custom_response = post_server(custom_docker_data)
        if custom_response is None:
            return {"error": "Kod bajarilmadi, Docker API ishlamayapti!"}

        user_outputs = custom_response.get("output", "").strip().split("\n")

        for input_txt, output_txt in zip(custom_docker_data["custom_input"], user_outputs):
            TestCase.objects.create(
                problem=problem,
                language=language,
                input_txt=input_txt["input"],
                output_txt=output_txt,
                user=user
            )

    # Barcha test case-larni Docker ga yuborish
    docker_data = {
        "language": language.name,
        "user_code": user_code,
        "executiontestcase": execution_test_case,
        "test_cases": [
            {"input_txt": test.input_txt, "output_txt": test.output_txt}
            for test in TestCase.objects.filter(problem=problem, language=language)
        ]
    }

    response = post_server(docker_data)

    if response is None:
        return {"error": "Kod bajarilmadi, Docker API ishlamayapti!"}

    solution = Solution.objects.create(
        user=user,
        problem=problem,
        language=language,
        code=user_code,
        is_accepted=response.get("is_accepted", False),
        execution_time=response.get("time", 0),
        memory_usage=response.get("memory", 0),
        testcases_json=response.get("testcase", "")
    )

    return solution


@solution_url_api.post("/run_code/", response=dict)
def run_user_code(request, payload: RunCodeSchema):
    language = get_object_or_404(Language, id=payload.language_id)
    user_code = payload.code
    custom_input = payload.custom_input

    if not custom_input:
        return {"error": "Input kiritilmagan!"}

    docker_data = {
        "language": language.name,
        "user_code": user_code,
        "custom_input": custom_input
    }

    response = post_server(docker_data)

    if response is None:
        return {"error": "Kod bajarilmadi, Docker API ishlamayapti!"}

    return {
        "user_output": response.get("output", ""),
        "execution_time": response.get("time", 0),
        "memory_usage": response.get("memory", 0)
    }


@solution_url_api.get("/read/", response=List[SolutionResponseSchema])
def get_solutions(request):
    return Solution.objects.all()


@solution_url_api.get("/{user_id}", response=List[SolutionResponseSchema])
def get_user_solutions(request, user_id: int):
    return Solution.objects.filter(user__id=user_id)


@solution_url_api.get("/problem/{problem_id}", response=List[SolutionResponseSchema])
def get_problem_solutions(request, problem_id: int):
    return Solution.objects.filter(problem__id=problem_id)
