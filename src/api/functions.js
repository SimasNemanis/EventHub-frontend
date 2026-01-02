import { base44 } from './base44Client';


export const generatePdfReceipt = eventhub.functions.generatePdfReceipt;

export const exportBookingsCSV = eventhub.functions.exportBookingsCSV;

export const exportOrdersCSV = eventhub.functions.exportOrdersCSV;

export const updateEventStatus = eventhub.functions.updateEventStatus;

export const sendEventReminders = eventhub.functions.sendEventReminders;

export const cleanupOldBookings = eventhub.functions.cleanupOldBookings;

export const createPayPalOrder = eventhub.functions.createPayPalOrder;

export const capturePayPalOrder = eventhub.functions.capturePayPalOrder;

