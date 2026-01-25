import React from 'react';
import Layout from '../components/Layout';
import '../pages-css/FAQsPage.css'; // Import the CSS file

const faqs = [
    {
        question: "How do I place an order?",
        answer: "You can place an order by selecting the books you want and proceeding to checkout."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major Offline as well as Online payment using Razorpay Gateway."
    },
    {
        question: "How long does shipping take?",
        answer: "Shipping typically takes 3-5 business days."
    },
    {
        question: "Can I cancel my order?",
        answer: "Yes, you can cancel your order within 24 hours of placing it."
    }
];

const FAQsPage = () => {
    return (
        <Layout>
            <div className="faqs-page">
                <h1 className="faqs-title">Frequently Asked Questions</h1>
                <div className="faqs-content">
                    {faqs.map((faq, index) => (
                        <div key={index} className="faq-item">
                            <h3 className="faq-question">{faq.question}</h3>
                            <p className="faq-answer">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default FAQsPage;
