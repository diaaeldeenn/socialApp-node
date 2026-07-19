import BaseRepository from "./base.repository.js";
import friendRequestModel from "../models/friendRequest.model.js";
class FriendRequestRepository extends BaseRepository {
    model;
    constructor(model = friendRequestModel) {
        super(model);
        this.model = model;
    }
}
export default FriendRequestRepository;
