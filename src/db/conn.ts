import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log("mongodb database connected successfully");
    } catch (err) {
        console.error(err);
    }
}   