/**
 * Board validation rules and utilities
 *
 * Rules:
 * 1. Yönetim Kurulu (EXECUTIVE) must have at least 5 "asil" and 5 "yedek" members
 * 2. Denetim Kurulu (AUDIT) must have at least 3 "asil" and 3 "yedek" members
 * 3. Yönetim Kurulu must have specific roles in "asil" list
 * 4. Roles must be unique within a board term
 */

export type BoardMemberInput = {
  memberId: string
  role:
    | 'PRESIDENT'
    | 'VICE_PRESIDENT'
    | 'SECRETARY'
    | 'TREASURER'
    | 'MEMBER'
    | 'SUPERVISOR'
  memberType: 'ASIL' | 'YEDEK'
  order?: number
}

export type BoardValidationError = {
  code: string
  message: string
}

/**
 * Required roles for Yönetim Kurulu (EXECUTIVE) "asil" members
 */
export const EXECUTIVE_REQUIRED_ROLES: Array<
  'PRESIDENT' | 'VICE_PRESIDENT' | 'SECRETARY' | 'TREASURER'
> = [
  'PRESIDENT', // Yönetim Kurulu Başkanı
  'VICE_PRESIDENT', // Yönetim Kurulu Başkan Yardımcısı
  'SECRETARY', // Sekreter
  'TREASURER', // Sayman
]

/**
 * Validate board members for a specific board type
 */
export function validateBoardMembers(
  boardType: 'EXECUTIVE' | 'AUDIT',
  members: BoardMemberInput[]
): BoardValidationError[] {
  const errors: BoardValidationError[] = []

  const asilMembers = members.filter((m) => m.memberType === 'ASIL')
  const yedekMembers = members.filter((m) => m.memberType === 'YEDEK')

  // Rule 1 & 2: Minimum member counts
  const minAsil = boardType === 'EXECUTIVE' ? 5 : 3
  const minYedek = boardType === 'EXECUTIVE' ? 5 : 3

  if (asilMembers.length < minAsil) {
    errors.push({
      code: 'MIN_ASIL_MEMBERS',
      message: `${boardType === 'EXECUTIVE' ? 'Yönetim Kurulu' : 'Denetim Kurulu'} en az ${minAsil} asil üye içermelidir`,
    })
  }

  if (yedekMembers.length < minYedek) {
    errors.push({
      code: 'MIN_YEDEK_MEMBERS',
      message: `${boardType === 'EXECUTIVE' ? 'Yönetim Kurulu' : 'Denetim Kurulu'} en az ${minYedek} yedek üye içermelidir`,
    })
  }

  // Rule 3: Yönetim Kurulu must have required roles in asil members
  if (boardType === 'EXECUTIVE') {
    const asilRoles = asilMembers.map((m) => m.role)

    for (const requiredRole of EXECUTIVE_REQUIRED_ROLES) {
      if (!asilRoles.includes(requiredRole)) {
        const roleNames: Record<string, string> = {
          PRESIDENT: 'Yönetim Kurulu Başkanı',
          VICE_PRESIDENT: 'Yönetim Kurulu Başkan Yardımcısı',
          SECRETARY: 'Sekreter',
          TREASURER: 'Sayman',
        }
        errors.push({
          code: 'MISSING_REQUIRED_ROLE',
          message: `Yönetim Kurulu asil üyeleri arasında ${roleNames[requiredRole]} olmalıdır`,
        })
      }
    }
  }

  // Rule 4: Check for duplicate roles within the same memberType (asil or yedek)
  const checkDuplicateRoles = (
    membersList: BoardMemberInput[],
    type: string
  ) => {
    const roleCounts = new Map<string, number>()

    for (const member of membersList) {
      // MEMBER role can have multiple instances
      if (member.role === 'MEMBER') continue

      const count = roleCounts.get(member.role) || 0
      roleCounts.set(member.role, count + 1)

      if (count > 0) {
        const roleNames: Record<string, string> = {
          PRESIDENT: 'Yönetim Kurulu Başkanı',
          VICE_PRESIDENT: 'Yönetim Kurulu Başkan Yardımcısı',
          SECRETARY: 'Sekreter',
          TREASURER: 'Sayman',
          SUPERVISOR: 'Denetim Kurulu Başkanı',
        }
        errors.push({
          code: 'DUPLICATE_ROLE',
          message: `${type} üyeler arasında birden fazla ${roleNames[member.role] || member.role} olamaz`,
        })
      }
    }
  }

  checkDuplicateRoles(asilMembers, 'Asil')
  checkDuplicateRoles(yedekMembers, 'Yedek')

  // Check for duplicate member IDs
  const memberIds = new Set<string>()
  for (const member of members) {
    if (memberIds.has(member.memberId)) {
      errors.push({
        code: 'DUPLICATE_MEMBER',
        message: 'Aynı üye birden fazla kez eklenemez',
      })
      break
    }
    memberIds.add(member.memberId)
  }

  return errors
}

