import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      <Navbar />
      

      {/* HERO SECTION */}
      <div className="flex flex-col md:flex-row items-center justify-between px-8 py-16">
        {/* Text Block */}
        <div className="max-w-xl">
          <h2 className="text-4xl font-bold mb-4">Go anywhere with Uber</h2>
          <p className="mb-6 text-gray-700">Simulate the Uber experience. Choose a role and explore the system.</p>
          <div className="space-x-4">
            <Link to="/login/customer" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">Customer Login</Link>
            <Link to="/login/driver" className="px-4 py-2 border border-black text-black rounded hover:bg-gray-100">Driver Login</Link>
            <Link to="/login/admin" className="px-4 py-2 border border-black text-black rounded hover:bg-gray-100">Admin Login</Link>
          </div>
        </div>

        {/* Image Block */}
        <div className="mt-10 md:mt-0 md:ml-10">
          <img
            src="https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_491,w_872/v1740003576/assets/af/1bf8ca-f992-4607-8df4-42f3faf60a1e/original/The-driver-takes-the-rider-to-the-destination.png"
            alt="UberSim illustration"
            className="w-full max-w-md"
          />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
