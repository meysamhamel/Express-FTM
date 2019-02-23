process.env.NODE_ENV = 'test';
import '../src/www';
import { expect } from 'chai';
import { createApolloFetch } from 'apollo-fetch';
import { verify } from 'jsonwebtoken';
import { UserTests } from './shared';
import User from '../src/classes/User';

const UserClass = new User();
const uri = 'http://localhost:8081/graphql';
const fetch = createApolloFetch({
  uri
});

describe('Created User', function() {
  before(async function() {
    const query = `
      mutation CreateUser($username: String!, $password: String!) {
        createUser(username: $username, password: $password) {
          id
          username
          password
          salt
          isAdmin
          savedRecipes {
            name
          }
          ownedRecipes {
            name
          }
        }
      }
    `;
    const variables = {
      username: 'temp_user',
      password: 'password'
    };
    const result = await fetch({
      query,
      variables
    });
    this.user = result.data.createUser;
  });

  UserTests('temp_user');

  after(async function() {
    await UserClass.deleteUser(this.user.id);
  });
});

describe('Selected User by Username', function() {
  before(async function() {
    const query = `
      query {
        userByUsername(username: "test_user") {
          id
          username
          password
          salt
          isAdmin
          savedRecipes {
            name
          }
          ownedRecipes {
            name
          }
        }
      }
    `;
    const result = await fetch({
      query
    });
    this.user = result.data.userByUsername;
  });
  UserTests('test_user');
});

describe('Selected User by Id', function() {
  before(async function() {
    const query = `
      query {
        userById(id: "5b5568d26408fa61dcffd9bb") {
          id
          username
          password
          salt
          isAdmin
          savedRecipes {
            name
          }
          ownedRecipes {
            name
          }
        }
      }
    `;
    const result = await fetch({
      query
    });
    this.user = result.data.userById;
  });
  UserTests('test_user');
});

describe('Login', function() {
  before(async function() {
    const query = `
      query {
        login(username: "test_user", password: "password")
      }
    `;
    const result = await fetch({
      query
    });
    this.token = result.data.login;
  });

  it('should not be null', function() {
    expect(this.token).to.not.be.null;
  });

  it('should not be empty', function() {
    expect(this.token).to.not.be.empty;
  });

  it('should be a valid token', function() {
    verify(this.token, process.env.JWT_SECRET, (err, payload) => {
      expect(err).to.be.null;
      expect(payload).to.not.be.null;
      expect(payload).to.not.be.empty;
    });
  });
});

describe('Deleted User', function() {
  before(async function() {
    const savedUser = await UserClass.createUser('temp_user', 'password');
    let query = `
      mutation mutation($id: String!) {
        deleteUser(userId: $id)
      }
    `;
    let variables = {
      id: savedUser.id
    };
    let result = await fetch({
      query,
      variables
    });
    this.success = result.data.deleteUser;
    query = `
      query {
        userByUsername(username: "temp_user") {
          username
        }
      }
    `;
    result = await fetch({
      query
    });
    this.user = result.data.userByUsername;
  });

  it('success should not be null', function() {
    expect(this.success).to.not.be.null;
  });

  it('success should be true', function() {
    expect(this.success).to.be.true;
  });

  it('should be null', function() {
    expect(this.user).to.be.null;
  });
});
