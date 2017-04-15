
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');


var ItemSchema = new mongoose.Schema ({

category :{
    required : true,
    type : String,
    lowercase : true
},
name : {
    required : true,
    type : String
},
cost : {
    required : true,
    type : Number
},
quantity : {
    type : Number,
    required : true
}
});
module.exports = mongoose.model('Item',ItemSchema);