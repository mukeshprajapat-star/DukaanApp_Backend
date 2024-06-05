import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { calculatePercentage, getChartsData, getInventories } from "../utils/features.js";

export const getDashboardStats=TryCatch(async (req,res,next)=>{
    let stats={};
    if(myCache.has("admin-stats")) stats=JSON.parse(myCache.get("admin-stats") as string)
    
        else{
            const today =new Date();
            const sixMonthsAgo= new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth()-6)

            const thisMonth={
                start:new Date(today.getFullYear(),today.getMonth(),1),
                end:today
            }
            const lastMonth={
                start:new Date(today.getFullYear(),today.getMonth()-1,1),
                end:new Date(today.getFullYear(),today.getMonth(),0)

            }
            const thisMonthProductsPromise=await Product.find({
                createdAt:{
                    $gte:thisMonth.start,
                    $lte:thisMonth.end
                }
            })

            const lastMonthProductsPromise=await Product.find({
                createdAt:{
                    $gte:lastMonth.start,
                    $lte:lastMonth.end
                }
            })
            const thisMonthUsersPromise=await User.find({
                createdAt:{
                    $gte:thisMonth.start,
                    $lte:thisMonth.end
                }
            })

            const lastMonthUsersPromise=await User.find({
                createdAt:{
                    $gte:lastMonth.start,
                    $lte:lastMonth.end
                }
            })

            const thisMonthOrdersPromise=await Order.find({
                createdAt:{
                    $gte:thisMonth.start,
                    $lte:thisMonth.end
                }
            })

            const lastMonthOrdersPromise=await Order.find({
                createdAt:{
                    $gte:lastMonth.start,
                    $lte:lastMonth.end
                }
            })
            const lastSixMonthOrdersPromise=await Order.find({
                createdAt:{
                    $gte:sixMonthsAgo,
                    $lte:today
                }
            })

            const latestTransactionsPromise=Order.find({}).select(["orderItems", "discount", "total" ,"status"]).limit(4)


            const [
                thisMonthProducts,
                lastMonthProducts,
                thisMonthUsers,
                lastMonthOrders,
                thisMonthOrders,
                lastMonthUsers,
                productsCount,
                usersCount,
                allOrders,
                lastSixMonthOrders,
                categories,
                femaleusersCount,
                latestTransactions
            ]=await Promise.all([
                thisMonthProductsPromise,
                lastMonthProductsPromise,
                thisMonthUsersPromise,
                lastMonthOrdersPromise,
                thisMonthOrdersPromise,
                lastMonthUsersPromise,
                Product.countDocuments(),
                User.countDocuments(),
                Order.find({}).select("total"),
                lastSixMonthOrdersPromise,
                Product.distinct("category"),
                User.countDocuments({gender:"female"}),
                latestTransactionsPromise

            ])

            const thisMonthRevenue=thisMonthOrders.reduce((total,order)=>total + (order.total || 0),0)

            const lastMonthRevenue=lastMonthOrders.reduce((total,order)=>total + (order.total || 0),0)


            const changePercent={
                revenue:calculatePercentage(thisMonthRevenue,lastMonthRevenue),
                product:calculatePercentage(thisMonthProducts.length,lastMonthProducts.length),
                user:calculatePercentage(thisMonthUsers.length,lastMonthUsers.length),
                order:calculatePercentage(thisMonthOrders.length,lastMonthOrders.length)
            }

            const revenue=allOrders.reduce((total,order)=>total + (order.total || 0),0)
            const count={
                revenue,
                product:productsCount,
                user:usersCount,
                order:allOrders.length

            }

            const orderMonthCounts=new Array(6).fill(0);
            const orderMonthRevenue=new Array(6).fill(0);


            lastSixMonthOrders.forEach((order)=> {
                const creationDate=order.createdAt;
                const monthDiff=(today.getMonth() - creationDate.getMonth() +12)%12 ;

                if(monthDiff < 6 ) {
                    orderMonthCounts[6 - monthDiff - 1] +=1;
                    orderMonthRevenue[6 - monthDiff - 1] +=order.total;
                }

            })
            const categoryCount=await getInventories({
                categories,productsCount
            })

         
            const modifiedLatestTransactions=latestTransactions.map((i)=>({
                _id:i._id,
                discount:i.discount,
                amount:i.total,
                quantity:i.orderItems.length,
                status:i.status
            }))

            const userRatio={
                male:usersCount - femaleusersCount,
                female:femaleusersCount
            }


            stats={
                categoryCount,
                changePercent,
                count,
                chart:{
                    order:orderMonthCounts,
                    revenue:orderMonthRevenue
                },
                userRatio,
                latestTransactions:modifiedLatestTransactions

            }
            myCache.set("admin-stats" ,JSON.stringify(stats));


        }
        return res.status(200).json({
            success:true,
            stats
        })
})

