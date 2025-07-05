import React, { useState } from "react";
import "./../components-css/ReturnOrderForm.css";

const ReturnOrderForm = ({ orderId, onCancel, onSubmit}) => {
  const [reason, setReason] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError("Please select a reason for return.");
      return;
    }
    // For reasons that require image, ensure image is provided
    if (
      ["Damaged", "Wrong Item", "Not as Described", "Other"].includes(reason) &&
      !image
    ) {
      setError("Please upload an image for the selected reason.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      // Prepare form data for multipart/form-data submission
      const formData = new FormData();
      formData.append('order_id', orderId);
      formData.append('reason', reason);
      formData.append('additional_info', additionalInfo);
      if (image) {
        formData.append('image', image);
      }
      await onSubmit(formData);
    } catch (err) {
      setError("Failed to submit return request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const showImageUpload = ["Damaged", "Not as Described", "Other"].includes(reason);

  return (
    <div className="return-order-form-container fade-in">
      <form className="return-order-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <h2>Return Order</h2>
        </div>
        <label htmlFor="reason">
          Reason for Return<span className="required">*</span>
        </label>
        <select
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        >
          <option value="">Select a reason</option>
          <option value="Damaged">Damaged</option>
          <option value="Wrong Item">Wrong Item</option>
          <option value="Not as Described">Not as Described</option>
          <option value="Better Price Available">Better Price Available</option>
          <option value="No Longer Needed">No Longer Needed</option>
          <option value="Other">Other</option>
        </select>

        {showImageUpload && (
          <>
            <label htmlFor="image">Upload Image<span className="required">*</span></label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
            />
            {image && (
              <img
                src={URL.createObjectURL(image)}
                alt="Preview"
                style={{ maxWidth: "200px", maxHeight: "200px" }}
              />
            )}
          </>
        )}

        <label htmlFor="additionalInfo">Additional Information</label>
        <textarea
          id="additionalInfo"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="Provide any additional details here..."
          rows={4}
        />

        {error && <p className="error-message">{error}</p>}

        <div className="form-buttons">
          <button
            type="button"
            className="cancel-button"
            onClick={onCancel}
            disabled={submitting}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="button-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              width="16"
              height="16"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Cancel
          </button>
          <button
            type="submit"
            className="returnsubmit-button"
            disabled={submitting}
          >
            {submitting ? (
              "Submitting..."
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="button-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  width="16"
                  height="16"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Submit Return
              </>
            )}
          </button>
          
        </div>
        
              <br></br>
      </form>
    </div>
  );
};

export default ReturnOrderForm;
