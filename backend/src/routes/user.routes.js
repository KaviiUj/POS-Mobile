const express = require('express');
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/').get(getAllUsers);

router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;

