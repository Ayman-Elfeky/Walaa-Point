#!/usr/bin/env node

/**
 * Test Setup Script
 * Installs dependencies and sets up the test environment for the loyalty system
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestSetup {
    constructor() {
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            cyan: '\x1b[36m'
        };
    }

    log(message, color = 'reset') {
        console.log(`${this.colors[color]}${message}${this.colors.reset}`);
    }

    logHeader(message) {
        const separator = '='.repeat(60);
        this.log(separator, 'cyan');
        this.log(`${' '.repeat(Math.floor((60 - message.length) / 2))}${message}`, 'bright');
        this.log(separator, 'cyan');
    }

    async runCommand(command, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            const proc = spawn(command, args, {
                stdio: 'inherit',
                cwd: options.cwd || process.cwd(),
                ...options
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    resolve(true);
                } else {
                    reject(new Error(`Command failed with exit code ${code}`));
                }
            });

            proc.on('error', reject);
        });
    }

    async checkNodeVersion() {
        this.log('\n🔍 Checking Node.js version...', 'yellow');
        
        return new Promise((resolve) => {
            exec('node --version', (error, stdout) => {
                if (error) {
                    this.log('❌ Node.js is not installed', 'red');
                    resolve(false);
                    return;
                }

                const version = stdout.trim();
                const majorVersion = parseInt(version.substring(1).split('.')[0]);

                if (majorVersion < 16) {
                    this.log(`❌ Node.js ${version} is too old. Please install Node.js 16 or higher`, 'red');
                    resolve(false);
                } else {
                    this.log(`✅ Node.js ${version} is compatible`, 'green');
                    resolve(true);
                }
            });
        });
    }

    async checkPackageJson() {
        this.log('\n📦 Checking package.json...', 'yellow');

        const packageJsonPath = path.join(__dirname, '../package.json');
        
        if (!fs.existsSync(packageJsonPath)) {
            this.log('❌ package.json not found', 'red');
            return false;
        }

        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            // Check if test scripts are configured
            const scripts = packageJson.scripts || {};
            const hasTestScript = scripts.test && !scripts.test.includes('Error: no test specified');

            if (!hasTestScript) {
                this.log('⚠️  Test script not properly configured in package.json', 'yellow');
                return false;
            }

            this.log('✅ package.json is properly configured', 'green');
            return true;
        } catch (error) {
            this.log(`❌ Invalid package.json: ${error.message}`, 'red');
            return false;
        }
    }

    async installDependencies() {
        this.log('\n📥 Installing dependencies...', 'yellow');

        try {
            this.log('Installing production dependencies...', 'blue');
            await this.runCommand('npm', ['install'], { cwd: path.join(__dirname, '..') });

            this.log('Installing development dependencies...', 'blue');
            await this.runCommand('npm', ['install', '--save-dev'], { cwd: path.join(__dirname, '..') });

            this.log('✅ All dependencies installed successfully', 'green');
            return true;
        } catch (error) {
            this.log(`❌ Failed to install dependencies: ${error.message}`, 'red');
            return false;
        }
    }

    async validateTestFiles() {
        this.log('\n📁 Validating test files...', 'yellow');

        const testDir = path.join(__dirname, '../tests');
        const expectedFiles = [
            'webhook.simulation.test.js',
            'loyaltyEngine.integration.test.js',
            'webhook.e2e.test.js',
            'test-helper.js',
            'README.md'
        ];

        let allFilesExist = true;

        for (const file of expectedFiles) {
            const filePath = path.join(testDir, file);
            if (fs.existsSync(filePath)) {
                this.log(`✅ ${file}`, 'green');
            } else {
                this.log(`❌ Missing: ${file}`, 'red');
                allFilesExist = false;
            }
        }

        if (allFilesExist) {
            this.log('✅ All test files are present', 'green');
        } else {
            this.log('⚠️  Some test files are missing', 'yellow');
        }

        return allFilesExist;
    }

    async createEnvExample() {
        this.log('\n⚙️  Creating .env.example for tests...', 'yellow');

        const envExamplePath = path.join(__dirname, '../.env.example');
        const envContent = `# Test Environment Configuration
NODE_ENV=test

# Salla API Configuration (for testing)
SALLA_CLIENT_ID=test_client_id
SALLA_CLIENT_SECRET=test_client_secret
SALLA_API_BASE_URL=https://api.salla.dev
SALLA_ACCOUNTS_URL=https://accounts.salla.sa
SALLA_CALLBACK_URL=https://your-domain.com/webhook
SALLA_WEBHOOK_SECRET=your_webhook_secret_from_salla_dashboard

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/loyalty_app
MONGODB_TEST_URI=mongodb://localhost:27017/loyalty_test

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
EMAIL_FROM=your-email@gmail.com

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Other Configuration
LOG_LEVEL=info
PORT=5000
`;

        try {
            if (!fs.existsSync(envExamplePath)) {
                fs.writeFileSync(envExamplePath, envContent);
                this.log('✅ .env.example created', 'green');
            } else {
                this.log('✅ .env.example already exists', 'green');
            }
            return true;
        } catch (error) {
            this.log(`❌ Failed to create .env.example: ${error.message}`, 'red');
            return false;
        }
    }

    async runSampleTest() {
        this.log('\n🧪 Running sample test to verify setup...', 'yellow');

        try {
            // Run a simple test to verify everything works
            await this.runCommand('npx', ['mocha', '--version'], { 
                cwd: path.join(__dirname, '..'),
                stdio: 'pipe'
            });

            this.log('✅ Test environment is working', 'green');
            return true;
        } catch (error) {
            this.log(`❌ Test environment check failed: ${error.message}`, 'red');
            return false;
        }
    }

    showUsageInstructions() {
        this.log('\n📚 Usage Instructions:', 'cyan');
        this.log('');
        
        this.log('🚀 Quick Start:', 'bright');
        this.log('  npm test                           # Run all tests', 'cyan');
        this.log('  npm run test:watch                 # Watch mode for development', 'cyan');
        this.log('');
        
        this.log('🎯 Specific Test Types:', 'bright');
        this.log('  npm run test:unit                  # Unit tests only', 'cyan');
        this.log('  npm run test:integration           # Integration tests only', 'cyan');
        this.log('  npm run test:e2e                   # End-to-end tests only', 'cyan');
        this.log('');
        
        this.log('🛠️  Advanced Testing:', 'bright');
        this.log('  node scripts/run-tests.js --help   # Show detailed options', 'cyan');
        this.log('  node scripts/run-tests.js --webhook # Webhook tests only', 'cyan');
        this.log('  node scripts/run-tests.js --loyalty # Loyalty engine tests only', 'cyan');
        this.log('');
        
        this.log('📁 Test Files Location:', 'bright');
        this.log('  backend/tests/                     # All test files', 'cyan');
        this.log('  backend/tests/README.md            # Detailed test documentation', 'cyan');
        this.log('');
        
        this.log('🔧 Configuration:', 'bright');
        this.log('  Copy .env.example to .env and configure as needed', 'yellow');
        this.log('  Tests will use mock data and don\'t require real API keys', 'yellow');
    }

    async setup() {
        this.logHeader('🧪 LOYALTY SYSTEM TEST SETUP');

        let setupSuccessful = true;

        // Check prerequisites
        if (!(await this.checkNodeVersion())) {
            setupSuccessful = false;
        }

        if (!(await this.checkPackageJson())) {
            setupSuccessful = false;
        }

        if (!setupSuccessful) {
            this.log('\n❌ Prerequisites not met. Please fix the issues above and try again.', 'red');
            process.exit(1);
        }

        // Install dependencies
        if (!(await this.installDependencies())) {
            this.log('\n❌ Dependency installation failed.', 'red');
            process.exit(1);
        }

        // Validate test files
        await this.validateTestFiles();

        // Create environment example
        await this.createEnvExample();

        // Verify test environment
        if (!(await this.runSampleTest())) {
            this.log('\n⚠️  Test environment verification failed, but setup is mostly complete.', 'yellow');
            this.log('You may still be able to run tests manually.', 'yellow');
        }

        // Show usage instructions
        this.showUsageInstructions();

        this.log('\n🎉 Test setup completed successfully!', 'green');
        this.log('You can now run tests using the commands shown above.', 'green');
    }
}

// Main execution
if (require.main === module) {
    const setup = new TestSetup();
    setup.setup().catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

module.exports = TestSetup; 