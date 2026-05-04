from rest_framework.permissions import BasePermission

# Main User.role integers (api.models User.add_to_class); same as serializers._get_assigned_micro_role.
_MAIN_APP_SK_ROLE = 8
_MAIN_APP_SHW_ROLE = 9


def _norm_micro_role(profile):
    if not profile:
        return ""
    return (getattr(profile, "micro_role", "") or "").strip().lower()


def get_malaria_role(user):
    if not user or not user.is_authenticated or not getattr(user, "is_active", False):
        return None
    if user.is_superuser or getattr(user, "role", None) == 1:
        return "admin"
    # SK/SHW may only be flagged on the main User.role, with empty micro_role / no malaria_role row.
    if getattr(user, "role", None) in (_MAIN_APP_SK_ROLE, _MAIN_APP_SHW_ROLE):
        return "sk"
    role_obj = getattr(user, "malaria_role", None)
    explicit_role = getattr(role_obj, "role", None)
    if explicit_role in {"admin", "sk"}:
        return explicit_role

    # Fallback for microstatification users not present in malaria_role table.
    profile = getattr(user, "profile", None)
    micro_role = _norm_micro_role(profile)
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
    # Allow users with microstatification roles (SK, SHW, micro_admin); normalize case (e.g. "SHW").
    profile = getattr(user, "profile", None)
    micro_role = _norm_micro_role(profile)
    if profile and micro_role in {"sk", "shw", "micro_admin"}:
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
