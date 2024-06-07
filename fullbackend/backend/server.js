import express from 'express';
import cors from 'cors';

app.use(cors);
const app = express();
app.get('/',(req,res)=>{
    res.send('Server is ready');
})

app.get('/api/jokes',(req,res)=>{
    const jokes=[
        {
            id:1,
            title:'A first joke',
            content:'This is first joke',
        },
        {
            id:2,
            title:'A second joke',
            content:'This is second joke',
        },
        {
            id:3,
            title:'A third joke',
            content:'This is third joke',
        },
        {
            id:4,
            title:'A fouth joke',
            content:'This is fourth joke',
        },

    ]
    res.send(jokes);
})

const port = process.env.PORT || 5000;

app.listen(port,()=>{
    console.log(`Server at http://localhost:${port}`)
})