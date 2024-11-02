import mongoose, { Schema, Document } from "mongoose";

export interface IWorkspace extends Document {
    name: string;
    notes: mongoose.Types.ObjectId[];
}

const workspaceSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    notes: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Note", default: [] },
    ],
});

const Workspace = mongoose.model<IWorkspace>("Workspace", workspaceSchema);
export default Workspace;
