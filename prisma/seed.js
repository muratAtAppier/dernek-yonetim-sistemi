// Seed script: creates an admin user and a sample organization and member
// Run: npm run db:up (ensure DB up) then npm run prisma:migrate then npm run db:seed

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@example.com'
  const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'superadmin123'
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

  // Ensure SUPERADMIN user
  const superHash = await bcrypt.hash(SUPERADMIN_PASSWORD, 10)
  let superUser = await prisma.user.findUnique({ where: { email: SUPERADMIN_EMAIL } })
  if (!superUser) {
    superUser = await prisma.user.create({
      data: { email: SUPERADMIN_EMAIL, name: 'Super Admin', passwordHash: superHash },
    })
    console.log('Created SUPERADMIN user', superUser.email)
  } else if (!superUser.passwordHash) {
    await prisma.user.update({ where: { id: superUser.id }, data: { passwordHash: superHash } })
  }

  // Ensure a demo ADMIN user (optional)
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  let adminUser = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
  if (!adminUser) {
    adminUser = await prisma.user.create({ data: { email: ADMIN_EMAIL, name: 'Admin', passwordHash: adminHash } })
    console.log('Created ADMIN user', adminUser.email)
  }

  let org = await prisma.organization.findUnique({ where: { slug: 'ornek-dernek' } })
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Örnek Dernek',
        slug: 'ornek-dernek',
        description: 'Seed ile oluşturuldu',
      },
    })
    console.log('Created organization', org.slug)
  } else {
    console.log('Organization exists', org.slug)
  }

  // Make superUser SUPERADMIN on the sample org
  const superMembership = await prisma.organizationMembership.upsert({
    where: { userId_organizationId: { userId: superUser.id, organizationId: org.id } },
    update: { role: 'SUPERADMIN' },
    create: { userId: superUser.id, organizationId: org.id, role: 'SUPERADMIN' },
  })
  console.log('Ensured SUPERADMIN membership', superMembership.role)

  // Make adminUser ADMIN on the sample org
  const adminMembership = await prisma.organizationMembership.upsert({
    where: { userId_organizationId: { userId: adminUser.id, organizationId: org.id } },
    update: { role: 'ADMIN' },
    create: { userId: adminUser.id, organizationId: org.id, role: 'ADMIN' },
  })
  console.log('Ensured ADMIN membership', adminMembership.role)

  const memberCount = await prisma.member.count({ where: { organizationId: org.id } })
  if (memberCount === 0) {
    await prisma.member.createMany({
      data: [
        { organizationId: org.id, firstName: 'Ahmet', lastName: 'Yılmaz', email: 'ahmet@example.com', phone: '5551112233' },
        { organizationId: org.id, firstName: 'Ayşe', lastName: 'Demir', email: 'ayse@example.com', phone: '5554445566' },
      ],
    })
    console.log('Inserted sample members')
  } else {
    console.log('Members already exist:', memberCount)
  }

  // Seed: Boards (Yönetim ve Denetim Kurulu) + active term + sample members
  const existingExecutive = await prisma.board.findFirst({ where: { organizationId: org.id, type: 'EXECUTIVE' } })
  let execBoard = existingExecutive
  if (!execBoard) {
    execBoard = await prisma.board.create({ data: { organizationId: org.id, type: 'EXECUTIVE', name: 'Yönetim Kurulu', description: 'Seed ile eklendi' } })
    console.log('Created Executive Board')
  }
  const existingAudit = await prisma.board.findFirst({ where: { organizationId: org.id, type: 'AUDIT' } })
  let auditBoard = existingAudit
  if (!auditBoard) {
    auditBoard = await prisma.board.create({ data: { organizationId: org.id, type: 'AUDIT', name: 'Denetim Kurulu', description: 'Seed ile eklendi' } })
    console.log('Created Audit Board')
  }

  async function ensureActiveTerm(board) {
    const active = await prisma.boardTerm.findFirst({ where: { boardId: board.id, isActive: true } })
    if (active) return active
    const term = await prisma.boardTerm.create({ data: { boardId: board.id, name: `${new Date().getFullYear()} Dönemi`, isActive: true } })
    console.log('Created active term for', board.type)
    return term
  }
  const [execTerm, auditTerm] = await Promise.all([ensureActiveTerm(execBoard), ensureActiveTerm(auditBoard)])

  const members = await prisma.member.findMany({ where: { organizationId: org.id }, take: 2 })
  if (members.length > 0) {
    await prisma.boardMember.upsert({
      where: { memberId_termId: { memberId: members[0].id, termId: execTerm.id } },
      update: { role: 'PRESIDENT', order: 1 },
      create: { memberId: members[0].id, termId: execTerm.id, role: 'PRESIDENT', order: 1 },
    })
    if (members[1]) {
      await prisma.boardMember.upsert({
        where: { memberId_termId: { memberId: members[1].id, termId: execTerm.id } },
        update: { role: 'MEMBER', order: 2 },
        create: { memberId: members[1].id, termId: execTerm.id, role: 'MEMBER', order: 2 },
      })
    }
  }

  // Seed a sample template
  const existingTpl = await prisma.template.findFirst({ where: { organizationId: org.id, slug: 'hazirun-ornegi' } })
  if (!existingTpl) {
    await prisma.template.create({
      data: {
        organizationId: org.id,
        name: 'Hazirun Örneği',
        slug: 'hazirun-ornegi',
        description: 'Örnek PDF şablonu',
        content: `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; }
  h1 { font-size: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #444; padding: 6px; }
  th { background: #f0f0f0; }
</style>
</head><body>
  <h1>{{title}}</h1>
  <table>
    <thead><tr><th>#</th><th>Ad Soyad</th><th>İmza</th></tr></thead>
    <tbody>
      {{#rows}}
      <tr><td>{{no}}</td><td>{{adsoyad}}</td><td></td></tr>
      {{/rows}}
    </tbody>
  </table>
</body></html>`
      }
    })
    console.log('Inserted sample template')
  } else {
    console.log('Sample template exists')
  }

  // Seed: Genel Kurul Daveti şablonu
  const genelKurulDaveti = await prisma.template.findFirst({ where: { organizationId: org.id, slug: 'genel-kurul-daveti' } })
  if (!genelKurulDaveti) {
    await prisma.template.create({
      data: {
        organizationId: org.id,
        name: 'Genel Kurul Daveti',
        slug: 'genel-kurul-daveti',
        description: 'Genel kurul davet mektubu şablonu',
        content: `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  body { font-family: Arial, sans-serif; line-height: 1.5; }
  h1 { font-size: 18px; }
  .muted{ color:#666 }
</style>
</head><body>
  <h1>{{org.name}} - Genel Kurul Daveti</h1>
  <p>Sayın Üyemiz,</p>
  <p>{{date}} tarihinde saat {{saat}}'de {{mekan}} adresinde yapılacak olan Genel Kurul toplantımıza katılımınızı rica ederiz.</p>
  <p>Gündem:</p>
  <ol>
    {{#gundem}}
    <li>{{.}}</li>
    {{/gundem}}
  </ol>
  <p class="muted">Bu yazı otomatik olarak oluşturulmuştur.</p>
</body></html>`
      }
    })
    console.log('Inserted Genel Kurul Daveti template')
  }

  // Seed: Yönetim/Denetim Kurulu Listesi şablonu (örnek tablo)
  const kurulListesi = await prisma.template.findFirst({ where: { organizationId: org.id, slug: 'kurul-listesi' } })
  if (!kurulListesi) {
    await prisma.template.create({
      data: {
        organizationId: org.id,
        name: 'Kurul Listesi',
        slug: 'kurul-listesi',
        description: 'Yönetim/Denetim kurulu listesi şablonu',
        content: `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  body { font-family: Arial, sans-serif; }
  h1 { font-size: 18px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #444; padding: 6px; }
  th { background: #f0f0f0; }
</style>
</head><body>
  <h1>{{org.name}} - {{baslik}}</h1>
  <table>
    <thead><tr><th>#</th><th>Ad Soyad</th><th>Görev</th><th>Dönem</th></tr></thead>
    <tbody>
      {{#uyeler}}
      <tr><td>{{no}}</td><td>{{adsoyad}}</td><td>{{gorev}}</td><td>{{donem}}</td></tr>
      {{/uyeler}}
    </tbody>
  </table>
</body></html>`
      }
    })
    console.log('Inserted Kurul Listesi template')
  }

  // Seed: Üyelik Belgesi şablonu (örnek)
  const uyelikBelgesi = await prisma.template.findFirst({ where: { organizationId: org.id, slug: 'uyelik-belgesi' } })
  if (!uyelikBelgesi) {
    await prisma.template.create({
      data: {
        organizationId: org.id,
        name: 'Üyelik Belgesi',
        slug: 'uyelik-belgesi',
        description: 'Üye adına düzenlenen basit sertifika şablonu',
        content: `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  body { font-family: Georgia, serif; text-align: center; padding: 40px; }
  h1 { font-size: 24px; margin-bottom: 10px; }
  .card { border: 2px solid #444; padding: 30px; }
  .muted{ color:#666 }
</style>
</head><body>
  <div class="card">
    <h1>Üyelik Belgesi</h1>
    <p>Bu belge, <strong>{{uye.adsoyad}}</strong> adlı kişinin {{org.name}}'a üye olduğunu belirtir.</p>
    <p class="muted">Tarih: {{date}}</p>
  </div>
</body></html>`
      }
    })
    console.log('Inserted Üyelik Belgesi template')
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
