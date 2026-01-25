const mongoose = require("mongoose");

const connectToMongo = () => {
    mongoose.connect(process.env.DATABASE_URL,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(()=>{
        console.log("connection successfully");
    }).catch(()=>{
        console.log("not connected");
    })
}

module.exports = connectToMongo;

