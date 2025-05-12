class QueryUtils {

    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        // 1) Filtrando os dados
        const requestParams = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(param => delete requestParams[param]);
        // http://localhost:3000/api/v1/tours?duration[gte]=5&difficulty=easy&price[lt]=1500-> URL
        // { duration: { gte: '5' }, difficult: 'easy' } -> resultado do console.log()
        let queryString = JSON.stringify(requestParams);
        queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        this.query.find(JSON.parse(queryString));
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            // http://localhost:3000/api/v1/tours?sort=-price,-ratingsQuantity -> o '-' indica que é decrescente. Por padrão é crescente
            const sort = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sort);  
        }
        return this;
    }

    project() {
        if (this.queryString.fields) {
            // http://localhost:3000/api/v1/tours?fields=name,duration,price,ratingsAverage
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        }
        else {
            this.query = this.query.select('-__v'); // -__v -> o '-' indica para não retornar o campo __v
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1; // multiplicando por 1 para transformar em number
        const limit = this.queryString.limit * 1 || 10; // multiplicando por 1 para transformar em number | limit é equivalente ao 'size' do Spring
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

module.exports = QueryUtils;