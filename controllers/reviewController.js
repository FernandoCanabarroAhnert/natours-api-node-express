const Review = require('../models/reviewModel');
const { catchAsync } = require('../utils/catchAsync');
const handlerFactory = require("./handlerFactory");

// exports.findAllReviews = catchAsync(async (req, res, next) => {
//     let filter = {};
//     if (req.params.tourId) filter = { tour: req.params.tourId };
//     const query = await Review.find(filter);
//     return res.status(200).json(query);
// });

exports.findAllReviews = handlerFactory.findAll(Review);
exports.setReviewUserIdAndTourId = (req, res, next) => {
    req.body.user = req.user._id;
    req.body.tour = req.params.tourId;
    next();
}
exports.createReview = handlerFactory.createOne(Review);
exports.updateReview = handlerFactory.updateOne(Review);
exports.deleteReview = handlerFactory.deleteOne(Review);