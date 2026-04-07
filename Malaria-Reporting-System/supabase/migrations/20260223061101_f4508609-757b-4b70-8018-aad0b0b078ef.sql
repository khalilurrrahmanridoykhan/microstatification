
-- 1) Role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'sk');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3) Master data tables
CREATE TABLE public.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read districts" ON public.districts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage districts" ON public.districts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.upazilas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id uuid REFERENCES public.districts(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (district_id, name)
);
ALTER TABLE public.upazilas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read upazilas" ON public.upazilas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage upazilas" ON public.upazilas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.unions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upazila_id uuid REFERENCES public.upazilas(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (upazila_id, name)
);
ALTER TABLE public.unions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read unions" ON public.unions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage unions" ON public.unions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.villages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  union_id uuid REFERENCES public.unions(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  ward_no text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read villages" ON public.villages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage villages" ON public.villages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Assignments table
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sk_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  village_id uuid REFERENCES public.villages(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sk_user_id, village_id)
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SK can read own assignments" ON public.assignments
  FOR SELECT TO authenticated USING (sk_user_id = auth.uid());
CREATE POLICY "Admins can manage assignments" ON public.assignments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) local_records table
CREATE TABLE public.local_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id uuid REFERENCES public.villages(id) ON DELETE CASCADE NOT NULL,
  sk_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reporting_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  hh integer NOT NULL DEFAULT 0,
  population integer NOT NULL DEFAULT 0,
  itn_2023 integer NOT NULL DEFAULT 0,
  itn_2024 integer NOT NULL DEFAULT 0,
  itn_2025 integer NOT NULL DEFAULT 0,
  jan_cases integer NOT NULL DEFAULT 0,
  feb_cases integer NOT NULL DEFAULT 0,
  mar_cases integer NOT NULL DEFAULT 0,
  apr_cases integer NOT NULL DEFAULT 0,
  may_cases integer NOT NULL DEFAULT 0,
  jun_cases integer NOT NULL DEFAULT 0,
  jul_cases integer NOT NULL DEFAULT 0,
  aug_cases integer NOT NULL DEFAULT 0,
  sep_cases integer NOT NULL DEFAULT 0,
  oct_cases integer NOT NULL DEFAULT 0,
  nov_cases integer NOT NULL DEFAULT 0,
  dec_cases integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (village_id, reporting_year)
);
ALTER TABLE public.local_records ENABLE ROW LEVEL SECURITY;

-- SK: SELECT only own records where village is assigned
CREATE POLICY "SK can select own local records" ON public.local_records
  FOR SELECT TO authenticated
  USING (
    sk_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.assignments WHERE assignments.sk_user_id = auth.uid() AND assignments.village_id = local_records.village_id)
  );

-- SK: INSERT only for assigned villages
CREATE POLICY "SK can insert own local records" ON public.local_records
  FOR INSERT TO authenticated
  WITH CHECK (
    sk_user_id = auth.uid()
    AND NOT public.has_role(auth.uid(), 'admin')
    AND EXISTS (SELECT 1 FROM public.assignments WHERE assignments.sk_user_id = auth.uid() AND assignments.village_id = local_records.village_id)
  );

-- SK: UPDATE only own records for assigned villages
CREATE POLICY "SK can update own local records" ON public.local_records
  FOR UPDATE TO authenticated
  USING (
    sk_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.assignments WHERE assignments.sk_user_id = auth.uid() AND assignments.village_id = local_records.village_id)
  );

