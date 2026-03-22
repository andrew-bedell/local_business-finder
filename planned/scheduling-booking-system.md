# Scheduling & Booking System

## Summary
Full scheduling pipeline for business owners: manage staff, services, and schedules from the customer portal. End-customers book appointments or classes through a public booking page.

## Business Models
- **Appointment-based** (barber, salon, spa) — services with duration, staff schedules, time slots
- **Class-based** (gym, yoga studio) — recurring group classes with capacity limits, membership plans

## Phases

### Phase 1: Foundation (implemented)
- Database: 9 new tables (staff_members, staff_schedules, staff_exceptions, booking_services, booking_slots, booking_clients, bookings, membership_plans, client_memberships) + 2 columns on businesses
- API: `api/scheduling/config.js`, `api/scheduling/staff.js`, `api/scheduling/services.js`
- Customer portal: "Reservas" section with sub-tabs (Config, Personal, Servicios)
- Config: scheduling type selection, timezone, booking window, cancellation hours
- Staff CRUD: add/edit/delete staff members with name, phone, email, specialties, bio
- Services CRUD: add/edit/delete services with name, duration, price, currency, category, capacity, color

### Phase 2: Staff Schedules & Slot Generation
- Weekly schedule grid per staff member (day + time range)
- Staff exception management (days off, holidays, custom hours)
- Auto-generate booking slots from schedule + service duration
- Slot management UI (view/cancel generated slots)

### Phase 3: Public Booking Page & OTP Auth
- `booking/index.html` — public booking page per business
- Phone + OTP authentication via WhatsApp bridge
- WhatsApp bridge HTTP API (Express server on VPS)
- `api/booking/auth.js` — OTP generation, verification, JWT issuance
- `api/booking/slots.js` — available slot listing for end-customers
- `api/booking/reserve.js` — create/cancel bookings

### Phase 4: Admin Booking Management & Calendar
- Day/week calendar view in customer portal
- Booking status management (confirm, cancel, complete, no-show)
- Upcoming bookings list with filters
- WhatsApp reminders via bridge

### Phase 5: Memberships & Website Integration
- Membership plan management in customer portal
- Client membership assignment and tracking
- Class booking enforcement (check membership, class limits)
- "Reservar" FAB button on published websites

## Key Files
- `database/migrations/011-scheduling-system.sql` — migration
- `database/schema.sql` — tables 26-34
- `api/scheduling/config.js` — scheduling config GET/PATCH
- `api/scheduling/staff.js` — staff CRUD
- `api/scheduling/services.js` — services CRUD
- `customer/index.html` — Reservas section HTML
- `customer/app.js` — scheduling section logic + i18n
- `customer/styles.css` — scheduling component styles

## Dependencies
- Supabase (database, auth)
- WhatsApp bridge (Phase 3, for OTP delivery)
- Customer portal auth (existing JWT pattern)
