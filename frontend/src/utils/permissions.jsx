export const isAdmin = (user) => {
    return user?.isAdmin;
  };
  
  export const isAuthor = (user, authorId) => {
    return user && user.id === authorId;
  };
  