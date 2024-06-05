import express from "express"
import { adminOnly } from "../middlewares/auth.js";
import { deleteProduct, getAdminProduct, getAllCategories, getAllProducts, getLatestProduct, getSingleProducts, newProduct, updateProduct } from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";

const app =express.Router();

app.post("/new",adminOnly,singleUpload,newProduct)
app.get("/latest",getLatestProduct)
app.get("/categories",getAllCategories)
//search product and filters
app.get("/all",getAllProducts)


app.get("/adminproducts",adminOnly,getAdminProduct)
app.route("/:id").get(getSingleProducts).put(adminOnly,singleUpload,updateProduct).delete(adminOnly,deleteProduct)








export default app;