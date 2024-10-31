import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    clerkId: string;
    email: string;
    createdAt: Date;
    openAikey: string;
}

const userSchema: Schema = new Schema({
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    openAikey: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model<IUser>("User", userSchema);
export default User;
