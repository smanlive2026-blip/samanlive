// api/index.js - isko pura replace kar
let app;
try {
  app = require('../server/server.js');
  console.log("Server loaded OK");
} catch (err) {
  console.error("=== SAMANLIVE CRASH LOG ===");
  console.error(err.message);
  console.error(err.stack);
  module.exports = (req, res) => {
    return res.status(500).json({
      crash: true,
      error: err.message,
      stack: err.stack,
      hint: "Is file ka naam ya uske andar ka require fail hai"
    });
  };
  return;
}
module.exports = app;