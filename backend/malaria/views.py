from collections import defaultdict
from copy import copy
from io import BytesIO
import json
import math
from pathlib import Path
import re
from zoneinfo import ZoneInfo
import zipfile
from xml.etree import ElementTree as ET

from django.contrib.auth.models import User
from django.core import signing
from django.core.signing import BadSignature, SignatureExpired
from django.http import HttpResponse
from django.db.models import Count, Max, Prefetch, Q, Sum
from django.db.models.functions import Coalesce
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import renderers, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    District,
    LocalRecord,
    MalariaUserRole,
    MicrostatificationDataUpload,
    MonthlyApproval,
    NonLocalRecord,
    Union,
    Upazila,
    Village,
)
from .permissions import HasMalariaAccess, IsMalariaAdmin, get_malaria_role, has_malaria_access, is_malaria_admin
from .serializers import (
    DistrictSerializer,
    LocalRecordSerializer,
    MalariaSessionSerializer,
    MalariaUserCreateSerializer,
    MalariaUserRoleSerializer,
    MicrostatificationDataUploadSerializer,
    MicrostatificationDataUploadFileSerializer,
    MonthlyApprovalSerializer,
    NonLocalRecordSerializer,
    ProfileSerializer,
    UnionSerializer,
    UpazilaSerializer,
    VillageSerializer,
    build_full_name,
    get_local_record_display_details,
)


MONTH_COLUMNS = [
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
]
ITN_FIELDS = ["itn_2023", "itn_2024", "itn_2025", "itn_2026"]
COUNT_QUERY_VALUES = {"1", "true", "yes", "on", "exact"}
MICROSTATIFICATION_TEMPLATE_DIR = (
    Path(__file__).resolve().parents[2]
    / "Malaria-Reporting-System"
    / "public"
    / "data"
)
MICROSTATIFICATION_EXPORT_DEBUG_DIR = (
    MICROSTATIFICATION_TEMPLATE_DIR / "generated_microstatification_exports"
)
MICROSTATIFICATION_TEMPLATE_FILES = {
    "Bandarban": "01_Microstatification Format _Bandarban_District_2026.xlsx",
    "Khagrachhari": "02_Microstatification Format _Khagrachhari_District_2026.xlsx",
    "Cox's Bazar": "03_Microstatification Format _Cox's_Bazar_District_2026.xlsx",
    "Rangamati": "04_Microstatification Format _Rangamati_District_2026.xlsx",
    "Chattogram": "05_Microstatification Format _Chattogram_District_2026.xlsx",
}
MICROSTATIFICATION_TEMPLATE_HEADER_ROW = 6
MICROSTATIFICATION_TEMPLATE_DATA_START_ROW = 7
MICROSTATIFICATION_DIVISION_BY_DISTRICT = {
    "Bandarban": "Chattogram",
    "Khagrachhari": "Chattogram",
    "Cox's Bazar": "Chattogram",
    "Rangamati": "Chattogram",
    "Chattogram": "Chattogram",
}
MICRO_DASHBOARD_ROLE_LABELS = {
    4: "User",
    8: "SK",
    9: "SHW",
}
MICRO_DASHBOARD_SCOPE_LABELS = (
    ("district", "District"),
    ("upazila", "Upazila"),
    ("union", "Union"),
    ("ward", "Ward"),
    ("village", "Village"),
    ("multi_village", "Multi Village"),
    ("unassigned", "Unassigned"),
)
MICROSTATIFICATION_DOWNLOAD_TICKET_SALT = "microstatification-download-ticket"
MICROSTATIFICATION_DOWNLOAD_TICKET_MAX_AGE_SECONDS = 300


class XLSXBinaryRenderer(renderers.BaseRenderer):
    media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    format = "xlsx"
    charset = None
    render_style = "binary"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if data is None:
            return b""
        if isinstance(data, (bytes, bytearray)):
            return bytes(data)
        return data


def _serialize_user(user):
    profile = getattr(user, "profile", None)
    micro_role = getattr(profile, "micro_role", "") if profile else ""
    profile_data = {
        "user_id": user.id,
        "full_name": build_full_name(user),
        "email": user.email or user.username,
        "micro_role": micro_role or None,
    }
    role = get_malaria_role(user)
    return {
        "id": user.id,
        "email": user.email or "",
        "username": user.username,
        "profile": profile_data,
        "role": role,
    }


def _build_full_name_from_row(row):
    full_name = " ".join(part for part in [row.get("first_name"), row.get("last_name")] if part).strip()
    return full_name or row.get("email") or row.get("username") or ""


def _serialize_user_from_row(row, role):
    profile_data = {
        "user_id": row["id"],
        "full_name": _build_full_name_from_row(row),
        "email": row.get("email") or row.get("username") or "",
    }
    return {
        "id": row["id"],
        "email": row.get("email") or "",
        "username": row.get("username") or "",
        "profile": profile_data,
        "role": role,
    }


def _apply_filters(queryset, request, exact_fields, in_fields=None):
    in_fields = in_fields or []
    params = request.query_params

    for field in exact_fields:
        value = params.get(field)
        if value not in (None, ""):
            queryset = queryset.filter(**{field: value})

    for field in in_fields:
        value = params.get(f"{field}__in")
        if value:
            items = [item.strip() for item in value.split(",") if item.strip()]
            queryset = queryset.filter(**{f"{field}__in": items})

    order_field = params.get("_order") or params.get("order")
    ascending = (params.get("_ascending") or "true").lower() not in {"0", "false", "no"}
    if order_field:
        queryset = queryset.order_by(order_field if ascending else f"-{order_field}")

    return queryset


def _count_requested(request):
    return (request.query_params.get("count") or "").lower() in COUNT_QUERY_VALUES


def _current_dhaka_month():
    return timezone.now().astimezone(ZoneInfo("Asia/Dhaka")).month


def _current_dhaka_year():
    return timezone.now().astimezone(ZoneInfo("Asia/Dhaka")).year


def _build_dashboard_payload():
    role_rows = MalariaUserRole.objects.filter(role=MalariaUserRole.ROLE_SK).count()
    village_count = Village.objects.count()
    assignment_count = LocalRecord.objects.count()
    approvals = MonthlyApproval.objects.filter(status=MonthlyApproval.STATUS_APPROVED)
    approved_months = approvals.count()

    approved_lookup = {
        (approval.local_record_id, approval.month)
        for approval in approvals.filter(local_record__isnull=False).only("local_record_id", "month")
    }
    unapproved_with_data = 0
    for row in LocalRecord.objects.only("id", *MONTH_COLUMNS):
        for index, column in enumerate(MONTH_COLUMNS, start=1):
            if getattr(row, column) > 0 and (row.id, index) not in approved_lookup:
                unapproved_with_data += 1

    return {
        "totalSKs": role_rows,
        "totalVillages": village_count,
        "totalAssignments": assignment_count,
        "approvedMonths": approved_months,
        "unapprovedWithData": unapproved_with_data,
    }


def _get_user_profile(user):
    try:
        return user.profile
    except Exception:
        return None


def _get_micro_scope(profile, multi_villages):
    if not profile:
        return "unassigned"
    if multi_villages:
        return "multi_village"
    if getattr(profile, "micro_village_id", None):
        return "village"
    if getattr(profile, "micro_union_id", None):
        ward_no = (getattr(profile, "micro_ward_no", "") or "").strip()
        if ward_no:
            return "ward"
        return "union"
    if getattr(profile, "micro_upazila_id", None):
        return "upazila"
    if getattr(profile, "micro_district_id", None):
        return "district"
    return "unassigned"


