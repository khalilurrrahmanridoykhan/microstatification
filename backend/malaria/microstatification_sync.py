import csv
from dataclasses import dataclass, field
from decimal import Decimal, InvalidOperation
from pathlib import Path
import re

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Count

from .models import District, LocalRecord, MicrostatificationDataUpload, MonthlyApproval, Union, Upazila, Village


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
CSV_HEADER_ALIASES = {
    "district_name": {"district"},
    "upazila_name": {"upazila"},
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
    "hh": {"hh number"},
    "itn_2026": {"2026 (active llins)"},
    "itn_2025": {"2025 (active llins)"},
    "itn_2024": {"2024 (active llins)"},
    "jan_cases": {"january"},
    "feb_cases": {"february"},
    "mar_cases": {"march"},
    "apr_cases": {"april"},
    "may_cases": {"may"},
    "jun_cases": {"june"},
    "jul_cases": {"july"},
    "aug_cases": {"august"},
    "sep_cases": {"september"},
    "oct_cases": {"october"},
    "nov_cases": {"november"},
    "dec_cases": {"december"},
    "mmw_hp_chwc_name": {"name of mmw, health post & chw(c)"},
    "distance_from_upazila_office_km": {"village distance from upazila office (km)"},
    "bordering_country_name": {"name of border with others country"},
    "other_activities": {"others activities (tda/dev care)"},
}
CSV_ENCODINGS = ("utf-8-sig", "utf-8", "cp1252", "latin-1")
LOCAL_RECORD_FIELD_NAMES = (
    "hh",
    "itn_2024",
    "itn_2025",
    "itn_2026",
    "jan_cases",
    "feb_cases",
    "mar_cases",
    "apr_cases",
    "may_cases",
    "jun_cases",
    "jul_cases",
    "aug_cases",
    "sep_cases",
    "oct_cases",
    "nov_cases",
    "dec_cases",
)


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


def _row_key(upazila_name, union_name, ward_no, village_name, village_code):
    return (
        _clean_text(upazila_name),
        _clean_text(union_name),
        _clean_text(ward_no),
        _clean_text(village_name),
        _clean_text(village_code),
    )


