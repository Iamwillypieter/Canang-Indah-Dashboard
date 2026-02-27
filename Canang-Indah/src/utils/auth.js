export const getAuthUser = () => {
  const isAuth = localStorage.getItem('isAuth');
  const user = localStorage.getItem('user');

  if (isAuth === 'true' && user) {
    return JSON.parse(user);
  }
  return null;
};
