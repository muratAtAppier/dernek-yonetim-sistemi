import { describe, it, expect, vi } from 'vitest'

vi.mock('../lib/auth', () => ({
  getSession: vi.fn(async () => ({ user: { id: 'user1' } })),
}))

vi.mock('../lib/authz', () => ({
  ensureOrgAccessBySlug: vi.fn(async () => ({
    org: { id: 'org1', name: 'Org', slug: 'org' },
    allowed: true,
    notFound: false,
  })),
}))

vi.mock('../lib/prisma', () => ({
  prisma: {
    template: {
      findFirst: vi.fn(async () => ({
        slug: 'hazirun-ornegi',
        content: '<h1>{{title}}</h1>',
      })),
    },
    member: {
      findMany: vi.fn(async () => [
        {
          id: 'm1',
          firstName: 'A',
          lastName: 'B',
          nationalId: null,
          phone: null,
          email: null,
        },
      ]),
    },
  },
}))

vi.mock('playwright', () => ({
  chromium: {
    launch: async () => ({
      newPage: async () => ({
        setContent: async () => {},
        pdf: async () => new Uint8Array([1, 2, 3]),
      }),
      close: async () => {},
    }),
  },
}))

import { POST as renderPost } from '../app/api/[org]/members/render/route'

describe('api/[org]/members/render', () => {
  it('returns application/pdf for PDF format', async () => {
    const reqPdf = new Request('http://test.local/api/org/members/render', {
      method: 'POST',
      body: JSON.stringify({
        templateSlug: 'hazirun-ornegi',
        title: 'Test',
        ids: ['m1'],
        format: 'pdf',
      }),
    })
    const resPdf = await renderPost(reqPdf, {
      params: Promise.resolve({ org: 'org' }),
    })
    expect(resPdf.status).toBe(200)
    expect(resPdf.headers.get('Content-Type')).toBe('application/pdf')
  })

  it('returns DOCX for docx format', async () => {
    const reqDocx = new Request('http://test.local/api/org/members/render', {
      method: 'POST',
      body: JSON.stringify({
        templateSlug: 'hazirun-ornegi',
        title: 'Test',
        ids: ['m1'],
        format: 'docx',
      }),
    })
    const resDocx = await renderPost(reqDocx, {
      params: Promise.resolve({ org: 'org' }),
    })
    expect(resDocx.status).toBe(200)
    expect(resDocx.headers.get('Content-Type')).toContain(
      'officedocument.wordprocessingml.document'
    )
  })
})
