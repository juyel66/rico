import React, { useState } from "react";
import Swal from "sweetalert2";
import Affiliates from "../Home/Component/Affiliates";


// Define types for cleaner React code
interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const Contact = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const API_URL = `${import.meta.env.VITE_API_BASE}/list_vila/contect/`;

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // <--- Sending JSON
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to send message");
      }

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Message sent successfully!",
      })
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess(false);
        setError(null);
      }, 4000);
    }
  };
  



  return (
<div>
      <section className=" py-16 md:py-24 lg:py-28 container  mx-auto px-4 sm:px-6 lg:px-8 ">
      <div>
        {/* Main Heading */}
        <h2 className="text-4xl font-semibold text-gray-900 text-center mb-16 ">
          Let's Connect
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* LEFT COLUMN: Contact Form */}
          <div className=" p-8 rounded-3xl shadow-lg border border-gray-200">
            <p className="text-xl font-semibold text-gray-700 mb-6">
              Get In Touch
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm"
                  placeholder="Alex"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email and Phone Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm"
                    placeholder="demo@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Phone Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm"
                    placeholder="Enter Your Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  rows={4}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm"
                  placeholder="Write Your Message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              {/* Status Messages */}
              {loading && (
                <p className="text-center text-blue-600 font-semibold">
                  Sending message...
                </p>
                
              )}

              {success && (
                <p className="text-center text-green-600 font-semibold bg-green-50 p-3 rounded-lg">
                  Message sent successfully!
                </p>
                
              )}

              {error && (
                <p className="text-center text-red-600 font-semibold bg-red-50 p-3 rounded-lg">
                  Failed to send: {error}
                </p>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 rounded-lg text-lg font-medium text-white bg-teal-600 hover:bg-teal-700"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Image */}
          <div>
            <img
              src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835086/Frame_1000004224_1_zrb6bg.png"
              alt="Contact illustration"
              className="w-full h-auto rounded-xl shadow-xl"
            />
          </div>
        </div>
      </div>

      <div className="mt-20">
      
     
      </div>
    </section>


    <div>
      <Affiliates />
    </div>
</div>
  );
};

export default Contact;
