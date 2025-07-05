const mongoose = require("mongoose");
const { Schema } = mongoose;

const BookSchema = new Schema(
  {
    // _id will be created automatically, no need for explicit BookId
    BookName: {
      type: String,
      required: true,
      trim: true,
    },
    BookImageURL: {
      type: String,
      maxLength: 250,
      trim: true,
    },
    Author: {
      type: String,
      required: true,
      trim: true,
    },
    Edition: {
      type: String,
      trim: true,
    },
    Publication_Date: {
      type: Date,
      required: true,
    },
    Publisher: {
      type: String,
      trim: true,
    },
    Description: {
      type: String,
      maxLength: 300,
      trim: true,
    },
    Price: {
      type: Number,
      min: 1,
      required: true,
    },
    Quantity: {
      type: Number,
      min: 0,
      required: true,
    },
    ISBN: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    Condition: {
      type: String,
      enum: ["fair", "excellent", "good"],
      trim: true,
    },

    // Link to Subcategory
    Subcategory_id: {
      type: Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },
    User_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    Isoldbook: {
      type: Boolean,
      default: false,
    },

    // Added fields based on your form's subcategory conditions:
    Board: {
      type: String,
      enum: ["CBSE", "ICSE", "Other"],
      default: null,
    },
    Class: {
      type: String,
      enum: [
        "Class 1",
        "Class 2",
        "Class 3",
        "Class 4",
        "Class 5",
        "Class 6",
        "Class 7",
        "Class 8",
        "Class 9",
        "Class 10",
        "Class 11",
        "Class 12",
      ],
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Books", BookSchema);
