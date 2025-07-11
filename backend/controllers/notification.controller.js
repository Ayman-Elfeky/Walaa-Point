const Merchant = require("../models/merchant.model");

const updateNotificationsSettings = async (req, res) => {
    try {
        console.log('\nUpdating notification settings\n');
        console.log('\nRequest body:', JSON.stringify(req.body, null, 2), '\n');

        const settings = req.body;
        const merchantId = req.merchant._id;

        // Validate that settings object is provided
        if (!settings || Object.keys(settings).length === 0) {
            console.log('\nNo settings provided for update\n');
            return res.status(400).json({
                success: false,
                message: 'No notification settings provided for update'
            });
        }

        // Validate settings fields against the schema
        const validFields = ['earnNewPoints', 'earnNewCoupon', 'earnNewCouponForShare', 'birthday'];
        const invalidFields = Object.keys(settings).filter(field => !validFields.includes(field));

        if (invalidFields.length > 0) {
            console.log(`\nInvalid notification fields: ${invalidFields.join(', ')}\n`);
            return res.status(400).json({
                success: false,
                message: `Invalid notification fields: ${invalidFields.join(', ')}. Valid fields are: ${validFields.join(', ')}`
            });
        }

        // Validate that all provided values are boolean
        for (const [key, value] of Object.entries(settings)) {
            if (typeof value !== 'boolean') {
                console.log(`\nInvalid value type for ${key}: expected boolean, got ${typeof value}\n`);
                return res.status(400).json({
                    success: false,
                    message: `Invalid value for ${key}: expected boolean, got ${typeof value}`
                });
            }
        }

        // Build dot-notation object for deep merge (only update provided fields)
        const updateFields = {};
        for (const [key, value] of Object.entries(settings)) {
            updateFields[`notificationSettings.${key}`] = value;
        }

        console.log('\nUpdate fields:', JSON.stringify(updateFields, null, 2), '\n');

        // Update merchant with new notification settings using deep merge
        const updatedMerchant = await Merchant.findByIdAndUpdate(
            merchantId,
            { $set: updateFields },
            {
                new: true, // Return updated document
                runValidators: true // Run schema validators
            }
        );

        if (!updatedMerchant) {
            console.log('\nMerchant not found during update\n');
            return res.status(404).json({
                success: false,
                message: 'Merchant not found'
            });
        }

        console.log('\nNotification settings updated successfully\n');

        res.status(200).json({
            success: true,
            message: 'Notification settings updated successfully',
            notificationSettings: updatedMerchant.notificationSettings,
            updatedFields: Object.keys(settings) // Show which fields were updated
        });

    } catch (error) {
        console.error('\nError updating notification settings:', error, '\n');

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
        }

        // Handle cast errors (invalid data types)
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: `Invalid data type for field: ${error.path}`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Something went wrong while updating notification settings'
        });
    }
};

const getNotificationsSettings = async (req, res) => {
    try {
        console.log('\nFetching notification settings\n');

        const merchant = req.merchant;

        if (!merchant) {
            console.log('\nMerchant not found\n');
            return res.status(404).json({
                success: false,
                message: 'Merchant not found'
            });
        }

        const notificationSettings = merchant.notificationSettings || {};

        console.log('\nNotification settings fetched successfully\n');

        res.status(200).json({
            success: true,
            message: 'Notification settings fetched successfully',
            notificationSettings
        });
    } catch (error) {
        console.error('\nError fetching notification settings:', error, '\n');
        res.status(500).json({
            success: false,
            message: 'Something went wrong while fetching notification settings'
        });
    }
};

module.exports = {
    updateNotificationsSettings,
    getNotificationsSettings
};