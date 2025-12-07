import React, { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { refreshToken } from "../../features/Auth/authSlice";
import { API_BASE, getAccessToken } from "../../features/Auth/authSlice";

const AllContact = () => {
  const dispatch = useDispatch();

  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  const API_URL = `${API_BASE}/list_vila/contect/`;

  const authFetch = async (url: string, options: any = {}) => {
    const access = getAccessToken();

    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: access ? `Bearer ${access}` : "",
        ...(options.headers || {}),
      },
    });

    return res;
  };

  const loadContacts = async () => {
    try {
      let res = await authFetch(API_URL);

      if (res.status === 401) {
        const refreshResult = await dispatch(refreshToken());
        if (refreshToken.fulfilled.match(refreshResult)) {
          res = await authFetch(API_URL);
        } else {
          throw new Error("Session expired. Login again.");
        }
      }

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }

      let data = await res.json();

      // Reverse the order
      if (Array.isArray(data)) {
        data = data.reverse();
      }

      setContacts(data);
    } catch (err: any) {
      setError(err.message || "Error loading contact list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  // Open Modal
  const openModal = (contact: any) => {
    setSelectedMessage(contact);
    setShowModal(true);
  };

  // Filtered contacts by search term
  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts;

    const q = searchTerm.toLowerCase();
    return contacts.filter((c: any) => {
      const name = (c.name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const message = (c.message || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        message.includes(q)
      );
    });
  }, [contacts, searchTerm]);

  return (
    <div className="px-6 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        All Contact Messages
      </h1>

      {/* Search bar (centered) */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, phone, or message..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
        />
      </div>

      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 p-6 rounded-lg shadow-lg flex flex-col items-center pointer-events-auto">
            <svg
              className="animate-spin h-10 w-10 text-teal-600 mb-3"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <div className="text-sm text-gray-700">Loading Booking...</div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-lg bg-red-50 p-3 rounded-md">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg shadow-xl border border-gray-200">
          <table className="min-w-full bg-white rounded-lg">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">No</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Phone</th>
                <th className="py-3 px-4 text-left">Message</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-6 text-gray-500"
                  >
                    No contact messages found.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact: any, inx: number) => (
                  <tr
                    key={contact.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4 font-medium">{inx + 1}</td>
                    <td className="py-3 px-4 font-medium">{contact.name}</td>
                    <td className="py-3 px-4">{contact.email}</td>
                    <td className="py-3 px-4">{contact.phone}</td>
                    <td className="py-3 px-4 truncate max-w-[150px]">
                      {contact.message}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {contact.created_at
                        ? new Date(contact.created_at).toLocaleString()
                        : "N/A"}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => openModal(contact)}
                        className="bg-teal-600 text-white text-sm px-3 py-1 rounded-md hover:bg-teal-500"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 flex items-center justify-center  bg-opacity-40  z-50">
          <div className="bg-white w-11/12 sm:w-2/3 lg:w-1/3 rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Message Details
            </h2>

            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Name:</span>{" "}
              {selectedMessage.name}
            </p>

            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Email:</span>{" "}
              {selectedMessage.email}
            </p>

            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Phone:</span>{" "}
              {selectedMessage.phone}
            </p>

            <p className="text-gray-700 mb-4">
              <span className="font-semibold">Message:</span>
              <br />
              {selectedMessage.message}
            </p>

            <p className="text-gray-500 text-sm mb-4">
              <span className="font-semibold">Date:</span>{" "}
              {new Date(selectedMessage.created_at).toLocaleString()}
            </p>

            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-800 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllContact;
