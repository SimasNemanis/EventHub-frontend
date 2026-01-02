import React, { useState, useEffect } from "react";
import { ShoppingCart, Trash2, Calendar, Clock, ArrowRight, Package } from "lucide-react";
import { Link } from "react-router-dom";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const items = JSON.parse(savedCart);
        setCartItems(Array.isArray(items) ? items : []);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeItem = (index) => {
    try {
      const newCart = cartItems.filter((_, i) => i !== index);
      setCartItems(newCart);
      localStorage.setItem('cart', JSON.stringify(newCart));
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = parseFloat(item.totalPrice) || 0;
      return sum + price;
    }, 0);
  };

  const clearCart = () => {
    try {
      setCartItems([]);
      localStorage.removeItem('cart');
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
            <ShoppingCart className="w-20 h-20 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Start adding events and resources to your cart</p>
            <div className="flex gap-4 justify-center">
              <Link to="/events">
                <button className="px-6 py-3 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700">
                  Browse Events
                </button>
              </Link>
              <Link to="/resources">
                <button className="px-6 py-3 rounded-lg text-white font-medium bg-green-600 hover:bg-green-700">
                  Browse Resources
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80'}
                        alt={item.name || 'Item'}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80'; }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.name || 'Unnamed Item'}</h3>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                            item.type === 'event' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.type === 'event' ? 'Event Ticket' : 'Resource Booking'}
                          </span>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {item.type === 'resource' && item.endDate
                              ? `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`
                              : formatDate(item.startDate)}
                          </span>
                        </div>
                        {item.startTime && item.endTime && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{item.startTime} - {item.endTime}</span>
                          </div>
                        )}
                        {item.type === 'resource' && item.days && (
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span>{item.days} day(s) × ${item.pricePerDay || 0}/day</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.type === 'event' ? 'Ticket Price' : 'Total'}
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          ${(parseFloat(item.totalPrice) || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={clearCart}
                className="w-full py-3 rounded-lg border-2 border-red-500 text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Clear Cart
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Tax (0%)</span>
                    <span>$0.00</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <Link to="/checkout">
                  <button
                    className="w-full py-4 rounded-lg text-white font-bold text-lg flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    🔒 Secure checkout · All transactions are encrypted
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
