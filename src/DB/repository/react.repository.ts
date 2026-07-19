import type { Model } from "mongoose";
import BaseRepository from "./base.repository.js";
import ReactModel, { type ReactI } from "../models/react.model.js";

class ReactRepository extends BaseRepository<ReactI> {
  constructor(protected readonly model: Model<ReactI> = ReactModel) {
    super(model);
  }
}

export default ReactRepository;
