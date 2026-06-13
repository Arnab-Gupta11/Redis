import express from "express"
import Redis from "ioredis"
import mongoose from "mongoose";


const app = express();
app.use(express.json())

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

const BANNER_KEY = "app:banner";

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

//Banner Api
app.post("/banner", async (req,res)=>{
  console.log(req.body);
  await redis.set(BANNER_KEY, req.body.message || "Welcom to Redis");
  res.json({success:true});
})
app.get("/banner",async (req,res)=> {
  const message= await redis.get(BANNER_KEY);
  return res.json({message});
})
app.delete("/banner", async (req,res)=>{
  await redis.del(BANNER_KEY);
  return res.json({success:true})
})
app.get("/banner/exist", async (req,res)=>{
  const exist= await redis.exists(BANNER_KEY);
  res.json({exist:exist});
})






app.listen(3000, ()=>{
  console.log("Server is running on the port 3000");
})
