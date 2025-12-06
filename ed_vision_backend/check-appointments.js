const { PrismaClient } = require('@prisma/client');

async function checkAppointments() {
  const prisma = new PrismaClient();

  try {
    const apps = await prisma.appointment.findMany();
    console.log('Total appointments:', apps.length);

    const counts = apps.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    console.log('Status counts:', counts);

    // Check canceled appointments
    const canceledApps = apps.filter(app => app.status === 'canceled');
    console.log('\nCanceled appointments:');
    canceledApps.forEach(app => {
      console.log(`ID: ${app.appointment_id}, Slot: ${app.slot_id}, Student: ${app.student_id}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAppointments();