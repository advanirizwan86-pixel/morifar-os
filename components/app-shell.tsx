"use client";

import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {
  IconBell,
  IconBook,
  IconBrain,
  IconBriefcase2,
  IconBuildingSkyscraper,
  IconChartBar,
  IconChecklist,
  IconChevronDown,
  IconCommand,
  IconGitBranch,
  IconLayoutDashboard,
  IconLogout,
  IconMenu2,
  IconRobot,
  IconSearch,
  IconServer,
  IconSettings,
  IconUsersGroup,
  IconUserScan,
  IconX,
} from "@tabler/icons-react";
import {useEffect, useRef, useState} from "react";
import {logout} from "@/features/auth/actions";
import type {SessionUser} from "@/features/auth/types";

const navGroups = [
  {
    label: "Dashboard",
    items: [{href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard}],
  },
  {
    label: "Operations",
    items: [
      {href: "/business-operations", label: "Operations", icon: IconBriefcase2},
      {href: "/company-formation", label: "Formation", icon: IconBuildingSkyscraper},
      {href: "/client-onboarding", label: "Onboarding", icon: IconUsersGroup},
      {href: "/documents", label: "Documents", icon: IconChecklist},
      {href: "/approvals", label: "Approvals", icon: IconGitBranch},
      {href: "/department-queues", label: "Queues", icon: IconCommand},
    ],
  },
  {
    label: "CRM",
    items: [
      {href: "/crm", label: "CRM", icon: IconBuildingSkyscraper},
      {href: "/leads", label: "Leads", icon: IconUsersGroup},
      {href: "/tasks", label: "Tasks", icon: IconChecklist},
    ],
  },
  {
    label: "AI Workforce",
    items: [
      {href: "/ai-command-center", label: "AI Command Center", icon: IconRobot, executiveOnly: true},
      {href: "/ai-professionals", label: "AI Workforce", icon: IconUserScan},
    ],
  },
  {
    label: "Automation",
    items: [
      {href: "/workflow-engine", label: "Workflow Engine", icon: IconGitBranch, executiveOnly: true},
      {href: "/executive-copilot", label: "Executive Copilot", icon: IconBrain, executiveOnly: true},
      {href: "/operations-intelligence", label: "Operations Intelligence", icon: IconChartBar, executiveOnly: true},
    ],
  },
  {
    label: "Intelligence",
    items: [
      {href: "/client-intelligence", label: "Client Intelligence", icon: IconBrain},
      {href: "/knowledge-base", label: "Knowledge Base", icon: IconBook},
    ],
  },
  {
    label: "Administration",
    items: [
      {href: "/system-status", label: "System Status", icon: IconServer, executiveOnly: true},
      {href: "/settings", label: "Settings", icon: IconSettings, executiveOnly: true},
    ],
  },
];

export function AppShell({children, user}: {children: React.ReactNode; user: SessionUser | null}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sidebarUserMenu, setSidebarUserMenu] = useState(false);
  const [topUserMenu, setTopUserMenu] = useState(false);
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        search.current?.focus();
      }
      if (event.key === "Escape") {
        setSidebarUserMenu(false);
        setTopUserMenu(false);
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!user || pathname === "/login" || pathname === "/forgot-password") return <>{children}</>;

  const canSeeExecutive = ["Super Admin", "CEO", "COO"].includes(user.role);

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
          {navGroups.map(group => {
            const visibleItems = group.items.filter(item => !item.executiveOnly || canSeeExecutive);
            if (!visibleItems.length) return null;
            return (
              <div className="nav-group" key={group.label}>
                <p className="nav-label">{group.label}</p>
                {visibleItems.map(item => {
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
              </div>
            );
          })}
        </nav>
        <div className="sidebar-foot-wrap">
          <button className="sidebar-foot" onClick={() => setSidebarUserMenu(value => !value)} aria-label="Open user menu" aria-expanded={sidebarUserMenu}>
            <div className="mini-avatar">{user.avatar}</div>
            <div><strong>{user.name}</strong><small>{user.role}</small></div>
            <IconChevronDown size={16} />
          </button>
          {sidebarUserMenu && (
            <form action={logout} className="user-popover">
              <button aria-label="Sign out of Morifar OS"><IconLogout size={16} />Sign out</button>
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
            <div className="top-user-wrap">
              <button className="top-avatar" onClick={() => setTopUserMenu(value => !value)} aria-label="Open user menu" aria-expanded={topUserMenu}>{user.avatar}</button>
              {topUserMenu && (
                <form action={logout} className="user-popover top-user-popover">
                  <button aria-label="Sign out of Morifar OS"><IconLogout size={16} />Sign out</button>
                </form>
              )}
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
