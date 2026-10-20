from .models import JobApplication
from django.contrib import admin
from .models import PlacementDrive


@admin.register(PlacementDrive)
class PlacementDriveAdmin(admin.ModelAdmin):

    list_display = (
        "company",
        "job_title",
        "job_location",
        "package_lpa",
        "minimum_cgpa",
        "application_deadline",
        "status",
    )

    list_filter = ("status", "company")

    search_fields = (
        "job_title",
        "company__name",
        "job_location",
    )

@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):

    list_display = (
        "student",
        "drive",
        "status",
        "applied_at",
    )

    list_filter = (
        "status",
        "drive__company",
    )

    search_fields = (
        "student__full_name",
        "student__roll_number",
        "drive__job_title",
    )

    readonly_fields = (
        "applied_at",
        "updated_at",
    )
