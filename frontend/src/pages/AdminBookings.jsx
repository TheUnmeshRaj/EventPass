import React, { useEffect, useState } from "react";
import { getAllBookings, updateBookingStatus } from "../api/adminBookings";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getAllBookings()
      .then((data) => {
        setBookings(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load bookings");
        setLoading(false);
      });
  }, []);

  const changeStatus = async (id, newStatus) => {
    try {
      const updated = await updateBookingStatus(id, { status: newStatus });
      setBookings((prev) => prev.map((b) => (b._id === id ? updated : b)));
    } catch (err) {
      alert("Failed to update booking: " + (err.message || err));
    }
  };

  if (loading) return <div>Loading bookings...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!bookings.length) return <div>No bookings yet.</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>All Bookings (Admin)</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>ID</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>User</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Event</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Seats</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Status</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id}>
              <td style={{ border: "1px solid #ddd", padding: 8 }}>{b._id}</td>
              <td style={{ border: "1px solid #ddd", padding: 8 }}>
                {b.user?.name || b.user?.email || "—"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: 8 }}>
                {b.event?.title || b.eventId || "—"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: 8 }}>{b.seats}</td>
              <td style={{ border: "1px solid #ddd", padding: 8 }}>{b.status}</td>
              <td style={{ border: "1px solid #ddd", padding: 8 }}>
                {b.status !== "confirmed" && (
                  <button onClick={() => changeStatus(b._id, "confirmed")}>
                    Confirm
                  </button>
                )}
                {b.status !== "cancelled" && (
                  <button
                    onClick={() => changeStatus(b._id, "cancelled")}
                    style={{ marginLeft: 8 }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => changeStatus(b._id, "refunded")}
                  style={{ marginLeft: 8 }}
                >
                  Refund
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}