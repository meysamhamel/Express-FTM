import { Schema, model } from 'mongoose';
import { IUser } from '../classes/User';

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    default: ''
  },
  salt: {
    type: String,
    default: ''
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  ownedRecipes: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Recipe'
      }
    ],
    default: []
  },
  savedRecipes: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Recipe'
      }
    ],
    default: []
  },
  recipeGroups: {
    type: [
      {
        name: {
          type: String,
          required: true,
          unique: true
        },
        recipes: {
          type: [
            {
              type: Schema.Types.ObjectId,
              ref: 'Recipe'
            }
          ],
          required: true
        }
      }
    ],
    default: []
  },
  googleId: {
    type: String,
    default: ''
  },
  facebookId: {
    type: String,
    default: ''
  },
  followers: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    default: []
  },
  following: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    default: []
  },
  profilePicture: {
    type: String,
    default: ''
  },
  madeRecipes: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Recipe',
        required: true
      }
    ],
    default: []
  }
});

export default model<IUser>('User', UserSchema);
