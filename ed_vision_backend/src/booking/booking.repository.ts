import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSlotById(slotId: number) {
    return this.prisma.instructorWeeklySlot.findUnique({
      where: { slot_id: slotId },
      include: {
        week: {
          include: {
            instructor: {
              include: {
                account: {
                  include: { profile: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async countActiveAppointmentsForSlot(slotId: number) {
    return this.prisma.appointment.count({
      where: { slot_id: slotId, status: { in: ['pending', 'confirmed'] } },
    });
  }

  async createAppointment(data: any) {
    return this.prisma.appointment.create({ data });
  }

  async upsertAppointmentContact(data: any) {
    return this.prisma.appointmentContact.upsert({
      where: { appointment_id: data.appointment_id },
      update: {
        contact_name: data.contact_name ?? null,
        contact_phone: data.contact_phone ?? null,
        contact_email: data.contact_email ?? null,
        relationship_to_student: data.relationship_to_student ?? null,
      },
      create: {
        appointment_id: data.appointment_id,
        contact_name: data.contact_name ?? null,
        contact_phone: data.contact_phone ?? null,
        contact_email: data.contact_email ?? null,
        relationship_to_student: data.relationship_to_student ?? null,
      },
    })
  }

  async getAppointmentsForAccount(accountId: number) {
    return this.prisma.appointment.findMany({
      where: { booker_account_id: accountId },
      include: {
        slot: { include: { week: true } },
        instructor: { include: { account: { select: { account_id: true } } } },
        student: { include: { account: { select: { account_id: true } } } },
        appointmentContact: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getAppointmentById(appointmentId: number) {
    return this.prisma.appointment.findUnique({
      where: { appointment_id: appointmentId },
      include: {
        slot: { include: { week: true } },
        instructor: true,
        student: true,
        booker: true,
        appointmentContact: true,
      },
    });
  }

  async cancelAppointment(appointmentId: number, reason?: string) {
    return this.prisma.appointment.update({
      where: { appointment_id: appointmentId },
      data: { status: 'canceled', cancel_reason: reason ?? null, canceled_at: new Date() },
    });
  }

  async getStudentByAccountId(accountId: number) {
    const now = new Date()
    return this.prisma.student.findUnique({
      where: { account_id: accountId },
      include: {
        account: {
          include: { profile: true },
        },
        classGroup: {
          include: {
            adviserAssignments: {
              where: {
                OR: [{ ended_date: null }, { ended_date: { gt: now } }],
              },
              orderBy: [{ ended_date: 'asc' }, { assigned_date: 'desc' }],
              take: 1,
              include: {
                instructor: {
                  include: {
                    account: {
                      include: { profile: true },
                    },
                    department: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getParentByAccountId(accountId: number) {
    return this.prisma.parent.findUnique({
      where: { account_id: accountId },
      include: {
        account: {
          include: { profile: true },
        },
      },
    });
  }

  async verifyParentStudentLink(parentId: number, studentId: number) {
    return this.prisma.parentStudentLink.findUnique({ where: { parent_id_student_id: { parent_id: parentId, student_id: studentId } } });
  }

  async getStudentsForParent(parentId: number) {
    const now = new Date()
    return this.prisma.parentStudentLink.findMany({
      where: { parent_id: parentId },
      include: {
        student: {
          include: {
            account: {
              include: { profile: true },
            },
            classGroup: {
              include: {
                adviserAssignments: {
                  where: {
                    OR: [{ ended_date: null }, { ended_date: { gt: now } }],
                  },
                  orderBy: [{ ended_date: 'asc' }, { assigned_date: 'desc' }],
                  take: 1,
                  include: {
                    instructor: {
                      include: {
                        account: {
                          include: { profile: true },
                        },
                        department: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
  }

  // Get instructor by account_id
  async getInstructorByAccountId(accountId: number) {
    return this.prisma.instructor.findUnique({
      where: { account_id: accountId },
      include: {
        account: {
          include: { profile: true },
        },
      },
    });
  }

  // Get appointments for instructor (as adviser)
  async getAppointmentsForInstructor(instructorId: number, status?: string[], bookerRole?: string) {
    const where: any = { instructor_id: instructorId };
    if (status && status.length > 0) {
      where.status = { in: status };
    }
    // Filter by booker_role if specified (e.g., only 'parent' bookings)
    if (bookerRole) {
      where.booker_role = bookerRole;
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        slot: { 
          include: { 
            week: {
              include: {
                instructor: {
                  include: {
                    account: { include: { profile: true } },
                  },
                },
              },
            },
          },
        },
        instructor: { 
          include: { 
            account: { include: { profile: true } },
          },
        },
        student: { 
          include: { 
            account: { include: { profile: true } },
            classGroup: true,
          },
        },
        booker: { 
          include: { profile: true },
        },
        appointmentContact: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // Accept appointment
  async acceptAppointment(appointmentId: number, data?: { meetingLink?: string; meetingLocation?: string; notes?: string }) {
    return this.prisma.appointment.update({
      where: { appointment_id: appointmentId },
      data: {
        status: 'confirmed',
        updated_at: new Date(),
        cancel_reason: data?.notes ?? null, // Use cancel_reason for instructor notes
      },
    });
  }

  // Reject appointment
  async rejectAppointment(appointmentId: number, data: { reason: string; suggestedDate?: string; suggestedTime?: string; notes?: string }) {
    const rejectNotes = [
      data.reason,
      data.notes,
      data.suggestedDate && data.suggestedTime ? `Suggested: ${data.suggestedDate} at ${data.suggestedTime}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    return this.prisma.appointment.update({
      where: { appointment_id: appointmentId },
      data: {
        status: 'rejected',
        canceled_at: new Date(),
        updated_at: new Date(),
        cancel_reason: rejectNotes,
      },
    });
  }
}
