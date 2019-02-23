import { RecipeTypes, RecipeResolvers } from './Recipe';
import { UserTypes, UserResolvers } from './User';
import UserModel from '../classes/User';
import {
  ApolloServer,
  gql,
  makeExecutableSchema,
  GraphQLUpload
} from 'apollo-server-express';
import Logger from '../Logger';

const typeDefs = gql`
  type Query {
    _deployed: Boolean
  }
  type Mutation {
    _blank: Boolean
  }
  input SearchFilter {
    field: String!
    operator: Operator!
    value: [String]!
  }
  type Error {
    code: String!
    message: String!
  }

  scalar Upload
`;

const RootResolvers = {
  Query: {
    _deployed: () => true
  },
  Mutation: {
    _blank: () => true
  },
  Error: {
    code: ({ code }) => code,
    message: ({ message }) => message
  },
  Upload: GraphQLUpload
};

const Schema = makeExecutableSchema({
  typeDefs: [typeDefs, RecipeTypes, UserTypes],
  resolvers: [RootResolvers, RecipeResolvers, UserResolvers],
  logger: { log: error => Logger.debug(JSON.stringify(error)) }
});

const User: UserModel = new UserModel();

export default new ApolloServer({
  schema: Schema,
  context: async ({ req }) => {
    if (!req.user || !req.user.id) {
      return null;
    }
    const user = await User.findUserById(req.user.id);
    return { user };
  },
  introspection: true,
  engine: {
    apiKey: 'service:BernieCosgriff-3173:KrjvXRL43RTmw4du04s3UA'
  }
});
