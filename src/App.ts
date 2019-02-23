import * as express from 'express';
import * as morgan from 'morgan';
import { json, urlencoded } from 'body-parser';
import { set, connect } from 'mongoose';
import * as jwt from 'express-jwt';
import './models/RecipeSchema';
import './models/UserSchema';
import Logger from './Logger';
import GQL from './graphql/Schema';
import * as cors from 'cors';

// Creates and configures an ExpressJS web server.
class App {
  // ref to Express instance
  public express: express.Application;

  // Run configuration methods on the Express instance.
  constructor() {
    this.express = express();
    this.setupMongoose();
    this.middleware();
    this.routes();
  }

  // Configure Express middleware.
  public middleware = (): void => {
    if (process.env.NODE_ENV !== 'test') {
      this.express.use(morgan('dev'));
    }
    this.express.use(json({ limit: '100mb' }));
    this.express.use(urlencoded({ extended: false, limit: '100mb' }));
  };

  private setupMongoose = async (): Promise<void> => {
    Logger.debug('Setting Up Mongoose');
    if (process.env.NODE_ENV === 'development') {
      set('debug', true);
    }
    try {
      const dbconn = process.env.DB_CONNECTION_STRING;
      let dbName = 'foodtomake';
      if (process.env.NODE_ENV === 'test') {
        dbName = 'foodtomaketest';
      }
      await connect(
        dbconn,
        {
          dbName,
          useNewUrlParser: true
        }
      );
      // await connect(process.env.DB_CONNECTION_STRING_LOCAL);
    } catch (err) {
      Logger.error(err);
      throw err;
    }
    Logger.debug('Mongoose Done');
  };

  // Configure API endpoints.
  private routes = (): void => {
    const jwtCheck = jwt({
      audience: process.env.JWT_AUDIENCE,
      credentialsRequired: false,
      issuer: 'api.foodtomake.com',
      secret: process.env.JWT_SECRET
    });
    this.express.use(cors());
    this.express.get(
      '/.well-known/acme-challenge/cUL7pABixx_BXbvK1SuUVjxZvVnYncSyaoyHsfV39I0',
      (req, res, next) => {
        res.send(
          'cUL7pABixx_BXbvK1SuUVjxZvVnYncSyaoyHsfV39I0.uxbVcxwV7Y3lcem5hybJJDbFc2EZ16bUet0J2UBa_Tw'
        );
      }
    );
    this.express.use('/deployed', (req, res, next) => {
      res.json({ result: true });
    });
    this.express.use('*', jwtCheck);
    GQL.applyMiddleware({ app: this.express });
    this.express.use('/graphql', () => {});
    this.express.use(this.handlePathNotFoundError);
    this.express.use(this.handleRestOfErrors);
  };

  private handlePathNotFoundError = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    res.statusCode = 404;
    res.json({
      message: 'Path Not Found',
      status: 404
    });
  };

  private handleRestOfErrors = (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    Logger.error({
      message: err.message,
      stack: err.stack,
      status: 500
    });
    res.json({
      message: err.message,
      status: 500
    });
  };
}

export default new App().express;
