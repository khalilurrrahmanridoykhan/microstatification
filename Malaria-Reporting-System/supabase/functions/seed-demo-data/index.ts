import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Create admin user
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: "admin@test.com",
      password: "123456",
      email_confirm: true,
      user_metadata: { full_name: "Admin User" },
    });
    if (adminError && !adminError.message.includes("already been registered")) throw adminError;

    // Create SK user
    const { data: skData, error: skError } = await supabase.auth.admin.createUser({
      email: "sk1@test.com",
      password: "123456",
      email_confirm: true,
      user_metadata: { full_name: "SK Worker 1" },
    });
    if (skError && !skError.message.includes("already been registered")) throw skError;

    const adminId = adminData?.user?.id;
    const skId = skData?.user?.id;

    if (!adminId || !skId) {
      // Try to fetch existing users
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const adminUser = users?.find(u => u.email === "admin@test.com");
      const skUser = users?.find(u => u.email === "sk1@test.com");
      if (!adminUser || !skUser) throw new Error("Could not find or create demo users");
      
      return await seedData(supabase, adminUser.id, skUser.id, corsHeaders);
    }

    return await seedData(supabase, adminId, skId, corsHeaders);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function seedData(supabase: any, adminId: string, skId: string, corsHeaders: any) {
  // Assign roles
  await supabase.from("user_roles").upsert([
    { user_id: adminId, role: "admin" },
    { user_id: skId, role: "sk" },
  ], { onConflict: "user_id,role" });

  // Seed districts
  const districts = ["Bandarban", "Rangamati", "Khagrachhari"];
  const districtIds: Record<string, string> = {};
  for (const name of districts) {
    const { data } = await supabase.from("districts").upsert({ name }, { onConflict: "name" }).select().single();
    if (data) districtIds[name] = data.id;
  }

  // Seed upazilas
  const upazilasData: Record<string, string[]> = {
    "Bandarban": ["Bandarban Sadar", "Thanchi", "Ruma"],
    "Rangamati": ["Rangamati Sadar", "Kaptai"],
    "Khagrachhari": ["Khagrachhari Sadar", "Dighinala"],
  };

  const upazilaIds: Record<string, string> = {};
  for (const [district, upazillas] of Object.entries(upazilasData)) {
    for (const name of upazillas) {
      const { data } = await supabase.from("upazilas")
        .upsert({ district_id: districtIds[district], name }, { onConflict: "district_id,name" })
        .select().single();
      if (data) upazilaIds[name] = data.id;
    }
  }

  // Seed unions
  const unionsData: Record<string, string[]> = {
    "Bandarban Sadar": ["Rajbila", "Kuhalong"],
    "Thanchi": ["Thanchi Union"],
    "Ruma": ["Ruma Union"],
    "Rangamati Sadar": ["Sapchhari"],
    "Kaptai": ["Chitmorom"],
    "Khagrachhari Sadar": ["Khagrachhari Union"],
    "Dighinala": ["Dighinala Union"],
  };

  const unionIds: Record<string, string> = {};
  for (const [upazila, unions] of Object.entries(unionsData)) {
    for (const name of unions) {
      const { data } = await supabase.from("unions")
        .upsert({ upazila_id: upazilaIds[upazila], name }, { onConflict: "upazila_id,name" })
        .select().single();
      if (data) unionIds[name] = data.id;
    }
  }

  // Seed villages
  const villagesData: Record<string, { name: string; ward_no?: string }[]> = {
    "Rajbila": [
      { name: "Rajbila Para", ward_no: "1" },
      { name: "Headman Para", ward_no: "2" },
    ],
    "Kuhalong": [
      { name: "Kuhalong Para", ward_no: "3" },
    ],
    "Thanchi Union": [
      { name: "Thanchi Mukh", ward_no: "1" },
    ],
    "Ruma Union": [
      { name: "Ruma Bazar", ward_no: "1" },
    ],
    "Sapchhari": [
      { name: "Sapchhari Para" },
    ],
    "Chitmorom": [
      { name: "Chitmorom Para" },
    ],
    "Khagrachhari Union": [
      { name: "Khagra Para" },
    ],
  };

  const villageIds: string[] = [];
  for (const [union, villages] of Object.entries(villagesData)) {
    for (const v of villages) {
      const { data } = await supabase.from("villages")
        .insert({ union_id: unionIds[union], name: v.name, ward_no: v.ward_no || null })
        .select().single();
      if (data) villageIds.push(data.id);
    }
  }

  // Assign first 5 villages to SK
  const assignVillages = villageIds.slice(0, 5);
  for (const vid of assignVillages) {
    await supabase.from("assignments")
      .upsert({ sk_user_id: skId, village_id: vid }, { onConflict: "sk_user_id,village_id" });
  }

  // The auto-create trigger should have created local_records already
  // Add a non-local record for SK
  await supabase.from("non_local_records").insert({
    sk_user_id: skId,
    reporting_year: new Date().getFullYear(),
    country: "Myanmar",
    district_or_state: "Chin State",
    upazila_or_township: "Paletwa",
    union_name: "Paletwa Union",
    village_name: "Border Village",
    feb_cases: 3,
    mar_cases: 1,
  });

  return new Response(JSON.stringify({ success: true, message: "Demo data seeded successfully" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
