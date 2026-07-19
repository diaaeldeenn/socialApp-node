import type { Model } from "mongoose";
import BaseRepository from "./base.repository.js";
import type { FriendRequestI } from "../models/friendRequest.model.js";
import friendRequestModel from "../models/friendRequest.model.js";

class FriendRequestRepository extends BaseRepository<FriendRequestI> {
  constructor(protected readonly model: Model<FriendRequestI> = friendRequestModel) {
    super(model);
  }
}

export default FriendRequestRepository;
