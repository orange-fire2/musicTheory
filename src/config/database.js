import mongoose from "mongoose";

const connectDB = async ()=>{
	try{
		const connectionInstance = await mongoose.connect (`${process.env.MONGODB_URI}`};
		console.log(`\n Mongo connected ${connectionInstance.connection.host}`);
	}catch (error) {
		console.log(`failed to connect`,error);	
		process.exit();
	}

export default connectDB;
