"use client";

import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {
  IconBell,
  IconBuildingSkyscraper,
  IconChecklist,
  IconChevronDown,
  IconCommand,
  IconGitBranch,
  IconLayoutDashboard,
  IconLogout,
  IconMenu2,
  IconRobot,
  IconSearch,
  IconSettings,
  IconUsersGroup,
  IconUserScan,
  IconX,
} from "@tabler/icons-react";
import {useEffect, useRef, useState} from "react";
import {logout} from "@/features/auth/actions";
import type {SessionUser} from "@/features/auth/types";

const nav = [
  {href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard},
  {href: "/crm", label: "CRM", icon: IconBuildingSkyscraper},
  {href: "/leads", label: "Leads", icon: IconUsersGroup},
  {href: "/tasks", label: "Tasks", icon: IconChecklist},
  {href: "/ai-command-center", label: "AI Command Center", icon: IconRobot, executiveOnly: true},
  {href: "/workflow-engine", label: "Workflow Engine", icon: IconGitBranch, executiveOnly: true},
  {href: "/ai-professionals", label: "AI Workforce", icon: IconUserScan},
  {href: "/settings", label: "Settings", icon: IconSettings},
];

export function AppShell({children, user}: {children: React.ReactNode; user: SessionUser | null}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!user || pathname === "/login" || pathname === "/forgot-password") return <>{children}</>;

  const visibleNav = nav.filter(item =>
    !item.executiveOnly || ["Super Admin", "CEO", "COO"].includes(user.role),
  );

  function searchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.current?.value.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">M</span>
          <div><strong>MORIFAR</strong><small>OS</small></div>
        </div>
        <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close menu">
          <IconX size={20} />
        </button>
        <nav>
          <p className="nav-label">OPERATIONS</p>
          {visibleNav.map(item => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={active ? "active" : ""}
              >
                <item.icon size={19} stroke={1.7} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot-wrap">
          <button className="sidebar-foot" onClick={() => setUserMenu(value => !value)}>
            <div className="mini-avatar">{user.avatar}</div>
            <div><strong>{user.name}</strong><small>{user.role}</small></div>
            <IconChevronDown size={16} />
          </button>
          {userMenu && (
            <form action={logout} className="user-popover">
              <button><IconLogout size={16} />Sign out</button>
            </form>
          )}
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main-wrap">
        <header className="topbar">
          <button className="menu-button" onClick={() => setOpen(true)} aria-label="Open menu">
            <IconMenu2 size={22} />
          </button>
          <form className="global-search" onSubmit={searchSubmit}>
            <IconSearch size={18} />
            <input ref={search} aria-label="Global search" placeholder="Search clients, tasks, companies, AI..." />
            <kbd><IconCommand size={11} /> K</kbd>
          </form>
          <div className="top-actions">
            <Link href="/notifications" aria-label="Notifications" className="notification-button">
              <IconBell size={19} /><i />
            </Link>
            <button className="top-avatar" onClick={() => setUserMenu(value => !value)}>{user.avatar}</button>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
