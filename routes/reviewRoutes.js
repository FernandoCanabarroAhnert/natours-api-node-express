const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const reviewRouter = express.Router({ mergeParams: true });

reviewRouter
    .get('/', reviewController.findAllReviews)
    .post('/', authController.authGuard, authController.preAuthorize('user'), reviewController.setReviewUserIdAndTourId, reviewController.createReview)
    .put('/:id', authController.authGuard, authController.preAuthorize('user'), reviewController.updateReview)
    .delete('/:id', authController.authGuard, authController.preAuthorize('user', 'admin'), reviewController.deleteReview);

module.exports = reviewRouter;