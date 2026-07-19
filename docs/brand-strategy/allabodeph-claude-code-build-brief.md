# AllabodePH Website Build Brief For Claude Code

Build a professional real estate company website for:

**Allabode Realty and Appraisal Services**  
Tagline: **Real Estate | Leasing | Brokerage | Appraisal**  
Primary domain: **allabodeph.com**

The website should support:

- Real estate leasing
- Property selling and brokerage
- Property management
- Real estate appraisal
- Public property listings
- Admin dashboard for managing listings and inquiries

## 1. Website Goal

Create a professional website that helps Allabode:

- Build trust with property owners, tenants, buyers, sellers, and investors
- Showcase available properties for lease and sale
- Collect inquiries and viewing requests
- Let admins add, edit, publish, and archive listings
- Collect appraisal requests
- Collect property management leads
- Prepare for future owner and client portal features

The site should feel professional, trustworthy, clean, and modern. It should not look like a generic template or luxury-only real estate site.

## 2. Core Public Pages

### Home Page

Purpose: Explain Allabode and route users to the right service.

Sections:

- Hero section
- Main services
- Featured listings
- Why choose Allabode
- Property management preview
- Appraisal service preview
- Founder / licensed professional credibility
- Call to action

Hero headline:

> Complete Real Estate, Leasing, Property Management, and Appraisal Services

Hero subheadline:

> Work with a licensed Real Estate Broker and Appraiser for professional property leasing, selling, management, and valuation support in the Philippines.

Hero buttons:

- Find a Property
- List My Property
- Request Appraisal
- Get Property Management

### Listings Page

Purpose: Show all public listings.

Features:

- Listing grid
- Search
- Filters
- Sort options
- Listing cards

Filters:

- For rent
- For sale
- Short-term
- Long-term
- Bed space
- Location
- Price range
- Property type
- Bedrooms
- Bathrooms
- Furnished / semi-furnished / unfurnished
- Availability status

Listing card should show:

- Main photo
- Title
- Location
- Price
- Listing type
- Property type
- Bedrooms
- Bathrooms
- Floor area
- Status
- View details button

### Single Listing Page

Purpose: Show full details for one property.

Content:

- Photo gallery
- Listing title
- Price
- Location
- Listing type
- Property type
- Bedrooms
- Bathrooms
- Floor area
- Furnishing
- Parking
- Lease or sale terms
- Description
- Amenities
- Availability status
- Inquiry form
- Schedule viewing button

Inquiry form fields:

- Name
- Email
- Mobile / Viber / WhatsApp
- Message
- Preferred viewing date
- Preferred contact method

### Leasing Page

Purpose: Explain leasing services for owners and tenants.

Sections:

- Leasing intro
- Short-term leasing
- Long-term leasing
- Bed space
- Tenant screening
- Lease documentation
- Move-in coordination
- Owner reporting
- Rental listings preview
- CTA to list property
- CTA to find rental

Main headline:

> Leasing services for owners, tenants, and investors.

### Buy / Sell Page

Purpose: Explain brokerage and property selling services.

Sections:

- Selling services
- Buying assistance
- Pricing guidance
- Listing preparation
- Marketing support
- Buyer qualification
- Negotiation
- Documentation support
- Sale listings preview
- CTA to sell property
- CTA to inquire as buyer

Main headline:

> Buy and sell property with professional brokerage guidance.

### Property Management Page

Purpose: Sell recurring property management service.

Sections:

- Overview
- Why property owners need management
- What Allabode handles
- Package comparison
- Owner portal preview
- Inquiry form

Services:

- Property onboarding
- Rental pricing advice
- Listing and marketing
- Tenant screening
- Lease coordination
- Rent monitoring
- Maintenance coordination
- Move-in / move-out documentation
- Owner reports
- CRM / client access

Packages:

1. Basic Leasing Support
2. Standard Property Management
3. Full Property Management
4. Investor Portfolio Management

Main headline:

> Full-service property management with transparent owner access.

### Appraisal Page

Purpose: Explain licensed appraisal services.

Sections:

- Appraisal overview
- Residential appraisal
- Commercial appraisal
- Land appraisal
- Estate / legal appraisal
- Investment valuation
- Pre-sale valuation
- Appraisal request form
- Disclaimer about formal appraisal vs general market opinion

Main headline:

> Licensed real estate appraisal for informed property decisions.

Appraisal request form fields:

- Name
- Email
- Mobile
- Property location
- Property type
- Purpose of appraisal
- Preferred inspection date
- Message
- Document upload, if possible

### About Page

Purpose: Build trust.

Sections:

- Company story
- Mission
- Services overview
- Founder credentials
- Licensed Real Estate Broker and Appraiser credibility
- Relationship to Properties by Chel
- Values

Suggested copy:

