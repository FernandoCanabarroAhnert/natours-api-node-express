const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        trim: true,
        unique: true,
        maxlength: [40, 'A tour name must have less or equal than 40 characters'],
        minlength: [10, 'A tour name must have more or equal than 10 characters'],
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: (value) => Math.round(value * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price'],
        min: [0, 'Price must be above 0']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(value) { // -> this só funciona com funções normais, não com arrow functions
                return value < this.price; // -> this é o documento atual, ou seja, o tour que está sendo criado ou atualizado
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        }
    },
    summary: {
        type: String,
        required: [true, 'A tour must have a summary'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [{
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
    }],
    //guides: Array
    guides: [
        { 
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dshpere' })

// Devemos usar uma função normal para o virtual, pois se usarmos uma arrow function, o this não vai funcionar corretamente
tourSchema.virtual('durationWeeks').get(function() { // -> virtuals não são salvos no banco de dados, eles são apenas uma representação do dado, como um DTO
    return this.duration / 7
});
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id' // -> o _id é o id do tour
})

// Document Middleware -> executado somente com o .save() ou .create()
tourSchema.pre('save', function(next) { // -> é similar a uma trigger do SQL. O 'pre' é executado antes
    this.slug = slugify(this.name, { lower: true }); // -> o this é o documento
    next();
});

// tourSchema.pre('save', async function(next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id)); // -> a iteração do map vai retornar um array de promises
//     this.guides = await Promise.all(guidesPromises);
//     next();
// })

// tourSchema.pre('aggregate', function(next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
//     next();
// });

tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordLastChangedAt'
    })
    next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;