const express = require('express');
const router = express.Router();

router.get('/analytics/:shopId', async (req,res)=>{
  res.json({
    success:true,
    analytics: {
      views: 1250,
      orders: 89,
      revenue: 24500,
      dailySales: [
        {date:'Mon', sales:1200},{date:'Tue', sales:1900},{date:'Wed', sales:1500},
        {date:'Thu', sales:2200},{date:'Fri', sales:1800},{date:'Sat', sales:3000},{date:'Sun', sales:2800}
      ],
      heatmap: []
    }
  });
});

router.get('/analytics/:shopId/sales-report', async (req,res)=>{
  if(req.query.format==='csv'){
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename=sales-report.csv');
    return res.send('Date,Orders,Revenue\n2026-09-28,12,3450\n2026-09-29,15,4100');
  }
  res.json({success:true, report:[{date:'2026-09-29',orders:15,revenue:4100,topProduct:'Full Cream Milk'}]});
});

router.get('/analytics/:shopId/visitors', async (req,res)=>{
  res.json({success:true, visitors:[{location:'Surat', device:'Mobile', time: new Date()}]});
});

module.exports = router;