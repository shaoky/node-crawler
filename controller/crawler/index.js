import db from '../../config/db'
import BaseComponent  from '../base'
import http from '../../http'
import moment from 'moment'
import cheerio from "cheerio"
import puppeteer from 'puppeteer'

let pageNo = 1
let type = 2 // 1正式服，2怀旧服
let maxPage = 0
class Crawler extends BaseComponent {
    constructor () {
        super()
        this.add = this.add.bind(this)
    }
    
    async getPrice (req, res, next) {
        const sql = 'SELECT * FROM g'
        db.query(sql, (err, result) => {
            let arr = []
            for (let item of result) {
                // console.log(item.time)
                let date = item.time && item.time.slice(0, 10)
                if (item.type === 2) {
                    if (date) {
                        let find = arr.find(item => item.time === date)
                        if (find) {
                            find.price += Number(item.price)
                            find.len++
                        } else {
                            arr.push({
                                time: date,
                                price: 0,
                                priceStr: 0,
                                len: 0
                            })
                        }
                    } else {
                        let find = arr.find(item => item.time === '2020-8-15')
                        if (find) {
                            find.price += Number(item.price)
                            find.len++
                        } else {
                            arr.push({
                                time: '2020-8-15',
                                price: 0,
                                len: 0
                            })
                        }
                    }
                }
                
            }
            for (let item of arr) {
                item.price = (item.price / item.len).toFixed(2)
                item.priceStr = (1 / item.price).toFixed(4)
                item.len = item.len + '条'
            }
            res.send(arr)
        })
    }

    async add (req, res, next) {
        let current_time =  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
        let homeBody
        if (type === 1) {
            homeBody = await http(`https://www.dd373.com/s-2c0sxw-0-0-0-0-0-12u8mf-0-0-0-0-0-${pageNo}-0-0-0.html`, 'GET', '' )  // 正式服
        } else {
            homeBody = await http(`https://www.dd373.com/s-eja7u2-0-0-0-0-0-jk5sj0-0-0-0-0-0-${pageNo}-0-0-0.html`, 'GET', '' ) // 怀旧服
        }
        const $ = cheerio.load(homeBody)
        maxPage = Math.ceil(Number($('.footer-pagination').find('.colorFF5').text()) / 20)
        console.log(`当前页码：${pageNo}------总页码${maxPage}`)
        let price = $('.good-list-box').find('.goods-list-item').find('.width271').find('.p-r66')
        /**获取不到，说明碰到了验证码，去处理 */
        if (price.text() === '') {
            this.validation()
            return
        }
        price.each((item, e) => {
            let addSql = 'INSERT INTO g(price, time, type) VALUES(?, ?, ?)'
            let price = $(e).find('.colorFF5').text()
            price = price.replace('1元=', '')
            price = price.replace('金', '')
            let addSqlParams = [price, current_time, type]
            db.insert(addSql,addSqlParams, (err, result) => {
                if (err) {
                    console.log('[INSERT ERROR] - ',err.message)
                    return
                }        
            })
        })
        if (pageNo < maxPage) {
            pageNo++
            this.add()
        } else {
            res.send({
                pageNo: pageNo
            })
        }
    }

    async validation() {
        console.log('开始验证')
        let page = null
        const browser = await puppeteer.launch({
            executablePath:'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            headless: false,
            ignoreDefaultArgs:['--enable-automation']
        })
        page = await browser.newPage()

        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            })
        })
    
        await page.goto(
        "https://goods.dd373.com/default/goods_slider.html?tourl=https://www.dd373.com/s-2c0sxw-c-12u8mf.html&shoplisttype=1"
        )
        const frame = await page.frames().find(f => f.url().includes('https://www.dd373.com'))

        const start  = await frame.waitForSelector('.nc-container')
        const startinfo = await start.boundingBox()
        const end = await frame.waitForSelector('.nc-lang-cnt')
        const endinfo = await end.boundingBox()
        await page.waitFor(500)
        await page.mouse.move(startinfo.x,endinfo.y)
        await page.mouse.down()
        for(var i = 0; i < startinfo.width; i++) {
            await page.mouse.move(startinfo.x + i, endinfo.y)
        }
        await page.mouse.up()
        console.log('验证成功')
        this.add()
        await browser.close()
    }
}

export default new Crawler()