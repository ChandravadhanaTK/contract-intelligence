import type { Role, AppUser } from "@/types";

const allModules = [
  "ContractCreation", "Upload", "Deviation", "Redlining", "Workflow",
  "Intake", "Credentialing", "Rates", "Downstream", "Compliance",
  "Monitoring", "Renewals", "UserManagement",
];

function perm(module: string, level: "View" | "Edit" | "Approve" | "Admin") {
  return { module, accessLevel: level };
}

function allAt(level: "View" | "Edit" | "Approve" | "Admin") {
  return allModules.map(m => perm(m, level));
}

export const seedRoles: Role[] = [
  {
    id: "role-network-mgr",
    name: "Network Manager",
    description: "Manages provider network configuration and contracting",
    permissions: [
      perm("ContractCreation", "Edit"), perm("Upload", "Edit"), perm("Deviation", "Edit"),
      perm("Redlining", "Approve"), perm("Workflow", "Edit"), perm("Intake", "Approve"),
      perm("Credentialing", "View"), perm("Rates", "Edit"), perm("Downstream", "Edit"),
      perm("Compliance", "View"), perm("Monitoring", "View"), perm("Renewals", "Edit"),
      perm("UserManagement", "View"),
    ],
  },
  {
    id: "role-legal-mgr",
    name: "Legal Manager",
    description: "Oversees legal review, redlining, and contract compliance",
    permissions: [
      perm("ContractCreation", "View"), perm("Upload", "View"), perm("Deviation", "Approve"),
      perm("Redlining", "Approve"), perm("Workflow", "Edit"), perm("Intake", "View"),
      perm("Credentialing", "View"), perm("Rates", "View"), perm("Downstream", "View"),
      perm("Compliance", "Approve"), perm("Monitoring", "View"), perm("Renewals", "Approve"),
      perm("UserManagement", "View"),
    ],
  },
  {
    id: "role-loader",
    name: "Contract Loader",
    description: "Loads contract data into downstream systems",
    permissions: [
      perm("ContractCreation", "View"), perm("Upload", "Edit"), perm("Deviation", "View"),
      perm("Redlining", "View"), perm("Workflow", "View"), perm("Intake", "View"),
      perm("Credentialing", "View"), perm("Rates", "Edit"), perm("Downstream", "Edit"),
      perm("Compliance", "View"), perm("Monitoring", "View"), perm("Renewals", "View"),
      perm("UserManagement", "View"),
    ],
  },
  {
    id: "role-intake",
    name: "Provider Intake",
    description: "Handles provider intake requests and triage",
    permissions: [
      perm("ContractCreation", "View"), perm("Upload", "View"), perm("Deviation", "View"),
      perm("Redlining", "View"), perm("Workflow", "View"), perm("Intake", "Edit"),
      perm("Credentialing", "View"), perm("Rates", "View"), perm("Downstream", "View"),
      perm("Compliance", "View"), perm("Monitoring", "View"), perm("Renewals", "View"),
      perm("UserManagement", "View"),
    ],
  },
  {
    id: "role-cred-analyst",
    name: "Credentialing Analyst",
    description: "Performs provider credentialing verification and validation",
    permissions: [
      perm("ContractCreation", "View"), perm("Upload", "View"), perm("Deviation", "View"),
      perm("Redlining", "View"), perm("Workflow", "View"), perm("Intake", "View"),
      perm("Credentialing", "Edit"), perm("Rates", "View"), perm("Downstream", "View"),
      perm("Compliance", "View"), perm("Monitoring", "View"), perm("Renewals", "View"),
      perm("UserManagement", "View"),
    ],
  },
  {
    id: "role-provider-admin",
    name: "Provider Data Admin",
    description: "Administers provider master data and directory information",
    permissions: [
      perm("ContractCreation", "Edit"), perm("Upload", "Edit"), perm("Deviation", "View"),
      perm("Redlining", "View"), perm("Workflow", "Edit"), perm("Intake", "Edit"),
      perm("Credentialing", "Edit"), perm("Rates", "View"), perm("Downstream", "Edit"),
      perm("Compliance", "View"), perm("Monitoring", "View"), perm("Renewals", "View"),
      perm("UserManagement", "View"),
    ],
  },
  {
    id: "role-claims-ops",
    name: "Claims Ops",
    description: "Manages claims operations, disputes, and payment accuracy",
    permissions: [
      perm("ContractCreation", "View"), perm("Upload", "View"), perm("Deviation", "View"),
      perm("Redlining", "View"), perm("Workflow", "View"), perm("Intake", "View"),
      perm("Credentialing", "View"), perm("Rates", "Edit"), perm("Downstream", "View"),
      perm("Compliance", "View"), perm("Monitoring", "Edit"), perm("Renewals", "View"),
      perm("UserManagement", "View"),
    ],
  },
  {
    id: "role-um",
    name: "Utilization Management",
    description: "Manages utilization review rules and authorization processes",
    permissions: [
      perm("ContractCreation", "View"), perm("Upload", "View"), perm("Deviation", "View"),
      perm("Redlining", "View"), perm("Workflow", "View"), perm("Intake", "View"),
      perm("Credentialing", "View"), perm("Rates", "View"), perm("Downstream", "View"),
      perm("Compliance", "View"), perm("Monitoring", "Edit"), perm("Renewals", "View"),
      perm("UserManagement", "View"),
    ],
  },
  {
    id: "role-analytics",
    name: "Analytics / Finance",
    description: "Financial analytics, rate modeling, and cost impact analysis",
    permissions: [
      perm("ContractCreation", "View"), perm("Upload", "View"), perm("Deviation", "View"),
      perm("Redlining", "View"), perm("Workflow", "View"), perm("Intake", "View"),
      perm("Credentialing", "View"), perm("Rates", "Edit"), perm("Downstream", "View"),
      perm("Compliance", "View"), perm("Monitoring", "Edit"), perm("Renewals", "Edit"),
      perm("UserManagement", "View"),
    ],
  },
  {
    id: "role-compliance",
    name: "Compliance Officer",
    description: "Ensures regulatory compliance and audit readiness",
    permissions: [
      perm("ContractCreation", "View"), perm("Upload", "View"), perm("Deviation", "Approve"),
      perm("Redlining", "View"), perm("Workflow", "View"), perm("Intake", "View"),
      perm("Credentialing", "Approve"), perm("Rates", "View"), perm("Downstream", "View"),
      perm("Compliance", "Approve"), perm("Monitoring", "Approve"), perm("Renewals", "View"),
      perm("UserManagement", "View"),
    ],
  },
  {
    id: "role-auditor",
    name: "Auditor (Read-only)",
    description: "Read-only access across all modules for audit purposes",
    permissions: allModules.map(m => perm(m, "View")),
  },
  {
    id: "role-platform-admin",
    name: "Platform Admin",
    description: "Full administrative access to all platform modules",
    permissions: allAt("Admin"),
  },
];