-- Admin: full access
CREATE POLICY "Admins full access local records" ON public.local_records
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6) non_local_records table
CREATE TABLE public.non_local_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sk_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reporting_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  country text NOT NULL DEFAULT 'Bangladesh',
  district_or_state text NOT NULL DEFAULT '',
  upazila_or_township text NOT NULL DEFAULT '',
  union_name text NOT NULL DEFAULT '',
  village_name text NOT NULL DEFAULT '',
  jan_cases integer NOT NULL DEFAULT 0,
  feb_cases integer NOT NULL DEFAULT 0,
  mar_cases integer NOT NULL DEFAULT 0,
  apr_cases integer NOT NULL DEFAULT 0,
  may_cases integer NOT NULL DEFAULT 0,
  jun_cases integer NOT NULL DEFAULT 0,
  jul_cases integer NOT NULL DEFAULT 0,
  aug_cases integer NOT NULL DEFAULT 0,
  sep_cases integer NOT NULL DEFAULT 0,
  oct_cases integer NOT NULL DEFAULT 0,
  nov_cases integer NOT NULL DEFAULT 0,
  dec_cases integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.non_local_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SK can select own non-local records" ON public.non_local_records
  FOR SELECT TO authenticated USING (sk_user_id = auth.uid());
CREATE POLICY "SK can insert own non-local records" ON public.non_local_records
  FOR INSERT TO authenticated WITH CHECK (sk_user_id = auth.uid());
CREATE POLICY "SK can update own non-local records" ON public.non_local_records
  FOR UPDATE TO authenticated USING (sk_user_id = auth.uid());
CREATE POLICY "SK can delete own non-local records" ON public.non_local_records
  FOR DELETE TO authenticated USING (sk_user_id = auth.uid());
CREATE POLICY "Admins full access non-local records" ON public.non_local_records
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7) updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_local_records_updated_at
  BEFORE UPDATE ON public.local_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_non_local_records_updated_at
  BEFORE UPDATE ON public.non_local_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8) NON-NEGATIVE validation trigger
CREATE OR REPLACE FUNCTION public.validate_non_negative_values()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.jan_cases < 0 OR NEW.feb_cases < 0 OR NEW.mar_cases < 0 OR NEW.apr_cases < 0
    OR NEW.may_cases < 0 OR NEW.jun_cases < 0 OR NEW.jul_cases < 0 OR NEW.aug_cases < 0
    OR NEW.sep_cases < 0 OR NEW.oct_cases < 0 OR NEW.nov_cases < 0 OR NEW.dec_cases < 0 THEN
    RAISE EXCEPTION 'Case values cannot be negative';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_local_records_non_negative
  BEFORE INSERT OR UPDATE ON public.local_records
  FOR EACH ROW EXECUTE FUNCTION public.validate_non_negative_values();

CREATE TRIGGER validate_non_local_records_non_negative
  BEFORE INSERT OR UPDATE ON public.non_local_records
  FOR EACH ROW EXECUTE FUNCTION public.validate_non_negative_values();

-- Additional validation for local_records specific fields
CREATE OR REPLACE FUNCTION public.validate_local_record_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.hh < 0 THEN RAISE EXCEPTION 'HH cannot be negative'; END IF;
  IF NEW.population < 0 THEN RAISE EXCEPTION 'Population cannot be negative'; END IF;
  IF NEW.itn_2023 < 0 OR NEW.itn_2024 < 0 OR NEW.itn_2025 < 0 THEN
    RAISE EXCEPTION 'ITN values cannot be negative';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_local_record_fields_trigger
  BEFORE INSERT OR UPDATE ON public.local_records
  FOR EACH ROW EXECUTE FUNCTION public.validate_local_record_fields();

-- 9) SERVER-SIDE MONTH LOCKING TRIGGER (Asia/Dhaka timezone)
-- SK cannot update past/future month columns; Admin bypasses
CREATE OR REPLACE FUNCTION public.enforce_month_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month integer;
  is_admin boolean;
