import React from 'react';
import Layout from '../components/Layout';
import '../pages-css/AboutUsPage.css'; // Import the CSS file

import { FaBookOpen, FaUsers, FaHandshake } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const AboutUsPage = () => {
    return (
        <Layout>
            <div className="about-us-page">
                <h1 className="about-us-title">About Us</h1>
                <div className="about-us-content">
                    <p className="custom-p-about-us">
                        <FaBookOpen className="about-icon" />
                        Welcome to FindBooks, your one-stop destination for buying and selling books! We are dedicated to providing a seamless experience for book lovers.
                    </p>
                    <p className="custom-p-about-us">
                        <FaUsers className="about-icon" />
                        Our mission is to connect readers with their favorite books, whether they are brand-new releases, second-hand textbooks, or rare finds.
                    </p>
                    <p className="custom-p-about-us">
                        <FaHandshake className="about-icon" />
                        With a user-friendly interface and a vast collection of books, we make it easy for you to find and purchase the books you love.
                    </p>
                    <p className="custom-p-about-us">
                        Thank you for choosing FindBooks!
                    </p>
                </div>
                
            </div>
        </Layout>
    );
};

export default AboutUsPage; 