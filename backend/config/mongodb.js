import mongoose from "mongoose";

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.error("❌ ERROR: MONGODB_URI is not defined in your .env file!");
        return;
    }

    mongoose.connection.on('connected', () => console.log("Database Connected Successfully!"));
    mongoose.connection.on('error', (err) => console.error("Database connection error:", err));

    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/prescripto`);
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error.message);
    }
}

export default connectDB;