def _collect_profile_district_names(profile, multi_villages):
    names = set()
    if not profile:
        return names

    if getattr(profile, "micro_district", None):
        names.add(profile.micro_district.name)
    if getattr(profile, "micro_upazila", None) and getattr(profile.micro_upazila, "district", None):
        names.add(profile.micro_upazila.district.name)
    if getattr(profile, "micro_union", None):
        upazila = getattr(profile.micro_union, "upazila", None)
        district = getattr(upazila, "district", None)
        if district:
            names.add(district.name)
    if getattr(profile, "micro_village", None):
        union = getattr(profile.micro_village, "union", None)
        upazila = getattr(union, "upazila", None)
        district = getattr(upazila, "district", None)
        if district:
            names.add(district.name)

    for village in multi_villages:
        union = getattr(village, "union", None)
        upazila = getattr(union, "upazila", None)
        district = getattr(upazila, "district", None)
        if district:
            names.add(district.name)

    return names


def _normalize_micro_header(value):
    return " ".join(str(value or "").replace("\n", " ").split()).strip().lower()


def _normalize_micro_key(value):
    return " ".join(str(value or "").split()).strip().lower()


def _resolve_micro_template_path(district_name):
    template_name = MICROSTATIFICATION_TEMPLATE_FILES.get(district_name)
    if not template_name:
        return None
    return MICROSTATIFICATION_TEMPLATE_DIR / template_name


def _build_micro_designation_lookup():
    designation_lookup = {}
    role_label_map = {8: "SK(H)", 9: "SHW(H)"}
    users = (
        User.objects.filter(role__in=role_label_map.keys())
        .select_related("profile")
    )

    for user in users:
        designation = role_label_map.get(getattr(user, "role", None), "")
        if not designation:
            continue

        profile = getattr(user, "profile", None)
        candidate_names = {
            user.username,
            build_full_name(user),
            getattr(profile, "micro_sk_shw_name", "") if profile else "",
        }
        for candidate in candidate_names:
            normalized = _normalize_micro_key(candidate)
            if normalized:
                designation_lookup[normalized] = designation

    return designation_lookup


def _get_micro_designation(name, designation_lookup):
    normalized = _normalize_micro_key(name)
    if not normalized:
        return None
    return designation_lookup.get(normalized) or None


def _copy_micro_template_row_style(ws, template_row_idx, target_row_idx):
    source_dimension = ws.row_dimensions.get(template_row_idx)
    if source_dimension and source_dimension.height is not None:
        ws.row_dimensions[target_row_idx].height = source_dimension.height

    for column_idx in range(1, ws.max_column + 1):
        source_cell = ws.cell(template_row_idx, column_idx)
        target_cell = ws.cell(target_row_idx, column_idx)
        if source_cell.has_style:
            target_cell._style = copy(source_cell._style)
        if source_cell.number_format:
            target_cell.number_format = source_cell.number_format
        if source_cell.font:
            target_cell.font = copy(source_cell.font)
        if source_cell.fill:
            target_cell.fill = copy(source_cell.fill)
        if source_cell.border:
            target_cell.border = copy(source_cell.border)
        if source_cell.alignment:
            target_cell.alignment = copy(source_cell.alignment)
        if source_cell.protection:
            target_cell.protection = copy(source_cell.protection)


def _clear_micro_template_sheet_rows(ws):
    for row in ws.iter_rows(
        min_row=MICROSTATIFICATION_TEMPLATE_DATA_START_ROW,
        max_row=ws.max_row,
        max_col=ws.max_column,
    ):
        for cell in row:
            cell.value = None
            cell._value = None
            cell._hyperlink = None
            cell.comment = None


def _normalize_micro_cell_value(value):
    if value is None:
        return None

    if isinstance(value, str):
        cleaned = value.strip()
        return cleaned or None

    if isinstance(value, float):
        if not math.isfinite(value):
            return None
        return value

    if hasattr(value, "is_finite"):
        try:
            return value if value.is_finite() else None
        except TypeError:
            return value

    return value


def _get_micro_record_value(record, field_name):
    if not record:
        return None
    value = getattr(record, field_name, None)
    return _normalize_micro_cell_value(value)


def _get_micro_template_cell_value(header, sequence, village, local_record, designation_lookup):
    normalized = _normalize_micro_header(header)
    union = village.union
    upazila = union.upazila if union else None
    district = upazila.district if upazila else None
    district_name = district.name if district else ""
    upazila_name = upazila.name if upazila else ""
    assignment = get_local_record_display_details(
        local_record,
        village=village,
        designation_lookup=designation_lookup,
    )

    if normalized == "sl":
        return sequence
    if normalized == "sq no":
        return sequence
    if normalized == "country":
        return "Bangladesh"
    if normalized == "division":
        return MICROSTATIFICATION_DIVISION_BY_DISTRICT.get(district_name)
    if normalized == "district":
        return _normalize_micro_cell_value(district_name)
    if normalized == "upazila":
        return _normalize_micro_cell_value(upazila_name)
    if normalized == "union":
        return _normalize_micro_cell_value(union.name if union else None)
    if normalized == "ward no":
        return _normalize_micro_cell_value(village.ward_no)
    if normalized == "name of sk/shw":
        return _normalize_micro_cell_value(assignment["name"])
    if normalized == "desig.":
        return _normalize_micro_cell_value(assignment["designation"])
    if normalized == "name of ss":
        return _normalize_micro_cell_value(assignment["ss_name"])
    if normalized == "village name (english)":
        return _normalize_micro_cell_value(village.name)
    if normalized == "village name (bangla)":
        return _normalize_micro_cell_value(village.name_bn)
    if normalized == "village code":
        return _normalize_micro_cell_value(village.village_code)
    if normalized == "latitude":
        return _normalize_micro_cell_value(
            float(village.latitude) if village.latitude is not None else None
        )
    if normalized == "longitute":
        return _normalize_micro_cell_value(
            float(village.longitude) if village.longitude is not None else None
        )
    if normalized == "population":
        if local_record and local_record.population is not None:
            return _normalize_micro_cell_value(local_record.population)
        return _normalize_micro_cell_value(village.population)
    if normalized == "hh number":
        return _get_micro_record_value(local_record, "hh")
    if "active llins" in normalized:
        for field_name in ITN_FIELDS:
            year = field_name.split("_")[-1]
            if year in normalized:
                return _get_micro_record_value(local_record, field_name)
        return None
    month_lookup = {
        "january": "jan_cases",
        "february": "feb_cases",
        "march": "mar_cases",
        "april": "apr_cases",
        "may": "may_cases",
        "june": "jun_cases",
        "july": "jul_cases",
        "august": "aug_cases",
        "september": "sep_cases",
        "october": "oct_cases",
        "november": "nov_cases",
        "december": "dec_cases",
    }
    if normalized in month_lookup:
        return _get_micro_record_value(local_record, month_lookup[normalized])
    if "name of mmw" in normalized:
        return _normalize_micro_cell_value(village.mmw_hp_chwc_name)
    if "distance" in normalized and "upazila office" in normalized:
        return _normalize_micro_cell_value(
            float(village.distance_from_upazila_office_km)
            if village.distance_from_upazila_office_km is not None
            else None
        )
    if "name of border" in normalized:
        return _normalize_micro_cell_value(village.bordering_country_name)
    if normalized.startswith("others activities"):
        return _normalize_micro_cell_value(village.other_activities)
    return None


