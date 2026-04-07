import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { toast } from "sonner";

const roleOptions = [
  { value: 1, label: "Admin" },
  { value: 2, label: "Organizer" },
  { value: 3, label: "Project manager" },
  { value: 4, label: "User" },
  { value: 5, label: "Data Collector" },
  { value: 6, label: "Officer" },
  { value: 7, label: "Microstatification Admin" },
  { value: 8, label: "SK" },
  { value: 9, label: "SHW" },
];

const normalizeListResponse = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }
  return [];
};

const toNumericId = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

const hasId = (items, id) =>
  Array.isArray(items) && items.some((itemId) => String(itemId) === String(id));

function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [forms, setForms] = useState([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    role: "",
    is_staff: false,
    profile: {
      organizations: [],
      projects: [],
      forms: [],
    },
  });
  const [message, setMessage] = useState("");
  const user = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
  const [formSearch, setFormSearch] = useState("");
  const isUserAdmin = user.role === 1;
  const isOrganizer = user.role === 2;
  const isProjectmanager = user.role === 3;

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        const response = await axios.get(`${BACKEND_URL}/api/forms/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        setForms(normalizeListResponse(response.data));
      } catch (error) {
        console.error("Failed to fetch forms:", error);
      }
    };
    fetchForms();
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");

    const fetchOrgsAndProjects = async () => {
      try {
        const [orgsRes, projectsRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/organizations/`, {
            headers: { Authorization: `Token ${token}` },
          }),
          axios.get(`${BACKEND_URL}/api/projects/`, {
            headers: { Authorization: `Token ${token}` },
          }),
        ]);
        setOrganizations(normalizeListResponse(orgsRes.data));
        setProjects(normalizeListResponse(projectsRes.data));
      } catch (err) {
        console.error("Failed to fetch orgs or projects", err);
      }
    };

    fetchOrgsAndProjects();
  }, []);


  console.log("form :", form);
  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    axios
      .get(`${BACKEND_URL}/api/users/${id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((res) => {
        const profile = res.data.profile || {};
        setForm({
          ...res.data,
          role:
            res.data.role === null || res.data.role === undefined
              ? ""
              : String(res.data.role),
          password: "********",
          profile: {
            ...profile,
            forms: profile.forms || [],
            organizations: profile.organizations || [],
            projects: profile.projects || [],
          },
        });
      })
      .catch(() => toast.error("Failed to load user."));
  }, [id]);

  const togglePassword = () => setShowPassword((prev) => !prev);

  const toggleProfileSelection = (field, itemId, checked) => {
    setForm((prev) => {
      const selectedIds = new Set(
        (prev.profile?.[field] || []).map((value) => toNumericId(value))
      );
      const normalizedItemId = toNumericId(itemId);

      if (checked) {
        selectedIds.add(normalizedItemId);
      } else {
        selectedIds.delete(normalizedItemId);
      }

      return {
        ...prev,
        profile: {
          ...prev.profile,
          [field]: Array.from(selectedIds),
        },
      };
    });
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === "is_staff") {
      setForm({ ...form, is_staff: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const currentRoleValue = Number(form.role);
  const canEditProjectManagerRole =
    isUserAdmin || user.role === 2 || (user.username === id && user.role === 3);

  const visibleRoleOptions = roleOptions.filter((option) => {
    if (
      option.value === 1 ||
      option.value === 2 ||
      option.value === 6 ||
      option.value === 7 ||
      option.value === 8 ||
      option.value === 9
    ) {
      return isUserAdmin || option.value === currentRoleValue;
    }

    if (option.value === 3) {
      return canEditProjectManagerRole || option.value === currentRoleValue;
    }

    return true;
  });

  const projectNameById = new Map(
    projects.map((project) => [toNumericId(project.id), project.name || ""])
  );

  const normalizedFormSearch = formSearch.trim().toLowerCase();
  const filteredForms = forms.filter((currentForm) => {
    if (!normalizedFormSearch) {
      return true;
    }

    const formName =
      typeof currentForm?.name === "string"
        ? currentForm.name.toLowerCase()
        : "";
    const projectName = (
      projectNameById.get(toNumericId(currentForm?.project)) || ""
    ).toLowerCase();
    const formIdText = String(currentForm?.id || "").toLowerCase();

    return (
      formName.includes(normalizedFormSearch) ||
      projectName.includes(normalizedFormSearch) ||
      formIdText.includes(normalizedFormSearch)
    );
  });


  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem("authToken");
    const normalizedRoleValue =
      form.role === "" || form.role === null || form.role === undefined
        ? form.role
        : Number(form.role);

    const data = {
      username: form.username,
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      role: normalizedRoleValue,
      is_staff: form.is_staff,
      // Don't send password if unchanged
      ...(form.password && form.password !== "********" && { password: form.password }),
      profile: {
        organizations: form.profile.organizations || [],
        projects: form.profile.projects || [],
        forms: form.profile.forms || [],
      },
    };

    try {
      await axios.patch(`${BACKEND_URL}/api/users/${id}/`, data, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      toast.success("User updated successfully!");
      setTimeout(() => navigate("/user/all"), 1000);
    } catch (err) {
      toast.error("Failed to update user.");
    }
  };


  return (
    <div className="p-4">
      <h2 className="inline-block mb-4 text-black text-[22px] border-b-2 border-blue-400 border-solid">
        Edit user
      </h2>
      <form
        className="grid grid-cols-1 gap-4 p-4 bg-white border rounded-lg border-black/70 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <div className="form-group">
          <label htmlFor="first_name">First Name</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            placeholder="First Name"
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="last_name">Last Name</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            placeholder="Last Name"
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Username"
            className="w-full px-3 py-2 border rounded"
            required
            disabled // Username should not be editable
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="relative form-group">
          <label htmlFor="password" className="block mb-1 font-medium">
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter new password (leave as ******** to keep old password)"
            className="w-full px-3 py-2 border rounded"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={togglePassword}
            className="absolute top-[38px] right-6 text-gray-500 focus:outline-none"
          >
            {showPassword ? (
              <FaEye className="w-5 h-5" />
            ) : (
              <FaEyeSlash className="w-5 h-5" />
            )}
          </button>
          <div className="mt-1 text-xs text-gray-500">
            For security, the old password is not shown. Enter a new password to
            change it.
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            name="role"
            value={form.role ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
            required
          >
            <option value="" disabled>
              Select Role
            </option>

            {visibleRoleOptions.map((roleOption) => (
              <option key={roleOption.value} value={String(roleOption.value)}>
                {roleOption.label}
              </option>
            ))}
          </select>
        </div>
        {/* Assigned Organizations */}
        <div className="col-span-2 form-group">
          <label className="block mb-1 font-medium">Assigned Organizations</label>
          <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 border rounded max-h-48 overflow-y-auto">
            {organizations.length === 0 && (
              <div className="col-span-2 text-sm text-gray-500">
                No organizations available.
              </div>
            )}
            {organizations.map((organization) => (
              <label key={organization.id} className="disabled:cursor-not-allowed">
                <input
                  type="checkbox"
                  checked={hasId(form.profile?.organizations, organization.id)}
                  onChange={(e) =>
                    toggleProfileSelection(
                      "organizations",
                      organization.id,
                      e.target.checked
                    )
                  }
                  disabled={!isUserAdmin}
                  className="disabled:cursor-not-allowed disabled:bg-gray-500"
                />
                <span>{organization.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Assign Projects */}
        <div className="col-span-2 form-group">
          <label className="block mb-1 font-medium">Assigned Projects</label>
          <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 border rounded max-h-48 overflow-y-auto">
            {projects.length === 0 && (
              <div className="col-span-2 text-sm text-gray-500">
                No projects available.
              </div>
            )}
            {projects.map((project) => (
              <label key={project.id} className="disabled:cursor-not-allowed">
                <input
                  type="checkbox"
                  checked={hasId(form.profile?.projects, project.id)}
                  onChange={(e) =>
                    toggleProfileSelection("projects", project.id, e.target.checked)
                  }
                  disabled={!isUserAdmin && !isOrganizer}
                  className="disabled:cursor-not-allowed disabled:bg-gray-500"
                />
                <span>{project.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Assign Forms */}
        <div className="col-span-2 form-group">
          <label className="block mb-1 font-medium">Assigned Forms</label>
          <input
            type="text"
            placeholder="Search forms by name, project, or ID"
            className="w-full px-3 py-2 mb-2 border rounded"
            value={formSearch}
            onChange={(e) => setFormSearch(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 border rounded max-h-48 overflow-y-auto">
            {filteredForms.length === 0 && (
              <div className="col-span-2 text-sm text-gray-500">
                No forms found.
              </div>
            )}
            {filteredForms.map((availableForm) => (
              <label
                key={availableForm.id}
                className="disabled:cursor-not-allowed flex items-start gap-2"
              >
                <input
                  type="checkbox"
                  checked={hasId(form.profile?.forms, availableForm.id)}
                  onChange={(e) =>
                    toggleProfileSelection("forms", availableForm.id, e.target.checked)
                  }
                  disabled={!isUserAdmin && !isOrganizer && !isProjectmanager}
                  className="disabled:cursor-not-allowed disabled:bg-gray-500 mt-1"
                />
                <span>
                  <span className="block">{availableForm.name}</span>
                  <span className="block text-xs text-gray-500">
                    Project: {projectNameById.get(toNumericId(availableForm.project)) || "N/A"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="col-span-2 mt-6 button-container">
          <button type="submit" className="save-button">
            Save
          </button>
        </div>
        {message && (
          <div className="col-span-2 mt-2 text-center text-red-500">
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

export default EditUser;
