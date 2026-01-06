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
        const { userId, role, amount, bankInfo } = req.body;

        // ✅ Kiểm tra số tiền tối thiểu
        if (amount < 50000) {
            return res.status(400).json({ message: "Số tiền rút tối thiểu là 50.000đ" });
        }

        // ✅ Kiểm tra số dư thực tế trong DB tùy theo role
        if (role === 'shipper') {
            const shipper = await Shipper.findOne({ user: userId });
            if (!shipper || shipper.income < amount) {
                return res.status(400).json({ message: "Số dư ví không đủ để rút!" });
            }
        } else if (role === 'merchant') {
            const shop = await Restaurant.findOne({ owner: userId });
            if (!shop || shop.revenue < amount) {
                return res.status(400).json({ message: "Doanh thu hiện tại không đủ để rút!" });
            }
        }

        const newTrans = new Transaction({
            userId,
            role,
            amount,
            bankInfo,
            status: 'pending'
        });

        await newTrans.save();
        res.status(201).json(newTrans);
    } catch (err) {
        res.status(500).json({ error: err.message });
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