def _get_or_create_village(union, item, village_defaults):
    village_code = _clean_text(item.get("village_code"))
    village_lookup = {
        "union": union,
        "name": item["village_name"],
        "ward_no": item["ward_no"],
    }

    if village_code:
        try:
            return Village.objects.get(
                **village_lookup,
                village_code=village_code,
            ), False
        except Village.DoesNotExist:
            legacy_without_code = Village.objects.filter(
                **village_lookup,
                village_code="",
            ).first()
            if legacy_without_code is not None:
                legacy_without_code.village_code = village_code
                legacy_without_code.save(update_fields=["village_code", "updated_at"])
                return legacy_without_code, False

            village_with_code = {**village_lookup, "village_code": village_code}
            return Village.objects.get_or_create(
                **village_with_code,
                defaults=village_defaults,
            )

    return Village.objects.get_or_create(
        **village_lookup,
        defaults=village_defaults,
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
    local_records_created: int = 0
    local_records_updated: int = 0
    villages_deleted: int = 0
    local_records_deleted: int = 0
    monthly_approvals_deleted: int = 0
    unions_deleted: int = 0
    upazilas_deleted: int = 0
    districts_deleted: int = 0
    uploads_deleted: int = 0
    files_processed: int = 0
    rows_processed: int = 0
    parsed_data: dict = field(
        default_factory=lambda: {"upazilas": [], "unions": [], "villages": []},
    )

    def absorb(self, other):
        self.districts_created += other.districts_created
        self.upazilas_created += other.upazilas_created
        self.unions_created += other.unions_created
        self.villages_created += other.villages_created
        self.villages_updated += other.villages_updated
        self.local_records_created += other.local_records_created
        self.local_records_updated += other.local_records_updated
        self.villages_deleted += other.villages_deleted
        self.local_records_deleted += other.local_records_deleted
        self.monthly_approvals_deleted += other.monthly_approvals_deleted
        self.unions_deleted += other.unions_deleted
        self.upazilas_deleted += other.upazilas_deleted
        self.districts_deleted += other.districts_deleted
        self.uploads_deleted += other.uploads_deleted
        self.files_processed += other.files_processed
        self.rows_processed += other.rows_processed
        self.parsed_data["upazilas"].extend(other.parsed_data["upazilas"])
        self.parsed_data["unions"].extend(other.parsed_data["unions"])
        self.parsed_data["villages"].extend(other.parsed_data["villages"])


def _build_column_map(headers, aliases):
    normalized_headers = {
        _normalize_header(header): index
        for index, header in enumerate(headers)
        if header is not None and _normalize_header(header)
    }

    column_map = {}
    for field_name, field_aliases in aliases.items():
        for alias in field_aliases:
            if alias in normalized_headers:
                column_map[field_name] = normalized_headers[alias]
                break

    return column_map


def _get_row_value_from_sequence(row, column_map, field_name):
    column_index = column_map.get(field_name)
    if column_index is None or column_index >= len(row):
        return None
    return row[column_index]


def _normalize_case_count(value):
    normalized = _normalize_int(value)
    return normalized if normalized is not None else 0


def _normalize_positive_int(value):
    normalized = _normalize_int(value)
    return normalized if normalized is not None else 0


def _read_csv_matrix(csv_path):
    last_error = None
    for encoding in CSV_ENCODINGS:
        try:
            with csv_path.open(newline="", encoding=encoding) as csv_file:
                return list(csv.reader(csv_file)), encoding
        except UnicodeDecodeError as exc:
            last_error = exc

    if last_error is not None:
        raise last_error

    with csv_path.open(newline="") as csv_file:
        return list(csv.reader(csv_file)), ""


def _build_micro_user_lookup():
    user_lookup = {}
    users = User.objects.select_related("profile").filter(is_active=True)
    for user in users:
        profile = getattr(user, "profile", None)
        candidate_names = {
            user.username,
            f"{user.first_name} {user.last_name}".strip(),
            getattr(profile, "micro_sk_shw_name", "") if profile else "",
            getattr(profile, "micro_ss_name", "") if profile else "",
        }

        for candidate in candidate_names:
            normalized_candidate = _normalize_micro_person_name(candidate)
            if normalized_candidate and normalized_candidate not in user_lookup:
                user_lookup[normalized_candidate] = user

    return user_lookup


def _normalize_micro_person_name(value):
    return re.sub(r"\s+", " ", _clean_text(value)).casefold()


def resolve_micro_record_user(sk_shw_name, fallback_user=None, user_lookup=None):
    normalized_name = _normalize_micro_person_name(sk_shw_name)
    if user_lookup is None:
        user_lookup = _build_micro_user_lookup()

    if normalized_name and normalized_name in user_lookup:
        return user_lookup[normalized_name]

    return fallback_user


def iter_microstatification_csv_rows(csv_path):
    rows, encoding = _read_csv_matrix(csv_path)
    if not rows:
        return

    header_row = rows[0]
    column_map = _build_column_map(header_row, CSV_HEADER_ALIASES)

    for row_idx, row in enumerate(rows[1:], start=2):
        if not any(_clean_text(value) for value in row):
            continue

        district_name = _clean_text(_get_row_value_from_sequence(row, column_map, "district_name"))
        upazila_name = _clean_text(_get_row_value_from_sequence(row, column_map, "upazila_name"))
        union_name = _clean_text(_get_row_value_from_sequence(row, column_map, "union_name"))
        village_name = _clean_text(_get_row_value_from_sequence(row, column_map, "village_name"))
        if not district_name or not upazila_name or not union_name or not village_name:
            continue

        yield {
            "encoding": encoding,
            "row_idx": row_idx,
            "district_name": district_name,
            "upazila_name": upazila_name,
            "union_name": union_name,
            "ward_no": _clean_text(_get_row_value_from_sequence(row, column_map, "ward_no")) or None,
            "sk_shw_name": _clean_text(_get_row_value_from_sequence(row, column_map, "sk_shw_name")),
            "ss_name": _clean_text(_get_row_value_from_sequence(row, column_map, "ss_name")),
            "village_name": village_name,
            "village_name_bn": _clean_text(_get_row_value_from_sequence(row, column_map, "village_name_bn")),
            "village_code": _clean_text(_get_row_value_from_sequence(row, column_map, "village_code")),
            "latitude": _normalize_decimal(_get_row_value_from_sequence(row, column_map, "latitude")),
            "longitude": _normalize_decimal(_get_row_value_from_sequence(row, column_map, "longitude")),
            "population": _normalize_int(_get_row_value_from_sequence(row, column_map, "population")),
            "hh": _normalize_positive_int(_get_row_value_from_sequence(row, column_map, "hh")),
            "itn_2024": _normalize_positive_int(_get_row_value_from_sequence(row, column_map, "itn_2024")),
            "itn_2025": _normalize_positive_int(_get_row_value_from_sequence(row, column_map, "itn_2025")),
            "itn_2026": _normalize_positive_int(_get_row_value_from_sequence(row, column_map, "itn_2026")),
            "jan_cases": _normalize_case_count(_get_row_value_from_sequence(row, column_map, "jan_cases")),
            "feb_cases": _normalize_case_count(_get_row_value_from_sequence(row, column_map, "feb_cases")),
            "mar_cases": _normalize_case_count(_get_row_value_from_sequence(row, column_map, "mar_cases")),
            "apr_cases": _normalize_case_count(_get_row_value_from_sequence(row, column_map, "apr_cases")),
            "may_cases": _normalize_case_count(_get_row_value_from_sequence(row, column_map, "may_cases")),
            "jun_cases": _normalize_case_count(_get_row_value_from_sequence(row, column_map, "jun_cases")),
            "jul_cases": _normalize_case_count(_get_row_value_from_sequence(row, column_map, "jul_cases")),
            "aug_cases": _normalize_case_count(_get_row_value_from_sequence(row, column_map, "aug_cases")),
            "sep_cases": _normalize_case_count(_get_row_value_from_sequence(row, column_map, "sep_cases")),
            "oct_cases": _normalize_case_count(_get_row_value_from_sequence(row, column_map, "oct_cases")),
            "nov_cases": _normalize_case_count(_get_row_value_from_sequence(row, column_map, "nov_cases")),
            "dec_cases": _normalize_case_count(_get_row_value_from_sequence(row, column_map, "dec_cases")),
            "mmw_hp_chwc_name": _clean_text(_get_row_value_from_sequence(row, column_map, "mmw_hp_chwc_name")),
            "distance_from_upazila_office_km": _normalize_decimal(
                _get_row_value_from_sequence(row, column_map, "distance_from_upazila_office_km")
            ),
            "bordering_country_name": _clean_text(
                _get_row_value_from_sequence(row, column_map, "bordering_country_name")
            ),
            "other_activities": _clean_text(
                _get_row_value_from_sequence(row, column_map, "other_activities")
            ),
        }


@transaction.atomic
def reset_microstatification_dataset(delete_uploads=True):
    result = MicrostatificationSyncResult()
    result.districts_deleted = District.objects.count()
    result.villages_deleted = Village.objects.count()
    result.local_records_deleted = LocalRecord.objects.count()
    result.monthly_approvals_deleted = MonthlyApproval.objects.filter(
        local_record__isnull=False
    ).count()
    result.unions_deleted = Union.objects.count()
    result.upazilas_deleted = Upazila.objects.count()

    if delete_uploads:
        result.uploads_deleted = MicrostatificationDataUpload.objects.count()
        MicrostatificationDataUpload.objects.all().delete()

    District.objects.all().delete()
    return result


@transaction.atomic
def sync_microstatification_csv_directory(csv_dir, reporting_year, fallback_user=None):
    directory = Path(csv_dir).expanduser()
    if not directory.exists():
        raise FileNotFoundError(f"CSV directory not found: {directory}")

    csv_files = sorted(
        path for path in directory.rglob("*.csv") if path.is_file()
    )
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in: {directory}")

    result = MicrostatificationSyncResult()
    user_lookup = _build_micro_user_lookup()

    for csv_path in csv_files:
        result.files_processed += 1

        for item in iter_microstatification_csv_rows(csv_path):
            result.rows_processed += 1

            district, district_created = District.objects.get_or_create(name=item["district_name"])
            if district_created:
                result.districts_created += 1

            upazila, upazila_created = Upazila.objects.get_or_create(
                district=district,
                name=item["upazila_name"],
            )
            if upazila_created:
                result.upazilas_created += 1

            union, union_created = Union.objects.get_or_create(
                upazila=upazila,
                name=item["union_name"],
            )
            if union_created:
                result.unions_created += 1

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
            village, village_created = _get_or_create_village(union, item, village_defaults)

            if village_created:
                result.villages_created += 1
            else:
                village_update_fields = []
                for field_name, field_value in village_defaults.items():
                    if getattr(village, field_name) != field_value:
                        setattr(village, field_name, field_value)
                        village_update_fields.append(field_name)

                if village_update_fields:
                    village.save(update_fields=[*village_update_fields, "updated_at"])
                    result.villages_updated += 1

            result.parsed_data["villages"].append(
                {
                    "id": village.id,
                    "row_idx": item["row_idx"],
                    "district": item["district_name"],
                    "upazila": item["upazila_name"],
                    "union": item["union_name"],
                    "ward_no": item["ward_no"] or "",
                    "name": item["village_name"],
                    "name_bn": item["village_name_bn"],
                    "village_code": item["village_code"],
                }
            )

            record_user = resolve_micro_record_user(
                item["sk_shw_name"],
                fallback_user=fallback_user,
                user_lookup=user_lookup,
            )
            if record_user is None:
                continue

            local_record_defaults = {
                "sk_user": record_user,
                "population": item["population"] or 0,
                **{field_name: item[field_name] for field_name in LOCAL_RECORD_FIELD_NAMES},
            }
            local_record, local_record_created = LocalRecord.objects.get_or_create(
                village=village,
                reporting_year=reporting_year,
                defaults=local_record_defaults,
            )

            if local_record_created:
                result.local_records_created += 1
            else:
                local_record_update_fields = []
                for field_name, field_value in local_record_defaults.items():
                    if getattr(local_record, field_name) != field_value:
                        setattr(local_record, field_name, field_value)
                        local_record_update_fields.append(field_name)

                if local_record_update_fields:
                    local_record.save(update_fields=[*local_record_update_fields, "updated_at"])
                    result.local_records_updated += 1

    return result


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

        village, village_created = _get_or_create_village(union, item, village_defaults)

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
                item["village_code"],
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
            village.village_code,
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
