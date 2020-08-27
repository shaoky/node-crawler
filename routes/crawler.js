import express from 'express'
import Crawler from '../controller/crawler/index'
const router = express.Router()
router.get('/crawler/price', Crawler.getPrice)
router.get('/crawler/add', Crawler.add)
export default router