require('dotenv').config()
const express = require('express')
const app = express()
const port = 5000

app.get('/',(req,res)=>{
    res.send('Hello World')
})

app.get('/login',(req,res)=>{
    res.send("Hi there Aakash");
})

app.get('/youtube',(req,res)=>{
   res.send("<h2>Chai aur code</h2>")
})

app.listen(process.env.PORT,()=>{
    console.log(`App listening on port ${process.env.PORT}`)
})