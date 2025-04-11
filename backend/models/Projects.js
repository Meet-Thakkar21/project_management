const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  progress: { type: Number, default: 0 },
  tasks: { type: Number, default: 0 },
  completed: { type: Number, default: 0 },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
});

ProjectSchema.methods.addMessage = async function (messageId) {
  this.messages.push(messageId);
  this.lastMessage = messageId;
  await this.save();
  return this;
};

const Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;
