const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  messageLink: {
    type: String,
    required: true,
  },
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
  userTag: {
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
    required: true,
  },
  voters: {
    type: Array,
    required: true,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  quotedMessage: {
    type: String,
    required: false,
  },
  quotedMessageAuthor: {
    type: String,
    required: false,
  },
  quotedMessageAvatarLink: {
    type: String,
    required: false,
  },
  quotedMessageImage: {
    type: String,
    required: false,
  },
  nickname: {
    type: String,
    required: false,
  },
  quotedMessageAuthorNickname: {
    type: String,
    required: false,
  },
});

const Comments =
  mongoose.model.Comments || mongoose.model("Comments", CommentSchema);

module.exports = Comments;
