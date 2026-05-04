"""SK/SHW metadata submission + admin approve/reject helpers."""

from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import Any

from django.utils import timezone

from .models import (
    METADATA_APPROVAL_APPROVED,
    METADATA_APPROVAL_PENDING,
    METADATA_APPROVAL_REJECTED,
)

# Village keys SK may propose via local record metadata (subset of FIELD_USER_VILLAGE_EDITABLE_FIELDS).
LOCAL_METADATA_VILLAGE_KEYS = frozenset(
    {
        "sk_shw_name",
        "ss_name",
        "mmw_hp_chwc_name",
        "distance_from_upazila_office_km",
        "bordering_country_name",
        "other_activities",
    }
)

LOCAL_METADATA_PROFILE_KEYS = frozenset(
    {
        "micro_sk_shw_name",
        "micro_ss_name",
        "micro_designation",
    }
)

NONLOCAL_METADATA_DISPLAY_KEYS = frozenset(
    {
        "division_name",
        "name_of_sk_shw",
        "designation",
        "name_of_ss",
        "village_name_bn",
        "village_code",
        "latitude",
        "longitude",
        "population_text",
        "hh_text",
        "itn_2026_text",
        "itn_2025_text",
        "itn_2024_text",
        "mmw_hp_chwc_name",
        "village_distance_km",
        "border_country_name",
        "other_activities",
    }
)


def _sanitize_village_value(key: str, value: Any) -> Any:
    if key == "distance_from_upazila_office_km" and value not in (None, ""):
        try:
            # JSONField / psycopg2 JSON cannot encode Decimal; store as float for pending payloads.
            return float(Decimal(str(value)))
        except (InvalidOperation, TypeError, ValueError):
            return None
    if isinstance(value, str):
        return value
    if value is None:
        return None
    return str(value)


def filter_local_metadata_submission(raw: dict | None) -> dict[str, dict[str, Any]]:
    """Return {'village': {...}, 'profile': {...}} with only allowed keys."""
    out: dict[str, dict[str, Any]] = {"village": {}, "profile": {}}
    if not raw or not isinstance(raw, dict):
        return out
    v_in = raw.get("village")
    if isinstance(v_in, dict):
        for k, val in v_in.items():
            if k in LOCAL_METADATA_VILLAGE_KEYS:
                out["village"][k] = _sanitize_village_value(k, val)
    p_in = raw.get("profile")
    if isinstance(p_in, dict):
        for k, val in p_in.items():
            if k in LOCAL_METADATA_PROFILE_KEYS:
                out["profile"][k] = str(val).strip() if val is not None else ""
    return out


def merge_local_metadata_pending(existing: dict | None, submission: dict[str, dict[str, Any]]) -> dict:
    base = {"village": dict((existing or {}).get("village") or {}), "profile": dict((existing or {}).get("profile") or {})}
    base["village"].update(submission.get("village") or {})
    base["profile"].update(submission.get("profile") or {})
    return base


def filter_nonlocal_metadata_submission(raw: dict | None) -> dict[str, Any]:
    if not raw or not isinstance(raw, dict):
        return {}
    out = {}
    for k, val in raw.items():
        if k in NONLOCAL_METADATA_DISPLAY_KEYS:
            if val is None:
                out[k] = ""
            elif isinstance(val, (str, int, float)):
                out[k] = str(val)
            else:
                out[k] = str(val)
    return out


def merge_nonlocal_metadata_pending(existing: dict | None, submission: dict[str, Any]) -> dict:
    base = dict(existing or {})
    base.update(submission)
    return base


def nonlocal_display_metadata(record) -> dict[str, Any]:
    base = dict(record.grid_metadata or {})
    if getattr(record, "metadata_approval_status", None) == METADATA_APPROVAL_PENDING and record.metadata_pending:
        if isinstance(record.metadata_pending, dict):
            base = {**base, **record.metadata_pending}
    return base


def parse_local_metadata_from_request(request_data) -> dict[str, dict[str, Any]]:
    """Only reads `metadata_submission` (not top-level sk_user_designation) to avoid marking pending on every save."""
    raw = request_data.get("metadata_submission")
    if not isinstance(raw, dict):
        raw = {}
    return filter_local_metadata_submission(raw)


