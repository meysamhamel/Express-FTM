import { IRecipe } from './Recipe';
import { Model, model, Query } from 'mongoose';
import Logger from '../Logger';
import { Document } from 'mongoose';
import { getSalt, getHashedPassword, verifyPassword, getJwt } from './Auth';
import { ObjectID } from 'bson';
import Filter, { applyFilters } from './Filter';
import { uploadPhoto, BucketType, removeImage } from './Gcloud';

export interface IUser extends Document {
  username: string;
  password: string;
  salt: string;
  admin: boolean;
  ownedRecipes: any[]; // Has to be any because of how mongoose populate works
  savedRecipes: any[]; // Has to be any because of how mongoose populate works
  recipeGroups: IRecipeGroup[];
  followers: string[];
  following: string[];
  profilePicture: string;
  getSavedRecipes(userId: number, limit: number, offset: number): Promise<void>;
  addRecipeToBox(userId: number, recipeId: number): Promise<void>;
}

export interface IUserUpdateInput extends Document {
  username: string;
  password: string;
  salt: string;
  admin: boolean;
  profilePicture: any;
}

export interface ILoginResult {
  user: IUser;
  token: string;
  apiError: IError;
}

export interface IError {
  code: string;
  message: string;
}

export interface IRecipeGroup {
  name: string;
  recipes: any[];
}

export default class User {
  private UserModel: Model<IUser>;
  private RecipeModel: Model<IRecipe>;

  constructor() {
    this.UserModel = model<IUser>('User');
    this.RecipeModel = model<IRecipe>('Recipe');
  }

  public login = async (
    username: string,
    password: string
  ): Promise<ILoginResult> => {
    const user: IUser = await this.findUserByUsername(username);
    if (!user) {
      return {
        user: null,
        token: null,
        apiError: {
          code: 'USER_NOT_FOUND',
          message: 'A User with that username does not exist.'
        }
      };
    }
    const valid: boolean = await verifyPassword(
      password,
      user.salt,
      user.password
    );
    if (!valid) {
      return {
        user: null,
        token: null,
        apiError: {
          code: 'INCORRECT_PASSWORD',
          message: 'Incorrect Password.'
        }
      };
    }
    return {
      user,
      token: await getJwt(user),
      apiError: null
    };
  };

  public loginGoogle = async (googleId: string): Promise<ILoginResult> => {
    const user: IUser = await this.UserModel.findOne({ googleId });
    if (!user) {
      return {
        user: null,
        token: null,
        apiError: {
          code: 'USER_NOT_FOUND',
          message: 'A User with that googleId does not exist.'
        }
      };
    }
    return {
      user,
      token: await getJwt(user),
      apiError: null
    };
  };

  public loginFacebook = async (facebookId: string): Promise<ILoginResult> => {
    const user: IUser = await this.UserModel.findOne({ facebookId });
    if (!user) {
      return {
        user: null,
        token: null,
        apiError: {
          code: 'USER_NOT_FOUND',
          message: 'A User with that facebookId does not exist.'
        }
      };
    }
    return {
      user,
      token: await getJwt(user),
      apiError: null
    };
  };

  public deleteUser = async (id: string): Promise<boolean> => {
    return Boolean(await this.UserModel.findByIdAndRemove(id));
  };

  public createUser = async (
    username: string,
    password: string,
    profilePicture: any
  ): Promise<ILoginResult> => {
    let user: IUser = await this.UserModel.findOne({ username });
    if (user) {
      return {
        user: null,
        token: null,
        apiError: {
          code: 'DUPLICATE_USERNAME',
          message: 'That username already exists.'
        }
      };
    }
    const salt = getSalt();
    const hashedPassword = getHashedPassword(password, salt);
    if (profilePicture) {
      const url = await uploadPhoto(profilePicture, BucketType.USER);
      user = await this.UserModel.create({
        username,
        password: hashedPassword,
        salt,
        profilePicture
      });
    } else {
      user = await this.UserModel.create({
        username,
        password: hashedPassword,
        salt
      });
    }
    return {
      user,
      token: await getJwt(user),
      apiError: null
    };
  };

  public createUserGoogle = async (
    googleId: string,
    username: string
  ): Promise<ILoginResult> => {
    let user = await this.findUserByUsername(username);
    if (user) {
      return {
        user: null,
        token: null,
        apiError: {
          code: 'DUPLICATE_USERNAME',
          message: 'Username already exists.'
        }
      };
    }
    user = await this.UserModel.findOne({ googleId });
    if (user) {
      return {
        user: null,
        token: null,
        apiError: {
          code: 'DUPLICATE_GOOGLEID',
          message: 'A User with that googleId already exists.'
        }
      };
    }
    user = await this.UserModel.create({
      googleId,
      username
    });
    return {
      user,
      token: await getJwt(user),
      apiError: null
    };
  };

