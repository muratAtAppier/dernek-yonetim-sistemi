import { describe, it, expect, vi } from 'vitest'

vi.mock('../lib/prisma', () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(async ({ where }: any) =>
        where.slug === 'ok' ? { id: 'org1', slug: 'ok', name: 'OK' } : null
      ),
    },
    organizationMembership: {
      findFirst: vi.fn(async ({ where }: any) =>
        where.userId && where.role === 'SUPERADMIN' && where.userId === 'u1'
          ? { id: 'super' }
          : null
      ),
      findUnique: vi.fn(async ({ where }: any) =>
        where.userId_organizationId?.userId === 'u1' ? { role: 'ADMIN' } : null
      ),
    },
  },
}))

import { ensureOrgAccessBySlug, hasAnyRole } from '../lib/authz'

describe('authz helpers', () => {
  it('returns notFound for missing org and denies access', async () => {
    const miss = await ensureOrgAccessBySlug('u1', 'missing')
    expect(miss.notFound).toBe(true)
    expect(miss.allowed).toBe(false)
  })

  it('allows access when membership role matches', async () => {
    const ok = await ensureOrgAccessBySlug('u1', 'ok')
    expect(ok.notFound).toBe(false)
    expect(ok.allowed).toBe(true)
  })

  it('hasAnyRole utility works', () => {
    expect(hasAnyRole('ADMIN', ['ADMIN'])).toBe(true)
    expect(hasAnyRole('ADMIN', ['SUPERADMIN'])).toBe(false)
    expect(hasAnyRole('SUPERADMIN', ['ADMIN'])).toBe(false)
  })
})
