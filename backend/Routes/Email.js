const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../Schema/User");
const router = express.Router();
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Book = require("../Schema/Book");
const Otp = require("../Schema/otp");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ Email: email });

  if (!user || user.otp !== otp) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.otp = null;
  await user.save();

  res.json("{ message: OTP verified }");
});


transporter.verify(function (error, success) {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to take messages");
  }
});

router.post("/:otpmessage/forgot-password", async (req, res) => {
  const { otpmessage } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ Email: email.toLowerCase() });

    if (!user) return res.status(400).json({ message: "User not found" });

    const otp = crypto.randomInt(100000, 999999);
    user.otp = otp;
    await user.save();

    let sendmessage;
    switch (otpmessage) {
      case "forgotpassword":
        sendmessage = `Your OTP to reset your password is: ${otp}. 
Do not share this code with anyone. It will expire in 10 minutes.`;
        break;
      case "deliverydetail":
        sendmessage = `Your delivery confirmation OTP is: ${otp}. 
Please provide this code to the delivery agent to receive your order.`;
        break;
      case "reselldelivery":
        sendmessage = `Your OTP to collect the resell product is: ${otp}. 
Please provide this code to the delivery agent to complete the pickup. 
Do not share this code with anyone. It is valid for 10 minutes.`;
        break;
      default:
        sendmessage = `Your OTP is: ${otp}. Do not share it with anyone.`;
        break;
    }

    await transporter.sendMail({
      to: email,
      subject: "FINDBOOKS - OTP Verification Code",
      text: sendmessage,
    });

    res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      message:
        "Failed to send OTP email. Please check your internet connection and try again.",
    });
  }
});

router.post("/registerotp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const OTP = crypto.randomInt(100000, 999999).toString();

  try {
    const existingOtp = await Otp.findOne({ email });

    if (existingOtp) {
      existingOtp.otp = OTP;
      await existingOtp.save();
    } else {
      const otp = new Otp({ email, otp: OTP });
      await otp.save();
    }

    try {
      await transporter.sendMail({
        to: email,
        subject: "FINDBOOKS - OTP Verification Code",
        text: `Welcome to FINDBOOKS! Your verification OTP is: ${OTP}. 
It will expire in 10 minutes. Please do not share this code with anyone.`,
      });
    } catch (mailError) {
      console.error("Error sending email:", mailError);
      return res.status(500).json({ message: "Failed to send OTP email." });
    }

    res.json({ message: "OTP sent. Please verify your email.", email });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res
      .status(500)
      .json({ message: "Failed to send OTP. Please try again later." });
  }
});