  public createUserFacebook = async (
    facebookId: string,
    username: string
  ): Promise<ILoginResult> => {
    let user = await this.findUserByUsername(username);
    if (user) {
      return {
        user: null,
        token: null,
        apiError: {
          code: 'DUPLICATE_USERNAME',
          message: 'Username already exists.'
        }
      };
    }
    user = await this.UserModel.findOne({ facebookId });
    if (user) {
      return {
        user: null,
        token: null,
        apiError: {
          code: 'DUPLICATE_FACEBOOKID',
          message: 'A User with that facebookId already exists.'
        }
      };
    }
    user = await this.UserModel.create({
      facebookId,
      username
    });
    return {
      user,
      token: await getJwt(user),
      apiError: null
    };
  };

  public findUserByUsername = async (username: string): Promise<IUser> => {
    return await this.UserModel.findOne({ username });
  };

  public findUserById = async (id: any): Promise<IUser> => {
    return await this.UserModel.findById(id);
  };

  public addSavedRecipe = async (
    userId: string,
    recipeId: string
  ): Promise<IRecipe> => {
    const recipe = await this.getCopyOfRecipe(recipeId);
    recipe.published = false;
    const savedRecipe: IRecipe = await this.RecipeModel.create(recipe);
    this.UserModel.findByIdAndUpdate(userId, {
      $addToSet: { savedRecipes: savedRecipe.id }
    }).exec();
    return savedRecipe;
  };

  public deleteSavedRecipe = async (
    userId: string,
    recipeId: string
  ): Promise<boolean> => {
    try {
      const recipePromise = this.RecipeModel.findByIdAndRemove(recipeId).exec();
      const userPromise = this.UserModel.findByIdAndUpdate(
        userId,
        {
          $pull: { savedRecipes: recipeId }
        },
        { new: true }
      ).exec();
      await recipePromise;
      await userPromise;
      return true;
    } catch (e) {
      Logger.error(e);
      return false;
    }
  };

  public addToRecipeGroup = async (
    userId: string,
    recipeId: string,
    groupName: string
  ): Promise<IUser> => {
    const recipe = await this.getCopyOfRecipe(recipeId);
    const savedRecipe: IRecipe = await this.RecipeModel.create(recipe);
    const user: IUser = await this.UserModel.findById(userId);
    const recipeGroup: IRecipeGroup = user.recipeGroups.find(
      (group: IRecipeGroup) => {
        return group.name === groupName;
      }
    );
    if (!recipeGroup) {
      user.recipeGroups.push({
        name: groupName,
        recipes: [recipeId]
      });
    } else {
      if (
        recipeGroup.recipes.filter(oid => oid.toString() === recipeId).length >
        0
      ) {
        return user;
      }
      recipeGroup.recipes.push(savedRecipe.id);
    }
    return await user.save();
  };

  public removeFromRecipeGroup = async (
    userId: string,
    recipeId: string,
    groupName: string
  ): Promise<IUser> => {
    const user: IUser = await this.UserModel.findById(userId);
    const recipeGroup: IRecipeGroup = user.recipeGroups.find(
      (group: IRecipeGroup) => {
        return group.name === groupName;
      }
    );
    if (!recipeGroup || recipeGroup.recipes.indexOf(recipeId) === -1) {
      return user;
    }
    const recipePromise: Promise<IRecipe> = this.RecipeModel.findByIdAndRemove(
      recipeId
    ).exec();
    recipeGroup.recipes.splice(recipeGroup.recipes.indexOf(recipeId), 1);
    await user.save();
    await recipePromise;
    return user;
  };

  public deleteRecipeGroup = async (
    userId: string,
    groupName: string
  ): Promise<IUser> => {
    const user: IUser = await this.UserModel.findById(userId);
    const recipeGroup: IRecipeGroup = user.recipeGroups.find(
      (group: IRecipeGroup) => {
        return group.name === groupName;
      }
    );
    if (!recipeGroup) {
      return user;
    }
    if (recipeGroup.recipes.length > 0) {
      await this.RecipeModel.deleteMany({ _id: { $in: recipeGroup.recipes } });
    }
    user.recipeGroups = user.recipeGroups.filter((group: IRecipeGroup) => {
      return group.name !== groupName;
    });
    await user.save();
    return user;
  };

  public updateRecipeGroupName = async (
    userId: string,
    oldName: string,
    newName: string
  ): Promise<IUser> => {
    const user: IUser = await this.UserModel.findById(userId);
    const recipeGroup: IRecipeGroup = user.recipeGroups.find(
      (group: IRecipeGroup) => {
        return group.name === oldName;
      }
    );
    if (!recipeGroup) {
      return user;
    }
    recipeGroup.name = newName;
    return await user.save();
  };

