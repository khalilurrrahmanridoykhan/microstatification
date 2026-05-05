import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  assignVillage,
  fetchAssignments,
  fetchLocations,
  fetchUsers,
  type AdminUser,
  type Assignment,
  type DistrictNode,
  type UnionNode,
  type UpazilaNode,
  type VillageNode,
} from "@/lib/api";

const VillageAssignment = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [locations, setLocations] = useState<DistrictNode[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [skId, setSkId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [upazilaId, setUpazilaId] = useState("");
  const [unionId, setUnionId] = useState("");
  const [villageId, setVillageId] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [usersData, locationData, assignmentData] = await Promise.all([
        fetchUsers(),
        fetchLocations(),
        fetchAssignments(),
      ]);
      setUsers(usersData);
      setLocations(locationData);
      setAssignments(assignmentData);
    } catch (error) {
      toast({
        title: "Load error",
        description: error instanceof Error ? error.message : "Failed to load assignment data.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const skUsers = useMemo(
    () => users.filter((user) => user.role === "spo"),
    [users],
  );

  const districtOptions = locations;
  const upazilaOptions = useMemo<UpazilaNode[]>(
    () => districtOptions.find((district) => district.id === districtId)?.upazilas ?? [],
    [districtId, districtOptions],
  );
  const unionOptions = useMemo<UnionNode[]>(
    () => upazilaOptions.find((upazila) => upazila.id === upazilaId)?.unions ?? [],
    [upazilaId, upazilaOptions],
  );
  const villageOptions = useMemo<VillageNode[]>(
    () => unionOptions.find((unionItem) => unionItem.id === unionId)?.villages ?? [],
    [unionId, unionOptions],
  );
  const selectedVillage = useMemo(
    () => villageOptions.find((village) => village.id === villageId) ?? null,
    [villageId, villageOptions],
  );

  const resetSelections = () => {
    setDistrictId("");
    setUpazilaId("");
    setUnionId("");
    setVillageId("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!skId || !villageId) {
      toast({
        title: "Validation error",
        description: "Select an SPO and a village first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await assignVillage(skId, villageId);
      toast({ title: result.message });
      await loadData();
      resetSelections();
    } catch (error) {
      toast({
        title: "Assignment failed",
        description: error instanceof Error ? error.message : "Failed to assign village.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="skId" className="block text-xs font-medium text-gray-700">
              Select SPO
            </label>
            <select
              id="skId"
              value={skId}
              onChange={(event) => setSkId(event.target.value)}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Select SPO</option>
              {skUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="district" className="block text-xs font-medium text-gray-700">
              District
            </label>
            <select
              id="district"
              value={districtId}
              onChange={(event) => {
                setDistrictId(event.target.value);
                setUpazilaId("");
                setUnionId("");
                setVillageId("");
              }}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Select district</option>
              {districtOptions.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="upazila" className="block text-xs font-medium text-gray-700">
              Upazila
            </label>
            <select
              id="upazila"
              value={upazilaId}
              onChange={(event) => {
                setUpazilaId(event.target.value);
                setUnionId("");
                setVillageId("");
              }}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Select upazila</option>
              {upazilaOptions.map((upazila) => (
                <option key={upazila.id} value={upazila.id}>
                  {upazila.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="union" className="block text-xs font-medium text-gray-700">
              Union
            </label>
            <select
              id="union"
              value={unionId}
              onChange={(event) => {
                setUnionId(event.target.value);
                setVillageId("");
              }}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Select union</option>
              {unionOptions.map((unionItem) => (
                <option key={unionItem.id} value={unionItem.id}>
                  {unionItem.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="village" className="block text-xs font-medium text-gray-700">
              Village
            </label>
            <select
              id="village"
              value={villageId}
              onChange={(event) => setVillageId(event.target.value)}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Select village</option>
              {villageOptions.map((village) => (
                <option key={village.id} value={village.id}>
                  {village.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ward" className="block text-xs font-medium text-gray-700">
              Ward
            </label>
            <input
              id="ward"
              value={selectedVillage?.ward_no ?? ""}
              className="mt-2 w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm"
              readOnly
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Assign Village
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full table-auto text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
                <th className="px-4 py-3 text-left">SPO</th>
              <th className="px-4 py-3 text-left">District</th>
              <th className="px-4 py-3 text-left">Upazila</th>
              <th className="px-4 py-3 text-left">Union</th>
              <th className="px-4 py-3 text-left">Village</th>
              <th className="px-4 py-3 text-left">Ward</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id} className="border-t">
                <td className="px-4 py-3">{assignment.sk_name}</td>
                <td className="px-4 py-3">{assignment.district_name}</td>
                <td className="px-4 py-3">{assignment.upazila_name}</td>
                <td className="px-4 py-3">{assignment.union_name}</td>
                <td className="px-4 py-3">{assignment.village_name}</td>
                <td className="px-4 py-3">{assignment.ward_no ?? ""}</td>
              </tr>
            ))}

            {assignments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                  No assignments found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VillageAssignment;
