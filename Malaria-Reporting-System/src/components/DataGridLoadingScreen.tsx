import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DatabaseZap, EyeOff, Loader2 } from "lucide-react";

interface DataGridLoadingScreenProps {
  title: string;
  description: string;
  cachedRows?: number;
  columnCount?: number;
  rowCount?: number;
  onDismiss?: () => void;
}

const DataGridLoadingScreen = ({
  title,
  description,
  cachedRows = 0,
  columnCount = 12,
  rowCount = 6,
  onDismiss,
}: DataGridLoadingScreenProps) => {
  const visibleColumnCount = Math.max(6, Math.min(columnCount, 14));
  const visibleRowCount = Math.max(4, Math.min(rowCount, 8));

  return (
    <div className="absolute inset-0 z-20 overflow-hidden rounded-[1.25rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(244,247,240,0.97)_50%,_rgba(238,244,249,0.94))] backdrop-blur-sm">
      <div className="flex h-full items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-6xl rounded-[1.75rem] border border-border/70 bg-white/92 p-4 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.45)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading Data
              </div>
              <div>
                <h3 className="font-display text-2xl text-foreground sm:text-[1.9rem]">{title}</h3>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>

            {onDismiss && (
              <Button variant="outline" size="sm" onClick={onDismiss} className="self-start rounded-full">
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Loading
              </Button>
            )}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <div className="rounded-[1.2rem] border border-border/70 bg-slate-50/90 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <DatabaseZap className="h-4 w-4 text-emerald-600" />
                Request Status
              </div>
              <p className="mt-3 text-sm text-slate-700">
                Pulling the latest rows, month values, and related location details.
              </p>
            </div>

            <div className="rounded-[1.2rem] border border-border/70 bg-slate-50/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Current View
              </p>
              <p className="mt-3 text-sm text-slate-700">
                {cachedRows > 0
                  ? `${cachedRows} cached rows remain available until the refreshed table is ready.`
                  : "Preparing the first visible batch for this table."}
              </p>
            </div>

            <div className="rounded-[1.2rem] border border-border/70 bg-slate-50/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Interaction
              </p>
              <p className="mt-3 text-sm text-slate-700">
                Filters and tabs stay usable. You can also hide this screen while the fetch continues.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.35rem] border border-border/70 bg-white/95">
            <div className="border-b border-border/70 bg-slate-50/90 p-3">
              <div className="flex gap-2">
                {Array.from({ length: visibleColumnCount }, (_, index) => (
                  <Skeleton
                    key={`header-${index}`}
                    className={`h-7 ${index === 0 ? "w-16" : index < 4 ? "w-24" : "flex-1"}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-0">
              {Array.from({ length: visibleRowCount }, (_, rowIndex) => (
                <div
                  key={`row-${rowIndex}`}
                  className="border-t border-border/60 p-3 first:border-t-0"
                >
                  <div className="flex gap-2">
                    {Array.from({ length: visibleColumnCount }, (_, colIndex) => (
                      <Skeleton
                        key={`cell-${rowIndex}-${colIndex}`}
                        className={`h-8 ${colIndex === 0 ? "w-16" : colIndex < 4 ? "w-24" : "flex-1"}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataGridLoadingScreen;
