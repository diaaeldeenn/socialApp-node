import multer from "multer";
import { multer_enum, Store_Enum } from "../enum/multer.enum.js";
import { tmpdir } from "node:os";
import type { Request } from "express";

const multerCloud = (
  {storeType=Store_Enum.memory,customeTypes=multer_enum.image}:
  {storeType?:Store_Enum,customeTypes?:string[]}={}
  ) => {

  const storage = storeType === Store_Enum.memory?multer.memoryStorage():multer.diskStorage({
    destination:tmpdir(),
    filename:function (req:Request, file:Express.Multer.File, cb:Function) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    }});
    function fileFilter(req:Request, file:Express.Multer.File, cb:Function) {
    if (!customeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid File Type"));
    }
    cb(null, true);
  }
  const upload = multer({ storage,fileFilter });
  return upload;

};

export default multerCloud;
