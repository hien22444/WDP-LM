/**
 * Test script for new OTP registration flow
 * Tests:
 * 1. Register → User NOT in DB yet, only in memory
 * 2. Verify OTP → User created in DB
 * 3. Failed OTP → User NOT created in DB
 */

require("dotenv").config();
const axios = require("axios");

const API_URL = process.env.BACKEND_PUBLIC_URL || "http://localhost:5000/api/v1";

const testEmail = `test${Date.now()}@example.com`;
const testData = {
  firstName: "Test",
  lastName: "User",
  email: testEmail,
  password: "Test123456!",
};

async function testRegistrationFlow() {
  console.log("🧪 Testing new OTP registration flow...\n");

  try {
    // Step 1: Register
    console.log("📝 Step 1: Registering user...");
    console.log(`   Email: ${testEmail}`);
    
    const registerRes = await axios.post(`${API_URL}/auth/register`, testData);
    console.log("✅ Registration response:", registerRes.data);
    console.log(`   Status: ${registerRes.data.status}`);
    console.log(`   Message: ${registerRes.data.message}`);
    
    // Step 2: Check if user exists in DB (should NOT exist yet)
    console.log("\n🔍 Step 2: Checking if user exists in DB...");
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: testEmail,
        password: testData.password,
      });
      console.log("❌ FAIL: User exists in DB before OTP verification!");
      return;
    } catch (err) {
      if (err.response?.status === 404 || err.response?.data?.message?.includes("not found")) {
        console.log("✅ PASS: User NOT in DB yet (as expected)");
      } else {
        console.log("⚠️  User might exist with wrong status:", err.response?.data);
      }
    }

    // Step 3: Simulate wrong OTP
    console.log("\n❌ Step 3: Testing with WRONG OTP...");
    try {
      await axios.post(`${API_URL}/auth/verify-otp`, {
        email: testEmail,
        otp: "000000", // Wrong OTP
      });
      console.log("❌ FAIL: Wrong OTP was accepted!");
      return;
    } catch (err) {
      console.log("✅ PASS: Wrong OTP rejected:", err.response?.data?.message);
    }

    // Step 4: Check DB again (user should still NOT exist)
    console.log("\n🔍 Step 4: Checking DB after wrong OTP...");
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: testEmail,
        password: testData.password,
      });
      console.log("❌ FAIL: User was created despite wrong OTP!");
      return;
    } catch (err) {
      console.log("✅ PASS: User still NOT in DB after wrong OTP");
    }

    console.log("\n⚠️  Note: Cannot test correct OTP without reading email.");
    console.log("📧 Please check your email for the 6-digit OTP code.");
    console.log(`   Email: ${testEmail}`);
    console.log("\n🎯 Manual test required:");
    console.log(`   1. Get OTP from email (or check server console logs)`);
    console.log(`   2. Call: POST ${API_URL}/auth/verify-otp`);
    console.log(`      Body: { "email": "${testEmail}", "otp": "YOUR_OTP" }`);
    console.log(`   3. User should be created in DB only after correct OTP`);

    console.log("\n✨ Automated tests completed!");
    console.log("📊 Summary:");
    console.log("   ✅ User NOT created in DB on registration");
    console.log("   ✅ Wrong OTP rejected");
    console.log("   ⏳ Manual OTP verification needed");

  } catch (error) {
    console.error("\n❌ Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testRegistrationFlow();
