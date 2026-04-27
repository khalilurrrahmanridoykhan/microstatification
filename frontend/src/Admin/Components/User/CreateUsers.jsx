import React, { useMemo, useState } from "react";
import "./CreateUser.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const RequiredMark = () => (
  <span className="ml-1 text-red-500" aria-hidden="true">
    *
  </span>
);

function CreateUsers() {
  const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
  const isMicroAdminUser = Number(userInfo?.role) === 7;
  const roleOptions = isMicroAdminUser
    ? [
        { label: "User", value: "4" },
        { label: "SK", value: "8" },
        { label: "SHW", value: "9" },
      ]
    : [{ label: "User", value: "4" }];
  const allowedRoleValues = roleOptions.map((item) => item.value);
  const templateHeaders = ["first_name", "last_name", "username", "email", "password", "role"];
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    role: "4",
    is_staff: false,
  });
  const [message, setMessage] = useState("");
  const [bulkUsers, setBulkUsers] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);

  const normalizeText = (value) => String(value || "").trim();
  const normalizeKey = (value) => normalizeText(value).toLowerCase();
  const allowedRoleSet = new Set(allowedRoleValues);

  const getRoleValue = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return allowedRoleValues[0] || "4";
    if (allowedRoleSet.has(normalized)) return normalized;

    const lowered = normalized.toLowerCase();
    if (lowered === "user") return "4";
    if (lowered === "sk" && allowedRoleSet.has("8")) return "8";
    if (lowered === "shw" && allowedRoleSet.has("9")) return "9";
    return allowedRoleValues[0] || "4";
  };

  const getRoleLabelFromValue = (value) => {
    const resolved = getRoleValue(value);
    return roleOptions.find((role) => role.value === resolved)?.label || "User";
  };

  const buildBulkRow = (input, rowIndex) => ({
    rowId: Date.now() + rowIndex + Math.floor(Math.random() * 1000),
    first_name: normalizeText(input.first_name),
    last_name: normalizeText(input.last_name),
    username: normalizeText(input.username),
    email: normalizeText(input.email),
    password: normalizeText(input.password),
    role: getRoleValue(input.role),
    apiError: "",
  });

  const duplicateMeta = useMemo(() => {
    const usernameCount = new Map();
    const emailCount = new Map();

    bulkUsers.forEach((row) => {
      const usernameKey = normalizeKey(row.username);
      const emailKey = normalizeKey(row.email);
      if (usernameKey) {
        usernameCount.set(usernameKey, (usernameCount.get(usernameKey) || 0) + 1);
      }
      if (emailKey) {
        emailCount.set(emailKey, (emailCount.get(emailKey) || 0) + 1);
      }
    });

    return bulkUsers.reduce((acc, row) => {
      const issues = [];
      const usernameKey = normalizeKey(row.username);
      const emailKey = normalizeKey(row.email);

      if (!normalizeText(row.first_name)) issues.push("First name is required");
      if (!normalizeText(row.last_name)) issues.push("Last name is required");
      if (!normalizeText(row.username)) issues.push("Username is required");
      if (!normalizeText(row.password)) issues.push("Password is required");

      if (usernameKey && (usernameCount.get(usernameKey) || 0) > 1) {
        issues.push("Duplicate username in file");
      }
      if (emailKey && (emailCount.get(emailKey) || 0) > 1) {
        issues.push("Duplicate email in file");
      }
      if (row.apiError) {
        issues.push(row.apiError);
      }

      acc[row.rowId] = {
        issues,
        hasIssue: issues.length > 0,
      };
      return acc;
    }, {});
  }, [bulkUsers]);

  const hasBulkBlockingIssue = useMemo(
    () => bulkUsers.some((row) => duplicateMeta[row.rowId]?.hasIssue),
    [bulkUsers, duplicateMeta]
  );
  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleChange = (e) => {
    const { name, value, type, checked, id } = e.target;
    if (id === "activeUser") {
      setForm({ ...form, is_staff: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem("authToken");
      const payload = {
        username: form.username.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        role: Number(form.role) || 4,
        is_staff: isMicroAdminUser ? false : form.is_staff,
      };

      await axios.post(`${BACKEND_URL}/api/users/`, payload, {
        headers: { Authorization: `Token ${token}` },
      });
      toast.success("User created successfully!");
      setForm({
        username: "",
        password: "",
        first_name: "",
        last_name: "",
        email: "",
        role: "4",
        is_staff: false,
      });
      setMessage("");
    } catch (err) {
      const errorData = err.response?.data || {};
      const firstError =
        Object.values(errorData)?.flat?.()?.[0] ||
        errorData?.detail ||
        "Failed to create user.";
      setMessage(String(firstError));
      toast.error(String(firstError));
    }
  };

  const fetchAllVisibleUsersForTemplate = async (token) => {
    const headers = { Authorization: `Token ${token}` };
    const aggregated = [];
    const seen = new Set();
    const pageSize = 200; // API caps at 200
    let page = 1;
    let total = Infinity;

    while (aggregated.length < total) {
      const res = await axios.get(`${BACKEND_URL}/api/users/list-view/`, {
        headers,
        params: { page, page_size: pageSize },
      });
      const totalCount = Number(res.data?.count) || 0;
      const pageRows = Array.isArray(res.data?.results) ? res.data.results : [];
      total = totalCount;

      if (!pageRows.length) break;
      pageRows.forEach((user) => {
        const key = `${String(user.username || "").toLowerCase()}::${String(
          user.email || ""
        ).toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          aggregated.push(user);
        }
      });

      if (pageRows.length < pageSize) break;
      page += 1;
      if (page > 100) break;
    }

    if (aggregated.length) return aggregated;

    const fallbackRes = await axios.get(`${BACKEND_URL}/api/users/user-list/`, {
      headers,
    });
    return Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
  };

  const downloadBulkTemplate = async () => {
    const rows = [
      templateHeaders,
      ["John", "Doe", "john.doe", "john.doe@example.com", "Pass@1234", "User"],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "users");

    const roleGuideRows = [
      ["Allowed Role", "Stored Value"],
      ...roleOptions.map((role) => [role.label, role.value]),
    ];
    const roleGuideSheet = XLSX.utils.aoa_to_sheet(roleGuideRows);
    XLSX.utils.book_append_sheet(workbook, roleGuideSheet, "role_options");

    try {
      const token = sessionStorage.getItem("authToken");
      const existingRows = await fetchAllVisibleUsersForTemplate(token);

      const existingUsersSheetRows = [
        ["first_name", "last_name", "username", "email", "role", "action", "note"],
        ...existingRows.map((user) => [
          user.first_name || "",
          user.last_name || "",
          user.username || "",
          user.email || "",
          getRoleLabelFromValue(user.role),
          "KEEP",
          "",
        ]),
      ];
      const existingUsersSheet = XLSX.utils.aoa_to_sheet(existingUsersSheetRows);
      XLSX.utils.book_append_sheet(workbook, existingUsersSheet, "existing_users");
    } catch (error) {
      console.error(error);
      toast.warning("Template exported without existing users list.");
    }

    XLSX.writeFile(workbook, "bulk-user-template.xlsx");
  };

  const clearBulkFileInput = (event) => {
    if (event?.target) {
      event.target.value = "";
    }
  };

  const handleBulkFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setBulkImporting(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames?.[0];
      if (!sheetName) {
        toast.error("No worksheet found in uploaded file.");
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      if (!jsonRows.length) {
        toast.error("Uploaded file is empty.");
        return;
      }

      const parsedRows = jsonRows
        .map((row, index) =>
          buildBulkRow(
            {
              first_name: row.first_name,
              last_name: row.last_name,
              username: row.username,
              email: row.email,
              password: row.password,
              role: row.role,
            },
            index
          )
        )
        .filter(
          (row) =>
            row.first_name ||
            row.last_name ||
            row.username ||
            row.email ||
            row.password
        );

      if (!parsedRows.length) {
        toast.error("No valid user rows found.");
        return;
      }

      try {
        const token = sessionStorage.getItem("authToken");
        const existingRes = await axios.get(`${BACKEND_URL}/api/users/basic-list/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const existingUsers = Array.isArray(existingRes.data) ? existingRes.data : [];
        const existingUsernames = new Set(
          existingUsers.map((user) => normalizeKey(user.username)).filter(Boolean)
        );
        const existingEmails = new Set(
          existingUsers.map((user) => normalizeKey(user.email)).filter(Boolean)
        );

        const withExistingValidation = parsedRows.map((row) => {
          const issues = [];
          if (existingUsernames.has(normalizeKey(row.username))) {
            issues.push("Username already exists");
          }
          if (row.email && existingEmails.has(normalizeKey(row.email))) {
            issues.push("Email already exists");
          }
          return {
            ...row,
            apiError: issues.join(", "),
          };
        });

        setBulkUsers(withExistingValidation);
      } catch (listErr) {
        console.error(listErr);
        setBulkUsers(parsedRows);
        toast.warning("Loaded file, but could not pre-check existing users.");
      }

      setShowBulkModal(true);
      toast.success("Bulk user file loaded. Review before creating users.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to read XLSX file.");
    } finally {
      clearBulkFileInput(event);
      setBulkImporting(false);
    }
  };

  const handleBulkFieldChange = (rowId, field, value) => {
    setBulkUsers((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;
        const updatedValue =
          field === "role" ? getRoleValue(value) : normalizeText(value);
        return { ...row, [field]: updatedValue, apiError: "" };
      })
    );
  };

  const removeBulkRow = (rowId) => {
    setBulkUsers((prev) => prev.filter((row) => row.rowId !== rowId));
  };

  const handleBulkSubmit = async () => {
    if (!bulkUsers.length) {
      toast.error("No user rows to submit.");
      return;
    }
    if (hasBulkBlockingIssue) {
      toast.error("Fix highlighted duplicate/invalid rows before submitting.");
      return;
    }

    const token = sessionStorage.getItem("authToken");
    setBulkSubmitting(true);
    let createdCount = 0;

    try {
      const updatedRows = [...bulkUsers];
      for (let i = 0; i < updatedRows.length; i += 1) {
        const row = updatedRows[i];
        const payload = {
          first_name: row.first_name,
          last_name: row.last_name,
          username: row.username,
          email: row.email,
          password: row.password,
          role: Number(row.role) || 4,
          is_staff: false,
        };

        try {
          await axios.post(`${BACKEND_URL}/api/users/`, payload, {
            headers: { Authorization: `Token ${token}` },
          });
          createdCount += 1;
          updatedRows[i] = { ...row, apiError: "" };
        } catch (error) {
          const errorData = error.response?.data || {};
          const firstError =
            Object.values(errorData)?.flat?.()?.[0] ||
            errorData?.detail ||
            "Failed to create this row.";
          updatedRows[i] = {
            ...row,
            apiError: String(firstError),
          };
        }
      }

      const failedRows = updatedRows.filter((row) => row.apiError);
      if (failedRows.length) {
        setBulkUsers(failedRows);
        toast.warning(
          `Created ${createdCount} users. ${failedRows.length} row(s) need fixes.`
        );
      } else {
        setBulkUsers([]);
        setShowBulkModal(false);
        toast.success(`Successfully created ${createdCount} users.`);
      }
    } finally {
      setBulkSubmitting(false);
    }
  };

  const downloadFailedRowsTemplate = () => {
    const failedRows = bulkUsers.filter((row) => row.apiError);
    if (!failedRows.length) {
      toast.error("There are no failed rows to download.");
      return;
    }

    const exportRows = failedRows.map((row) => ({
      first_name: row.first_name,
      last_name: row.last_name,
      username: row.username,
      email: row.email,
      password: row.password,
      role: getRoleLabelFromValue(row.role),
      error: row.apiError,
    }));

    const sheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "failed-users");
    XLSX.writeFile(workbook, "bulk-user-failed-rows.xlsx");
  };

  return (
    <div className="">
      <p className="inline-block mb-4 text-[22px] border-b-2 border-blue-400 border-solid">
        Create User
      </p>
      <form
        className="bg-white rounded-lg p-4 border border-black/70 grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <div className="form-group">
          <label htmlFor="first_name">
            First Name
            <RequiredMark />
          </label>
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
          <label htmlFor="last_name">
            Last Name
            <RequiredMark />
          </label>
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
          <label htmlFor="username">
            Username
            <RequiredMark />
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Username"
            className="w-full px-3 py-2 border rounded"
            required
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
          />
        </div>
        <div className="relative form-group">
          <label htmlFor="password" className="block mb-1 font-medium">
            Password
            <RequiredMark />
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full px-3 py-2 border rounded"
            required
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
        </div>
        {isMicroAdminUser && (
          <div className="form-group">
            <label htmlFor="role">
              Role
              <RequiredMark />
            </label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="4">User</option>
              <option value="8">SK</option>
              <option value="9">SHW</option>
            </select>
          </div>
        )}
        <div className="col-span-2">
          {isMicroAdminUser ? (
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
              Microstatification admins can create only `User`, `SK`, and `SHW`
              accounts here. Location assignment can be completed from `Assign User`.
            </div>
          ) : (
            <>
              <h3 className="mt-6 mb-2 text-[18px]">Notification</h3>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="activeUser"
                  className="mr-2 toggle-input"
                  checked={form.is_staff}
                  onChange={handleChange}
                />
                <label htmlFor="activeUser" className="mr-2 toggle-switch"></label>
                <label htmlFor="activeUser" className="notification-label">
                  Active user for work
                </label>
              </div>
            </>
          )}
        </div>
        <div className="col-span-2 mt-6 button-container">
          <button type="submit" className="save-button">
            Save
          </button>
        </div>
        <div className="col-span-2 mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={downloadBulkTemplate}
            className="rounded-md border border-blue-400 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
          >
            Export Bulk Template (.xlsx)
          </button>
          <label className="cursor-pointer rounded-md border border-green-500 bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">
            {bulkImporting ? "Loading..." : "Upload Bulk Users (.xlsx)"}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleBulkFileUpload}
              disabled={bulkImporting}
            />
          </label>
          <p className="text-xs text-gray-500">
            Use the exported template format. Review and fix duplicate rows before
            submit.
          </p>
        </div>
        {message && (
          <div className="col-span-2 mt-2 text-center text-red-500">
            {message}
          </div>
        )}
      </form>
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-7xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-lg font-semibold">Bulk User Preview</h3>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100"
              >
                Close
              </button>
            </div>
            <div className="px-4 py-2 text-sm">
              <span className="font-medium">{bulkUsers.length}</span> row(s) loaded.
              Duplicate/invalid rows are highlighted in red and cannot be submitted.
            </div>
            <div className="max-h-[60vh] overflow-auto px-4 pb-4">
              <table className="min-w-full border text-sm">
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    <th className="border px-2 py-2 text-left">First Name</th>
                    <th className="border px-2 py-2 text-left">Last Name</th>
                    <th className="border px-2 py-2 text-left">Username</th>
                    <th className="border px-2 py-2 text-left">Email</th>
                    <th className="border px-2 py-2 text-left">Password</th>
                    <th className="border px-2 py-2 text-left">Role</th>
                    <th className="border px-2 py-2 text-left">Issue</th>
                    <th className="border px-2 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkUsers.map((row) => {
                    const rowMeta = duplicateMeta[row.rowId] || { issues: [] };
                    const hasIssue = rowMeta.hasIssue;
                    return (
                      <tr key={row.rowId} className={hasIssue ? "bg-red-100" : ""}>
                        <td className="border px-2 py-2">
                          <input
                            value={row.first_name}
                            onChange={(e) =>
                              handleBulkFieldChange(row.rowId, "first_name", e.target.value)
                            }
                            className="w-full rounded border px-2 py-1"
                          />
                        </td>
                        <td className="border px-2 py-2">
                          <input
                            value={row.last_name}
                            onChange={(e) =>
                              handleBulkFieldChange(row.rowId, "last_name", e.target.value)
                            }
                            className="w-full rounded border px-2 py-1"
                          />
                        </td>
                        <td className="border px-2 py-2">
                          <input
                            value={row.username}
                            onChange={(e) =>
                              handleBulkFieldChange(row.rowId, "username", e.target.value)
                            }
                            className="w-full rounded border px-2 py-1"
                          />
                        </td>
                        <td className="border px-2 py-2">
                          <input
                            value={row.email}
                            onChange={(e) =>
                              handleBulkFieldChange(row.rowId, "email", e.target.value)
                            }
                            className="w-full rounded border px-2 py-1"
                          />
                        </td>
                        <td className="border px-2 py-2">
                          <input
                            value={row.password}
                            onChange={(e) =>
                              handleBulkFieldChange(row.rowId, "password", e.target.value)
                            }
                            className="w-full rounded border px-2 py-1"
                          />
                        </td>
                        <td className="border px-2 py-2">
                          <select
                            value={row.role}
                            onChange={(e) =>
                              handleBulkFieldChange(row.rowId, "role", e.target.value)
                            }
                            className="w-full rounded border px-2 py-1"
                          >
                            {roleOptions.map((role) => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border px-2 py-2 text-xs text-red-700">
                          {rowMeta.issues.join(", ")}
                        </td>
                        <td className="border px-2 py-2">
                          <button
                            type="button"
                            onClick={() => removeBulkRow(row.rowId)}
                            className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-gray-600">
                {hasBulkBlockingIssue
                  ? "Resolve all highlighted rows before submit."
                  : "All rows look valid."}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadFailedRowsTemplate}
                  disabled={!bulkUsers.some((row) => row.apiError)}
                  className="rounded-md border border-amber-500 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-amber-200 disabled:text-amber-300"
                >
                  Download Failed Rows (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={bulkSubmitting || hasBulkBlockingIssue || !bulkUsers.length}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {bulkSubmitting ? "Creating..." : "Create Users"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateUsers;
