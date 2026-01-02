
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, Package, LayoutDashboard, BookMarked, Menu, X, LogOut, User, CalendarDays, BarChart3, Settings, Moon, Sun, ShoppingCart, CheckCircle2 } from "lucide-react";
import { eventhub } from "@/api/eventhubClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: isAuthenticated, isLoading } = useQuery({
    queryKey: ['isAuthenticated'],
    queryFn: () => eventhub.auth.isAuthenticated(),
    retry: false,
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => eventhub.auth.me(),
    enabled: isAuthenticated === true,
    retry: false,
  });

  const [isDark, setIsDark] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const items = JSON.parse(savedCart);
        setCartItemCount(items.length);
      } else {
        setCartItemCount(0);
      }
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  useEffect(() => {
    if (user?.theme_preference) {
      const prefersDark = user.theme_preference === 'dark' || 
        (user.theme_preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, [user?.theme_preference]);

  const toggleThemeMutation = useMutation({
    mutationFn: async (newTheme) => {
      await eventhub.auth.updateMe({ theme_preference: newTheme });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
    },
  });

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark', !isDark);
    toggleThemeMutation.mutate(newTheme);
  };

  // Public pages that don't require authentication
  const publicPages = ['Landing', 'Login', 'Register'];
  
  // Show loading state while checking authentication
  if (isLoading && !publicPages.includes(currentPageName)) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (isAuthenticated === false && !publicPages.includes(currentPageName)) {
    window.location.href = createPageUrl('Landing');
    return null;
  }

  if (publicPages.includes(currentPageName)) {
    return children;
  }

  const handleLogout = () => {
    eventhub.auth.logout();
    window.location.href = '/landing';
  };

  const navigationItems = [
    {
      title: "Dashboard",
      url: createPageUrl("Dashboard"),
      icon: LayoutDashboard,
    },
    {
      title: "Events",
      url: createPageUrl("Events"),
      icon: Calendar,
    },
    {
      title: "Resources",
      url: createPageUrl("Resources"),
      icon: Package,
    },
    {
      title: "Calendar",
      url: createPageUrl("CalendarView"),
      icon: CalendarDays,
    },
    {
      title: "My Bookings",
      url: createPageUrl("MyBookings"),
      icon: BookMarked,
    },
  ];

  const adminItems = [
    {
      title: "Admin",
      url: createPageUrl("Admin"),
      icon: Settings,
    },
    {
      title: "Approvals",
      url: createPageUrl("BookingApprovals"),
      icon: CheckCircle2,
    },
    {
      title: "Users",
      url: createPageUrl("UserManagement"),
      icon: User,
    },
    {
      title: "Analytics",
      url: createPageUrl("Analytics"),
      icon: BarChart3,
    },
  ];
  
  const isAdmin = user?.role === 'admin';
  const isActive = (url) => location.pathname === url;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <style>{`
        :root {
          --md-primary: #1976d2;
          --md-primary-dark: #1565c0;
          --md-primary-light: #42a5f5;
          --md-accent: #ff4081;
          --md-accent-dark: #f50057;
        }
        
        .dark {
          --md-primary: #42a5f5;
          --md-primary-dark: #64b5f6;
          --md-primary-light: #90caf9;
          --md-accent: #ff6090;
          --md-accent-dark: #ff4081;
        }
        
        .ripple {
          position: relative;
          overflow: hidden;
        }
        
        .ripple::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .ripple:active::after {
          width: 300px;
          height: 300px;
        }
        
        .elevation-1 { box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); }
        .elevation-2 { box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23); }
        .elevation-3 { box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23); }
        .elevation-4 { box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22); }
        .elevation-5 { box-shadow: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22); }
        
        .dark .elevation-1 { box-shadow: 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6); }
        .dark .elevation-2 { box-shadow: 0 3px 6px rgba(0,0,0,0.5), 0 3px 6px rgba(0,0,0,0.7); }
        .dark .elevation-3 { box-shadow: 0 10px 20px rgba(0,0,0,0.6), 0 6px 6px rgba(0,0,0,0.8); }
        
        .hover-elevation-2:hover { 
          box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
          transform: translateY(-2px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hover-elevation-3:hover { 
          box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
          transform: translateY(-2px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hover-elevation-4:hover { 
          box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .material-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .material-button:hover {
          transform: scale(1.02);
        }

        .material-button:active {
          transform: scale(0.98);
        }
      `}</style>

      <nav className="bg-white dark:bg-gray-800 elevation-2 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--md-primary)' }}>
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Roboto, sans-serif' }}>EventHub</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Resource Management</p>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive(item.url)
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  style={isActive(item.url) ? { backgroundColor: 'var(--md-primary)' } : {}}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              ))}
              {isAdmin && adminItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive(item.url)
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  style={isActive(item.url) ? { backgroundColor: 'var(--md-accent)' } : {}}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <Link
                to={createPageUrl("Cart")}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ backgroundColor: 'var(--md-accent)' }}>
                    {cartItemCount}
                  </span>
                )}
              </Link>
              <Link
                to={createPageUrl("Profile")}
                className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium" style={{ backgroundColor: 'var(--md-accent)' }}>
                  {user?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role || 'Member'}</p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 dark:text-white" /> : <Menu className="w-6 h-6 dark:text-white" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="px-4 py-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(item.url)
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  style={isActive(item.url) ? { backgroundColor: 'var(--md-primary)' } : {}}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              ))}
              {isAdmin && adminItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(item.url)
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  style={isActive(item.url) ? { backgroundColor: 'var(--md-accent)' } : {}}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              ))}
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all w-full"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <Link
                to={createPageUrl("Profile")}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all w-full"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="min-h-[calc(100vh-64px)]">
        {children}
      </main>
    </div>
  );
}
