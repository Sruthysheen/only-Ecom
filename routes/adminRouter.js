const express= require("express");
const router=express();
const errorHandler=require('../middleware/errorHandler')




const {loginAdmin, adminDashboard,adminVerifyLogin, userField, blockUser, unblockUser,logout}=require('../controllers/adminctrl');
const { allCategory,addCategory,editCategory, deleteCategory,updateCategory,unlistCategory, listCategory } = require("../controllers/categoryCtrl");
const {allProducts,addProduct,createProduct,editProduct,productEdited,unlistProduct,listProduct,deleteProduct,deleteSingleImage}=require("../controllers/productCtrl");
const {adminOrderDetails,changeStatusPending,changeStatusConfirmed,changeStatusShipped,changeStatusCanceled,
    changeStatusDelivered,changeStatusReturned, adminOrderList,loadsalesReport,salesReport,changeStatusReturnRejected}=require('../controllers/orderCtrl');
const {loadCoupon,addCoupon,coupon,editCoupon,deleteCoupon,updateCoupon}=require('../controllers/couponCtrl')
const {banner,addNewBanner,createBanner,editBanner,updateBanner,deleteBanner}=require('../controllers/bannerCtrl');
router.set('view engine','ejs'); 
router.set('views','./views/admin');


const {upload}=require('../multer/multer');

const {
    isAdminAuth
}=require('../middleware/adminAuth')








//admin route------------------------------------------------------------------------

router.get('/login',loginAdmin);
router.post('/login',adminVerifyLogin);
router.get('/dashboard',isAdminAuth,adminDashboard);
router.get('/users',isAdminAuth,userField);
router.get('/block',blockUser);
router.get('/unblock',unblockUser);
router.get('/logout',logout);


//product route-------------------------------------------------------------------------

router.get('/product',isAdminAuth,allProducts);
router.get('/product/:page',isAdminAuth,allProducts);
router.get('/addProduct',isAdminAuth,addProduct);
router.post('/createProduct',isAdminAuth,upload.array('images', 12),createProduct);
router.get('/editProduct',isAdminAuth,editProduct);
router.post('/productEdited',isAdminAuth,upload.array('images', 12),productEdited);
router.get('/unlistProduct',isAdminAuth,unlistProduct);
router.get('/listProduct',isAdminAuth,listProduct);
router.get('/deleteProduct',isAdminAuth,deleteProduct);
router.get('/deleteSingleImage',isAdminAuth,deleteSingleImage);




//category route--------------------------------------------------------------------------

router.get('/category',isAdminAuth,allCategory)
router.post('/addCategory',isAdminAuth,upload.single('image'),addCategory);
router.get('/editCategory',isAdminAuth,editCategory);
router.post('/updateCategory',isAdminAuth,upload.single('image'),updateCategory);
router.get('/deleteCategory',isAdminAuth,deleteCategory);
router.get('/unlistCategory',isAdminAuth,unlistCategory);
router.get('/listCategory',isAdminAuth,listCategory);



//order route-------------------------------------------------------------------------------

router.get('/adminOrderList',isAdminAuth,adminOrderList);
router.get('/adminOrderDetails',isAdminAuth,adminOrderDetails);
router.get('/changeStatusPending',isAdminAuth,changeStatusPending);
router.get('/changeStatusConfirmed',isAdminAuth,changeStatusConfirmed);
router.get('/changeStatusShipped',isAdminAuth,changeStatusShipped);
router.get('/changeStatusCanceled',isAdminAuth,changeStatusCanceled);
router.get('/changeStatusdelivered',isAdminAuth,changeStatusDelivered);
router.get('/changeStatusReturned',isAdminAuth,changeStatusReturned);
router.get('/changeStatusReturnRejected',isAdminAuth,changeStatusReturnRejected);



//coupen route------------------------------------------------------------------------------

router.get('/addCoupon',isAdminAuth,isAdminAuth,loadCoupon);
router.post('/addCoupon',isAdminAuth,addCoupon);
router.get('/coupon',isAdminAuth,coupon);
router.get('/editCoupon',isAdminAuth,editCoupon);
router.post('/updateCoupon',isAdminAuth,updateCoupon);
router.get('/deleteCoupon',isAdminAuth,deleteCoupon);

//banner route--------------------------------------------------------------------------------

router.get('/banner',isAdminAuth,banner);isAdminAuth,
router.get('/addNewBanner',isAdminAuth,addNewBanner);
router.post('/createBanner',isAdminAuth,upload.single('image'),createBanner);
router.get('/editBanner',isAdminAuth,editBanner);
router.post('/updateBanner',isAdminAuth,upload.single('image'),updateBanner);
router.get('/deleteBanner',isAdminAuth,deleteBanner);

//sales report------------------------------------------------------------------------------

router.get('/loadsalesReport',isAdminAuth,loadsalesReport);
router.get('/salesReport',isAdminAuth,salesReport);






module.exports=router;