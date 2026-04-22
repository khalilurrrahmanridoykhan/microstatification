import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDhakaYear, MONTH_LABELS, MONTH_COLUMNS } from "@/lib/monthUtils";
import { Check, RefreshCw } from "lucide-react";
import {
  fetchReviews,
  upsertMonthlyApproval,
  type ApprovalRow,
  type ApprovalStatus,
  type RecordType,
  type ReviewRow,
} from "@/lib/api";

const AdminRecordReview = () => {
  const { toast } = useToast();
  const currentYear = getDhakaYear();

  const [year, setYear] = useState(currentYear);
  const [recordType, setRecordType] = useState<RecordType>("local");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const data = await fetchReviews(year, recordType);
      setRows(data.rows);
      setApprovals(data.approvals);
    } catch (error) {
      toast({
        title: "Load error",
        description: error instanceof Error ? error.message : "Failed to load review data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [recordType, year, toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const getStatus = (row: ReviewRow, month: number): ApprovalStatus | undefined => {
    const found = approvals.find(
      (approval) => approval.record_id === row.id && approval.month === month,
    );
    if (found?.status) {
      return found.status;
    }

    const monthColumn = MONTH_COLUMNS[month - 1];
    return row[monthColumn] > 0 ? "PENDING" : undefined;
  };

  const approveMonth = async (recordId: string, month: number) => {
    try {
      await upsertMonthlyApproval({
        recordType,
        recordId,
        reportingYear: year,
        month,
        status: "APPROVED",
      });
      await fetchData();
    } catch (error) {
      toast({
        title: "Approval failed",
        description: error instanceof Error ? error.message : "Failed to approve month.",
        variant: "destructive",
      });
    }
  };

  const approveAllRow = async (recordId: string) => {
    try {
      await Promise.all(
        MONTH_COLUMNS.map((_column, index) =>
          upsertMonthlyApproval({
            recordType,
            recordId,
            reportingYear: year,
            month: index + 1,
            status: "APPROVED",
          }),
        ),
      );
      await fetchData();
    } catch (error) {
      toast({
        title: "Approval failed",
        description: error instanceof Error ? error.message : "Failed to approve all months.",
        variant: "destructive",
      });
    }
  };

  const getCellColor = (row: ReviewRow, month: number) => {
    const status = getStatus(row, month);
    if (status === "APPROVED") return "bg-green-100 text-green-700";
    if (status === "PENDING") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => setRecordType("local")}
              className={`px-3 h-8 text-xs ${
                recordType === "local"
                  ? "bg-gray-900 text-white"
                  : "bg-white"
              }`}
            >
              Local
            </button>
            <button
              onClick={() => setRecordType("non_local")}
              className={`px-3 h-8 text-xs ${
                recordType === "non_local"
                  ? "bg-gray-900 text-white"
                  : "bg-white"
              }`}
            >
              Non-Local
            </button>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Reload
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="p-2 text-left">SK</th>
              <th className="p-2 text-left">Location</th>
              {MONTH_LABELS.map((m) => (
                <th key={m} className="p-2 text-center">
                  {m}
                </th>
              ))}
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{row.sk_name}</td>
                <td className="p-2">{row.location}</td>

                {MONTH_COLUMNS.map((col, idx) => {
                  const month = idx + 1;
                  return (
                    <td key={col} className="p-1 text-center">
                      <button
                        onClick={() => approveMonth(row.id, month)}
                        className={`px-2 py-1 rounded text-xs ${getCellColor(row, month)}`}
                      >
                        {getStatus(row, month) || "—"}
                      </button>
                    </td>
                  );
                })}

                <td className="p-2 text-center">
                  <Button
                    size="sm"
                    onClick={() => approveAllRow(row.id)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve All
                  </Button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={15} className="text-center p-6 text-muted-foreground">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRecordReview;
