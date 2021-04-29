export function authHeader() {
  let user = localStorage.getItem("user");

  if (user) {
    return {
      Authorization: user,
    };
  } else {
    return {};
  }
}
