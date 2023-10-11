const asyncHandler=require('express-async-handler');
const Product = require('../model/productModel.js');
const Category=require('../model/categoryModel.js');



//search by category-------------------------------------------------------------

const filterSearch=asyncHandler(async(req,res)=>{
    try {
       

        const product=await Product.find({
            category:{$regex:`${req.body.search}`,$options:'i'}
        })
        console.log(product.length);
        let cat;
        if(product.length >0){
             cat=product[0].category
             const itemsperpage = 8;
             const currentpage = parseInt(req.query.page) || 1;
             const startindex = (currentpage - 1) * itemsperpage;
             const endindex = startindex + itemsperpage;
             const totalpages = Math.ceil(product.length / 8);
             const currentproduct = product.slice(startindex,endindex);
     
             
     
             res.render('filter',{product:currentproduct, totalpages,currentpage,cat})


        }else{
            const products=[]
            cat=""
            const itemsperpage = 8;
            const currentpage = parseInt(req.query.page) || 1;
            const startindex = (currentpage - 1) * itemsperpage;
            const endindex = startindex + itemsperpage;
            const totalpages = Math.ceil(products.length / 8);
            const currentproduct = products.slice(startindex,endindex);
    
            
    
            res.render('filter',{product:currentproduct, totalpages,currentpage,cat})
        }
       
        
       
        
    } catch (error) {
        console.log('Error happent in filter controller in filterSearch funttion',error);
    }
})


//filter by size----------------------------------------------------------------------------

const sizeFilter=asyncHandler(async(req,res)=>{
    try {
        const size=req.query.size; 
        const cat= req.query.cat
        const product=await Product.find({$and:[{size:size},{category:cat}]})
        const itemsperpage = 8;
        const currentpage = parseInt(req.query.page) || 1;
        const startindex = (currentpage - 1) * itemsperpage;
        const endindex = startindex + itemsperpage;
        const totalpages = Math.ceil(product.length / 8);
        const currentproduct = product.slice(startindex,endindex);
        res.render('filter',{product:currentproduct, totalpages,currentpage,cat})       
    } catch (error) {
        console.log('Error happent in filter controller in sizefilter funttion',error);
        
    }
});



//filter by color---------------------------------------------------------------------

const colorFilter=asyncHandler(async(req,res)=>{
    try {
        const color=req.query.color;
        const cat= req.query.cat
        const product=await Product.find({$and:[{color:color},{category:cat}]})
        const itemsperpage = 8;
        const currentpage = parseInt(req.query.page) || 1;
        const startindex = (currentpage - 1) * itemsperpage;
        const endindex = startindex + itemsperpage;
        const totalpages = Math.ceil(product.length / 8);
        const currentproduct = product.slice(startindex,endindex);
        res.render('filter',{product:currentproduct, totalpages,currentpage,cat})

    } catch (error) {
        console.log('Error happent in filter controller in colorfilter funttion',error);
        
    }
});


//









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

        

        res.render('filter',{product:currentproduct, totalpages,currentpage,})
        
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
        res.render('filter',{product:currentproduct, totalpages,currentpage,})


    } catch (error) {
        console.log('Error happent in filter controller in CategoryFilter funttion',error);
        
    }
})


module.exports={productSearch, categoryFilter}