import mongoose from "mongoose";
const connectionDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_LOCAL);
        console.log("DB Connected Succefully");
    }
    catch (error) {
        console.log(error);
    }
};
export default connectionDB;
