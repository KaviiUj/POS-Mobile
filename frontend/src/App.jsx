import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import POS from './pages/POS';
import Layout from './components/Layout';

function App() {
  const { accessToken } = useAuthStore();

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={!accessToken ? <Login /> : <Navigate to="/home" />} />
          <Route path="/home" element={accessToken ? <Home /> : <Navigate to="/login" />} />
          
          <Route path="/" element={accessToken ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="orders" element={<Orders />} />
          </Route>

          <Route path="*" element={<Navigate to={accessToken ? "/home" : "/login"} />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;

