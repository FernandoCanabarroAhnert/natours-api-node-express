const Tour = require('../models/tourModel');
const { catchAsync } = require('../utils/catchAsync');
const ErrorResponse = require('../utils/errorResponse');
const handlerFactory = require("./handlerFactory");
//npm i multer
const multer = require('multer');
//npm i sharp
const sharp = require('sharp');

const storage = multer.memoryStorage(); // -> Armazena a imagem na memória

const fileFilter = (req, file, callback) => {
    if (!file.mimetype.startsWith('image')) {
        callback(new ErrorResponse(400, "Bad Request", "Invalid file type"), false);
    }
    else {
        callback(null, true);
    }
};
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);

// upload.array('images', 3); // -> para fazer o upload de várias imagens, mas não é o que estamos usando no momento,
// pois há um a diferença entre as imagens (capa e imagens)

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next();

    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`uploads/img/tours/${req.body.imageCover}`);

    req.body.images = [];
    await Promise.all(req.files.images.map(async (file, index) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
        await sharp(file.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`uploads/img/tours/${filename}`);
        req.body.images.push(filename);
    }));
    next();
});

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,difficulty,duration';
    next();
}

exports.findAllTours = handlerFactory.findAll(Tour);
exports.findTourById = handlerFactory.findById(Tour, { path: 'reviews' });
exports.createTour = handlerFactory.createOne(Tour);
exports.updateTour = handlerFactory.updateOne(Tour);
exports.deleteTour = handlerFactory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        { $match: { ratingsAverage: { $gte: 4.5 } }},
        {
            $group: { 
                _id: { $toUpper: '$difficulty' }, // -> equivalente ao GROUP BY do SQL. null significa que não vai agrupar por nada, ou seja, vai trazer todos os dados
                numOfTours: { $sum: 1 },
                numOfRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' } 
            } 
        },
        {
            $sort: { avgPrice: -1 }
        }
    ]);
    return res.status(200).json(stats);
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlong, unit } = req.params;
    const [ lat, long ] = latlong.split(',');
    if (!lat || !long) {
        return next(new ErrorResponse(400, 'Bad Request', 'Please provide latitude and longitude in the format lat,long'));
    }
    const radius = unit === 'miles' ? distance / 3963.2 : distance / 6378.1;
    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[long, lat], radius] } }
    });
    return res.status(200).json(tours);
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlong, unit } = req.params;
    const [ lat, long ] = latlong.split(',');
    if (!lat || !long) {
        return next(new ErrorResponse(400, 'Bad Request', 'Please provide latitude and longitude in the format lat,long'));
    }
    const multiplier = unit === 'miles' ? 0.000621371 : 0.001; // -> o valor padrão é em metros, então precisamos converter para milhas ou quilômetros
    const distances = await Tour.aggregate([
        { 
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [long * 1, lat * 1]
                },
                distanceField: 'distance', // -> o nome do campo que vai receber a distância. 
                // -> essas 2 configurações são sempre padrão
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);
    return res.status(200).json(distances);
})

exports.getMonthlyPlan = async (req, res) => {
    try {
        let year = Number(req.params.year);
        const match_start = `${year}-01-01`;
        const match_end = `${year + 1}-01-01`;

        let plan = await Tour.aggregate([
            {
                $unwind: '$startDates',
            },
            // {
            //     $match: {
            //       startDates: {
            //         $gte: new Date(`${year}-01-01`),
            //         $lte: new Date(`${year}-12-31`),
            //       },
            //     },
            // }, -> o fluxo correto seria este, mas por algum motivo o JSON do instrutor está com um bug nas datas, e quando fazemos a comparação ele retorna errado.
            //       então, para casos futuros, considerar este que está comentado
            {
                $addFields: {
                    datePart: { $arrayElemAt: [{ $split: ['$startDates', ','] }, 0] },
                    timePart: { $arrayElemAt: [{ $split: ['$startDates', ','] }, 1] },
                },
            },
            {
                $addFields: {
                    formattedDate: {
                        $dateFromString: {
                            dateString: {
                                $concat: ['$datePart', 'T', '$timePart'],
                            },
                        },
                    },
                },
            },
            {
                $match: {
                    formattedDate: {
                        $gte: new Date(match_start),
                        $lt: new Date(match_end),
                    },
                },
            },
            {
                $group: {
                    _id: { $month: '$formattedDate' },
                    numTourStarts: { $sum: 1 },
                    tours: { $push: '$name' },
                },
            },
            {
                $addFields: {
                    month: '$_id',
                },
            },
            {
                $project: {
                    _id: 0,
                },
            },
            {
                $sort: {
                    numTourStarts: -1,
                },
            },
            {
                $limit: 12,
            }
        ]);
        res.status(200).json({ plan });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.priceAggregation = async (req, res) => {
    try {
        const response = await Tour.aggregate([
            {
                $group: {
                    _id: '$price',
                    tours: { $push: '$$ROOT' },
                }
            },
            {
                $addFields: {
                    price: '$_id',
                }
            },
            {
                $project: {
                    _id: 0
                }
            },
            {
                $sort: {
                    price: -1
                }
            }
        ]);
        return res.status(200).json(response);
    }
    catch (error) {
        return res.status(404).json({
            timestamp: new Date().toISOString(),
            status: 404,
            error: 'Not Found',
            message: "Tour not found"
        })
    }
}