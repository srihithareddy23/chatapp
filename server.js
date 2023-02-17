var express = require('express');
var bodyParser = require('body-parser')
var app = express();
const multer = require('multer')
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
//var imageModel = require('./models/uploadmodel');
const path = require('path');
//const messages = require('./src/messages')

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))

//mongoose schema model

var Message = mongoose.model('Message',{
  name : String,
  message : String,
  filename: String
})

//connecting with mongodb database

var dbUrl = 'mongodb://127.0.0.1:27017/chat-app'


//retreiving or seeing all the messages

app.get('/messages', (req, res) => {
  Message.find({},(err, messages)=> {
    res.send(messages);
  })
})

//retreiving messages by their user name

app.get('/messages/:user', (req, res) => {
  var user = req.params.user
  Message.find({name: user},(err, messages)=> {
    res.send(messages);
  })
})


//file upload

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'images')
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+path.extname(file.originalname))
    }
})

const upload=multer({storage: storage})

app.post('/upload', upload.single('image'),(req, res)=>{
  
  res.send(`File uploaded succesfully \n  File location is: \n ${req.file.path}`)
})


//posting messages and saving into db

app.post('/messages', async (req, res) => {
  try{
    var message = new Message(req.body);

    var savedMessage = await message.save()
      console.log('saved');

    var censored = await Message.findOne({message:'badword'});
      if(censored)
        await Message.remove({_id: censored.id})
      else
        io.emit('message', req.body);
      res.sendStatus(200);
  }
  catch (error){
    res.sendStatus(500);
    return console.log('error',error);
  }
  finally{
    console.log('Message Posted')
  }

})

//setting up connection

io.on('connection', () =>{
  console.log('a user is connected')
})

mongoose.set('strictQuery', true)

mongoose.connect(dbUrl, (err) => {
  console.log('mongodb connected');
})

//server listen

var server = http.listen(5000, () => {
  console.log('server is running on port', server.address().port);
});

