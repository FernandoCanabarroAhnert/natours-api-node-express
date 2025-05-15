const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const reviewRouter = express.Router({ mergeParams: true });

reviewRouter
    .get('/', reviewController.findAllReviews)
    .post('/', authController.authGuard, authController.preAuthorize('user'), reviewController.createReview)

module.exports = reviewRouter;