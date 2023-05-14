function TryGetUserNickname(member) {
  if (member.nickname) {
    return member.nickname;
  } else {
    return member.user.username;
  }
}

module.exports = {
  TryGetUserNickname: TryGetUserNickname,
};
