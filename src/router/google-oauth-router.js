import { Router } from 'express';
import superagent from 'superagent';
import HttpErrors from 'http-errors';
import uuid from 'uuid/v4';
import jwt from 'jsonwebtoken';
import Account from '../model/account';
import logger from '../lib/logger';

require('dotenv').config();

const GOOGLE_OAUTH_URL = 'https://www.googleapis.com/oauth2/v4/token';
const OPEN_ID_URL = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';

const googleOAuthRouter = new Router();

googleOAuthRouter.get('/api/oauth/google', (request, response, next) => {
  console.log('HITTING API/OAUTH/GOOGLE');
  if (!request.query.code) {
    logger.log(logger.ERROR, 'DID NOT GET CODE FROM GOOGLE');
    response.redirect(process.env.CLIENT_URL);
    return next(new HttpErrors(500, 'Google OAuth Error'));
  }
  logger.log(logger.INFO, `RECVD CODE FROM GOOGLE AND SENDING IT BACK TO GOOGLE: ${request.query.code}`);
  let accessToken;
  console.log('LINE 25');
  console.log({
    code: request.query.code,
    grant_type: 'authorization_code',
    client_id: process.env.GOOGLE_OAUTH_ID,
    client_secret: process.env.GOOGLE_OAUTH_SECRET,
    redirect_uri: `${process.env.API_URL}/oauth/google`,
  });
  
  return superagent.post(GOOGLE_OAUTH_URL)
    .type('form')
    .send({
      code: request.query.code,
      grant_type: 'authorization_code',
      client_id: process.env.GOOGLE_OAUTH_ID,
      client_secret: process.env.GOOGLE_OAUTH_SECRET,
      redirect_uri: `${process.env.API_URL}/oauth/google`,
    })
    .then((googleTokenResponse) => {
      console.log('LINE 35');
      if (!googleTokenResponse.body.access_token) {
        logger.log(logger.ERROR, 'No Token from Google');
        return response.redirect(process.env.CLIENT_URL);
      }
      logger.log(logger.INFO, `RECEIVED GOOGLE ACCESS TOKEN: ${JSON.stringify(googleTokenResponse.body, null, 2)}`);
      accessToken = googleTokenResponse.body.access_token;

      logger.log(logger.INFO, `ACCESS TOKEN RECEIVED: ${JSON.stringify(accessToken)}`);
      return superagent.get(OPEN_ID_URL)
        .set('Authorization', `Bearer ${accessToken}`);
    })
    .then((openIDResponse) => {
      logger.log(logger.INFO, `OPEN ID: ${JSON.stringify(openIDResponse.body, null, 2)}`);
      console.log('LINE 50');
      const { email } = openIDResponse.body;
      const username = email;
      const cookieOptions = { maxAge: 7 * 1000 * 60 * 60 * 24 };

      return Account.init()
        .then(() => {
          return Account.find({ email })
            .then((accounts) => {
              // if the account does not already exist
              console.log('LINE 60');
              if (accounts.length === 0) {
                const password = uuid();
                return Account.create(username, email, password)
                  .then((newSavedAccount) => {
                    console.log(newSavedAccount, 'NEW SAVED ACCOUNT from line 61');
                    newSavedAccount.tokenSeed = accessToken;
                    return newSavedAccount.save()
                      .then((savedAccountWithGoogleToken) => {
                        const jsonWebToken = jwt.sign({ tokenSeed: savedAccountWithGoogleToken.tokenSeed }, process.env.SECRET_KEY);
                        
                        return response.cookie('_token', jsonWebToken, cookieOptions).redirect(`${process.env.CLIENT_URL}/dashboard`);
                      });
                  });
              }
              
              // if the account already exists
              const accountFromDB = accounts[0];
              console.log(accountFromDB, 'ACCOUNT FROM DB line 76');
              const jsonWebToken = jwt.sign({ tokenSeed: accountFromDB.tokenSeed }, process.env.SECRET_KEY);
              console.log('LINE 80');
              console.log(jsonWebToken, 'JSON WEB TOKEN');
              
              response.body = jsonWebToken;
              return response
                .cookie('_token', jsonWebToken, cookieOptions)
                .redirect(`${process.env.CLIENT_URL}/dashboard`);
            });
        });
    })
    .catch(next);
});

export default googleOAuthRouter;
