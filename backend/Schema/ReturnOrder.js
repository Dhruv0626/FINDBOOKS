const mongoose = require('mongoose');
const { Schema } = mongoose;

const returnOrderSchema = new Schema({
  order_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Order'
  },
  reason: {
    type: String,
    required: true
  },
  additional_info: {
    type: String
  },
  image_url: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

const ReturnOrder = mongoose.model('ReturnOrder', returnOrderSchema);

module.exports = ReturnOrder;
