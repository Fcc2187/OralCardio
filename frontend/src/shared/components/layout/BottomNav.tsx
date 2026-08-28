import { NavLink } from "react-router-dom";

import { cn } from "@/shared/utils/cn";

import { NAVIGATION_DESTINATIONS } from "./navigationDestinations";

export function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-3 bottom-[calc(0.75rem+var(--spacing-safe-area-bottom,0px))] z-30 flex h-16 items-center justify-around rounded-2xl border border-hairline bg-white/95 px-2 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-md min-[1024px]:hidden"
    >
      {NAVIGATION_DESTINATIONS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 py-1 font-body text-caption min-h-tap-target-min transition-colors",
              isActive ? "font-semibold text-primary-action" : "text-muted hover:text-ink",
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon aria-hidden="true" className="size-5" />
              <span>{label}</span>
              {isActive ? (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 h-0.5 w-6 rounded-full bg-primary-action"
                />
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
