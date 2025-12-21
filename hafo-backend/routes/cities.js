const express = require('express');
const citiesData = require('../data/cities'); // Đọc dữ liệu từ cities.js
const router = express.Router();

// Route để lấy danh sách thành phố và quận/huyện
router.get('/cities', (req, res) => {
    res.json(citiesData); // Trả về danh sách thành phố và quận/huyện
});

module.exports = router;