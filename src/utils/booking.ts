import type { Booking } from '@/api/types';
import type { MessageKey } from '@/i18n';

/** A booking still in motion — the one the home screen surfaces. */
export function isActiveBooking(b: Pick<Booking, 'status'>) {
  return b.status === 'PENDING' || b.status === 'SCHEDULED' || b.status === 'SEARCHING' || b.status === 'DRIVER_ASSIGNED';
}

/** Message key for a booking's short status ("Driver on the way"); translate with `t`. */
export function bookingStatusKey(b: Pick<Booking, 'status' | 'tripStatus'>): MessageKey {
  if (b.status === 'SCHEDULED') return 'status.scheduled';
  if (b.status === 'SEARCHING') return 'status.searching';
  if (b.status === 'PENDING') return 'status.pending';
  if (b.status === 'COMPLETED') return 'status.paid';
  if (b.status === 'CANCELLED') return 'status.cancelled';
  if (b.status === 'EXPIRED') return 'status.expired';
  switch (b.tripStatus) {
    case 'DRIVER_EN_ROUTE':
      return 'status.enRoute';
    case 'ARRIVED':
      return 'status.arrived';
    case 'IN_PROGRESS':
      return 'status.inProgress';
    case 'COMPLETED':
      return 'status.paymentDue';
    case 'CANCELLED':
      return 'status.tripCancelled';
    default:
      return 'status.assigned';
  }
}

/** Width of the trip progress bar for each lifecycle stage. */
export function bookingProgress(b: Booking) {
  if (b.status === 'SCHEDULED') return '6%';
  if (b.status === 'SEARCHING' || b.status === 'PENDING') return '12%';
  if (b.status !== 'DRIVER_ASSIGNED') return '100%';
  switch (b.tripStatus) {
    case 'DRIVER_EN_ROUTE':
      return '40%';
    case 'ARRIVED':
      return '55%';
    case 'IN_PROGRESS':
      return '78%';
    case 'COMPLETED':
      return '92%';
    default:
      return '28%';
  }
}
