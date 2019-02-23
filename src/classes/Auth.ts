import { createHash, randomBytes, Hash } from 'crypto';
import { sign } from 'jsonwebtoken';
import { IUser } from './User';

export async function verifyPassword(
  password: string,
  salt: string,
  hashedPassword: string
): Promise<boolean> {
  const hash: Hash = createHash('sha512');
  hash.update(password + salt);
  const digest: string = hash.digest('hex');
  return hashedPassword === digest;
}

export async function getJwt(user: IUser): Promise<string> {
  const payload = {
    id: user._id,
    admin: user.admin,
    iss: 'api.foodtomake.com',
    aud: process.env.JWT_AUDIENCE
  };
  return await sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
}

export function getSalt(): string {
  return randomBytes(32)
    .toString('hex')
    .slice(0, 32);
}

export function getHashedPassword(password: string, salt: string): string {
  return createHash('sha512')
    .update(password + salt)
    .digest('hex');
}
