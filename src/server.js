import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';
import CryptoJS from 'crypto-js';
const app = express();

app.use(express.static(path.join(__dirname,'/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb+srv://feroz:ferozadmin@cluster0.yocc9.mongodb.net/mongotest?retryWrites=true&w=majority', { useNewUrlParser: true , useUnifiedTopology:true});
        const db = client.db('mongotest');
    
        await operations(db);
    
        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error connecting to db', error });
    }
}

app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection('articles').findOne({ name: articleName })
        res.status(200).json(articleInfo);
    }, res);
})

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
    
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvote: articleInfo.upvote + 1,
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
    
        res.status(200).json(updatedArticleInfo);
    }, res);
});

app.post('/api/articles/:name/add-comment', (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articleInfo.comments.concat({ username, text }),
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updatedArticleInfo);
    }, res);
});
/*const hashCode = (s) => {
    var h = 0, l = s.length, i = 0;
    if (l > 0)
        while (i < l)
            h = (h << 5) - h + s.charCodeAt(i++) | 0;
    return h;
};
*/

app.post('/api/login',(req,res)=> {
    const {email,password} = req.body;
    
    const encryptpassword=CryptoJS.AES.encrypt(password,'Edith@2608').toString;
    withDB(async (db)=>{
        const loginuser=await db.collection('Users').findOne({email:email,password:encryptpassword,});
        res.status(200).json(loginuser);
    },res);
    


});
app.post('/api/register',(req,res) =>{
    
    const {firstname,lastname,email,password} = req.body;
    
    const encryptdata=CryptoJS.AES.encrypt(password,'Edith@2608').toString();
    
    withDB(async (db) => {
        await db.collection('Users').insert([{
            first_name: firstname,
            last_name: lastname ,
            email : email,
            password : encryptdata,
        }]);
        const addeduser = await db.collection('Users').findOne({email: email});

        res.status(200).json(addeduser);
    }, res);
});

app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

const port= process.env.PORT ||8001;
app.listen(port, () => console.log('Listening on port 8000'));