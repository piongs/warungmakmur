import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Stock from "./pages/Stock";
import Transactions from "./pages/Transactions";
import TransactionDetail from "./pages/TransactionDetail";
import Receipt from "./pages/Receipt";
import ReportsSales from "./pages/ReportsSales";
import ReportsProducts from "./pages/ReportsProducts";
import ReportsStock from "./pages/ReportsStock";
import Settings from "./pages/Settings";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/receipt/:invoiceNumber" element={<Receipt />} />

      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/pos" element={<PrivateRoute><POS /></PrivateRoute>} />
      <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
      <Route path="/categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
      <Route path="/stock" element={<PrivateRoute><Stock /></PrivateRoute>} />
      <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
      <Route path="/transactions/:id" element={<PrivateRoute><TransactionDetail /></PrivateRoute>} />
      <Route path="/reports/sales" element={<PrivateRoute><ReportsSales /></PrivateRoute>} />
      <Route path="/reports/products" element={<PrivateRoute><ReportsProducts /></PrivateRoute>} />
      <Route path="/reports/stock" element={<PrivateRoute><ReportsStock /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
