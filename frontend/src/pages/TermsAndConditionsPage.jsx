import React from 'react';
import Layout from '../components/Layout';
import '../pages-css/TermsAndConditionsPage.css'; // Import the CSS file

const terms = [
    "You are responsible for maintaining the confidentiality of your account.",
    "You agree to provide accurate and complete information.",
    "Seller need to pay 10% of books price to us as a platform charge.",
    "We reserve the right to terminate your account if you violate these terms.",
    "If a resell book is not purchased in 15 days after adding on website then book automatically removed from the website. You can re-add it. In this 30 days period, if you sell your book outside then you need to pay 10% of the book price to us if anyone can buy your book."
];

const TermsAndConditionsPage = () => {
    return (
        <Layout>
            <div className="terms-and-conditions-page">
                <h1 className="terms-title">Terms and Conditions</h1>
                <p className="terms-intro">By using our service, you agree to the following terms:</p>
                <ul className="terms-list">
                    {terms.map((term, index) => (
                        <li key={index} className="terms-item">{term}</li>
                    ))}
                </ul>
            </div>
        </Layout>
    );
};

export default TermsAndConditionsPage;
