from dataclasses import dataclass, field
from decimal import Decimal, InvalidOperation
import re

from django.db import transaction
from django.db.models import Count

from .models import District, LocalRecord, MonthlyApproval, Union, Upazila, Village


HEADER_ROW = 6
DATA_START_ROW = 7
HEADER_ALIASES = {
    "union_name": {"union"},
    "ward_no": {"ward no"},
    "sk_shw_name": {"name of sk/shw"},
    "ss_name": {"name of ss"},
    "village_name": {"village name (english)"},
    "village_name_bn": {"village name (bangla)"},
    "village_code": {"village code"},
    "latitude": {"latitude"},
    "longitude": {"longitute", "longitude"},
    "population": {"population"},
    "mmw_hp_chwc_name": {"name of mmw, health post & chw(c)"},
    "distance_from_upazila_office_km": {"village distance from upazila office (km)"},
    "bordering_country_name": {"name of border with others country"},
    "other_activities": {"others activities (tda/dev care)"},
}


def _clean_text(value):
    if value is None:
        return ""
    return str(value).strip()


def _normalize_header(value):
    return re.sub(r"\s+", " ", _clean_text(value)).strip().lower()


def _normalize_decimal(value):
    if value in (None, ""):
        return None
    try:
        return Decimal(str(value).strip())
    except (InvalidOperation, AttributeError, ValueError):
        return None


def _normalize_int(value):
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _row_key(upazila_name, union_name, ward_no, village_name):
    return (
        _clean_text(upazila_name),
        _clean_text(union_name),
        _clean_text(ward_no),
        _clean_text(village_name),
    )


def _build_sheet_column_map(worksheet):
    header_row = next(
        worksheet.iter_rows(min_row=HEADER_ROW, max_row=HEADER_ROW, values_only=True),
        (),
    )
    normalized_headers = {
        _normalize_header(header): index
        for index, header in enumerate(header_row)
        if header is not None and _normalize_header(header)
    }

    column_map = {}
    for field_name, aliases in HEADER_ALIASES.items():
        for alias in aliases:
            if alias in normalized_headers:
                column_map[field_name] = normalized_headers[alias]
                break

    return column_map


def _get_row_value(row, column_map, field_name):
    column_index = column_map.get(field_name)
    if column_index is None or column_index >= len(row):
        return None
    return row[column_index]


def iter_microstatification_rows(workbook):
    for sheet_name in workbook.sheetnames:
        worksheet = workbook[sheet_name]
        upazila_name = _clean_text(sheet_name)
        column_map = _build_sheet_column_map(worksheet)

        for row_idx, row in enumerate(
            worksheet.iter_rows(min_row=DATA_START_ROW, values_only=True),
            start=DATA_START_ROW,
        ):
            if not row or not row[0]:
                continue

            union_name = _clean_text(_get_row_value(row, column_map, "union_name"))
            village_name = _clean_text(_get_row_value(row, column_map, "village_name"))
            if not union_name or not village_name:
                continue

            ward_no = _clean_text(_get_row_value(row, column_map, "ward_no"))

            yield {
                "row_idx": row_idx,
                "upazila_name": upazila_name,
                "union_name": union_name,
                "ward_no": ward_no or None,
                "village_name": village_name,
                "village_name_bn": _clean_text(_get_row_value(row, column_map, "village_name_bn")),
                "village_code": _clean_text(_get_row_value(row, column_map, "village_code")),
                "latitude": _normalize_decimal(_get_row_value(row, column_map, "latitude")),
                "longitude": _normalize_decimal(_get_row_value(row, column_map, "longitude")),
                "population": _normalize_int(_get_row_value(row, column_map, "population")),
                "sk_shw_name": _clean_text(_get_row_value(row, column_map, "sk_shw_name")),
                "ss_name": _clean_text(_get_row_value(row, column_map, "ss_name")),
                "mmw_hp_chwc_name": _clean_text(_get_row_value(row, column_map, "mmw_hp_chwc_name")),
                "distance_from_upazila_office_km": _normalize_decimal(
                    _get_row_value(row, column_map, "distance_from_upazila_office_km")
                ),
                "bordering_country_name": _clean_text(
                    _get_row_value(row, column_map, "bordering_country_name")
                ),
                "other_activities": _clean_text(_get_row_value(row, column_map, "other_activities")),
            }


@dataclass
class MicrostatificationSyncResult:
    districts_created: int = 0
    upazilas_created: int = 0
    unions_created: int = 0
    villages_created: int = 0
    villages_updated: int = 0
    villages_deleted: int = 0
    local_records_deleted: int = 0
    monthly_approvals_deleted: int = 0
    unions_deleted: int = 0
    upazilas_deleted: int = 0
    parsed_data: dict = field(
        default_factory=lambda: {"upazilas": [], "unions": [], "villages": []},
    )


