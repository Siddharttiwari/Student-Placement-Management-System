from rest_framework import serializers
from .models import StudentProfile

class StudentProfileSerializer(serializers.ModelSerializer):

    username=serializers.CharField(source='user.username',read_only=True)

    email=serializers.EmailField(source='user.email',read_only=True)

    class Meta:
        model = StudentProfile

        fields = ['id','username','email','roll_number','full_name','course','branch',
                  'cgpa','graduation_year','phone_number','resume']

        read_only_fields = [
            "id",
            "roll_number",
            "course",
            "branch",
            "graduation_year",
        ]