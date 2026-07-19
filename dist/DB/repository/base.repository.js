class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create(data) {
        return this.model.create(data);
    }
    async findById(id) {
        return this.model.findById(id);
    }
    async findOne({ filter, projection, options, }) {
        return this.model
            .findOne(filter, projection)
            .sort(options?.sort)
            .skip(options?.skip)
            .limit(options?.limit)
            .populate(options?.populate);
    }
    async find({ filter, projection, options, }) {
        return this.model
            .find(filter, projection)
            .sort(options?.sort)
            .skip(options?.skip)
            .limit(options?.limit)
            .populate(options?.populate);
    }
    async findByIdAndUpdate({ id, update, options, }) {
        return this.model.findByIdAndUpdate(id, update, {
            returnDocument: "after",
            ...options,
        });
    }
    async findOneAndUpdate({ filter, update, options, }) {
        return this.model.findOneAndUpdate(filter, update, {
            returnDocument: "after",
            ...options,
        });
    }
    async findOneAndDelete({ filter, options, }) {
        return this.model.findOneAndDelete(filter, options);
    }
    async pagination({ page, limit, sort, populate, search, options, }) {
        page = Math.max(1, +page || 1);
        limit = Math.max(1, +limit || 10);
        const [data, totalDocs] = await Promise.all([
            this.model
                .find(search ?? {}, options)
                .limit(limit)
                .skip((page - 1) * limit)
                .sort(sort)
                .populate(populate),
            this.model.countDocuments(search ?? {}),
        ]);
        return {
            meta: {
                currentPage: page,
                totalPages: Math.ceil(totalDocs / limit),
                limit,
                totalDocs,
            },
            data,
        };
    }
    async aggregate(pipeline) {
        return await this.model.aggregate(pipeline);
    }
    async deleteMany(filter) {
        return await this.model.deleteMany(filter);
    }
}
export default BaseRepository;
