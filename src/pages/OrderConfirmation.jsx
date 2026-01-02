import React, { useEffect } from "react";
import { eventhub } from "@/api/eventhubClient";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Calendar, Package, Download, ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import confetti from 'canvas-confetti';

export default function OrderConfirmation() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get('orderId');

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const orders = await eventhub.entities.Order.filter({ id: orderId });
      return orders[0];
    },
    enabled: !!orderId,
  });

  useEffect(() => {
    // Celebration confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--md-primary)' }}></div>
          <p className="text-gray-600 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#10b981' }}>
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h1>
          <p className="text-gray-600 dark:text-gray-400">Thank you for your order. Your booking is confirmed.</p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg elevation-2 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700" style={{ backgroundColor: 'var(--md-primary)', color: 'white' }}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Order Number</p>
                <p className="text-2xl font-bold">{order.order_number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Total Paid</p>
                <p className="text-2xl font-bold">${order.total_amount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    item.type === 'event' ? 'bg-purple-500' : 'bg-blue-500'
                  }`}>
                    {item.type === 'event' ? (
                      <Calendar className="w-6 h-6 text-white" />
                    ) : (
                      <Package className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white">{item.item_name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(item.date), 'MMMM d, yyyy')} • {item.start_time} - {item.end_time}
                    </p>
                    {item.type === 'resource' && item.days > 1 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.days} days</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Billing Information</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{order.billing_info.full_name}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{order.billing_info.email}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Phone</p>
                <p className="font-medium text-gray-900 dark:text-white">{order.billing_info.phone}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">City</p>
                <p className="font-medium text-gray-900 dark:text-white">{order.billing_info.city}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to={createPageUrl("MyBookings")} className="flex-1">
            <button className="w-full py-4 rounded-lg text-white font-bold ripple material-button flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--md-primary)' }}>
              View My Bookings
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <button 
            onClick={async () => {
              const response = await eventhub.functions.invoke('generatePdfReceipt', { orderId: order.id });
              const blob = new Blob([response.data], { type: 'application/pdf' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `receipt-${order.order_number}.pdf`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              a.remove();
            }}
            className="flex-1 py-4 rounded-lg border-2 font-bold ripple material-button flex items-center justify-center gap-2" 
            style={{ borderColor: 'var(--md-primary)', color: 'var(--md-primary)' }}
          >
            <Download className="w-5 h-5" />
            Download Receipt
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            📧 A confirmation email has been sent to <strong>{order.billing_info.email}</strong> with your booking details and receipt.
          </p>
        </div>
      </div>
    </div>
  );
}