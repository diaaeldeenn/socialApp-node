import type {
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  Types,
  UpdateQuery,
} from "mongoose";
import type { HydratedDocument } from "mongoose";
import type { Model } from "mongoose";

abstract class BaseRepository<TRawDocType> {
  constructor(protected readonly model: Model<TRawDocType>) {}

  async create(
    data: Partial<TRawDocType>,
  ): Promise<HydratedDocument<TRawDocType>> {
    return this.model.create(data);
  }

  async findById(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<TRawDocType> | null> {
    return this.model.findById(id);
  }

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDocType>;
    projection?: ProjectionType<TRawDocType>;
    options?: QueryOptions<TRawDocType>;
  }): Promise<HydratedDocument<TRawDocType> | null> {
    return this.model
      .findOne(filter, projection)
      .sort(options?.sort)
      .skip(options?.skip!)
      .limit(options?.limit!)
      .populate(options?.populate as PopulateOptions);
  }

  async find({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDocType>;
    projection?: ProjectionType<TRawDocType>;
    options?: QueryOptions<TRawDocType>;
  }): Promise<HydratedDocument<TRawDocType>[] | []> {
    return this.model
      .find(filter, projection)
      .sort(options?.sort)
      .skip(options?.skip!)
      .limit(options?.limit!)
      .populate(options?.populate as PopulateOptions);
  }

  async findByIdAndUpdate({
    id,
    update,
    options,
  }: {
    id?: Types.ObjectId;
    update: UpdateQuery<TRawDocType>;
    options?: QueryOptions<TRawDocType>;
  }): Promise<HydratedDocument<TRawDocType> | null> {
    return this.model.findByIdAndUpdate(id, update, {
      returnDocument: "after",
      ...options,
    });
  }

  async findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter?: QueryFilter<TRawDocType>;
    update: UpdateQuery<TRawDocType>;
    options?: QueryOptions<TRawDocType>;
  }): Promise<HydratedDocument<TRawDocType> | null> {
    return this.model.findOneAndUpdate(filter, update, {
      returnDocument: "after",
      ...options,
    });
  }
  async findOneAndDelete({
    filter,
    options,
  }: {
    filter?: QueryFilter<TRawDocType>;
    options?: QueryOptions<TRawDocType>;
  }): Promise<HydratedDocument<TRawDocType> | null> {
    return this.model.findOneAndDelete(filter, options);
  }
  async pagination({
    page,
    limit,
    sort,
    populate,
    search,
    options,
  }: {
    page?: number;
    limit?: number;
    sort?: any;
    populate?: any;
    search?: QueryFilter<TRawDocType>;
    options?: QueryOptions<TRawDocType>;
  }) {
    page = Math.max(1, +page! || 1);
    limit = Math.max(1, +limit! || 10);

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
  async aggregate<T>(pipeline: any[]): Promise<T[]> {
    return await this.model.aggregate(pipeline);
  }

  async deleteMany(filter: QueryFilter<TRawDocType>) {
    return await this.model.deleteMany(filter);
  }
}

export default BaseRepository;
