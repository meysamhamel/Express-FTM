import { Storage } from '@google-cloud/storage';
import { v4 } from 'uuid';
import Logger from '../Logger';
import * as request from 'request';

const storage = new Storage({
  projectId: 'foodtomake-216206',
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

export const storePhotoFromUri = async (
  uri,
  bucketType,
  name
): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const bucket = storage.bucket(bucketType);
    const filename = `${v4()}${name.replace(/ /g, '-')}`;
    const remoteFile = bucket.file(filename);
    const dest = remoteFile.createWriteStream({
      metadata: {
        contentType: 'image/jpeg'
      }
    });
    request(uri).pipe(
      dest
        .on('finish', async () => {
          remoteFile.makePublic(() => {
            resolve(
              `https://storage.googleapis.com/${bucket.name}/${filename}`
            );
          });
        })
        .on('error', err => reject(err))
    );
  });
};

const storePhoto = async (
  stream,
  filename,
  mimetype,
  bucket
): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const name = `${v4()}${filename}`;
    const image = bucket.file(name);
    const imageStream = image.createWriteStream({
      metadata: {
        contentType: mimetype
      }
    });
    stream.pipe(
      imageStream
        .on('finish', async () => {
          image.makePublic(() => {
            resolve(name);
          });
        })
        .on('error', err => reject(err))
    );
  });
};

export const uploadPhoto = async (
  file,
  bucketType: BucketType
): Promise<string> => {
  const { stream, filename, mimetype } = await file;
  try {
    const bucket = storage.bucket(bucketType);
    const name = await storePhoto(stream, filename, mimetype, bucket);
    return `https://storage.googleapis.com/${bucket.name}/${name}`;
  } catch (err) {
    Logger.error(err);
    return null;
  }
};

export const uploadPhotos = async (
  files: any[],
  bucketType: BucketType
): Promise<string[]> => {
  return Promise.all(files.map(file => uploadPhoto(file, bucketType)));
};

export const removeImage = async (
  uri: string,
  bucketType: BucketType
): Promise<void> => {
  const filename = uri.substring(
    uri.indexOf(`${bucketType}/`) + `${bucketType}/`.length,
    uri.length
  );
  const file = await storage.bucket(bucketType).file(filename);
  const exists = await file.exists({});
  if (!exists[0]) {
    return;
  }
  return file.delete({});
};

export const removeImages = async (
  uris: string[],
  bucketType: BucketType
): Promise<void[]> => {
  const promises = [];
  for (const uri of uris) {
    promises.push(removeImage(uri, bucketType));
  }
  return Promise.all(promises);
};

export enum BucketType {
  RECIPE = 'foodtomake-recipe-photos',
  USER = 'foodtomake-user-storage'
}
