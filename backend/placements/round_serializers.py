
from rest_framework import serializers

from .models import RecruitmentRound


class RecruitmentRoundSerializer(serializers.ModelSerializer):

    class Meta:
        model = RecruitmentRound

        fields = [
            "id",
            "drive",
            "round_number",
            "round_name",
            "round_type",
            "description",
            "scheduled_date",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "drive",
            "created_at",
        ]

    def validate_round_number(self, value):
        if value < 1:
            raise serializers.ValidationError(
                "Round number must be at least 1."
            )
        return value

    def validate(self, attrs):
        drive = self.context["drive"]
        round_number = attrs.get("round_number")

        if RecruitmentRound.objects.filter(
            drive=drive,
            round_number=round_number
        ).exists():
            raise serializers.ValidationError({
                "round_number": (
                    "This round number already exists "
                    "for this placement drive."
                )
            })

        return attrs
