const mongoose = require('mongoose');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');

// ⚠️ Nếu bạn đang dùng Atlas thì NHỚ đổi URI cho đúng
const MONGO_URI = 'mongodb+srv://truchang20032005:truchang20032005@cluster0.6dkuxpp.mongodb.net/hafo_db?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Đã kết nối MongoDB Atlas'))
  .catch(err => {
    console.error('❌ Lỗi MongoDB:', err.message);
    process.exit(1);
  });

const MERCHANT_ID = '694950f5ee28285eca2d0fda'; // 👈 ID merchant cần fix

async function testFix() {
    try {
        // 1. Lấy merchant theo ID
        const merchant = await User.findById(MERCHANT_ID);

        if (!merchant) {
            console.log('❌ Không tìm thấy merchant với ID này');
            process.exit(0);
        }

        console.log(`\n👤 Merchant: ${merchant.username} (${merchant._id})`);
        console.log(`   Role: ${merchant.role}`);

        if (merchant.role !== 'merchant') {
            console.log('⚠️ User này chưa phải merchant');
        }

        // 2. Tìm restaurant theo owner
        const restaurant = await Restaurant.findOne({ owner: merchant._id });

        if (!restaurant) {
            console.log('❌ Merchant này chưa có restaurant trong DB');
            process.exit(0);
        }

        console.log(`🏪 Restaurant: ${restaurant.name} (${restaurant._id})`);

        // 3. Update user → gán restaurant
        await User.findByIdAndUpdate(merchant._id, {
            restaurant: restaurant._id,
            approvalStatus: 'approved'
        });

        console.log('✅ Đã update User → restaurant thành công!');

        // 4. Verify lại
        const updated = await User.findById(merchant._id).populate('restaurant');

        console.log('\n📊 KẾT QUẢ SAU FIX:');
        console.log('   Username:', updated.username);
        console.log('   Role:', updated.role);
        console.log('   Approval:', updated.approvalStatus);
        console.log('   Restaurant:', updated.restaurant ? updated.restaurant.name : 'NULL');
        console.log('   Restaurant ID:', updated.restaurant ? updated.restaurant._id : 'NULL');

        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

testFix();
