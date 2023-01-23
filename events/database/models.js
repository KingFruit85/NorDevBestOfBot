const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
  },
  serverId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  voteCount: {
    type: Number,
    required: true,
  },
  iconUrl: {
    type: String,
    required: true,
  },
  dateOfSubmission: {
    type: Date,
    required: false,
  },
});

const Comments =
  mongoose.model.Comments || mongoose.model("Comments", CommentSchema);

module.exports = Comments;
