const mongoose = require("mongoose");

const connectToMongo = () => {
    mongoose.connect(process.env.DATABASE_URL).then(()=>{
        console.log("connection successfully");
    }).catch(()=>{
        console.log("not connected");
    })
}

module.exports = connectToMongo;

