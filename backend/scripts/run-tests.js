#!/usr/bin/env node

/**
 * Test Runner Script
 * Comprehensive test runner for the loyalty system backend
 * Sets up test environment and runs all test suites
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestRunner {
    constructor() {
        this.testDir = path.join(__dirname, '../tests');
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            dim: '\x1b[2m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m'
        };
    }

    log(message, color = 'white') {
        console.log(`${this.colors[color]}${message}${this.colors.reset}`);
    }

    logHeader(message) {
        const separator = '='.repeat(60);
        this.log(separator, 'cyan');
        this.log(`${' '.repeat(Math.floor((60 - message.length) / 2))}${message}`, 'bright');
        this.log(separator, 'cyan');
    }

    logSubheader(message) {
        this.log(`\n${'—'.repeat(40)}`, 'dim');
        this.log(message, 'yellow');
        this.log('—'.repeat(40), 'dim');
    }

    async checkDependencies() {
        this.logSubheader('Checking Dependencies');

        const requiredDeps = [
            'mocha', 'chai', 'sinon', 'supertest', 'mongodb-memory-server'
        ];

        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
        const devDeps = packageJson.devDependencies || {};

        const missing = requiredDeps.filter(dep => !devDeps[dep]);

        if (missing.length > 0) {
            this.log(`❌ Missing dependencies: ${missing.join(', ')}`, 'red');
            this.log('Run: npm install --save-dev ' + missing.join(' '), 'yellow');
            return false;
        }

        this.log('✅ All test dependencies are installed', 'green');
        return true;
    }

    async setupTestEnvironment() {
        this.logSubheader('Setting Up Test Environment');

        // Set test environment variables
        process.env.NODE_ENV = 'test';
        process.env.MONGODB_URI = 'mongodb://localhost:27017/loyalty_test';
        
        // Set default test values for required env vars
        if (!process.env.SALLA_WEBHOOK_SECRET) {
            process.env.SALLA_WEBHOOK_SECRET = 'test_webhook_secret_key_for_testing';
        }
        
        if (!process.env.SALLA_CLIENT_ID) {
            process.env.SALLA_CLIENT_ID = 'test_client_id';
        }
        
        if (!process.env.SALLA_CLIENT_SECRET) {
            process.env.SALLA_CLIENT_SECRET = 'test_client_secret';
        }

        this.log('✅ Test environment configured', 'green');
    }

    async runTestSuite(pattern, suiteName) {
        return new Promise((resolve, reject) => {
            this.logSubheader(`Running ${suiteName}`);

            const mocha = spawn('npx', ['mocha', pattern, '--timeout', '10000', '--reporter', 'spec'], {
                cwd: path.join(__dirname, '..'),
                stdio: 'inherit',
                env: { ...process.env }
            });

            mocha.on('close', (code) => {
                if (code === 0) {
                    this.log(`✅ ${suiteName} passed`, 'green');
                    resolve(true);
                } else {
                    this.log(`❌ ${suiteName} failed`, 'red');
                    resolve(false);
                }
            });

            mocha.on('error', (error) => {
                this.log(`❌ Error running ${suiteName}: ${error.message}`, 'red');
                reject(error);
            });
        });
    }

    async runAllTests() {
        this.logHeader('🧪 LOYALTY SYSTEM TEST SUITE');

        let totalPassed = 0;
        let totalFailed = 0;

        try {
            // Check dependencies
            if (!(await this.checkDependencies())) {
                process.exit(1);
            }

            // Setup environment
            await this.setupTestEnvironment();

            // Define test suites
            const testSuites = [
                {
                    pattern: 'tests/*.unit.test.js',
                    name: 'Unit Tests'
                },
                {
                    pattern: 'tests/loyaltyEngine.integration.test.js',
                    name: 'Loyalty Engine Integration Tests'
                },
                {
                    pattern: 'tests/webhook.simulation.test.js',
                    name: 'Webhook Simulation Tests'
                },
                {
                    pattern: 'tests/webhook.e2e.test.js',
                    name: 'End-to-End Tests'
                },
                {
                    pattern: 'tests/rewardController.integration.test.js',
                    name: 'Reward Controller Tests'
                },
                {
                    pattern: 'tests/software.e2e.test.js',
                    name: 'Software E2E Tests'
                }
            ];

            // Run each test suite
            for (const suite of testSuites) {
                const testPattern = path.join(__dirname, '..', suite.pattern);
                
                // Check if test files exist
                if (!this.checkTestFilesExist(suite.pattern)) {
                    this.log(`⚠️  Skipping ${suite.name} - no test files found`, 'yellow');
                    continue;
                }

                const passed = await this.runTestSuite(testPattern, suite.name);
                
                if (passed) {
                    totalPassed++;
                } else {
                    totalFailed++;
                }
            }

            // Summary
            this.logHeader('📊 TEST SUMMARY');
            this.log(`Total Test Suites: ${totalPassed + totalFailed}`, 'cyan');
            this.log(`✅ Passed: ${totalPassed}`, 'green');
            
            if (totalFailed > 0) {
                this.log(`❌ Failed: ${totalFailed}`, 'red');
            }

            const successRate = Math.round((totalPassed / (totalPassed + totalFailed)) * 100);
            this.log(`Success Rate: ${successRate}%`, successRate === 100 ? 'green' : 'yellow');

            if (totalFailed === 0) {
                this.log('\n🎉 All tests passed! System is integration ready!', 'green');
                process.exit(0);
            } else {
                this.log('\n⚠️  Some tests failed. Please fix issues before deploying.', 'red');
                process.exit(1);
            }

        } catch (error) {
            this.log(`❌ Test runner error: ${error.message}`, 'red');
            process.exit(1);
        }
    }

    checkTestFilesExist(pattern) {
        const glob = require('glob');
        const files = glob.sync(pattern, { cwd: path.join(__dirname, '..') });
        return files.length > 0;
    }

    async runSpecificTests(testType) {
        this.logHeader(`🧪 RUNNING ${testType.toUpperCase()} TESTS`);

        await this.setupTestEnvironment();

        const testPatterns = {
            unit: 'tests/*.unit.test.js',
            integration: 'tests/*.integration.test.js',
            e2e: 'tests/*.e2e.test.js',
            webhook: 'tests/webhook*.test.js',
            loyalty: 'tests/loyaltyEngine*.test.js'
        };

        const pattern = testPatterns[testType];
        
        if (!pattern) {
            this.log(`❌ Unknown test type: ${testType}`, 'red');
            this.log(`Available types: ${Object.keys(testPatterns).join(', ')}`, 'yellow');
            process.exit(1);
        }

        if (!this.checkTestFilesExist(pattern)) {
            this.log(`❌ No ${testType} test files found`, 'red');
            process.exit(1);
        }

        const testPath = path.join(__dirname, '..', pattern);
        const passed = await this.runTestSuite(testPath, `${testType} Tests`);

        if (passed) {
            this.log(`\n✅ ${testType} tests completed successfully!`, 'green');
            process.exit(0);
        } else {
            this.log(`\n❌ ${testType} tests failed!`, 'red');
            process.exit(1);
        }
    }

    showHelp() {
        this.logHeader('🧪 LOYALTY SYSTEM TEST RUNNER');
        
        this.log('Usage:', 'bright');
        this.log('  node scripts/run-tests.js [options]', 'cyan');
        
        this.log('\nOptions:', 'bright');
        this.log('  --all          Run all test suites (default)', 'white');
        this.log('  --unit         Run only unit tests', 'white');
        this.log('  --integration  Run only integration tests', 'white');
        this.log('  --e2e          Run only end-to-end tests', 'white');
        this.log('  --webhook      Run only webhook tests', 'white');
        this.log('  --loyalty      Run only loyalty engine tests', 'white');
        this.log('  --help         Show this help message', 'white');
        
        this.log('\nExamples:', 'bright');
        this.log('  npm test', 'cyan');
        this.log('  node scripts/run-tests.js --all', 'cyan');
        this.log('  node scripts/run-tests.js --webhook', 'cyan');
        this.log('  node scripts/run-tests.js --e2e', 'cyan');
    }
}

// Main execution
async function main() {
    const runner = new TestRunner();
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        runner.showHelp();
        return;
    }

    if (args.includes('--unit')) {
        await runner.runSpecificTests('unit');
    } else if (args.includes('--integration')) {
        await runner.runSpecificTests('integration');
    } else if (args.includes('--e2e')) {
        await runner.runSpecificTests('e2e');
    } else if (args.includes('--webhook')) {
        await runner.runSpecificTests('webhook');
    } else if (args.includes('--loyalty')) {
        await runner.runSpecificTests('loyalty');
    } else {
        // Default: run all tests
        await runner.runAllTests();
    }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Run the main function
if (require.main === module) {
    main().catch(error => {
        console.error('Test runner error:', error);
        process.exit(1);
    });
}

module.exports = TestRunner; 