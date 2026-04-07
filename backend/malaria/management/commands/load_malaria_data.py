import openpyxl
from django.core.management.base import BaseCommand
from malaria.models import District, Upazila, Union, Village


class Command(BaseCommand):
    help = 'Load malaria geographic data from Excel file'

    def add_arguments(self, parser):
        parser.add_argument(
            'excel_file',
            type=str,
            help='Path to the Excel file with microstatification data'
        )

    def handle(self, *args, **options):
        excel_file = options['excel_file']
        self.stdout.write(self.style.SUCCESS(f'Loading data from {excel_file}...'))
        
        wb = openpyxl.load_workbook(excel_file)
        
        # Create or get district
        district, created = District.objects.get_or_create(
            name='Bandarban'
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created District: {district.name}'))
        else:
            self.stdout.write(f'District already exists: {district.name}')
        
        # Process each sheet (each is an Upazila)
        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            
            # Get upazila name from row 5
            upazila_name_cell = ws['E5'].value or ws['C5'].value
            if not upazila_name_cell:
                self.stdout.write(self.style.WARNING(f'⚠ Skipping {sheet_name}: no upazila name found'))
                continue
            
            upazila, up_created = Upazila.objects.get_or_create(
                name=sheet_name,
                district=district
            )
            if up_created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created Upazila: {upazila.name}'))
            
            # Process data rows (starting from row 7)
            union_cache = {}
            village_count = 0
            
            for row_idx, row in enumerate(ws.iter_rows(min_row=7, values_only=True), start=7):
                if not row[0]:  # Skip empty rows
                    break
                
                # Headers vary by sheet, try to extract key fields
                try:
                    # Union is usually in col 5 (index 4) or col 8 (index 7)
                    union_name = row[4] if row[4] else row[7] if len(row) > 7 else None
                    # Skip if no union
                    if not union_name:
                        continue
                    
                    # Village name is usually col 10-11 (index 9-10)
                    village_name_en = row[10] if len(row) > 10 else None
                    village_name_bn = row[11] if len(row) > 11 else None
                    village_code = row[12] if len(row) > 12 else None
                    latitude = row[13] if len(row) > 13 else None
                    longitude = row[14] if len(row) > 14 else None
                    population = row[15] if len(row) > 15 else None
                    mmw_hp_chwc_name = str(row[16]).strip() if len(row) > 16 and row[16] else ""
                    distance_from_upazila_office_km = row[17] if len(row) > 17 else None
                    bordering_country_name = str(row[18]).strip() if len(row) > 18 and row[18] else ""
                    other_activities = str(row[19]).strip() if len(row) > 19 and row[19] else ""
                    ward_no = row[6] if len(row) > 6 else None  # Ward number
                    
                    if not village_name_en:
                        continue
                    
                    # Create or get union
                    if union_name not in union_cache:
                        union_obj, u_created = Union.objects.get_or_create(
                            name=union_name,
                            upazila=upazila
                        )
                        union_cache[union_name] = union_obj
                        if u_created:
                            self.stdout.write(f'    ✓ Created Union: {union_obj.name}')
                    else:
                        union_obj = union_cache[union_name]
                    
                    # Create village
                    village, v_created = Village.objects.get_or_create(
                        name=village_name_en,
                        union=union_obj,
                        ward_no=ward_no,
                        defaults={
                            'name_bn': village_name_bn or '',
                            'village_code': village_code or '',
                            'latitude': latitude,
                            'longitude': longitude,
                            'population': population,
                            'mmw_hp_chwc_name': mmw_hp_chwc_name,
                            'distance_from_upazila_office_km': distance_from_upazila_office_km,
                            'bordering_country_name': bordering_country_name,
                            'other_activities': other_activities,
                        }
                    )
                    if not v_created:
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
                            village.save(
                                update_fields=[
                                    'name_bn',
                                    'village_code',
                                    'latitude',
                                    'longitude',
                                    'population',
                                    'mmw_hp_chwc_name',
                                    'distance_from_upazila_office_km',
                                    'bordering_country_name',
                                    'other_activities',
                                    'updated_at',
                                ]
                            )
                    if v_created:
                        village_count += 1
                
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'⚠ Error processing row {row_idx}: {e}'))
                    continue
            
            if village_count > 0:
                self.stdout.write(self.style.SUCCESS(f'    ✓ Created {village_count} villages in {upazila.name}'))
        
        self.stdout.write(self.style.SUCCESS('✓ Data loading completed!'))
        
        # Print summary
        total_districts = District.objects.count()
        total_upazilas = Upazila.objects.count()
        total_unions = Union.objects.count()
        total_villages = Village.objects.count()
        
        self.stdout.write(self.style.SUCCESS(f'''
        
=== Malaria Geographic Data Summary ===
Districts: {total_districts}
Upazilas: {total_upazilas}
Unions: {total_unions}
Villages: {total_villages}
        '''))
