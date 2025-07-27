# PayPal Integration Setup Guide

This guide will help you set up PayPal payment integration for your web album application.

## Prerequisites

1. A PayPal Developer Account
2. PayPal App credentials (Client ID and Client Secret)

## Step 1: Create PayPal Developer Account

1. Go to [PayPal Developer](https://developer.paypal.com/)
2. Sign in with your PayPal account or create a new one
3. Navigate to "My Apps & Credentials"

## Step 2: Create a PayPal Application

1. Click "Create App"
2. Fill in the application details:
   - **App Name**: Your app name (e.g., "Web Album Store")
   - **Merchant**: Select your business account
   - **Features**: Check "Accept Payments"
   - **Products**: Select "Checkout"

3. Click "Create App"

## Step 3: Get Your Credentials

After creating the app, you'll see:
- **Client ID** (for both Sandbox and Live)
- **Client Secret** (for both Sandbox and Live)

## Step 4: Configure Environment Variables

Update your `.env` file with the PayPal credentials:

```env
# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id_here
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret_here
PAYPAL_ENVIRONMENT=sandbox
```

### For Production:
```env
# PayPal Configuration (Production)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_live_client_id_here
PAYPAL_CLIENT_SECRET=your_live_client_secret_here
PAYPAL_ENVIRONMENT=production
```

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the checkout page
3. Add items to your cart
4. Fill in the shipping information
5. Click the PayPal button to test the payment flow

## Features Included

### 1. PayPal Button Component
- Located at: `src/app/components/paypal/paypal-button.tsx`
- Handles PayPal SDK loading
- Creates and captures PayPal orders
- Integrates with your cart system

### 2. PayPal API Routes
- **Create Order**: `src/app/api/paypal/create-order/route.ts`
- **Capture Order**: `src/app/api/paypal/capture-order/route.ts`

### 3. Cart Integration
- Automatically clears cart after successful payment
- Supports both regular cart and AI art cart items
- Cart clearing API: `src/app/api/cart/clear/route.ts`

### 4. Order Management
- Creates orders in your database after successful PayPal payment
- Stores PayPal transaction details
- Sets order status to "processing" and payment status to "paid"

## Payment Flow

1. **User clicks PayPal button** → PayPal SDK loads
2. **Create Order** → API call to `/api/paypal/create-order`
3. **PayPal Checkout** → User completes payment on PayPal
4. **Capture Payment** → API call to `/api/paypal/capture-order`
5. **Save Order** → Order saved to database
6. **Clear Cart** → Cart items removed
7. **Redirect** → User redirected to success page

## Security Features

- Server-side order creation and capture
- PayPal access token management
- User authentication required
- Secure environment variable handling

## Supported Features

- ✅ One-time payments
- ✅ Multiple items in cart
- ✅ Shipping calculation
- ✅ Order tracking
- ✅ PayPal Pay Later (if enabled)
- ✅ Mobile responsive
- ✅ Error handling
- ✅ Cart clearing after payment

## Testing

### Sandbox Testing
Use PayPal's sandbox environment for testing:
- Test buyer accounts available in PayPal Developer Dashboard
- No real money transactions
- Full PayPal checkout experience

### Test Cards
PayPal provides test accounts for sandbox testing. You can create test buyer accounts in your PayPal Developer Dashboard.

## Troubleshooting

### Common Issues

1. **PayPal button not loading**
   - Check if `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set correctly
   - Verify the PayPal SDK script is loading

2. **Order creation fails**
   - Check PayPal credentials
   - Verify API endpoint accessibility
   - Check server logs for detailed errors

3. **Payment capture fails**
   - Ensure order was created successfully
   - Check PayPal order status
   - Verify capture API implementation

4. **Cart API returns 401 Unauthorized**
   - Ensure user is properly signed in
   - Check NextAuth session configuration
   - Verify authentication middleware is working
   - Try signing out and signing back in
   - Check browser cookies and session storage

5. **Empty cart on checkout page**
   - Verify cart items were added successfully
   - Check if user authentication is working
   - Ensure cart APIs are accessible
   - Check browser network tab for API errors

### Debug Mode
Enable debug logging by adding console.log statements in:
- PayPal button component
- API routes
- Order creation process

## Production Deployment

Before going live:

1. **Switch to Live Credentials**
   ```env
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_CLIENT_SECRET=your_live_client_secret
   PAYPAL_ENVIRONMENT=production
   ```

2. **Test with Real PayPal Account**
   - Use your actual PayPal account
   - Test small amount transactions
   - Verify order creation and fulfillment

3. **Enable Webhooks** (Optional)
   - Set up PayPal webhooks for order status updates
   - Handle payment disputes and refunds

## Support

For PayPal-specific issues:
- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal Developer Community](https://developer.paypal.com/community/)

For integration issues:
- Check the browser console for errors
- Review server logs
- Test API endpoints individually
