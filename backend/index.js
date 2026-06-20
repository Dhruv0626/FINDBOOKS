// Force Google DNS BEFORE anything else loads (fixes MongoDB Atlas SRV resolution)
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const connectToMongo = require("./Database/db")
connectToMongo();
const cors = require("cors");
const PORT = process.env.PORT || 2606;
const cookieparser = require('cookie-parser');

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieparser());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Health check endpoint to diagnose connection issues on live site
app.get("/api/health", (req, res) => {
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    };
    res.json({
        status: "ok",
        database: states[require("mongoose").connection.readyState] || "unknown",
        env: {
            hasDatabaseUrl: !!process.env.DATABASE_URL,
            hasJwtKey: !!process.env.JWT_KEY
        }
    });
});

app.use("/api", require("./Routes/Auth"));
app.use("/api", require("./Routes/BookForm"));
app.use("/api", require("./Routes/Addcat-subCat"));
app.use("/api", require("./Routes/ResellerPaymentForm"));
app.use("/api", require("./Routes/AddToCart"));
app.use("/api", require("./Routes/Checkout"));
app.use("/api", require("./Routes/Profile"));
app.use("/api", require("./Routes/AddRatings"));
app.use("/api", require("./Routes/SellOrders"));
app.use("/api", require("./Routes/Payment"));
app.use("/api", require("./Routes/return_order"));
app.use("/api", require("./Routes/Email"));
app.use('/api/report', require('./Routes/Report'));


app.listen(PORT,'0.0.0.0',() => {
    console.log(`your application run at http://localhost:${PORT}`);
})
