const express = require('express');
const router = express.Router();

const {
    getRewards,
    createReward,
    getRewardById,
    updateReward,
    deleteReward
} = require('../controllers/reward.controller');

router.get('/', getRewards);
router.post('/', createReward);
router.get('/:id', getRewardById);
router.put('/:id', updateReward); // changed from PATCH to PUT
router.delete('/:id', deleteReward);

module.exports = router;
