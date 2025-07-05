const express = require("express");
require("dotenv").config();
const router = express.Router();
const nodemailer = require("nodemailer");
const ReturnOrder = require("../Schema/ReturnOrder");
/*
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
*/
const multer = require("multer");
const path = require("path");
const Order = require("../Schema/Order");
const User = require("../Schema/User");
const Payment = require("../Schema/Payment");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.MY_EMAIL, pass: process.env.EMAIL_PASSWORD },
});

/*
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for file uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});
*/

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ensure this folder exists or create it
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.post("/returnorder", upload.single("image"), async (req, res) => {
  try {
    const { order_id, reason, additional_info } = req.body;

    if (!order_id || !reason) {
      return res
        .status(400)
        .json({ message: "order_id and reason are required" });
    }

    // Check if a return order already exists for this order_id
    const existingReturnOrder = await ReturnOrder.findOne({ order_id });
    if (existingReturnOrder) {
      return res
        .status(400)
        .json({
          message:
            "Return order form has already been submitted for this order.",
        });
    }

    const newReturnOrder = new ReturnOrder({
      order_id,
      reason,
      additional_info,
      image_url: req.file ? req.file.path : null,
    });

    const savedReturnOrder = await newReturnOrder.save();
    res.status(201).json(savedReturnOrder);
  } catch (error) {
    console.error("Error creating return order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// New GET endpoint to get all return orders with user first and last name
router.get("/returnorder", async (req, res) => {
  try {
    // Find all return orders sorted by creation date descending
    const returnOrders = await ReturnOrder.find({}).sort({ createdAt: -1 });

    // For each return order, fetch user details from Order schema
    const enrichedReturnOrders = await Promise.all(
      returnOrders.map(async (returnOrder) => {
        const order = await Order.findOne({ _id: returnOrder.order_id });
        let userFirstName = "";
        let userLastName = "";
        if (order) {
          const user = await User.findOne({ _id: order.User_id });
          if (user) {
            userFirstName = user.First_name || "";
            userLastName = user.Last_name || "";
          }
        }
        return {
          ...returnOrder.toObject(),
          userFirstName,
          userLastName,
        };
      })
    );

    res.json(enrichedReturnOrders);
  } catch (error) {
    console.error("Error fetching return orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//return order email for approve or reject the return request
router.put("/returnorder/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedReturnOrder = await ReturnOrder.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedReturnOrder) {
      return res.status(404).json({ message: "Return order not found" });
    }

    // Fetch order and user details
    const order = await Order.findOne({ _id: updatedReturnOrder.order_id });
    if (!order) {
      console.error(
        "Order not found for return order:",
        updatedReturnOrder._id
      );
      return res.status(404).json({ message: "Order not found" });
    }

    const payment = await Payment.findOne({ order_id: order._id });
    if (!payment) {
      return res
        .status(404)
        .json({ message: "Payment not found for this order" });
    }

    const payment_method = payment.payment_method;

    const user = await User.findOne({ _id: order.User_id });
    if (!user || !user.Email) {
      console.error("User not found or email missing for order:", order._id);
      return res
        .status(404)
        .json({ message: "User not found or email missing" });
    }

    // Compose email based on status
    let subject = "";
    let text = "";

    if (status === "Approved") {
      subject = "Your return order has been approved";

      if (payment_method === "Razorpay") {
        text = `Hello ${user.First_name || ""},

Your return order for Order ID ${order._id} has been approved.
Your book will be collected within 1-2 days. Your payment will be refunded within 5-7 working days to your original Razorpay payment method.

Thank you for using FindBooks!

Best regards,
FindBooks Team`;
      } else {
        text = `Hello ${user.First_name || ""},

Your return order for Order ID ${order._id} has been approved.
Your book will be collected within 1-2 days. Since your payment method was Cash on Delivery (COD), you are required to fill out the refund payment form to receive your refund.

Thank you for using FindBooks!

Best regards,
FindBooks Team`;
      }

      // Update the order's Order_Status
      await Order.findByIdAndUpdate(order._id, {
        Order_Status: "return-pending",
      });
    } else if (status === "Rejected") {
      subject = "Your return order has been rejected";
      text = `Hello ${user.First_name || ""},

We regret to inform you that your return order for Order ID ${
        order._id
      } has been rejected.

If you have any questions, please contact our support team.

Thank you for using FindBooks!

Best regards,
FindBooks Team`;
    }

    // Send email
    try {
      await transporter.sendMail({
        from: process.env.MY_EMAIL.trim(),
        to: user.Email,
        subject,
        text,
      });
      console.log("📧 Return status email sent to:", user.Email);
    } catch (emailError) {
      console.error("❌ Error sending return order status email:", emailError);
      // Continue even if email fails
    }

    res.json(updatedReturnOrder);
  } catch (error) {
    console.error("❌ Error updating return order status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
