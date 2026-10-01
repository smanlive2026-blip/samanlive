const express = require('express');
const router = express.Router();

// Chat
router.post('/ai/chat', async (req,res)=>{
  const { message } = req.body;
  // Simple rule based for now - later OpenAI connect kar dena
  let reply = 'Aapka sawal samajh aaya!';
  if(message.toLowerCase().includes('price')) reply = 'Price shop dashboard me set hota hai. Product form me jao.';
  if(message.toLowerCase().includes('order')) reply = 'Live orders dashboard ke right side me dikhenge.';
  if(message.toLowerCase().includes('doodh') || message.toLowerCase().includes('milk')) reply = 'Haan doodh available hai! Customer view me check karo.';
  res.json({success:true, reply});
});

router.get('/ai/recommend/:shopId', async (req,res)=>{
  res.json({success:true, products: []});
});

router.get('/ai/voice-search/:shopId', async (req,res)=>{
  res.json({success:true, products: []});
});

module.exports = router;