def _populate_micro_template_sheet(ws, villages, local_record_lookup, designation_lookup):
    original_max_row = ws.max_row
    _clear_micro_template_sheet_rows(ws)
    headers = [
        ws.cell(MICROSTATIFICATION_TEMPLATE_HEADER_ROW, column_idx).value
        for column_idx in range(1, ws.max_column + 1)
    ]

    for sequence, village in enumerate(villages, start=1):
        target_row = MICROSTATIFICATION_TEMPLATE_DATA_START_ROW + sequence - 1
        if target_row > original_max_row:
            _copy_micro_template_row_style(
                ws,
                MICROSTATIFICATION_TEMPLATE_DATA_START_ROW,
                target_row,
            )

        local_record = local_record_lookup.get(village.id)
        for column_idx, header in enumerate(headers, start=1):
            ws.cell(target_row, column_idx).value = _get_micro_template_cell_value(
                header,
                sequence,
                village,
                local_record,
                designation_lookup,
            )

    last_data_row = MICROSTATIFICATION_TEMPLATE_DATA_START_ROW + max(len(villages) - 1, 0)
    formula_range_pattern = re.compile(r"([A-Z]+)(\d+):([A-Z]+)(\d+)")
    for row in ws.iter_rows(min_row=1, max_row=MICROSTATIFICATION_TEMPLATE_HEADER_ROW - 1):
        for cell in row:
            if cell.data_type != "f" or not isinstance(cell.value, str):
                continue

            def _replace_formula_range(match):
                start_col, start_row, end_col, _end_row = match.groups()
                if int(start_row) < MICROSTATIFICATION_TEMPLATE_DATA_START_ROW:
                    return match.group(0)
                return f"{start_col}{start_row}:{end_col}{last_data_row}"

            cell.value = formula_range_pattern.sub(_replace_formula_range, cell.value)


def _populate_micro_template_workbook(workbook, district_upazila_rows, local_record_lookup, designation_lookup):
    normalized_rows = {
        _normalize_micro_key(upazila_name): villages
        for upazila_name, villages in district_upazila_rows.items()
    }
    sheet_lookup = {
        _normalize_micro_key(sheet.title): sheet
        for sheet in workbook.worksheets
    }

    for sheet in workbook.worksheets:
        villages = normalized_rows.get(_normalize_micro_key(sheet.title), [])
        _populate_micro_template_sheet(sheet, villages, local_record_lookup, designation_lookup)

    for upazila_name, villages in district_upazila_rows.items():
        if _normalize_micro_key(upazila_name) in sheet_lookup:
            continue
        sheet = workbook.copy_worksheet(workbook.worksheets[0])
        sheet.title = _unique_micro_sheet_title(workbook, upazila_name)
        _populate_micro_template_sheet(sheet, villages, local_record_lookup, designation_lookup)

    return workbook


def _get_micro_export_filename(district_name):
    return f"microstatification_data_{slugify(district_name)}.xlsx"


def _store_micro_export_debug_copy(filename, workbook_bytes):
    MICROSTATIFICATION_EXPORT_DEBUG_DIR.mkdir(parents=True, exist_ok=True)
    district_slug = Path(filename).stem.removeprefix("microstatification_data_")
    for stale_path in MICROSTATIFICATION_EXPORT_DEBUG_DIR.glob(
        f"microstatification_data_{district_slug}_*.xlsx"
    ):
        stale_path.unlink(missing_ok=True)

    export_path = MICROSTATIFICATION_EXPORT_DEBUG_DIR / filename
    temp_path = export_path.with_suffix(".tmp")
    temp_path.write_bytes(workbook_bytes)
    temp_path.replace(export_path)
    return export_path


def _build_micro_download_ticket(user_id, district_name):
    return signing.dumps(
        {
            "user_id": user_id,
            "district": district_name,
        },
        salt=MICROSTATIFICATION_DOWNLOAD_TICKET_SALT,
    )


def _load_micro_download_ticket(ticket):
    return signing.loads(
        ticket,
        salt=MICROSTATIFICATION_DOWNLOAD_TICKET_SALT,
        max_age=MICROSTATIFICATION_DOWNLOAD_TICKET_MAX_AGE_SECONDS,
    )


def _micro_download_error_response(detail, status_code):
    payload = json.dumps({"detail": detail}, ensure_ascii=False)
    return HttpResponse(
        payload,
        status=status_code,
        content_type="application/json",
    )


def _normalize_micro_xlsx_bytes(workbook_bytes, template_path=None):
    output = BytesIO()
    typed_blank_cell_pattern = re.compile(r'(<c\b[^>]*?)\s+t="[^"]+"([^>]*)/>')
    empty_value_pattern = re.compile(r"<v\s*/>")
    sheet_namespace = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    relationship_namespace = "http://schemas.openxmlformats.org/package/2006/relationships"
    content_type_namespace = "http://schemas.openxmlformats.org/package/2006/content-types"
    shared_string_type = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings"
    )
    shared_string_content_type = (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"
    )
    ET.register_namespace("", sheet_namespace)
    ET.register_namespace("", relationship_namespace)
    ET.register_namespace("", content_type_namespace)

    namespace_map = {
        "main": sheet_namespace,
        "rel": relationship_namespace,
        "ct": content_type_namespace,
    }

    def _serialize_xml(root, namespace=None):
        content = ET.tostring(root, encoding="utf-8", xml_declaration=True)
        if namespace:
            content = content.replace(
                f'xmlns:ns0="{namespace}"'.encode("utf-8"),
                f'xmlns="{namespace}"'.encode("utf-8"),
                1,
            )
            content = content.replace(b"<ns0:", b"<")
            content = content.replace(b"</ns0:", b"</")
        return content

    shared_string_lookup = {}
    shared_string_values = []
    shared_string_count = 0
    member_contents = {}
    member_order = []

    with zipfile.ZipFile(BytesIO(workbook_bytes), "r") as source_zip:
        source_members = source_zip.infolist()
        for member in source_members:
            member_order.append(member.filename)
            content = source_zip.read(member.filename)

            if member.filename.startswith("xl/worksheets/sheet") and member.filename.endswith(".xml"):
                text = content.decode("utf-8")
                text = typed_blank_cell_pattern.sub(r"\1\2/>", text)
                text = empty_value_pattern.sub("", text)
                root = ET.fromstring(text)

                for cell in root.findall(".//main:c", namespace_map):
                    if cell.get("t") != "inlineStr":
                        continue

                    inline_text = "".join(
                        text_part or ""
                        for text_part in cell.itertext()
                    )
                    shared_string_count += 1
                    if inline_text not in shared_string_lookup:
                        shared_string_lookup[inline_text] = len(shared_string_values)
                        shared_string_values.append(inline_text)

                    cell.set("t", "s")
                    for child in list(cell):
                        cell.remove(child)

                    value_node = ET.SubElement(cell, f"{{{sheet_namespace}}}v")
                    value_node.text = str(shared_string_lookup[inline_text])

                content = _serialize_xml(root, namespace=sheet_namespace)

            member_contents[member.filename] = (member, content)

    if shared_string_values and "xl/_rels/workbook.xml.rels" in member_contents:
        member, content = member_contents["xl/_rels/workbook.xml.rels"]
        root = ET.fromstring(content)
        for rel in root.findall("rel:Relationship", namespace_map):
            target = rel.get("Target", "")
            if target.startswith("/xl/"):
                rel.set("Target", target.removeprefix("/xl/"))
        has_shared_strings = any(
            rel.get("Type") == shared_string_type
            for rel in root.findall("rel:Relationship", namespace_map)
        )
        if not has_shared_strings:
            relationship_ids = [
                int(match.group(1))
                for rel in root.findall("rel:Relationship", namespace_map)
                for match in [re.match(r"rId(\d+)$", rel.get("Id", ""))]
                if match
            ]
            next_id = max(relationship_ids, default=0) + 1
            ET.SubElement(
                root,
                f"{{{relationship_namespace}}}Relationship",
                {
                    "Type": shared_string_type,
                    "Target": "sharedStrings.xml",
                    "Id": f"rId{next_id}",
                },
            )
        member_contents["xl/_rels/workbook.xml.rels"] = (
            member,
            _serialize_xml(root, namespace=relationship_namespace),
        )

    if shared_string_values and "[Content_Types].xml" in member_contents:
        member, content = member_contents["[Content_Types].xml"]
        root = ET.fromstring(content)
        has_shared_strings_override = any(
            override.get("PartName") == "/xl/sharedStrings.xml"
            for override in root.findall("ct:Override", namespace_map)
        )
        if not has_shared_strings_override:
            ET.SubElement(
                root,
                f"{{{content_type_namespace}}}Override",
                {
                    "PartName": "/xl/sharedStrings.xml",
                    "ContentType": shared_string_content_type,
                },
            )
        member_contents["[Content_Types].xml"] = (
            member,
            _serialize_xml(root, namespace=content_type_namespace),
        )

    if template_path and Path(template_path).exists():
        with zipfile.ZipFile(template_path, "r") as template_zip:
            for template_member_name in (
                "_rels/.rels",
                "docProps/app.xml",
                "xl/workbook.xml",
                "xl/_rels/workbook.xml.rels",
            ):
                if template_member_name not in member_contents:
                    continue
                member, _content = member_contents[template_member_name]
                member_contents[template_member_name] = (
                    member,
                    template_zip.read(template_member_name),
                )

    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as target_zip:
        for filename in member_order:
            member, content = member_contents[filename]
            target_zip.writestr(member, content)

        if shared_string_values:
            shared_root = ET.Element(
                f"{{{sheet_namespace}}}sst",
                {
                    "count": str(shared_string_count),
                    "uniqueCount": str(len(shared_string_values)),
                },
            )
            for value in shared_string_values:
                si_node = ET.SubElement(shared_root, f"{{{sheet_namespace}}}si")
                text_node = ET.SubElement(si_node, f"{{{sheet_namespace}}}t")
                if value != value.strip():
                    text_node.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
                text_node.text = value

            target_zip.writestr(
                "xl/sharedStrings.xml",
                _serialize_xml(shared_root, namespace=sheet_namespace),
            )

    return output.getvalue()


