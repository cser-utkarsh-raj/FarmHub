# FarmHub

A production-oriented agricultural decision-support platform presented by `.dot`.

## Features

- Role selection (Farmer, Distributor, Buyer)
- Farmer onboarding with personal, land, and preference details
- Crop selection with search and category filtering
- Crop plan summary with planting/harvest dates and land area
- Price intelligence with current price, historical trends, and forecasts
- Profitability analysis with scenarios and cost breakdown
- Market comparison showing nearby markets with prices, distances, and net realization
- Buyer/distributor discovery with verification status and contact options
- Dashboard hub for workflow navigation

## Design

- Earthy and natural theme inspired by agriculture
- Primary color: #66BB6A (green)
- Mobile-first responsive design
- Accessible components with proper contrast and semantic HTML
- Built with React, TypeScript, and Tailwind CSS
- Uses shadcn/ui components

## Getting Started

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Build for production: `npm run build`

## API Contracts (for backend integration)

To work with real data, the following endpoints are needed:

- `GET /crops` - List of crops with categories and varieties
- `POST /onboarding/farmer` - Submit farmer profile data
- `GET /price-intelligence/:cropId` - Current price, historical data, forecast
- `GET /profitability/:cropId` - Cost breakdown and scenario analysis
- `GET /market-comparison/:cropId` - Nearby markets with pricing and logistics
- `GET /buyer-discovery/:cropId` - Nearby buyers with verification status
- `GET /dashboard/:farmerId` - User-specific dashboard data

## Notes

- All pages currently use mock data for demonstration
- Distributor and Buyer onboarding are placeholders (role-specific forms needed)
- Authentication is assumed to be handled separately
- State management would be implemented with React Query or similar in production