> Allabode Realty and Appraisal Services was created to provide professional, transparent, and complete property support for clients who need more than a simple listing. We combine brokerage, leasing, property management, and appraisal expertise to help clients make better property decisions.

### Contact Page

Purpose: Collect general inquiries.

Fields:

- Name
- Email
- Mobile / Viber / WhatsApp
- I need help with:
  - Leasing my property
  - Finding a rental
  - Selling a property
  - Buying a property
  - Property management
  - Appraisal
  - Consultation
- Property location
- Message

Also show:

- Email
- Phone
- Facebook / Messenger
- WhatsApp / Viber
- Service area
- Google Maps placeholder

## 3. Admin Dashboard

Build a private dashboard for managing website data.

Dashboard route:

`/admin`

Require login before access.

## 4. Admin Dashboard Sections

### Dashboard Overview

Show summary cards:

- Total listings
- Published listings
- Draft listings
- Available listings
- Reserved listings
- Leased listings
- Sold listings
- New inquiries
- New viewing requests
- New appraisal requests
- New property management leads

### Listings Manager

Admin should be able to:

- Add new listing
- Edit listing
- Delete listing or archive listing
- Publish / unpublish listing
- Mark listing as featured
- Upload photos
- Reorder photos
- Set listing status
- View inquiries connected to each listing

Listing statuses:

- Draft
- Published
- Available
- Reserved
- Leased
- Sold
- Archived

Listing types:

- For lease
- For sale
- Short-term
- Long-term
- Bed space

Property types:

- Condo
- House and lot
- Apartment
- Townhouse
- Dorm / bed space
- Commercial
- Office
- Lot
- Warehouse
- Other

Listing fields:

- Title
- Slug
- Description
- Location
- City
- Province
- Exact address, private/admin only
- Price
- Price label, example: per month, total contract price
- Listing type
- Property type
- Status
- Bedrooms
- Bathrooms
- Floor area
- Lot area
- Parking
- Furnishing
- Amenities
- Lease terms
- Sale terms
- Availability date
- Featured toggle
- Owner name, private/admin only
- Owner contact, private/admin only
- Internal notes
- Photos

### Inquiry Manager

Admin should see inquiries from:

- Listing inquiries
- Viewing requests
- General contact form
- Appraisal requests
- Property management inquiries

Inquiry fields:

- Name
- Email
- Mobile
- Inquiry type
- Related listing, if any
- Message
- Preferred viewing date
- Preferred contact method
- Status
- Internal notes
- Created date

Inquiry statuses:

- New
- Contacted
- Scheduled
- In progress
- Closed
- Spam

Admin actions:

- Update status
- Add internal note
- Assign inquiry to listing
- Mark as closed

### Appraisal Requests

Show submitted appraisal requests.

Fields:

- Client name
- Contact details
- Property location
- Property type
- Purpose of appraisal
- Preferred inspection date
- Uploaded documents
- Status
- Internal notes

Statuses:

- New
- Reviewing
- Scheduled
- Inspected
- Report in progress
- Completed
- Closed

### Property Management Leads

Show property management inquiries.

Fields:

- Owner name
- Contact details
- Property location
- Number of units
- Property type
- Current occupancy status
- Needed service
- Message
- Status
- Internal notes

Statuses:

- New
- Contacted
- Proposal sent
- Onboarding
- Active
- Closed

## 5. Data Models

Create database models/tables for:

### User

- id
- name
- email
- password hash or auth provider id
- role
- createdAt
- updatedAt

Roles:

- admin
- staff

### Listing

- id
- title
- slug
- description
- location
- city
- province
- privateAddress
- price
- priceLabel
- listingCategory
- leaseType
- propertyType
- status
- bedrooms
- bathrooms
- floorArea
- lotArea
- parking
- furnishing
- amenities
- leaseTerms
- saleTerms
- availabilityDate
- isFeatured
- ownerName
- ownerContact
- internalNotes
- createdAt
- updatedAt

### ListingImage

- id
- listingId
- url
- altText
- sortOrder
- createdAt

### Inquiry

- id
- type
- listingId
- name
- email
- phone
- message
- preferredViewingDate
- preferredContactMethod
- status
- internalNotes
- createdAt
- updatedAt

### AppraisalRequest

- id
- name
- email
- phone
- propertyLocation
- propertyType
- appraisalPurpose
- preferredInspectionDate
- message
- status
- internalNotes
- createdAt
- updatedAt

### PropertyManagementLead

- id
- ownerName
- email
- phone
- propertyLocation
- propertyType
- numberOfUnits
- occupancyStatus
- neededService
- message
- status
- internalNotes
- createdAt
- updatedAt

## 6. Public Functionality

Public users should be able to:

- Browse listings
- Filter listings
- View listing detail pages
- Send inquiry on a listing
- Request a viewing
- Submit appraisal request
- Submit property management inquiry
- Submit contact form
- Submit "List my property" form

## 7. Admin Functionality

