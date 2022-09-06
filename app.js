const express = require('express')
const app = express()
const db = require('./models')
// const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs');
const pgp = require('pg-promise')()
const session = require('express-session')
const path = require('path')


//?engine configuration
app.use(express.static('public'))//configure public folder
app.set('view engine', 'ejs')//install ejs templates
// (VIEWS_PATH + '/partials', 'ejs')
const port = 3000
const CONNECTION_STRING = "postgres://localhost:5432/newsDB"
// const SALT_ROUTE = 10

// const VIEWS_PATH = path.join(__dirname, '/views')

app.use(session({
    secret:'ljhsdkahj',
    resave: false,
    saveUninitialized: false
}))

app.use(express.urlencoded({extended: false}))
app.use(express.json())






// app.post('/register', (req, res)=>{

//     let username = req.body.username
//     let password = req.body.password

//     db.oneOrNone('SELECT userID FROM users WHERE username = $1', [username])
//     .then((user)=>{
//         if (user) {
//             res.render('register', {message: "User name already exists!"})
//         }
//         else{
//             //insert user into user tables
//             db.none('INSERT INTO users(username,password) VALUES ($1,$2)', [username,password])
//             .then(()=>{
//                 res.send('SUCCESS')
//             })
//         }
//     })

  

// })

app.post('/register', async (req, res) => {
    // collect data from form and store it in the db
    try {
        //? 1. scrape info from the header
        let { username, email, password } = req.body;
        //? 2. encrypt the password, import bcrypt: const bcrypt = require('bcryptjs'); //has and salt the password
        password = bcrypt.hashSync(password, 8); //arg1=variable you want to crypt, arg2= how many times you want to salt
        //? 3. create a new record in the db // bring the database; const db = require('../models') //models/index.js
        let insertRecord = await db.users.create({
            userName: username,
            email: email,
            password: password, //encrypted and salted already
        })
        console.log('completed')
        res.redirect('/login')

    } catch (error) {
        console.log(error)
        res.render('register', {
            error: "error can't register this user name"
        })

    }
})

// app.get('/', (req, res)=>{
//     db.any('SELECT articleid, title,body FROM articles')
//     .then((articles)=>{
//         res.render('index', {articles: articles})
//     })
// })

app.get('/all-articles', async (req, res)=>{
    try{
        //let userID = req.session.user.userID
        // console.log('req.session.user',req.session.user);
        let results = await db.articles.findAll()
      
            console.log('results', results);
            res.render('all-articles', {articles: results}) 
        
    }
    catch(error){
    
        console.log(error);
    
    }
    
    
    
       
    })

app.get('/register', (req, res)=>{
    res.render('register')
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/users/add-article', (req, res)=>{


    res.render('add-article')

})

app.get('/', (req,res)=>{
    res.render('index')
})


app.get('/users/delete-article/:articleId', async (req,res) =>{

    try {
        
        
        let articleId = parseInt(req.params.articleId)
        console.log('articleId', typeof articleId);
        let result = await db.articles.destroy({where: {id: articleId}})

     
        res.redirect('/users/articles')
       


    } 
    catch (error) {
        console.log(error);
    }

    

 
})

app.post('/users/add-article', async (req, res)=>{

    try {
            let title = req.body.title
            let description = req.body.description
            let userID = req.session.user.userID
            let result = await db.articles.create({title: title, body: description, userID: userID})


        res.redirect("/users/articles")
   
    } catch (error) {
        console.log(error);
    }
  

})


app.post('/users/update-article', async (req, res)=>{

try {
        let title = req.body.title
        let description = req.body.description
        let articleId = req.body.articleId
        let result = await db.articles.update({title: title, body: description}, {where: {id: articleId}})

        
        res.redirect('/users/articles')
} catch (error) {
    console.log(error);
}
 

    // db.none ('UPDATE articles SET title = $1, body = $2 WHERE articleid = $3', [title,description,articleId])
    // .then(()=>{
      
    // })

})

app.get('/users/articles/edit/:articleId', async (req, res)=>{ 

    try {
         let articleId = req.params.articleId
         let results = await db.articles.findAll({where: {id: articleId}})

         console.log(results[0].dataValues);
    
        res.render('edit-article', {article: results})
  
    } catch (error) {
        console.log(error);
    }
    
   

  
})

app.get('/users/articles', async (req, res)=>{
try{
    let userID = req.session.user.userID
    // console.log('req.session.user',req.session.user);
    let results = await db.articles.findAll({where: {userID: userID}})
  
        console.log('results', results);
        res.render('articles', {articles: results}) 
    
}
catch(error){

    console.log(error);

}



   
})



app.post('/login', async (req, res)=>{

    let username = req.body.username
    let password = req.body.password

    // db.oneOrNone('SELECT userID,username,password FROM users WHERE username = $1', [username])
    let users = await db.users.findAll({where: {userName: username} })
    let user = await users[0].dataValues
    // console.log('users',user);

    // .then((user) =>{
        if(user) {   //check for users password

            bcrypt.compare(password, user.password, (error,result) => {

                if (result) {

                    //put username and id in session

                    if(req.session) {
                       
                req.session.user = {userID: user.id, userName: user.userName}
                // console.log('req.session',req.session);
                    } 


                    res.redirect ('/users/articles')
                }

                else{
                    res.render('login',{message: "Invailid username or password!"})
                }

                
            })

        } else {  //user does not exist
            res.render('login',{message: "Invailid username or password!"})
        }
    })

// })


app.listen(port, ()=>{
    console.log(`server is running on ${port}`);
})