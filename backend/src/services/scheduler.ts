import cron from 'node-cron';
import Booking, { BookingStatus } from '../models/Booking';
import User from '../models/User';
import { sendPushNotification } from '../utils/pushNotifications';

// Configuration
const PENDING_EXPIRE_HOURS = 24; // Expire unconfirmed bookings after 24 hours
const REMINDER_24H = 24 * 60; // 24 hours in minutes
const REMINDER_2H = 2 * 60; // 2 hours in minutes
const REMINDER_15M = 15; // 15 minutes

export const initScheduler = () => {
  console.log('[Scheduler] Initialized.');

  // Process every minute: reminders
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    try {
      await checkAppointmentReminders(now);
    } catch (error) {
      console.error('[Scheduler] Reminder error:', error);
    }
  });

  // Auto-expire stale pending bookings every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      await expireStalePendingBookings();
    } catch (error) {
      console.error('[Scheduler] Expire error:', error);
    }
  });
};

/**
 * Expire pending bookings older than PENDING_EXPIRE_HOURS.
 * Frees up the slot for other customers.
 */
async function expireStalePendingBookings() {
  const cutoff = new Date(Date.now() - PENDING_EXPIRE_HOURS * 60 * 60 * 1000);
  const expired = await Booking.find({
    status: BookingStatus.PENDING,
    createdAt: { $lt: cutoff },
  }).populate('shopId', 'name ownerId');

  for (const booking of expired) {
    booking.status = BookingStatus.CANCELLED;
    booking.feeType = 'none';
    await booking.save();

    const shop: any = booking.shopId;
    if (shop?.ownerId) {
      const { sendNotification } = require('../services/notification.service');
      await sendNotification({
        recipientId: shop.ownerId.toString(),
        title: 'حجز منتهي ⏳',
        message: `تم إلغاء الحجز تلقائياً (عدم التأكيد خلال ${PENDING_EXPIRE_HOURS} ساعة). `,
        type: 'BOOKING_UPDATED',
        data: { bookingId: booking._id, shopId: booking.shopId, screen: 'Bookings' },
      });
    }

    // Notify customer
    const { sendNotification } = require('../services/notification.service');
    await sendNotification({
      recipientId: booking.userId.toString(),
      title: 'تم إلغاء الحجز تلقائياً',
      message: `لم يتم تأكيد حجزك within ${PENDING_EXPIRE_HOURS} ساعة، تم إلغاؤه. يرجى الحجز مرة أخرى.`,
      type: 'BOOKING_UPDATED',
      data: { bookingId: booking._id, status: 'cancelled', screen: 'Bookings' },
    }).catch(() => {});
  }

  if (expired.length > 0) {
    console.log(`[Scheduler] Expired ${expired.length} stale pending booking(s).`);
  }
}

/**
 * Send push reminders for upcoming bookings at 24h, 2h, and 15min before.
 * Uses a per-booking `reminderStage` to avoid duplicate sends.
 */
async function checkAppointmentReminders(now: Date) {
  const windowMinutes = 2; // tolerate scheduler jitter

  const stages: Array<{ minutes: number; label: string; field: 'reminder24hSent' | 'reminder2hSent' | 'reminder15mSent' }> = [
    { minutes: REMINDER_24H, label: '24 hours', field: 'reminder24hSent' },
    { minutes: REMINDER_2H, label: '2 hours', field: 'reminder2hSent' },
    { minutes: REMINDER_15M, label: '15 minutes', field: 'reminder15mSent' },
  ];

  for (const stage of stages) {
    const target = new Date(now.getTime() + stage.minutes * 60000);
    const from = new Date(target.getTime() - windowMinutes * 60000);
    const to = new Date(target.getTime() + windowMinutes * 60000);

    const bookings = await Booking.find({
      date: { $gte: from, $lte: to },
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      [stage.field]: { $ne: true },
    }).populate('userId', 'name pushToken').populate('shopId', 'name');

    for (const booking of bookings) {
      const user: any = booking.userId;
      const shop: any = booking.shopId;

      if (user?.pushToken) {
        await sendPushNotification(
          user.pushToken,
          'Appointment Reminder 🔔',
          `Your booking at ${shop?.name || 'the salon'} starts in ${stage.label}.`,
          { screen: 'Bookings', bookingId: booking._id },
        ).catch(() => {});
      }

      // Mark stage as sent
      await Booking.updateOne({ _id: booking._id }, { $set: { [stage.field]: true } }).catch(() => {});
    }
  }
}