def _unique_micro_sheet_title(workbook, desired_title):
    base_title = desired_title[:31] or "Sheet"
    if base_title not in workbook.sheetnames:
        return base_title

    suffix = 2
    while True:
        suffix_text = f" ({suffix})"
        candidate = f"{base_title[:31 - len(suffix_text)]}{suffix_text}"
        if candidate not in workbook.sheetnames:
            return candidate
        suffix += 1


def _copy_micro_template_sheet_to_workbook(source_ws, target_workbook):
    target_ws = target_workbook.create_sheet(
        title=_unique_micro_sheet_title(target_workbook, source_ws.title)
    )

    for row in source_ws.iter_rows():
        for source_cell in row:
            target_cell = target_ws.cell(
                row=source_cell.row,
                column=source_cell.column,
                value=source_cell.value,
            )
            if source_cell.has_style:
                target_cell._style = copy(source_cell._style)
            if source_cell.number_format:
                target_cell.number_format = source_cell.number_format
            if source_cell.font:
                target_cell.font = copy(source_cell.font)
            if source_cell.fill:
                target_cell.fill = copy(source_cell.fill)
            if source_cell.border:
                target_cell.border = copy(source_cell.border)
            if source_cell.alignment:
                target_cell.alignment = copy(source_cell.alignment)
            if source_cell.protection:
                target_cell.protection = copy(source_cell.protection)
            if source_cell.hyperlink:
                target_cell._hyperlink = copy(source_cell.hyperlink)
            if source_cell.comment:
                target_cell.comment = copy(source_cell.comment)

    for merged_range in source_ws.merged_cells.ranges:
        target_ws.merge_cells(str(merged_range))

    target_ws.freeze_panes = source_ws.freeze_panes
    target_ws.sheet_view.zoomScale = source_ws.sheet_view.zoomScale
    target_ws.sheet_format.defaultRowHeight = source_ws.sheet_format.defaultRowHeight
    target_ws.sheet_properties = copy(source_ws.sheet_properties)
    target_ws.page_margins = copy(source_ws.page_margins)
    target_ws.page_setup = copy(source_ws.page_setup)
    target_ws.print_options = copy(source_ws.print_options)

    for row_idx, row_dimension in source_ws.row_dimensions.items():
        target_row_dimension = target_ws.row_dimensions[row_idx]
        target_row_dimension.height = row_dimension.height
        target_row_dimension.hidden = row_dimension.hidden

    for key, column_dimension in source_ws.column_dimensions.items():
        target_column_dimension = target_ws.column_dimensions[key]
        target_column_dimension.width = column_dimension.width
        target_column_dimension.hidden = column_dimension.hidden
        target_column_dimension.bestFit = column_dimension.bestFit

    return target_ws


def _build_microstatification_dashboard_payload(request_user):
    managed_user_filter = (
        Q(role__in={8, 9})
        | Q(role=4, created_by=request_user)
    )
    managed_users = list(
        User.objects.filter(managed_user_filter)
        .select_related(
            "profile",
            "profile__micro_district",
            "profile__micro_upazila__district",
            "profile__micro_union__upazila__district",
            "profile__micro_village__union__upazila__district",
        )
        .prefetch_related("profile__micro_villages__union__upazila__district")
        .order_by("username")
    )

    role_counts = {label: 0 for label in MICRO_DASHBOARD_ROLE_LABELS.values()}
    scope_counts = {key: 0 for key, _ in MICRO_DASHBOARD_SCOPE_LABELS}
    district_user_counts = defaultdict(int)
    assigned_users = 0
    workflow_users = 0

    for user in managed_users:
        role_label = MICRO_DASHBOARD_ROLE_LABELS.get(getattr(user, "role", 4), "User")
        role_counts[role_label] += 1

        profile = _get_user_profile(user)
        multi_villages = list(profile.micro_villages.all()) if profile else []
        scope_key = _get_micro_scope(profile, multi_villages)
        scope_counts[scope_key] += 1

        if scope_key != "unassigned":
            assigned_users += 1

        if profile and getattr(profile, "data_collection_type", "") == "microstatification":
            workflow_users += 1

        for district_name in _collect_profile_district_names(profile, multi_villages):
            district_user_counts[district_name] += 1

    district_stats = []
    village_rows = (
        Village.objects.values(
            "union__upazila__district_id",
            "union__upazila__district__name",
        )
        .annotate(
            villages=Count("id"),
            population=Coalesce(Sum("population"), 0),
            last_updated=Max("updated_at"),
        )
        .order_by("-villages", "union__upazila__district__name")
    )

    upload_rows = {
        row["district"]: row
        for row in MicrostatificationDataUpload.objects.values("district")
        .annotate(
            uploads=Count("id"),
            villages_created=Coalesce(Sum("villages_created"), 0),
            villages_updated=Coalesce(Sum("villages_updated"), 0),
            last_upload_at=Max("created_at"),
        )
        .order_by("district")
    }

    total_population = 0
    total_villages = 0
    latest_village_update = None
    for row in village_rows:
        district_name = row["union__upazila__district__name"]
        upload_data = upload_rows.get(district_name, {})
        population = int(row["population"] or 0)
        villages = int(row["villages"] or 0)
        total_population += population
        total_villages += villages

        last_updated = row.get("last_updated")
        if last_updated and (latest_village_update is None or last_updated > latest_village_update):
            latest_village_update = last_updated

        district_stats.append(
            {
                "id": row["union__upazila__district_id"],
                "name": district_name,
                "villages": villages,
                "population": population,
                "assigned_users": district_user_counts.get(district_name, 0),
                "uploads": int(upload_data.get("uploads") or 0),
                "villages_touched": int(upload_data.get("villages_created") or 0)
                + int(upload_data.get("villages_updated") or 0),
                "last_upload_at": upload_data.get("last_upload_at"),
                "last_updated": last_updated,
            }
        )

    recent_upload_qs = list(
        MicrostatificationDataUpload.objects.select_related("uploaded_by").order_by("-created_at")[:6]
    )
    recent_uploads = MicrostatificationDataUploadSerializer(recent_upload_qs, many=True).data
    upload_trend = [
        {
            "label": timezone.localtime(upload.created_at).strftime("%d %b"),
            "district": upload.district,
            "villages_touched": int(upload.villages_created or 0) + int(upload.villages_updated or 0),
            "uploads": 1,
            "created_at": upload.created_at,
        }
        for upload in reversed(recent_upload_qs)
    ]

    role_breakdown = [
        {
            "key": label.lower().replace(" ", "_"),
            "label": label,
            "count": role_counts[label],
        }
        for _, label in MICRO_DASHBOARD_ROLE_LABELS.items()
    ]
    scope_breakdown = [
        {
            "key": key,
            "label": label,
            "count": scope_counts[key],
        }
        for key, label in MICRO_DASHBOARD_SCOPE_LABELS
    ]

    total_uploads = sum(item["uploads"] for item in district_stats)
    districts_with_users = sum(1 for item in district_stats if item["assigned_users"] > 0)
    last_upload_at = recent_upload_qs[0].created_at if recent_upload_qs else None
    assignment_coverage = round((assigned_users / len(managed_users)) * 100, 1) if managed_users else 0

    return {
        "generated_at": timezone.now(),
        "totals": {
            "managed_users": len(managed_users),
            "workflow_users": workflow_users,
            "assigned_users": assigned_users,
            "pending_users": max(len(managed_users) - assigned_users, 0),
            "assignment_coverage": assignment_coverage,
            "districts": len(district_stats),
            "districts_with_users": districts_with_users,
            "villages": total_villages,
            "population": total_population,
            "uploads": total_uploads,
            "last_upload_at": last_upload_at,
            "last_village_update": latest_village_update,
        },
        "role_breakdown": role_breakdown,
        "scope_breakdown": scope_breakdown,
        "district_stats": district_stats,
        "upload_trend": upload_trend,
        "recent_uploads": recent_uploads,
    }


