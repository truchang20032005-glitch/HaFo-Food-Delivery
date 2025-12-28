const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Shipper = require('../models/Shipper');
const Restaurant = require('../models/Restaurant');

// 1. DÀNH CHO ADMIN: LẤY TẤT CẢ YÊU CẦU ĐỐI SOÁT (Sửa lỗi 404)
router.get('/admin/all', async (req, res) => {
    try {
        // Populate userId để lấy tên khách hàng hiển thị ở frontend
        const list = await Transaction.find()
            .populate('userId', 'fullName phone email')
            .sort({ createdAt: -1 });
        res.json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. LẤY LỊCH SỬ RÚT TIỀN CỦA RIÊNG MỘT USER (Shipper/Merchant)
router.get('/user/:userId', async (req, res) => {
    try {
        const trans = await Transaction.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });
        res.json(trans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. TẠO LỆNH RÚT TIỀN MỚI
router.post('/', async (req, res) => {
    try {
        const newTrans = new Transaction(req.body);
        await newTrans.save();
        res.status(201).json(newTrans);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 4. ADMIN DUYỆT RÚT TIỀN
router.put('/:id/status', async (req, res) => {
    try {
        const { status, note } = req.body;
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: "Không thấy giao dịch" });

        // ✅ NẾU DUYỆT THÀNH CÔNG -> THỰC HIỆN TRỪ TIỀN
        if (status === 'approved' && transaction.status !== 'approved') {
            if (transaction.role === 'shipper') {
                // Trừ thu nhập shipper
                await Shipper.findOneAndUpdate(
                    { user: transaction.userId },
                    { $inc: { income: -transaction.amount } } // Dùng $inc với số âm để trừ
                );
            } else if (transaction.role === 'merchant') {
                // Nếu bạn có trường revenue/income trong Restaurant thì trừ ở đó
                // Giả định bạn lưu doanh thu trong Restaurant
                await Restaurant.findOneAndUpdate(
                    { owner: transaction.userId },
                    { $inc: { revenue: -transaction.amount } }
                );
            }
        }

        transaction.status = status;
        transaction.note = note;
        await transaction.save();

        res.json(transaction);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;