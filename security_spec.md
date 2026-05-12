# Security Spec for TailorHer

## Data Invariants
1. A user profile (`/users/{uid}`) can only be created by the authenticated user with that UID.
2. An order (`/orders/{orderId}`) must have a valid `customerId` matching the creator's UID.
3. Access to an order is restricted to the customer who created it and users with the 'tailor' role.
4. Measurements (`/measurements/{id}`) belong to a specific customer and can only be read/written by that customer or a 'tailor'.
5. Services and Designs are publicly readable but only writable by 'tailors'.

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a user profile with a different UID than `request.auth.uid`.
2. **Role Escalation**: Attempt to update own role from 'customer' to 'tailor'.
3. **Ghost Write**: Attempt to create an order for another user by setting `customerId` to someone else's UID.
4. **Phantom Order**: Attempt to read orders belonging to another user.
5. **Admin Bypass**: Attempt to update an order's status to 'delivered' as a customer.
6. **Data Injection**: Attempt to set a 2MB string as a measurement label.
7. **Relational Sync Failure**: Creating an order for a non-existent service ID.
8. **PII Leak**: Authenticated user trying to list all user profiles and their emails.
9. **State Shortcut**: Moving an order status from 'pending' to 'delivered' directly.
10. **Shadow Field**: Adding `isVerified: true` to a user profile patch.
11. **Malicious ID**: Creating a document with ID `../../secrets`.
12. **Timestamp Fraud**: Setting `createdAt` to a future date from the client.

## Verification
Rules will enforce strict schema validation, immutability of owner fields, and role-based access.
