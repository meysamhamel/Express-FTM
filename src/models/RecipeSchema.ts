import { model, Schema } from 'mongoose';
import { IRecipe } from '../classes/Recipe';

const RecipeSchema: Schema = new Schema(
  {
    created: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      required: true
    },
    system: {
      type: String,
      default: 'us'
    },
    images: {
      type: [String],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    ingredients: {
      type: [String],
      required: true
    },
    instructions: {
      type: [String],
      required: true
    },
    sourceURL: {
      type: String,
      default: ''
    },
    prepTime: {
      type: Number,
      required: true
    },
    cookTime: {
      type: Number,
      required: true
    },
    difficulty: {
      type: Number,
      required: true
    },
    servings: {
      type: Number,
      required: true
    },
    rating: {
      type: Number,
      default: 0
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: [],
      default: []
    },
    numReviews: {
      type: Number,
      default: 0
    },
    numShares: {
      type: Number,
      default: 0
    },
    tags: {
      type: [],
      default: []
    },
    comments: {
      type: [],
      default: []
    },
    published: {
      type: Boolean,
      default: false
    }
  },
  {
    collation: {
      locale: 'en_US',
      strength: 1
    }
  }
);

// RecipeSchema.index(
//   {
//     name: 'text',
//     ingredients: 'text',
//     instructions: 'text',
//     description: 'text'
//   },
//   {
//     weights: {
//       name: 4,
//       ingredients: 2,
//       instructions: 1,
//       description: 2
//     }
//   }
// );

export default model<IRecipe>('Recipe', RecipeSchema);
