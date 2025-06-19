from django.contrib import admin
from unfold.admin import ModelAdmin, StackedInline

from unfold.admin import ModelAdmin
from import_export.admin import ImportExportModelAdmin
from unfold.contrib.import_export.forms import ExportForm, ImportForm, SelectableFieldsExportForm

from .models import Problem, Category, Tags, TestCase, ExecutionTestCase, Function, Language, Examples

class TestCaseAdminUi(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm

admin.site.register(TestCase, TestCaseAdminUi)


class ExecutionTestCaseInlineAdmin(StackedInline):  # unfold.admin.StackedInline
    model = ExecutionTestCase
    extra = 1


class FunctionInlineAdmin(StackedInline):  # unfold.admin.StackedInline
    model = Function
    extra = 1


@admin.register(Problem)
class ProblemAdmin(ModelAdmin):  # unfold.admin.ModelAdmin
    list_display = ["id", "title", "slug", "description", "difficulty", "created_at", "updated_at"]
    list_per_page = 20
    inlines = [ExecutionTestCaseInlineAdmin, FunctionInlineAdmin]


@admin.register(Language)
class LanguageAdmin(ModelAdmin):
    list_display = ["id", "name", "slug", "created_at", "updated_at"]
    list_display_links = ["name"]
    list_per_page = 5


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ["id", "name", "slug"]


# @admin.register(TestCase)
# class TestCaseAdmin(ModelAdmin):
#     list_display = ["id", "input_txt", "output_txt"]
#     list_per_page = 20


@admin.register(ExecutionTestCase)
class ExecutionTestCaseAdmin(ModelAdmin):
    list_display = ["id", "code", "created_at", "updated_at"]
    list_per_page = 20


@admin.register(Function)
class FunctionAdmin(ModelAdmin):
    list_display = ["id", "function", "created_at", "updated_at"]
    list_per_page = 20


@admin.register(Examples)
class ExamplesAdmin(ModelAdmin):
    list_display = ["id", "input_txt", "output_txt", "explanation"]
    list_per_page = 20


@admin.register(Tags)
class TagsAdmin(ModelAdmin):  # Iltimos: `ExamplesAdmin` deb xato yozilgan edi, to'g'irlandi.
    list_display = ["id", "name"]
    list_per_page = 20
