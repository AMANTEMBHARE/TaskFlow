const express = require('express');
const controller = require('../controllers/taskController');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/auth');
const validators = require('../validators/taskValidators');

const router = express.Router();

router.use(requireAuth);

router.post('/', validate(validators.create), controller.create);
router.get('/', validate(validators.list), controller.list);
router.get('/:id', validate(validators.byId), controller.getOne);
router.patch('/:id', validate(validators.update), controller.update);
router.delete('/:id', validate(validators.byId), controller.remove);

module.exports = router;
