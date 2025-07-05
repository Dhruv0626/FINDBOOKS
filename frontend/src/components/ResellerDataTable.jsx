import React from 'react';

const ResellerDataTable = ({ data }) => {
    return (
        <div>
            <h2>Submitted Data</h2>
            <table>
                <thead>
                    <tr>
                        <th>Address</th>
                        <th>UPI ID</th>
                        <th>Bank Account Number</th>
                        <th>IFSC Code</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <tr key={index}>
                            <td>{item.address}</td>
                            <td>{item.upi_id}</td>
                            <td>{item.bank_acc_no}</td>
                            <td>{item.ifsc_code}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ResellerDataTable;
