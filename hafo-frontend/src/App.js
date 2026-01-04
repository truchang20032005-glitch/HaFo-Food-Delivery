import React from 'react';
import 'animate.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import 'leaflet/dist/leaflet.css';

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
import Support from './pages/Customer/Support';
import BecomePartner from './pages/Customer/BecomePartner';
import Chat from './components/Chat';
// Đăng kí đối tác
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
import Pending from './pages/Admin/Pending';
import Settings from './pages/Admin/Settings';
import AdminTransactions from './pages/Admin/AdminTransactions';
import AdminReports from './pages/Admin/AdminReports';

function App() {
  const { user, loading } = useAuth(); // Lấy thêm loading từ Context

  if (loading) return null; // Hoặc một cái spinner loading nào đó

  // Hàm quyết định trang chủ
  const getMainPage = () => {
    if (!user) return <LandingPage />;

    // TRƯỜNG HỢP 1: Đã nộp hồ sơ và đang chờ Admin duyệt
    // (Dựa vào approvalStatus: 'pending' mà backend cập nhật sau khi gửi form)
    if (user?.approvalStatus === 'pending') {
      return <Navigate to="/pending-approval" />;
    }

    // TRƯỜNG HỢP 2: Đã đăng ký tài khoản nhưng chưa điền/gửi form thông tin đối tác
    // (Lúc này role vẫn là pending_merchant/shipper nhưng approvalStatus chưa là pending)
    if (user?.role === 'pending_merchant') {
      return <Navigate to="/register/merchant" />;
    }
    if (user?.role === 'pending_shipper') {
      return <Navigate to="/register/shipper" />;
    }

    // TRƯỜNG HỢP 3: Hồ sơ đã được duyệt hoặc là khách hàng bình thường
    switch (user?.role) {
      case 'merchant': return <Navigate to="/merchant/dashboard" />;
      case 'shipper': return <Navigate to="/shipper/dashboard" />;
      case 'admin': return <Navigate to="/admin/dashboard" />;
      default: return <Home />; // Customer bình thường
    }
  };

  const showChatBot = user?.role === 'customer';

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={getMainPage()} />
          <Route path="/chat/:orderId" element={<Chat />} />

          {/* LOGIC ĐIỀU HƯỚNG TRANG CHỦ THÔNG MINH */}
          <Route path="/" element={getMainPage()} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/support" element={<Support />} /> {/* Thêm dòng này */}
          <Route path="/become-partner" element={<BecomePartner />} />
          {/* Đường dẫn rõ ràng cho Khách hàng (để Merchant cũng có thể xem giao diện khách nếu muốn) */}
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
            <Route path="pending" element={<Pending />} />
            <Route path="settings" element={<Settings />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>
        </Routes>

        {/* Chatbot */}
        {showChatBot && <ChatBot />}
      </div>
    </Router>
  );
}

export default App;