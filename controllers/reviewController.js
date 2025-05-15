const Review = require('../models/reviewModel');
const { catchAsync } = require('../utils/catchAsync');

exports.findAllReviews = catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const query = await Review.find(filter);
    return res.status(200).json(query);
});

exports.createReview = catchAsync(async (req, res, next) => {
    const data = {
        tour: req.params.tourId,
        user: req.user._id,
        review: req.body.review,
        rating: req.body.rating
    }
    const review = await Review.create(data);
    return res.status(201).json(review);
});