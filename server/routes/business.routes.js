// LOCATION: server/routes/business.routes.js - BUSINESS REQUEST API
// POST /api/business/request - User se Request - Phone hi pehchan hai, Token nahi chahiye
// GET /api/business/my-requests?phone= - User apni Request ka Status dekhega
// GET /api/business/requests - Admin saari Request dekhega
// PUT /api/business/requests/:id/approve - Admin Approve karega
// PUT /api/business/requests/:id/reject - Admin Reject karega
const ex = require('ex'+'press');
const router = ex.Router();
const BusinessRequest = require('../models/BusinessRequest');
var LINKS = {
  shop_owner:'/area-manager.html',
  area_manager:'/area-manager.html',
  product_manager:'/product-manager/dashboard.html',
  executive:'/executive/dashboard.html',
  delivery_boy:'/delivery-boy.html'
};
router.post('/request', async function(req, res){
  try{
    var b = req.body || {};
    var name = String(b.name||'').trim();
    var phone = String(b.phone||'').replace(/\D/g,'').slice(-10);
    var role = String(b.role||'').trim();
    var city = String(b.city||b.area||'').trim();
    if(!name) return res.status(400).json({ success:false, error:'Naam dalo' });
    if(phone.length!==10) return res.status(400).json({ success:false, error:'10 digit Phone dalo' });
    if(!LINKS[role]) return res.status(400).json({ success:false, error:'Role chuno' });
    if(!city) return res.status(400).json({ success:false, error:'City / Area dalo' });
    var old = await BusinessRequest.findOne({ phone:phone, role:role, status:'pending' });
    if(old) return res.status(400).json({ success:false, error:'Is Role ki Request pehle se Pending hai - Status neeche dekho' });
    var r = await BusinessRequest.create({
      name:name, phone:phone, role:role,
      city:city, area:city,
      shopName:String(b.shopName||'').trim(),
      companyName:String(b.companyName||b.shopName||'').trim(),
      message:String(b.message||'').trim(),
      status:'pending'
    });
    res.json({ success:true, data:r });
  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});
router.get('/my-requests', async function(req, res){
  try{
    var phone = String(req.query.phone||'').replace(/\D/g,'').slice(-10);
    if(phone.length!==10) return res.status(400).json({ success:false, error:'Phone dalo' });
    var list = await BusinessRequest.find({ phone:phone }).sort({ createdAt:-1 }).limit(20);
    res.json({ success:true, data:list });
  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});
router.get('/requests', async function(req, res){
  try{
    var f = {};
    if(req.query.status) f.status = req.query.status;
    if(req.query.role) f.role = req.query.role;
    var list = await BusinessRequest.find(f).sort({ createdAt:-1 }).limit(200);
    res.json({ success:true, data:list });
  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});
router.put('/requests/:id/approve', async function(req, res){
  try{
    var r = await BusinessRequest.findById(req.params.id);
    if(!r) return res.status(404).json({ success:false, error:'Request nahi mili' });
    r.status = 'approved';
    r.adminNote = String((req.body||{}).adminNote||'').trim();
    r.dashboardLink = LINKS[r.role] || '/profile.html';
    await r.save();
    res.json({ success:true, data:r, dashboardLink:r.dashboardLink });
  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});
router.put('/requests/:id/reject', async function(req, res){
  try{
    var r = await BusinessRequest.findById(req.params.id);
    if(!r) return res.status(404).json({ success:false, error:'Request nahi mili' });
    r.status = 'rejected';
    r.adminNote = String((req.body||{}).adminNote||'').trim();
    await r.save();
    res.json({ success:true, data:r });
  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});
module.exports = router;