def local_metadata_submission_nonempty(submission: dict[str, dict[str, Any]]) -> bool:
    return bool(submission.get("village")) or bool(submission.get("profile"))


def apply_local_metadata_pending_to_db(record, reviewer) -> None:
    from django.contrib.auth.models import User

    pending = record.metadata_pending
    if not isinstance(pending, dict):
        pending = {}
    village = record.village
    vdata = pending.get("village") or {}
    v_updates = []
    for k, val in vdata.items():
        if k not in LOCAL_METADATA_VILLAGE_KEYS:
            continue
        setattr(village, k, val)
        v_updates.append(k)
    if v_updates:
        village.save(update_fields=list(dict.fromkeys(v_updates)))

    pdata = pending.get("profile") or {}
    user = record.sk_user
    profile = getattr(user, "profile", None)
    if profile and pdata:
        p_updates = []
        for k in LOCAL_METADATA_PROFILE_KEYS:
            if k not in pdata:
                continue
            setattr(profile, k, pdata[k])
            p_updates.append(k)
        if p_updates:
            profile.save(update_fields=list(dict.fromkeys(p_updates)))

    record.metadata_pending = None
    record.metadata_approval_status = METADATA_APPROVAL_APPROVED
    record.metadata_reviewed_by = reviewer if isinstance(reviewer, User) else None
    record.metadata_reviewed_at = timezone.now()
    record.metadata_rejection_note = ""
    record.save(
        update_fields=[
            "metadata_pending",
            "metadata_approval_status",
            "metadata_reviewed_by",
            "metadata_reviewed_at",
            "metadata_rejection_note",
            "updated_at",
        ]
    )
    if hasattr(record, "_cached_local_record_assigned_user_details"):
        delattr(record, "_cached_local_record_assigned_user_details")


def apply_nonlocal_metadata_pending_to_db(record, reviewer) -> None:
    from django.contrib.auth.models import User

    pending = record.metadata_pending if isinstance(record.metadata_pending, dict) else {}
    gm = dict(record.grid_metadata or {})
    for k, val in pending.items():
        if k in NONLOCAL_METADATA_DISPLAY_KEYS:
            gm[k] = val
    record.grid_metadata = gm
    record.metadata_pending = None
    record.metadata_approval_status = METADATA_APPROVAL_APPROVED
    record.metadata_reviewed_by = reviewer if isinstance(reviewer, User) else None
    record.metadata_reviewed_at = timezone.now()
    record.metadata_rejection_note = ""
    record.save(
        update_fields=[
            "grid_metadata",
            "metadata_pending",
            "metadata_approval_status",
            "metadata_reviewed_by",
            "metadata_reviewed_at",
            "metadata_rejection_note",
            "updated_at",
        ]
    )


def reject_local_metadata(record, reviewer, note: str = "") -> None:
    from django.contrib.auth.models import User

    record.metadata_pending = None
    record.metadata_approval_status = METADATA_APPROVAL_REJECTED
    record.metadata_reviewed_by = reviewer if isinstance(reviewer, User) else None
    record.metadata_reviewed_at = timezone.now()
    record.metadata_rejection_note = (note or "")[:500]
    record.save(
        update_fields=[
            "metadata_pending",
            "metadata_approval_status",
            "metadata_reviewed_by",
            "metadata_reviewed_at",
            "metadata_rejection_note",
            "updated_at",
        ]
    )


def reject_nonlocal_metadata(record, reviewer, note: str = "") -> None:
    from django.contrib.auth.models import User

    record.metadata_pending = None
    record.metadata_approval_status = METADATA_APPROVAL_REJECTED
    record.metadata_reviewed_by = reviewer if isinstance(reviewer, User) else None
    record.metadata_reviewed_at = timezone.now()
    record.metadata_rejection_note = (note or "")[:500]
    record.save(
        update_fields=[
            "metadata_pending",
            "metadata_approval_status",
            "metadata_reviewed_by",
            "metadata_reviewed_at",
            "metadata_rejection_note",
            "updated_at",
        ]
    )
