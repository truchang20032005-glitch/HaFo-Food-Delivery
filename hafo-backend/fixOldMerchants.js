const mongoose = require('mongoose');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const PendingRestaurant = require('./models/PendingRestaurant');

// Kết nối DB
const MONGO_URI = 'mongodb+srv://truchang20032005:truchang20032005@cluster0.6dkuxpp.mongodb.net/hafo_db?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Kết nối MongoDB Atlas thành công'))
  .catch(err => {
    console.error('❌ Lỗi kết nối MongoDB:', err.message);
    process.exit(1);
  });


async function fixOldMerchants() {
    try {
        console.log('🔍 Đang tìm các merchant đã được duyệt nhưng chưa có restaurant...');

        // 1. Tìm tất cả user có role = 'merchant' nhưng chưa có restaurant
        const merchants = await User.find({ 
            role: 'merchant',
            restaurant: { $exists: false } // Hoặc null
        });

        console.log(`📊 Tìm thấy ${merchants.length} merchant cần fix`);

        for (const merchant of merchants) {
            console.log(`\n👤 Đang xử lý: ${merchant.username} (${merchant._id})`);

            // 2. Tìm restaurant có owner = merchant._id
            const restaurant = await Restaurant.findOne({ owner: merchant._id });

            if (restaurant) {
                // 3. Cập nhật user với restaurant ID
                await User.findByIdAndUpdate(merchant._id, {
                    restaurant: restaurant._id,
                    approvalStatus: 'approved'
                });
                console.log(`   ✅ Đã gán restaurant: ${restaurant.name}`);
            } else {
                // 4. Nếu không tìm thấy Restaurant, kiểm tra PendingRestaurant
                const pending = await PendingRestaurant.findOne({ 
                    userId: merchant._id.toString(),
                    status: 'approved'
                });

                if (pending) {
                    console.log(`   ⚠️ Tìm thấy PendingRestaurant nhưng chưa tạo Restaurant`);
                    console.log(`   💡 Cần admin duyệt lại hoặc tạo Restaurant thủ công`);
                } else {
                    console.log(`   ❌ Không tìm thấy dữ liệu nhà hàng`);
                }
            }
        }

        console.log('\n✅ Hoàn thành!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

fixOldMerchants();