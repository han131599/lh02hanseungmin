import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupTestAccounts() {
  try {
    console.log('테스트 계정 정리를 시작합니다...\n')

    // 1. admin 계정 확인
    const adminAccounts = await prisma.trainer.findMany({
      where: { role: 'admin' },
      select: { id: true, email: true, name: true },
    })

    if (adminAccounts.length === 0) {
      console.log('⚠️  admin 계정이 없습니다. 정리를 중단합니다.')
      return
    }

    console.log('보존할 admin 계정:')
    adminAccounts.forEach((admin) => {
      console.log(`  - ${admin.email} (${admin.name})`)
    })
    console.log()

    // 2. 삭제할 트레이너 계정 조회 (admin 제외)
    const trainersToDelete = await prisma.trainer.findMany({
      where: { role: { not: 'admin' } },
      select: { id: true, email: true, name: true },
    })

    console.log(`삭제할 트레이너 계정: ${trainersToDelete.length}개`)
    trainersToDelete.forEach((trainer) => {
      console.log(`  - ${trainer.email} (${trainer.name})`)
    })
    console.log()

    // 3. 모든 회원 계정 조회
    const allMembers = await prisma.member.findMany({
      select: { id: true, email: true, name: true },
    })

    console.log(`삭제할 회원 계정: ${allMembers.length}개`)
    allMembers.forEach((member) => {
      console.log(`  - ${member.email} (${member.name})`)
    })
    console.log()

    // 4. 삭제 작업 시작
    console.log('삭제를 시작합니다...\n')

    // 회원 관련 데이터 삭제 (Cascade로 인해 관련 데이터도 함께 삭제됨)
    const deletedMembers = await prisma.member.deleteMany({})
    console.log(`✅ 회원 ${deletedMembers.count}개 삭제 완료`)

    // 트레이너 계정 삭제 (admin 제외)
    const deletedTrainers = await prisma.trainer.deleteMany({
      where: { role: { not: 'admin' } },
    })
    console.log(`✅ 트레이너 ${deletedTrainers.count}개 삭제 완료`)

    // 5. 최종 확인
    const remainingTrainers = await prisma.trainer.count()
    const remainingMembers = await prisma.member.count()

    console.log('\n' + '='.repeat(50))
    console.log('정리 완료!')
    console.log('='.repeat(50))
    console.log(`남은 트레이너 계정: ${remainingTrainers}개 (admin만 남음)`)
    console.log(`남은 회원 계정: ${remainingMembers}개`)
    console.log('='.repeat(50))
    console.log('\n✅ 이제 회원가입 테스트를 다시 진행할 수 있습니다.\n')
  } catch (error) {
    console.error('❌ 계정 정리 중 오류가 발생했습니다:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
cleanupTestAccounts()
  .then(() => {
    console.log('스크립트가 완료되었습니다.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error)
    process.exit(1)
  })
