import React from 'react';
import Layout from '../components/Layout';
import '../pages-css/ContactUsPage.css'; // Import the CSS file

import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const ContactUsPage = () => {
    return (
        <Layout>
            <div className="contact-us-page">
                <h1 className="contact-us-title">Contact Us</h1>
                <div className="contact-us-content">
                    <p className="custom-p-contact-us">
                        <FaEnvelope className="contact-icon" />
                        Email: findbooksonlinewebsite@gmail.com
                    </p>
                    <p className="custom-p-contact-us">
                        <FaPhone className="contact-icon" />
                        Phone: 7046691783 , 6355831203
                    </p>
                    <p className="custom-p-contact-us">
                        <FaMapMarkerAlt className="contact-icon" />
                        Address: Shahpur, Ahmedabad
                    </p>
                    <p className="custom-p-contact-us">
                        We are here to help you!
                    </p>
                </div>
            </div>
        </Layout>
    );
};

export default ContactUsPage;
