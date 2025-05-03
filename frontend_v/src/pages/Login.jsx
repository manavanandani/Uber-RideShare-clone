import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../slices/authSlice';

const Login = () => {
    
  const dispatch = useDispatch();

  const { role } = useParams(); // 'customer', 'driver', or 'admin'
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(`/api/auth/${role}/login`, formData);
      const { token, data } = res.data;

      dispatch(loginSuccess({ token, user: data }));
      localStorage.setItem("token", token);

      navigate(`/dashboard/${role}`);
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <>
    <Navbar />
    
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-center">
          {role.charAt(0).toUpperCase() + role.slice(1)} Login
        </h2>

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
          className="input"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
          className="input"
        />

        <button type="submit" className="w-full bg-black text-white py-2 rounded hover:bg-gray-800">
          Login
        </button>

        {error && <p className="text-red-600 text-center">{error}</p>}
      </form>
    </div>
    </>
  );
};

export default Login;
