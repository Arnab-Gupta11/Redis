import express from "express"
import Redis from "ioredis"
import mongoose from "mongoose";


const app = express();
app.use(express.json())

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

function userKeyJson(id){
  return `user:${id}:json`
}
function userKeyHash(id){
  return `user:${id}:hash`
}

app.get('/redis', async(req, res)=>{
  const reply= await redis.ping();
  res.json({redis:reply})
})

app.get("/mongo", async(req,res)=>{
  const url = process.env.MONGO_URL || 'mongodb://localhost:27017/mongo_redis';

  if(mongoose.connection.readyState === 0 ){
    await mongoose.connect(url);
  }
  res.json({mono: "connected", database: mongoose.connection.name});
})

//User Cache Api
app.post("/user/:id/json", async (req,res)=>{
  const raw= await redis.set(userKeyJson(req.params.id),JSON.stringify(req.body));
  res.json({success:true, raw:raw})
})


app.get("/user/:id/json", async (req,res)=>{
  const raw= await redis.get(userKeyJson(req.params.id));
  res.json({user:raw? JSON.parse(raw) : null})
})

app.post("/user/:id/hash", async (req,res)=>{
  const raw= await redis.hset(userKeyHash(req.params.id),req.body);
  res.json({savedAs: "hash"})
})

app.get("/user/:id/hash", async (req,res)=>{
  const user= await redis.hgetall(userKeyHash(req.params.id));
  res.json({user})
})


app.listen(3000, ()=>{
  console.log("Server is running on the port 3000");
})