def _profile_local_scope_q(profile):
    if not profile:
        return None

    multi_village_ids = list(profile.micro_villages.values_list("id", flat=True)) if hasattr(profile, "micro_villages") else []
    if multi_village_ids:
        return Q(village_id__in=multi_village_ids)

    if getattr(profile, "micro_village_id", None):
        return Q(village_id=profile.micro_village_id)
    if getattr(profile, "micro_union_id", None):
        ward_no = (getattr(profile, "micro_ward_no", "") or "").strip()
        if ward_no:
            return Q(village__union_id=profile.micro_union_id, village__ward_no__iexact=ward_no)
        return Q(village__union_id=profile.micro_union_id)
    if getattr(profile, "micro_upazila_id", None):
        return Q(village__union__upazila_id=profile.micro_upazila_id)
    if getattr(profile, "micro_district_id", None):
        return Q(village__union__upazila__district_id=profile.micro_district_id)

    return None


def _record_within_profile_scope(profile, instance):
    if not profile or not instance:
        return False

    if hasattr(profile, "micro_villages") and profile.micro_villages.filter(id=instance.village_id).exists():
        return True

    if getattr(profile, "micro_village_id", None):
        return instance.village_id == profile.micro_village_id

    if getattr(profile, "micro_union_id", None):
        if getattr(instance.village, "union_id", None) != profile.micro_union_id:
            return False
        ward_no = (getattr(profile, "micro_ward_no", "") or "").strip()
        if ward_no:
            instance_ward = (getattr(instance.village, "ward_no", "") or "").strip()
            return instance_ward.lower() == ward_no.lower()
        return True

    if getattr(profile, "micro_upazila_id", None):
        upazila_id = getattr(getattr(instance.village, "union", None), "upazila_id", None)
        return upazila_id == profile.micro_upazila_id

    if getattr(profile, "micro_district_id", None):
        district_id = getattr(getattr(getattr(instance.village, "union", None), "upazila", None), "district_id", None)
        return district_id == profile.micro_district_id

    return False


def _ensure_local_record_editable(user, instance, validated_data):
    if is_malaria_admin(user):
        return

    profile = getattr(user, "profile", None)
    can_access = instance.sk_user_id == user.id or _record_within_profile_scope(profile, instance)
    if not can_access:
        raise PermissionError("You can only edit local records within your assigned scope.")

    if any(
        field in validated_data and validated_data[field] != getattr(instance, field)
        for field in ("hh", "population", *ITN_FIELDS)
    ):
        raise ValueError("Only malaria admins can edit household, population, or ITN fields.")

    if instance.reporting_year != _current_dhaka_year():
        raise ValueError("You can only edit records for the current reporting year.")

    editable_month = _current_dhaka_month()
    allowed_month_field = MONTH_COLUMNS[editable_month - 1]
    changed_month_fields = [
        field
        for field in MONTH_COLUMNS
        if field in validated_data and validated_data[field] != getattr(instance, field)
    ]
    disallowed = [field for field in changed_month_fields if field != allowed_month_field]
    if disallowed:
        raise ValueError("You can only edit the current month.")


class MalariaSessionView(APIView):
    permission_classes = [IsAuthenticated, HasMalariaAccess]

    def get(self, request):
        role = get_malaria_role(request.user)
        profile = getattr(request.user, "profile", None)
        micro_role = getattr(profile, "micro_role", "") if profile else ""
        payload = {
            "user": _serialize_user(request.user),
            "profile": {
                "user_id": request.user.id,
                "full_name": build_full_name(request.user),
                "email": request.user.email or request.user.username,
                "micro_role": micro_role or None,
            },
            "role": role,
        }
        return Response(MalariaSessionSerializer(payload).data)


class MalariaMeView(MalariaSessionView):
    pass


class MalariaLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({"message": "Logged out"})


class ProfilesView(APIView):
    permission_classes = [IsAuthenticated, HasMalariaAccess]

    def get(self, request):
        users = User.objects.filter(malaria_role__isnull=False).values("id", "first_name", "last_name", "email", "username").order_by(
            "username"
        )
        users = _apply_filters(users, request, exact_fields=["id"], in_fields=["id"])

        single_user_id = request.query_params.get("user_id")
        if single_user_id:
            users = users.filter(id=single_user_id)

        many_user_ids = request.query_params.get("user_id__in")
        if many_user_ids:
            users = users.filter(id__in=[item for item in many_user_ids.split(",") if item])

        malaria_role = request.query_params.get("malaria_role")
        if malaria_role:
            users = users.filter(malaria_role__role=malaria_role)

        data = [
            {
                "user_id": user["id"],
                "full_name": _build_full_name_from_row(user),
                "email": user["email"] or user["username"],
            }
            for user in users
        ]
        serializer = ProfileSerializer(data, many=True)
        return Response(serializer.data)