export const getPieCharts=TryCatch(async (req,res,next)=>{
    let charts;

    if(myCache.has("admin-pie-charts")) charts=JSON.parse(myCache.get("admin-pie-charts") as string);

    else{

        const allOrdersPromise=Order.find({}).select(["total","discount","subtotal", "tax", "shippingCharges"])

        const [processingOrder,shippedOrder,deliveredOrder,categories,productsCount,outOfStock,allOrders,allUsers,adminUsers,customerUsers]=await Promise.all([
            Order.countDocuments({status:"Processing"}),
            Order.countDocuments({status:"Shipped"}),
            Order.countDocuments({status:"Delivered"}),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({stock:0}),
            allOrdersPromise,
            User.find({}).select(["dob"]),
            User.countDocuments({role:"admin"}),
            User.countDocuments({role:"user"})

        ])



        const orderFullfillment={
            processing:processingOrder,
            shipped:shippedOrder,
            delivered:deliveredOrder
        }

        const productCategories=await getInventories({
            categories,productsCount
        })

        const stockAvailblity={
            inStock:productsCount - outOfStock ,
            outOfStock
        };
        const grossIncome=allOrders.reduce(
            (prev,order) =>prev + (order.total  || 0),0
        )
        const discount=allOrders.reduce(
            (prev,order) =>prev + (order.discount  || 0),0
        )
        const productionCost=allOrders.reduce(
            (prev,order) =>prev + (order.shippingCharges  || 0),0
        )
        const burnt=allOrders.reduce(
            (prev,order) =>prev + (order.tax  || 0),0
        )
        const marketingCost=Math.round(grossIncome * (30 / 100));

        const netMargin=grossIncome - discount - productionCost - burnt - marketingCost


        const revenueDistribution ={
            netMargin,
            discount,
            productionCost,
            burnt,
            marketingCost
        }

        const usersAgeGroup={
            teen:allUsers.filter((i)=>i.age < 20 ).length,
            adult:allUsers.filter((i)=>i.age >= 20 && i.age < 40 ).length,
            old:allUsers.filter((i)=>i.age >=40 ).length
        }

        const adminCustomer={
            admin:adminUsers,
            customer:customerUsers
        }


        charts={
            orderFullfillment,
            productCategories,
            stockAvailblity,
            revenueDistribution,
            usersAgeGroup,
            adminCustomer

        }
        myCache.set("admin-pie-charts",JSON.stringify(charts))

}

return res.status(200).json({
    success:true,
    charts
})

})

export const getBarCharts=TryCatch(async (req,res,next)=>{

    let charts;

    const key="admin-bar-charts";

    if(myCache.has(key)) charts=JSON.parse(myCache.get(key) as string)

        else{

            const today =new Date();
            const sixMonthsAgo= new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth()-6)

            const twelveMonthsAgo= new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth()-12)


            const sixMonthProductsPromise=await Product.find({
                createdAt:{
                    $gte:sixMonthsAgo,
                    $lte:today
                }
            }).select("createdAt")
            const sixMonthUsersPromise=await User.find({
                createdAt:{
                    $gte:sixMonthsAgo,
                    $lte:today
                }
            }).select("createdAt")
            const twelveMonthOrdersPromise=await Order.find({
                createdAt:{
                    $gte:twelveMonthsAgo,
                    $lte:today
                }
            }).select("createdAt")

            const [products,users,orders]=await Promise.all([
                sixMonthProductsPromise,sixMonthUsersPromise,twelveMonthOrdersPromise
            ])

            const productsCount=getChartsData({length:6,today, docArr:products})
            const usersCount=getChartsData({length:6,today, docArr:users})

            const ordersCount=getChartsData({length:12,today, docArr:orders})


            charts ={
                users:usersCount,
                products:productsCount,
                orders:ordersCount

            }

            myCache.set(key,JSON.stringify(charts))

        }


        
return res.status(200).json({
    success:true,
    charts
})
})

export const getLineCharts=TryCatch(async (req,res,next)=>{
    
    let charts;

    const key="admin-line-charts";

    if(myCache.has(key)) charts=JSON.parse(myCache.get(key) as string)

        else{

            const today =new Date();

            const twelveMonthsAgo= new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth()-12)

            const baseQuery={
                createdAt:{
                    $gte:twelveMonthsAgo,
                    $lte:today
                }
            }


            const [products,users,orders]=await Promise.all([
                Product.find(baseQuery).select("createdAt"),
                User.find(baseQuery).select("createdAt"),
                 Order.find(baseQuery).select(["createdAt","discount","total"])
            ])

            const productsCount=getChartsData({length:12,today, docArr:products})
            const usersCount=getChartsData({length:12,today, docArr:users})

            const discount=getChartsData({length:12,today, docArr:orders,property:"discount"})
            const revenue=getChartsData({length:12,today, docArr:orders,property:"total"})



            charts ={
                users:usersCount,
                products:productsCount,
                discount,
                revenue

            }

            myCache.set(key,JSON.stringify(charts))

        }


        
return res.status(200).json({
    success:true,
    charts
})
})