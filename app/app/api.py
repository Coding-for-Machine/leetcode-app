from ninja_extra import NinjaExtraAPI
from ninja_jwt.controller import NinjaJWTDefaultController

api = NinjaExtraAPI()

api.register_controllers(NinjaJWTDefaultController)


# apps api
from contest.api import contest_router
from userstatus.api import activity_router
from commits.api import api_comments_router_like
from users.api import user_router

api.add_router("user/", user_router)
api.add_router("contest/", contest_router)
api.add_router("activaty/", activity_router)
api.add_router("comment/", api_comments_router_like)

