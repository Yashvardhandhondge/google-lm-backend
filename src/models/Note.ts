import mongoose, { Schema, Document } from "mongoose";

export interface INote extends Document {
    name: string;
}

const noteSchema: Schema = new Schema({
    heading: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true
    }
});

const Note = mongoose.model<INote>("Note", noteSchema);
export default Note;
