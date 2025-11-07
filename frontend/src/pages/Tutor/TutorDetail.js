// import React, { useState, useEffect } from "react";
// import { Link, useParams } from "react-router-dom";
// import { toast } from "react-toastify";
// import { getTutorProfile } from "../../services/BookingService";
// import {
//   addFavoriteTutor,
//   removeFavoriteTutor,
//   checkFavoriteTutor,
// } from "../../services/FavoriteTutorService";
// import "./TutorDetail.scss";

// const TutorDetail = () => {
//   const { id } = useParams();
//   const [tutor, setTutor] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [isFavorite, setIsFavorite] = useState(false);

//   useEffect(() => {
//     loadTutorProfile();
//     checkIfFavorite();
//   }, [id]);

//   const loadTutorProfile = async () => {
//     try {
//       setLoading(true);
//       const data = await getTutorProfile(id);
//       setTutor(data);
//     } catch (error) {
//       console.error("Error loading tutor profile:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const checkIfFavorite = async () => {
//     try {
//       const result = await checkFavoriteTutor(id);
//       setIsFavorite(result);
//     } catch (error) {
//       console.error("Error checking favorite status:", error);
//     }
//   };

//   const handleToggleFavorite = async () => {
//     try {
//       if (isFavorite) {
//         await removeFavoriteTutor(id);
//         toast.success("Đã xóa khỏi danh sách yêu thích");
//       } else {
//         await addFavoriteTutor(id);
//         toast.success("Đã thêm vào danh sách yêu thích");
//       }
//       setIsFavorite(!isFavorite);
//     } catch (error) {
//       console.error("Error toggling favorite status:", error);
//       toast.error("Có lỗi xảy ra, vui lòng thử lại");
//     }
//   };

//   if (loading) {
//     return <div className="loading">Đang tải...</div>;
//   }

//   if (!tutor) {
//     return <div className="error">Không tìm thấy thông tin gia sư</div>;
//   }

//   return (
//     <div className="tutor-detail">
//       <div className="tutor-detail-header">
//         <div className="container">
//           <div className="profile-header">
//             <div className="profile-info-container">
//               <div className="avatar-section">
//                 <div className="profile-avatar">
//                   <img src={tutor.avatar} alt={tutor.name} />
//                   {tutor.verified && (
//                     <div className="verified-badge">
//                       <i className="fas fa-check-circle"></i>
//                     </div>
//                   )}
//                 </div>
//                 <button
//                   className={`favorite-heart-btn ${isFavorite ? 'active' : ''}`}
//                   onClick={handleToggleFavorite}
//                   title={isFavorite ? "Xóa khỏi danh sách yêu thích" : "Thêm vào yêu thích"}
//                 >
//                   <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`}></i>
//                 </button>
//               </div>
//               <div className="profile-info">
//                 <div className="name-and-actions">
//                   <h1>{tutor.name}</h1>
//                   <div className="action-buttons">
//                     <button
//                       className={`favorite-btn ${isFavorite ? 'active' : ''}`}
//                       onClick={handleToggleFavorite}
//                       title={isFavorite ? "Xóa khỏi danh sách yêu thích" : "Thêm vào yêu thích"}
//                     >
//                       <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`}></i>
//                       <span>{isFavorite ? 'Đã yêu thích' : 'Yêu thích'}</span>
//                     </button>
//                     <Link to="/favorite-tutors" className="view-favorites-btn">
//                       <i className="fas fa-list"></i>
//                       <span>Xem gia sư yêu thích</span>
//                     </Link>
//                   </div>
//                 </div>
//               <div className="rating">
//                 <div className="stars">
//                   {[...Array(5)].map((_, i) => (
//                     <i
//                       key={i}
//                       className={`fas fa-star ${
//                         i < Math.floor(tutor.rating) ? "filled" : ""
//                       }`}
//                     />
//                   ))}
//                 </div>
//                 <span className="rating-text">
//                   {tutor.rating} ({tutor.reviewCount} đánh giá)
//                 </span>
//               </div>
//               <div className="subjects">
//                 {tutor.subjects.map((subject) => (
//                   <span key={subject} className="subject-tag">
//                     {subject}
//                   </span>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="container tutor-detail-content">
//         <div className="main-content">
//           <section className="about">
//             <h2>Giới thiệu</h2>
//             <p>{tutor.bio}</p>
//           </section>

//           <section className="experience">
//             <h2>Kinh nghiệm</h2>
//             <p>{tutor.experience}</p>
//           </section>

//           <section className="teaching-info">
//             <h2>Thông tin giảng dạy</h2>
//             <div className="info-grid">
//               <div className="info-item">
//                 <i className="fas fa-map-marker-alt"></i>
//                 <div>
//                   <h3>Địa điểm</h3>
//                   <p>{tutor.location}</p>
//                 </div>
//               </div>
//               <div className="info-item">
//                 <i className="fas fa-video"></i>
//                 <div>
//                   <h3>Hình thức</h3>
//                   <p>
//                     {tutor.teachModes.includes("online") && "Trực tuyến"}
//                     {tutor.teachModes.includes("online") &&
//                       tutor.teachModes.includes("offline") &&
//                       ", "}
//                     {tutor.teachModes.includes("offline") && "Trực tiếp"}
//                   </p>
//                 </div>
//               </div>
//               <div className="info-item">
//                 <i className="fas fa-clock"></i>
//                 <div>
//                   <h3>Kinh nghiệm</h3>
//                   <p>{tutor.experience}</p>
//                 </div>
//               </div>
//               <div className="info-item">
//                 <i className="fas fa-dollar-sign"></i>
//                 <div>
//                   <h3>Học phí</h3>
//                   <p>{tutor.price.toLocaleString()}đ/buổi</p>
//                 </div>
//               </div>
//             </div>
//           </section>
//         </div>

//         <div className="sidebar">
//           <div className="booking-card">
//             <h3>Đặt lịch học</h3>
//             <div className="price">
//               <span className="amount">{tutor.price.toLocaleString()}đ</span>
//               <span className="unit">/buổi</span>
//             </div>
//             <button className="book-btn">
//               <i className="fas fa-calendar-plus"></i>
//               Đặt lịch ngay
//             </button>
//             <button className="contact-btn">
//               <i className="fas fa-comments"></i>
//               Nhắn tin
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TutorDetail;
