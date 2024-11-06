import mongoose, { Schema, Document } from "mongoose";

export interface INote extends Document {
    heading: string;
    content: string;
}

const noteSchema: Schema = new Schema(
    {
        heading: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const Note = mongoose.model<INote>("Note", noteSchema);
export default Note;
