import type { Model } from "mongoose";
import type { UserI } from "../models/user.model.js";
import BaseRepository from "./base.repository.js";
import userModel from "../models/user.model.js";

class UserRepository extends BaseRepository<UserI> {
  constructor(protected readonly model: Model<UserI> = userModel) {
    super(model);
  }
}

export default UserRepository;
