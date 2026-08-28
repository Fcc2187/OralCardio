import { NavLink } from "react-router-dom";

import { OralCardioLogo } from "@/features/auth/components/AuthIcons";
import { cn } from "@/shared/utils/cn";

import { NAVIGATION_DESTINATIONS } from "./navigationDestinations";

export function SidebarNav() {
  return (
    <aside
      aria-label="Navegação principal"
      className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col justify-between border-r border-hairline bg-canvas p-6 select-none min-[1024px]:flex"
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3">
          <OralCardioLogo className="size-8 text-primary-action" />
          <span className="font-display text-[1.4rem] font-normal tracking-tight text-ink">
            OralCardio
          </span>
        </div>

        {/* Navigation List */}
        <nav className="mt-6 flex flex-col gap-1.5">
          {NAVIGATION_DESTINATIONS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex min-h-tap-target-min items-center gap-3.5 rounded-xl px-4 py-3 font-body text-body-md transition-colors",
                  isActive
                    ? "bg-primary-action/10 font-semibold text-primary-action"
                    : "text-muted hover:bg-surface-soft hover:text-ink",
                )
              }
            >
              <Icon aria-hidden="true" className="size-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
