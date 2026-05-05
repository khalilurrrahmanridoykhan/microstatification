from rest_framework.permissions import BasePermission

# Main User.role integers (api.models User.add_to_class); aligned with serializers._get_assigned_micro_role.
_MAIN_APP_SK_ROLE = 8
_MAIN_APP_SHW_ROLE = 9
_MAIN_APP_DM_ROLE = 10
_MAIN_APP_SPO_ROLE = 11


def _norm_micro_role(profile):
    if not profile:
        return ""
    return (getattr(profile, "micro_role", "") or "").strip().lower()


def get_dm_district_id(user):
    """District PK for a District Manager, or None."""
    profile = getattr(user, "profile", None) if user else None
    if not profile:
        return None
    return getattr(profile, "micro_district_id", None) or None


def get_user_district_id(user):
    """District PK for any user (DM, SPO, SK, SHW, etc.), or None."""
    profile = getattr(user, "profile", None) if user else None
    if not profile:
        return None
    # Try to get district from profile's micro_district (DM, SPO, SK, SHW)
    return getattr(profile, "micro_district_id", None) or None


def get_malaria_role(user):
    """
    Canonical malaria-facing role for API/session: admin | dm | spo | None.
    """
    if not user or not user.is_authenticated or not getattr(user, "is_active", False):
        return None
    if user.is_superuser or getattr(user, "role", None) == 1:
        return "admin"

    role_obj = getattr(user, "malaria_role", None)
    explicit_role = getattr(role_obj, "role", None) if role_obj else None
    if explicit_role == "admin":
        return "admin"
    if explicit_role in {"dm"}:
        return "dm" if get_dm_district_id(user) else None
    if explicit_role in {"spo", "sk"}:
        return "spo"

    ur = getattr(user, "role", None)
    if ur == _MAIN_APP_DM_ROLE:
        return "dm" if get_dm_district_id(user) else None
    if ur in (_MAIN_APP_SK_ROLE, _MAIN_APP_SHW_ROLE, _MAIN_APP_SPO_ROLE):
        return "spo"

    profile = getattr(user, "profile", None)
    micro_role = _norm_micro_role(profile)

    if micro_role == "micro_admin":
        return "admin"
    if micro_role in {"dm", "district_manager"}:
        return "dm" if get_dm_district_id(user) else None
    if micro_role in {"sk", "shw", "spo"}:
        return "spo"

    return None


def has_malaria_access(user):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    role = get_malaria_role(user)
    if role in {"admin", "dm", "spo"}:
        return True
    profile = getattr(user, "profile", None)
    micro_role = _norm_micro_role(profile)
    if profile and micro_role == "micro_admin":
        return True
    if profile and micro_role in {"sk", "shw", "spo"}:
        return True
    if profile and micro_role in {"dm", "district_manager"}:
        return bool(get_dm_district_id(user))
    return False


def is_malaria_global_admin(user):
    """Full platform / all-district malaria admin (not DM)."""
    return get_malaria_role(user) == "admin"


def is_malaria_dm(user):
    return get_malaria_role(user) == "dm"


def has_malaria_privileged_access(user):
    """Global admin or district manager (admin-like within district)."""
    r = get_malaria_role(user)
    return r in {"admin", "dm"}


def is_malaria_admin(user):
    """Deprecated name: use is_malaria_global_admin. Kept for gradual refactors."""
    return is_malaria_global_admin(user)


class HasMalariaAccess(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and has_malaria_access(request.user))


class IsMalariaGlobalAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and is_malaria_global_admin(request.user))


class IsMalariaPrivileged(BasePermission):
    """Global admin or District Manager."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and has_malaria_privileged_access(request.user))


class IsMalariaAdmin(BasePermission):
    """All-district admin only (excludes DM). Prefer IsMalariaGlobalAdmin in new code."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and is_malaria_global_admin(request.user))
