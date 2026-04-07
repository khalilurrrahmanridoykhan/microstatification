import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface HeaderNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  backLabel?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  navItems?: HeaderNavItem[];
}

const AppHeader = ({
  title,
  subtitle,
  backLabel = "Back",
  onBack,
  actions,
  navItems,
}: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-[hsl(var(--background)/0.8)] shadow-[0_10px_30px_hsl(200_32%_13%_/_0.06)] backdrop-blur-xl supports-[backdrop-filter]:bg-[hsl(var(--background)/0.68)]">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-3 py-4 sm:px-4 md:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {onBack && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onBack}
                className="mt-0.5 h-10 shrink-0 rounded-full border-border/80 bg-card/90 px-4 text-foreground shadow-sm hover:bg-secondary/90"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backLabel}
              </Button>
            )}

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">National Program Interface</p>
              <h1 className="font-display text-2xl text-foreground md:text-[2rem]">{title}</h1>
              {subtitle && <p className="mt-1 max-w-3xl text-sm text-muted-foreground md:block">{subtitle}</p>}
            </div>
          </div>

          {actions && <div className="ml-auto flex shrink-0 items-center justify-end gap-2">{actions}</div>}
        </div>

        {navItems && navItems.length > 0 && (
          <div className="-mx-1 overflow-x-auto px-1">
            <nav className="flex min-w-max items-center gap-2 pb-1" aria-label={`${title} navigation`}>
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={item.onClick}
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "h-10 rounded-full px-4 text-sm font-semibold shadow-sm transition-colors",
                    item.active
                      ? "border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:text-primary-foreground"
                      : "border-border/80 bg-card/90 text-foreground hover:bg-secondary/90",
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
