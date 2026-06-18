import emailjs from '@emailjs/browser'

// EmailJS configuration - these should be set as environment variables
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_f9unt9d'
const TEMPLATE_BOOKING_CONFIRMATION = import.meta.env.VITE_EMAILJS_TEMPLATE_BOOKING || ''
const TEMPLATE_ADMIN_NOTIFICATION = import.meta.env.VITE_EMAILJS_TEMPLATE_ADMIN || ''
const TEMPLATE_STATUS_UPDATE = import.meta.env.VITE_EMAILJS_TEMPLATE_STATUS || ''
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'johnfritzizar35@gmail.com' || 'expeditionoz.dev@gmail.com'

// Initialize EmailJS
if (PUBLIC_KEY) {
  emailjs.init(PUBLIC_KEY)
}

export interface BookingData {
  fullName: string
  email: string
  phone: string
  tripName: string
  selectedDate: string
  participants: number
  specialRequirements?: string
  status?: string
}

export function useEmail() {
  const isConfigured = Boolean(SERVICE_ID && PUBLIC_KEY)

  async function sendBookingConfirmation(booking: BookingData): Promise<boolean> {
    if (!isConfigured || !TEMPLATE_BOOKING_CONFIRMATION) {
      console.warn('EmailJS not configured for booking confirmation')
      return false
    }

    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_BOOKING_CONFIRMATION, {
        to_name: booking.fullName,
        to_email: booking.email,
        trip_name: booking.tripName,
        selected_date: booking.selectedDate,
        participants: booking.participants,
        special_requirements: booking.specialRequirements || 'None',
        phone: booking.phone,
      })
      return true
    } catch (e) {
      console.error('Failed to send booking confirmation:', e)
      return false
    }
  }

  async function sendAdminNotification(booking: BookingData): Promise<boolean> {
    if (!isConfigured || !TEMPLATE_ADMIN_NOTIFICATION) {
      console.warn('EmailJS not configured for admin notification')
      return false
    }

    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ADMIN_NOTIFICATION, {
        admin_email: ADMIN_EMAIL,
        customer_name: booking.fullName,
        customer_email: booking.email,
        customer_phone: booking.phone,
        trip_name: booking.tripName,
        selected_date: booking.selectedDate,
        participants: booking.participants,
        special_requirements: booking.specialRequirements || 'None',
      })
      return true
    } catch (e) {
      console.error('Failed to send admin notification:', e)
      return false
    }
  }

  async function sendStatusUpdate(booking: BookingData, newStatus: string): Promise<boolean> {
    if (!isConfigured || !TEMPLATE_STATUS_UPDATE) {
      console.warn('EmailJS not configured for status updates')
      return false
    }

    const statusMessages: Record<string, string> = {
      confirmed: 'Great news! Your booking has been confirmed.',
      cancelled: 'We regret to inform you that your booking has been cancelled.',
      pending: 'Your booking status has been updated to pending review.',
    }

    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_STATUS_UPDATE, {
        to_name: booking.fullName,
        to_email: booking.email,
        trip_name: booking.tripName,
        selected_date: booking.selectedDate,
        new_status: newStatus,
        status_message: statusMessages[newStatus] || `Your booking status is now: ${newStatus}`,
      })
      return true
    } catch (e) {
      console.error('Failed to send status update:', e)
      return false
    }
  }

  async function sendBookingEmails(booking: BookingData): Promise<{ customer: boolean; admin: boolean }> {
    const [customer, admin] = await Promise.all([
      sendBookingConfirmation(booking),
      sendAdminNotification(booking),
    ])
    return { customer, admin }
  }

  return {
    isConfigured,
    sendBookingConfirmation,
    sendAdminNotification,
    sendStatusUpdate,
    sendBookingEmails,
  }
}