class UserRolesView(APIView):
    permission_classes = [IsAuthenticated, HasMalariaAccess]

    def get(self, request):
        explicit_roles = list(MalariaUserRole.objects.values("user_id", "role", "created_at", "updated_at").order_by("user__username"))
        payload = [
            {
                "user_id": role["user_id"],
                "role": role["role"],
                "created_at": role["created_at"],
                "updated_at": role["updated_at"],
            }
            for role in explicit_roles
        ]

        role_filter = request.query_params.get("role")
        if role_filter:
            payload = [row for row in payload if row["role"] == role_filter]

        user_id = request.query_params.get("user_id")
        if user_id not in (None, ""):
            payload = [row for row in payload if str(row["user_id"]) == user_id]

        user_ids = request.query_params.get("user_id__in")
        if user_ids:
            allowed_ids = {item.strip() for item in user_ids.split(",") if item.strip()}
            payload = [row for row in payload if str(row["user_id"]) in allowed_ids]

        if _count_requested(request):
            return Response({"data": payload, "count": len(payload)})
        return Response(payload)

    def post(self, request):
        if not is_malaria_admin(request.user):
            return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get("user_id")
        role = request.data.get("role")
        if not user_id or not role:
            return Response({"detail": "user_id and role are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        role_obj, _ = MalariaUserRole.objects.update_or_create(user=user, defaults={"role": role})
        return Response(MalariaUserRoleSerializer(role_obj).data, status=status.HTTP_201_CREATED)


class MalariaUserCreateView(APIView):
    permission_classes = [IsAuthenticated, IsMalariaAdmin]

    def post(self, request):
        serializer = MalariaUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        email = validated["email"].strip().lower()
        username = email
        if User.objects.filter(username=username).exists():
            return Response({"detail": "A user with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        full_name = validated["full_name"].strip()
        name_parts = [part for part in full_name.split(" ", 1) if part]
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=4,
            is_staff=False,
            created_by=request.user,
        )
        user.set_password(validated["password"])
        user.save()
        MalariaUserRole.objects.update_or_create(user=user, defaults={"role": validated["role"]})

        return Response({"user": _serialize_user(user)}, status=status.HTTP_201_CREATED)


class MalariaUsersView(APIView):
    permission_classes = [IsAuthenticated, IsMalariaAdmin]

    def get(self, request):
        roles = MalariaUserRole.objects.select_related("user").order_by("user__username")
        role_filter = request.query_params.get("role")
        if role_filter in {"admin", "sk"}:
            roles = roles.filter(role=role_filter)

        user_id = request.query_params.get("user_id")
        if user_id not in (None, ""):
            roles = roles.filter(user_id=user_id)

        payload = []
        for role_obj in roles:
            user = role_obj.user
            payload.append(
                {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email or "",
                    "full_name": build_full_name(user),
                    "role": role_obj.role,
                    "created_at": role_obj.created_at,
                    "updated_at": role_obj.updated_at,
                }
            )

        if _count_requested(request):
            return Response({"data": payload, "count": len(payload)})
        return Response(payload)

    def post(self, request):
        serializer = MalariaUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        email = validated["email"].strip().lower()
        username = email
        if User.objects.filter(username=username).exists():
            return Response({"detail": "A user with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        full_name = validated["full_name"].strip()
        name_parts = [part for part in full_name.split(" ", 1) if part]
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=4,
            is_staff=False,
            created_by=request.user,
        )
        user.set_password(validated["password"])
        user.save()
        role_obj, _ = MalariaUserRole.objects.update_or_create(user=user, defaults={"role": validated["role"]})

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email or "",
                "full_name": build_full_name(user),
                "role": role_obj.role,
                "created_at": role_obj.created_at,
                "updated_at": role_obj.updated_at,
            },
            status=status.HTTP_201_CREATED,
        )


class MalariaMasterDataView(APIView):
    permission_classes = [IsAuthenticated, HasMalariaAccess]

    def get(self, request):
        payload = {
            "districts": DistrictSerializer(District.objects.all(), many=True).data,
            "upazilas": UpazilaSerializer(Upazila.objects.select_related("district").all(), many=True).data,
            "unions": UnionSerializer(Union.objects.select_related("upazila", "upazila__district").all(), many=True).data,
            "villages": VillageSerializer(Village.objects.select_related("union", "union__upazila", "union__upazila__district").all(), many=True).data,
        }
        return Response(payload)


class MalariaAdminWriteMixin:
    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsAuthenticated(), IsMalariaAdmin()]
        return [IsAuthenticated(), HasMalariaAccess()]


class DistrictViewSet(MalariaAdminWriteMixin, viewsets.ModelViewSet):
    queryset = District.objects.all()
    serializer_class = DistrictSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        return _apply_filters(queryset, self.request, exact_fields=["id", "name"], in_fields=["id"])


class UpazilaViewSet(MalariaAdminWriteMixin, viewsets.ModelViewSet):
    queryset = Upazila.objects.select_related("district").all()
    serializer_class = UpazilaSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        return _apply_filters(queryset, self.request, exact_fields=["id", "district_id"], in_fields=["id"])


class UnionViewSet(MalariaAdminWriteMixin, viewsets.ModelViewSet):
    queryset = Union.objects.select_related("upazila", "upazila__district").all()
    serializer_class = UnionSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        return _apply_filters(queryset, self.request, exact_fields=["id", "upazila_id"], in_fields=["id"])


class VillageViewSet(MalariaAdminWriteMixin, viewsets.ModelViewSet):
    queryset = Village.objects.select_related("union", "union__upazila", "union__upazila__district").all()
    serializer_class = VillageSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = _apply_filters(
            queryset,
            self.request,
            exact_fields=["id", "union_id", "ward_no"],
            in_fields=["id", "union_id", "ward_no"],
        )

        query = (self.request.query_params.get("q") or "").strip()
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query)
                | Q(name_bn__icontains=query)
                | Q(village_code__icontains=query)
                | Q(ward_no__icontains=query)
                | Q(sk_shw_name__icontains=query)
                | Q(ss_name__icontains=query)
            )

        limit = (self.request.query_params.get("limit") or "").strip()
        if limit.isdigit():
            size = max(1, min(int(limit), 200))
            queryset = queryset[:size]

        return queryset


