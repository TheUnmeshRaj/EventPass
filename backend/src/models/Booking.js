// Example Mongoose model. If you already have a Booking schema, adapt accordingly.
const mongoose = require("mongoose");
const { Schema } = mongoose;

const BookingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    seats: { type: Number, default: 1 },
    status: { type: String, enum: ["pending", "confirmed", "cancelled", "refunded"], default: "pending" },
    totalPrice: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    // Add any payment or metadata fields you need
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);