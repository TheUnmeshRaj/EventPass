// Minimal admin API helpers. Adjust base URL if your client proxies /api to the backend.
const getAuthHeader = () => {
  // This assumes you store a JWT in localStorage under "token".
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getAllBookings() {
  const res = await fetch("/api/admin/bookings", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function updateBookingStatus(id, payload) {
  const res = await fetch(`/api/admin/bookings/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}