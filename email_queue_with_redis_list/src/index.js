import express from "express"
import Redis from "ioredis"
import mongoose from "mongoose";


const app = express();
app.use(express.json())

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

const QUEUE_KEY = "queue:email"

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

//Queue email Api
app.post("/emails", async (req,res)=>{
  const job= {
    to: req.body.to,
    subject: req.body.subject || 'No Subject',
    body: req.body.body || 'No Content',
    createdAt: new Date().toISOString()
  }
  const result= await redis.lpush(QUEUE_KEY, JSON.stringify(job)) ;
  res.json({queued:true, job, result})
})
app.get('/email/process-one', async(req,res)=>{
  const rawJob= await redis.rpop(QUEUE_KEY);
  if(!rawJob){
    return res.json({message:"No jobs in the queue"});
  }
  const job= JSON.parse(rawJob)
  res.json({message:"Email Sent",job})
})









app.listen(3000, ()=>{
  console.log("Server is running on the port 3000");
})
