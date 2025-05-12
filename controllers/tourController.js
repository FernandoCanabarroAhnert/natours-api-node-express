const Tour = require('../models/tourModel');
const { catchAsync } = require('../utils/catchAsync');
const ErrorResponse = require('../utils/errorResponse');
const QueryUtils = require('../utils/queryUtils');

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,difficulty,duration';
    next();
}

exports.findAllTours = catchAsync(async (req, res, next) => {
    const queryUtils = new QueryUtils(Tour.find(), req.query)
        .filter()
        .sort()
        .project()
        .paginate();

    const tours = await queryUtils.query;
    return res.status(200).json(tours);
});

exports.findTourById = catchAsync(async (req, res, next) => {
    const id = req.params.id
    const tour = await Tour.findById(id);
    if (!tour) {
        return next(new ErrorResponse(404, 'Not Found', `Tour with id ${id} not found`));
    }
    return res.status(200).json(tour);
});

exports.createTour = catchAsync(async (req, res, next) => {
    const response = await Tour.create(req.body);
    return res.status(201).json(response);
});

exports.updateTour = catchAsync(async (req, res, next) => {
    const id = req.params.id
    const tour = await Tour.findById(id);
    if (!tour) {
        return next(new ErrorResponse(404, 'Not Found', `Tour with id ${id} not found`));
    }
    // const updatedTour = await Tour.updateOne({ _id: id}, req.body); -> esse aqui retorna o status da atualização, mas não retorna o objeto atualizado
    const updatedTour = await Tour.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    return res.status(200).json(updatedTour);
})

exports.deleteTour = catchAsync(async (req, res, next) => {
    const id = req.params.id
    const tour = await Tour.findByIdAndDelete(id);
    if (!tour) {
        return next(new ErrorResponse(404, 'Not Found', `Tour with id ${id} not found`));
    }
    res.status(204);
    res.send();
});

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