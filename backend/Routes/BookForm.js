const express = require("express");
require("dotenv").config();
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const Book = require("../Schema/Book");
const Subcategory = require("../Schema/Subcategory");
const Authmid = require("../middleware/AuthMid");

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const router = express.Router();

// 🔧 Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📦 Multer Storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "books",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    public_id: (req, file) => Date.now() + "-" + file.originalname,
  },
});

const upload = multer({ storage });

router.post(
  "/:userRole/Book",
  Authmid,
  upload.single("image"),

  (req, res, next) => {
    if (req.body.Board === "null" || req.body.Board === "undefined" || req.body.Board === "") req.body.Board = null;
    if (req.body.Class === "null" || req.body.Class === "undefined" || req.body.Class === "") req.body.Class = null;
    next();
  },

  [
    body("BookName").notEmpty().withMessage("Please, Enter book name"),
    body("Author").notEmpty().withMessage("Please, Enter book author"),
    body("Edition"),
    body("Publication_Date").notEmpty().withMessage("Please, Enter publication date"),
    body("Publisher").notEmpty().withMessage("Please, Enter book publisher"),
    body("Description").notEmpty().withMessage("Please, Enter book description"),
    body("Price").notEmpty().withMessage("Please, Enter book price"),
    body("Quantity").optional().isInt({ min: 0 }).withMessage("Quantity must be a non-negative integer"),
    body("ISBN").notEmpty().withMessage("Please, Enter book ISBN"),
    body("Condition"),
    body("SubCategory").notEmpty().withMessage("Please enter subcategory"),
    body("Board").optional({ nullable: true }).isIn(["CBSE", "ICSE", "Other"]).withMessage("Invalid Board value"),
    body("Class").optional({ nullable: true }).isIn([
      "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6",
      "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"
    ]).withMessage("Invalid Class value"),
  ],

  async (req, res) => {
    console.log("Data received from frontend:", { body: req.body, file: req.file });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userRole = req.params.userRole;
      const isOld = userRole !== "Admin";

      if (!req.userId) {
        return res.status(400).json({ error: "Unauthorized request" });
      }

      if (userRole === "Admin") {
        let existing = await Book.findOne({ ISBN: req.body.ISBN });
        if (existing) {
          return res.status(400).json({ error: "Book with this ISBN already exists" });
        }
      }

      const subcategory = await Subcategory.findById(req.body.SubCategory);
      if (!subcategory) {
        return res.status(400).json({ error: "Invalid subcategory" });
      }

      if (subcategory.Subcategory_Name.toLowerCase() === "school books") {
        if (!req.body.Board) return res.status(400).json({ error: "Board is required for school books" });
        if (!req.body.Class) return res.status(400).json({ error: "Class is required for school books" });
      }

      const bookImageURL = req.file ? req.file.path || req.file.secure_url : "default.jpg";

      const book = new Book({
        BookName: req.body.BookName,
        BookImageURL: bookImageURL,
        Author: req.body.Author,
        Edition: req.body.Edition,
        Publication_Date: req.body.Publication_Date,
        Publisher: req.body.Publisher,
        Description: req.body.Description,
        Price: req.body.Price,
        Quantity: req.body.Quantity || 0,
        ISBN: req.body.ISBN,
        Condition: req.body.Condition,
        Subcategory_id: subcategory._id,
        User_id: req.userId,
        Isoldbook: isOld,
        Board: req.body.Board || null,
        Class: req.body.Class || null,
      });

      const savedBook = await book.save();
      res.status(201).json({ book: savedBook });

    } catch (error) {
      console.error("Error saving book:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  }
);

router.get("/Book", async (req, res) => {
  try {
    const books = await Book.find({});
    if (books.length === 0) {
      return res.status(404).json({ error: "No book data found" });
    }
    res.json(books);
  } catch (error) {
    console.error("Error fetching book data:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

router.put(
  "/Book",
  Authmid,
  upload.single("image"),
  [
    body("bookId").notEmpty().withMessage("Book ID is required"),
    body("BookName").optional().notEmpty().withMessage("Book name cannot be empty"),
    body("Author").optional().notEmpty().withMessage("Author cannot be empty"),
    body("Edition").optional(),
    body("Publication_Date").optional().notEmpty().withMessage("Publication date is required"),
    body("Publisher").optional().notEmpty().withMessage("Publisher cannot be empty"),
    body("Description").optional().notEmpty().withMessage("Description cannot be empty"),
    body("Price").optional().notEmpty().withMessage("Price is required"),
    body("Quantity").optional().isInt({ min: 0 }).withMessage("Quantity must be a non-negative integer"),
    body("ISBN").optional().notEmpty().withMessage("ISBN cannot be empty"),
    body("Condition").optional(),
    body("SubCategory").optional().notEmpty().withMessage("Subcategory is required"),
    body("Board").optional().isIn(["CBSE", "ICSE", "Other"]).withMessage("Invalid Board value"),
    body("Class").optional().isIn([
      "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6",
      "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
    ]).withMessage("Invalid Class value"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { bookId, ...updatedFields } = req.body;
      let book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      if (req.file) {
        updatedFields.BookImageURL = req.file.path || req.file.secure_url;
      }

      if (updatedFields.SubCategory) {
        const subcategory = await Subcategory.findById(updatedFields.SubCategory);
        if (!subcategory) {
          return res.status(400).json({ error: "Invalid subcategory" });
        }
        updatedFields.Subcategory_id = subcategory._id;
      }

      book = await Book.findByIdAndUpdate(bookId, updatedFields, { new: true });

      res.json({ success: true, message: "Book updated successfully", book });
    } catch (error) {
      console.error("Error updating book:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.delete(
  "/Book",
  [body("bookId").notEmpty().withMessage("Book ID is required")],
  Authmid,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { bookId } = req.body;
      const book = await Book.findByIdAndDelete(bookId);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      res.json({ success: true, message: "Book deleted successfully" });
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.get("/:Subcategoryname/Books", async (req, res) => {
  try {
    const name = req.params.Subcategoryname;
    const subcategory = await Subcategory.findOne({ Subcategory_Name: name });
    const books = await Book.find({ Subcategory_id: subcategory._id });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
