from django.contrib import admin
from .models import StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):

    list_display = (
        'roll_number',
        'full_name',
        'course',
        'branch',
        'cgpa',
        'graduation_year',
    )

    search_fields = (
        'roll_number',
        'full_name',
        'course',
    )

    list_filter = (
        'course',
        'branch',
        'graduation_year',
    )
