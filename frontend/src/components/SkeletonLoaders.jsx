import React from 'react';
import '../components-css/SkeletonCard.css';

export const DashboardSkeleton = () => (
  <div className="skeleton-dashboard">
    <div className="skeleton-header skeleton-shimmer-light"></div>
    <div className="skeleton-stat-grid">
      <div className="skeleton-stat-card skeleton-shimmer-light"></div>
      <div className="skeleton-stat-card skeleton-shimmer-light"></div>
      <div className="skeleton-stat-card skeleton-shimmer-light"></div>
      <div className="skeleton-stat-card skeleton-shimmer-light"></div>
    </div>
    <div className="skeleton-table-row skeleton-shimmer-light"></div>
    <div className="skeleton-table-row skeleton-shimmer-light"></div>
    <div className="skeleton-table-row skeleton-shimmer-light"></div>
    <div className="skeleton-table-row skeleton-shimmer-light"></div>
  </div>
);

export const OrderSkeleton = () => (
  <div className="skeleton-dashboard">
    <div className="skeleton-header skeleton-shimmer-light"></div>
    <div className="skeleton-order-card skeleton-shimmer-light"></div>
    <div className="skeleton-order-card skeleton-shimmer-light"></div>
    <div className="skeleton-order-card skeleton-shimmer-light"></div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="skeleton-profile">
    <div className="skeleton-avatar skeleton-shimmer-light"></div>
    <div className="skeleton-input skeleton-shimmer-light"></div>
    <div className="skeleton-input skeleton-shimmer-light"></div>
    <div className="skeleton-input skeleton-shimmer-light"></div>
    <div className="skeleton-input skeleton-shimmer-light"></div>
  </div>
);

export const TableSkeleton = () => (
  <div className="skeleton-dashboard">
    <div className="skeleton-table-row skeleton-shimmer-light"></div>
    <div className="skeleton-table-row skeleton-shimmer-light"></div>
    <div className="skeleton-table-row skeleton-shimmer-light"></div>
    <div className="skeleton-table-row skeleton-shimmer-light"></div>
    <div className="skeleton-table-row skeleton-shimmer-light"></div>
    <div className="skeleton-table-row skeleton-shimmer-light"></div>
  </div>
);
