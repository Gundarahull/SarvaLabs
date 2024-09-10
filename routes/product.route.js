const express=require('express')
const { createProduct, applyDiscount, calculate_Final_Price, productInfo } = require('../controllers/product.controller')
const router=express.Router()

router.post('/products',createProduct)
router.post('/products/:id/discount',applyDiscount)
router.get('/products/:id/price',calculate_Final_Price)
router.get('/products/:id',productInfo)

module.exports=router