Admins should be able to:

- Log in
- Log out
- View dashboard overview
- Add listing
- Edit listing
- Upload listing images
- Publish / unpublish listing
- Feature / unfeature listing
- Archive listing
- View inquiries
- Update inquiry status
- Add internal notes
- View appraisal requests
- Update appraisal request status
- View property management leads
- Update lead status

## 8. List My Property Form

Create a public owner form.

Fields:

- Owner name
- Email
- Mobile
- Property location
- Property type
- Intended service:
  - Lease my property
  - Sell my property
  - Property management
  - Appraisal
- Bedrooms
- Bathrooms
- Floor area
- Expected price or rent
- Property description
- Upload photos, optional
- Message

This should create an inquiry or property management lead in the dashboard.

## 9. Recommended First Version Scope

Build first:

- Public pages
- Listings page
- Listing detail page
- Admin login
- Admin listing manager
- Inquiry forms
- Inquiry dashboard
- Appraisal request form
- Property management lead form

Do not build full owner portal yet.

Save for later:

- Owner login
- Tenant login
- Maintenance requests
- Rent tracking
- Document vault
- Appraisal report tracking
- CRM automation

## 10. Design Direction

Style:

- Professional
- Clean
- Trustworthy
- Modern but not too flashy
- Suitable for Philippine real estate clients

Avoid:

- Overly luxury-only design
- Too many animations
- Generic stock-heavy look
- Confusing service structure
- Making it look like only a property marketplace

Suggested colors:

- Deep navy
- White
- Soft gray
- Warm gold or muted green accent

Suggested typography:

- Clean sans-serif
- Strong headings
- Readable body text

## 11. Navigation

Main navigation:

- Home
- Listings
- Leasing
- Buy / Sell
- Property Management
- Appraisal
- About
- Contact

Primary button:

> List Your Property

Secondary button:

> Request Appraisal

Admin route should not be shown in main public navigation unless needed.

## 12. SEO Pages And Keywords

Use SEO-friendly titles and descriptions.

Important keywords:

- real estate broker Philippines
- real estate appraisal Philippines
- property management Philippines
- condo leasing Philippines
- property for rent Philippines
- property for sale Philippines
- licensed real estate broker
- licensed real estate appraiser
- leasing services Philippines
- appraisal services Philippines

Each service page should have:

- SEO title
- Meta description
- H1
- Clear service copy
- FAQ section

## 13. FAQ Sections

### Leasing FAQ

- What types of leasing do you handle?
- Can you help screen tenants?
- Do you handle short-term leasing?
- Can owners list their property with Allabode?

### Property Management FAQ

- What does property management include?
- Do owners get reports?
- Can you manage units for OFWs?
- Do you handle maintenance coordination?

### Appraisal FAQ

- What is a real estate appraisal?
- When do I need an appraisal?
- What documents are needed?
- Is a market estimate the same as a formal appraisal?

### Buy / Sell FAQ

- Can you help price my property?
- Do you represent sellers?
- Can buyers request assistance?
- What documents are usually needed?

## 14. Future Phase: Client Portal

Prepare architecture so future portal can be added.

Future owner portal:

- Owner login
- Property profile
- Tenant status
- Inquiry history
- Lease status
- Maintenance notes
- Documents
- Monthly reports

Future tenant portal:

- Tenant login
- Maintenance request
- Lease info
- Payment reminders
- Messages

Future appraisal portal:

- Appraisal request tracking
- Document upload
- Inspection schedule
- Report status

## 15. Suggested Build Order

1. Set up project
2. Create design system
3. Create public layout and navigation
4. Build homepage
5. Build service pages
6. Build listings database
7. Build listings page
8. Build listing detail page
9. Build inquiry forms
10. Build admin authentication
11. Build admin dashboard layout
12. Build listing manager
13. Build inquiry manager
14. Build appraisal request manager
15. Build property management lead manager
16. Add SEO metadata
17. Add responsive design
18. Test forms
19. Test admin listing workflow
20. Deploy

## 16. Acceptance Criteria

Website is ready when:

- Public users can browse listings
- Public users can submit inquiries
- Public users can request appraisal
- Public users can inquire about property management
- Admin can log in
- Admin can add/edit/publish/archive listings
- Admin can upload listing photos
- Admin can view and update inquiries
- Featured listings appear on homepage
- Rental listings appear on leasing-related areas
- Sale listings appear on buy/sell-related areas
- Site works on mobile and desktop
- SEO titles and descriptions exist
- Forms have success and error states

## 17. Final Instruction For Claude Code

Build this as a scalable production-ready website, but keep the first version focused. Prioritize:

1. Clear public service pages
2. Listing management
3. Lead capture
4. Admin dashboard
5. Clean responsive design

Do not overbuild the full client portal in version 1. Prepare the structure for it, but focus first on listings, inquiries, appraisal requests, and property management leads.
