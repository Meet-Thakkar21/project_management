const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Project Admin ID
  members: [
    {
      memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Employee ID
      role: { type: String, required: true }, // Role assigned by admin
      status: { type: String, required: true, enum: ["Activate", "Deactivate"], default: "Activate"} //Status
    }
  ]
});

module.exports = mongoose.model('Team', teamSchema);