class LocalRecordViewSet(viewsets.ModelViewSet):
    serializer_class = LocalRecordSerializer
    permission_classes = [IsAuthenticated, HasMalariaAccess]
    pagination_class = None

    def get_queryset(self):
        queryset = LocalRecord.objects.select_related(
            "sk_user",
            "sk_user__profile",
            "village",
            "village__union",
            "village__union__upazila",
            "village__union__upazila__district",
        ).all()

        if not is_malaria_admin(self.request.user):
            profile = getattr(self.request.user, "profile", None)
            scope_q = _profile_local_scope_q(profile)
            if scope_q is not None:
                queryset = queryset.filter(Q(sk_user=self.request.user) | scope_q)
            else:
                queryset = queryset.filter(sk_user=self.request.user)

        queryset = _apply_filters(
            queryset,
            self.request,
            exact_fields=["id", "reporting_year", "sk_user_id", "village_id"],
            in_fields=["id", "sk_user_id"],
        )

        district_id = self.request.query_params.get("district_id")
        if district_id not in (None, ""):
            queryset = queryset.filter(village__union__upazila__district_id=district_id)

        district_name = (self.request.query_params.get("district_name") or "").strip()
        if district_name:
            queryset = queryset.filter(village__union__upazila__district__name__iexact=district_name)

        return queryset

    def create(self, request, *args, **kwargs):
        payload = request.data.copy()
        if not is_malaria_admin(request.user):
            payload["sk_user"] = request.user.id

        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        village = validated["village"]
        reporting_year = validated.get("reporting_year", timezone.now().year)
        defaults = validated.copy()
        defaults.setdefault("sk_user", request.user)
        record, created = LocalRecord.objects.update_or_create(
            village=village,
            reporting_year=reporting_year,
            defaults=defaults,
        )
        out = self.get_serializer(record)
        return Response(out.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        try:
            _ensure_local_record_editable(request.user, instance, serializer.validated_data)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        self.perform_update(serializer)
        return Response(serializer.data)


class NonLocalRecordViewSet(viewsets.ModelViewSet):
    serializer_class = NonLocalRecordSerializer
    permission_classes = [IsAuthenticated, HasMalariaAccess]
    pagination_class = None

    def get_queryset(self):
        queryset = NonLocalRecord.objects.select_related("sk_user").all()
        if not is_malaria_admin(self.request.user):
            queryset = queryset.filter(sk_user=self.request.user)
        return _apply_filters(
            queryset,
            self.request,
            exact_fields=["id", "reporting_year", "sk_user_id", "country", "district_or_state"],
            in_fields=["id", "sk_user_id"],
        )

    def create(self, request, *args, **kwargs):
        payload = request.data.copy()
        if not is_malaria_admin(request.user):
            payload["sk_user"] = request.user.id
        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not is_malaria_admin(request.user) and instance.sk_user_id != request.user.id:
            return Response({"detail": "You can only edit your own non-local records."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)


class MonthlyApprovalViewSet(viewsets.ModelViewSet):
    serializer_class = MonthlyApprovalSerializer
    permission_classes = [IsAuthenticated, IsMalariaAdmin]
    pagination_class = None

    def get_queryset(self):
        queryset = MonthlyApproval.objects.select_related("approved_by", "local_record", "non_local_record").all()
        record_type = self.request.query_params.get("record_type")
        if record_type == MonthlyApproval.RECORD_TYPE_LOCAL:
            queryset = queryset.filter(local_record__isnull=False)
        elif record_type == MonthlyApproval.RECORD_TYPE_NON_LOCAL:
            queryset = queryset.filter(non_local_record__isnull=False)
        queryset = _apply_filters(queryset, self.request, exact_fields=["reporting_year", "month", "status"], in_fields=[])

        record_id = self.request.query_params.get("record_id")
        if record_id:
            if record_type == MonthlyApproval.RECORD_TYPE_NON_LOCAL:
                queryset = queryset.filter(non_local_record_id=record_id)
            else:
                queryset = queryset.filter(local_record_id=record_id)
        return queryset

    def create(self, request, *args, **kwargs):
        payload = request.data if isinstance(request.data, list) else [request.data]
        approvals = []

        for item in payload:
            record_type = item.get("record_type", MonthlyApproval.RECORD_TYPE_LOCAL)
            record_id = item.get("record_id")
            month = item.get("month")
            reporting_year = item.get("reporting_year", timezone.now().year)
            status_value = item.get("status", MonthlyApproval.STATUS_APPROVED)

            if not record_id or not month:
                return Response({"detail": "record_id and month are required."}, status=status.HTTP_400_BAD_REQUEST)

            lookup = {
                "reporting_year": reporting_year,
                "month": month,
            }
            defaults = {
                "status": status_value,
                "approved_by": request.user,
                "approved_at": item.get("approved_at") or timezone.now(),
            }

            if record_type == MonthlyApproval.RECORD_TYPE_NON_LOCAL:
                lookup["non_local_record_id"] = record_id
            else:
                lookup["local_record_id"] = record_id

            approval, _ = MonthlyApproval.objects.update_or_create(defaults=defaults, **lookup)
            approvals.append(approval)

        serializer = self.get_serializer(approvals, many=True)
        if len(serializer.data) == 1:
            return Response(serializer.data[0], status=status.HTTP_201_CREATED)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MalariaDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, HasMalariaAccess]

    def get(self, request):
        return Response(_build_dashboard_payload())


class MalariaDashboardView(APIView):
    permission_classes = [IsAuthenticated, HasMalariaAccess]

    def get(self, request):
        return Response(_build_dashboard_payload())


class MicrostatificationDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsMalariaAdmin]

    def get(self, request):
        return Response(_build_microstatification_dashboard_payload(request.user))


