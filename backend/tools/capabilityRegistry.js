
const capabilities = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Main workspace overview and home page.",
    path: "/dashboard",
    roles: ["admin", "manager", "employee"]
  },
  {
    id: "dashboard_statistics",
    name: "Dashboard Statistics",
    description: "Statistics, metrics and dashboard performance information.",
    path: "/dashboard?section=statistics",
    roles: ["admin", "manager"]
  },
  {
    id: "recent_team_activity",
    name: "Recent Team Activity",
    description: "View recent activity and work updates from the team.",
    path: "/dashboard?section=activity",
    roles: ["admin", "manager"]
  },
  {
    id: "quick_actions",
    name: "Dashboard Quick Actions",
    description: "Dashboard area containing shortcuts and quick actions.",
    path: "/dashboard?section=actions",
    roles: ["admin", "manager", "employee"]
  },
  {
    id: "team_management",
    name: "Team Management",
    description: "Manage employees, staff and team information.",
    path: "/team",
    roles: ["admin", "manager"]
  },
  {
    id: "team_members",
    name: "Team Members List",
    description: "View all registered team members.",
    path: "/team?section=list",
    roles: ["admin", "manager"]
  },
  {
    id: "search_team_members",
    name: "Search Team Members",
    description: "Find and search for a particular team member.",
    path: "/team?section=search",
    roles: ["admin", "manager"]
  },
  {
    id: "edit_team_member",
    name: "Edit Team Member",
    description: "Update employee or team member details.",
    path: "/team?section=edit",
    roles: ["admin", "manager"]
  },
  {
    id: "remove_team_member",
    name: "Remove Team Member",
    description: "Remove an employee from the team.",
    path: "/team?section=remove",
    roles: ["admin"]
  },
  {
    id: "member_status",
    name: "Manage Member Status",
    description: "Activate or deactivate team members.",
    path: "/team?section=status",
    roles: ["admin", "manager"]
  },
  {
    id: "invite_member",
    name: "Invite a Team Member",
    description: "Invite a new employee to join the team.",
    path: "/team/invite",
    roles: ["admin", "manager"]
  },
  {
    id: "account_settings",
    name: "Account Settings",
    description: "Manage account settings and preferences.",
    path: "/settings",
    roles: ["admin", "manager", "employee"]
  },
  {
    id: "edit_profile",
    name: "Edit Profile",
    description: "View and edit the user's profile information.",
    path: "/settings?section=profile",
    roles: ["admin", "manager", "employee"]
  },
  {
    id: "email_notifications",
    name: "Email Notifications",
    description: "Configure email notification preferences.",
    path: "/settings?section=notifications",
    roles: ["admin", "manager", "employee"]
  },
  {
    id: "theme_settings",
    name: "Theme Settings",
    description: "Change application appearance and theme.",
    path: "/settings?section=theme",
    roles: ["admin", "manager", "employee"]
  },
  {
    id: "billing",
    name: "Billing and Payments",
    description: "Manage subscription, invoices and payment information.",
    path: "/billing",
    roles: ["admin"]
  }
];

export function getCapabilities() {
  return capabilities;
}

export function getCapability(id) {
  return capabilities.find((item) => item.id === id);
}
