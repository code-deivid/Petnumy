// src/routes/especies.routes.js
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { getEspecies } from '../controllers/especies.controller.js'

const router = Router()
router.use(requireAuth)
router.get('/', getEspecies)
export default router
