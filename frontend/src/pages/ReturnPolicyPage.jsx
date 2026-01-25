import React from 'react';
import Layout from '../components/Layout';
import '../pages-css/ReturnPolicyPage.css'; // Import the CSS file

const ReturnPolicyPage = () => {
    return (
        <Layout>
            <div className="return-policy-page">
                <h1>Return Policy</h1>
                <p>Our return policy is as follows:</p>
                <ul>
                    <li>You can return any book within 1 days of purchase.</li>
                    <li>The book must be in its original condition.</li>
                    <li>Please contact us for a return label.</li>
                    <li>Refunds will be processed within 5-7 business days.</li>
                </ul>
            </div>
        </Layout>
    );
};

export default ReturnPolicyPage; 