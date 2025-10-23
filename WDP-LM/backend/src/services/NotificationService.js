const nodemailer = require("nodemailer");
const User = require("../models/User");
const TutorProfile = require("../models/TutorProfile");
const Notification = require("../models/Notification");

// Email template helper
const createEmailTemplate = (type, data) => {
  const templates = {
    booking_created: {
      subject: "🎓 Có yêu cầu đặt lịch mới - EduMatch",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1>🎓 EduMatch</h1>
            <h2>Yêu cầu đặt lịch mới</h2>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <p>Xin chào <strong>${data.tutorName}</strong>,</p>
            <p>Bạn có một yêu cầu đặt lịch mới từ học viên:</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea;">
              <h3>📚 Thông tin khóa học</h3>
              <p><strong>Học viên:</strong> ${data.studentName}</p>
              <p><strong>Thời gian:</strong> ${new Date(data.start).toLocaleString('vi-VN')}</p>
              <p><strong>Hình thức:</strong> ${data.mode === 'online' ? 'Trực tuyến' : 'Tại nhà'}</p>
              <p><strong>Học phí:</strong> ${data.price ? data.price.toLocaleString() + ' VNĐ' : 'Liên hệ'}</p>
              ${data.notes ? `<p><strong>Ghi chú:</strong> ${data.notes}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL}/bookings/tutor" 
                 style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Xem chi tiết và phản hồi
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Vui lòng phản hồi trong vòng 24 giờ để đảm bảo trải nghiệm tốt nhất cho học viên.
            </p>
          </div>
          <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px;">
            <p>© 2024 EduMatch. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      `
    },
    tutor_verification_received: {
      subject: "✅ Đã nhận hồ sơ xác minh gia sư - EduMatch",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1>🎓 EduMatch</h1>
            <h2>✅ Đã nhận hồ sơ xác minh</h2>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <p>Xin chào <strong>${data.fullName}</strong>,</p>
            <p>Chúng tôi đã nhận được hồ sơ xác minh gia sư của bạn. Trạng thái hiện tại: <strong>Đang chờ duyệt</strong>.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea;">
              <h3>📋 Thông tin tóm tắt</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>CMND/CCCD: ${data.hasIdentity ? 'Đã tải lên' : 'Chưa'}</li>
                <li>Học vấn: ${data.hasEducation ? 'Đã tải lên' : 'Chưa'}</li>
                <li>Chứng chỉ: ${data.hasCertificates ? 'Đã tải lên' : 'Không có'}</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile" 
                 style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Xem trạng thái hồ sơ
              </a>
            </div>
          </div>
          <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px;">
            <p>© 2024 EduMatch. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      `
    },
    admin_new_tutor_verification: {
      subject: "📝 Có hồ sơ gia sư mới cần duyệt - EduMatch",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%); color: white; padding: 20px; text-align: center;">
            <h1>🎓 EduMatch Admin</h1>
            <h2>📝 Hồ sơ gia sư mới</h2>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <p>Xin chào Admin,</p>
            <p>Người dùng <strong>${data.fullName}</strong> (${data.email}) vừa gửi hồ sơ xác minh gia sư. Vui lòng kiểm duyệt.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #17a2b8;">
              <h3>📋 Trạng thái tập tin</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>CMND/CCCD: ${data.hasIdentity ? 'Có' : 'Chưa có'}</li>
                <li>Học vấn: ${data.hasEducation ? 'Có' : 'Chưa có'}</li>
                <li>Chứng chỉ: ${data.hasCertificates ? 'Có' : 'Không'}</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/verification" 
                 style="background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Mở trang duyệt hồ sơ
              </a>
            </div>
          </div>
          <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px;">
            <p>© 2024 EduMatch. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      `
    },
    
    booking_accepted: {
      subject: "✅ Yêu cầu đặt lịch đã được chấp nhận - EduMatch",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center;">
            <h1>🎓 EduMatch</h1>
            <h2>✅ Đặt lịch thành công!</h2>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <p>Xin chào <strong>${data.studentName}</strong>,</p>
            <p>Chúc mừng! Yêu cầu đặt lịch của bạn đã được gia sư chấp nhận:</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745;">
              <h3>📚 Thông tin khóa học</h3>
              <p><strong>Gia sư:</strong> ${data.tutorName}</p>
              <p><strong>Thời gian:</strong> ${new Date(data.start).toLocaleString('vi-VN')}</p>
              <p><strong>Hình thức:</strong> ${data.mode === 'online' ? 'Trực tuyến' : 'Tại nhà'}</p>
              <p><strong>Học phí:</strong> ${data.price ? data.price.toLocaleString() + ' VNĐ' : 'Liên hệ'}</p>
              ${data.location ? `<p><strong>Địa điểm:</strong> ${data.location}</p>` : ''}
            </div>
            
            <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4>📋 Bước tiếp theo:</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Gia sư sẽ liên hệ với bạn để xác nhận chi tiết</li>
                <li>Thanh toán học phí theo hướng dẫn của gia sư</li>
                <li>Tham gia buổi học đúng giờ</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL}/bookings/me" 
                 style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Xem lịch học của tôi
              </a>
            </div>
          </div>
        </div>
      `
    },
    
    booking_rejected: {
      subject: "❌ Yêu cầu đặt lịch không được chấp nhận - EduMatch",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 20px; text-align: center;">
            <h1>🎓 EduMatch</h1>
            <h2>❌ Yêu cầu đặt lịch không được chấp nhận</h2>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <p>Xin chào <strong>${data.studentName}</strong>,</p>
            <p>Rất tiếc, yêu cầu đặt lịch của bạn không được gia sư chấp nhận:</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc3545;">
              <h3>📚 Thông tin khóa học</h3>
              <p><strong>Gia sư:</strong> ${data.tutorName}</p>
              <p><strong>Thời gian:</strong> ${new Date(data.start).toLocaleString('vi-VN')}</p>
              <p><strong>Lý do:</strong> Gia sư không thể sắp xếp thời gian phù hợp</p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4>💡 Gợi ý:</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Tìm kiếm gia sư khác phù hợp hơn</li>
                <li>Thử đặt lịch với thời gian khác</li>
                <li>Liên hệ với gia sư để trao đổi trực tiếp</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL}/tutor" 
                 style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Tìm gia sư khác
              </a>
            </div>
          </div>
        </div>
      `
    },
    
    payment_success: {
      subject: "🎉 Thanh toán thành công - Mã phòng học đã sẵn sàng! - EduMatch",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center;">
            <h1>🎓 EduMatch</h1>
            <h2>🎉 Thanh toán thành công!</h2>
            <p style="margin: 10px 0; font-size: 18px;">Mã phòng học đã sẵn sàng</p>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <p>Xin chào <strong>${data.studentName}</strong>,</p>
            <p>Chúc mừng! Thanh toán của bạn đã được xác nhận và mã phòng học đã được tạo:</p>
            
            <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #28a745; text-align: center;">
              <h3 style="color: #28a745; margin-bottom: 15px;">🔑 Mã phòng học</h3>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <div style="font-size: 32px; font-weight: bold; color: #28a745; letter-spacing: 3px; font-family: 'Courier New', monospace;">
                  ${data.roomCode}
                </div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                  Sử dụng mã này để tham gia phòng học
                </p>
              </div>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745;">
              <h3>📚 Thông tin khóa học</h3>
              <p><strong>Gia sư:</strong> ${data.tutorName}</p>
              <p><strong>Thời gian:</strong> ${new Date(data.start).toLocaleString('vi-VN')}</p>
              <p><strong>Hình thức:</strong> ${data.mode === 'online' ? 'Trực tuyến' : 'Tại nhà'}</p>
              <p><strong>Học phí:</strong> ${data.price ? data.price.toLocaleString() + ' VNĐ' : 'Liên hệ'}</p>
              ${data.location ? `<p><strong>Địa điểm:</strong> ${data.location}</p>` : ''}
            </div>
            
            <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4>🚀 Cách tham gia phòng học:</h4>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Truy cập <strong>EduMatch</strong> và đăng nhập</li>
                <li>Nhấn nút <strong>"Phòng Học"</strong> trên header</li>
                <li>Nhập mã phòng học: <strong>${data.roomCode}</strong></li>
                <li>Tham gia buổi học đúng giờ</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL}/room/${data.roomCode}" 
                 style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold; margin: 5px;">
                🎥 Tham gia phòng học ngay
              </a>
              <br>
              <a href="${process.env.FRONTEND_URL}/bookings/me" 
                 style="background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 5px;">
                Xem lịch học của tôi
              </a>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4>⚠️ Lưu ý quan trọng:</h4>
              <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                <li>Mã phòng học chỉ có hiệu lực trong thời gian buổi học</li>
                <li>Vui lòng chuẩn bị camera và microphone trước khi tham gia</li>
                <li>Tham gia phòng học 5 phút trước giờ bắt đầu</li>
                <li>Liên hệ gia sư nếu gặp vấn đề kỹ thuật</li>
              </ul>
            </div>
          </div>
          <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px;">
            <p>© 2024 EduMatch. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      `
    },
    
    tutor_payment_success: {
      subject: "💰 Học viên đã thanh toán - Mã phòng học sẵn sàng - EduMatch",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%); color: white; padding: 20px; text-align: center;">
            <h1>🎓 EduMatch</h1>
            <h2>💰 Học viên đã thanh toán!</h2>
            <p style="margin: 10px 0; font-size: 18px;">Mã phòng học đã sẵn sàng</p>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <p>Xin chào <strong>${data.tutorName}</strong>,</p>
            <p>Học viên đã thanh toán thành công và mã phòng học đã được tạo:</p>
            
            <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #17a2b8; text-align: center;">
              <h3 style="color: #17a2b8; margin-bottom: 15px;">🔑 Mã phòng học</h3>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <div style="font-size: 32px; font-weight: bold; color: #17a2b8; letter-spacing: 3px; font-family: 'Courier New', monospace;">
                  ${data.roomCode}
                </div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                  Sử dụng mã này để truy cập phòng dạy học
                </p>
              </div>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #17a2b8;">
              <h3>📚 Thông tin khóa học</h3>
              <p><strong>Học viên:</strong> ${data.studentName}</p>
              <p><strong>Thời gian:</strong> ${new Date(data.start).toLocaleString('vi-VN')}</p>
              <p><strong>Hình thức:</strong> ${data.mode === 'online' ? 'Trực tuyến' : 'Tại nhà'}</p>
              <p><strong>Học phí:</strong> ${data.price ? data.price.toLocaleString() + ' VNĐ' : 'Liên hệ'}</p>
              ${data.location ? `<p><strong>Địa điểm:</strong> ${data.location}</p>` : ''}
            </div>
            
            <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4>🎯 Cách truy cập phòng dạy học:</h4>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Truy cập <strong>EduMatch</strong> và đăng nhập</li>
                <li>Nhấn nút <strong>"Phòng Học"</strong> trên header</li>
                <li>Nhập mã phòng học: <strong>${data.roomCode}</strong></li>
                <li>Bắt đầu buổi dạy đúng giờ</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL}/room/${data.roomCode}" 
                 style="background: #17a2b8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold; margin: 5px;">
                🎥 Truy cập phòng dạy học
              </a>
              <br>
              <a href="${process.env.FRONTEND_URL}/bookings/tutor" 
                 style="background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 5px;">
                Quản lý lịch dạy
              </a>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4>📋 Chuẩn bị buổi dạy:</h4>
              <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                <li>Kiểm tra camera và microphone trước buổi dạy</li>
                <li>Chuẩn bị tài liệu và nội dung bài học</li>
                <li>Truy cập phòng học 5 phút trước giờ bắt đầu</li>
                <li>Liên hệ học viên nếu cần trao đổi thêm</li>
              </ul>
            </div>
          </div>
          <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px;">
            <p>© 2024 EduMatch. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      `
    },
    
    // Escrow notifications
    payment_held: {
      subject: "💰 Thanh toán đã được giữ - EduMatch",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ffc107 0%, #ff8c00 100%); color: white; padding: 20px; text-align: center;">
            <h1>🎓 EduMatch</h1>
            <h2>💰 Thanh toán đã được giữ</h2>
            <p style="margin: 10px 0; font-size: 18px;">Chờ buổi học hoàn thành</p>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <p>Xin chào <strong>${data.studentName}</strong>,</p>
            <p>Thanh toán của bạn đã được giữ an toàn trong hệ thống escrow:</p>
            
            <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #ffc107; text-align: center;">
              <h3 style="color: #ffc107; margin-bottom: 15px;">💳 Thông tin thanh toán</h3>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <div style="font-size: 24px; font-weight: bold; color: #ffc107;">
                  ${data.escrowAmount.toLocaleString()} VNĐ
                </div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                  Số tiền sẽ được chuyển cho gia sư sau buổi học
                </p>
              </div>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
              <h3>📚 Thông tin buổi học</h3>
              <p><strong>Gia sư:</strong> ${data.tutorName}</p>
              <p><strong>Thời gian:</strong> ${new Date(data.start).toLocaleString('vi-VN')}</p>
              <p><strong>Hình thức:</strong> ${data.mode === 'online' ? 'Trực tuyến' : 'Tại nhà'}</p>
            </div>
            
            <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4>🔒 Bảo vệ thanh toán:</h4>
              <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                <li>Tiền được giữ an toàn cho đến khi buổi học hoàn thành</li>
                <li>Nếu có vấn đề, bạn có thể yêu cầu hoàn tiền</li>
                <li>Gia sư chỉ nhận tiền sau khi xác nhận hoàn thành</li>
              </ul>
            </div>
          </div>
          <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px;">
            <p>© 2024 EduMatch. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      `
    },
    
    payment_released: {
      subject: "✅ Thanh toán đã được chuyển - EduMatch",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center;">
            <h1>🎓 EduMatch</h1>
            <h2>✅ Thanh toán đã được chuyển</h2>
            <p style="margin: 10px 0; font-size: 18px;">Buổi học đã hoàn thành</p>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <p>Xin chào <strong>${data.tutorName}</strong>,</p>
            <p>Thanh toán đã được chuyển vào tài khoản của bạn:</p>
            
            <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #28a745; text-align: center;">
              <h3 style="color: #28a745; margin-bottom: 15px;">💰 Số tiền nhận được</h3>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <div style="font-size: 28px; font-weight: bold; color: #28a745;">
                  ${data.tutorPayout.toLocaleString()} VNĐ
                </div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                  Đã trừ phí platform (${data.platformFee.toLocaleString()} VNĐ)
                </p>
              </div>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745;">
              <h3>📚 Thông tin buổi học</h3>
              <p><strong>Học viên:</strong> ${data.studentName}</p>
              <p><strong>Thời gian:</strong> ${new Date(data.start).toLocaleString('vi-VN')}</p>
              <p><strong>Hình thức:</strong> ${data.mode === 'online' ? 'Trực tuyến' : 'Tại nhà'}</p>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL}/bookings/tutor" 
                 style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Xem lịch sử dạy học
              </a>
            </div>
          </div>
          <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px;">
            <p>© 2024 EduMatch. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      `
    },
    
    refund_processed: {
      subject: "💸 Hoàn tiền đã được xử lý - EduMatch",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 20px; text-align: center;">
            <h1>🎓 EduMatch</h1>
            <h2>💸 Hoàn tiền đã được xử lý</h2>
            <p style="margin: 10px 0; font-size: 18px;">Lý do: ${data.reason}</p>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <p>Xin chào <strong>${data.studentName}</strong>,</p>
            <p>Hoàn tiền đã được xử lý cho buổi học bị hủy:</p>
            
            <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #dc3545; text-align: center;">
              <h3 style="color: #dc3545; margin-bottom: 15px;">💰 Số tiền hoàn</h3>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <div style="font-size: 28px; font-weight: bold; color: #dc3545;">
                  ${data.refundAmount.toLocaleString()} VNĐ
                </div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                  Sẽ được chuyển về tài khoản trong 1-3 ngày làm việc
                </p>
              </div>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc3545;">
              <h3>📚 Thông tin buổi học</h3>
              <p><strong>Gia sư:</strong> ${data.tutorName}</p>
              <p><strong>Thời gian:</strong> ${new Date(data.start).toLocaleString('vi-VN')}</p>
              <p><strong>Lý do hủy:</strong> ${data.reason}</p>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL}/bookings/me" 
                 style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Xem lịch học của tôi
              </a>
            </div>
          </div>
          <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px;">
            <p>© 2024 EduMatch. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      `
    },
    
    dispute_opened: {
      subject: "⚠️ Tranh chấp mới cần xử lý - EduMatch Admin",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 20px; text-align: center;">
            <h1>🎓 EduMatch Admin</h1>
            <h2>⚠️ Tranh chấp mới cần xử lý</h2>
            <p style="margin: 10px 0; font-size: 18px;">Booking ID: ${data.bookingId}</p>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <p>Xin chào Admin,</p>
            <p>Có một tranh chấp mới cần được xử lý:</p>
            
            <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #ff6b6b;">
              <h3 style="color: #ff6b6b; margin-bottom: 15px;">📋 Thông tin tranh chấp</h3>
              <p><strong>Lý do:</strong> ${data.reason}</p>
              <p><strong>Người mở:</strong> ${data.openedBy}</p>
              <p><strong>Thời gian:</strong> ${new Date(data.openedAt).toLocaleString('vi-VN')}</p>
              <p><strong>Số tiền:</strong> ${data.escrowAmount.toLocaleString()} VNĐ</p>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ff6b6b;">
              <h3>📚 Thông tin buổi học</h3>
              <p><strong>Gia sư:</strong> ${data.tutorName}</p>
              <p><strong>Học viên:</strong> ${data.studentName}</p>
              <p><strong>Thời gian:</strong> ${new Date(data.start).toLocaleString('vi-VN')}</p>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL}/admin/disputes" 
                 style="background: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Xử lý tranh chấp
              </a>
            </div>
          </div>
          <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px;">
            <p>© 2024 EduMatch. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      `
    }
  };
  
  return templates[type] || { subject: "Thông báo từ EduMatch", html: "<p>Thông báo từ EduMatch</p>" };
};

