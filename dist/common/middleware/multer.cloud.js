import multer from "multer";
import { multer_enum, Store_Enum } from "../enum/multer.enum.js";
import { tmpdir } from "node:os";
const multerCloud = ({ storeType = Store_Enum.memory, customeTypes = multer_enum.image } = {}) => {
    const storage = storeType === Store_Enum.memory ? multer.memoryStorage() : multer.diskStorage({
        destination: tmpdir(),
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + "-" + file.originalname);
        }
    });
    function fileFilter(req, file, cb) {
        if (!customeTypes.includes(file.mimetype)) {
            return cb(new Error("Invalid File Type"));
        }
        cb(null, true);
    }
    const upload = multer({ storage, fileFilter });
    return upload;
};
export default multerCloud;
