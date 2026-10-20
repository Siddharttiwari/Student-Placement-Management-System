
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from students.models import StudentProfile

User = get_user_model()


class StudentRegistrationSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    roll_number = serializers.CharField(
        max_length=30,
        write_only=True
    )

    full_name = serializers.CharField(
        max_length=150,
        write_only=True
    )

    course = serializers.CharField(
        max_length=100,
        write_only=True
    )

    branch = serializers.CharField(
        max_length=100,
        write_only=True
    )

    cgpa = serializers.DecimalField(
        max_digits=4,
        decimal_places=2,
        min_value=0,
        max_value=10,
        write_only=True
    )

    graduation_year = serializers.IntegerField(
        min_value=2000,
        write_only=True
    )

    phone_number = serializers.CharField(
        max_length=15,
        write_only=True
    )

    class Meta:
        model = User

        fields = [
            'username',
            'email',
            'password',
            'roll_number',
            'full_name',
            'course',
            'branch',
            'cgpa',
            'graduation_year',
            'phone_number',
        ]

    def validate_roll_number(self, value):
        if StudentProfile.objects.filter(
            roll_number=value
        ).exists():
            raise serializers.ValidationError(
                "This roll number is already registered."
            )
        return value

    @transaction.atomic
    def create(self, validated_data):

        profile_fields = [
            'roll_number',
            'full_name',
            'course',
            'branch',
            'cgpa',
            'graduation_year',
            'phone_number',
        ]

        profile_data = {
            field: validated_data.pop(field)
            for field in profile_fields
        }

        password = validated_data.pop('password')

        user = User.objects.create_user(
            password=password,
            role='STUDENT',
            **validated_data
        )

        StudentProfile.objects.create(
            user=user,
            **profile_data
        )

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )


