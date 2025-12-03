import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdminAccount() {
  try {
    console.log("관리자 계정 생성을 시작합니다...");

    // 관리자 정보
    const adminEmail = process.env.ADMIN_EMAIL || "admin@ptbuddy.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "@123456";
    const adminName = process.env.ADMIN_NAME || "시스템 관리자";

    // 기존 관리자 계정 확인
    const existingAdmin = await prisma.trainer.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log("이미 해당 이메일로 등록된 계정이 있습니다.");
      console.log(`이메일: ${existingAdmin.email}`);
      console.log(`역할: ${existingAdmin.role}`);

      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // 기존 계정을 관리자로 업그레이드 및 비밀번호 업데이트
      if (existingAdmin.role !== "admin") {
        console.log("\n기존 계정을 관리자로 업그레이드하고 비밀번호를 업데이트합니다...");
        await prisma.trainer.update({
          where: { id: existingAdmin.id },
          data: {
            role: "admin",
            password: hashedPassword,
          },
        });
        console.log("✅ 계정이 관리자로 업그레이드되고 비밀번호가 업데이트되었습니다.");
      } else {
        console.log("\n관리자 계정의 비밀번호를 업데이트합니다...");
        await prisma.trainer.update({
          where: { id: existingAdmin.id },
          data: {
            password: hashedPassword,
          },
        });
        console.log("✅ 비밀번호가 업데이트되었습니다.");
      }
      console.log("=".repeat(50));
      console.log(`이메일: ${adminEmail}`);
      console.log(`새 비밀번호: ${adminPassword}`);
      console.log("=".repeat(50));
      return;
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // 관리자 계정 생성
    const admin = await prisma.trainer.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: "admin",
        maxMembers: 0, // 관리자는 회원 관리 안함
        isActive: true,
      },
    });

    console.log("\n✅ 관리자 계정이 성공적으로 생성되었습니다!");
    console.log("=".repeat(50));
    console.log(`이메일: ${admin.email}`);
    console.log(`비밀번호: ${adminPassword}`);
    console.log(`이름: ${admin.name}`);
    console.log(`역할: ${admin.role}`);
    console.log("=".repeat(50));
    console.log("\n⚠️  보안을 위해 비밀번호를 변경하는 것을 권장합니다.");
    console.log("로그인 후 설정 페이지에서 비밀번호를 변경하세요.\n");
  } catch (error) {
    console.error("❌ 관리자 계정 생성 중 오류가 발생했습니다:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
createAdminAccount()
  .then(() => {
    console.log("스크립트가 완료되었습니다.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("스크립트 실행 중 오류:", error);
    process.exit(1);
  });
