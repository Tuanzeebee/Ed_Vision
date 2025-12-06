const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all appointments with full details
  const allAppointments = await prisma.appointment.findMany({
    include: {
      instructor: {
        include: {
          account: { include: { profile: true } }
        }
      },
      student: {
        include: {
          account: { include: { profile: true } }
        }
      },
      slot: {
        include: {
          date: {
            include: {
              week: {
                include: {
                  instructor: {
                    include: {
                      account: { include: { profile: true } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    orderBy: { appointment_id: 'asc' }
  });
  
  console.log('=== ALL APPOINTMENTS DETAILS ===');
  console.log('Total count:', allAppointments.length);
  console.log('\n');
  
  allAppointments.forEach(appt => {
    const instructorName = appt.instructor?.account?.profile?.full_name || 'NULL';
    const slotInstructorName = appt.slot?.date?.week?.instructor?.account?.profile?.full_name || 'NULL';
    const studentName = appt.student?.account?.profile?.full_name || 'NULL';
    
    console.log(`ID: ${appt.appointment_id}`);
    console.log(`  instructor_id: ${appt.instructor_id} (${instructorName})`);
    console.log(`  slot.date.week.instructor: ${slotInstructorName}`);
    console.log(`  student: ${studentName}`);
    console.log(`  status: ${appt.status}`);
    console.log(`  created_at: ${appt.created_at}`);
    console.log('---');
  });

  // Check slots ownership
  console.log('\n=== SLOTS BY INSTRUCTOR ===');
  const slots = await prisma.instructorDailySlot.findMany({
    include: {
      date: {
        include: {
          week: {
            include: {
              instructor: {
                include: {
                  account: { include: { profile: true } }
                }
              }
            }
          }
        }
      }
    }
  });
  
  const slotsByInstructor = {};
  slots.forEach(slot => {
    const instructorId = slot.date?.week?.instructor_id;
    const name = slot.date?.week?.instructor?.account?.profile?.full_name || 'Unknown';
    if (!slotsByInstructor[instructorId]) {
      slotsByInstructor[instructorId] = { name, count: 0 };
    }
    slotsByInstructor[instructorId].count++;
  });
  
  Object.keys(slotsByInstructor).forEach(id => {
    console.log(`  Instructor ${id} (${slotsByInstructor[id].name}): ${slotsByInstructor[id].count} slots`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
