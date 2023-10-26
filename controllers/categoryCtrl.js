const asyncHandler=require('express-async-handler');
const Category=require('../model/categoryModel');




const addCategory=asyncHandler(async(req,res)=>{
    try {
        const {name,description}=req.body;
        // if (!description) {
        //     // if there is no description respond with a 400 Bad Request status
        //     return res.status(400).send('Description is required');
        // }
        const categoryExist=await Category.findOne({name});
        if(categoryExist)
        {
           res.redirect('/api/admin/category');
        }else{
            const caseInsensitiveCategoryExist = await Category.findOne({
                name: { $regex: new RegExp('^' + name + '$', 'i') }
            });
    
            if (caseInsensitiveCategoryExist) {
                
                res.redirect('/api/admin/category');
            }
       
            const newCategory=new Category(
                {
                    name,
                    description,
                    image:req.file.filename
                }
            );
        
        await newCategory.save();
        res.redirect('/api/admin/category');
            }
    } catch (error) {
        console.log("add category error",error);
        
    }
})



//get all category from database

const allCategory=asyncHandler(async(req,res)=>{
      try {
   
        const allCategory=await Category.find();

        req.session.Category=allCategory;
        res.render('category',({category:allCategory}));
      } catch (error) {
        console.log(" this is all catogary error",error);
      }
})

//edit category

const editCategory=asyncHandler(async(req,res)=>{
    try {
        const id = req.query.id;

        const user = await Category.findById(id)
       
        if (user) {
            res.render('editCategory', { user: user })
        } else {
            res.redirect('/api/admin/category')

        }

    } catch (error) {
        console.log('error happence in catogaryController editCatogary function', error);
    }
})


//update category

const updateCategory=asyncHandler(async(req,res)=>{
    try {
        const id = req.body.id;
        const img = req.file ? req.file.filename : null;

        if (img) {
            await Category.findByIdAndUpdate(id, {
                name: req.body.name,
                description: req.body.description, // Use the description from the request body
                image: req.file.filename
            }, { new: true })
       } else {
            await Category.findByIdAndUpdate(id, {
                name: req.body.name,
                description: req.body.description,

            }, { new: true })
        }
        res.redirect('/api/admin/category')
    } catch (error) {
        console.log("update category error");
    }

});



//delete category

const deleteCategory=asyncHandler(async(req,res)=>{
    try {
        const id=req.query.id;
        const category=await Category.findByIdAndDelete(id)
        res.redirect('/api/admin/category');
    } catch (error) {
        console.log("delete category error",error);
    }
})

//unlist a category

const unlistCategory=asyncHandler(async(req,res)=>{
    try {
        const id=req.query.id;
        const unlistedCategory=await Category.findByIdAndUpdate(id,{status:false},{new:true});
        res.redirect('/api/admin/category');
    } catch (error) {
        console.log("unlist category error");
    }
});

//list a category

const listCategory=asyncHandler(async(req,res)=>{
    try {
        const id=req.query.id;
    const listedCategory=await Category.findByIdAndUpdate(id,{status:true},{new:true});
    res.redirect('/api/admin/category');
    } catch (error) {
       console.log("list category error"); 
    }

    
});






module.exports={
    addCategory,
    allCategory,
    editCategory,
    updateCategory,
    deleteCategory,
    unlistCategory,
    listCategory,
    
}