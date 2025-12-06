// @ts-nocheck
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserRoleInfo } from '@/lib/authz'

export async function GET() {
  const session = await getSession()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roleInfo = await getUserRoleInfo(session.user.id)
  return NextResponse.json({
    isSuper: roleInfo.isSuperAdmin,
    firstOrg: roleInfo.firstOrg,
  })
}
