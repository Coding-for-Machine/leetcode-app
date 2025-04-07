from django.contrib import admin
from .models import Problem, Category, TestCase, ExecutionTestCase, Function, Language

class ExecutionTestCaseInlineAdmin(admin.StackedInline):
    model = ExecutionTestCase
    extra = 1


class FunctionInlineAdmin(admin.StackedInline):  # ModelAdmin emas, StackedInline bo'lishi kerak
    model = Function
    extra = 1

@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "slug", "description", "difficulty", "created_at", "updated_at"]
    list_per_page = 20
    inlines = [ExecutionTestCaseInlineAdmin, FunctionInlineAdmin]  # String emas, class nomi bo'lishi kerak
@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "slug", "created_at", "updated_at"]
    list_display_links = ["name"]
    list_per_page = 5

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "slug"]

@admin.register(TestCase)
class TestCaseAdmin(admin.ModelAdmin):
    list_display = ["id", "input_txt", "output_txt"]
    list_per_page = 20

@admin.register(ExecutionTestCase)
class ExecutionTestCaseAdmin(admin.ModelAdmin):
    list_display = ["id", "code", "created_at", "updated_at"]
    list_per_page = 20

@admin.register(Function)
class FunctionAdmin(admin.ModelAdmin):
    list_display = ["id", "function", "created_at", "updated_at"]
    list_per_page = 20