@transaction.atomic
def sync_microstatification_workbook(workbook, district_name, prune_stale=False):
    result = MicrostatificationSyncResult()
    parsed_upazilas = {}
    union_cache = {}
    valid_keys = set()

    district, district_created = District.objects.get_or_create(name=district_name)
    if district_created:
        result.districts_created = 1

    for item in iter_microstatification_rows(workbook):
        upazila, upazila_created = Upazila.objects.get_or_create(
            district=district,
            name=item["upazila_name"],
        )
        if upazila_created:
            result.upazilas_created += 1

        upazila_entry = parsed_upazilas.setdefault(
            upazila.name,
            {"id": upazila.id, "name": upazila.name, "unions": {}},
        )

        union_key = (upazila.id, item["union_name"])
        if union_key not in union_cache:
            union, union_created = Union.objects.get_or_create(
                upazila=upazila,
                name=item["union_name"],
            )
            union_cache[union_key] = union
            if union_created:
                result.unions_created += 1
        else:
            union = union_cache[union_key]

        union_entry = upazila_entry["unions"].setdefault(
            union.name,
            {"id": union.id, "name": union.name, "villages": []},
        )

        village_defaults = {
            "name_bn": item["village_name_bn"],
            "village_code": item["village_code"],
            "latitude": item["latitude"],
            "longitude": item["longitude"],
            "population": item["population"],
            "sk_shw_name": item["sk_shw_name"],
            "ss_name": item["ss_name"],
            "mmw_hp_chwc_name": item["mmw_hp_chwc_name"],
            "distance_from_upazila_office_km": item["distance_from_upazila_office_km"],
            "bordering_country_name": item["bordering_country_name"],
            "other_activities": item["other_activities"],
        }

        village, village_created = Village.objects.get_or_create(
            union=union,
            name=item["village_name"],
            ward_no=item["ward_no"],
            defaults=village_defaults,
        )

        if village_created:
            result.villages_created += 1
        else:
            update_fields = []
            for field_name, field_value in village_defaults.items():
                if getattr(village, field_name) != field_value:
                    setattr(village, field_name, field_value)
                    update_fields.append(field_name)

            if update_fields:
                village.save(update_fields=[*update_fields, "updated_at"])
                result.villages_updated += 1

        valid_keys.add(
            _row_key(
                item["upazila_name"],
                item["union_name"],
                item["ward_no"],
                item["village_name"],
            )
        )

        village_payload = {
            "id": village.id,
            "row_idx": item["row_idx"],
            "ward_no": item["ward_no"] or "",
            "name": item["village_name"],
            "name_bn": item["village_name_bn"],
            "village_code": item["village_code"],
        }
        union_entry["villages"].append(village_payload)
        result.parsed_data["villages"].append(village_payload)

    for upazila_entry in parsed_upazilas.values():
        unions = list(upazila_entry["unions"].values())
        upazila_entry["unions"] = unions
        result.parsed_data["upazilas"].append(upazila_entry)
        result.parsed_data["unions"].extend(unions)

    if not prune_stale:
        return result

    stale_village_ids = []
    stale_villages = Village.objects.select_related("union__upazila").filter(
        union__upazila__district=district
    )
    for village in stale_villages.iterator():
        village_key = _row_key(
            village.union.upazila.name,
            village.union.name,
            village.ward_no,
            village.name,
        )
        if village_key not in valid_keys:
            stale_village_ids.append(village.id)

    if stale_village_ids:
        result.villages_deleted = len(stale_village_ids)
        result.local_records_deleted = LocalRecord.objects.filter(
            village_id__in=stale_village_ids
        ).count()
        result.monthly_approvals_deleted = MonthlyApproval.objects.filter(
            local_record__village_id__in=stale_village_ids
        ).count()
        Village.objects.filter(id__in=stale_village_ids).delete()

    empty_union_ids = list(
        Union.objects.filter(upazila__district=district)
        .annotate(village_count=Count("villages"))
        .filter(village_count=0)
        .values_list("id", flat=True)
    )
    if empty_union_ids:
        result.unions_deleted = len(empty_union_ids)
        Union.objects.filter(id__in=empty_union_ids).delete()

    empty_upazila_ids = list(
        Upazila.objects.filter(district=district)
        .annotate(union_count=Count("unions"))
        .filter(union_count=0)
        .values_list("id", flat=True)
    )
    if empty_upazila_ids:
        result.upazilas_deleted = len(empty_upazila_ids)
        Upazila.objects.filter(id__in=empty_upazila_ids).delete()

    return result
