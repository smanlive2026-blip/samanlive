const express=require('express');const router=express.Router();
router.get('/:name', (req,res)=> res.send(`<div>Component ${req.params.name}</div>`));
module.exports=router;