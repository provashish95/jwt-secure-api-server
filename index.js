const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.brugb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const productCollection = client.db("gagedFreak").collection("products");
        const orderCollection = client.db("gagedFreak").collection("orders");

        //create token 
        app.post('/login', async (req, res) => {
            const email = req.body;
            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
            res.send({ token })
        })
        //Upload / insert data to database
        app.post('/uploadProduct', async (req, res) => {
            const product = req.body;
            const tokenInfo = req.headers.authorization;
            const [email, accessToken] = tokenInfo?.split(" ");

            //console.log('normal email', email);
            const decoded = verifyToken(accessToken);
            //const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            //console.log('decoded email', decoded.email);
            if (email === decoded.email) {
                const result = await productCollection.insertOne(product)
                res.send({ success: 'Upload successfully' })
            } else {
                res.send({ success: 'Upload failed' })
            }
        });

        app.get('/products', async (req, res) => {
            const products = await productCollection.find({}).toArray();
            res.send(products);
        });
        app.post('/addOrder', async (req, res) => {
            const orderInfo = req.body;
            console.log(orderInfo);
            const result = await orderCollection.insertOne(orderInfo)
            res.send({ success: 'Order Upload successfully' })
        });

        app.get('/orderList', async (req, res) => {
            const orderList = req.body;
            const tokenInfo = req.headers.authorization;
            const [email, accessToken] = tokenInfo?.split(" ");
            //const decoded = verifyToken(accessToken);
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            //console.log('decoded email', decoded.email);
            if (email === decoded.email) {
                const orderInfo = await orderCollection.find({ email: email }).toArray();
                res.send(orderInfo);
            } else {
                res.send({ success: 'failed' })
            }
        })

    }
    finally {

    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})


//verify token ........ function
function verifyToken(token) {
    let email;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            email = 'Invalid email'
        }
        if (decoded) {
            console.log(decoded)
            email = decoded
        }
    });
    return email;
}