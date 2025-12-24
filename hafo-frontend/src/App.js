import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Import Customer
import LandingPage from './pages/Customer/LandingPage';
import Home from './pages/Customer/Home';
import RestaurantDetail from './pages/Customer/RestaurantDetail';
import Cart from './pages/Customer/Cart';
import Checkout from './pages/Customer/Checkout';
import OrderTracking from './pages/Customer/OrderTracking';
import ReviewOrder from './pages/Customer/ReviewOrder';
import History from './pages/Customer/History';
import Profile from './pages/Customer/Profile';
import MerchantRegister from './pages/Register/MerchantRegister';
import ShipperRegister from './pages/Register/ShipperRegister';
import PendingApproval from './pages/Auth/PendingApproval';
import ChatBot from './components/ChatBot';

// Import Merchant
import MerchantLayout from './pages/Merchant/MerchantLayout';
import Menu from './pages/Merchant/Menu';
import Dashboard from './pages/Merchant/Dashboard';
import Orders from './pages/Merchant/Orders';
import MerchantWallet from './pages/Merchant/MerchantWallet';
import MerchantPromos from './pages/Merchant/MerchantPromos';
import Reviews from './pages/Merchant/Reviews';
import Storefront from './pages/Merchant/Storefront';

// Import Shipper
import ShipperProfile from './pages/Shipper/ShipperProfile';
import ShipperLayout from './pages/Shipper/ShipperLayout';
import ShipperDashboard from './pages/Shipper/ShipperDashboard';
import ShipperOrderDetail from './pages/Shipper/ShipperOrderDetail';
import ShipperHistory from './pages/Shipper/ShipperHistory';
import ShipperWallet from './pages/Shipper/ShipperWallet';

// Import Admin
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/Dashboard';
import Users from './pages/Admin/Users';
import Shops from './pages/Admin/Shops';
import AdminShippers from './pages/Admin/Shippers';
import AdminOrders from './pages/Admin/AdminOrders';
import Complaints from './pages/Admin/Complaints';
import Pending from './pages/Admin/Pending';
import Settings from './pages/Admin/Settings';

function App() {
  const { user, loading } = useAuth(); // Lấy thêm loading từ Context

  if (loading) return null; // Hoặc một cái spinner loading nào đó

  // Hàm quyết định trang chủ
  const getMainPage = () => {
    // Nếu chưa đăng nhập -> Về trang chào mừng
    if (!user) return <LandingPage />;

    // Nếu có user, kiểm tra role
    // Dùng optional chaining ?. để an toàn tuyệt đối
    if (user?.role === 'pending_merchant') return <Navigate to="/register/merchant" />;
    if (user?.role === 'pending_shipper') return <Navigate to="/register/shipper" />;

    switch (user?.role) {
      case 'merchant': return <Navigate to="/merchant/dashboard" />;
      case 'shipper': return <Navigate to="/shipper/dashboard" />;
      case 'admin': return <Navigate to="/admin/dashboard" />;
      default: return <Home />; // Customer
    }
  };

  const showChatBot = user?.role === 'customer';

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={getMainPage()} />

          <Route path="/home" element={<Home />} />

          {/* Customer Routes */}
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-tracking/:id" element={<OrderTracking />} />
          <Route path="/review/:id" element={<ReviewOrder />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/register/merchant" element={<MerchantRegister />} />
          <Route path="/register/shipper" element={<ShipperRegister />} />

          {/* Merchant Routes - Bảo vệ bằng user?.role */}
          <Route path="/merchant" element={user?.role === 'merchant' ? <MerchantLayout /> : <Navigate to="/" />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="menu" element={<Menu />} />
            <Route path="orders" element={<Orders />} />
            <Route path="wallet" element={<MerchantWallet />} />
            <Route path="promos" element={<MerchantPromos />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="storefront" element={<Storefront />} />
          </Route>

          {/* Shipper Routes */}
          <Route path="/shipper" element={user?.role === 'shipper' ? <ShipperLayout /> : <Navigate to="/" />}>
            <Route index element={<ShipperDashboard />} />
            <Route path="dashboard" element={<ShipperDashboard />} />
            <Route path="order/:id" element={<ShipperOrderDetail />} />
            <Route path="history" element={<ShipperHistory />} />
            <Route path="wallet" element={<ShipperWallet />} />
            <Route path="profile" element={<ShipperProfile />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={user?.role === 'admin' ? <AdminLayout /> : <Navigate to="/" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="shops" element={<Shops />} />
            <Route path="shippers" element={<AdminShippers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="pending" element={<Pending />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>

        {/* Chatbot */}
        {showChatBot && <ChatBot />}
      </div>
    </Router>
  );
}

export default App;