import React from 'react';
import Layout from '../components/Layout';
import '../pages-css/PrivacyPolicyPage.css'; // Import the CSS file

const policyPoints = [
    "We collect information that you provide directly to us.",
    "We use this information to process your orders and improve our services.",
    "We do not share your personal information with third parties.",
    "You can opt-out of receiving marketing communications from us."
];

const PrivacyPolicyPage = () => {
    return (
        <Layout>
            <div className="privacy-policy-page">
                <h1 className="privacy-policy-title">Privacy Policy</h1>
                <p className="privacy-policy-intro">Your privacy is important to us. Here is how we handle your data:</p>
                <ul className="privacy-policy-list">
                    {policyPoints.map((point, index) => (
                        <li key={index} className="privacy-policy-item">{point}</li>
                    ))}
                </ul>
            </div>
        </Layout>
    );
};

export default PrivacyPolicyPage;