BEGIN
  -- Check if user is admin
  is_admin := public.has_role(auth.uid(), 'admin');
  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Get current month in Asia/Dhaka
  current_month := EXTRACT(MONTH FROM (now() AT TIME ZONE 'Asia/Dhaka'));

  -- Check each month column: if changed and not current month, reject
  IF OLD.jan_cases IS DISTINCT FROM NEW.jan_cases AND current_month != 1 THEN
    RAISE EXCEPTION 'Cannot modify January cases - month is locked';
  END IF;
  IF OLD.feb_cases IS DISTINCT FROM NEW.feb_cases AND current_month != 2 THEN
    RAISE EXCEPTION 'Cannot modify February cases - month is locked';
  END IF;
  IF OLD.mar_cases IS DISTINCT FROM NEW.mar_cases AND current_month != 3 THEN
    RAISE EXCEPTION 'Cannot modify March cases - month is locked';
  END IF;
  IF OLD.apr_cases IS DISTINCT FROM NEW.apr_cases AND current_month != 4 THEN
    RAISE EXCEPTION 'Cannot modify April cases - month is locked';
  END IF;
  IF OLD.may_cases IS DISTINCT FROM NEW.may_cases AND current_month != 5 THEN
    RAISE EXCEPTION 'Cannot modify May cases - month is locked';
  END IF;
  IF OLD.jun_cases IS DISTINCT FROM NEW.jun_cases AND current_month != 6 THEN
    RAISE EXCEPTION 'Cannot modify June cases - month is locked';
  END IF;
  IF OLD.jul_cases IS DISTINCT FROM NEW.jul_cases AND current_month != 7 THEN
    RAISE EXCEPTION 'Cannot modify July cases - month is locked';
  END IF;
  IF OLD.aug_cases IS DISTINCT FROM NEW.aug_cases AND current_month != 8 THEN
    RAISE EXCEPTION 'Cannot modify August cases - month is locked';
  END IF;
  IF OLD.sep_cases IS DISTINCT FROM NEW.sep_cases AND current_month != 9 THEN
    RAISE EXCEPTION 'Cannot modify September cases - month is locked';
  END IF;
  IF OLD.oct_cases IS DISTINCT FROM NEW.oct_cases AND current_month != 10 THEN
    RAISE EXCEPTION 'Cannot modify October cases - month is locked';
  END IF;
  IF OLD.nov_cases IS DISTINCT FROM NEW.nov_cases AND current_month != 11 THEN
    RAISE EXCEPTION 'Cannot modify November cases - month is locked';
  END IF;
  IF OLD.dec_cases IS DISTINCT FROM NEW.dec_cases AND current_month != 12 THEN
    RAISE EXCEPTION 'Cannot modify December cases - month is locked';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_month_lock_local
  BEFORE UPDATE ON public.local_records
  FOR EACH ROW EXECUTE FUNCTION public.enforce_month_lock();

CREATE TRIGGER enforce_month_lock_non_local
  BEFORE UPDATE ON public.non_local_records
  FOR EACH ROW EXECUTE FUNCTION public.enforce_month_lock();

-- 10) ITN FIELD LOCKING TRIGGER
-- SK cannot update ITN fields; only Admin can
CREATE OR REPLACE FUNCTION public.enforce_itn_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF OLD.itn_2023 IS DISTINCT FROM NEW.itn_2023 THEN
    RAISE EXCEPTION 'Only Admin can update ITN 2023';
  END IF;
  IF OLD.itn_2024 IS DISTINCT FROM NEW.itn_2024 THEN
    RAISE EXCEPTION 'Only Admin can update ITN 2024';
  END IF;
  IF OLD.itn_2025 IS DISTINCT FROM NEW.itn_2025 THEN
    RAISE EXCEPTION 'Only Admin can update ITN 2025';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_itn_lock_trigger
  BEFORE UPDATE ON public.local_records
  FOR EACH ROW EXECUTE FUNCTION public.enforce_itn_lock();

-- 11) AUTO-CREATE local_records ON ASSIGNMENT
CREATE OR REPLACE FUNCTION public.auto_create_local_record_on_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_yr integer;
BEGIN
  current_yr := EXTRACT(YEAR FROM (now() AT TIME ZONE 'Asia/Dhaka'));
  
  INSERT INTO public.local_records (village_id, sk_user_id, reporting_year)
  VALUES (NEW.village_id, NEW.sk_user_id, current_yr)
  ON CONFLICT (village_id, reporting_year) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_create_local_record
  AFTER INSERT ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_local_record_on_assignment();
