import React from 'react';
import { Navbar } from './Navbar';

const Layout = ({ children }) => {
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <main style={{ flex: 1, overflow: 'hidden', backgroundColor: '##e1e1e1', paddingTop: "3em" }}>{children}</main>
            {/* <Footer /> */}
        </div>
    );
};

export default Layout; 