const asyncHandler=require("express-async-handler");
const User=require('../model/userModel');
const Product=require('../model/productModel');
const Order=require('../model/orderModel');
const Razorpay=require('razorpay')
const Coupon=require('../model/couponModel');




var instance = new Razorpay({ key_id:process.env.RAZORPAY_KEYID, key_secret: process.env.RAZORPAY_SECRETKEY })



//checkout-----------------------------------------------------------------------------
const checkOut=asyncHandler(async(req,res)=>{
    try {
        const userId=req.session.user;
        const user=await User.findById(userId);
        const coupon = await Coupon.find({
          'user.userId': { $ne: user._id }
      });
      console.log('this is coupon ',coupon);
        const productId=user.cart.map(item=>item.ProductId);
        const product=await Product.find({_id:{$in:productId}});

        console.log('this is product  ',product);
        console.log('this is address ',user.address.length);
        console.log('this is address ',user.address);

        let sum = 0;
        for (let i = 0; i < user.cart.length; i++) {
            sum += user.cart[i].subTotal
        }
        sum = Math.round(sum * 100) / 100;
        res.render('checkout',{user,product,sum,coupon});


    } catch (error) {
        console.log("error in checkout function");
    }
})

//order page----------------------------------------------------------------------

const orderPage = asyncHandler(async (req, res) => {
    try {
        const userId=req.session.user;
        const user=await User.findById(userId)
        res.render('orderPage',{user})

    } catch (error) {
        console.log('Error form order Ctrl in the function orderPage', error);
    }
})



//order placed--------------------------------------------------------------------

const orderPlaced=asyncHandler(async(req,res)=>{
    try {
        // console.log(req.body);
        const {totalPrice,createdOn,date,payment,addressId}=req.body
        console.log(addressId,">>????");
        console.log("Received Amount:", totalPrice);
        const userId=req.session.user
        const user= await User.findById(userId);
        const productIds = user.cart.map(cartItem => cartItem.ProductId);

        




        const address = user.address.find(item => item._id.toString() === addressId);

      
        const producDatails= await Product.find({ _id: { $in: productIds } });

        const cartItemDetails=user.cart.map(cartItem => ({
            ProductId: cartItem.ProductId,
            quantity: cartItem.quantity,
            price: cartItem.price, // Add the price of each product
          }));

          



          const orderedProducts=producDatails.map(product=>({
            ProductId: product._id,
            price: product.price,
            title:product.title,
            image:product.images[0],
            quantity: cartItemDetails.find(item => item.ProductId.toString() === product._id.toString()).quantity,
          }));
          


          const order = new Order({
            totalPrice:totalPrice,    
            createdOn: createdOn,
            date:date,
            product:orderedProducts,
            userId:userId,
            payment:payment,
            address:address,
            status:'pending'
          })
          const orderDb= await order.save();
          console.log('this is a order',orderDb);
          for (const orderedProduct of orderedProducts) {
            const product = await Product.findById(orderedProduct.ProductId);
          
          if (product) {
            console.log('this is product',product);
            const newQuantity = product.quantity - orderedProduct.quantity;
            product.quantity = Math.max(newQuantity, 0);        
            await product.save();
        }
    }
    if(order.payment=='cod'){
      orderDb.status='conformed'
      await orderDb.save()
        console.log('yes iam the cod methord');
         res.json({ payment: true, method:"cod", order: orderDb ,qty:cartItemDetails,orderId:user});

      }

      else if(order.payment=='online'){
        console.log('yes iam the razorpay methord');

         const generatedOrder = await generateOrderRazorpay(orderDb._id, orderDb.totalPrice);
         console.log('this is the error in the razorpay ',generatedOrder);
         res.json({ payment: false, method: "online", razorpayOrder: generatedOrder, order: orderDb ,orderId:user,qty:cartItemDetails});
                     
      }
     }catch (error) {
        console.log('Error form order Ctrl in the function orderPlaced', error);
                
     }
   });



