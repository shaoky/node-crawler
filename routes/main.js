import crawler from './crawler'
export default app => {
	app.use('/', crawler)
}