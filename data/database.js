import mongoose from "mongoose";

// console.log('URI ', process.env.MONGO_URI);


export const connectDb = async () => {
    try {
        const { connection } = await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'ECommerce'
        });
        console.log(`Server connected to database ${connection.host}`);
    } catch (error) {
        console.log('Some Err Occured' + error);
        process.exit(1)
    }
}