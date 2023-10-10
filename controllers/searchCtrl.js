const asyncHandler=require('express-async-handler');
const Product = require('../model/productModel.js');
const Category=require('../model/categoryModel.js');



const productSearch=asyncHandler(async(req,res)=>{
    try {

       console.log(req.body);

        const product=await Product.find({
            title:{$regex:`${req.body.search}`,$options:'i'}
        })
        
        const itemsperpage = 6;
        const currentpage = parseInt(req.query.page) || 1;
        const startindex = (currentpage - 1) * itemsperpage;
        const endindex = startindex + itemsperpage;
        const totalpages = Math.ceil(product.length / 6);
        const currentproduct = product.slice(startindex,endindex);

        

        res.render('search',{product:currentproduct, totalpages,currentpage,})
        
    } catch (error) {
        console.log('Error happent in filter controller in ProductSearch funttion',error);
    }
})



const categoryFilter=asyncHandler(async(req,res)=>{
    try {
        const category=req.query.category
        const product=await Product.find({category:category})
        const itemsperpage = 6;
        const currentpage = parseInt(req.query.page) || 1;
        const startindex = (currentpage - 1) * itemsperpage;
        const endindex = startindex + itemsperpage;
        const totalpages = Math.ceil(product.length / 6);
        const currentproduct = product.slice(startindex,endindex);
        res.render('search',{product:currentproduct, totalpages,currentpage,})


    } catch (error) {
        console.log('Error happent in filter controller in CategoryFilter funttion',error);
        
    }
})


module.exports={productSearch, categoryFilter}