#!/usr/bin/env node

/**
 * System Health Check Script for Loyalty Program
 * This script tests both frontend and backend connectivity
 */

const http = require('http');
const https = require('https');

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEndpoint(url, expectedStatus = 200) {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const request = client.get(url, (res) => {
            resolve({
                success: res.statusCode === expectedStatus,
                status: res.statusCode,
                url: url
            });
        });

        request.on('error', (err) => {
            resolve({
                success: false,
                error: err.message,
                url: url
            });
        });

        request.setTimeout(5000, () => {
            request.destroy();
            resolve({
                success: false,
                error: 'Timeout',
                url: url
            });
        });
    });
}

async function runHealthCheck() {
    log('🔍 Starting Loyalty Program Health Check...', 'blue');
    log('==========================================', 'blue');

    const checks = [
        {
            name: 'Backend API Root',
            url: 'http://localhost:3000',
            description: 'Main backend server'
        },
        {
            name: 'Backend API Health',
            url: 'http://localhost:3000/api/v1/health',
            description: 'API health check endpoint',
            expectedStatus: 200
        },
        {
            name: 'Frontend Development Server',
            url: 'http://localhost:5173',
            description: 'React frontend'
        }
    ];

    let allPassed = true;

    for (const check of checks) {
        process.stdout.write(`Checking ${check.name}... `);

        const result = await checkEndpoint(check.url, check.expectedStatus);

        if (result.success) {
            log('✅ PASS', 'green');
        } else {
            log(`❌ FAIL - ${result.error || `Status: ${result.status}`}`, 'red');
            allPassed = false;
        }

        log(`   ${check.description}`, 'yellow');
        log(`   URL: ${check.url}`, 'yellow');
        console.log();
    }

    log('==========================================', 'blue');

    if (allPassed) {
        log('🎉 All systems are operational!', 'green');
        log('Backend: http://localhost:3000', 'green');
        log('Frontend: http://localhost:5173', 'green');
    } else {
        log('⚠️  Some systems are not responding correctly', 'red');
        log('Please check the error messages above', 'red');
    }

    log('==========================================', 'blue');
    log('📋 Quick Start Commands:', 'blue');
    log('Backend: cd backend && npm run dev', 'yellow');
    log('Frontend: cd backend/frontend && npm run dev', 'yellow');
    log('MongoDB: Make sure MongoDB is running locally', 'yellow');
}

// Run the health check
runHealthCheck().catch(console.error);
