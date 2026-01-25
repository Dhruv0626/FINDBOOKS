const mongoose = require("mongoose");
const { Schema } = mongoose;

const refundPaymentSchema = new Schema({
  payment_id: {
    type: Schema.Types.ObjectId,
    ref: "Payment",
    required: true,
  },
  refund_date: {
    type: Date,
    default: Date.now,
  },
  refund_status: {
    type: String,
    required: true,
    enum: ["Pending", "Completed"],
  },
  refund_method: {
    type: String,
    enum: ["Online", "COD"],
    default: "Online",
  },
  reason: {
    type: String,
  },
  upi_id: {
    type: String,
  },
  bank_acc_no: {
    type: String,
  },
  ifsc_code: {
    type: String,
  },

  // ✅ Razorpay refund ID (optional, only for online payments)
  razorpay_refund_id: {
    type: String,
    default: null,
  },
});

const RefundPayment = mongoose.model("RefundPayment", refundPaymentSchema);

module.exports = RefundPayment;
