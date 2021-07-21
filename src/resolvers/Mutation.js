import { v4 as uuidv4 }  from "uuid";

const Mutation = {
  createUser(parent, args, { db }, info) {
    const emailTaken = db.users.some(
      (user) => user.email === args.data.email
    );

    if (emailTaken) {
      throw new Error("Email taken");
    }

    const user = {
      id: uuidv4(),
      ...args.data,
    };

    db.users.push(user);

    return user;
  },
  deleteUser(parent, args, { db }, info) {
    const userIndex = db.users.findIndex((u) => u.id === args.id);
    if (userIndex === -1) {
      throw new Error("User not found");
    }
    const deleteUser = db.users.splice(userIndex, 1);
    posts = db.posts.filter((p) => {
      const ismatch = p.author === args.id;
      if (ismatch) {
        db.comments = db.comments.filter((d) => d.post !== p.id);
      }
      return !ismatch;
    });
    db.comments = db.comments.filter((c) => c.author !== args.id);
    return deleteUser[0];
  },
  updateUser(parent, args, { db }, info) {
    const { id, data } = args;
    const user = db.users.find((u) => u.id === id);
    if (!user) {
      throw new Error("User not found");
    }
    if (typeof data.email === "string") {
      const emailTaken = db.users.some(u => u.email === data.email);
      if (emailTaken) {
        throw new Error("Email taken")
      }
      user.email = data.email;
    }
    if (typeof data.name === "string") {
      user.name = data.name;
    }
    if (typeof data.age === "undefined") {
      user.age = data.age;
    }
    return user;
  },
  createPost(parent, args, { db, pubsub }, info) {
    const userExists = db.users.some((user) => user.id === args.data.author);

    if (!userExists) {
      throw new Error("User not found");
    }

    const post = {
      id: uuidv4(),
      ...args.data,
    };

    db.posts.push(post);

    pubsub.publish(`post`, { 
      post: {
        mutation: 'CREATED',
        data: post
      } 
    });

    return post;
  },
  deletePost(parent, args, { db, pubsub }, info) {
    const postIndex = db.posts.findIndex((p) => p.id === args.id);
    if (postIndex === -1) {
      throw new Error("Post not found");
    }
    const deletePost = db.posts.splice(postIndex, 1);
    db.comments = db.comments.filter((c) => c.post !== args.id);

    pubsub.publish(`post`, { 
      post: {
        mutation: 'DELETED',
        data: deletePost[0]
      } 
    });

    return deletePost[0];
  },
  updatePost(parent, args, { db, pubsub }, info) {
    const { id, data } = args;
    const post = db.posts.find((p) => p.id === id);
    const originalPost = { ...post };
    if (post === -1) {
      throw new Error("Post not found");
    }
    if (typeof data.title === "string") {
      post.title = data.title;
    }
    if (typeof data.body === "string") {
      post.body = data.body;
    }
    if (typeof data.published === "boolean") {
      post.published = data.published;
      if (originalPost.published && !post.published) {
        // deleted 
        pubsub.publish(`post`, { 
          post: {
            mutation: 'DELETED',
            data: originalPost 
          } 
        });
      } else if(!originalPost.published && post.published)  {
        // created 
        pubsub.publish(`post`, { 
          post: {
            mutation: 'CREATED',
            data: post 
          } 
        });
      }
    } else if (post.published) {
      // updated 
      pubsub.publish(`post`, { 
        post: {
          mutation: 'UPDATED',
          data: post 
        } 
      });
    }
    return post;
  },
  createComment(parent, args, { db, pubsub }, info) {
    const userExists = db.users.some((user) => user.id === args.data.author);
    const postExists = db.posts.some((post) => post.id === args.data.post);

    if (!userExists || !postExists) {
      throw new Error("Unable to find user and post");
    }

    const comment = {
      id: uuidv4(),
      ...args.data,
    };

    db.comments.push(comment);

    pubsub.publish(`comment ${args.data.post}`, { 
      comment: {
        mutation: 'CREATED',
        data: comment
      } 
    });

    return comment;
  },
  deleteComment(parent, args, { db, pubsub }, info) {
    const commentIndex = db.comments.findIndex((p) => p.id === args.id);
    if (commentIndex === -1) {
      throw new Error("Comment not found");
    }
    const deletedComments = db.comments.splice(commentIndex, 1);
    pubsub.publish(`comment ${deletedComments[0].post}`, { 
      comment: {
        mutation: 'DELETED',
        data: deletedComments[0]
      } 
    });
    return deletedComments[0];
  },
  updateComment(parent, args, { db, pubsub }, info) {
    const { id, data } = args;
    const comment = db.comments.find(c => c.id === id);
    if (!comment) {
      throw new Error("comment not found");
    }
    if (typeof data.text === "string") {
      comment.text = data.text;
    }
    pubsub.publish(`comment ${comment.post}`, { 
      comment: {
        mutation: 'UPDATED',
        data: comment
      } 
    });
    return comment;
  },
};

export { Mutation as default }