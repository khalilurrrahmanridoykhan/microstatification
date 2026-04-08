import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { toast } from "sonner";

function normalizeWardValue(value) {
  return String(value ?? "").trim();
}

function formatMultiSelectValue(values, options, placeholder) {
  const selectedLabels = options
    .filter((option) => values.includes(String(option.value)))
    .map((option) => option.label);

  if (selectedLabels.length === 0) {
    return placeholder;
  }

  if (selectedLabels.length <= 2) {
    return selectedLabels.join(", ");
  }

  return `${selectedLabels.slice(0, 2).join(", ")} +${selectedLabels.length - 2}`;
}

function MultiSelectDropdown({
  id,
  values,
  options,
  onChange,
  placeholder,
  disabled = false,
  emptyMessage = "No options available",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleValue = (value) => {
    const key = String(value);
    onChange(
      values.includes(key)
        ? values.filter((item) => item !== key)
        : [...values, key]
    );
  };

  const allOptionValues = options.map((option) => String(option.value));
  const allSelected =
    allOptionValues.length > 0 &&
    allOptionValues.every((value) => values.includes(value));

  return (
    <div className="relative" ref={containerRef}>
      <button
        id={id}
        type="button"
        className="flex items-center justify-between w-full px-3 py-2 text-left bg-white border rounded disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
      >
        <span className={values.length > 0 ? "text-gray-900" : "text-gray-500"}>
          {formatMultiSelectValue(values, options, placeholder)}
        </span>
        <span className="ml-2 text-xs text-gray-500">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-20 w-full mt-1 bg-white border rounded shadow-lg">
          {options.length > 0 && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-gray-50">
              <button
                type="button"
                className="text-sm font-medium text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                onClick={() => onChange(allOptionValues)}
                disabled={allSelected}
              >
                Select all
              </button>
              <button
                type="button"
                className="text-sm font-medium text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                onClick={() => onChange([])}
                disabled={values.length === 0}
              >
                Deselect all
              </button>
            </div>
          )}

          <div className="overflow-y-auto max-h-60">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">{emptyMessage}</div>
            ) : (
              options.map((option) => {
                const checked = values.includes(String(option.value));
                return (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-blue-50"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={checked}
                      onChange={() => toggleValue(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AssignUserCard() {
  const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
  const isAdminUser = Number(userInfo?.role) === 1;
  const isMicroAdminUser = Number(userInfo?.role) === 7;
  const defaultDataCollectionType = isMicroAdminUser
    ? "microstatification"
    : "normal";
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedForm, setSelectedForm] = useState("");
  const [dataCollectionType, setDataCollectionType] = useState(
    defaultDataCollectionType
  );
  const [microRole, setMicroRole] = useState("");
  const [microDivision, setMicroDivision] = useState("");
  const [microDistrict, setMicroDistrict] = useState("");
  const [microUpazila, setMicroUpazila] = useState("");
  const [microUnionIds, setMicroUnionIds] = useState([]);
  const [microWardNos, setMicroWardNos] = useState([]);
  const [microSsName, setMicroSsName] = useState("");
  const [selectedVillageIds, setSelectedVillageIds] = useState([]);
  const [villageSearch, setVillageSearch] = useState("");
  const [customSsNameMode, setCustomSsNameMode] = useState(false);

  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);
  const [unions, setUnions] = useState([]);
  const [unionVillages, setUnionVillages] = useState([]);
  const [villageSearchResults, setVillageSearchResults] = useState([]);
  const [loadingVillageSearch, setLoadingVillageSearch] = useState(false);
  const [showVillageResults, setShowVillageResults] = useState(false);

  const [showVillageModal, setShowVillageModal] = useState(false);
  const [creatingVillage, setCreatingVillage] = useState(false);
  const [newVillage, setNewVillage] = useState({
    name: "",
    name_bn: "",
    village_code: "",
    ward_no: "",
    latitude: "",
    longitude: "",
    population: "",
  });
  const [activeUser, setActiveUser] = useState(true);
  const [receiveUpdates, setReceiveUpdates] = useState(false);
  const [allowedOrgIds, setAllowedOrgIds] = useState([]);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Loading states
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);

  // Fetch users, orgs, and projects (with forms included)
  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem("authToken");
      try {
        setLoadingUsers(true);
        setLoadingOrgs(!isMicroAdminUser);
        setLoadingProjects(!isMicroAdminUser);

        const userRes = await axios.get(`${BACKEND_URL}/api/users/user-list/`, {
          headers: { Authorization: `Token ${token}` },
        });

        setUsers(Array.isArray(userRes.data) ? userRes.data : []);
        setLoadingUsers(false);

        if (isMicroAdminUser) {
          setOrgs([]);
          setProjects([]);
          setAllowedOrgIds([]);
          setLoadingOrgs(false);
          setLoadingProjects(false);
          return;
        }

        const [orgRes, projectRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/organizations/`, {
            headers: { Authorization: `Token ${token}` },
          }),
          axios.get(`${BACKEND_URL}/api/projects/user-projects/?include_forms=true`, {
            headers: { Authorization: `Token ${token}` },
          }),
        ]);

        setOrgs(Array.isArray(orgRes.data) ? orgRes.data : []);
        setLoadingOrgs(false);

        setProjects(Array.isArray(projectRes.data) ? projectRes.data : []);
        setLoadingProjects(false);

        if (userInfo?.username) {
          const userDetailRes = await axios.get(
            `${BACKEND_URL}/api/users/${userInfo.username}/`,
            {
              headers: { Authorization: `Token ${token}` },
            }
          );
          const userData = userDetailRes.data;

          // 1. Get all projects created by this user
          const createdProjects = projectRes.data.filter(
            (proj) => proj.created_by === userInfo.username
          );

          // 2. Get all org IDs from those projects
          const orgIdsFromCreatedProjects = createdProjects.map(
            (proj) => proj.organization
          );

          // 3. Get assigned orgs from user profile
          const assignedOrgIds = userData.profile?.organizations || [];

          // 4. Merge and deduplicate (admins can access all organizations)
          const finalOrgIds = isAdminUser
            ? orgRes.data.map((org) => org.id)
            : Array.from(
              new Set([...orgIdsFromCreatedProjects, ...assignedOrgIds])
            );

          setAllowedOrgIds(finalOrgIds);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setUsers([]);
        setOrgs([]);
        setProjects([]);
        setLoadingUsers(false);
        setLoadingOrgs(false);
        setLoadingProjects(false);
        toast.error("Failed to load data");
      }
    };
    fetchData();
  }, [isAdminUser, isMicroAdminUser, userInfo?.username]);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (dataCollectionType !== "microstatification") return;
      const token = sessionStorage.getItem("authToken");
      setLoadingGeo(true);
      try {
        const res = await axios.get(`${BACKEND_URL}/api/malaria/districts/`, {
          headers: {
            Authorization: `Token ${token}`,
            "Cache-Control": "no-cache"
          },
          params: { _t: Date.now() } // Cache-busting timestamp
        });
        setDistricts(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to load districts", error);
        setDistricts([]);
      } finally {
        setLoadingGeo(false);
      }
    };

    fetchDistricts();
  }, [dataCollectionType]);

  useEffect(() => {
    const fetchUpazilas = async () => {
      if (!microDistrict || dataCollectionType !== "microstatification") {
        setUpazilas([]);
        return;
      }
      const token = sessionStorage.getItem("authToken");
      try {
        const res = await axios.get(
          `${BACKEND_URL}/api/malaria/upazilas/?district_id=${microDistrict}`,
          { headers: { Authorization: `Token ${token}` } }
        );
        setUpazilas(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to load upazilas", error);
        setUpazilas([]);
      }
    };

    fetchUpazilas();
  }, [microDistrict, dataCollectionType]);

  useEffect(() => {
    const fetchUnions = async () => {
      if (!microUpazila || dataCollectionType !== "microstatification") {
        setUnions([]);
        return;
      }
      const token = sessionStorage.getItem("authToken");
      try {
        const res = await axios.get(
          `${BACKEND_URL}/api/malaria/unions/?upazila_id=${microUpazila}`,
          { headers: { Authorization: `Token ${token}` } }
        );
        setUnions(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to load unions", error);
        setUnions([]);
      }
    };

    fetchUnions();
  }, [microUpazila, dataCollectionType]);

  useEffect(() => {
    const fetchUnionVillages = async () => {
      if (microUnionIds.length === 0 || dataCollectionType !== "microstatification") {
        setUnionVillages([]);
        return;
      }
      const token = sessionStorage.getItem("authToken");
      try {
        const params = {
          union_id__in: microUnionIds.join(","),
        };
        const res = await axios.get(`${BACKEND_URL}/api/malaria/villages/`, {
          headers: { Authorization: `Token ${token}` },
          params,
        });
        setUnionVillages(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to load villages", error);
        setUnionVillages([]);
      }
    };

    fetchUnionVillages();
  }, [microUnionIds, dataCollectionType]);

  const availableVillages = microWardNos.length > 0
    ? unionVillages.filter((village) =>
      microWardNos.includes(normalizeWardValue(village.ward_no))
    )
    : unionVillages;

  useEffect(() => {
    setMicroUpazila("");
    setMicroUnionIds([]);
    setMicroWardNos([]);
    setUnionVillages([]);
    setSelectedVillageIds([]);
    setVillageSearch("");
  }, [microDistrict]);

  useEffect(() => {
    setMicroUnionIds([]);
    setMicroWardNos([]);
    setUnionVillages([]);
    setSelectedVillageIds([]);
    setVillageSearch("");
  }, [microUpazila]);

  useEffect(() => {
    setMicroWardNos([]);
    setMicroSsName("");
    setCustomSsNameMode(false);
    setSelectedVillageIds([]);
    setVillageSearchResults([]);
    setShowVillageResults(false);
    setVillageSearch("");
  }, [microUnionIds]);

  useEffect(() => {
    setSelectedVillageIds([]);
    setVillageSearch("");
    setVillageSearchResults([]);
  }, [microWardNos]);

  useEffect(() => {
    if (microUnionIds.length === 0 || dataCollectionType !== "microstatification") {
      setVillageSearchResults([]);
      setLoadingVillageSearch(false);
      return;
    }

    const scopedVillages = microWardNos.length > 0
      ? unionVillages.filter((village) =>
        microWardNos.includes(normalizeWardValue(village.ward_no))
      )
      : unionVillages;

    if (!villageSearch.trim()) {
      setLoadingVillageSearch(false);
      setVillageSearchResults(scopedVillages.slice(0, 40));
      return;
    }

    const token = sessionStorage.getItem("authToken");
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoadingVillageSearch(true);
      try {
        const res = await axios.get(`${BACKEND_URL}/api/malaria/villages/`, {
          headers: { Authorization: `Token ${token}` },
          params: {
            union_id__in: microUnionIds.join(","),
            ...(microWardNos.length > 0 ? { ward_no__in: microWardNos.join(",") } : {}),
            q: villageSearch.trim(),
            limit: 50,
          },
        });
        if (!cancelled) {
          setVillageSearchResults(Array.isArray(res.data) ? res.data : []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Village search failed", error);
          setVillageSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingVillageSearch(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [microUnionIds, microWardNos, villageSearch, unionVillages, dataCollectionType]);

  useEffect(() => {
    if (dataCollectionType === "microstatification") {
      setSelectedOrg("");
      setSelectedProject("");
      setSelectedForm("");
    } else {
      setMicroRole("");
      setMicroDivision("");
      setMicroDistrict("");
      setMicroUpazila("");
      setMicroUnionIds([]);
      setSelectedVillageIds([]);
      setMicroWardNos([]);
      setUnionVillages([]);
      setMicroSsName("");
      setVillageSearch("");
      setCustomSsNameMode(false);
    }
  }, [dataCollectionType]);

  useEffect(() => {
    if (microRole === "micro_admin") {
      setMicroDivision("");
      setMicroDistrict("");
      setMicroUpazila("");
      setMicroUnionIds([]);
      setSelectedVillageIds([]);
      setMicroWardNos([]);
      setUnionVillages([]);
      setMicroSsName("");
      setVillageSearch("");
      setCustomSsNameMode(false);
    }
  }, [microRole]);
  // console.log(users, orgs, projects);
  const filteredProjects = selectedOrg
    ? projects.filter(
      (p) =>
        String(p.organization) === String(selectedOrg) ||
        String(p.organization?.id) === String(selectedOrg)
    )
    : [];

  const selectedProjectObj = filteredProjects.find(
    (p) => String(p.id) === String(selectedProject)
  );
  const forms = selectedProjectObj?.forms || [];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = sessionStorage.getItem("authToken");
    if (!selectedUser) return toast.error("Please select a user.");

    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/api/users/${selectedUser}/`,
        {
          headers: { Authorization: `Token ${token}` },
        }
      );

      const currentRole = data?.role ?? 4;
      const currentProfile = {
        organizations: data?.profile?.organizations || [],
        projects: data?.profile?.projects || [],
        forms: data?.profile?.forms || [],
        active_user: data?.profile?.active_user ?? true,
        receive_updates: data?.profile?.receive_updates ?? false,
      };

      let updatedProfile = { ...currentProfile };

      let newRole = currentRole;

      if (dataCollectionType === "microstatification") {
        if (!microRole) {
          return toast.error("Please select a Microstatification role.");
        }

        const needsMicroDetails = microRole === "sk" || microRole === "shw";
        if (needsMicroDetails && (!microDistrict || !microUpazila)) {
          return toast.error("For SK/SHW role, please select at least district and upazila.");
        }

        const normalizedUnionIds = microUnionIds
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0);
        const normalizedWardNos = microWardNos
          .map((value) => normalizeWardValue(value))
          .filter(Boolean);
        const normalizedVillageIds = selectedVillageIds
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0);
        const scopeVillageIds = availableVillages
          .map((village) => Number(village.id))
          .filter((value) => Number.isInteger(value) && value > 0);
        const shouldFallbackToVillageScope = normalizedVillageIds.length > 0
          || normalizedUnionIds.length > 1
          || normalizedWardNos.length > 1
          || (normalizedUnionIds.length > 1 && normalizedWardNos.length > 0);
        const effectiveVillageIds = normalizedVillageIds.length > 0
          ? normalizedVillageIds
          : (shouldFallbackToVillageScope ? scopeVillageIds : []);
        const legacyUnionId = normalizedUnionIds.length === 1 ? normalizedUnionIds[0] : null;
        const legacyWardNo = legacyUnionId && normalizedWardNos.length === 1
          ? normalizedWardNos[0]
          : "";

        if (
          needsMicroDetails
          && shouldFallbackToVillageScope
          && effectiveVillageIds.length === 0
        ) {
          return toast.error("No villages matched the selected Union/Ward filters.");
        }

        updatedProfile.data_collection_type = "microstatification";
        updatedProfile.micro_role = microRole;
        updatedProfile.micro_division = needsMicroDetails ? microDivision : "";
        updatedProfile.micro_district = needsMicroDetails ? (microDistrict || null) : null;
        updatedProfile.micro_upazila = needsMicroDetails ? (microUpazila || null) : null;
        updatedProfile.micro_union = needsMicroDetails ? legacyUnionId : null;
        updatedProfile.micro_village = needsMicroDetails
          ? (effectiveVillageIds.length === 1 ? effectiveVillageIds[0] : null)
          : null;
        updatedProfile.micro_villages = needsMicroDetails ? effectiveVillageIds : [];
        updatedProfile.micro_ward_no = needsMicroDetails ? legacyWardNo : "";
        updatedProfile.micro_sk_shw_name = needsMicroDetails ? selectedUser : "";
        updatedProfile.micro_designation = needsMicroDetails ? microRole.toUpperCase() : "";
        updatedProfile.micro_ss_name = "";

        const microRoleMap = {
          micro_admin: 7,
          sk: 8,
          shw: 9,
        };
        newRole = microRoleMap[microRole] || currentRole;
      } else {
        // Determine normal assignment intent level
        let candidateRole = 4;
        if (selectedForm) {
          candidateRole = 4;
          updatedProfile.forms = Array.from(
            new Set([...currentProfile.forms, selectedForm])
          );
          // We do NOT touch orgs/projects when assigning a form
        } else if (selectedProject) {
          candidateRole = 3;
          updatedProfile.projects = Array.from(
            new Set([...currentProfile.projects, selectedProject])
          );
          // Do NOT update orgs
        } else if (selectedOrg) {
          candidateRole = 2;
          updatedProfile.organizations = Array.from(
            new Set([...currentProfile.organizations, selectedOrg])
          );
        } else {
          return toast.error(
            "Select at least one Organisation / Project / Form."
          );
        }

        updatedProfile.data_collection_type = "normal";
        updatedProfile.micro_role = "";
        updatedProfile.micro_division = "";
        updatedProfile.micro_district = null;
        updatedProfile.micro_upazila = null;
        updatedProfile.micro_union = null;
        updatedProfile.micro_village = null;
        updatedProfile.micro_villages = [];
        updatedProfile.micro_ward_no = "";
        updatedProfile.micro_sk_shw_name = "";
        updatedProfile.micro_designation = "";
        updatedProfile.micro_ss_name = "";

        // 2️⃣ Keep highest role (lowest number) for normal workflow
        newRole = currentRole === 6 ? currentRole : Math.min(currentRole, candidateRole);
      }

      // 3️⃣ Add toggles (optional)
      updatedProfile.active_user = activeUser;
      updatedProfile.receive_updates = receiveUpdates;

      // 4️⃣ PATCH user
      await axios.patch(
        `${BACKEND_URL}/api/users/${selectedUser}/`,
        { profile: updatedProfile, role: newRole },
        { headers: { Authorization: `Token ${token}` } }
      );

      toast.success("User updated successfully!");

      // 5️⃣ Reset selections
      setSelectedOrg("");
      setSelectedProject("");
      setSelectedForm("");
      setDataCollectionType(defaultDataCollectionType);
      setMicroRole("");
      setMicroDivision("");
      setMicroDistrict("");
      setMicroUpazila("");
      setMicroUnionIds([]);
      setSelectedVillageIds([]);
      setMicroWardNos([]);
      setUnionVillages([]);
      setMicroSsName("");
      setVillageSearch("");
      setCustomSsNameMode(false);
    } catch (err) {
      console.error(err);
      toast.error("Error updating user");
    }
  };

  const handleCreateVillage = async (event) => {
    event.preventDefault();
    const selectedSingleUnionId = microUnionIds.length === 1 ? microUnionIds[0] : "";
    if (!selectedSingleUnionId || !newVillage.name.trim()) {
      toast.error("Select one union and enter village name first.");
      return;
    }

    const token = sessionStorage.getItem("authToken");
    setCreatingVillage(true);
    try {
      const payload = {
        union: Number(selectedSingleUnionId),
        name: newVillage.name.trim(),
        name_bn: newVillage.name_bn.trim(),
        village_code: newVillage.village_code.trim(),
        ward_no: newVillage.ward_no.trim() || null,
        latitude: newVillage.latitude ? Number(newVillage.latitude) : null,
        longitude: newVillage.longitude ? Number(newVillage.longitude) : null,
        population: newVillage.population ? Number(newVillage.population) : null,
      };

      const response = await axios.post(`${BACKEND_URL}/api/malaria/villages/`, payload, {
        headers: { Authorization: `Token ${token}` },
      });

      const createdVillage = response.data;
      const refreshed = await axios.get(
        `${BACKEND_URL}/api/malaria/villages/?union_id__in=${selectedSingleUnionId}`,
        { headers: { Authorization: `Token ${token}` } }
      );
      const villageRows = Array.isArray(refreshed.data) ? refreshed.data : [];
      setUnionVillages(villageRows);
      setVillageSearchResults(villageRows.slice(0, 40));
      setSelectedVillageIds((prev) => {
        const next = new Set(prev.map((item) => String(item)));
        next.add(String(createdVillage.id));
        return Array.from(next);
      });
      setVillageSearch(createdVillage.name || "");
      setShowVillageResults(false);
      setShowVillageModal(false);
      setNewVillage({
        name: "",
        name_bn: "",
        village_code: "",
        ward_no: "",
        latitude: "",
        longitude: "",
        population: "",
      });
      toast.success("Village created successfully.");
    } catch (error) {
      console.error("Create village failed", error);
      toast.error("Failed to create village.");
    } finally {
      setCreatingVillage(false);
    }
  };

  const dropdownRef = useRef(null);
  const villageSearchRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (villageSearchRef.current && !villageSearchRef.current.contains(event.target)) {
        setShowVillageResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleMap = {
    1: "Admin",
    2: "Organization Manager",
    3: "Project Manager",
    4: "User",
    5: "Data Collector",
    6: "Officer",
    7: "Microstatification Admin",
    8: "SK",
    9: "SHW",
  };

  const divisionOptions = [
    "Barishal",
    "Chattogram",
    "Dhaka",
    "Khulna",
    "Mymensingh",
    "Rajshahi",
    "Rangpur",
    "Sylhet",
  ];

  const toggleVillageSelection = (villageId) => {
    const idKey = String(villageId);
    setSelectedVillageIds((prev) => {
      const existing = new Set(prev.map((item) => String(item)));
      if (existing.has(idKey)) {
        existing.delete(idKey);
      } else {
        existing.add(idKey);
      }
      return Array.from(existing);
    });
  };

  const villageLookup = new Map(
    [...unionVillages, ...villageSearchResults].map((village) => [String(village.id), village])
  );

  const selectedVillageOptions = selectedVillageIds
    .map((id) => villageLookup.get(String(id)))
    .filter(Boolean);

  const visibleUsers = isMicroAdminUser
    ? users.filter(
      (user) => user.role === 4 || user.role === 8 || user.role === 9
    )
    : users;

  const unionOptions = unions.map((union) => ({
    value: union.id,
    label: union.name,
  }));

  const wardOptions = Array.from(
    new Set(
      unionVillages
        .map((village) => village.ward_no)
        .map((value) => normalizeWardValue(value))
        .filter(Boolean)
    )
  )
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((ward) => ({
      value: ward,
      label: ward,
    }));

  const ssNameOptions = Array.from(
    new Set(
      availableVillages
        .map((village) => village.ss_name)
        .filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
        .map((value) => String(value).trim())
    )
  ).sort((a, b) => a.localeCompare(b));

  const hasSelectedUnion = microUnionIds.length > 0;
  const canAddVillage = microUnionIds.length === 1;

  return (
    <div className="">
      <h2 className="inline-block mb-4 text-black text-[22px] border-b-2 border-blue-400 border-solid">
        Assign Users
      </h2>
      <form
        className="grid grid-cols-1 gap-4 p-4 bg-white border rounded-lg border-black/70 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <div className="relative w-full max-w-md form-group" ref={dropdownRef}>
          {/* Label */}
          <label
            htmlFor="users"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Users
          </label>

          {/* Trigger */}
          <div
            id="users"
            className="w-full px-3 py-2 bg-white border rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => !loadingUsers && setIsOpen((prev) => !prev)}
          >
            {loadingUsers ? "Loading users..." : selectedUser || "Select user"}
          </div>

          {/* Dropdown Panel */}
          {isOpen && !loadingUsers && (
            <div className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border rounded shadow-lg max-h-60">
              {/* Search bar and close button */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-2 py-2 bg-white border-b">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full px-3 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="ml-2 text-sm text-gray-500 hover:text-red-500"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              {visibleUsers
                .filter((user) =>
                  user.username.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((user) => (
                  <div
                    key={user.id}
                    className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-100"
                    onClick={() => {
                      setSelectedUser(user.username);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    {user.username} ({roleMap[user.role] || "Unknown"}){" "}
                    {user.email && `- ${user.email}`}
                  </div>
                ))}
            </div>
          )}
        </div>
        {selectedUser && (
          <>
            {isMicroAdminUser ? (
              <div className="col-span-1 form-group">
                <label htmlFor="dataCollectionType">Data Collection Type</label>
                <input
                  id="dataCollectionType"
                  className="w-full px-3 py-2 border rounded bg-gray-100"
                  value="Microstatification"
                  readOnly
                />
              </div>
            ) : (
              <div className="col-span-1 form-group">
                <label htmlFor="dataCollectionType">Data Collection Type</label>
                <select
                  id="dataCollectionType"
                  className="w-full px-3 py-2 border rounded"
                  value={dataCollectionType}
                  onChange={(e) => setDataCollectionType(e.target.value)}
                >
                  <option value="normal">Normal</option>
                  <option value="microstatification">Microstatification</option>
                </select>
              </div>
            )}

            {!isMicroAdminUser && dataCollectionType === "normal" && (
              <>
                <div className="col-span-1 form-group">
                  <label htmlFor="orgList">Organization</label>
                  <select
                    id="orgList"
                    className="w-full px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    disabled={loadingOrgs}
                  >
                    <option value="">
                      {loadingOrgs ? "Loading organizations..." : "Select organization"}
                    </option>
                    {orgs
                      .filter((org) => isAdminUser || allowedOrgIds.includes(org.id))
                      .map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="col-span-1 form-group">
                  <label htmlFor="projectList">Project</label>
                  <select
                    id="projectList"
                    className="w-full px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    disabled={!selectedOrg || loadingProjects}
                  >
                    <option value="">
                      {loadingProjects
                        ? "Loading projects..."
                        : selectedOrg
                          ? "Select project"
                          : "Select organization first"}
                    </option>
                    {filteredProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 form-group">
                  <label htmlFor="formList">Form</label>
                  <select
                    id="formList"
                    className="w-full px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    value={selectedForm}
                    onChange={(e) => setSelectedForm(e.target.value)}
                    disabled={!selectedProject}
                  >
                    <option value="">
                      {selectedProject ? "Select form" : "Select project first"}
                    </option>
                    {forms.map((form) => (
                      <option key={form.id} value={form.id}>
                        {form.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {dataCollectionType === "microstatification" && (
              <>
                <div className="col-span-1 form-group">
                  <label htmlFor="microRole">Microstatification Role</label>
                  <select
                    id="microRole"
                    className="w-full px-3 py-2 border rounded"
                    value={microRole}
                    onChange={(e) => setMicroRole(e.target.value)}
                  >
                    <option value="">Select role</option>
                    {!isMicroAdminUser && (
                      <option value="micro_admin">Microstatification Admin</option>
                    )}
                    <option value="sk">SK</option>
                    <option value="shw">SHW</option>
                  </select>
                </div>

                {(microRole === "sk" || microRole === "shw") && (
                  <>

                    <div className="col-span-1 form-group">
                      <label htmlFor="microDivision">Division</label>
                      <select
                        id="microDivision"
                        className="w-full px-3 py-2 border rounded"
                        value={microDivision}
                        onChange={(e) => setMicroDivision(e.target.value)}
                      >
                        <option value="">Select division</option>
                        {divisionOptions.map((division) => (
                          <option key={division} value={division}>
                            {division}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-1 form-group">
                      <label htmlFor="microDistrict">District</label>
                      <select
                        id="microDistrict"
                        className="w-full px-3 py-2 border rounded"
                        value={microDistrict}
                        onChange={(e) => setMicroDistrict(e.target.value)}
                        disabled={loadingGeo}
                      >
                        <option value="">{loadingGeo ? "Loading districts..." : "Select district"}</option>
                        {districts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-1 form-group">
                      <label htmlFor="microUpazila">Upazila</label>
                      <select
                        id="microUpazila"
                        className="w-full px-3 py-2 border rounded"
                        value={microUpazila}
                        onChange={(e) => setMicroUpazila(e.target.value)}
                        disabled={!microDistrict}
                      >
                        <option value="">{microDistrict ? "Select upazila" : "Select district first"}</option>
                        {upazilas.map((upazila) => (
                          <option key={upazila.id} value={upazila.id}>
                            {upazila.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-1 form-group">
                      <label htmlFor="microUnion">Union</label>
                      <MultiSelectDropdown
                        id="microUnion"
                        values={microUnionIds}
                        options={unionOptions}
                        onChange={setMicroUnionIds}
                        placeholder={microUpazila ? "Select union(s)" : "Select upazila first"}
                        disabled={!microUpazila}
                        emptyMessage="No unions found"
                      />
                    </div>

                    <div className="col-span-1 form-group">
                      <label htmlFor="microWardNo">Ward No</label>
                      <MultiSelectDropdown
                        id="microWardNo"
                        values={microWardNos}
                        options={wardOptions}
                        onChange={setMicroWardNos}
                        placeholder={hasSelectedUnion ? "Select ward(s)" : "Select union first"}
                        disabled={!hasSelectedUnion}
                        emptyMessage="No wards found"
                      />
                    </div>

                    <div className="col-span-2 form-group" ref={villageSearchRef}>
                      <label htmlFor="villageSearch">Village Search</label>
                      <div className="flex gap-2 mb-2">
                        <div className="relative flex-1">
                          <input
                            id="villageSearch"
                            type="text"
                            className="w-full px-3 py-2 pr-24 border rounded"
                            placeholder="Search village by name, code, ward, SK/SHW, SS"
                            value={villageSearch}
                            onFocus={() => setShowVillageResults(true)}
                            onChange={(e) => {
                              setVillageSearch(e.target.value);
                              setShowVillageResults(true);
                            }}
                            disabled={!hasSelectedUnion}
                          />
                          {loadingVillageSearch && hasSelectedUnion && (
                            <span className="absolute text-xs text-gray-500 -translate-y-1/2 right-3 top-1/2">
                              Searching...
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="px-3 py-2 text-white bg-green-600 rounded disabled:opacity-50"
                          disabled={!canAddVillage}
                          title={
                            canAddVillage
                              ? "Add Village"
                              : (hasSelectedUnion ? "Select one union to add a village" : "Select union first")
                          }
                          onClick={() => setShowVillageModal(true)}
                        >
                          Add Village
                        </button>
                      </div>

                      {!canAddVillage && hasSelectedUnion && (
                        <p className="mb-2 text-xs text-amber-700">
                          Select exactly one union if you want to add a new village.
                        </p>
                      )}

                      {hasSelectedUnion && showVillageResults && (
                        <div className="overflow-y-auto bg-white border rounded shadow-sm max-h-64">
                          {!loadingVillageSearch && villageSearchResults.length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">No village found</div>
                          )}
                          {villageSearchResults.map((village) => (
                            <button
                              key={village.id}
                              type="button"
                              className={`w-full px-3 py-2 text-left border-b last:border-b-0 hover:bg-blue-50 ${selectedVillageIds.includes(String(village.id)) ? "bg-blue-50" : ""
                                }`}
                              onClick={() => {
                                toggleVillageSelection(village.id);
                              }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-medium text-gray-900">{village.name}</div>
                                <div className="text-xs text-blue-700">
                                  {selectedVillageIds.includes(String(village.id)) ? "Selected" : "Select"}
                                </div>
                              </div>
                              <div className="text-xs text-gray-600">
                                {[
                                  village.name_bn,
                                  village.village_code ? `Code ${village.village_code}` : "",
                                  village.ward_no ? `Ward ${village.ward_no}` : "",
                                ]
                                  .filter(Boolean)
                                  .join(" | ")}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {selectedVillageOptions.length > 0 && (
                        <div className="p-3 mt-2 border rounded bg-blue-50 border-blue-200">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-blue-900">Selected villages: {selectedVillageOptions.length}</div>
                              <div className="mt-2 space-y-1 text-xs text-blue-800 max-h-36 overflow-y-auto">
                                {selectedVillageOptions.map((village) => (
                                  <div key={village.id} className="flex items-center justify-between gap-2">
                                    <span>
                                      {village.name}
                                      {village.ward_no ? ` (Ward ${village.ward_no})` : ""}
                                    </span>
                                    <button
                                      type="button"
                                      className="px-1 py-0.5 text-[10px] bg-white border rounded hover:bg-gray-50"
                                      onClick={() => toggleVillageSelection(village.id)}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="px-2 py-1 text-xs text-gray-700 bg-white border rounded hover:bg-gray-50"
                              onClick={() => {
                                setSelectedVillageIds([]);
                                setVillageSearch("");
                                setShowVillageResults(true);
                              }}
                            >
                              Clear All
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
        <div className="col-span-2">
          <h3 className="mt-6 mb-2 text-lg font-semibold">Notification</h3>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="activeUser"
              className="mr-2 toggle-input"
              checked={activeUser}
              onChange={(e) => setActiveUser(e.target.checked)}
            />
            <label htmlFor="activeUser" className="mr-2 toggle-switch"></label>
            <label htmlFor="activeUser" className="notification-label">
              Active user for work
            </label>
          </div>
        </div>
        <div className="col-span-2 mt-6 button-container">
          <button
            type="submit"
            className="px-4 py-2 text-white transition-colors bg-blue-600 rounded save-button disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            disabled={
              !selectedUser ||
              (dataCollectionType === "normal" && !selectedOrg) ||
              (dataCollectionType === "microstatification" &&
                (!microRole ||
                  ((microRole === "sk" || microRole === "shw") &&
                    (!microDistrict || !microUpazila))))
            }
          >
            Save
          </button>
        </div>
      </form>

      {showVillageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl p-4 bg-white rounded-lg shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">Add New Village</h3>
            <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleCreateVillage}>
              <div>
                <label className="block mb-1 text-sm">Village Name (English)</label>
                <input
                  className="w-full px-3 py-2 border rounded"
                  value={newVillage.name}
                  onChange={(e) => setNewVillage((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Village Name (Bangla)</label>
                <input
                  className="w-full px-3 py-2 border rounded"
                  value={newVillage.name_bn}
                  onChange={(e) => setNewVillage((prev) => ({ ...prev, name_bn: e.target.value }))}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Village Code</label>
                <input
                  className="w-full px-3 py-2 border rounded"
                  value={newVillage.village_code}
                  onChange={(e) => setNewVillage((prev) => ({ ...prev, village_code: e.target.value }))}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Ward No</label>
                <input
                  className="w-full px-3 py-2 border rounded"
                  value={newVillage.ward_no}
                  onChange={(e) => setNewVillage((prev) => ({ ...prev, ward_no: e.target.value }))}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  className="w-full px-3 py-2 border rounded"
                  value={newVillage.latitude}
                  onChange={(e) => setNewVillage((prev) => ({ ...prev, latitude: e.target.value }))}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  className="w-full px-3 py-2 border rounded"
                  value={newVillage.longitude}
                  onChange={(e) => setNewVillage((prev) => ({ ...prev, longitude: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 text-sm">Population</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border rounded"
                  value={newVillage.population}
                  onChange={(e) => setNewVillage((prev) => ({ ...prev, population: e.target.value }))}
                />
              </div>
              <div className="flex justify-end col-span-2 gap-2 mt-2">
                <button
                  type="button"
                  className="px-3 py-2 border rounded"
                  onClick={() => setShowVillageModal(false)}
                  disabled={creatingVillage}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 text-white bg-blue-600 rounded disabled:opacity-50"
                  disabled={creatingVillage}
                >
                  {creatingVillage ? "Saving..." : "Save Village"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignUserCard;
