# from ninja import Router
# from ninja.errors import HttpError
# from django.shortcuts import get_object_or_404
# from django.http import HttpRequest
# from lessons.models import Lesson
# from .models import Course, Enrollment, MyModules
# from .schemas import CoursesListResponse
# from userstatus.models import UserLessonStatus

# api_course = Router()

# @api_course.get("/courses/", response=CoursesListResponse)
# def get_courses(request: HttpRequest):
#     user = request.user
#     enrolled_courses = []

#     if user.is_authenticated:
#         if user.is_superuser or user.is_staff:
#             enrolled_courses = Course.objects.all()
#         elif user.groups.filter(name="Teacher").exists():
#             enrolled_courses = Course.objects.filter(user=user, is_active=True)
#         else:
#             enrollments = Enrollment.objects.filter(user=user, is_paid=True)
#             enrolled_courses = [enrollment.course for enrollment in enrollments]
    
#     all_courses = Course.objects.filter(is_active=True).exclude(id__in=[course.id for course in enrolled_courses])

#     response_data = {
#         "all": [
#             {
#                 "title": course.title,
#                 "slug": course.slug,
#                 "price": course.price,
#                 "description": course.description,
#                 "thumbnail": course.thumbnail,
#                 "lesson_count": course.lesson_count or 0,
#                 "trailer": course.trailer,
#             }
#             for course in all_courses
#         ],
#         "enrolled": [
#             {
#                 "title": course.title,
#                 "slug": course.slug,
#                 "price": course.price,
#                 "description": course.description,
#                 "thumbnail": course.thumbnail,
#                 "lesson_count": course.lesson_count or 0,
#                 "trailer": course.trailer,
#             }
#             for course in enrolled_courses
#         ],
#     }
#     return response_data


# # Bitta kursni slug orqali olish
# @api_course.get("/courses/{slug}", response={200: dict, 404: str})
# def get_course_by_slug(request: HttpRequest, slug: str):
#     user = request.user
#     course = get_object_or_404(Course, slug=slug)

#     is_authenticated = user.is_authenticated

#     enrolled = False
#     if is_authenticated:
#         enrolled = Enrollment.objects.filter(user=user, course=course, is_active=True).exists()
#     modules = MyModules.objects.filter(course=course)

#     course_data = {
#         "courses_and_lesson": [
#             {
#                 "slug": course.slug,
#                 "title": course.title,
#                 "price": course.price,
#                 "description": course.description,
#                 "trailer": course.trailer,
#                 "thumbnail": course.thumbnail,
#                 "lesson_count": course.lesson_count or 0,
#                 "modules": [
#                     {
#                         "slug": module.slug,
#                         "title": module.title,
#                         "description": module.description,
#                         "lessons": [
#                             {
#                                 "slug": lesson.slug,
#                                 "title": lesson.title,
#                                 "type": lesson.lesson_type,
#                                 "locked": not (enrolled or lesson.preview),
#                                 "preview": lesson.preview,
#                                 "lesson_status": [
#                                     {
#                                         "is_complete": status.is_completed,
#                                         "progress": status.progress,
#                                     }
#                                     for status in UserLessonStatus.objects.filter(lesson=lesson, user=user)
#                                 ]
#                                 if is_authenticated else [],
#                             }
#                             for lesson in Lesson.objects.filter(module=module)
#                         ],
#                     }
#                     for module in modules
#                 ],
#             }
#         ],
#         "enrolled": enrolled,
#     }

#     return course_data