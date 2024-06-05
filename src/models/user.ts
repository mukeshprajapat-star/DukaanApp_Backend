import mongoose from  "mongoose"
import validator from "validator"

interface IUser extends Document{
    _id:string;
    name:string;
    email:string;
    photo:string;
    gender:"male"|"female";
    dob:Date;
    role:"admin" | "user";
    createdAt:Date;
    updatedAt:Date;
    //Virtual Attributes
    age:number ;
}
const schema=new mongoose.Schema(
    {
        _id:{
            type:String,
            required:[true,"Please enter ID"]
        },
        name:{
            type:String,
            required:[true,"Please enter name"]
        },
        email:{
            type:String,
            unique:[true,"Email Already Exists"],
            required:[true,"Please enter email"],
            validate:validator.default.isEmail
        },
        photo:{
            type:String,
            required:[true,"Please add photo"]
        },
        role:{
            type:String,
            enum:["admin","user"],
            default:"user"
        },
        gender:{
            type:String,
            enum:["male","female"],
            required:[true,"Please enter gender"]
        },
        dob:{
            type:Date,
            required:[true,"Please enter date of birth"]
        }

},
{
    timestamps:true
}
)
schema.virtual("age").get(function() {
    const today=new Date();
    const dob=this.dob;
    let age=today.getFullYear() - dob.getFullYear();
    if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
    )
{
    age--;
}
return age;
})

export const User=mongoose.model<IUser>("User",schema)