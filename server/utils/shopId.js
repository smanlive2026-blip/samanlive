// shopId ko hamesha String me convert kar dega     server/utils/shopId.js 
const getShopId = (req) => String(req.params.shopId);

module.exports = { getShopId };