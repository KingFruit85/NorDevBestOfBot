function TryGetUserNickname(member) {
  if (member.nickname) {
    console.log(`user has nickname: ${member.nickname}`);
    return member.nickname;
  } else {
    console.log(
      `user has no nickname, using username: ${member.user.username}`
    );
    return member.user.username;
  }
}

module.exports = {
  TryGetUserNickname: TryGetUserNickname,
};
