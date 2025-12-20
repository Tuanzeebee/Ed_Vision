import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSlotById(slotId: number) {
    return this.prisma.instructorDailySlot.findUnique({
      where: { slot_id: slotId },
      include: {
        date: {
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
        },
      },
    });
  }

  async countActiveAppointmentsForSlot(slotId: number) {
    return this.prisma.appointment.count({
      where: { slot_id: slotId, status: { in: ['pending', 'confirmed'] } },
    });
  }

  async findCancelledAppointmentForSlotAndStudent(
    slotId: number,
    studentId: number,
  ) {
    return this.prisma.appointment.findFirst({
      where: {
        slot_id: slotId,
        student_id: studentId,
        status: 'canceled',
      },
    });
  }

  async findActiveAppointmentForSlotAndStudent(
    slotId: number,
    studentId: number,
  ) {
    return this.prisma.appointment.findFirst({
      where: {
        slot_id: slotId,
        student_id: studentId,
        status: { in: ['pending', 'confirmed'] },
      },
    });
  }

  async findAnyAppointmentForSlotAndStudent(slotId: number, studentId: number) {
    return this.prisma.appointment.findFirst({
      where: {
        slot_id: slotId,
        student_id: studentId,
      },
      orderBy: { created_at: 'desc' }, // Get the most recent one
    });
  }

  async createAppointment(data: any) {
    return this.prisma.appointment.create({ data });
  }

  async reactivateCancelledAppointment(
    appointmentId: number,
    status: string,
    meetingType: any,
    meetingPurpose?: string,
    bookerAccountId?: number,
    bookerRole?: string,
  ) {
    const updateData: any = {
      status,
      meeting_type: meetingType,
      meeting_purpose: meetingPurpose ?? null,
      cancel_reason: null,
      canceled_at: null,
      updated_at: new Date(),
    };

    if (bookerAccountId !== undefined) {
      updateData.booker_account_id = bookerAccountId;
    }

    if (bookerRole !== undefined) {
      updateData.booker_role = bookerRole;
    }

    return this.prisma.appointment.update({
      where: { appointment_id: appointmentId },
      data: updateData,
    });
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
    });
  }

  async getAppointmentsForAccount(accountId: number) {
    // Check what roles this account has
    const studentRecord = await this.prisma.student.findUnique({
      where: { account_id: accountId },
    });
    const parentRecord = await this.prisma.parent.findUnique({
      where: { account_id: accountId },
    });

    // If account has both roles, this is an error - should not happen
    if (studentRecord && parentRecord) {
      throw new Error(
        `Account ${accountId} has both student and parent records - this should not happen`,
      );
    }

    // Return appointments that this account booked (booker_account_id)
    const whereCondition = { booker_account_id: accountId };

    const appointments = await this.prisma.appointment.findMany({
      where: whereCondition,
      include: {
        slot: { include: { date: { include: { week: true } } } },
        instructor: {
          include: {
            account: {
              include: { profile: true },
            },
          },
        },
        student: {
          include: {
            account: {
              include: { profile: true },
            },
            classGroup: {
              include: {
                adviserAssignments: {
                  where: {
                    OR: [
                      { ended_date: null },
                      { ended_date: { gt: new Date() } },
                    ],
                  },
                  orderBy: [{ ended_date: 'asc' }, { assigned_date: 'desc' }],
                  take: 1,
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
            },
          },
        },
        appointmentContact: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Return appointments directly - instructor field already correctly populated from appointment.instructor_id
    return appointments;
  }

  async getAppointmentById(appointmentId: number) {
    return this.prisma.appointment.findUnique({
      where: { appointment_id: appointmentId },
      include: {
        slot: { include: { date: { include: { week: true } } } },
        instructor: { include: { account: { include: { profile: true } } } },
        student: { include: { account: { include: { profile: true } } } },
        booker: { include: { profile: true } },
        appointmentContact: true,
      },
    });
  }

  async cancelAppointment(appointmentId: number, reason?: string) {
    return this.prisma.appointment.update({
      where: { appointment_id: appointmentId },
      data: {
        status: 'cancelled',
        cancel_reason: reason ?? null,
        canceled_at: new Date(),
      },
    });
  }

  async getStudentByAccountId(accountId: number) {
    const now = new Date();
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
    return this.prisma.parentStudentLink.findUnique({
      where: {
        parent_id_student_id: { parent_id: parentId, student_id: studentId },
      },
    });
  }

  async getStudentsForParent(parentId: number) {
    const now = new Date();
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
    });
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

  async getInstructorById(instructorId: number) {
    return this.prisma.instructor.findUnique({
      where: { instructor_id: instructorId },
      include: {
        account: {
          include: { profile: true },
        },
      },
    });
  }

  // Get appointments for instructor (as adviser)
  async getAppointmentsForInstructor(
    instructorId: number,
    status?: string[],
    bookerRole?: string,
  ) {
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
            date: {
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
  async acceptAppointment(
    appointmentId: number,
    data?: { meetingLink?: string; meetingLocation?: string; notes?: string },
  ) {
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
  async rejectAppointment(
    appointmentId: number,
    data: {
      reason: string;
      suggestedDate?: string;
      suggestedTime?: string;
      notes?: string;
    },
  ) {
    const rejectNotes = [
      data.reason,
      data.notes,
      data.suggestedDate && data.suggestedTime
        ? `Suggested: ${data.suggestedDate} at ${data.suggestedTime}`
        : null,
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

  async updateAppointmentStatus(appointmentId: number, status: string) {
    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    // Set canceled_at if status is canceled
    if (status === 'canceled') {
      updateData.canceled_at = new Date();
    }

    return this.prisma.appointment.update({
      where: { appointment_id: appointmentId },
      data: updateData,
    });
  }

  async isAdminRole(roleId: number) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });
    return role?.code?.toLowerCase().includes('admin') || false;
  }

  async getAccountById(accountId: number) {
    return this.prisma.account.findUnique({
      where: { account_id: accountId },
      select: {
        account_id: true,
        role_id: true,
      },
    });
  }
}
