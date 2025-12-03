import { z } from 'zod'

// 회원가입 스키마
export const signupSchema = z.object({
  role: z.enum(['trainer', 'member'], {
    message: '트레이너 또는 회원을 선택해주세요',
  }),
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
  password: z
    .string()
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다')
    .max(100, '비밀번호는 100자를 초과할 수 없습니다'),
  confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
  name: z
    .string()
    .min(2, '이름은 최소 2자 이상이어야 합니다')
    .max(50, '이름은 50자를 초과할 수 없습니다'),
  phone: z
    .string()
    .min(1, '전화번호를 입력해주세요')
    .regex(
      /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/,
      '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
    ),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})

// 로그인 스키마
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
  role: z.enum(['trainer', 'member', 'admin']),
})

// 타입 추론
export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
