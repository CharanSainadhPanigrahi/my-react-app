# BhojanGo React + Vite

This project keeps the supplied BhojanGo storefront and its existing JavaScript behavior intact inside a React + Vite app. The original HTML is in `public/legacy.html`; the React entry hosts it so the four existing role areas, menu, 124 supplied images, cart, offers, checkout, tracking, and dashboards remain together.

## Modules

- **Customer:** browse and search/filter the menu, cart, offers, checkout, order tracking, and customer profile.
- **Manager:** restaurant partner signup/login, menu and order management.
- **Delivery partner:** signup/login, availability, assigned orders, GPS sharing, and delivery OTP confirmation.
- **Admin:** overview, customers, managers, riders, orders, stalls, and offers.

The original app stores accounts, sessions, carts, and orders in the browser's Local Storage. This preserves the requested behavior, but data is per browser/device and is not a shared multi-user database. Existing QR/COD payment flow remains the supplied demo flow; it does not charge a payment processor.

## Run locally

Use Node.js 20.19+ or 22.12+.

```powershell
npm.cmd install
npm.cmd run dev
```

The app starts in demo OTP mode. No Twilio account or `.env.local` credentials are needed. When you choose signup or login, the app displays a random 4-digit demo code on screen; enter that code to continue.

The demo code is generated for each attempt, so there is no single fixed OTP. This is for local demonstration only; it does not send an SMS or prove ownership of the entered phone number.

## Build and deploy

```powershell
npm.cmd run build
```

Import this folder into Vercel or deploy it with the Vercel CLI. The app will use the same on-screen demo OTP after deployment.

The included image files came from the supplied `images.zip`. The source HTML came from the pasted complete code; OTP is configured for the on-screen demo flow.
