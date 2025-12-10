import './index.css'
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminBookings from "./pages/AdminBookings";
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/admin/bookings" element={<AdminBookings />} />
      </Routes>
    </Router>
    
  )
}

export default App
