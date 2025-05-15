const express = require('express');

const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');

const tourRouter = express.Router();

tourRouter
    .get('/', authController.authGuard, tourController.findAllTours)
    .post('/', authController.authGuard, authController.preAuthorize('admin'), tourController.createTour)
    .get('/:id', tourController.findTourById)
    .put('/:id', tourController.updateTour)
    .delete('/:id', tourController.deleteTour)
    .get('/top-5-cheap', tourController.aliasTopTours, tourController.findAllTours)
    .get('/stats', tourController.getTourStats)
    .get('/monthly-plan/:year', tourController.getMonthlyPlan)
    .get('/price', tourController.priceAggregation);

tourRouter.use('/:tourId/reviews', reviewRouter);

module.exports = tourRouter;