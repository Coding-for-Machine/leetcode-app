from ninja_extra import NinjaExtraAPI
from ninja_jwt.controller import NinjaJWTDefaultController

api = NinjaExtraAPI()

api.register_controllers(NinjaJWTDefaultController)


# apps api
from contest.api import contest_router
from userstatus.api import activity_router
api.add_router("contest/", contest_router)
api.add_router("activaty/", activity_router)

