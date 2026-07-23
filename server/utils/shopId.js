// shopId ko hamesha String me convert kar dega
const getShopId = (req) => String(req.params.shopId);

module.exports = { getShopId };