import multer from 'multer';
import { Router } from 'express';
import HttpErrors from 'http-errors';
import bearerAuthMiddleware from '../lib/middleware/bearer-auth-middleware';
import Image from '../model/image';
import { uploadS3Asset, removeS3Asset } from '../lib/s3';
import logger from '../lib/logger';

const multerUpload = multer({ dest: `${__dirname}/../temp` });

const imageRouter = new Router();

imageRouter.post('/api/images', bearerAuthMiddleware, multerUpload.any(), (request, response, next) => {
  console.log('LINE 14');
  if (!request.account) return next(new HttpErrors(401, 'IMAGE ROUTER WILL NOT POST: not accessible'));
  const [file] = request.files;
  console.log('LINE 16');
  logger.log(logger.INFO, `IMAGE ROUTER POST: valid image ready to upload: ${JSON.stringify(file, null, 2)}`);
  const key = `${file.filename}.${file.originalname}`;

  return uploadS3Asset(file.path, key)
    .then((url) => {
      logger.log(logger.INFO, `IMAGE ROUTER POST: valid image URL from Amazon S3: ${url}`);
      console.log('LINE 23');
      return new Image({
        title: request.body.title,
        accountId: request.account._id,
        fileName: key,
        url,
      }).save();
    })
    .then((newImage) => {
      logger.log(logger.INFO, `IMAGE ROUTER POST: new image created: ${JSON.stringify(newImage, null, 2)}`);
      console.log('LINE 33');
      console.log(newImage, 'NEW IMAGE');
      return response.json(newImage);
    })
    .catch(next);
});

imageRouter.get('/api/images/:id?', bearerAuthMiddleware, (request, response, next) => {
  if (!request.account) return next(new HttpErrors(401), 'IMAGE ROUTER GET: invalid request');
  if (!request.params.id) return next(new HttpErrors(400, 'IMAGE ROUTER GET: there is no ID'));

  return Image.findById(request.params.id)
    .then((image) => {
      if (!image) return next(new HttpErrors(404, 'IMAGE ROUTER GET: no images are found'));
      logger.log(logger.INFO, `successfully found image ${JSON.stringify(image, null, 2)}`);
      return response.json(image);
    })
    .catch(next);
});

imageRouter.put('/api/images/:id?', bearerAuthMiddleware, (request, response, next) => {
  const options = { runValidators: true, new: true };
  return Image.findIdAndUpdate(request.params.id, request.body, options)
    .then((updatedImage) => {
      logger.log(logger.INFO, 'IMAGE ROUTER PUT: successfully updated, we have 200 status');
      return response(updatedImage);
    })
    .catch(next);
});

imageRouter.delete('/api/images/:id?', bearerAuthMiddleware, (request, response, next) => {
  if (!request.account) return next(new HttpErrors(401, 'IMAGE ROUTER DELETE: invalid request'));
  if (!request.account) return next(new HttpErrors(400, 'IMAGE ROUTER DELETE: no id provided'));

  return Image.findById(request.params.id)
    .then((image) => {
      if (!image) return next(new HttpErrors(404, 'IMAGE ROUTER DELETE: image not found in database'));
      const key = image.fileName;
      return removeS3Asset(key);
    })
    .then(() => {
      Image.findByIdAndRemove(request.params.id)
        .then((image) => {
          logger.log(logger.INFO, 'IMAGE ROUTER DELETE: succesfully deleted image', image);
          return response.sendStatus(204);
        });
    })
    .catch(next);
});

export default imageRouter;
