import prisma from './src/lib/prisma'

async function checkUsers() {
  try {
    console.log('🔍 데이터베이스 연결 확인 중...')

    const trainers = await prisma.trainer.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        deletedAt: true
      }
    })

    console.log('\n👨‍💼 트레이너 목록:', trainers.length + '명')
    trainers.forEach(t => {
      const isDeleted = t.deletedAt !== null
      console.log(' -', t.email, '|', t.name, '|', t.role, '| active:', t.isActive, '| deleted:', isDeleted)
    })

    const members = await prisma.member.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        deletedAt: true,
        password: true
      }
    })

    console.log('\n👤 회원 목록:', members.length + '명')
    members.forEach(m => {
      const isDeleted = m.deletedAt !== null
      const hasPassword = m.password !== null
      console.log(' -', m.email, '|', m.name, '| active:', m.isActive, '| deleted:', isDeleted, '| has password:', hasPassword)
    })

    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ 에러:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

checkUsers()