// Create email transporter
const createTransporter = () => {
  const user = process.env.MAIL_USERNAME || process.env.MAIL_LEARNMATE_USERNAME;
  const pass = process.env.MAIL_PASSWORD || process.env.MAIL_LEARNMATE_PASSWORD;
  
  if (!user || !pass) {
    console.warn("⚠️ Email credentials not configured - notifications will be logged only");
    return null;
  }
  
  try {
    return nodemailer.createTransporter({
      service: "gmail",
      auth: { user, pass }
    });
  } catch (e) {
    console.error("Failed to create email transporter:", e.message);
    return null;
  }
};

// Send notification email
const sendNotificationEmail = async (to, type, data) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`[EMAIL MOCK] ${type} to ${to}:`, data);
      return { success: true, mode: "mock" };
    }
    
    const template = createEmailTemplate(type, data);
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || "no-reply@edumatch.com",
      to,
      subject: template.subject,
      html: template.html
    });
    
    console.log(`✅ Email sent: ${type} to ${to} (${info.messageId})`);
    return { success: true, mode: "real", messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email ${type} to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Send booking notification to tutor
const notifyTutorBookingCreated = async (booking) => {
  try {
    // Get tutor info
    const tutorProfile = await TutorProfile.findById(booking.tutorProfile)
      .populate('user', 'full_name email');
    
    if (!tutorProfile || !tutorProfile.user) {
      console.error("Tutor profile not found for booking:", booking._id);
      return { success: false, error: "Tutor not found" };
    }
    
    // Get student info
    const student = await User.findById(booking.student);
    if (!student) {
      console.error("Student not found for booking:", booking._id);
      return { success: false, error: "Student not found" };
    }
    
    const data = {
      tutorName: tutorProfile.user.full_name,
      studentName: student.full_name,
      start: booking.start,
      end: booking.end,
      mode: booking.mode,
      price: booking.price,
      notes: booking.notes
    };
    
    return await sendNotificationEmail(tutorProfile.user.email, 'booking_created', data);
  } catch (error) {
    console.error("Error notifying tutor:", error);
    return { success: false, error: error.message };
  }
};

// Send booking notification to student
const notifyStudentBookingDecision = async (booking, decision) => {
  try {
    // Get student info
    const student = await User.findById(booking.student);
    if (!student) {
      console.error("Student not found for booking:", booking._id);
      return { success: false, error: "Student not found" };
    }
    
    // Get tutor info
    const tutorProfile = await TutorProfile.findById(booking.tutorProfile)
      .populate('user', 'full_name');
    
    if (!tutorProfile || !tutorProfile.user) {
      console.error("Tutor profile not found for booking:", booking._id);
      return { success: false, error: "Tutor not found" };
    }
    
    const data = {
      studentName: student.full_name,
      tutorName: tutorProfile.user.full_name,
      start: booking.start,
      end: booking.end,
      mode: booking.mode,
      price: booking.price,
      location: booking.mode === 'offline' ? 'Địa điểm sẽ được thông báo' : null
    };
    
    const emailType = decision === 'accept' ? 'booking_accepted' : 'booking_rejected';
    return await sendNotificationEmail(student.email, emailType, data);
  } catch (error) {
    console.error("Error notifying student:", error);
    return { success: false, error: error.message };
  }
};

// Send payment success notification to student
const notifyStudentPaymentSuccess = async (booking) => {
  try {
    // Get student info
    const student = await User.findById(booking.student);
    if (!student) {
      console.error("Student not found for booking:", booking._id);
      return { success: false, error: "Student not found" };
    }
    
    // Get tutor info
    const tutorProfile = await TutorProfile.findById(booking.tutorProfile)
      .populate('user', 'full_name');
    
    if (!tutorProfile || !tutorProfile.user) {
      console.error("Tutor profile not found for booking:", booking._id);
      return { success: false, error: "Tutor not found" };
    }
    
    const data = {
      studentName: student.full_name,
      tutorName: tutorProfile.user.full_name,
      start: booking.start,
      end: booking.end,
      mode: booking.mode,
      price: booking.price,
      location: booking.mode === 'offline' ? 'Địa điểm sẽ được thông báo' : null,
      roomCode: booking.roomId
    };
    
    return await sendNotificationEmail(student.email, 'payment_success', data);
  } catch (error) {
    console.error("Error notifying student payment success:", error);
    return { success: false, error: error.message };
  }
};

// Send payment success notification to tutor
const notifyTutorPaymentSuccess = async (booking) => {
  try {
    // Get tutor info
    const tutorProfile = await TutorProfile.findById(booking.tutorProfile)
      .populate('user', 'full_name email');
    
    if (!tutorProfile || !tutorProfile.user) {
      console.error("Tutor profile not found for booking:", booking._id);
      return { success: false, error: "Tutor not found" };
    }
    
    // Get student info
    const student = await User.findById(booking.student);
    if (!student) {
      console.error("Student not found for booking:", booking._id);
      return { success: false, error: "Student not found" };
    }
    
    const data = {
      tutorName: tutorProfile.user.full_name,
      studentName: student.full_name,
      start: booking.start,
      end: booking.end,
      mode: booking.mode,
      price: booking.price,
      location: booking.mode === 'offline' ? 'Địa điểm sẽ được thông báo' : null,
      roomCode: booking.roomId
    };
    
    return await sendNotificationEmail(tutorProfile.user.email, 'tutor_payment_success', data);
  } catch (error) {
    console.error("Error notifying tutor payment success:", error);
    return { success: false, error: error.message };
  }
};

// Send payment held notification to student
const notifyStudentPaymentHeld = async (booking) => {
  try {
    const student = await User.findById(booking.student);
    if (!student) {
      console.error("Student not found for booking:", booking._id);
      return { success: false, error: "Student not found" };
    }
    
    const tutorProfile = await TutorProfile.findById(booking.tutorProfile)
      .populate('user', 'full_name');
    
    if (!tutorProfile || !tutorProfile.user) {
      console.error("Tutor profile not found for booking:", booking._id);
      return { success: false, error: "Tutor not found" };
    }
    
    const data = {
      studentName: student.full_name,
      tutorName: tutorProfile.user.full_name,
      start: booking.start,
      end: booking.end,
      mode: booking.mode,
      escrowAmount: booking.escrowAmount
    };
    
    return await sendNotificationEmail(student.email, 'payment_held', data);
  } catch (error) {
    console.error("Error notifying student payment held:", error);
    return { success: false, error: error.message };
  }
};

// Send payment released notification to tutor
const notifyTutorPaymentReleased = async (booking) => {
  try {
    const tutorProfile = await TutorProfile.findById(booking.tutorProfile)
      .populate('user', 'full_name email');
    
    if (!tutorProfile || !tutorProfile.user) {
      console.error("Tutor profile not found for booking:", booking._id);
      return { success: false, error: "Tutor not found" };
    }
    
    const student = await User.findById(booking.student);
    if (!student) {
      console.error("Student not found for booking:", booking._id);
      return { success: false, error: "Student not found" };
    }
    
    const data = {
      tutorName: tutorProfile.user.full_name,
      studentName: student.full_name,
      start: booking.start,
      end: booking.end,
      mode: booking.mode,
      tutorPayout: booking.tutorPayout,
      platformFee: booking.platformFee
    };
    
    return await sendNotificationEmail(tutorProfile.user.email, 'payment_released', data);
  } catch (error) {
    console.error("Error notifying tutor payment released:", error);
    return { success: false, error: error.message };
  }
};

// Send refund notification to student
const notifyStudentRefund = async (booking) => {
  try {
    const student = await User.findById(booking.student);
    if (!student) {
      console.error("Student not found for booking:", booking._id);
      return { success: false, error: "Student not found" };
    }
    
    const tutorProfile = await TutorProfile.findById(booking.tutorProfile)
      .populate('user', 'full_name');
    
    if (!tutorProfile || !tutorProfile.user) {
      console.error("Tutor profile not found for booking:", booking._id);
      return { success: false, error: "Tutor not found" };
    }
    
    const data = {
      studentName: student.full_name,
      tutorName: tutorProfile.user.full_name,
      start: booking.start,
      end: booking.end,
      mode: booking.mode,
      refundAmount: booking.refundAmount,
      reason: booking.cancellationReason || "Hủy buổi học"
    };
    
    return await sendNotificationEmail(student.email, 'refund_processed', data);
  } catch (error) {
    console.error("Error notifying student refund:", error);
    return { success: false, error: error.message };
  }
};

// Send dispute notification to admin
const notifyAdminDispute = async (booking) => {
  try {
    const student = await User.findById(booking.student);
    const tutorProfile = await TutorProfile.findById(booking.tutorProfile)
      .populate('user', 'full_name');
    
    if (!student || !tutorProfile || !tutorProfile.user) {
      console.error("User not found for dispute notification:", booking._id);
      return { success: false, error: "User not found" };
    }
    
    const data = {
      bookingId: booking._id,
      studentName: student.full_name,
      tutorName: tutorProfile.user.full_name,
      start: booking.start,
      end: booking.end,
      mode: booking.mode,
      reason: booking.disputeReason,
      openedBy: booking.disputeOpenedAt ? "Học viên" : "Gia sư",
      openedAt: booking.disputeOpenedAt || new Date(),
      escrowAmount: booking.escrowAmount
    };
    
    // Send to admin email (you can configure this)
    const adminEmail = process.env.ADMIN_EMAIL || "admin@edumatch.com";
    return await sendNotificationEmail(adminEmail, 'dispute_opened', data);
  } catch (error) {
    console.error("Error notifying admin dispute:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendNotificationEmail,
  notifyTutorBookingCreated,
  notifyStudentBookingDecision,
  notifyStudentPaymentSuccess,
  notifyTutorPaymentSuccess,
  notifyStudentPaymentHeld,
  notifyTutorPaymentReleased,
  notifyStudentRefund,
  notifyAdminDispute,
  createEmailTemplate,
  // expose tutor verification helpers
  notifyTutorVerificationReceived: async (user, verification) => {
    const data = {
      fullName: user.full_name || user.email,
      email: user.email,
      hasIdentity: Array.isArray(verification?.identity_documents) && verification.identity_documents.length > 0,
      hasEducation: Array.isArray(verification?.education_documents) && verification.education_documents.length > 0,
      hasCertificates: Array.isArray(verification?.certificates) && verification.certificates.length > 0
    };
    // email
    await sendNotificationEmail(user.email, 'tutor_verification_received', data);
    // in-app
    await Notification.create({
      targetUser: user._id,
      type: 'tutor_verification_received',
      title: 'Đã nhận hồ sơ xác minh',
      message: 'Hồ sơ xác minh gia sư của bạn đang chờ duyệt',
      data: { status: 'pending_review' }
    });
    return { success: true };
  },
  notifyAdminNewTutorVerification: async (user, verification) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@edumatch.com';
    const data = {
      fullName: user.full_name || user.email,
      email: user.email,
      hasIdentity: Array.isArray(verification?.identity_documents) && verification.identity_documents.length > 0,
      hasEducation: Array.isArray(verification?.education_documents) && verification.education_documents.length > 0,
      hasCertificates: Array.isArray(verification?.certificates) && verification.certificates.length > 0
    };
    // email
    await sendNotificationEmail(adminEmail, 'admin_new_tutor_verification', data);
    // in-app (to role admin)
    await Notification.create({
      targetRole: 'admin',
      type: 'admin_new_tutor_verification',
      title: 'Hồ sơ gia sư mới cần duyệt',
      message: `${data.fullName} vừa gửi hồ sơ xác minh gia sư`,
      data: { userId: user._id }
    });
    return { success: true };
  }
};
