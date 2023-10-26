const asyncHandler=require("express-async-handler");
const User=require('../model/userModel');
const Product=require('../model/productModel');
const Order=require('../model/orderModel');
const Razorpay=require('razorpay')
const Coupon=require('../model/couponModel');
const ExcelJS = require('exceljs');




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
      else if(order.payment=='wallet'){
        const a=   user.wallet -= totalPrice;
           const transaction = {
               amount: a,
               status: "debit",
               timestamp: new Date(), // You can add a timestamp to the transaction
           };
       
           // Push the transaction into the user's history array
           user.history.push(transaction);

         

          
            await user.save();
   
           
           res.json({ payment: true, method: "wallet", });
           
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


       
     

        const itemsperpage = 10;
        const currentpage = parseInt(req.query.page) || 1;
        const startindex = (currentpage - 1) * itemsperpage;
        const endindex = startindex + itemsperpage;
        const totalpages = Math.ceil(orders.length /itemsperpage );
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

      if (order.payment !== 'cod') {
        user.wallet += order.totalPrice;

        const transaction = {
            amount:order.totalPrice ,
            status: "credit",
            timestamp: new Date(), // You can add a timestamp to the transaction
        };
      
        user.history.push(transaction);



        await user.save();



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
        status: 'returnrequested'
      }, { new: true });
  
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      user.wallet += order.totalPrice;


      const transaction = {
        amount: user.wallet ,
        status: "credit",
        timestamp: new Date(), // You can add a timestamp to the transaction
    };
    
    user.history.push(transaction);
      await user.save();
  
  
  
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
    const itemsperpage = 5;
    const currentpage = parseInt(req.query.page) || 1;
    const startindex = (currentpage - 1) * itemsperpage;
    const endindex = startindex + itemsperpage;
    const totalpages = Math.ceil(orders.length / itemsperpage);
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
    console.log(order);
    const userId = order.userId;
    console.log(userId,'this is userdata');
    // const user = await User.findOne({ _id: userId });
    const user=await User.findById(userId);
    console.log("......................................................",user);
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


//change status reject return------------------------------------------------------------

