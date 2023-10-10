const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var categorySchema = new mongoose.Schema({
    image:{
        type:String,
        required:true,
        
    },
    name:{
        type:String,
        required:true,
        
    },
    description:{
        type:String,
        required:true,
       
    },
    verified:{
        type:Boolean,
       default:false
    },
    status:{
        type:Boolean,
        default:false
    }
    
});

//Export the model
module.exports = mongoose.model('Category', categorySchema);