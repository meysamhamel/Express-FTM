import { gql } from 'apollo-server-express';
import UserModel, { IRecipeGroup } from '../classes/User';
import { RecipeTypes } from './Recipe';
import RecipeModel from '../classes/Recipe';

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    password: String!
    salt: String!
    isAdmin: Boolean!
    profilePicture: String
    ownedRecipes(limit: Int, offset: Int): [Recipe]!
    savedRecipes(limit: Int, offset: Int): [Recipe]!
    recipeGroups(limit: Int, offset: Int, groupName: String): [RecipeGroup]!
    googleId: String!
    facebookId: String!
    followers(limit: Int, offset: Int): [User]
    following(limit: Int, offset: Int): [User]
    madeRecipes(limit: Int, offset: Int): [Recipe]
  }

  input UpdateUserInput {
    username: String
    password: String
    isAdmin: Boolean
    profilePicture: Upload
  }

  type RecipeGroup {
    name: String!
    recipes(limit: Int, offset: Int): [Recipe]!
  }

  type LoginResult {
    user: User
    token: String
    apiError: Error
  }

  enum SocialType {
    google
    facebook
  }

  extend type Query {
    userById(id: String!): User

    userByUsername(username: String!): User

    login(username: String!, password: String!): LoginResult!

    loginSocial(id: String!, type: SocialType!): LoginResult!

    searchOwnedRecipes(
      userId: String!
      query: String!
      limit: Int
      offset: Int
      filters: [SearchFilter]
    ): [Recipe]

    searchSavedRecipes(
      userId: String!
      query: String!
      limit: Int
      offset: Int
      filters: [SearchFilter]
    ): [Recipe]
  }

  extend type Mutation {
    deleteUser(userId: String!): Boolean
    createUser(
      username: String!
      password: String!
      profilePicture: Upload
    ): LoginResult
    addSavedRecipe(userId: String!, recipeId: String!): Recipe

    deleteSavedRecipe(userId: String!, recipeId: String!): Boolean

    addToRecipeGroup(
      userId: String!
      recipeId: String!
      groupName: String!
    ): User

    removeFromRecipeGroup(
      userId: String!
      recipeId: String!
      groupName: String!
    ): User

    deleteRecipeGroup(userId: String, groupName: String!): User

    updateRecipeGroupName(
      userId: String!
      oldName: String!
      newName: String!
    ): User

    createUserSocial(
      id: String!
      username: String!
      type: SocialType!
    ): LoginResult

    updateUser(userId: String!, userUpdates: UpdateUserInput!): User

    addFollower(userId: String!, followerId: String!): User
    removeFollower(userId: String!, followerId: String!): User

    followUser(userId: String!, followingId: String!): User
    unfollowUser(userId: String!, followingId: String!): User

    toggleIMadeThis(userId: String!, recipeId: String!, newVal: Boolean!): User
  }
`;

const User: UserModel = new UserModel();
const Recipe: RecipeModel = new RecipeModel();

export const UserResolvers = {
  Query: {
    userById: async (root, { id }) => await User.findUserById(id),
    userByUsername: async (root, { username }) =>
      await User.findUserByUsername(username),
    login: async (root, { username, password }) =>
      await User.login(username, password),
    loginSocial: async (root, { id, type }) => {
      switch (type) {
        case 'google':
          return await User.loginGoogle(id);
        case 'facebook':
          return await User.loginFacebook(id);
        default:
          return {
            user: null,
            token: null,
            error: {
              code: 'INVALID_SOCIAL_TYPE',
              message: 'Social type must be "google" or "facebook".'
            }
          };
      }
    },
    searchOwnedRecipes: async (
      root,
      { userId, query, limit, offset, filters }
    ) => await User.searchOwnedRecipes(userId, query, limit, offset, filters),
    searchSavedRecipes: async (
      root,
      { userId, query, limit, offset, filters }
    ) => await User.searchSavedRecipes(userId, query, limit, offset, filters)
  },
  Mutation: {
    deleteUser: async (root, { userId }) => {
      return User.deleteUser(userId);
    },
    createUser: async (root, { username, password, profilePicture }) =>
      await User.createUser(username, password, profilePicture),
    addSavedRecipe: async (root, { userId, recipeId }) =>
      await User.addSavedRecipe(userId, recipeId),
    deleteSavedRecipe: async (root, { userId, recipeId }) =>
      await User.deleteSavedRecipe(userId, recipeId),
    addToRecipeGroup: async (root, { userId, recipeId, groupName }) =>
      await User.addToRecipeGroup(userId, recipeId, groupName),
    removeFromRecipeGroup: async (root, { userId, recipeId, groupName }) =>
      await User.removeFromRecipeGroup(userId, recipeId, groupName),
    deleteRecipeGroup: async (root, { userId, groupName }) =>
      await User.deleteRecipeGroup(userId, groupName),
    updateRecipeGroupName: async (root, { userId, oldName, newName }) =>
      await User.updateRecipeGroupName(userId, oldName, newName),
    createUserSocial: async (root, { id, username, type }) => {
      switch (type) {
        case 'google':
          return await User.createUserGoogle(id, username);
        case 'facebook':
          return await User.createUserFacebook(id, username);
        default:
          return {
            user: null,
            token: null,
            error: {
              code: 'INVALID_SOCIAL_TYPE',
              message: 'Social type must be "google" or "facebook".'
            }
          };
      }
    },
    updateUser: async (root, { userId, userUpdates }) =>
      await User.updateUser(userId, userUpdates),
    addFollower: async (root, { userId, followerId }) =>
      await User.addFollower(userId, followerId),
    removeFollower: async (root, { userId, followerId }) =>
      await User.removeFollower(userId, followerId),
    followUser: async (root, { userId, followingId }) =>
      await User.followUser(userId, followingId),
    unfollowUser: async (root, { userId, followingId }) =>
      await User.unfollowUser(userId, followingId),
    toggleIMadeThis: async (root, { userId, newVal, recipeId }) =>
      await User.toggleIMadeThis(userId, newVal, recipeId)
  },
  User: {
    id: ({ id }) => id,
    username: ({ username }) => username,
    isAdmin: ({ isAdmin }) => isAdmin,
    ownedRecipes: async ({ ownedRecipes }, { limit, offset }) =>
      await Recipe.findRecipes(ownedRecipes, offset, limit),
    savedRecipes: async ({ savedRecipes }, { limit, offset }) =>
      await Recipe.findRecipes(savedRecipes, offset, limit),
    recipeGroups: async ({ recipeGroups }, { limit, offset, groupName }) => {
      if (groupName) {
        return recipeGroups.filter((group: IRecipeGroup) => {
          return group.name === groupName;
        });
      }
      return recipeGroups.slice(offset, limit);
    },
    googleId: ({ googleId }) => googleId,
    facebookId: ({ facebookId }) => facebookId,
    followers: async ({ followers }, { limit, offset }) =>
      await User.findUsers(followers, offset, limit),
    following: async ({ following }, { limit, offset }) =>
      await User.findUsers(following, offset, limit),
    madeRecipes: async ({ madeRecipes }, { limit, offset }) =>
      await Recipe.findRecipes(madeRecipes, offset, limit)
  },
  RecipeGroup: {
    name: ({ name }) => name,
    recipes: async ({ recipes }, { limit, offset }) =>
      await Recipe.findRecipes(recipes, offset, limit)
  },
  LoginResult: {
    user: ({ user }) => user,
    token: ({ token }) => token,
    apiError: ({ apiError }) => apiError
  }
};

export function UserTypes() {
  return [typeDefs, RecipeTypes];
}
