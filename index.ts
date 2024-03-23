/* eslint-disable prettier/prettier */
/* eslint-disable semi */
import 'module-alias/register';
import { config } from 'dotenv';
import express, { Request, Response, Express, NextFunction } from 'express';
import userRouter from '@user/controller';
import connectionRouter from '@connections/controller';
import cronRouter from '@cron/controller';
import { handleError } from '@utils/CustomError';
import { connectDb } from '@utils/config/db';
import { generateErrorMessage } from '@utils/response';
import cors from 'cors';
import { getCloudinary } from '@utils/uploadImageToCloud';
class Server {
  private app: Express;
  private readonly PORT: number = parseInt(process.env.PORT || '3001');

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.configEnv();
  }

  private configEnv() {
    config();
  }

  private initializeMiddlewares() {
    this.app.use(express.json());
    this.app.use(cors());
  }

  private initializeRoutes() {
    this.app.use('/health', (req: Request, res: Response) => {
      return res.send(
        generateErrorMessage({
          code: 200,
          message: 'Health check, service is up!'
        })
      );
    });

    this.app.use('/api/user', userRouter);
    this.app.use('/api/connections', connectionRouter);
    this.app.use('/api/schedule', cronRouter);

    this.app.use(
      // eslint-disable-next-line no-unused-vars
      (err: any, req: Request, res: Response, _next: NextFunction) => {
        handleError(err, req, res);
      }
    );

    this.app.use('*', (req: Request, res: Response) => {
      return res.send(
        generateErrorMessage({ code: 404, message: 'Route not found' })
      );
    });
  }

  public async start() {
    await connectDb();
    await getCloudinary();
    this.app.listen(this.PORT, () => {
      console.log(`Server is running on http://localhost:${this.PORT}`);
    });
  }
}

// Initialize and start the server
const server = new Server();
server.start();
