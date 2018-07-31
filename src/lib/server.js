'use strict';

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import logger from './logger';

// middleware
import errorMiddleWare from './middleware/error-middleware';
import loggerMiddleware from './middleware/logger-middleware';

// our routes
import authRouter from '../router/auth-router';
import messageRouter from '../router/message-router';
import imageRouter from '../router/image-router';
import profileRouter from '../router/prof-router';
import reminderRouter from '../router/reminder-router';

const app = express();
const PORT = process.env.PORT || 3000;
let server = null;

// third party apps
const corsOptions = {
  origin: (origin, cb) => {
    if (origin.includes(process.env.CORS_ORIGINS)) {
      cb(null, true);
    } else {
      throw new Error(`${origin} not allowed by CORS`);
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// our own api routers or middleware
app.use(loggerMiddleware);
app.use(authRouter);
app.use(messageRouter);
app.use(reminderRouter);
app.use(imageRouter);
app.use(profileRouter);

// catch all
app.all('*', (request, response) => {
  return response.sendStatus(404).send('Route Not Registered');
});

app.use(errorMiddleWare);
const startServer = () => {
  return mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log(`Listening on PORT: ${process.env.PORT}`); // eslint-disable-line
      server = app.listen(PORT, () => {
      }); 
    })
    .catch((err) => {
      throw err;
    });
};

const stopServer = () => {
  return mongoose.disconnect()
    .then(() => {
      server.close(() => {
        logger.log(logger.INFO, 'Server is off');
      });
    })
    .catch((err) => {
      throw err;
    });
};

export { startServer, stopServer };
