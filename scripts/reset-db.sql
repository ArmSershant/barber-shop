-- DEV ONLY: wipe all application data (keeps the districts lookup).
-- Run: pnpm db:reset   (then: pnpm seed:test)
TRUNCATE TABLE
  "users",
  "user_roles",
  "refresh_tokens",
  "shops",
  "barbers",
  "services",
  "barber_services",
  "working_hours",
  "time_off",
  "breaks",
  "bookings",
  "booking_services",
  "reviews",
  "portfolio_images",
  "shop_photos",
  "notifications",
  "favorites",
  "plans",
  "subscriptions"
RESTART IDENTITY CASCADE;
