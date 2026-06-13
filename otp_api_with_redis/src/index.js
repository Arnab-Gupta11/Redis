import express from "express"
import Redis from "ioredis"
import mongoose from "mongoose";


const app = express();
app.use(express.json())

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

function otpKey(phone){
  return `otp:${phone}`
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

//OTP Api
app.post("/otp", async (req,res)=>{
  const {phone}= req.body;
  const otp = Math.floor(100000 + Math.random()*900000).toString();
  await redis.set(otpKey(phone), otp, 'EX', 30); // Otp valid for 30 second
  res.json({success:true, otp});
})
app.post("/otp/verify",async (req,res)=> {
  const {phone,otp}= req.body;
  const savedOtp= await redis.get(otpKey(phone));

  if(!savedOtp){
    return res.status(400).json({success:false, message:'OTP expired or not found'});
  }
  if(savedOtp !== otp){
     return res.status(400).json({success:false, message:'Invalid OTP!!'});
  }   
  await redis.del(otpKey(phone));
  res.json({success:true, messag:"OTP verified Successfully"});
})


app.get("/otp/:phone/ttl", async (req,res)=>{
  const ttl= await redis.ttl(otpKey(req.params.phone));
  res.json({ttl})
})


app.listen(3000, ()=>{
  console.log("Server is running on the port 3000");
})