//order details
const orderDetails=asyncHandler(async(req,res)=>{
    try {
        const orderId = req.query.orderId
        // console.log('this is order id ',orderId);
        // const  id=req.query.id.toString()
   

       const userId = req.session.user;
       const user = await User.findById(userId);
       const order = await Order.findById(orderId)

    //    console.log('thid id the odder',order);

       res.render('orderDtls', { order ,user });

    } catch (error) {
        console.log('errro happemce in cart ctrl in function orderDetails',error); 
        
    }
})



//allOrderDetails--------------------------------------------------------------------

const allOrderDetails = asyncHandler(async (req, res) => {
    try {
        const userId=req.session.user;
        const user=await User.findById(userId)
        const orders = await Order.find({ userId: userId }).sort({ createdOn: -1 });


       
     

        const itemsperpage = 3;
        const currentpage = parseInt(req.query.page) || 1;
        const startindex = (currentpage - 1) * itemsperpage;
        const endindex = startindex + itemsperpage;
        const totalpages = Math.ceil(orders.length / 3);
        const currentproduct = orders.slice(startindex,endindex);
      
    
        res.render('orderList',{ orders:currentproduct,totalpages,currentpage ,user});
    } catch (error) {
        console.log('Error from orderCtrl in the function allOrderDetails', error);
        res.status(500).json({ status: false, error: 'Server error' });
    }
});


//cancel order-----------------------------------------------------------------------

