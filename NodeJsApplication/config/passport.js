/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var User = require('../models/user');
var config = require('./main');
module.exports = function(passport)
{
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
    opts.secretOrKey = config.secret;
    passport.use(new JwtStrategy(opts,function(jwt_payload,done)
    {
        User.findOne({id: jwt_payload.id},function(err,user)
        {
           if(err)
           {
               return done(err,false);
           }
           if(user)
           {
               done(null,user);               
           }
           else
           {
               done(null,false);
           }
        });
    }));
};