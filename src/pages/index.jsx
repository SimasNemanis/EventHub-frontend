import Layout from "./Layout.jsx";
import Admin from "./Admin";
import Analytics from "./Analytics";
import CalendarView from "./CalendarView";
import Dashboard from "./Dashboard";
import Events from "./Events";
import Home from "./Home";
import Landing from "./Landing";
import MyBookings from "./MyBookings";
import Profile from "./Profile";
import Resources from "./Resources";
import Cart from "./Cart";
import Checkout from "./Checkout";
import OrderConfirmation from "./OrderConfirmation";
import UserManagement from "./UserManagement";
import Register from "./Register";
import BookingApprovals from "./BookingApprovals";
import Login from "./Login";

import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventhub } from '@/api/eventhubClient';
import { useState, useEffect } from 'react';

const PAGES = {
    Admin: Admin,
    Analytics: Analytics,
    CalendarView: CalendarView,
    Dashboard: Dashboard,
    Events: Events,
    Home: Home,
    Landing: Landing,
    MyBookings: MyBookings,
    Profile: Profile,
    Resources: Resources,
    Cart: Cart,
    Checkout: Checkout,
    OrderConfirmation: OrderConfirmation,
    UserManagement: UserManagement,
    Register: Register,
    Login: Login,
    BookingApprovals: BookingApprovals,
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || 'Landing';
}

// Protected route wrapper - uses API to check authentication
function ProtectedRoute({ children, isAuthenticated, isLoading, requiredRole = null }) {
    const [userRole, setUserRole] = useState(null);
    
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const userData = JSON.parse(user);
                setUserRole(userData.role);
            } catch (e) {
                console.error('Failed to parse user data:', e);
            }
        }
    }, []);
    
    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // Check if a specific role is required
    if (requiredRole && userRole !== requiredRole) {
        return <Navigate to="/dashboard" replace />;
    }
    
    return children;
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    const publicPages = ['Landing', 'Login', 'Register'];
    
    // Check authentication using the API
    const { data: isAuthenticated, isLoading } = useQuery({
        queryKey: ['isAuthenticated'],
        queryFn: () => eventhub.auth.isAuthenticated(),
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // If loading, show loading state
    if (isLoading && !publicPages.includes(currentPage)) {
        return <div>Loading...</div>;
    }
    
    // If not authenticated and trying to access protected page, redirect to login
    if (!isAuthenticated && !publicPages.includes(currentPage)) {
        return <Navigate to="/login" replace />;
    }
    
    // If authenticated and trying to access login/register, redirect to dashboard
    if (isAuthenticated && (currentPage === 'Login' || currentPage === 'Register')) {
        return <Navigate to="/dashboard" replace />;
    }
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route path="/admin" element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading} requiredRole="admin"><Admin /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading} requiredRole="admin"><Analytics /></ProtectedRoute>} />
                <Route path="/usermanagement" element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading} requiredRole="admin"><UserManagement /></ProtectedRoute>} />
                <Route path="/bookingapprovals" element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading} requiredRole="admin"><BookingApprovals /></ProtectedRoute>} />
                <Route path="/calendarview" element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}><CalendarView /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}><Dashboard /></ProtectedRoute>} />
                <Route path="/events" element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}><Events /></ProtectedRoute>} />
                <Route path="/home" element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}><Home /></ProtectedRoute>} />
                <Route path="/mybookings" element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}><MyBookings /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}><Profile /></ProtectedRoute>} />
                <Route path="/resources" element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}><Resources /></ProtectedRoute>} />
                <Route path="/cart" element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}><Cart /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}><Checkout /></ProtectedRoute>} />
                <Route path="/orderconfirmation" element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}><OrderConfirmation /></ProtectedRoute>} />
                
                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return <PagesContent />;
}
