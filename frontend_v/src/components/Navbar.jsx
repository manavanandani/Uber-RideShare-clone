import { Link } from "react-router-dom";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../slices/authSlice";
import { useNavigate } from "react-router-dom";


const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };


  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-black text-white relative z-10">
      <h1 className="text-2xl font-bold">Uber</h1>

      <div className="flex items-center space-x-6">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/about" className="hover:underline">About</Link>


        <div
          className="relative"
          onMouseEnter={() => setShowLogin(true)}
          onMouseLeave={() => setShowLogin(false)}
        >
          <button className="hover:underline">Login</button>
          {showLogin && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg">
              <Link to="/login/customer" className="block px-4 py-2 hover:bg-gray-100">Customer</Link>
              <Link to="/login/driver" className="block px-4 py-2 hover:bg-gray-100">Driver</Link>
              <Link to="/login/admin" className="block px-4 py-2 hover:bg-gray-100">Admin</Link>
            </div>
          )}
        </div>
        

        <div
          className="relative"
          onMouseEnter={() => setShowRegister(true)}
          onMouseLeave={() => setShowRegister(false)}
        >
          <button className="hover:underline">Register</button>
          {showRegister && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg">
              <Link to="/register/customer" className="block px-4 py-2 hover:bg-gray-100">Customer</Link>
              <Link to="/register/driver" className="block px-4 py-2 hover:bg-gray-100">Driver</Link>
              <Link to="/register/admin" className="block px-4 py-2 hover:bg-gray-100">Admin</Link>
            </div>

            
          )}
        </div>
        {token && (
        <button
            onClick={handleLogout}
            className="ml-4 bg-white text-black px-3 py-1 rounded hover:bg-gray-200"
        >
            Logout
        </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
