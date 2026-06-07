const express = require('express');
const router = express.Router();
const {
  getParticipants,
  getParticipantById,
  getParticipantByRegNo,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  bulkDeleteParticipants,
  exportParticipants,
  importParticipants,
  downloadCSVTemplate,
} = require('../controllers/participantController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadSpreadsheet } = require('../middlewares/uploadMiddleware');

router.route('/').get(getParticipants).post(protect, createParticipant);
router.get('/excel/export', protect, exportParticipants);
router.post('/excel/import', protect, uploadSpreadsheet.single('file'), importParticipants);
router.get('/csv/template', protect, downloadCSVTemplate);
router.get('/reg/:regNo', getParticipantByRegNo);
router.delete('/bulk-delete', protect, bulkDeleteParticipants);
router.route('/:id').get(getParticipantById).put(protect, updateParticipant).delete(protect, deleteParticipant);

module.exports = router;
