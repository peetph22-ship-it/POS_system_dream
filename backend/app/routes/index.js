const { Router } = require('express')

// Mount each feature module here, e.g. router.use('/menu', require('../modules/menu/menu.routes')).
const router = Router()

router.get('/', (_req, res) => {
  res.json({ name: 'POS Dream API', version: 'v1' })
})

module.exports = router
