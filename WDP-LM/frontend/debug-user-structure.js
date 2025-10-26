// Debug user structure in frontend
function debugUserStructure() {
  console.log('🔍 DEBUG USER STRUCTURE IN FRONTEND');
  console.log('===================================\n');

  console.log('📊 REDUX USER STATE STRUCTURE:');
  console.log('==============================');
  console.log('const currentUser = useSelector(state => state.user.user);');
  console.log('');
  console.log('Expected structure:');
  console.log('{');
  console.log('  _id: "user_id_here",');
  console.log('  id: "user_id_here", // Same as _id');
  console.log('  name: "User Name",');
  console.log('  email: "user@example.com",');
  console.log('  role: "student|tutor|admin",');
  console.log('  // ... other fields');
  console.log('}');
  
  console.log('\n🔍 CHATWIDGET USER ID DETECTION:');
  console.log('=================================');
  console.log('const userId = currentUser?._id || currentUser?.id || currentUser?.account?._id || currentUser?.account?.id || currentUser?.user?._id || currentUser?.user?.id;');
  console.log('');
  console.log('Priority order:');
  console.log('1. currentUser._id (primary)');
  console.log('2. currentUser.id (fallback)');
  console.log('3. currentUser.account._id (nested)');
  console.log('4. currentUser.account.id (nested)');
  console.log('5. currentUser.user._id (nested)');
  console.log('6. currentUser.user.id (nested)');
  
  console.log('\n💡 DEBUGGING STEPS:');
  console.log('===================');
  console.log('1. Open browser console');
  console.log('2. Go to tutor profile page');
  console.log('3. Click "Liên hệ" button');
  console.log('4. Check console logs for:');
  console.log('   - "ChatWidget: Current user object:"');
  console.log('   - "ChatWidget: User ID sources:"');
  console.log('   - "ChatWidget: No user ID found in currentUser"');
  
  console.log('\n🔧 COMMON ISSUES:');
  console.log('=================');
  console.log('1. User not logged in: currentUser is null');
  console.log('2. Wrong user structure: currentUser has different fields');
  console.log('3. Redux state not updated: currentUser is undefined');
  console.log('4. Authentication expired: currentUser is empty object');
  
  console.log('\n✅ SOLUTION:');
  console.log('============');
  console.log('If currentUser._id exists, use it directly:');
  console.log('const userId = currentUser._id;');
  console.log('');
  console.log('If currentUser structure is different, check Redux state:');
  console.log('console.log("Redux state:", useSelector(state => state.user));');
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('==============');
  console.log('1. Check browser console for user object');
  console.log('2. Verify user is logged in');
  console.log('3. Check Redux state structure');
  console.log('4. Update ChatWidget if needed');
}

// Run the debug
debugUserStructure();
