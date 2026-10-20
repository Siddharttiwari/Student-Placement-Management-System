
from django.db import models


class Company(models.Model):

    name = models.CharField(
        max_length=150,
        unique=True
    )

    industry = models.CharField(
        max_length=100
    )

    website = models.URLField(
        blank=True
    )

    location = models.CharField(
        max_length=150
    )

    description = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
