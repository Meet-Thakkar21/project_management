const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, trim: true },
    imageUrl: { type: String, default: null },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    type: { type: String, enum: ['text', 'system', 'notification'], default: 'text' }
}, {
    timestamps: true
});

MessageSchema.methods.markAsRead = async function (userId) {
    if (!this.readBy.includes(userId)) {
        this.readBy.push(userId);
        await this.save();
    }
    return this;
};
const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
