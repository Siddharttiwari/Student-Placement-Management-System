
from django.utils import timezone


def check_student_eligibility(student, drive):
    """
    Check whether a student is eligible for a placement drive.

    Returns:
        {
            "eligible": bool,
            "reasons": list[str]
        }
    """

    reasons = []

    # Check whether applications are open
    if drive.status != "OPEN":
        reasons.append("This placement drive is not open.")

    # Check application deadline
    if drive.application_deadline < timezone.localdate():
        reasons.append("The application deadline has passed.")

    # Check minimum CGPA
    if student.cgpa < drive.minimum_cgpa:
        reasons.append(
            f"Minimum required CGPA is {drive.minimum_cgpa}."
        )

    # Check eligible courses
    eligible_courses = {
        course.strip().upper()
        for course in drive.eligible_courses.split(",")
        if course.strip()
    }

    student_course = student.course.strip().upper()

    if student_course not in eligible_courses:
        reasons.append(
            f"Your course ({student.course}) is not eligible."
        )

    return {
        "eligible": len(reasons) == 0,
        "reasons": reasons,
    }
