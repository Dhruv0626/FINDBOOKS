const mongoose = require("mongoose");
const dns = require("dns");

// Force Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectToMongo = () => {
    mongoose.connect(process.env.DATABASE_URL).then(()=>{
        console.log("connection successfully");
    }).catch((err)=>{
        console.error("not connected", err.message);
    })
}

module.exports = connectToMongo;

