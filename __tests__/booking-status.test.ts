import type { Booking } from '@/api/types';
import { BOOKING_STEPS, bookingProgress, bookingStatusKey, bookingStep, isActiveBooking } from '@/utils/booking';

const base = { status: 'DRIVER_ASSIGNED', tripStatus: 'NOT_STARTED' } as Booking;

describe('booking presentation', () => {
  it('names each trip stage from the server status', () => {
    expect(bookingStatusKey({ ...base, status: 'SEARCHING', tripStatus: null })).toBe('status.searching');
    expect(bookingStatusKey({ ...base, status: 'SCHEDULED', tripStatus: null })).toBe('status.scheduled');
    expect(bookingStatusKey({ ...base, tripStatus: 'ARRIVED' })).toBe('status.arrived');
    // a completed trip stays DRIVER_ASSIGNED until payment settles
    expect(bookingStatusKey({ ...base, tripStatus: 'COMPLETED' })).toBe('status.paymentDue');
    expect(bookingStatusKey({ ...base, status: 'COMPLETED' })).toBe('status.paid');
  });

  it('treats only open bookings as active', () => {
    expect(isActiveBooking({ status: 'SCHEDULED' })).toBe(true);
    expect(isActiveBooking({ status: 'SEARCHING' })).toBe(true);
    expect(isActiveBooking(base)).toBe(true);
    expect(isActiveBooking({ status: 'COMPLETED' })).toBe(false);
    expect(isActiveBooking({ status: 'CANCELLED' })).toBe(false);
  });

  it('advances the progress bar through the trip', () => {
    expect(bookingProgress({ ...base, status: 'SEARCHING' })).toBe('12%');
    expect(bookingProgress({ ...base, tripStatus: 'IN_PROGRESS' })).toBe('78%');
  });

  it('places the booking on the timeline', () => {
    const step = (b: Pick<Booking, 'status' | 'tripStatus'>) => BOOKING_STEPS[bookingStep(b)];
    expect(step({ status: 'SEARCHING', tripStatus: null })).toBe('requested');
    expect(step({ status: 'SCHEDULED', tripStatus: null })).toBe('requested');
    expect(step(base)).toBe('matched');
    expect(step({ ...base, tripStatus: 'DRIVER_EN_ROUTE' })).toBe('onTheWay');
    expect(step({ ...base, tripStatus: 'ARRIVED' })).toBe('arrived');
    expect(step({ ...base, tripStatus: 'IN_PROGRESS' })).toBe('onTrip');
    // trip over but unpaid still reads as done on the timeline
    expect(step({ ...base, tripStatus: 'COMPLETED' })).toBe('done');
    expect(step({ ...base, status: 'COMPLETED' })).toBe('done');
  });
});
