import BaseRepository from "./base.repository.js";
import userModel from "../models/user.model.js";
class UserRepository extends BaseRepository {
    model;
    constructor(model = userModel) {
        super(model);
        this.model = model;
    }
}
export default UserRepository;
