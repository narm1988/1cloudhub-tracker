/**
 * Demo/mock data for local UI preview without Supabase.
 * Active when VITE_SUPABASE_URL is not set.
 */
import type { User, Project, Epic } from '../types'

export const DEMO_USER: User = {
  id: 'demo-user-001',
  email: 'demo@1cloudhub.com',
  full_name: 'Demo User',
  avatar_url: undefined,
  role: 'admin',
}

export const DEMO_PEOPLE: User[] = [
  DEMO_USER,
  {
    id: 'demo-user-002',
    email: 'priya@1cloudhub.com',
    full_name: 'Priya Sharma',
    role: 'member',
  },
  {
    id: 'demo-user-003',
    email: 'arjun@1cloudhub.com',
    full_name: 'Arjun Nair',
    role: 'member',
  },
  {
    id: 'demo-user-004',
    email: 'meera@1cloudhub.com',
    full_name: 'Meera Patel',
    role: 'admin',
  },
]

export const DEMO_PROJECTS: Project[] = [
  {
    id: 'proj-001',
    name: 'Cloud Migration',
    key: 'CM',
    description: 'Migrate legacy services to AWS cloud infrastructure with zero downtime.',
    created_by: 'demo-user-001',
    created_at: '2025-11-15T10:00:00Z',
  },
  {
    id: 'proj-002',
    name: 'Customer Portal',
    key: 'CP',
    description: 'Self-service portal for enterprise customers to manage subscriptions and support tickets.',
    created_by: 'demo-user-004',
    created_at: '2025-12-01T09:00:00Z',
  },
  {
    id: 'proj-003',
    name: 'Internal Tools',
    key: 'IT',
    description: 'Internal productivity and automation tools for the engineering team.',
    created_by: 'demo-user-002',
    created_at: '2026-01-10T14:30:00Z',
  },
]

export const DEMO_EPICS: Epic[] = [
  {
    id: 'epic-001',
    project_id: 'proj-001',
    title: 'VPC and Networking Setup',
    description: 'Design and provision VPC, subnets, security groups, and peering connections for production workloads.',
    owner_id: 'demo-user-001',
    owner: DEMO_USER,
    status: 'In Progress',
    created_at: '2025-11-20T08:00:00Z',
  },
  {
    id: 'epic-002',
    project_id: 'proj-001',
    title: 'Database Migration',
    description: 'Migrate PostgreSQL and Redis databases with DMS and validate data integrity.',
    owner_id: 'demo-user-003',
    owner: DEMO_PEOPLE[2],
    status: 'Created',
    created_at: '2025-12-05T11:00:00Z',
  },
  {
    id: 'epic-003',
    project_id: 'proj-002',
    title: 'Auth & SSO Integration',
    description: 'Implement SSO with SAML/OIDC providers and role-based access control for the portal.',
    owner_id: 'demo-user-004',
    owner: DEMO_PEOPLE[3],
    status: 'In Review',
    created_at: '2026-01-02T10:00:00Z',
  },
  {
    id: 'epic-004',
    project_id: 'proj-002',
    title: 'Billing Dashboard',
    description: 'Real-time billing dashboard with usage analytics, invoice history, and payment methods.',
    owner_id: 'demo-user-002',
    owner: DEMO_PEOPLE[1],
    status: 'Draft',
    created_at: '2026-01-15T13:00:00Z',
  },
  {
    id: 'epic-005',
    project_id: 'proj-003',
    title: 'CI/CD Pipeline Improvements',
    description: 'Reduce build times by 50% and add canary deployment support.',
    owner_id: 'demo-user-001',
    owner: DEMO_USER,
    status: 'Done',
    created_at: '2026-02-01T09:30:00Z',
  },
]