export const seedUsers: AppUser[] = [
  { id: "user-001", name: "Sarah Johnson", email: "sarah.johnson@optum.com", roleId: "role-network-mgr", status: "Active", createdAt: "2024-06-15T09:00:00Z" },
  { id: "user-002", name: "Mark Thompson", email: "mark.thompson@optum.com", roleId: "role-legal-mgr", status: "Active", createdAt: "2024-06-15T09:00:00Z" },
  { id: "user-003", name: "Emily Chen", email: "emily.chen@optum.com", roleId: "role-loader", status: "Active", createdAt: "2024-07-01T09:00:00Z" },
  { id: "user-004", name: "David Martinez", email: "david.martinez@optum.com", roleId: "role-intake", status: "Active", createdAt: "2024-07-10T09:00:00Z" },
  { id: "user-005", name: "Lisa Patel", email: "lisa.patel@optum.com", roleId: "role-cred-analyst", status: "Active", createdAt: "2024-08-01T09:00:00Z" },
  { id: "user-006", name: "James Wilson", email: "james.wilson@optum.com", roleId: "role-provider-admin", status: "Active", createdAt: "2024-08-15T09:00:00Z" },
  { id: "user-007", name: "Karen Davis", email: "karen.davis@optum.com", roleId: "role-claims-ops", status: "Active", createdAt: "2024-09-01T09:00:00Z" },
  { id: "user-008", name: "Robert Kim", email: "robert.kim@optum.com", roleId: "role-um", status: "Active", createdAt: "2024-09-15T09:00:00Z" },
  { id: "user-009", name: "Jennifer Brown", email: "jennifer.brown@optum.com", roleId: "role-analytics", status: "Active", createdAt: "2024-10-01T09:00:00Z" },
  { id: "user-010", name: "Michael Rivera", email: "michael.rivera@optum.com", roleId: "role-compliance", status: "Active", createdAt: "2024-10-15T09:00:00Z" },
  { id: "user-011", name: "Amanda Foster", email: "amanda.foster@optum.com", roleId: "role-auditor", status: "Active", createdAt: "2024-11-01T09:00:00Z" },
  { id: "user-012", name: "ChandravadhanaTK", email: "chandravadhanatk@optum.com", roleId: "role-platform-admin", status: "Active", createdAt: "2024-06-01T09:00:00Z" },
  { id: "user-013", name: "Raj Srirangam", email: "raj.srirangam@optum.com", roleId: "role-platform-admin", status: "Active", createdAt: "2024-05-15T09:00:00Z" },
];
