function TryGetUserNickname(member) {
  if (member.nickname) {
    console.log(`user has nickname: ${member.nickname}`);
    return member.nickname;
  } else if (member.user.username) {
    console.log(
      `user has no nickname, using username: ${member.user.username}`
    );
    return member.user.username;
  } else {
    return "Unknown User";
  }
}

module.exports = {
  TryGetUserNickname: TryGetUserNickname,
};
