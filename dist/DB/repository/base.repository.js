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
    async findOne({ filter, projection, }) {
        return this.model.findOne(filter, projection);
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
        return this.model.findByIdAndUpdate(id, update, { returnDocument: "after", ...options });
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
}
export default BaseRepository;
