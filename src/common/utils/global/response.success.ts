import express, { type Response } from "express";

export const successResponse = ({res,status=200,message="done!",data={}}:
  {res:Response,message?:string,status?:number,data?:any}) => {
  return res.status(status).json({message,data})
}