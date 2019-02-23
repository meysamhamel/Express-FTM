import { expect } from 'chai';

export function UserTests(username: string) {
  it('should have id', function() {
    expect(this.user.id).to.not.be.null;
    expect(this.user.id).to.not.be.empty;
  });
  it('should have username', function() {
    expect(this.user.username).to.equal(username);
  });
  it('should have password', function() {
    expect(this.user.password).to.not.be.null;
    expect(this.user.password).to.not.be.empty;
  });
  it('should have a hashed password', function() {
    expect(this.user.password).to.not.equal('password');
  });
  it('should have salt', function() {
    expect(this.user.salt).to.not.be.null;
    expect(this.user.salt).to.not.be.empty;
  });
  it('should not be an admin', function() {
    expect(this.user.isAdmin).to.be.false;
  });
  it('should have no saved recipes', function() {
    expect(this.user.savedRecipes).to.be.empty;
  });
  it('should have no owned recipes', function() {
    expect(this.user.ownedRecipes).to.be.empty;
  });
}
