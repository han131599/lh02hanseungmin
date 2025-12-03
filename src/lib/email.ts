/**
 * 이메일 발송 유틸리티
 *
 * AWS SES를 사용하여 이메일을 발송합니다.
 * 개발 환경에서는 콘솔에도 인증 코드를 출력합니다.
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

// AWS SES 클라이언트 설정
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

/**
 * 6자리 랜덤 인증 코드 생성
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * 이메일 인증 코드 발송
 * @param email 이메일 주소
 * @param code 6자리 인증 코드
 * @param userName 사용자 이름
 * @returns 발송 성공 여부
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  userName?: string
): Promise<boolean> {
  try {
    // 개발 환경: 콘솔에도 출력
    if (process.env.NODE_ENV === 'development') {
      console.log('='.repeat(60))
      console.log(`📧 이메일 인증 코드 발송`)
      console.log(`수신자: ${userName || '사용자'} <${email}>`)
      console.log(`인증 코드: ${code}`)
      console.log(`유효 시간: 10분`)
      console.log('='.repeat(60))
    }

    // AWS SES 설정 확인
    const fromEmail = process.env.AWS_SES_FROM_EMAIL
    if (!fromEmail) {
      console.error('AWS_SES_FROM_EMAIL 환경변수가 설정되지 않았습니다.')
      if (process.env.NODE_ENV === 'development') {
        console.log('개발 모드: 콘솔 출력으로 대체')
        return true
      }
      return false
    }

    // HTML 이메일 템플릿
    const htmlBody = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                <!-- 헤더 -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">PT Buddy</h1>
                    <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px;">비밀번호 재설정</p>
                  </td>
                </tr>
                <!-- 본문 -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      안녕하세요, <strong>${userName || '회원'}</strong>님
                    </p>
                    <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                      비밀번호 재설정을 위한 인증 코드입니다. 아래 코드를 입력해 주세요.
                    </p>
                    <!-- 인증 코드 박스 -->
                    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 8px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
                      <div style="font-size: 36px; font-weight: bold; color: #1e40af; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        ${code}
                      </div>
                    </div>
                    <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0;">
                      ⏰ 이 코드는 <strong>10분간</strong> 유효합니다.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
                      본인이 요청하지 않았다면 이 이메일을 무시하셔도 됩니다.
                    </p>
                  </td>
                </tr>
                <!-- 푸터 -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      © 2024 PT Buddy. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    // 텍스트 전용 버전
    const textBody = `
PT Buddy - 비밀번호 재설정

안녕하세요, ${userName || '회원'}님

비밀번호 재설정을 위한 인증 코드입니다:

인증 코드: ${code}

이 코드는 10분간 유효합니다.
본인이 요청하지 않았다면 이 이메일을 무시하셔도 됩니다.

© 2024 PT Buddy. All rights reserved.
    `

    // AWS SES로 이메일 발송
    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: '[PT Buddy] 비밀번호 재설정 인증 코드',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    })

    await sesClient.send(command)
    console.log(`이메일 발송 성공: ${email}`)
    return true
  } catch (error) {
    console.error('이메일 발송 오류:', error)
    // 개발 환경에서는 실패해도 계속 진행 (콘솔 출력으로 대체)
    if (process.env.NODE_ENV === 'development') {
      console.log('개발 모드: 이메일 발송 실패했지만 계속 진행')
      return true
    }
    return false
  }
}

/**
 * 이메일 형식 검증
 * @param email 이메일 주소
 * @returns 유효 여부
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
