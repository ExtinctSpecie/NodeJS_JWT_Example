var express = require('express');
app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var async = require('async');

var config = require('./config/main');
var User = require('./models/user');
var Item = require('./models/item');
var OrderHistory = require('./models/orderHistory');
var jwt = require('jsonwebtoken');
var port = 2222;

var userInfo;


//use body parser to post requests for api use
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.set("superSecret",config.secret);
//connect to mongodb
mongoose.connect(config.database);
//create api group routes
var apiRoutes = express.Router();

app.use(morgan('dev'));


//
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8383');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
//log requests to console



//register
apiRoutes.post('/register',function(req,res)
{
   console.log("new user : "+req.body.name);
   var newUser = new User({
       email: req.body.email,
       password: req.body.password,
       name: req.body.name,
       age : req.body.age
   }) ;
   
   //try to save user      
   newUser.save(function(err)
   {
       if(err)
           return res.json({success : false });
       res.json({success: true});
   });
});

//authenticate or log in
apiRoutes.post('/authenticate',function(req,res)
{
    console.log('user '+req.body.email+ " is trying to login");
    User.findOne({email: req.body.email},function(err,user)
    {               
        if(err)
        {
            throw err;
        }
        if(!user)
        {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        }
        //compare passwords
        else
        {        

            user.comparePassword(req.body.password,function(err,isMatch)
            {
                if(isMatch && !err)
                {
                    console.log("logged in successfully");
                    //create the token
                    var token = jwt.sign(user, app.get('superSecret'), {
                    expiresIn: 1440 // expires in 24 hours
                    });
                    res.json({
                        success : true,
                        token : token,
                        email : user.email,
                        age : user.age,
                        name : user.name
                        
                    });  
                }                
                else
                {
                    res.json({success:false,message:'couldnt not authenticate passwords didnt match'});
                }             
            });
        }
    });
});
apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;   
        userInfo = decoded;
        //console.log(decoded);
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
    
  }
});
apiRoutes.post('/buyItems',function(req, res)
{
    var jsonItems =  JSON.parse(req.body.items);
    if(Object.keys(jsonItems).length > 0)
    {
        var items = [];
        var newItems = [];
        var totalCost = 0;


    for (var key in jsonItems) {
      if (jsonItems.hasOwnProperty(key)) {
          
        var item = JSON.parse(jsonItems[key]);
        items.push(item);   
      }
    }
    
    for(var i = 0;i< items.length;i++)
    {

        var newItem = new Item({
            category : items[i].category,
            name : items[i].name,
            cost : items[i].cost * items[i].quantity,
            quantity : items[i].quantity
        });
        newItems.push(newItem);
        totalCost += newItem.cost;
    }
    var newOrderHistory = new OrderHistory({
        
        email : userInfo._doc.email,
        userName : userInfo._doc.name,
        totalCost : totalCost,
        items : newItems
    });
    //test is to show how to get for loop items from mongo with mongoose and async
    var test = [];
    
    newOrderHistory.save(function(err)
    {
        if(err)
        {
            console.log(err);
            res.json({success : false});
        }
        else
        {
            async.forEachOf(items, function(value, key, callback) {

                        
                    Item.findOne({

                        name: value.name

                    },function(err,item)
                    {
                        if(err)
                        {
                            
                        }
                        if(item)
                        {
                              
                                console.log(item.name + " old quantity :" + item.quantity);
                                var newQuantity = item.quantity-value.quantity;
                                console.log(item.name + " new quantity :" + newQuantity);
                                if(newQuantity > 0)
                                {
                                   Item.update({ name: value.name }, { $set: { quantity: newQuantity }}, function(err)
                                   {
                                       if(err)
                                       {
                                           console.log("couldnt not update quantity : " + err);
                                       }
                                   });


                               }
                               else if(newQuantity===0)
                               {
                                    Item.remove({

                                    name :value.name

                                    },function(err)
                                    {
                                         console.log("couldnt not delete item with equal quantity : " + err);
                                    });
                               }
                               else
                               {
                                   console.log('wtf quantity is too big');
                                                                   
                               }
                               test.push(item);
                               callback();
                        }
                    });                        
                }, function(err) {
                        if (err) {
                                console.log('one of the api failed, the whole thing will fail now');
                        } else {
                                console.log('Successful for each loop on var test');
                        }
                });
            
            console.log("user -> " + newOrderHistory.email + " -> made a new order");
            res.json({success : true});
        }
        
            
    });
    }
    else
   {
        res.json({success : false});
    }
   
});
    

apiRoutes.get('/showAllUsers',function(req, res)
{
    User.find({}, function(err, users) {   
    
    res.json({allusers: users});  
  });
    
});
apiRoutes.get('/showAllItems',function(req, res)
{
    
    
    Item.find({},function(err , data)
    {
            res.json({allItems : data});
    });
    
    
});
//admin
//
apiRoutes.get('/adminShowAllItems',function(req,res)
{
    
    Item.find({},function(err , data)
    {
            res.json( {records : data});
    });
});
apiRoutes.get('/adminShowAllUsers',function(req,res)
{
    console.log(userInfo);
    User.find({},function(err , data)
    {
            res.json( {records : data});
    });
});
//do this for every activity user is trying to open
apiRoutes.get('/dashboard',function(req, res)
{
    console.log('it worked user mail is : ' + req.user.email);
    res.json({success: true});
    
});


//set url for api group routes

app.use('/api',apiRoutes);
// Add headers

app.get('/',function(req,res){
   res.send("under construction"); 
});


app.listen(port);
console.log('application is now listening to port : '+port+'.');