const cancelOrder = asyncHandler(async (req, res) => {
    try {
      const userId = req.session.user;
      const user = await User.findOne({ _id: userId }); // Use findOne to retrieve a single user document
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const orderId = req.query.orderId;
      const order = await Order.findByIdAndUpdate(orderId, {
        status: 'canceled'
      }, { new: true });


     
  



      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
  
      for (const productData of order.product) {
        const productId = productData.ProductId;
        const quantity = productData.quantity;
  
        const product = await Product.findById(productId);

      
        if (product) {
          product.quantity += quantity;
          await product.save();
        }
      }
  
      res.redirect('/api/user/allOrderDetails');
    } catch (error) {
      console.log('Error occurred in cart ctrl in function cancelOrder', error);
      
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });



  //return order-------------------------------------------------------------------------------

  const returnOrder = asyncHandler(async (req, res) => {
    try {
      const orderId = req.query.orderId;
      const userId = req.session.user;
  
   
      const user = await User.findOne({ _id: userId });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const order = await Order.findByIdAndUpdate(orderId, {
        status: 'returned'
      }, { new: true });
  
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
  
      for (const productData of order.product) {
        const productId = productData.ProductId;
        const quantity = productData.quantity;
  
        // Find the corresponding product in the database
        const product = await Product.findById(productId);
  
        if (product) {
          product.quantity += quantity;
          await product.save();
        }
      }
  
      res.redirect('/api/user/allOrderDetails');
    } catch (error) {
      console.log('Error occurred in returnOrder function:', error);
     
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  


//================================admin side===========================================================================




//admin order list--------------------------------------------------------------


const adminOrderList=asyncHandler(async(req,res)=>{
  try {
    const orders=await Order.find().sort({createdOn:-1});
    const itemsperpage = 3;
    const currentpage = parseInt(req.query.page) || 1;
    const startindex = (currentpage - 1) * itemsperpage;
    const endindex = startindex + itemsperpage;
    const totalpages = Math.ceil(orders.length / 3);
    const currentproduct = orders.slice(startindex,endindex);
    res.render('orderList',{orders:currentproduct,totalpages,currentpage})
  } catch (error) {
    console.log("error in adminOrderlist function",error);
  }
})


//order details admin----------------------------------------------------------

const adminOrderDetails=asyncHandler(async(req,res)=>{
  try {
    const orderId=req.query.orderId;
    const order=await Order.findById(orderId);
    const userId=order.userId;
    const user=await User.findById(userId);
    res.render('orderDetails',{user,order});
  } catch (error) {
    console.log("error in adminOrderDetails function",error);
  }
})

//status pending------------------------------------------------------------

const changeStatusPending=asyncHandler(async(req,res)=>{
  try {
    const orderId=req.query.id;
    const order=await Order.findByIdAndUpdate(orderId,{status:'pending'},{new:true});
    if(order)
    {
      res.json({status:true});
    }

  } catch (error) {
    console.log("error in changestatusPending function",error);
  }
});


//status confirmed--------------------------------------------------------------------

const changeStatusConfirmed=asyncHandler(async(req,res)=>{
  try {
    const orderId=req.query.orderId;
    const order=await Order.findByIdAndUpdate(orderId,{status:'confirmed'},{new:true});
    if(order)
    {
      res.json({status:true});
    }

  } catch (error) {
    console.log("error in changestatusPending function",error);
  }
});


//status shipped-------------------------------------------------------------------------

const changeStatusShipped=asyncHandler(async(req,res)=>{
  try {
    const orderId=req.query.orderId;
    const order=await Order.findByIdAndUpdate(orderId,{status:'shipped'},{new:true});
    if(order)
    {
      res.json({status:true});
    }

  } catch (error) {
    console.log("error in changestatusPending function",error);
  }
});

//status canceled---------------------------------------------------------------------------

const changeStatusCanceled=asyncHandler(async(req,res)=>{
  try {
    const orderId=req.query.orderId;
    const order=await Order.findByIdAndUpdate(orderId,{status:'canceled'},{new:true});
    if(order)
    {
      res.json({status:true});
    }

  } catch (error) {
    console.log("error in changestatusPending function",error);
  }
});

//status delivered--------------------------------------------------------------------------


const changeStatusDelivered=asyncHandler(async(req,res)=>{
  try {
    const orderId=req.query.orderId;
    const order=await Order.findByIdAndUpdate(orderId,{status:'delivered'},{new:true});
    if(order)
    {
      res.json({status:true});
    }

  } catch (error) {
    console.log("error in changestatusPending function",error);
  }
});

//status returned------------------------------------------------------------------------


const changeStatusReturned=asyncHandler(async(req,res)=>{
  try {
    const orderId=req.query.orderId;
    const order=await Order.findByIdAndUpdate(orderId,{status:'returned'},{new:true});
    if(order)
    {
      res.json({status:true});
    }

  } catch (error) {
    console.log("error in changestatusPending function",error);
  }
});


//generate razorpay------------------------------------------------------------------------

const generateOrderRazorpay = (orderId, total) => {


  return new Promise((resolve, reject) => {
    
      const options = {
          amount: total * 100,  // amount in the smallest currency unit
          currency: "INR",
          receipt: String(orderId)
      };
      instance.orders.create(options, function (err, order) {
          if (err) {
              console.log("failed",err);
              console.log(err);
              reject(err);
          } else {
              console.log("Order Generated RazorPAY: " + JSON.stringify(order));
              resolve(order);
          }
      });
  })
}


//razorpay payment ----------------------------------------------------------------------

const verifyPayment=asyncHandler(async(req,res)=>{
  try {
    const ordr=req.body.order
     const order=await Order.findByIdAndUpdate(ordr._id,{
      status:"conformed"
     })
     console.log('this is ther comformed order  data',order);
      verifyOrderPayment(req.body)
      res.json({ status: true });
      
  } catch (error) {
      console.log('errro happemce in cart ctrl in function verifyPayment',error); 
      
  }
});



//verify the payment razorpay ----------------------------------------------------------------------

const verifyOrderPayment = (details) => {
  console.log("DETAILS : " + JSON.stringify(details));
  return new Promise((resolve, reject) => { 
      const crypto = require('crypto');
      let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRETKEY)
      hmac.update(details.razorpay_order_id + '|' + details.razorpay_payment_id);
      hmac = hmac.digest('hex');
      if (hmac == details.razorpay_signature) {
          console.log("Verify SUCCESS");
          resolve();
      } else {
          console.log("Verify FAILED");
          reject();
      }
  })
};











module.exports={
    checkOut,
    orderPlaced,
    orderDetails,
    orderPage,
    allOrderDetails,
    cancelOrder,
    returnOrder,
    adminOrderList,
    adminOrderDetails,
    changeStatusPending,
    changeStatusConfirmed,
    changeStatusShipped,
    changeStatusCanceled,
    changeStatusDelivered,
    changeStatusReturned,
    verifyPayment

    
}