const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const Authmid = require("../middleware/AuthMid");
const Book = require("../Schema/Book");
const Reseller = require("../Schema/Reseller");
const User = require("../Schema/User");

router.get("/SellOrders", Authmid, async (req, res) => {
  try {
    // Fetch all reseller data of the logged-in user
    const Resellerdata = await Reseller.find({ User_id: req.userId });

    // Extract all book IDs from reseller data
    const bookIds = Resellerdata.map((reseller) => reseller.Book_id);

    // Fetch all books related to those book IDs
    const books = await Book.find({ _id: { $in: bookIds } });

    res.json({ books, resellerdata: Resellerdata });
  } catch (error) {
    console.error("Error fetching Sell Order data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/SellOrder", Authmid, async (req, res) => {
  try {
    const reseller = await Reseller.find({}).populate(
      "User_id",
      "First_name Last_name"
    );
    const bookid = reseller.map((reseller) => reseller.Book_id);
    const userid = reseller.map((reseller) => reseller.User_id);

    const books = await Book.find({ _id: { $in: bookid } });
    const users = await User.find({ _id: { $in: userid } });

    res.json({
      reseller: reseller,
      books: books,
      users: users,
      delivery: req.userId,
    });
  } catch (error) {
    console.error("Error fetching Sell Order data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/resellerbook", async (req, res) => {
  try {
    // Fetch all resellers and populate user details including Email
    const resellers = await Reseller.find().populate({
      path: "User_id",
      select: "First_name Last_name Email",
    });

    // Get unique Book IDs from resellers
    const bookIds = resellers.map((reseller) => reseller.Book_id);

    // Fetch books that are in reseller list
    const books = await Book.find({ _id: { $in: bookIds } });

    res.json({ resellers, books });
  } catch (error) {
    console.error("Error fetching Sell Order data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/SellOrders", Authmid, async (req, res) => {
  try {
    const { payment, resellerid, bookid, status } = req.body;

    // Prepare update object
    let updateFields = {};
    if (status !== undefined) {
      updateFields.Resell_Status = status;
      updateFields.Delivery_User_id = req.userId;
    }
    if (payment !== undefined) {
      updateFields.Payment = payment;
    }

    // Update the reseller document
    const resellerUpdate = await Reseller.updateOne(
      { _id: resellerid },
      { $set: updateFields }
    );

    // Check if reseller update was successful
    if (resellerUpdate.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Reseller not found or already updated" });
    }

    res.status(200).json({ message: "Sell order updated successfully" });
  } catch (error) {
    console.error("Error updating Sell Order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
