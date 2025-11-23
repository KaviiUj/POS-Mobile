import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuthStore } from './store/authStore';
import { useSessionCheck } from './hooks/useSessionCheck';
import Login from './pages/Login';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Orders from './pages/Orders';

function App() {
  const { accessToken } = useAuthStore();
  
  // Check session status periodically to detect if bill was settled
  useSessionCheck();

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={!accessToken ? <Login /> : <Navigate to="/home" />} />
          <Route path="/home" element={accessToken ? <Home /> : <Navigate to="/login" />} />
          <Route path="/cart" element={accessToken ? <Cart /> : <Navigate to="/login" />} />
          <Route path="/orders" element={accessToken ? <Orders /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;

