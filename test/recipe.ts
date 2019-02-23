process.env.NODE_ENV = 'test';
import '../src/www';
import { expect } from 'chai';
import { createApolloFetch } from 'apollo-fetch';
import Recipe from '../src/classes/Recipe';

const RecipeClass = new Recipe();
const uri = 'http://localhost:8081/graphql';
const fetch = createApolloFetch({
  uri
});

describe('Created Recipe', function() {
  before(async function() {
    const query = `
      mutation CreateRecipe($recipe: NewRecipeInput!) {
        createRecipe(recipe: $recipe) {
          id
          created
          description
          system
          images
          name
          ingredients {
            name
          }
          instructions
          sourceURL
          prepTime
          cookTime
          difficulty
          servings
          rating
          author {
            id
            username
          }
          notes
          numReviews
          numShares
          tags
          comments
        }
      }
    `;
    const variables = {
      recipe: {
        description: 'Temp Description',
        system: 'us',
        images: ['http://example.url'],
        name: 'Temp Recipe',
        ingredients: ['1 cup test'],
        instructions: ['Just Do It'],
        sourceURL: '',
        prepTime: 20,
        cookTime: 40,
        difficulty: 3,
        servings: 1,
        author: '5b5568d26408fa61dcffd9bb',
        notes: ['Make it real nice'],
        tags: ['tasty']
      }
    };
    const result = await fetch({
      query,
      variables
    });
    this.recipe = result.data.createRecipe;
    const userQuery = `
    query user {
      userById(id: "5b5568d26408fa61dcffd9bb") {
        ownedRecipes {
          id
        }
      }
    }
    `;

    const userResult = await fetch({ query: userQuery });
    this.ownedRecipes = userResult.data.userById.ownedRecipes;
  });

  it('should have an id', function() {
    expect(this.recipe.id).to.not.be.null;
    expect(this.recipe.id).to.not.be.empty;
  });
  it('should have a name', function() {
    expect(this.recipe.name).to.equal('Temp Recipe');
  });
  it('should have a created date', function() {
    expect(this.recipe.created).to.not.be.null;
    expect(this.recipe.created).to.not.be.empty;
  });
  it('should have a description', function() {
    expect(this.recipe.description).to.not.be.null;
    expect(this.recipe.description).to.not.be.empty;
  });
  it('should be US system', function() {
    expect(this.recipe.system).to.equal('us');
  });
  it('should have an image', function() {
    expect(this.recipe.images).to.not.be.empty;
  });
  it('should have instructions', function() {
    expect(this.recipe.instructions).to.not.be.empty;
  });
  it('should have ingredients', function() {
    expect(this.recipe.ingredients).to.not.be.empty;
  });
  it('should have a non negative prepTime', function() {
    expect(this.recipe.prepTime).to.not.be.null;
    expect(this.recipe.prepTime).to.be.at.least(0);
  });
  it('should have a non negative cookTime', function() {
    expect(this.recipe.cookTime).to.not.be.null;
    expect(this.recipe.cookTime).to.be.at.least(0);
  });
  it('should have a non negative difficulty', function() {
    expect(this.recipe.difficulty).to.not.be.null;
    expect(this.recipe.difficulty).to.be.at.least(0);
  });
  it('should have more than 0 servings', function() {
    expect(this.recipe.servings).to.not.be.null;
    expect(this.recipe.servings).to.be.at.least(1);
  });
  it('should have a 0 rating', function() {
    expect(this.recipe.rating).to.not.be.null;
    expect(this.recipe.rating).to.be.equal(0);
  });
  it('should have an author', function() {
    expect(this.recipe.author.username).to.not.be.null;
    expect(this.recipe.author.username).to.not.be.empty;
  });
  it('should have some notes', function() {
    expect(this.recipe.notes).to.not.be.null;
    expect(this.recipe.notes).to.not.be.empty;
  });
  it('should have no comments', function() {
    expect(this.recipe.comments).to.not.be.null;
    expect(this.recipe.comments).to.be.empty;
  });
  it('should have 0 reviews', function() {
    expect(this.recipe.numReviews).to.not.be.null;
    expect(this.recipe.numReviews).to.be.equal(0);
  });
  it('should have 0 shares', function() {
    expect(this.recipe.numShares).to.not.be.null;
    expect(this.recipe.numShares).to.be.equal(0);
  });
  it("should be in the user's ownedRecipes", function() {
    expect(this.ownedRecipes).to.deep.include({ id: this.recipe.id });
  });

  after(async function() {
    await RecipeClass.deleteRecipe(this.recipe.id);
  });
});

