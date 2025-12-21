const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to get Monday of a week (start of week)
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

// Generate random date within a year range
function randomDateInYear(year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate time slots for a day
function generateTimeSlots() {
  const slots = [
    { start: '08:00:00', end: '09:00:00', period: 'Morning', capacity: 5 },
    { start: '09:00:00', end: '10:00:00', period: 'Morning', capacity: 5 },
    { start: '10:00:00', end: '11:00:00', period: 'Morning', capacity: 5 },
    { start: '13:00:00', end: '14:00:00', period: 'Afternoon', capacity: 5 },
    { start: '14:00:00', end: '15:00:00', period: 'Afternoon', capacity: 5 },
    { start: '15:00:00', end: '16:00:00', period: 'Afternoon', capacity: 5 },
    { start: '16:00:00', end: '17:00:00', period: 'Afternoon', capacity: 5 },
  ];
  return slots;
}

async function main() {
  console.log('🌱 Starting seedFinalPart3.js - Seeding Instructor Availability & Appointments...\n');

  // 1. Get all instructors
  const allInstructors = await prisma.instructor.findMany({
    orderBy: { instructor_id: 'asc' },
  });

  console.log(`✅ Found ${allInstructors.length} instructors\n`);

  // 2. Get all students and parents with their relationships
  const allStudents = await prisma.student.findMany({
    orderBy: { student_id: 'asc' },
  });

  const allParents = await prisma.parent.findMany({
    orderBy: { parent_id: 'asc' },
  });

  const parentStudentLinks = await prisma.parentStudentLink.findMany({
    select: {
      parent_id: true,
      student_id: true,
    },
  });

  console.log(`✅ Found ${allStudents.length} students and ${allParents.length} parents\n`);
  console.log(`✅ Found ${parentStudentLinks.length} parent-student links\n`);

  // Create a map for quick lookup: student_id -> parent_id
  const studentToParentMap = {};
  parentStudentLinks.forEach(link => {
    studentToParentMap[link.student_id] = link.parent_id;
  });

  // ====================================================================
  // 3. Seed InstructorAvailabilityWeek, Date, and Slots
  // ====================================================================
  console.log('🌱 Seeding InstructorAvailability (Week, Date, Slot)...\n');

  const years = [2021, 2022, 2023, 2024, 2025];
  const allSlots = []; // Store all slots for appointment booking later

  let weekCount = 0;
  let dateCount = 0;
  let slotCount = 0;

  for (const instructor of allInstructors) {
    console.log(`\n📋 Processing instructor ${instructor.instructor_id}...`);

    // Generate 2-4 random weeks per year per instructor (total ~10-20 weeks per instructor)
    for (const year of years) {
      const weeksInYear = 2 + Math.floor(Math.random() * 3); // 2-4 weeks

      for (let w = 0; w < weeksInYear; w++) {
        // Generate a random date in the year and get its Monday
        const randomDate = randomDateInYear(year);
        const weekStartDate = getMonday(randomDate);

        try {
          const week = await prisma.instructorAvailabilityWeek.upsert({
            where: {
              instructor_id_week_start_date: {
                instructor_id: instructor.instructor_id,
                week_start_date: weekStartDate,
              },
            },
            update: {},
            create: {
              instructor_id: instructor.instructor_id,
              week_start_date: weekStartDate,
            },
          });

          weekCount++;

          // Create 7 dates (Monday to Sunday)
          for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const specificDate = new Date(weekStartDate);
            specificDate.setDate(weekStartDate.getDate() + dayOffset);

            // Random availability: 70% available, 30% not available
            const isAvailable = Math.random() < 0.7;

            const date = await prisma.instructorAvailabilityDate.upsert({
              where: {
                week_id_specific_date: {
                  week_id: week.week_id,
                  specific_date: specificDate,
                },
              },
              update: { is_available: isAvailable },
              create: {
                week_id: week.week_id,
                specific_date: specificDate,
                is_available: isAvailable,
                note: isAvailable ? null : 'Not available',
              },
            });

            dateCount++;

            // If available, create time slots
            if (isAvailable) {
              const timeSlots = generateTimeSlots();

              for (const slot of timeSlots) {
                // Random: some slots may be closed
                const isOpen = Math.random() < 0.85; // 85% open

                // Random meeting type
                const meetingTypes = ['online', 'offline', 'both'];
                const meetingType = meetingTypes[Math.floor(Math.random() * meetingTypes.length)];

                const meetingLink = meetingType === 'online' || meetingType === 'both'
                  ? `https://meet.google.com/${Math.random().toString(36).substring(7)}`
                  : null;

                const meetingLocation = meetingType === 'offline' || meetingType === 'both'
                  ? `Phòng ${Math.floor(Math.random() * 20) + 100}`
                  : null;

                try {
                  const createdSlot = await prisma.instructorDailySlot.upsert({
                    where: {
                      date_id_start_time_local: {
                        date_id: date.date_id,
                        start_time_local: new Date(`1970-01-01T${slot.start}`),
                      },
                    },
                    update: {
                      is_open: isOpen,
                      capacity: slot.capacity,
                    },
                    create: {
                      date_id: date.date_id,
                      start_time_local: new Date(`1970-01-01T${slot.start}`),
                      end_time_local: new Date(`1970-01-01T${slot.end}`),
                      period_label: slot.period,
                      capacity: slot.capacity,
                      is_open: isOpen,
                      auto_accept: Math.random() < 0.3, // 30% auto-accept
                      meeting_type: meetingType,
                      meeting_link: meetingLink,
                      meeting_location: meetingLocation,
                    },
                  });

                  // Store slot info for appointment booking
                  if (isOpen) {
                    allSlots.push({
                      slot_id: createdSlot.slot_id,
                      instructor_id: instructor.instructor_id,
                      date: specificDate,
                      start_time: slot.start,
                      capacity: slot.capacity,
                      meeting_type: meetingType,
                      bookedCount: 0, // Track how many appointments booked
                    });
                  }

                  slotCount++;
                } catch (e) {
                  console.warn(`⚠️ Error creating slot: ${e.message}`);
                }
              }
            }
          }
        } catch (e) {
          console.warn(`⚠️ Error creating week for instructor ${instructor.instructor_id}: ${e.message}`);
        }
      }
    }
  }

  console.log(`\n✅ Seeded ${weekCount} weeks, ${dateCount} dates, ${slotCount} slots!`);

  // ====================================================================
  // 4. Seed Appointments (~1000 bookings)
  // ====================================================================
  console.log('\n🌱 Seeding Appointments (~1000 bookings)...\n');

  // Filter slots that are in the past (before Dec 2025) or near current date
  const currentDate = new Date(2025, 11, 20);
  const availableSlotsForBooking = allSlots.filter(slot => {
    const slotDate = new Date(slot.date);
    return slotDate <= currentDate && slot.capacity > slot.bookedCount;
  });

  console.log(`📊 Available slots for booking: ${availableSlotsForBooking.length}`);

  // Shuffle slots for random booking
  const shuffledSlots = [...availableSlotsForBooking].sort(() => Math.random() - 0.5);

  const targetAppointments = 1000;
  let appointmentCount = 0;
  let contactCount = 0;

  // Track which slots have been booked by which student-parent pairs
  const slotBookings = {}; // slot_id -> Set of student_ids

  for (let i = 0; i < targetAppointments && i < shuffledSlots.length; i++) {
    const slot = shuffledSlots[i];

    // Check if slot is full
    if (slot.bookedCount >= slot.capacity) {
      continue;
    }

    // Random: 60% booked by student, 40% booked by parent
    const isBookedByParent = Math.random() < 0.4;

    let bookerAccountId, bookerRole, studentId, parentId;

    if (isBookedByParent) {
      // Parent books for their student
      const randomParent = allParents[Math.floor(Math.random() * allParents.length)];
      parentId = randomParent.parent_id;
      bookerAccountId = randomParent.account_id;
      bookerRole = 'parent';

      // Find the student linked to this parent
      const linkedStudentId = Object.keys(studentToParentMap).find(
        sid => studentToParentMap[sid] === parentId
      );

      if (linkedStudentId) {
        studentId = parseInt(linkedStudentId);

        // Check if this student-parent pair already booked this slot
        if (!slotBookings[slot.slot_id]) {
          slotBookings[slot.slot_id] = new Set();
        }

        if (slotBookings[slot.slot_id].has(studentId)) {
          // Skip: student already has appointment in this slot via parent
          continue;
        }

        slotBookings[slot.slot_id].add(studentId);
      } else {
        // No linked student found, skip
        continue;
      }
    } else {
      // Student books directly
      const randomStudent = allStudents[Math.floor(Math.random() * allStudents.length)];
      studentId = randomStudent.student_id;
      bookerAccountId = randomStudent.account_id;
      bookerRole = 'student';

      // Check if this student already booked this slot
      if (!slotBookings[slot.slot_id]) {
        slotBookings[slot.slot_id] = new Set();
      }

      if (slotBookings[slot.slot_id].has(studentId)) {
        // Skip: student already has appointment in this slot
        continue;
      }

      // Also check if parent of this student already booked this slot
      const parentIdOfStudent = studentToParentMap[studentId];
      if (parentIdOfStudent && slotBookings[slot.slot_id].has(studentId)) {
        // Skip to prevent parent and student from same family booking same slot
        continue;
      }

      slotBookings[slot.slot_id].add(studentId);
    }

    // Random appointment status
    const statuses = ['confirmed', 'completed', 'rejected', 'canceled', 'pending'];
    const statusWeights = [0.35, 0.30, 0.15, 0.12, 0.08]; // 35% confirmed, 30% completed, 15% rejected, 12% canceled, 8% pending
    let randomStatus = 'confirmed';
    const rand = Math.random();
    let cumulative = 0;
    for (let s = 0; s < statuses.length; s++) {
      cumulative += statusWeights[s];
      if (rand <= cumulative) {
        randomStatus = statuses[s];
        break;
      }
    }

    const purposes = [
      'Tư vấn học tập',
      'Hỗ trợ đăng ký môn học',
      'Tư vấn nghề nghiệp',
      'Giải đáp thắc mắc về điểm',
      'Xin phép vắng mặt',
      'Trao đổi về khóa luận',
      'Tư vấn về học bổng',
      'Thắc mắc về lịch học',
    ];
    const meetingPurpose = purposes[Math.floor(Math.random() * purposes.length)];

    // Rejection/cancellation reasons
    let cancelReason = null;
    if (randomStatus === 'rejected') {
      const rejectReasons = [
        'Giảng viên có lịch bận đột xuất',
        'Không phù hợp với thời gian giảng viên',
        'Nội dung tư vấn không thuộc chuyên môn',
        'Giảng viên yêu cầu đặt lại thời gian khác',
        'Lý do cá nhân',
      ];
      cancelReason = rejectReasons[Math.floor(Math.random() * rejectReasons.length)];
    } else if (randomStatus === 'canceled') {
      const cancelReasons = [
        'Sinh viên/Phụ huynh hủy lịch',
        'Thay đổi kế hoạch cá nhân',
        'Đã giải quyết vấn đề',
        'Lý do cá nhân',
      ];
      cancelReason = cancelReasons[Math.floor(Math.random() * cancelReasons.length)];
    }

    try {
      const appointment = await prisma.appointment.create({
        data: {
          slot_id: slot.slot_id,
          booker_account_id: bookerAccountId,
          booker_role: bookerRole,
          student_id: studentId,
          instructor_id: slot.instructor_id,
          meeting_purpose: meetingPurpose,
          status: randomStatus,
          meeting_type: slot.meeting_type,
          cancel_reason: cancelReason,
          canceled_at: (randomStatus === 'canceled' || randomStatus === 'rejected') ? new Date(slot.date) : null,
          attendance_status: randomStatus === 'completed' ? (Math.random() < 0.9 ? 'attended' : 'absent') : null,
          attended: randomStatus === 'completed' ? Math.random() < 0.9 : null,
          attendance_checked_at: randomStatus === 'completed' ? new Date(slot.date) : null,
        },
      });

      appointmentCount++;
      slot.bookedCount++;

      // If booked by parent, create AppointmentContact (50% chance it's different from parent info)
      if (isBookedByParent && Math.random() < 0.8) { // 80% of parent bookings have contact info
        const isDifferentContact = Math.random() < 0.3; // 30% different contact

        const parentProfile = await prisma.profile.findUnique({
          where: { account_id: bookerAccountId },
        });

        const parent = await prisma.parent.findFirst({
          where: { parent_id: parentId },
        });

        let contactName, contactPhone, contactEmail, relationship;

        if (isDifferentContact) {
          // Different contact (other family member)
          const relationships = ['Ông', 'Bà', 'Chú', 'Cô', 'Dì', 'Bác', 'Anh', 'Chị'];
          relationship = relationships[Math.floor(Math.random() * relationships.length)];
          contactName = `${relationship} của sinh viên`;
          contactPhone = `098${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`;
          contactEmail = null;
        } else {
          // Same as parent info
          contactName = parentProfile?.full_name || null;
          contactPhone = parentProfile?.phone_number || null;
          contactEmail = parentProfile?.email || null;
          relationship = parent?.relationship_type || 'Phụ huynh';
        }

        await prisma.appointmentContact.create({
          data: {
            appointment_id: appointment.appointment_id,
            contact_name: contactName,
            contact_phone: contactPhone,
            contact_email: contactEmail,
            relationship_to_student: relationship,
          },
        });

        contactCount++;
      }

      if ((appointmentCount) % 100 === 0) {
        console.log(`✅ Created ${appointmentCount} appointments...`);
      }
    } catch (e) {
      console.warn(`⚠️ Error creating appointment: ${e.message}`);
    }
  }

  console.log(`\n✅ Seeded ${appointmentCount} appointments!`);
  console.log(`✅ Seeded ${contactCount} appointment contacts (for parent bookings)!`);

  // ====================================================================
  // 5. Statistics
  // ====================================================================
  console.log('\n📊 Final Statistics:');
  
  const totalAppointments = await prisma.appointment.count();
  const confirmedCount = await prisma.appointment.count({ where: { status: 'confirmed' } });
  const completedCount = await prisma.appointment.count({ where: { status: 'completed' } });
  const rejectedCount = await prisma.appointment.count({ where: { status: 'rejected' } });
  const canceledCount = await prisma.appointment.count({ where: { status: 'canceled' } });
  const pendingCount = await prisma.appointment.count({ where: { status: 'pending' } });

  console.log(`   Total Appointments: ${totalAppointments}`);
  console.log(`   - Confirmed: ${confirmedCount}`);
  console.log(`   - Completed: ${completedCount}`);
  console.log(`   - Rejected: ${rejectedCount}`);
  console.log(`   - Canceled: ${canceledCount}`);
  console.log(`   - Pending: ${pendingCount}`);

  const studentBookings = await prisma.appointment.count({ where: { booker_role: 'student' } });
  const parentBookings = await prisma.appointment.count({ where: { booker_role: 'parent' } });

  console.log(`\n   Bookings by Role:`);
  console.log(`   - Student: ${studentBookings}`);
  console.log(`   - Parent: ${parentBookings}`);

  console.log('\n✨ seedFinalPart3.js completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