/**
 * Map MemberTitle to BoardMemberRole
 */
export function memberTitleToBoardRole(
  title: string | null
):
  | 'PRESIDENT'
  | 'VICE_PRESIDENT'
  | 'SECRETARY'
  | 'TREASURER'
  | 'MEMBER'
  | 'SUPERVISOR' {
  switch (title) {
    case 'BASKAN':
      return 'PRESIDENT'
    case 'BASKAN_YARDIMCISI':
      return 'VICE_PRESIDENT'
    case 'SEKRETER':
      return 'SECRETARY'
    case 'SAYMAN':
      return 'TREASURER'
    case 'DENETIM_KURULU_BASKANI':
      return 'SUPERVISOR'
    default:
      return 'MEMBER'
  }
}

/**
 * Map MemberTitle to BoardMemberType
 */
export function memberTitleToMemberType(
  title: string | null
): 'ASIL' | 'YEDEK' {
  switch (title) {
    case 'YONETIM_KURULU_YEDEK':
    case 'DENETIM_KURULU_YEDEK':
      return 'YEDEK'
    default:
      return 'ASIL'
  }
}

/**
 * Get the board type for a member title
 */
export function getBoardTypeForTitle(
  title: string | null
): 'EXECUTIVE' | 'AUDIT' | null {
  switch (title) {
    case 'BASKAN':
    case 'BASKAN_YARDIMCISI':
    case 'SEKRETER':
    case 'SAYMAN':
    case 'YONETIM_KURULU_ASIL':
    case 'YONETIM_KURULU_YEDEK':
      return 'EXECUTIVE'
    case 'DENETIM_KURULU_BASKANI':
    case 'DENETIM_KURULU_ASIL':
    case 'DENETIM_KURULU_YEDEK':
      return 'AUDIT'
    default:
      return null
  }
}

/**
 * Check if a role is already assigned in an organization's board
 */
export async function checkRoleUniqueness(
  prisma: any,
  organizationId: string,
  memberTitle: string | null,
  excludeMemberId?: string
): Promise<{ isUnique: boolean; conflictingMember?: any }> {
  if (
    !memberTitle ||
    memberTitle === 'UYE' ||
    memberTitle === 'YONETIM_KURULU_ASIL' ||
    memberTitle === 'DENETIM_KURULU_ASIL' ||
    memberTitle === 'YONETIM_KURULU_YEDEK' ||
    memberTitle === 'DENETIM_KURULU_YEDEK'
  ) {
    // These titles can have multiple members
    return { isUnique: true }
  }

  // Check if another member already has this title
  const existingMember = await prisma.member.findFirst({
    where: {
      organizationId,
      title: memberTitle,
      ...(excludeMemberId ? { id: { not: excludeMemberId } } : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      title: true,
    },
  })

  if (existingMember) {
    return { isUnique: false, conflictingMember: existingMember }
  }

  return { isUnique: true }
}
