const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Required field'],
        trim: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Required field']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Required field']
    }
},
{
    toJson: { virtuals: true },
    toObject: { virtuals: true }
});

reviewSchema.pre(/^find/, function(next) {
    // this.populate({
    //         path: 'user',
    //         select: '-__v -passwordLastChangedAt'
    //     })
    //     .populate({
    //         path: 'tour',
    //         select: 'name ratingsAverage ratingsQuantity'
    //     });
    this.populate({
            path: 'user',
            select: '-__v -passwordLastChangedAt'
        });
    next();
})

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;