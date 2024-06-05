import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.js";
import { NewUserRequestBody } from "../types/types.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";

export const newUser = TryCatch(
    async (
        req: Request<{}, {}, NewUserRequestBody>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const { name, email, photo, gender, _id, dob } = req.body;
          let user=await User.findById(_id);

          if(user){
            return next(new ErrorHandler(`Welcome ${user.name}`, 200));
          }
          if(!name || !email|| !photo|| !gender|| !_id || !dob)
            return next(new ErrorHandler("Please Add All Fields",400));

      
           user = await User.create({
            name,
            email,
            photo,
            gender,
            _id,
            dob:new Date(dob),
          });
          return res.status(201).json({
            success: true,
            message: `Welcome ${user.name} `,
          });
        } catch (error) {
          return res.status(400).json({
              success: false,
              message:error
            });
        }
      }
)


export const getAllUsers=TryCatch(async(req,res,next)=>{
    const users=await User.find({});
    return res.status(200).json({
        success:true,
        users
    })
    
})

export const getUser=TryCatch(async(req,res,next)=>{
    const id=req.params.id;
    
    const user=await User.findById(id);

    if(!user) return next(new ErrorHandler("Invalid Id",400));
    return res.status(200).json({
        success:true,
        user
    })
    
})
export const deleteUser=TryCatch(async(req,res,next)=>{
    const id=req.params.id; 
    
    const user=await User.findById(id);

    if(!user) return next(new ErrorHandler("Invalid Id",400));

    await user.deleteOne();

    return res.status(200).json({
        success:true,
        message:"User Deleted SuccessFully"
    })
    
})