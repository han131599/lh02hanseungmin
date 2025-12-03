// This file is kept for backward compatibility with existing components
// In the future, these types should be replaced with Prisma types

export type Database = {
  public: {
    Tables: {
      memberships: {
        Row: {
          id: string
          memberId: string
          type: 'session' | 'period'
          totalSessions: number | null
          remainingSessions: number | null
          startDate: string
          endDate: string | null
          price: string
          isActive: boolean
          notes: string | null
          createdAt: string
          updatedAt: string
        }
      }
      appointments: {
        Row: {
          id: string
          trainerId: string
          memberId: string
          membershipId: string | null
          scheduledAt: string
          duration: number
          status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          notes: string | null
          reminderSent: boolean
          createdAt: string
          updatedAt: string
        }
      }
      members: {
        Row: {
          id: string
          trainerId: string
          name: string
          phone: string
          email: string | null
          birthDate: string | null
          gender: 'male' | 'female' | 'other' | null
          goal: string | null
          notes: string | null
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
      }
    }
  }
}