describe('Updated Recipe', function() {
  before(async function() {
    const createQuery = `
      mutation CreateRecipe($recipe: NewRecipeInput!) {
        createRecipe(recipe: $recipe) {
          id
          created
          description
          system
          images
          name
          ingredients {
            name
          }
          instructions
          sourceURL
          prepTime
          cookTime
          difficulty
          servings
          rating
          author {
            id
            username
          }
          notes
          numReviews
          numShares
          tags
        }
      }
    `;
    const createVariables = {
      recipe: {
        description: 'Test Description',
        system: 'us',
        images: ['http://example.url'],
        name: 'Temp Recipe',
        ingredients: ['1 cup test'],
        instructions: ['Just Do It'],
        sourceURL: '',
        prepTime: 20,
        cookTime: 40,
        difficulty: 3,
        servings: 1,
        author: '5b5568d26408fa61dcffd9bb',
        notes: ['Make it real nice'],
        tags: ['tasty']
      }
    };
    const createResult = await fetch({
      query: createQuery,
      variables: createVariables
    });
    this.oldRecipe = createResult.data.createRecipe;
    const updateQuery = `
      mutation UpdateRecipe($id: String, $recipe: UpdateRecipeInput!) {
        updateRecipe(id: $id, recipe: $recipe) {
          id
          created
          description
          system
          images
          name
          ingredients {
            name
          }
          instructions
          sourceURL
          prepTime
          cookTime
          difficulty
          servings
          rating
          author {
            id
            username
          }
          notes
          numReviews
          numShares
          tags
        }
      }
    `;
    const updateResult = await fetch({
      query: updateQuery,
      variables: {
        id: this.oldRecipe.id,
        recipe: {
          description: 'New Description',
          name: this.oldRecipe.name,
          system: this.oldRecipe.system,
          images: this.oldRecipe.images,
          ingredients: this.oldRecipe.ingredients,
          instructions: ['New Instructions'],
          sourceURL: 'http://foodtomake.com',
          prepTime: 10,
          cookTime: 10,
          difficulty: 2,
          servings: this.oldRecipe.servings,
          notes: [],
          tags: []
        }
      }
    });
    this.newRecipe = updateResult.data.updateRecipe;
  });

  it('should have an the same id', function() {
    expect(this.oldRecipe.id).to.not.be.null;
    expect(this.oldRecipe.id).to.not.be.empty;
    expect(this.newRecipe.id).to.not.be.null;
    expect(this.newRecipe.id).to.not.be.empty;
    expect(this.oldRecipe.id).to.equal(this.newRecipe.id);
  });
  it('should have the same name', function() {
    expect(this.newRecipe.name).to.equal(this.oldRecipe.name);
  });
  it('should have the same created date', function() {
    expect(this.newRecipe.created).to.not.be.null;
    expect(this.newRecipe.created).to.not.be.empty;
    expect(this.newRecipe.created).to.equal(this.oldRecipe.created);
  });
  it('should have a new description', function() {
    expect(this.newRecipe.description).to.not.be.null;
    expect(this.newRecipe.description).to.not.be.empty;
    expect(this.newRecipe.description).to.equal('New Description');
  });
  it('should be the same system', function() {
    expect(this.newRecipe.system).to.not.be.null;
    expect(this.newRecipe.system).to.not.be.empty;
    expect(this.newRecipe.system).to.equal(this.oldRecipe.system);
  });
  it('should have the same images', function() {
    expect(this.newRecipe.images).to.not.be.null;
    expect(this.newRecipe.images).to.not.be.empty;
    expect(this.newRecipe.images).to.deep.equal(this.oldRecipe.images);
  });
  it('should have new instructions', function() {
    expect(this.newRecipe.images).to.not.be.null;
    expect(this.newRecipe.images).to.not.be.empty;
    expect(this.newRecipe.instructions).to.deep.equal(['New Instructions']);
  });
  it('should have the same ingredients', function() {
    expect(this.newRecipe.images).to.not.be.null;
    expect(this.newRecipe.images).to.not.be.empty;
    expect(this.newRecipe.ingredients).to.deep.equal(
      this.oldRecipe.ingredients
    );
  });
  it('should have a prepTime of 10', function() {
    expect(this.newRecipe.prepTime).to.not.be.null;
    expect(this.newRecipe.prepTime).to.equal(10);
  });
  it('should have a cookTime of 10', function() {
    expect(this.newRecipe.cookTime).to.not.be.null;
    expect(this.newRecipe.cookTime).to.equal(10);
  });
  it('should have a difficulty of 2', function() {
    expect(this.newRecipe.difficulty).to.not.be.null;
    expect(this.newRecipe.difficulty).to.equal(2);
  });
  it('should have the same servings', function() {
    expect(this.newRecipe.servings).to.not.be.null;
    expect(this.newRecipe.servings).to.equal(this.oldRecipe.servings);
  });
  it('should have the same rating', function() {
    expect(this.newRecipe.rating).to.not.be.null;
    expect(this.newRecipe.rating).to.be.equal(this.oldRecipe.rating);
  });
  it('should have the same author', function() {
    expect(this.newRecipe.author.username).to.not.be.null;
    expect(this.newRecipe.author.username).to.not.be.empty;
    expect(this.newRecipe.author.username).to.equal(
      this.oldRecipe.author.username
    );
    expect(this.newRecipe.author.id).to.equal(this.oldRecipe.author.id);
  });
  it('should have no notes', function() {
    expect(this.newRecipe.notes).to.not.be.null;
    expect(this.newRecipe.notes).to.be.empty;
  });
  it('should have the same numreviews', function() {
    expect(this.newRecipe.numReviews).to.not.be.null;
    expect(this.newRecipe.numReviews).to.be.equal(this.oldRecipe.numReviews);
  });
  it('should have the same numShares', function() {
    expect(this.newRecipe.numShares).to.not.be.null;
    expect(this.newRecipe.numShares).to.be.equal(this.oldRecipe.numShares);
  });

  after(async function() {
    await RecipeClass.deleteRecipe(this.newRecipe.id);
  });
});
