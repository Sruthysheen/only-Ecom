const express= require("express");
const router=express();
const {loginAdmin, adminDashboard,adminVerifyLogin, userField, blockUser, unblockUser,logout}=require('../controllers/adminctrl');
const { allCategory,addCategory,editCategory, deleteCategory,updateCategory,unlistCategory, listCategory } = require("../controllers/categoryCtrl");
const {allProducts,addProduct,createProduct,editProduct,productEdited,unlistProduct,listProduct,deleteProduct,deleteSingleImage}=require("../controllers/productCtrl");
const {adminOrderDetails,changeStatusPending,changeStatusConfirmed,changeStatusShipped,changeStatusCanceled,
    changeStatusDelivered,changeStatusReturned, adminOrderList,loadsalesReport,salesReport}=require('../controllers/orderCtrl');
const {loadCoupon,addCoupon,coupon,editCoupon,deleteCoupon,updateCoupon}=require('../controllers/couponCtrl')
const {banner,addNewBanner,createBanner,editBanner,updateBanner,deleteBanner}=require('../controllers/bannerCtrl');
router.set('view engine','ejs'); 
router.set('views','./views/admin');


const {upload}=require('../multer/multer');


const {bannerCrop}=require('../sharp/imageCrop');

//admin route------------------------------------------------------------------------

router.get('/login',loginAdmin);
router.post('/login',adminVerifyLogin);
router.get('/dashboard',adminDashboard);
router.get('/users',userField);
router.get('/block',blockUser);
router.get('/unblock',unblockUser);
router.get('/logout',logout);


//product route-------------------------------------------------------------------------

router.get('/product',allProducts);
router.get('/product/:page', allProducts);
router.get('/addProduct',addProduct);
router.post('/createProduct',upload.array('images', 12),createProduct);
router.get('/editProduct',editProduct);
router.post('/productEdited',upload.array('images', 12),productEdited);
router.get('/unlistProduct',unlistProduct);
router.get('/listProduct',listProduct);
router.get('/deleteProduct',deleteProduct);
router.get('/deleteSingleImage',deleteSingleImage);




//category route--------------------------------------------------------------------------

router.get('/category',allCategory)
router.post('/addCategory',upload.single('image'),addCategory);
router.get('/editCategory',editCategory);
router.post('/updateCategory',upload.single('image'),updateCategory);
router.get('/deleteCategory',deleteCategory);
router.get('/unlistCategory',unlistCategory);
router.get('/listCategory',listCategory);



//order route-------------------------------------------------------------------------------

router.get('/adminOrderList',adminOrderList);
router.get('/adminOrderDetails',adminOrderDetails);
router.get('/changeStatusPending',changeStatusPending);
router.get('/changeStatusConfirmed',changeStatusConfirmed);
router.get('/changeStatusShipped',changeStatusShipped);
router.get('/changeStatusCanceled',changeStatusCanceled);
router.get('/changeStatusdelivered',changeStatusDelivered);
router.get('/changeStatusReturned',changeStatusReturned);


//coupen route------------------------------------------------------------------------------

router.get('/addCoupon',loadCoupon);
router.post('/addCoupon',addCoupon);
router.get('/coupon',coupon);
router.get('/editCoupon',editCoupon);
router.post('/updateCoupon',updateCoupon);
router.get('/deleteCoupon',deleteCoupon);

//banner route--------------------------------------------------------------------------------

router.get('/banner',banner);
router.get('/addNewBanner',addNewBanner);
router.post('/createBanner',upload.single('image'),createBanner);
router.get('/editBanner',editBanner);
router.post('/updateBanner',upload.single('image'),updateBanner);
router.get('/deleteBanner',deleteBanner);

//sales report------------------------------------------------------------------------------

router.get('/loadsalesReport',loadsalesReport)
router.get('/salesReport',salesReport)






module.exports=router;