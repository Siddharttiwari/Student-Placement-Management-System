
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from .models import StudentProfile

User = get_user_model()


class TPOStudentListSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True
    )
    email = serializers.EmailField(
        source="user.email",
        read_only=True
    )
    is_active = serializers.BooleanField(
        source="user.is_active",
        read_only=True
    )

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "username",
            "email",
            "roll_number",
            "full_name",
            "course",
            "branch",
            "cgpa",
            "graduation_year",
            "phone_number",
            "resume",
            "is_active",
            "created_at",
        ]



class TPOStudentCreateSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        max_length=150,
        source="user.username"
    )

    email = serializers.EmailField(
        source="user.email"
    )

    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"}
    )

    class Meta:
        model = StudentProfile

        fields = [
            "id",
            "username",
            "email",
            "password",
            "roll_number",
            "full_name",
            "course",
            "branch",
            "cgpa",
            "graduation_year",
            "phone_number",
        ]

        read_only_fields = ["id"]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "This username already exists."
            )
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "This email is already registered."
            )
        return value

    def validate_password(self, value):
        from django.contrib.auth.password_validation import (
            validate_password
        )

        validate_password(value)
        return value

    @transaction.atomic
    def create(self, validated_data):

        user_data = validated_data.pop("user")

        username = user_data["username"]
        email = user_data["email"]
        password = validated_data.pop("password")

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role="STUDENT",
        )

        student = StudentProfile.objects.create(
            user=user,
            **validated_data
        )

        return student


class TPOStudentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = [
            "full_name",
            "course",
            "branch",
            "cgpa",
            "graduation_year",
            "phone_number",
        ]
