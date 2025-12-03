import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🚀 테스트 회원 데이터 추가 시작...')

    // 1. 트레이너 조회 (이미 회원가입한 트레이너 사용)
    const trainer = await prisma.trainer.findFirst({
      orderBy: { createdAt: 'asc' },
    })

    if (!trainer) {
      console.log('⚠️  등록된 트레이너가 없습니다. 먼저 트레이너 계정을 만들어주세요.')
      return
    }

    console.log(`✓ 트레이너 찾음: ${trainer.name} (${trainer.email})`)

    // 2. 테스트 회원 생성
    const hashedPassword = await bcrypt.hash('member123', 10)

    const member = await prisma.member.create({
      data: {
        trainerId: trainer.id,
        email: 'member@test.com',
        password: hashedPassword,
        name: '김회원',
        phone: '010-1234-5678',
        birthDate: new Date('1990-01-01'),
        gender: 'male',
        isActive: true,
        notes: '테스트용 회원 계정입니다.',
      },
    })

    console.log(`✓ 회원 생성 완료: ${member.name} (${member.email})`)

    // 3. 수강권 생성
    const membership = await prisma.membership.create({
      data: {
        memberId: member.id,
        name: '1개월 20회권',
        type: 'session',
        price: 500000,
        totalSessions: 20,
        remainingSessions: 20,
        isActive: true,
      },
    })

    console.log(`✓ 수강권 생성 완료: ${membership.name}`)

    // 4. PT 일정 생성
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0)

    const appointment = await prisma.appointment.create({
      data: {
        trainerId: trainer.id,
        memberId: member.id,
        scheduledAt: tomorrow,
        duration: 60,
        status: 'scheduled',
        notes: '테스트 PT 일정',
      },
    })

    console.log(`✓ PT 일정 생성 완료: ${appointment.scheduledAt.toLocaleString('ko-KR')}`)

    console.log('\n✅ 테스트 데이터 추가 완료!')
    console.log('\n📝 로그인 정보:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔹 회원 로그인')
    console.log('   이메일: member@test.com')
    console.log('   비밀번호: member123')
    console.log('   로그인 유형: 일반 회원')
    console.log('\n🔹 트레이너 로그인')
    console.log(`   이메일: ${trainer.email}`)
    console.log('   비밀번호: (회원가입 시 설정한 비밀번호)')
    console.log('   로그인 유형: 트레이너')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  } catch (error) {
    console.error('❌ 에러 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
