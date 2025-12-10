// Express router for admin booking management.
// Place this file under your backend routes directory and mount at /api/admin
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const isAdmin = require("../middleware/isAdmin");

// GET /api/admin/bookings
router.get("/bookings", isAdmin, async (req, res) => {
  try {
    // Example: populate user and event if you store references
    const bookings = await Booking.find().populate("user", "name email").populate("event", "title date");
    res.json(bookings);
  } catch (err) {
    console.error("GET /admin/bookings error:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// PATCH /api/admin/bookings/:id
router.patch("/bookings/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  const update = req.body;
  try {
    const booking = await Booking.findByIdAndUpdate(id, update, { new: true })
      .populate("user", "name email")
      .populate("event", "title date");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    console.error("PATCH /admin/bookings/:id error:", err);
    res.status(500).json({ message: "Failed to update booking" });
  }
});

module.exports = router;