// @ts-nocheck
import { prisma } from './prisma'

export type OrgRole = 'SUPERADMIN' | 'ADMIN'

export const ALL_ROLES: OrgRole[] = ['SUPERADMIN', 'ADMIN']
export const WRITE_ROLES: OrgRole[] = ['SUPERADMIN', 'ADMIN']
export const ADMIN_ROLES: OrgRole[] = ['SUPERADMIN', 'ADMIN']

export async function isSuperAdmin(userId: string): Promise<boolean> {
  if (!userId) return false
  const superMembership = await prisma.organizationMembership.findFirst({
    where: { userId, role: 'SUPERADMIN' },
    select: { id: true },
  })
  return Boolean(superMembership)
}

export async function getUserOrgRole(
  userId: string,
  orgSlug: string
): Promise<OrgRole | null> {
  // SUPERADMINs implicitly have access to all orgs
  const superMembership = await prisma.organizationMembership.findFirst({
    where: { userId, role: 'SUPERADMIN' },
  })
  if (superMembership) return 'SUPERADMIN'
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  if (!org) return null
  const membership = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId, organizationId: org.id } },
    select: { role: true },
  })
  return (membership?.role as OrgRole) ?? null
}

export function hasAnyRole(role: OrgRole | null, allowed: OrgRole[]): boolean {
  if (!role) return false
  return allowed.includes(role)
}

export async function ensureOrgAccessBySlug(
  userId: string,
  orgSlug: string,
  allowed: OrgRole[] = ALL_ROLES
) {
  // SUPERADMIN can access all orgs regardless of membership
  const isSuper = await prisma.organizationMembership.findFirst({
    where: { userId, role: 'SUPERADMIN' },
  })
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, slug: true, name: true },
  })
  if (!org)
    return {
      org: null as any,
      role: null as OrgRole | null,
      allowed: false,
      notFound: true,
    }
  if (isSuper)
    return {
      org,
      role: 'SUPERADMIN' as OrgRole,
      allowed: hasAnyRole('SUPERADMIN', allowed),
      notFound: false,
    }
  const membership = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId, organizationId: org.id } },
    select: { role: true },
  })
  const role = (membership?.role as OrgRole) ?? null
  return { org, role, allowed: hasAnyRole(role, allowed), notFound: false }
}
