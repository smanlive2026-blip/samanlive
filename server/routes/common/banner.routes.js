// LOCATION: server/routes/common/banner.routes.js
const express = require('express');
const router = express.Router();

let Banner;
try{ Banner = require('../../models/banner'); }catch(e){ Banner = null; }

router.get('/list/:shopId', async (req,res)=>{
  try{
    const { shopId } = req.params;
    let banners = [];
    if(Banner){
      banners = await Banner.find({ shopId, isActive:true }).sort({ order:1 }).lean();
    }
    // If no banners in DB, return empty - frontend will show default
    res.json({ success:true, banners });
  }catch(e){
    res.json({ success:true, banners:[] });
  }
});

router.post('/create/:shopId', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { title, subtitle, image, badge, link } = req.body;
    if(Banner){
      const b = await Banner.create({ shopId, title, subtitle, image, badge, link });
      return res.json({ success:true, banner:b });
    }
    res.json({ success:true, message:'Banner saved (mock - model not found)' });
  }catch(e){
    res.status(500).json({ success:false, error:e.message });
  }
});

module.exports = router;