class MicrostatificationDataUploadView(APIView):
    """Upload and process microstatification Excel files"""
    permission_classes = [IsAuthenticated, IsMalariaAdmin]

    def get(self, request):
        uploads = MicrostatificationDataUpload.objects.select_related("uploaded_by").all()
        serializer = MicrostatificationDataUploadSerializer(uploads, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = MicrostatificationDataUploadFileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        excel_file = serializer.validated_data['excel_file']
        district_name = serializer.validated_data['district']
        
        try:
            import openpyxl
            import io
            
            # Read Excel file
            file_content = excel_file.read()
            workbook = openpyxl.load_workbook(io.BytesIO(file_content))
            
            # Create upload record
            upload = MicrostatificationDataUpload.objects.create(
                district=district_name,
                excel_file=excel_file,
                uploaded_by=request.user,
                parsed_data={},
                upload_note="Processing..."
            )
            
            parsed_data = {
                "upazilas": [],
                "unions": [],
                "villages": [],
            }
            
            # Process districts (should be a single district)
            district, dist_created = District.objects.get_or_create(
                name=district_name
            )
            if dist_created:
                upload.districts_created = 1
            
            # Process each sheet (each sheet = upazila)
            for sheet_name in workbook.sheetnames:
                ws = workbook[sheet_name]
                
                upazila, up_created = Upazila.objects.get_or_create(
                    district=district,
                    name=sheet_name
                )
                if up_created:
                    upload.upazilas_created += 1
                
                upazila_data = {
                    "name": upazila.name,
                    "id": upazila.id,
                    "unions": []
                }
                
                # Process rows starting from row 7
                union_cache = {}
                
                for row_idx, row in enumerate(ws.iter_rows(min_row=7, values_only=True), start=7):
                    if not row or not row[0]:  # Skip empty rows
                        continue
                    
                    try:
                        # Extract fields from template columns (row 6 header)
                        # 0:SL, 4:Upazila, 5:Union, 6:Ward, 10:Village EN, 11:Village BN, 12:Village Code, 13:Lat, 14:Lon
                        union_name = row[5] if len(row) > 5 and row[5] else None
                        if not union_name:
                            continue
                        
                        sk_shw_name = (str(row[7]).strip() if len(row) > 7 and row[7] else "")
                        ss_name = (str(row[9]).strip() if len(row) > 9 and row[9] else "")
                        village_name_en = row[10] if len(row) > 10 else None
                        village_name_bn = row[11] if len(row) > 11 else None
                        village_code = row[12] if len(row) > 12 else None
                        latitude = row[13] if len(row) > 13 else None
                        longitude = row[14] if len(row) > 14 else None
                        population = row[15] if len(row) > 15 else None
                        mmw_hp_chwc_name = (str(row[16]).strip() if len(row) > 16 and row[16] else "")
                        distance_from_upazila_office_km = row[17] if len(row) > 17 else None
                        bordering_country_name = (str(row[18]).strip() if len(row) > 18 and row[18] else "")
                        other_activities = (str(row[19]).strip() if len(row) > 19 and row[19] else "")
                        ward_no = row[6] if len(row) > 6 else None
                        
                        if not village_name_en:
                            continue
                        
                        #Create or get union
                        if union_name not in union_cache:
                            union, union_created = Union.objects.get_or_create(
                                upazila=upazila,
                                name=union_name
                            )
                            union_cache[union_name] = union
                            if union_created:
                                upload.unions_created += 1
                        else:
                            union = union_cache[union_name]
                        
                        # Create or update village
                        village, v_created = Village.objects.get_or_create(
                            union=union,
                            name=village_name_en,
                            ward_no=ward_no,
                            defaults={
                                'name_bn': village_name_bn or '',
                                'village_code': village_code or '',
                                'latitude': latitude,
                                'longitude': longitude,
                                'population': population,
                                'sk_shw_name': sk_shw_name,
                                'ss_name': ss_name,
                                'mmw_hp_chwc_name': mmw_hp_chwc_name,
                                'distance_from_upazila_office_km': distance_from_upazila_office_km,
                                'bordering_country_name': bordering_country_name,
                                'other_activities': other_activities,
                            }
                        )
                        
                        if v_created:
                            upload.villages_created += 1
                        else:
                            # Update existing village if new data provided
                            updated = False
                            if village_name_bn and village.name_bn != village_name_bn:
                                village.name_bn = village_name_bn
                                updated = True
                            if village_code and village.village_code != village_code:
                                village.village_code = village_code
                                updated = True
                            if latitude is not None and village.latitude != latitude:
                                village.latitude = latitude
                                updated = True
                            if longitude is not None and village.longitude != longitude:
                                village.longitude = longitude
                                updated = True
                            if population is not None and village.population != population:
                                village.population = population
                                updated = True
                            if sk_shw_name and village.sk_shw_name != sk_shw_name:
                                village.sk_shw_name = sk_shw_name
                                updated = True
                            if ss_name and village.ss_name != ss_name:
                                village.ss_name = ss_name
                                updated = True
                            if mmw_hp_chwc_name and village.mmw_hp_chwc_name != mmw_hp_chwc_name:
                                village.mmw_hp_chwc_name = mmw_hp_chwc_name
                                updated = True
                            if (
                                distance_from_upazila_office_km is not None
                                and village.distance_from_upazila_office_km != distance_from_upazila_office_km
                            ):
                                village.distance_from_upazila_office_km = distance_from_upazila_office_km
                                updated = True
                            if bordering_country_name and village.bordering_country_name != bordering_country_name:
                                village.bordering_country_name = bordering_country_name
                                updated = True
                            if other_activities and village.other_activities != other_activities:
                                village.other_activities = other_activities
                                updated = True
                            if updated:
                                village.save()
                                upload.villages_updated += 1
                                
                    except Exception as e:
                        upload.upload_note += f"\n⚠ Row {row_idx} error: {str(e)}"
                        continue
            
            upload.parsed_data = parsed_data
            upload.upload_note = f"✓ Upload completed successfully\nDistricts: {upload.districts_created}, Upazilas: {upload.upazilas_created}, Unions: {upload.unions_created}, Villages created: {upload.villages_created}, Updated: {upload.villages_updated}"
            upload.save()
            
            serializer_out = MicrostatificationDataUploadSerializer(upload)
            return Response(serializer_out.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"detail": f"Error processing file: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class MicrostatificationDataDownloadView(APIView):
    permission_classes = [IsAuthenticated, IsMalariaAdmin]
    renderer_classes = [XLSXBinaryRenderer, renderers.JSONRenderer]

    def _build_export_file(self, district_name):
        import openpyxl

        if not district_name:
            return Response(
                {
                    "detail": (
                        "Please select a district. "
                        "Template-formatted microstatification exports are generated one district at a time."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if district_name not in MICROSTATIFICATION_TEMPLATE_FILES:
            return Response(
                {"detail": f"Unsupported district: {district_name}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        villages_qs = Village.objects.select_related(
            "union",
            "union__upazila",
            "union__upazila__district",
        ).order_by(
            "union__upazila__district__name",
            "union__upazila__name",
            "union__name",
            "ward_no",
            "name",
        )

        villages_qs = villages_qs.filter(union__upazila__district__name=district_name)

        villages = list(villages_qs)
        grouped_rows = defaultdict(lambda: defaultdict(list))
        for village in villages:
            union = village.union
            upazila = union.upazila if union else None
            district = upazila.district if upazila else None
            if not upazila or not district:
                continue
            grouped_rows[district.name][upazila.name].append(village)

        template_path = _resolve_micro_template_path(district_name)
        if template_path is None or not template_path.exists():
            return Response(
                {"detail": f"Template file not found for district: {district_name}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        village_ids = [village.id for village in villages]
        reporting_year = _current_dhaka_year()
        local_record_lookup = {
            record.village_id: record
            for record in LocalRecord.objects.filter(
                reporting_year=reporting_year,
                village_id__in=village_ids,
            )
            .select_related("sk_user", "sk_user__profile")
            .only(
                "village_id",
                "sk_user__email",
                "sk_user__first_name",
                "sk_user__last_name",
                "sk_user__role",
                "sk_user__username",
                "sk_user__profile__micro_designation",
                "sk_user__profile__micro_role",
                "sk_user__profile__micro_sk_shw_name",
                "sk_user__profile__micro_ss_name",
                "hh",
                "population",
                *ITN_FIELDS,
                *MONTH_COLUMNS,
            )
        }
        designation_lookup = _build_micro_designation_lookup()
        workbook = openpyxl.load_workbook(template_path)
        workbook = _populate_micro_template_workbook(
            workbook,
            grouped_rows.get(district_name, {}),
            local_record_lookup,
            designation_lookup,
        )

        output = BytesIO()
        workbook.save(output)
        export_bytes = output.getvalue()

        # Validate generated workbook bytes before returning the file.
        # This prevents partially written or structurally invalid files from being served.
        try:
            openpyxl.load_workbook(BytesIO(export_bytes), data_only=False)
        except Exception as exc:
            return Response(
                {"detail": f"Failed to generate a valid XLSX export: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        filename = _get_micro_export_filename(district_name)
        export_debug_path = _store_micro_export_debug_copy(filename, export_bytes)
        return {
            "filename": filename,
            "bytes": export_bytes,
            "debug_path": str(export_debug_path),
        }

    def _build_download_response(self, district_name):
        export_payload = self._build_export_file(district_name)
        if isinstance(export_payload, Response):
            detail = "Unable to generate export file."
            payload = getattr(export_payload, "data", None)
            if isinstance(payload, dict):
                detail = payload.get("detail") or detail
            elif isinstance(payload, str):
                detail = payload or detail
            return _micro_download_error_response(detail, export_payload.status_code)

        export_filename = export_payload.get("filename") or _get_micro_export_filename(district_name)
        export_bytes = export_payload.get("bytes") or b""
        export_debug_path = export_payload.get("debug_path")

        if not export_bytes.startswith(b"PK\x03\x04"):
            return _micro_download_error_response(
                "Generated export is invalid. Please try again.",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(
            export_bytes,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{export_filename}"'
        response["Content-Length"] = str(len(export_bytes))
        response["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response["Pragma"] = "no-cache"
        response["Expires"] = "0"
        response["X-Micro-Export-Path"] = str(export_debug_path or "")
        return response

    def get(self, request):
        district_name = (request.query_params.get("district") or "").strip()
        return self._build_download_response(district_name)


class MicrostatificationDataDownloadLinkView(APIView):
    permission_classes = [IsAuthenticated, IsMalariaAdmin]

    def get(self, request):
        district_name = (request.query_params.get("district") or "").strip()
        if not district_name:
            return Response(
                {"detail": "Please select a district."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket = _build_micro_download_ticket(request.user.id, district_name)
        download_path = (
            f"{reverse('malaria-download-microstatification-file')}?ticket={ticket}"
        )
        return Response({"download_url": download_path})


class MicrostatificationDataDirectDownloadView(MicrostatificationDataDownloadView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        ticket = (request.query_params.get("ticket") or "").strip()
        if not ticket:
            return _micro_download_error_response(
                "Missing download ticket.",
                status.HTTP_400_BAD_REQUEST,
            )

        try:
            payload = _load_micro_download_ticket(ticket)
        except SignatureExpired:
            return _micro_download_error_response(
                "Download link expired. Please try again.",
                status.HTTP_400_BAD_REQUEST,
            )
        except BadSignature:
            return _micro_download_error_response(
                "Invalid download link.",
                status.HTTP_400_BAD_REQUEST,
            )

        user_id = payload.get("user_id")
        district_name = (payload.get("district") or "").strip()
        user = User.objects.filter(id=user_id, is_active=True).first()
        if user is None or not is_malaria_admin(user):
            return _micro_download_error_response(
                "You are not allowed to download this file.",
                status.HTTP_403_FORBIDDEN,
            )

        return self._build_download_response(district_name)
