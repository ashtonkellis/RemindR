import { Router } from 'express';
import HttpErrors from 'http-errors';
import Profile from '../model/profile';
import bearerAuthMiddleware from '../lib/middleware/bearer-auth-middleware';
import logger from '../lib/logger';

const profileRouter = new Router();

profileRouter.post('/api/profiles', bearerAuthMiddleware, (request, response, next) => {
  if (!request.account) return next(new HttpErrors(400, 'POST PROFILE ROUTER-AUTH: invalid request'));
  Profile.init()
    .then(() => {
      return new Profile({
        ...request.body,
        accountId: request.account._id,
      })
        .save()
        .then((profile) => {
          logger.log(logger.INO, `POST PROFILE ROUTER: new profile created with 200 code, ${JSON.stringify(profile, null, 2)}`);
          return response.json(profile);
        })
        .catch(next);
    })
    .catch(next);
  return undefined;
});

profileRouter.get('/api/profiles/:id?', bearerAuthMiddleware, (request, response, next) => {
  if (!request.account) return next(new HttpErrors(400, 'GET PROFILE ROUTER-AUTH: invalid request'));
  if (!request.params.id) {
    Profile.find({})
      .then((profiles) => {
        return response.json(profiles);
      })
      .catch(next);
    return undefined;
  }
  Profile.findOne({ _id: request.params.id })
    .then((profile) => {
      if (!profile) return next(new HttpErrors(400, 'profile not found'));
      logger.log(logger.INFO, `PROFILE ROUTER GET: found profile: ${JSON.stringify(profile, null, 2)}`);
      return response.json(profile);
    })
    .catch(next);
  return undefined;
});

profileRouter.put('/api/profiles/:id?', bearerAuthMiddleware, (request, response, next) => {
  if (!request.account) return next(new HttpErrors(400, 'GET IT FIRST'));
  if (!request.params.id) {
    Profile.find({})
      .then((profiles) => {
        return response.json(profiles);
      })
      .catch(next);
    return undefined;
  }
  Profile.findOneAndUpdate(request.params._id, request.body, { new: true })
    .then((updatedProfile) => {
      logger.log(logger.INFO, `PROFILE ROUTER PUT: found profile ${JSON.stringify(updatedProfile, null, 2)}`);
      return response.json(updatedProfile);
    })
    .catch(next);
  return undefined;
});

profileRouter.delete('/api/profiles/:id?', bearerAuthMiddleware, (request, response, next) => {
  if (!request.account) return next(new HttpErrors(400, 'GET IT FIRST'));
  if (!request.params.id) {
    Profile.find({})
      .then((profiles) => {
        return response.json(profiles);
      })
      .catch(next);
    return undefined;
  }
  Profile.findByIdAndRemove(request.params._id)
    .then(() => {
      const successfulDelete = {
        message: 'Profile successfully deleted yall',
        id: request._id,
      };
      return response.status(204).send(successfulDelete);
    })
    .catch(next);
  return undefined;
});

profileRouter.get('/api/profiles/me', bearerAuthMiddleware, (request, response, next) => {
  if (!request.account) return next(new HttpErrors(400, 'GET PROFILE ROUTER-AUTH: invalid request'));

  return Profile.findOne({ accountId: request.account._id })
    .then((profile) => {
      if (!profile) return next(new HttpErrors(404, 'not found'));
      return response.json(profile);
    })
    .catch(next);
});

export default profileRouter;
