import { IUser } from './User';
import { Document, Model, model, Query } from 'mongoose';
import Filter, { applyFilters } from './Filter';
import {
  uploadPhotos,
  removeImages,
  BucketType,
  storePhotoFromUri
} from './Gcloud';

export interface IRecipe extends Document {
  created: string;
  description: string;
  system: string;
  images: any[];
  name: string;
  ingredients: string[];
  instructions: string[];
  sourceURL: string;
  prepTime: string;
  cookTime: string;
  difficulty: number;
  servings: number;
  rating: number;
  author: IUser;
  notes: string[];
  numReviews: number;
  numShares: number;
  tags: string[];
  published: boolean;
}

export interface INewRecipeInput {
  description: string;
  system: string;
  images: any[];
  name: string;
  ingredients: string[];
  instructions: string[];
  sourceURL: string;
  prepTime: number;
  cookTime: number;
  difficulty: number;
  servings: number;
  notes: string[];
  tags: string[];
  published: boolean;
}

export interface IScrapedRecipeInput {
  description: string;
  system: string;
  image: string;
  images: any[];
  name: string;
  ingredients: string[];
  instructions: string[];
  sourceURL: string;
  prepTime: number;
  cookTime: number;
  difficulty: number;
  servings: number;
  notes: string[];
  tags: string[];
  author: string;
  published: boolean;
}

export interface IUpdateRecipeInput {
  description: string;
  system: string;
  imagesToAdd: any[];
  imagesToRemove: string[];
  images: string[];
  name: string;
  ingredients: string[];
  instructions: string[];
  sourceURL: string;
  prepTime: number;
  cookTime: number;
  difficulty: number;
  servings: number;
  notes: string[];
  tags: string[];
  published: boolean;
}

export default class Recipe {
  private RecipeModel: Model<IRecipe>;
  private UserModel: Model<IUser>;

  constructor() {
    this.RecipeModel = model<IRecipe>('Recipe');
    this.UserModel = model<IUser>('User');
  }

  public searchAllRecipes = (
    phrase: string,
    limit: number = 50,
    offset: number = 0,
    filters = []
  ): Promise<IRecipe[]> => {
    const filterArr: Filter[] = filters.map(
      filter => new Filter(filter.field, filter.operator, filter.value)
    );
    const query: Query<IRecipe[]> = this.RecipeModel.find(
      { $text: { $search: phrase } },
      { score: { $meta: 'textScore' } }
    );
    if (filters) {
      applyFilters(query, filterArr);
    }
    return query
      .where('published', true)
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .skip(offset)
      .exec();
  };

  public findRecipeById = async (id: string): Promise<IRecipe> => {
    return await this.RecipeModel.findById(id);
  };

  public createRecipe = async (recipe: INewRecipeInput): Promise<IRecipe> => {
    const { images } = recipe;
    if (images && images.length) {
      const imageUrls = await uploadPhotos(images, BucketType.RECIPE);
      if (images) {
        recipe.images = imageUrls;
      }
    }
    if (!recipe.images) {
      recipe.images = [];
    }
    const newRecipe = await this.RecipeModel.create(recipe);
    await this.UserModel.findByIdAndUpdate(newRecipe.author, {
      $addToSet: { ownedRecipes: newRecipe.id }
    });
    return newRecipe;
  };

  public uploadScrapedRecipe = async (
    recipe: IScrapedRecipeInput
  ): Promise<{ result: string }> => {
    const existingRecipe = await this.RecipeModel.find({
      name: recipe.name,
      author: recipe.author
    });
    if (existingRecipe && existingRecipe.length) {
      return { result: 'Duplicate Recipe' };
    }
    recipe.published = true;
    const { image } = recipe;
    const url = await storePhotoFromUri(image, BucketType.RECIPE, recipe.name);
    delete recipe.image;
    recipe.images = [url];
    const newRecipe = await this.RecipeModel.create(recipe);
    await this.UserModel.findByIdAndUpdate(newRecipe.author, {
      $addToSet: { ownedRecipes: newRecipe.id }
    });
    return { result: `${newRecipe.name} Saved` };
  };

  public deleteRecipe = async (id: string): Promise<boolean> => {
    const recipeToRemove = await this.RecipeModel.findByIdAndRemove(id);
    if (!recipeToRemove) {
      return false;
    }
    await this.UserModel.findByIdAndUpdate(recipeToRemove.author.toString(), {
      $pull: { ownedRecipes: recipeToRemove.id }
    });
    return true;
  };

  public updateRecipe = async (
    id: string,
    recipe: IUpdateRecipeInput
  ): Promise<IRecipe> => {
    if ('imagesToAdd' in recipe) {
      const images = await uploadPhotos(recipe.imagesToAdd, BucketType.RECIPE);
      if (images) {
        recipe.images = images;
      }
    }
    if ('imagesToRemove' in recipe) {
      const removeImagesPromise = removeImages(
        recipe.imagesToRemove,
        BucketType.RECIPE
      );
      const r = await this.RecipeModel.findById(id);
      if (!r) {
        return null;
      }
      recipe.images = r.images.filter(uri => {
        return !recipe.imagesToRemove.includes(uri);
      });
      delete recipe.imagesToRemove;
      await removeImagesPromise;
    }
    return await this.RecipeModel.findByIdAndUpdate(id, recipe, {
      new: true
    });
  };

  public findRecipes = async (
    recipeIds: string[],
    offset = 0,
    limit = 50
  ): Promise<IRecipe[]> => {
    if (!recipeIds) {
      return null;
    }
    if (recipeIds.length === 0) {
      return [];
    }
    return await this.RecipeModel.find()
      .where('_id')
      .in(recipeIds.slice(offset, limit));
  };
}
