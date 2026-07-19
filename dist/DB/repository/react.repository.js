import BaseRepository from "./base.repository.js";
import ReactModel, {} from "../models/react.model.js";
class ReactRepository extends BaseRepository {
    model;
    constructor(model = ReactModel) {
        super(model);
        this.model = model;
    }
}
export default ReactRepository;
