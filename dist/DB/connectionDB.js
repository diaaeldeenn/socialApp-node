import mongoose from "mongoose";
let isConnected = false;
const connectionDB = async () => {
    if (isConnected)
        return;
    try {
        await mongoose.connect(process.env.MONGO_URI);
        isConnected = true;
        console.log("Atlas Connected Successfully");
    }
    catch (error) {
        console.log("Atlas Connection Failed");
        console.log(error.message);
        if (process.env.NODE_ENV === "development") {
            await mongoose.connect(process.env.MONGO_LOCAL);
            isConnected = true;
            console.log("Local DB Connected");
        }
        else {
            throw error;
        }
    }
};
export default connectionDB;