  public searchSavedRecipes = async (
    userId: string,
    phrase: string,
    limit: number = 50,
    offset: number = 0,
    filters = []
  ): Promise<IRecipe[]> => {
    const filterArr: Filter[] = filters.map(
      filter => new Filter(filter.field, filter.operator, filter.value)
    );
    const user: IUser = await this.UserModel.findById(userId, 'savedRecipes');
    if (!user) {
      return null;
    }
    if (user.savedRecipes.length === 0) {
      return [];
    }
    const query = this.RecipeModel.find(
      { $text: { $search: phrase } },
      { score: { $meta: 'textScore' } }
    )
      .where('_id')
      .in(user.savedRecipes);
    if (filters) {
      applyFilters(query, filterArr);
    }
    const recipes = await query
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .skip(offset);
    return recipes;
  };

  public searchOwnedRecipes = async (
    userId: string,
    phrase: string,
    limit: number = 50,
    offset: number = 0,
    filters = []
  ): Promise<IRecipe[]> => {
    const filterArr: Filter[] = filters.map(
      filter => new Filter(filter.field, filter.operator, filter.value)
    );
    const user: IUser = await this.UserModel.findById(userId, 'ownedRecipes');
    if (!user) {
      return null;
    }
    if (user.ownedRecipes.length === 0) {
      return [];
    }
    const query = this.RecipeModel.find(
      { $text: { $search: phrase } },
      { score: { $meta: 'textScore' } }
    )
      .where('_id')
      .in(user.ownedRecipes);
    if (filters) {
      applyFilters(query, filterArr);
    }
    const recipes = await query
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .skip(offset);
    return recipes;
  };

  public findUsers = async (
    userIds: string[],
    offset = 0,
    limit = 50
  ): Promise<IUser[]> => {
    if (!userIds) {
      return null;
    }
    if (userIds.length === 0) {
      return [];
    }
    return await this.UserModel.find()
      .where('_id')
      .in(userIds.slice(offset, limit));
  };

  public updateUser = async (
    userId: string,
    userUpdates: IUserUpdateInput
  ): Promise<IUser> => {
    const user = await this.UserModel.findById(userId);
    this.updatePassword(userUpdates);
    await this.updateProfilePicture(user.profilePicture, userUpdates);
    return await this.UserModel.findByIdAndUpdate(user.id, userUpdates, { new: true });
  };

  public updatePassword = async (user: IUserUpdateInput): Promise<void> => {
    const { password } = user;
    if (!password) {
      return;
    }
    const salt: string = getSalt();
    user.password = getHashedPassword(password, salt);
    user.salt = salt;
  };

  public updateProfilePicture = async (
    oldUri: string,
    user: IUserUpdateInput
  ): Promise<void> => {
    const file = await user.profilePicture;
    if (!file || !user) {
      return null;
    }
    if (oldUri) {
      await removeImage(oldUri, BucketType.USER);
    }
    const profilePicture = await uploadPhoto(file, BucketType.USER);
    if (!profilePicture) {
      delete user.profilePicture;
      return;
    }
    user.profilePicture = profilePicture;
  };

  public addFollower = async (
    userId: string,
    followerId: string
  ): Promise<IUser> => {
    return await this.UserModel.findByIdAndUpdate(
      userId,
      {
        $addToSet: { followers: followerId }
      },
      { new: true }
    );
  };

  public removeFollower = async (
    userId: string,
    followerId: string
  ): Promise<IUser> => {
    return await this.UserModel.findByIdAndUpdate(
      userId,
      {
        $pull: { followers: followerId }
      },
      { new: true }
    );
  };

  public followUser = async (
    userId: string,
    followingId: string
  ): Promise<IUser> => {
    return await this.UserModel.findByIdAndUpdate(
      userId,
      {
        $addToSet: { following: followingId }
      },
      { new: true }
    );
  };

  public unfollowUser = async (
    userId: string,
    followingId: string
  ): Promise<IUser> => {
    return await this.UserModel.findByIdAndUpdate(
      userId,
      {
        $pull: { following: followingId }
      },
      { new: true }
    );
  };

  public toggleIMadeThis = async (
    userId: string,
    newVal: boolean,
    recipeId: string
  ): Promise<IUser> => {
    let user = null;
    if (newVal) {
      user = await this.UserModel.findByIdAndUpdate(
        userId,
        {
          $addToSet: { madeRecipes: recipeId }
        },
        { new: true }
      );
    } else {
      user = await this.UserModel.findByIdAndUpdate(
        userId,
        {
          $pull: { madeRecipes: recipeId }
        },
        { new: true }
      );
    }
    return user;
  };

  private getCopyOfRecipe = async (recipeId: string): Promise<IRecipe> => {
    const recipe: IRecipe = await this.RecipeModel.findById(recipeId, {
      _id: 0
    });
    if (!recipe) {
      return null;
    }
    recipe._id = new ObjectID();
    recipe.isNew = true;
    return recipe;
  };
}
