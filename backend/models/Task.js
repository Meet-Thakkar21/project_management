const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  deadline: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ["pending", "in_progress", "completed"], 
    default: "pending" 
  },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Admin who created the task
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Task", TaskSchema);
