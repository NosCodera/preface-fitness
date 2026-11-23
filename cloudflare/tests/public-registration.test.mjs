import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const worker=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../../src/main.jsx',import.meta.url),'utf8');
test('public registration is server-gated by the gym setting',()=>{
 assert.match(worker,/\/api\/public\/registration-info/);
 assert.match(worker,/\/api\/public\/register/);
 assert.match(worker,/Online registration is currently disabled/);
 assert.match(worker,/customerRegistrationEnabled/);
});
test('public registration creates member, optional PIN and optional payment',()=>{
 assert.match(worker,/INSERT INTO members\(/);
 assert.match(worker,/member_portal_credentials/);
 assert.match(worker,/INSERT INTO payments\(/);
 assert.match(worker,/attendance_number/);
});
test('registration form exposes all requested optional fields and QR setting',()=>{
 for(const field of ['name','phone','gender','dob','dietPreference','address','attendanceNumber','pin','planName','paymentAmount','height','weight','aadhaarNumber','medicalConditions','bodyMeasurements']) assert.ok(app.includes(field),`missing ${field}`);
 assert.match(app,/Customer Self Registration QR/);
 assert.match(app,/Allow customer registration/);
});
test('old Aadhaar photo upload UI and OCR handler are removed',()=>{
 assert.doesNotMatch(app,/Fetch details from Aadhaar|Aadhaar front photo|readAadhaarImages/);
});
