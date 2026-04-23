#!/usr/bin/env node

/**
 * Demo script for Attendance Verification System
 * This script demonstrates the complete flow of offline attendance verification
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_INSTRUCTOR_TOKEN = 'your_instructor_jwt_token'; // Replace with actual token
const TEST_STUDENT_TOKEN = 'your_student_jwt_token'; // Replace with actual token

// Test data
const testAppointmentId = 1; // Replace with actual appointment ID
const testSessionId = 'test_session_id';

async function demoAttendanceVerification() {
  console.log(' Starting Attendance Verification Demo\n');

  try {
    // Step 1: Instructor creates attendance session
    console.log('1⃣ Instructor creates attendance session...');
    const sessionResponse = await axios.post(
      `${BASE_URL}/attendance/session`,
      {
        appointmentId: testAppointmentId,
        qrRefreshInterval: 3000,
        qrExpirySeconds: 15,
      },
      {
        headers: { Authorization: `Bearer ${TEST_INSTRUCTOR_TOKEN}` },
      }
    );
    console.log(' Session created:', sessionResponse.data);

    const sessionId = sessionResponse.data.session_id;

    // Step 2: Get QR code
    console.log('\n2⃣ Getting QR code...');
    const qrResponse = await axios.get(
      `${BASE_URL}/attendance/session/${sessionId}/qr`,
      {
        headers: { Authorization: `Bearer ${TEST_INSTRUCTOR_TOKEN}` },
      }
    );
    console.log(' QR Code:', qrResponse.data);

    // Step 3: Student registers device
    console.log('\n3⃣ Student registers device...');
    const deviceResponse = await axios.post(
      `${BASE_URL}/attendance/device`,
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        screenResolution: '1920x1080',
        timezone: 'Asia/Ho_Chi_Minh',
        language: 'vi-VN',
        platform: 'Win32',
        hardwareConcurrency: 8,
        deviceMemory: 8,
        canvasFingerprint: 'abc123',
        webglFingerprint: 'def456',
      },
      {
        headers: { Authorization: `Bearer ${TEST_STUDENT_TOKEN}` },
      }
    );
    console.log(' Device registered:', deviceResponse.data);

    // Step 4: Student verifies attendance
    console.log('\n4⃣ Student verifies attendance...');
    const verifyResponse = await axios.post(
      `${BASE_URL}/attendance/verify`,
      {
        sessionId: sessionId,
        qrToken: qrResponse.data.qrToken,
        deviceFingerprint: deviceResponse.data.fingerprint_hash,
        clientIp: '192.168.1.100',
        wifiSsid: 'CampusWiFi',
        gpsLatitude: 21.0285,
        gpsLongitude: 105.8542,
        gpsAccuracy: 10,
        scanDuration: 1500,
        consentGiven: true,
      },
      {
        headers: { Authorization: `Bearer ${TEST_STUDENT_TOKEN}` },
      }
    );
    console.log(' Verification result:', JSON.stringify(verifyResponse.data, null, 2));

    // Step 5: Instructor checks session status
    console.log('\n5⃣ Instructor checks session status...');
    const statusResponse = await axios.get(
      `${BASE_URL}/attendance/session/${sessionId}`,
      {
        headers: { Authorization: `Bearer ${TEST_INSTRUCTOR_TOKEN}` },
      }
    );
    console.log(' Session status:', JSON.stringify(statusResponse.data, null, 2));

    // Step 6: Instructor approves attempt (if needed)
    if (verifyResponse.data.riskLevel !== 'low') {
      console.log('\n6⃣ Instructor approves attempt...');
      const approveResponse = await axios.put(
        `${BASE_URL}/attendance/attempt/${verifyResponse.data.attemptId}/approve`,
        {
          reason: 'Manual approval after review',
        },
        {
          headers: { Authorization: `Bearer ${TEST_INSTRUCTOR_TOKEN}` },
        }
      );
      console.log(' Attempt approved:', approveResponse.data);
    }

    console.log('\n Demo completed successfully!');

  } catch (error) {
    console.error(' Demo failed:', error.response?.data || error.message);
  }
}

// Setup campus configuration (run once)
async function setupCampusConfig() {
  console.log(' Setting up campus configuration...');

  try {
    const configResponse = await axios.post(
      `${BASE_URL}/attendance/campus-config`,
      {
        campus_name: 'Hanoi University of Science and Technology',
        ip_ranges: '["192.168.1.0/24", "10.0.0.0/8"]',
        wifi_ssids: '["HUST_WiFi", "EduNet", "CampusNet"]',
        gateway_ips: '["192.168.1.1", "10.0.0.1"]',
        latitude_center: 21.0285,
        longitude_center: 105.8542,
        radius_meters: 500,
      },
      {
        headers: { Authorization: `Bearer admin_token_here` }, // Admin token
      }
    );
    console.log(' Campus config created:', configResponse.data);
  } catch (error) {
    console.error(' Campus config failed:', error.response?.data || error.message);
  }
}

// Run demo
if (require.main === module) {
  // Uncomment to setup campus config first
  // setupCampusConfig().then(() => {
    demoAttendanceVerification();
  // });
}

module.exports = { demoAttendanceVerification, setupCampusConfig };