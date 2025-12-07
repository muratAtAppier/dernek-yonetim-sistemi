/**
 * Tests for Board-Member Synchronization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  syncMemberTitleToBoard,
  syncBoardToMemberTitle,
  syncBoardMemberRemoval,
  validateBoardRoleAssignment,
  boardRoleToMemberTitle,
} from '../lib/boardSync'

describe('boardRoleToMemberTitle', () => {
  it('should map EXECUTIVE board PRESIDENT to BASKAN', () => {
    expect(boardRoleToMemberTitle('PRESIDENT', 'ASIL', 'EXECUTIVE')).toBe(
      'BASKAN'
    )
  })

  it('should map EXECUTIVE board VICE_PRESIDENT to BASKAN_YARDIMCISI', () => {
    expect(boardRoleToMemberTitle('VICE_PRESIDENT', 'ASIL', 'EXECUTIVE')).toBe(
      'BASKAN_YARDIMCISI'
    )
  })

  it('should map EXECUTIVE board SECRETARY to SEKRETER', () => {
    expect(boardRoleToMemberTitle('SECRETARY', 'ASIL', 'EXECUTIVE')).toBe(
      'SEKRETER'
    )
  })

  it('should map EXECUTIVE board TREASURER to SAYMAN', () => {
    expect(boardRoleToMemberTitle('TREASURER', 'ASIL', 'EXECUTIVE')).toBe(
      'SAYMAN'
    )
  })

  it('should map EXECUTIVE board MEMBER to YONETIM_KURULU_ASIL', () => {
    expect(boardRoleToMemberTitle('MEMBER', 'ASIL', 'EXECUTIVE')).toBe(
      'YONETIM_KURULU_ASIL'
    )
  })

  it('should map EXECUTIVE board YEDEK to YONETIM_KURULU_YEDEK', () => {
    expect(boardRoleToMemberTitle('MEMBER', 'YEDEK', 'EXECUTIVE')).toBe(
      'YONETIM_KURULU_YEDEK'
    )
  })

  it('should map AUDIT board SUPERVISOR to DENETIM_KURULU_BASKANI', () => {
    expect(boardRoleToMemberTitle('SUPERVISOR', 'ASIL', 'AUDIT')).toBe(
      'DENETIM_KURULU_BASKANI'
    )
  })

  it('should map AUDIT board MEMBER to DENETIM_KURULU_ASIL', () => {
    expect(boardRoleToMemberTitle('MEMBER', 'ASIL', 'AUDIT')).toBe(
      'DENETIM_KURULU_ASIL'
    )
  })

  it('should map AUDIT board YEDEK to DENETIM_KURULU_YEDEK', () => {
    expect(boardRoleToMemberTitle('MEMBER', 'YEDEK', 'AUDIT')).toBe(
      'DENETIM_KURULU_YEDEK'
    )
  })
})

describe('validateBoardRoleAssignment', () => {
  it('should allow MEMBER role multiple times', async () => {
    const mockPrisma = {
      boardMember: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      member: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    }

    const result = await validateBoardRoleAssignment(
      mockPrisma,
      'org-123',
      'MEMBER',
      'ASIL',
      'EXECUTIVE',
      'term-123'
    )

    expect(result.isValid).toBe(true)
    expect(mockPrisma.boardMember.findFirst).not.toHaveBeenCalled()
  })

  it('should detect conflict when role already assigned in BoardMember', async () => {
    const mockPrisma = {
      boardMember: {
        findFirst: vi.fn().mockResolvedValue({
          memberId: 'member-456',
          role: 'PRESIDENT',
          member: {
            id: 'member-456',
            firstName: 'Ali',
            lastName: 'Ulusal',
            title: 'BASKAN',
          },
        }),
      },
      member: {
        findFirst: vi.fn(),
      },
    }

    const result = await validateBoardRoleAssignment(
      mockPrisma,
      'org-123',
      'PRESIDENT',
      'ASIL',
      'EXECUTIVE',
      'term-123',
      'member-789'
    )

    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Bu rol zaten atanmış')
    expect(result.conflictingMember).toBeDefined()
    expect(result.conflictingMember?.firstName).toBe('Ali')
  })

  it('should detect conflict when title already assigned in Member', async () => {
    const mockPrisma = {
      boardMember: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      member: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'member-456',
          firstName: 'Veli',
          lastName: 'Yılmaz',
          title: 'BASKAN',
        }),
      },
    }

    const result = await validateBoardRoleAssignment(
      mockPrisma,
      'org-123',
      'PRESIDENT',
      'ASIL',
      'EXECUTIVE',
      'term-123',
      'member-789'
    )

    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Bu statü zaten atanmış')
    expect(result.conflictingMember).toBeDefined()
    expect(result.conflictingMember?.firstName).toBe('Veli')
  })

  it('should exclude specified member from conflict check', async () => {
    const mockPrisma = {
      boardMember: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      member: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    }

    const result = await validateBoardRoleAssignment(
      mockPrisma,
      'org-123',
      'PRESIDENT',
      'ASIL',
      'EXECUTIVE',
      'term-123',
      'member-789'
    )

    expect(result.isValid).toBe(true)
    expect(mockPrisma.boardMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          memberId: { not: 'member-789' },
        }),
      })
    )
  })
})

describe('syncMemberTitleToBoard', () => {
  it('should remove from all boards when title is null', async () => {
    const mockPrisma = {
      member: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'member-123',
          organizationId: 'org-123',
        }),
      },
      boardMember: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    }

    await syncMemberTitleToBoard(mockPrisma, 'member-123', 'org-123', null)

    expect(mockPrisma.boardMember.deleteMany).toHaveBeenCalledWith({
      where: { memberId: 'member-123' },
    })
  })

  it('should remove from all boards when title is UYE', async () => {
    const mockPrisma = {
      member: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'member-123',
          organizationId: 'org-123',
        }),
      },
      boardMember: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    }

    await syncMemberTitleToBoard(mockPrisma, 'member-123', 'org-123', 'UYE')

    expect(mockPrisma.boardMember.deleteMany).toHaveBeenCalledWith({
      where: { memberId: 'member-123' },
    })
  })

  it('should add to EXECUTIVE board when title is BASKAN', async () => {
    const mockPrisma = {
      member: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'member-123',
          organizationId: 'org-123',
        }),
      },
      board: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'board-exec',
          type: 'EXECUTIVE',
          terms: [
            {
              id: 'term-active',
              isActive: true,
            },
          ],
        }),
      },
      boardMember: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn().mockResolvedValue({}),
      },
    }

    await syncMemberTitleToBoard(mockPrisma, 'member-123', 'org-123', 'BASKAN')

    expect(mockPrisma.board.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId_type: {
            organizationId: 'org-123',
            type: 'EXECUTIVE',
          },
        },
      })
    )

    expect(mockPrisma.boardMember.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          role: 'PRESIDENT',
          memberType: 'ASIL',
        }),
      })
    )
  })
})

describe('syncBoardToMemberTitle', () => {
  it('should update member title when adding to active board', async () => {
    const mockPrisma = {
      boardTerm: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'term-123',
          isActive: true,
          board: {
            id: 'board-123',
            type: 'EXECUTIVE',
            organizationId: 'org-123',
          },
        }),
      },
      member: {
        update: vi.fn().mockResolvedValue({}),
      },
    }

    await syncBoardToMemberTitle(
      mockPrisma,
      'member-123',
      'term-123',
      'PRESIDENT',
      'ASIL',
      'org-123'
    )

    expect(mockPrisma.member.update).toHaveBeenCalledWith({
      where: { id: 'member-123' },
      data: { title: 'BASKAN' },
    })
  })

  it('should not update member title for inactive term', async () => {
    const mockPrisma = {
      boardTerm: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'term-123',
          isActive: false,
          board: {
            id: 'board-123',
            type: 'EXECUTIVE',
            organizationId: 'org-123',
          },
        }),
      },
      member: {
        update: vi.fn(),
      },
    }

    await syncBoardToMemberTitle(
      mockPrisma,
      'member-123',
      'term-123',
      'PRESIDENT',
      'ASIL',
      'org-123'
    )

    expect(mockPrisma.member.update).not.toHaveBeenCalled()
  })
})

describe('syncBoardMemberRemoval', () => {
  it('should set title to UYE when member has no other board memberships', async () => {
    const mockPrisma = {
      member: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'member-123',
          title: 'BASKAN',
          organizationId: 'org-123',
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      boardMember: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    }

    await syncBoardMemberRemoval(
      mockPrisma,
      'member-123',
      'term-123',
      'org-123'
    )

    expect(mockPrisma.member.update).toHaveBeenCalledWith({
      where: { id: 'member-123' },
      data: { title: 'UYE' },
    })
  })

  it('should update to other board role if member has other active memberships', async () => {
    const mockPrisma = {
      member: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'member-123',
          title: 'BASKAN',
          organizationId: 'org-123',
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      boardMember: {
        findMany: vi.fn().mockResolvedValue([
          {
            termId: 'term-other',
            role: 'SUPERVISOR',
            memberType: 'ASIL',
            term: {
              id: 'term-other',
              isActive: true,
              board: {
                id: 'board-audit',
                type: 'AUDIT',
              },
            },
          },
        ]),
      },
    }

    await syncBoardMemberRemoval(
      mockPrisma,
      'member-123',
      'term-123',
      'org-123'
    )

    expect(mockPrisma.member.update).toHaveBeenCalledWith({
      where: { id: 'member-123' },
      data: { title: 'DENETIM_KURULU_BASKANI' },
    })
  })

  it('should not change non-board titles', async () => {
    const mockPrisma = {
      member: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'member-123',
          title: 'UYE',
          organizationId: 'org-123',
        }),
        update: vi.fn(),
      },
      boardMember: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    }

    await syncBoardMemberRemoval(
      mockPrisma,
      'member-123',
      'term-123',
      'org-123'
    )

    expect(mockPrisma.member.update).not.toHaveBeenCalled()
  })
})
