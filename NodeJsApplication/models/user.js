/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

//user model

var UserSchema = new mongoose.Schema({
   name: {
       type: String,
       required: true
   },
   email: {
       type: String,
       lowercase: true,
       unique: true,
       required: true
   },
   password: {
       type: String,
       required: true
   },
   age: {
       type: Number
   }
     
});
//savve users pass
UserSchema.pre('save',function(next){
   var user = this;
   if(this.isModified('password') || this.isNew)
   {
       bcrypt.genSalt(10,function(err,salt)
       {
          if(err)
          {
              return next(err);
          }
          bcrypt.hash(user.password,salt,function()
          {
              
          },function(err,hash){
             user.password = hash;
             next();
          });
       });
   }
   else
   {
       return next();
   }
});

//compare passwords 

UserSchema.methods.comparePassword = function(pw,cb){
  bcrypt.compare(pw,this.password,function(err,isMatch)
  {
      if(err)
      {
          return cb(err);
      }
      cb(null,isMatch);
  });
};

module.exports = mongoose.model('User',UserSchema);