router.post('/verifyotp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const otpRecord = await Otp.findOne({ email: email.toLowerCase() });

    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP not found or expired' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    await Otp.deleteOne({ email });

    res.json({ message: 'OTP verified successfully' });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

router.post("/send-seller-email", async (req, res) => {
  const { sellerEmail, bookTitle } = req.body;

  if (!sellerEmail || !bookTitle) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const mailOptions = {
    from: process.env.MY_EMAIL.trim(),
    to: sellerEmail,
    subject: "Your resell book has been purchased!",
    text: `Hello,

Your resell book titled "${bookTitle}" has been purchased.

Please contact the buyer to proceed with the transaction.

Thank you for using FindBooks!

Best regards,
FindBooks Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent to seller successfully" });
  } catch (error) {
    console.error("Error sending email to seller:", error);
    res.status(500).json({ message: "Failed to send email to seller" });
  }
});

router.get("/seller-email/:bookId", async (req, res) => {
  const { bookId } = req.params;
  try {
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const user = await User.findById(book.User_id);
    if (!user || !user.Email) {
      return res
        .status(404)
        .json({ message: "User not found or email missing" });
    }

    // Compose the email
    const mailOptions = {
      from: process.env.MY_EMAIL.trim(),
      to: user.Email,
      subject: "Your book has been purchased!",
      text: `Hello ${user.First_name || ""},

Your book titled "${book.Title}" has been purchased by a customer.

Please prepare the book for delivery or further instructions.

Thank you for using FindBooks!

Best regards,  
FindBooks Team`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: `Email sent to ${user.Email}` });
  } catch (error) {
    console.error("Error sending purchase email to seller:", error);
    res.status(500).json({ message: "Failed to notify seller" });
  }
});

//if reseller book purchase cancelled email to reseller
router.post("/cancel-seller-email/:bookId", async (req, res) => {
  const { bookId } = req.params;

  try {
    // Find the book using its ID
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Find the seller using the User_id in the book
    const user = await User.findById(book.User_id);
    if (!user || !user.Email) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const mailOptions = {
      from: process.env.MY_EMAIL.trim(),
      to: user.Email,
      subject: "Your resell book order has been cancelled",
      text: `Hello,

We regret to inform you that the order for your resell book titled "${book.Book_title}" has been canceled.

now your book stay on our platform as it is untill is validity time.

Thank you for using FindBooks!

Best regards,  
FindBooks Team`,
    };

    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json({ message: "Cancellation email sent to seller successfully" });
  } catch (error) {
    console.error("Error sending cancellation email:", error);
    res
      .status(500)
      .json({ message: "Failed to send cancellation email to seller" });
  }
});

router.post("/send-resell-delivery-email", async (req, res) => {
  const { email, bookTitle } = req.body;

  if (!email || !bookTitle) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const mailOptions = {
    from: process.env.MY_EMAIL.trim(),
    to: email,
    subject: "Resell Book Delivery Collection Confirmation",
    text: `Hello,

This is to confirm that the delivery agent has collected the resell book titled "${bookTitle}" from your address.

Thank you for using FindBooks!

Best regards,
FindBooks Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json({ message: "Resell delivery collection email sent successfully" });
  } catch (error) {
    console.error("Error sending resell delivery email:", error);
    res.status(500).json({ message: "Failed to send resell delivery email" });
  }
});

router.post("/send-reseller-payment-email", async (req, res) => {
  const { email, amount } = req.body;

  if (!email || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const mailOptions = {
    from: process.env.MY_EMAIL.trim(),
    to: email,
    subject: "Reseller Payment Confirmation",
    text: `Hello,

This is to confirm that a payment of amount ₹${amount} has been made to your reseller account.

Thank you for using FindBooks!

Best regards,
FindBooks Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({
      message: "Reseller payment confirmation email sent successfully",
    });
  } catch (error) {
    console.error("Error sending reseller payment email:", error);
    res.status(500).json({ message: "Failed to send reseller payment email" });
  }
});

router.post("/cancel-order", async (req, res) => {
  const { email, orderId, orderDetails, paymentMethod } = req.body;

  if (!email || !orderId || !paymentMethod) {
    return res.status(400).json({
      message: "Missing required fields: email, orderId or paymentMethod",
    });
  }

  let subject = "Order Cancellation";
  let text = `Hello, We regret to inform you that your order with Order ID: ${orderId} has been cancelled.`;

  if (paymentMethod.toLowerCase() === "cod") {
    subject = "Order Cancellation - Cash on Delivery";
    text += `Payment Method: Cash on Delivery (COD)`;
  } else if (paymentMethod.toLowerCase() === "razorpay") {
    subject = "Order Cancellation - Razorpay Payment";
    text += `Payment Method: Razorpay
   Your online payment amount will be refunded by us in 5-7 working days.
`;
  } else {
    text += `Payment Method: ${paymentMethod}`;
  }

  text += `Order Details:
  ${orderDetails ? orderDetails : "No additional details provided."}

  If you have any questions, please contact our support team.

  Thank you for using FindBooks!

  Best regards,
  FindBooks Team`;

  const mailOptions = {
    from: process.env.MY_EMAIL.trim(),
    to: email,
    subject: subject,
    text: text,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({
      message: `Cancellation email sent successfully for payment method: ${paymentMethod}`,
    });
  } catch (error) {
    console.error(
      `Error sending cancellation email for payment method ${paymentMethod}:`,
      error
    );
    res.status(500).json({
      message: `Failed to send cancellation email for payment method: ${paymentMethod}`,
    });
  }
});

router.post("/refund-success", async (req, res) => {
  const { email, amount, orderId } = req.body;

  if (!email || !amount) {
    return res
      .status(400)
      .json({ message: "Missing required fields: email or amount" });
  }

  let subject = "Refund Payment Successful";
  let text = `Hello,

  We are pleased to inform you that your refund payment of ₹${amount} has been successfully processed by Findbooks.`;

  if (orderId) {
    text += `Order ID: ${orderId}`;
  }

  text += `
  If you have any questions, please contact our support team.

  Thank you for using FindBooks!

  Best regards,
  FindBooks Team`;

  const mailOptions = {
    from: process.env.MY_EMAIL.trim(),
    to: email,
    subject: subject,
    text: text,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Refund success email sent successfully" });
  } catch (error) {
    console.error("Error sending refund success email:", error);
    res.status(500).json({ message: "Failed to send refund success email" });
  }
});



router.post('/return-order-status', async (req, res) => {
  const { email, answer } = req.body;

  if (!email || !answer) {
    return res.status(400).json({ message: "Missing required fields: email or answer" });
  }

  let subject = "Return Order Request Status";
  let text = `Hello,`;

  if (answer.toLowerCase() === "success" || answer.toLowerCase() === "approved") {
    text += `Your payment amount will be refunded by us in 5-7 working days.`;
  } else {
    text += `Unfortunately, your return order request has been rejected.`;
  }

  text += `If you have any questions, please contact our support team.

  Thank you for using FindBooks!

  Best regards,
  FindBooks Team`;

  const mailOptions = {
    from: process.env.MY_EMAIL.trim(),
    to: email,
    subject: subject,
    text: text
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Return order status email sent successfully" });
  } catch (error) {
    console.error("Error sending return order status email:", error);
    res.status(500).json({ message: "Failed to send return order status email" });
  }
});

module.exports = router;
