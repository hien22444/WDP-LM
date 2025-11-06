/**
 * Script kiểm tra cấu hình PayOS
 * Chạy: node backend/scripts/checkPayOS.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const payOS = require("../src/config/payos");

console.log("🔍 Kiểm tra cấu hình PayOS...\n");

// 1. Kiểm tra biến môi trường
console.log("1️⃣ Kiểm tra biến môi trường:");
const requiredEnvVars = [
  "PAYOS_CLIENT_ID",
  "PAYOS_API_KEY",
  "PAYOS_CHECKSUM_KEY",
  "FRONTEND_URL",
];

let allEnvVarsPresent = true;
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    const masked =
      varName.includes("KEY") || varName.includes("SECRET")
        ? value.substring(0, 8) + "..." + value.substring(value.length - 4)
        : value;
    console.log(`   ✅ ${varName}: ${masked}`);
  } else {
    console.log(`   ❌ ${varName}: CHƯA ĐƯỢC CẤU HÌNH`);
    allEnvVarsPresent = false;
  }
});

if (!allEnvVarsPresent) {
  console.log("\n⚠️  Một số biến môi trường chưa được cấu hình!");
  console.log("   Vui lòng kiểm tra file backend/.env\n");
  process.exit(1);
}

// 2. Kiểm tra PayOS instance
console.log("\n2️⃣ Kiểm tra PayOS instance:");
try {
  if (payOS) {
    console.log("   ✅ PayOS instance đã được khởi tạo");
  } else {
    console.log("   ❌ PayOS instance không tồn tại");
    process.exit(1);
  }
} catch (error) {
  console.log("   ❌ Lỗi khi khởi tạo PayOS:", error.message);
  process.exit(1);
}

// 3. Test API connection (thử lấy thông tin đơn hàng test)
console.log("\n3️⃣ Kiểm tra kết nối PayOS API:");
async function testPayOSConnection() {
  try {
    // Tạo một orderCode test (không tồn tại)
    const testOrderCode = Date.now();
    
    // Thử gọi API để kiểm tra credentials
    // PayOS sẽ trả về lỗi nếu credentials sai, nhưng không crash
    console.log("   Đang test kết nối...");
    
    // Note: PayOS không có endpoint "ping", nên ta sẽ test bằng cách
    // tạo một payment link test với số tiền nhỏ
    const testOrder = {
      orderCode: testOrderCode,
      amount: 1000, // 1000 VNĐ (số tiền tối thiểu)
      description: "Test connection",
      returnUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment-success`,
      cancelUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment-cancel`,
    };

    try {
      // PayOS API sử dụng paymentRequests.create()
      if (!payOS.paymentRequests || typeof payOS.paymentRequests.create !== "function") {
        console.log("   ❌ PayOS.paymentRequests.create không tồn tại");
        console.log("   PayOS object keys:", Object.keys(payOS));
        return;
      }
      
      const paymentLink = await payOS.paymentRequests.create(testOrder);
      console.log("   ✅ Kết nối PayOS thành công!");
      console.log(`   ✅ Payment link test: ${paymentLink.checkoutUrl}`);
      console.log("\n   ⚠️  Lưu ý: Đã tạo một payment link test.");
      console.log("   Bạn có thể hủy đơn này trong PayOS Dashboard nếu cần.\n");
    } catch (apiError) {
      // Kiểm tra loại lỗi
      if (apiError.message && apiError.message.includes("401")) {
        console.log("   ❌ Lỗi xác thực (401): PAYOS_CLIENT_ID hoặc PAYOS_API_KEY không đúng");
      } else if (apiError.message && apiError.message.includes("403")) {
        console.log("   ❌ Lỗi quyền truy cập (403): API key không có quyền");
      } else if (apiError.message && apiError.message.includes("400")) {
        console.log("   ⚠️  Lỗi request (400):", apiError.message);
        console.log("   (Có thể do format dữ liệu, nhưng credentials có vẻ đúng)");
      } else {
        console.log("   ⚠️  Lỗi API:", apiError.message);
        console.log("   (Có thể do network hoặc PayOS service)");
      }
    }
  } catch (error) {
    console.log("   ❌ Lỗi khi test kết nối:", error.message);
    if (error.stack) {
      console.log("   Stack:", error.stack);
    }
  }
}

// 4. Kiểm tra webhook URL
console.log("\n4️⃣ Kiểm tra Webhook URL:");
const backendUrl = process.env.BACKEND_URL || process.env.REACT_APP_API_URL || "http://localhost:5000";
const webhookUrl = `${backendUrl}/api/v1/payment/payos-webhook`;
console.log(`   Webhook URL: ${webhookUrl}`);
console.log("\n   📋 Hướng dẫn cấu hình webhook trong PayOS Dashboard:");
console.log("   1. Đăng nhập PayOS Dashboard");
console.log("   2. Vào Settings → Webhooks");
console.log(`   3. Thêm webhook URL: ${webhookUrl}`);
console.log("   4. Chọn events: payment.success, payment.paid");
console.log("\n   💡 Nếu chạy local, dùng ngrok:");
console.log("      ngrok http 5000");
console.log("      Sau đó dùng URL ngrok cho webhook\n");

// 5. Tổng kết
console.log("\n" + "=".repeat(60));
console.log("📊 TỔNG KẾT:");
console.log("=".repeat(60));

testPayOSConnection().then(() => {
  console.log("\n✅ Kiểm tra hoàn tất!");
  console.log("\n📝 Checklist:");
  console.log("   [ ] Đã cấu hình đầy đủ biến môi trường trong .env");
  console.log("   [ ] Đã test kết nối PayOS API");
  console.log("   [ ] Đã cấu hình webhook URL trong PayOS Dashboard");
  console.log("   [ ] Đã test webhook (tạo đơn test và kiểm tra log)");
  console.log("\n");
  process.exit(0);
}).catch((error) => {
  console.error("\n❌ Lỗi khi kiểm tra:", error);
  process.exit(1);
});

