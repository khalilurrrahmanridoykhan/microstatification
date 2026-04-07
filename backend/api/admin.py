from django.contrib import admin
from .models import AppVersion


@admin.register(AppVersion)
class AppVersionAdmin(admin.ModelAdmin):
    list_display = ('id', 'version', 'created_at')
    search_fields = ('version', 'update_info')
    ordering = ('-created_at', '-id')
