const { catchAsync } = require("../utils/catchAsync");
const ErrorResponse = require("../utils/errorResponse");
const QueryUtils = require("../utils/queryUtils");

exports.findAll = (Model) => {
    return catchAsync(async (req, res, next) => {
        // -> isso aqui é para filtrar os reviews por tourId, caso o usuário tenha passado na URL
        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };

        const queryUtils = new QueryUtils(Model.find(filter), req.query)
            .filter()
            .sort()
            .project()
            .paginate();
        const response = await queryUtils.query;
        return res.status(200).json(response);
    });
}

exports.findById = (Model, populateOptions) => {
    return catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (populateOptions) {
            query = query.populate(populateOptions);
        }
        const document = await query;
        if (!document) {
            return next(new ErrorResponse(404, 'Not Found', `Document with id ${req.params.id} not found`));
        }
        return res.status(200).json(document);
    });
}

exports.createOne = (Model) => {
    return catchAsync(async (req, res, next) => {
        const response = await Model.create(req.body);
        return res.status(201).json(response);
    });
}

exports.updateOne = (Model) => {
    return catchAsync(async (req, res, next) => {
        const id = req.params.id
        const document = await Model.findById(id);
        if (!document) {
            return next(new ErrorResponse(404, 'Not Found', `Tour with id ${id} not found`));
        }
        const updatedDocument = await Model.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        return res.status(200).json(updatedDocument);
    });
}

exports.deleteOne = (Model) => {
    return catchAsync(async (req, res, next) => {
        const deleted = await Model.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return next(new ErrorResponse(404, 'Not Found', `Document with id ${req.params.id} not found`));
        }
        res.status(204);
        res.send();
    });
}