const express = require('express');
const router = express.Router();
const { submitHelpRequest } = require('../controllers/helpController');

router.post('/submit', submitHelpRequest);

module.exports = router;
