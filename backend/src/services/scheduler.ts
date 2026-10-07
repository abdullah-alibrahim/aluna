import cron from 'node-cron';
import Booking, { BookingStatus } from '../models/Booking';
import User from '../models/User';
import { sendPushNotification } from '../utils/pushNotifications';

export const initScheduler = () => {
  console.log('[Scheduler] Initialized.');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    try {
      // 1. Appointment Reminders (15 min before)
      await checkAppointmentReminders(now);
    } catch (error) {
      console.error('[Scheduler] Error:', error);
    }
  });
};

async function checkAppointmentReminders(now: Date) {
  // Target time: 15 minutes from now
  const target = new Date(now.getTime() + 15 * 60000);
  const windowStart = new Date(target); windowStart.setSeconds(0, 0);
  const windowEnd = new Date(target); windowEnd.setSeconds(59, 999);

  const bookings = await Booking.find({
    date: { $gte: windowStart, $lte: windowEnd },
    status: BookingStatus.CONFIRMED
  }).populate('userId', 'name pushToken').populate('shopId', 'name');

  for (const booking of bookings) {
    const user: any = booking.userId;
    const shop: any = booking.shopId;
    
    if (user?.pushToken) {
      await sendPushNotification(
        user.pushToken,
        'Appointment Reminder 🔔',
        `Your booking at ${shop?.name || 'the salon'} starts in 15 minutes.`,
        { screen: 'Bookings' }
      );
    }
  }
}
