from ninja_extra import NinjaExtraAPI
from ninja_jwt.controller import NinjaJWTDefaultController

api = NinjaExtraAPI(version="1.0.0")

api.register_controllers(NinjaJWTDefaultController)


# apps api
from contest.api import contest_router
from userstatus.api import activity_router
from commits.api import api_comments_router_like
from users.api import user_router
from problems.problem_api import api_problem_router
from solution.api import solution_url_api
from quizs.api import router



api.add_router("/", router)
api.add_router("user/", user_router)
api.add_router("contest/", contest_router)
api.add_router("activaty/", activity_router)
api.add_router("comment/", api_comments_router_like)
api.add_router("solution/", solution_url_api)
api.add_router("problems/", api_problem_router)
