import React, { useEffect, useState } from "react";
import { useAuth } from "../Context/AdminContext";
import { Navigate } from "react-router-dom";
import { Download, FileText, Calendar, TrendingUp, DollarSign, Users } from 'lucide-react';
import "../pages-css/Reports.css";
import { useAlert } from "../Context/AlertContext";
import Load from "../components/Load"
import Cookies from "js-cookie";
import {formatIndianNumber} from "../utils/formatIndianNumber"


const Reports = () => {
  const token = Cookies.get("token");
  const { user, loading } = useAuth();
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const {showAlert } =useAlert();
  

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/report`, {
          credentials: "include",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (data.success) {
          setReports(data.reports);
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, []);

  const downloadReport = async (reportId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/report/${reportId}/download`, {
        credentials: "include",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading report:", error);
      showAlert("Failed to download report","error");
    }
  };

  if (loading) {
    return <div><Load/></div>;
  }

  
  if (!user || user.Role !== "Admin") {

    return <Navigate to="/" />;
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Sales Reports</h1>
        <p>View and download your generated sales reports</p>
      </div>

      {loadingReports ? (
        <div className="loading">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="no-reports">
          <FileText className="icon" />
          <p>No reports available yet</p>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map((report) => (
            <div key={report._id} className="report-card">
              <div className="report-header">
                <div className="report-date">
                  <Calendar className="icon" />
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
                <button 
                  className="download-btn"
                  onClick={() => downloadReport(report._id)}
                >
                  <Download className="icon" />
                  Download
                </button>
              </div>
              
              <div className="report-stats">
                <div className="stat-item">
                  <DollarSign className="icon" />
                  <div className="stat-info">
                    <span className="label">Total Revenue</span>
                    <span className="value">₹{formatIndianNumber(report.summary.totalRevenue)}</span>
                  </div>
                </div>
                <div className="stat-item">
                  <TrendingUp className="icon" />
                  <div className="stat-info">
                    <span className="label">Orders</span>
                    <span className="value">{report.summary.totalOrders}</span>
                  </div>
                </div>
                <div className="stat-item">
                  <Users className="icon" />
                  <div className="stat-info">
                    <span className="label">Customers</span>
                    <span className="value">{report.summary.uniqueCustomers}</span>
                  </div>
                </div>
              </div>

              <div className="report-period">
                <span className="period-label">Period:</span>
                <span className="period-value">
                  {new Date(report.period.start).toLocaleDateString()} - 
                  {new Date(report.period.end).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;
