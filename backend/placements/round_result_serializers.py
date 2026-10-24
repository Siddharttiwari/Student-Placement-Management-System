
from rest_framework import serializers

from .models import StudentRoundResult


class StudentRoundResultSerializer(serializers.ModelSerializer):
    round_number = serializers.IntegerField(
        source="round.round_number",
        read_only=True
    )

    round_name = serializers.CharField(
        source="round.round_name",
        read_only=True
    )

    class Meta:
        model = StudentRoundResult

        fields = [
            "id",
            "application",
            "round",
            "round_number",
            "round_name",
            "result",
            "remarks",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "application",
            "round",
            "updated_at",
        ]


class RoundResultUpdateSerializer(serializers.Serializer):
    result = serializers.ChoiceField(
        choices=[
            StudentRoundResult.Result.QUALIFIED,
            StudentRoundResult.Result.REJECTED,
        ]
    )

    remarks = serializers.CharField(
        required=False,
        allow_blank=True
    )
