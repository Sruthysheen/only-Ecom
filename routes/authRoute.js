const express=require("express");

const router=express.Router();
const {upload}=require('../multer/multer');
// const config=require("../config/config");
const auth = require('../middleware/userAuth');


const {aProductPage,shopProduct}=require('../controllers/productCtrl');
const{getCart,addToCart,deleteCartItem,deleteCart,modifyCartQuantity}=require("../controllers/cartCtrl");
const {
    loginUser,
    verifyUser,
    registerUser,
    createUser,
    resendOtp, 
    loadIndex,
    emailVerified,
    logout,
    userProfile,
    addProfilePic,
    editProfile,
    updateProfile,
    addUserAddress,
    editAddress,
    updateAddress,
    deleteAddress} = require("../controllers/userCtrl");

const {checkOut,orderPlaced,orderDetails,orderPage,allOrderDetails,cancelOrder,returnOrder}=require('../controllers/orderCtrl');

const {productSearch,categoryFilter}=require('../controllers/searchCtrl');
const {validateCoupon}=require('../controllers/couponCtrl');
const { isLogged} = require('../middleware/userAuth')







// user---------------------------------------------------------------------------
router.get('/index',loadIndex);
router.get('/register',registerUser);
router.post('/register',createUser);
router.post('/emailVerified',emailVerified)
router.get('/login',loginUser);
router.post('/login',verifyUser);
router.get('/logout',logout);
router.post('/resendOTP',resendOtp);



//user profile----------------------------------------------------------------------
router.get('/profile',isLogged,userProfile);
router.post('/addProfilePic',isLogged,upload.single('image'), addProfilePic);
router.get('/editProfile',isLogged,editProfile);
router.post('/updateProfile',isLogged,updateProfile);


//user address----------------------------------------------------------------------
router.post('/addUserAddress',isLogged,addUserAddress);
router.get('/editAddress',isLogged,editAddress);
router.post('/updateAddress',isLogged,updateAddress);
router.get('/deleteAddress',isLogged,deleteAddress);




//products--------------------------------------------------------------------------
router.get('/aProduct',isLogged,upload.single('images'),aProductPage)
router.get('/shop', shopProduct)



//cart-------------------------------------------------------------------------------
router.get('/cart',isLogged,getCart);
router.get('/addToCart',isLogged,addToCart);
router.get('/deleteCartItem',isLogged,deleteCartItem);
router.post('/modifyCartQuantity',isLogged,modifyCartQuantity);
router.get('/deleteCart',isLogged,deleteCart);


//order--------------------------------------------------------------------------------
router.get('/checkout',isLogged,checkOut);
router.post('/orderPlaced',isLogged,orderPlaced);
router.get('/orderDetails',isLogged,orderDetails);
router.get('/orderPage',isLogged,orderPage);
router.get('/allOrderDetails',isLogged,allOrderDetails);
router.get('/cancelOrder',isLogged,cancelOrder);
router.get('/return',isLogged,returnOrder);



//search---------------------------------------------------------------------------------

router.post('/productSearch',productSearch);
router.get('/categoryFilter',categoryFilter);



//coupon----------------------------------------------------------------------------------

router.post('/validateCoupon',validateCoupon);
        


module.exports=router;   