from rest_framework.permissions import BasePermission


def get_malaria_role(user):
    if not user or not user.is_authenticated or not getattr(user, "is_active", False):
        return None
    if user.is_superuser or getattr(user, "role", None) == 1:
        return "admin"
    role_obj = getattr(user, "malaria_role", None)
    explicit_role = getattr(role_obj, "role", None)
    if explicit_role in {"admin", "sk"}:
        return explicit_role

    # Fallback for microstatification users not present in malaria_role table.
    profile = getattr(user, "profile", None)
    micro_role = getattr(profile, "micro_role", "") if profile else ""
    if micro_role == "micro_admin":
        return "admin"
    if micro_role in {"sk", "shw"}:
        return "sk"

    return None


def has_malaria_access(user):
    if not user or not user.is_authenticated:
        return False
    # Allow admins and superusers
    if user.is_superuser or get_malaria_role(user) in {"admin", "sk"}:
        return True
    # Allow users with microstatification roles (SK, SHW, micro_admin)
    profile = getattr(user, 'profile', None)
    if profile and profile.micro_role in {"sk", "shw", "micro_admin"}:
        return True
    return False


def is_malaria_admin(user):
    return get_malaria_role(user) == "admin"


class HasMalariaAccess(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and has_malaria_access(request.user))


class IsMalariaAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and is_malaria_admin(request.user))
