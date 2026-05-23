// src/routes/recordatorios.routes.js
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
  getRecordatorios,
  upsertRecordatorio,
  deleteRecordatorio
} from '../controllers/recordatorios.controller.js'

const router = Router()
router.use(requireAuth)

router.get('/',    getRecordatorios)
router.post('/',   upsertRecordatorio)
router.delete('/:id', deleteRecordatorio)

export default router