const changeStatusReturnRejected=asyncHandler(async(req,res)=>{
  try {
    const orderId=req.query.orderId;
    const order=await Order.findByIdAndUpdate(orderId,{status:'returnreject'},{new:true});
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

    console.log(req.body.order,"this is req.body");
    const ordr=req.body.order
     const order=await Order.findByIdAndUpdate(ordr._id,{
      status:"conformed"
     })
     console.log('this is ther comformed order  data',order);
      verifyOrderPayment(req.body)
      res.json({ status: true });
      
  } catch (error) {
      console.log('errro happemce in order ctrl in function verifyPayment',error); 
      
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



//---------when user click wallet use chenking the cuurent sum and reduce the wallet    
const useWallet=asyncHandler(async(req,res)=>{
  try {
     
      const userId=req.session.user;
      const user=await User.findById(userId)

      if(user){
          let a=req.body
         
          let sum= a.total - a.wallet
         
         res.json({status:true,sum})
      } 
  } catch (error) {
      console.log('errro happemce in cart ctrl in function useWallet',error); 
      
  }
})



//----------loading sales report page ----
const loadsalesReport=asyncHandler(async(req,res)=>{
  try {


      const orders= await Order.find({status:'delivered'})

    
      const itemsperpage = 3;
      const currentpage = parseInt(req.query.page) || 1;
      const startindex = (currentpage - 1) * itemsperpage;
      const endindex = startindex + itemsperpage;
      const totalpages = Math.ceil(orders.length / 3);
      const currentproduct = orders.slice(startindex,endindex);

 res.render('salesReport',{orders:currentproduct,totalpages,currentpage})


      
  } catch (error) {
      console.log('errro happemce in cart ctrl in function loadsalesReport',error); 
      
  }
})
//-----------------------------------

//-----sortinhg the sales report ----------------
const salesReport = asyncHandler(async (req, res) => {
  try {
      const date = req.query.date;
      let orders;

      const currentDate = new Date();

      // Helper function to get the first day of the current month
      function getFirstDayOfMonth(date) {
          return new Date(date.getFullYear(), date.getMonth(), 1);
      }

      // Helper function to get the first day of the current year
      function getFirstDayOfYear(date) {
          return new Date(date.getFullYear(), 0, 1);
      }

      switch (date) {
          case 'today':
              orders = await Order.find({
                  status: 'delivered',
                  createdOn: {
                      $gte: new Date().setHours(0, 0, 0, 0), // Start of today
                      $lt: new Date().setHours(23, 59, 59, 999), // End of today
                  },
              });
              break;
           case 'week':
              const startOfWeek = new Date(currentDate);
              startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Set to the first day of the week (Sunday)
              startOfWeek.setHours(0, 0, 0, 0);

              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 6); // Set to the last day of the week (Saturday)
              endOfWeek.setHours(23, 59, 59, 999);

              orders = await Order.find({
                  status: 'delivered',
                  createdOn: {
                      $gte: startOfWeek,
                      $lt: endOfWeek,
                  },
              });
              break;
          case 'month':
              const startOfMonth = getFirstDayOfMonth(currentDate);
              const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

              orders = await Order.find({
                  status: 'delivered',
                  createdOn: {
                      $gte: startOfMonth,
                      $lt: endOfMonth,
                  },
              });
              break;
          case 'year':
              const startOfYear = getFirstDayOfYear(currentDate);
              const endOfYear = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59, 999);

              orders = await Order.find({
                  status: 'delivered',
                  createdOn: {
                      $gte: startOfYear,
                      $lt: endOfYear,
                  },
              });
             
              break;
          default:
              // Fetch all orders
              orders = await Order.find({ status: 'delivered' });
      }

      const itemsperpage = 3;
      const currentpage = parseInt(req.query.page) || 1;
      const startindex = (currentpage - 1) * itemsperpage;
      const endindex = startindex + itemsperpage;
      const totalpages = Math.ceil(orders.length / 3);
      const currentproduct = orders.slice(startindex,endindex);

 res.render('salesReport',{orders:currentproduct,totalpages,currentpage})
    
  } catch (error) {
      console.log('Error occurred in salesReport route:', error);
      // Handle errors and send an appropriate response
      res.status(500).json({ error: 'An error occurred' });
  }
});
//-------------------------------------------



const buyNOw=asyncHandler(async(req,res)=>{
  try {
      const product= await Product.findById(req.query.id)


      if(product.quantity >=1 ){
        

          const id = req.session.user
          const user = await User.findById(id)
          const coupon = await Coupon.find({
              'user.userId': { $ne: user._id }
          });
          
         
          
         let sum= product.price 
          res.render('buyNow', { user, product, sum ,coupon})

      }else{
          res.redirect(`/api/user/aProduct?id=${product._id}`)
      }
     



  } catch (error) {
      console.log('Error occurred in orderCTrl buyNOw:', error);
      
  }

})
//buy now place order--------------------------------------------------------------------

const buynowPlaceOrder=asyncHandler(async(req,res)=>{
  try {
      // console.log(req.body);
      const {totalPrice,createdOn,date,payment,addressId,prId}=req.body
      // console.log(addressId);
      const userId=req.session.user
      const user= await User.findById(userId);
     

      
      // console.log('product is +>>>>>>>>>>>>>>>>>>>>>>>>>',user.address);

      const address = user.address.find(item => item._id.toString() === addressId);

    
      const productDetail = await Product.findById(prId);

     
    const productDetails={
      ProductId:productDetail._id,
      price:productDetail.price,
      title:productDetail.title,
      image:productDetail.images[0],
      quantity:1


    }


      // console.log('this the produxt that user by ',orderProducts);
     
      const oder = new Order({
          totalPrice:totalPrice,    
          createdOn: createdOn,
          date:date,
          product:productDetails,
          userId:userId,
          payment:payment,
          address:address,
          status:'conformed'
  
      })
       const oderDb = await oder.save()
       //-----------part that dicrese the qunatity od the cutent product --
     
       productDetails.quantity= productDetails.quantity-1      
       await productDetail.save();
          
      
       //-------------------------------  
       
       if(oder.payment=='cod'){
         console.log('yes iam the cod methord');
          res.json({ payment: true, method: "cod", order: oderDb ,qty:1,oderId:user});

       }else if(oder.payment=='online'){
         console.log('yes iam the razorpay methord');

          const generatedOrder = await generateOrderRazorpay(oderDb._id, oderDb.totalPrice);
          res.json({ payment: false, method: "online", razorpayOrder: generatedOrder, order: oderDb ,oderId:user,qty:1});
                      
       }else if(oder.payment=='wallet'){
       const a =   user.wallet -= totalPrice;
          const transaction = {
              amount: a,
              status: "debit",
              timestamp: new Date(), // You can add a timestamp to the transaction
          };
      
          // Push the transaction into the user's history array
          user.history.push(transaction);

        

         
           await user.save();
  
          
          res.json({ payment: true, method: "wallet", });
          
       }




  } catch (error) {
      console.log('Error form oder Ctrl in the function buy now ', error);
      
  }
  
})











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
    verifyPayment,
    useWallet,
    loadsalesReport,
    salesReport,
    changeStatusReturnRejected,
    buyNOw,
    buynowPlaceOrder


    
}