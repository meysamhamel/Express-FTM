import { gql } from 'apollo-server-express';
import RecipeModel from '../classes/Recipe';
import { UserTypes } from './User';
import { Model, model } from 'mongoose';
import { IUser } from '../classes/User';
import { uploadPhoto, BucketType } from '../classes/Gcloud';

const UserModel: Model<IUser> = model<IUser>('User');
const Recipe = new RecipeModel();

const typeDefs = gql`
  type Recipe {
    id: ID!
    created: String!
    description: String!
    system: String!
    images: [String]!
    name: String!
    ingredients: [String]!
    instructions: [String]!
    sourceURL: String!
    prepTime: Int!
    cookTime: Int!
    difficulty: Float!
    servings: Int!
    rating: Float!
    author: User!
    notes: [String]!
    numReviews: Int!
    numShares: Int!
    tags: [String]!
    comments: [String]!
    published: Boolean!
    iMadeThis(userId: String): Boolean
  }

  input NewRecipeInput {
    description: String!
    system: String!
    images: [Upload!]!
    name: String!
    ingredients: [String!]!
    instructions: [String]!
    sourceURL: String
    prepTime: Int!
    cookTime: Int!
    difficulty: Float!
    servings: Int!
    notes: [String]
    tags: [String]
    author: String!
    published: Boolean
  }

  input ScrapedRecipeInput {
    description: String!
    system: String!
    image: String!
    name: String!
    ingredients: [String!]!
    instructions: [String]!
    sourceURL: String
    prepTime: Int!
    cookTime: Int!
    difficulty: Float!
    servings: Int!
    notes: [String]
    tags: [String]
    author: String!
  }

  type ScrapeResult {
    result: String!
  }

  input UpdateRecipeInput {
    description: String
    system: String
    imagesToAdd: [Upload]
    imagesToRemove: [String]
    name: String
    ingredients: [String]
    instructions: [String]
    sourceURL: String
    prepTime: Int
    cookTime: Int
    difficulty: Float
    servings: Int
    notes: [String]
    tags: [String]
    comments: [String]
    published: Boolean
  }

  enum Operator {
    EQ
    NEQ
    GT
    GTE
    LT
    LTE
    IN
    NIN
  }

  extend type Query {
    recipeById(id: String!): Recipe
    searchAllRecipes(
      query: String!
      limit: Int
      offset: Int
      filters: [SearchFilter]
    ): [Recipe]
  }

  extend type Mutation {
    createRecipe(recipe: NewRecipeInput!): Recipe
    uploadScrapedRecipe(recipe: ScrapedRecipeInput!): ScrapeResult!
    deleteRecipe(id: String): Boolean
    updateRecipe(id: String, recipe: UpdateRecipeInput): Recipe
    uploadPhoto(file: Upload!): String
  }
`;

export const RecipeResolvers = {
  Query: {
    recipeById: async (root, { id }) => await Recipe.findRecipeById(id),
    searchAllRecipes: async (root, { query, limit, offset, filters }) =>
      await Recipe.searchAllRecipes(query, limit, offset, filters)
  },
  Mutation: {
    createRecipe: async (root, { recipe }) => await Recipe.createRecipe(recipe),
    deleteRecipe: async (root, { id }) => await Recipe.deleteRecipe(id),
    updateRecipe: async (root, { id, recipe }) =>
      await Recipe.updateRecipe(id, recipe),
    uploadPhoto: async (root, { file }) =>
      await uploadPhoto(file, BucketType.RECIPE),
    uploadScrapedRecipe: async (root, { recipe }) =>
      Recipe.uploadScrapedRecipe(recipe)
  },
  Recipe: {
    id: ({ id }) => id,
    created: ({ created }) => created,
    description: ({ description }) => description,
    system: ({ system }) => system,
    images: ({ images }) => images,
    name: ({ name }) => name,
    ingredients: ({ ingredients }) => ingredients,
    instructions: ({ instructions }) => instructions,
    sourceURL: ({ sourceURL }) => sourceURL,
    prepTime: ({ prepTime }) => prepTime,
    cookTime: ({ cookTime }) => cookTime,
    difficulty: ({ difficulty }) => difficulty,
    servings: ({ servings }) => servings,
    rating: ({ rating }) => rating,
    author: async ({ author }) => {
      return await UserModel.findById(author);
    },
    notes: ({ notes }) => notes,
    numReviews: ({ numReviews }) => numReviews,
    numShares: ({ numShares }) => numShares,
    tags: ({ tags }) => tags,
    published: ({ published }) => published,
    iMadeThis: async ({ id }, { userId }) => {
      if (!userId) {
        return false;
      }
      const user = await UserModel.findOne({
        _id: userId,
        madeRecipes: { $in: id }
      });
      return user !== null;
    }
  },
  ScrapeResult: {
    result: ({ result }) => result
  }
};

export function RecipeTypes() {
  return [UserTypes, typeDefs];
}
