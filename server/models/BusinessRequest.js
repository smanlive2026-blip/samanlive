// LOCATION: server/models/BusinessRequest.js - BUSINESS REQUEST - User se Admin tak
// FLOW: Profile > Business page -> POST /api/business/request -> Admin dekhega -> Approve / Reject -> User ko Login button milega
const mongoose = require('mongoose');
function normPhone(v){
  if(v===undefined||v===null) return '';
  var d = String(v).replace(/\D/g,'');
  return d.length>10 ? d.slice(-10) : d;
}
var s = new mongoose.Schema({
  name:{ type:String, required:true, trim:true },
  phone:{ type:String, required:true, trim:true, set:normPhone },
  role:{ type:String, required:true, enum:['shop_owner','area_manager','product_manager','executive','delivery_boy'] },
  city:{ type:String, default:'', trim:true },
  area:{ type:String, default:'', trim:true },
  shopName:{ type:String, default:'', trim:true },
  companyName:{ type:String, default:'', trim:true },
  message:{ type:String, default:'', trim:true },
  status:{ type:String, enum:['pending','approved','rejected'], default:'pending' },
  adminNote:{ type:String, default:'', trim:true },
  dashboardLink:{ type:String, default:'', trim:true }
},{ timestamps:true });
s.index({ phone:1, role:1, status:1 });
s.index({ status:1, createdAt:-1 });
module.exports = mongoose.models.BusinessRequest || mongoose.model('BusinessRequest', s);