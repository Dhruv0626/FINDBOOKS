import React from 'react';
import '../components-css/Bookcard.css';
import '../components-css/SkeletonCard.css';

export const SkeletonCard = () => {
  return (
    <div className="book-card-container">
      <div className="book-card skeleton-card">
        <div className="book-card-box skeleton-box">
          <div className="book-card-contant">
            <div className="book-img skeleton-img"></div>
            <div className="book-detail">
              <div className="skeleton-text skeleton-title"></div>
              <div className="skeleton-text skeleton-author"></div>
              <div className="skeleton-text skeleton-price"></div>
              <div className="skeleton-btn"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
