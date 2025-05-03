import { useParams } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const Register = () => {
  const { role } = useParams();
  const isCustomer = role === "customer";
  const [formData, setFormData] = useState({
    customer_id: "",
    first_name: "",
    last_name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    phone: "",
    email: "",
    password: "",
    credit_card: {
      number: "",
      expiry: "",
      name_on_card: "",
      cvv: ""
    }
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("credit_card.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        credit_card: { ...prev.credit_card, [key]: value }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isCustomer) {
        console.log("Submitting form data:", formData);

        const res = await axios.post("/api/auth/customer/register", formData);
        console.log(res.data);
        setMessage("Registration successful! You can now log in.");
      } else {
        setMessage("Driver/Admin registration not implemented yet.");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed");
      console.error(err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-lg space-y-4">
        <h2 className="text-2xl font-bold text-center">
          {role.charAt(0).toUpperCase() + role.slice(1)} Registration
        </h2>

        {isCustomer && (
          <>
            <input name="customer_id" placeholder="SSN (XXX-XX-XXXX)" onChange={handleChange} required className="input" />
            <input name="first_name" placeholder="First Name" onChange={handleChange} required className="input" />
            <input name="last_name" placeholder="Last Name" onChange={handleChange} required className="input" />
            <input name="address" placeholder="Address" onChange={handleChange} required className="input" />
            <input name="city" placeholder="City" onChange={handleChange} required className="input" />
            <input name="state" placeholder="State (e.g. CA)" onChange={handleChange} required className="input" />
            <input name="zip_code" placeholder="ZIP Code" onChange={handleChange} required className="input" />
            <input name="phone" placeholder="Phone Number" onChange={handleChange} required className="input" />
            <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="input" />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} required className="input" />

            <h3 className="font-semibold mt-4">Credit Card Info</h3>
            <input name="credit_card.number" placeholder="Card Number" onChange={handleChange} required className="input" />
            <input name="credit_card.expiry" placeholder="Expiry (MM/YY)" onChange={handleChange} required className="input" />
            <input name="credit_card.name_on_card" placeholder="Name on Card" onChange={handleChange} required className="input" />
            <input name="credit_card.cvv" placeholder="CVV" onChange={handleChange} required className="input" />
          </>
        )}

        <button type="submit" className="w-full bg-black text-white py-2 rounded hover:bg-gray-800">
          Register
        </button>

        {message && <p className="text-center text-red-600">{message}</p>}
      </form>
      </div>
    </>
  );
};

export default Register;
