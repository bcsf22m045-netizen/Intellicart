import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("DB Connected 🦾🤷‍♂️");
  });

  // Use MONGODB_URI directly - database name should be in the connection string
  await mongoose.connect(process.env.MONGODB_URI);
};

export default connectDB;
