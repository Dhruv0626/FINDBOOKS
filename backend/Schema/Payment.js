const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema({
  payment_id: {
    type: String,
    primary_key : true
  },
  order_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Order' 
  },
  order_model: {
    type: String,
    required: true,
    default: "Order",
    enum: ['Order', 'Reseller','Order_Refund'] 
  },
  payment_date: {
    type: Date,
    // required: true
  },
  payment_method: {
    type: String,
    required: true,
    enum : ["Razorpay","COD"]
  },
  payment_status: {
    type: String,
    required: true,
    enum: ["Pending", "Completed", "Process", "Cancelled"]
  },
  total_payment: {
    type: Number,
    required: true
  },
  transaction_Type: {
    type: String,
    required: true,
    enum : ["credit",'debit','refund']
  }
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;