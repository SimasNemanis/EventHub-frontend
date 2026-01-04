import React, { useState, useEffect } from "react";
import { CreditCard, Lock, CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { eventhub } from "@/api/eventhubClient";

export default function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [billingInfo, setBillingInfo] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
  });

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const items = JSON.parse(savedCart);
        setCartItems(Array.isArray(items) ? items : []);
      } else {
        navigate('/cart');
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      navigate('/cart');
    }
  }, [navigate]);

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = parseFloat(item.totalPrice) || 0;
      return sum + price;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Format cart items for the backend
      const formattedItems = cartItems.map(item => ({
        type: item.type || 'event',
        itemId: item.itemId,
        name: item.name,
        totalPrice: parseFloat(item.totalPrice) || 0,
        startDate: item.startDate || new Date().toISOString().split('T')[0],
        startTime: item.startTime || '09:00',
        endTime: item.endTime || '10:00'
      }));

      // Call backend to create order
      const response = await eventhub.orders.create({
        items: formattedItems,
        billing_info: billingInfo,
        payment_method: paymentMethod
      });

      console.log('Order created:', response);
      setOrderPlaced(true);
      
      // Clear cart after successful order
      localStorage.removeItem('cart');

      // Redirect to My Bookings page after 2 seconds
      setTimeout(() => {
        navigate('/mybookings');
      }, 2000);
    } catch (error) {
      console.error('Payment error:', error);
      
      // Extract the actual error message from the backend response
      let errorMessage = 'Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check for specific HTTP status codes
      if (error.response?.status === 409) {
        // Conflict - likely duplicate booking
        alert('❌ Booking Conflict\n\n' + errorMessage);
      } else if (error.response?.status === 400) {
        // Bad request - validation error
        alert('❌ Invalid Request\n\n' + errorMessage);
      } else {
        alert('❌ Payment Failed\n\n' + errorMessage);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Your cart is empty. Redirecting...</p>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Lock className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Secure Checkout</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Billing Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Billing Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={billingInfo.full_name}
                    onChange={(e) => setBillingInfo({...billingInfo, full_name: e.target.value})}
                    required
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={billingInfo.email}
                    onChange={(e) => setBillingInfo({...billingInfo, email: e.target.value})}
                    required
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={billingInfo.phone}
                    onChange={(e) => setBillingInfo({...billingInfo, phone: e.target.value})}
                    required
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={billingInfo.address}
                    onChange={(e) => setBillingInfo({...billingInfo, address: e.target.value})}
                    required
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={billingInfo.city}
                    onChange={(e) => setBillingInfo({...billingInfo, city: e.target.value})}
                    required
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Postal Code"
                    value={billingInfo.postal_code}
                    onChange={(e) => setBillingInfo({...billingInfo, postal_code: e.target.value})}
                    required
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={billingInfo.country}
                    onChange={(e) => setBillingInfo({...billingInfo, country: e.target.value})}
                    required
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white md:col-span-2"
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="paypal"
                      checked={paymentMethod === "paypal"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">PayPal</p>
                      <p className="text-sm text-gray-500">Pay securely with PayPal</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Credit/Debit Card</p>
                      <p className="text-sm text-gray-500">Pay with card (Demo)</p>
                    </div>
                    <CreditCard className="w-6 h-6 text-gray-400" />
                  </label>
                </div>
              </div>

              {/* Payment Details for Card */}
              {paymentMethod === "card" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Card Details</h2>
                  </div>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Cardholder Name"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Card Number"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                      <span className="text-gray-900 dark:text-white font-medium">${(parseFloat(item.totalPrice) || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Tax (0%)</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-2xl text-blue-600">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full mt-6 py-4 rounded-lg text-white font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {processing ? 'Processing...' : 'Complete Payment'}
                </button>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    🔒 Secure checkout · All transactions are encrypted
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
