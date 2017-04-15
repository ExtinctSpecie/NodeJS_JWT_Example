var User = require('./user');
var Item = require('./item');



var mongoose = require('mongoose');
Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');


var OrderHistorySchema = new mongoose.Schema ({


email : {
    type : String,
    required : true
},
userName : {
    type : String,
    required : true
    
},
totalCost : {
    type : Number,
    required :true
    
},
items : {
    type : [Item.schema],
    required : true
}
});
module.exports = mongoose.model('OrderHistory',OrderHistorySchema);

