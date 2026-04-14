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
  }: {
    filter?: QueryFilter<TRawDocType>;
    projection?: ProjectionType<TRawDocType>;
  }): Promise<HydratedDocument<TRawDocType> | null> {
    return this.model.findOne(filter, projection);
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
    return this.model.findByIdAndUpdate(id, update, { returnDocument: "after", ...options });
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
}

export default BaseRepository;
