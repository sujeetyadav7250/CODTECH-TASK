const { Schema, model } = require("mongoose");

const documentSchema = new Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    content: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = model("Document", documentSchema);
