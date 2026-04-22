import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
  type AdminUser,
  type AppRole,
} from "@/lib/api";

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("123456");
  const [role, setRole] = useState<AppRole>("sk");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await fetchUsers());
    } catch (error) {
      toast({
        title: "Load error",
        description: error instanceof Error ? error.message : "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("123456");
    setRole("sk");
    setEditingUserId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast({
        title: "Validation error",
        description: "Name and email are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingUserId) {
        await updateUser(editingUserId, {
          full_name: name.trim(),
          email: email.trim(),
          role,
          password: password.trim() ? password.trim() : undefined,
        });
        toast({ title: "User updated successfully" });
      } else {
        await createUser({
          full_name: name.trim(),
          email: email.trim(),
          role,
          password: password.trim(),
        });
        toast({ title: "User created successfully" });
      }

      resetForm();
      await loadUsers();
    } catch (error) {
      toast({
        title: editingUserId ? "Update failed" : "Create failed",
        description: error instanceof Error ? error.message : "Unable to save user.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (user: AdminUser) => {
    setName(user.full_name);
    setEmail(user.email);
    setRole(user.role);
    setPassword("");
    setEditingUserId(user.id);
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Delete this user?")) {
      return;
    }

    try {
      await deleteUser(userId);
      toast({ title: "User deleted successfully" });
      if (editingUserId === userId) {
        resetForm();
      }
      await loadUsers();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unable to delete user.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="text"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder={editingUserId ? "Leave blank to keep current password" : "123456"}
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-xs font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value as AppRole)}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="sk">SK</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            {editingUserId ? "Update User" : "Create User"}
          </button>

          {editingUserId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full table-auto text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Assignments</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-3">{user.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3 capitalize">{user.role}</td>
                <td className="px-4 py-3">{user.assignment_count}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleEdit(user)}
                      className="text-sm font-medium text-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(user.id)}
                      disabled={user.id === currentUser?.id}
                      className="text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:text-gray-400"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!loading && users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
