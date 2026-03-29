# 🌱 PropagatePro

**Smart Plant Propagation Tracking for Home Propagators & Small Businesses**

PropagatePro is a production-ready, full-stack application for tracking plant propagation, inventory, time/workflow management, and automation of grow lights and watering systems.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Sample Data](#-sample-data)
- [Sample Workflow](#-sample-workflow)
- [Smart Failure Detection](#-smart-failure-detection)
- [Automation System](#-automation-system)
- [Project Structure](#-project-structure)

---

## ✨ Features

### Core Features
- **📦 Inventory Management** — Track mother plants, individual cuttings with unique IDs, species, propagation methods, and locations
- **⏱️ Time & Workflow Tracking** — Start/stop timer, log tasks, daily/weekly summaries with time per plant type and task
- **🌿 Propagation Tracking** — Full lifecycle tracking: Cutting → Rooting → Rooted → Potted → Sold with automatic stage timing
- **💰 Business Features** — Cost tracking, profit margins, batch success rates, supply management
- **📊 Dashboard** — Real-time overview of inventory, active propagations, success rates, time worked, and revenue

### Smart Features
- **🔍 Failure Detection** — Automatic health assessment based on species-specific rooting timelines with color-coded indicators (Green/Yellow/Orange/Red)
- **🤖 Automation** — Grow light scheduling, watering automation, smart mode that adjusts based on plant health
- **📱 Device Integration** — API layer for smart plugs (Kasa, TP-Link), Arduino, Raspberry Pi, ESP32

### Nice-to-Have Features
- **🌙 Dark Mode** — Full dark mode support
- **📱 Mobile-First** — Responsive design optimized for phone use
- **📤 CSV Export** — Export business analytics data
- **🔔 Notifications** — In-app alerts for water changes, root checks, and at-risk cuttings

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, Lucide React Icons |
| **Backend** | Next.js API Routes (REST) |
| **Database** | SQLite via Prisma ORM 7 |
| **Auth** | JWT (httpOnly cookies), bcryptjs |
| **Charts** | Recharts |
| **Date Handling** | date-fns |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ (recommended: 20+)
- **npm** 9+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/carlsonriley81/PropagatePro.git
cd PropagatePro

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create .env file with:
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="your-secret-key-change-in-production"

# 4. Generate Prisma client and run migrations
npx prisma migrate dev

# 5. Seed the database with sample data
npx tsx prisma/seed.ts

# 6. Start the development server
npm run dev
```

### Access the App
- Open **http://localhost:3000** in your browser
- **Demo Login:** `demo@propagatepro.com` / `password123`

### Production Build
```bash
npm run build
npm start
```

---

## 🗄️ Database Schema

### Entity Relationship

```
User
├── Plant (Mother Plants)
│   └── Cutting (Individual Cuttings)
│       ├── Task
│       ├── TimeLog
│       └── Sale
├── Batch
│   └── Cutting[]
├── Supply
├── Device
│   ├── LightSchedule
│   └── WaterSchedule
├── RootingRule
└── Notification
```

### Tables

| Table | Description |
|-------|------------|
| **User** | App users with email/password auth |
| **Plant** | Mother plants with species, location, health |
| **Cutting** | Individual cuttings with full lifecycle tracking |
| **Batch** | Groups of cuttings for batch processing |
| **Task** | Completed tasks (cutting, planting, water changes) |
| **TimeLog** | Time tracking with start/stop timer |
| **Sale** | Sales records with profit calculation |
| **Supply** | Supplies inventory and cost tracking |
| **RootingRule** | Custom rooting time expectations per species |
| **Device** | Connected automation devices |
| **LightSchedule** | Grow light on/off schedules |
| **WaterSchedule** | Watering interval schedules |
| **Notification** | In-app alerts and reminders |

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Plants (Mother Plants)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plants` | List plants (filter: search, species) |
| POST | `/api/plants` | Create plant |
| GET | `/api/plants/:id` | Get plant details |
| PUT | `/api/plants/:id` | Update plant |
| DELETE | `/api/plants/:id` | Delete plant |

### Cuttings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cuttings` | List cuttings (filter: species, rootingStatus, healthStatus, batchId) |
| POST | `/api/cuttings` | Create cutting |
| GET | `/api/cuttings/:id` | Get cutting details |
| PUT | `/api/cuttings/:id` | Update cutting (auto-sets dates on status change) |
| DELETE | `/api/cuttings/:id` | Delete cutting |

### Batches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/batches` | List batches with cutting counts |
| POST | `/api/batches` | Create batch |
| GET | `/api/batches/:id` | Get batch with success rate |
| PUT | `/api/batches/:id` | Update batch |
| DELETE | `/api/batches/:id` | Delete batch |

### Tasks & Time Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (filter by date range) |
| POST | `/api/tasks` | Log a task |
| GET | `/api/timelogs` | List time logs |
| POST | `/api/timelogs` | Start timer |
| PUT | `/api/timelogs/:id` | Stop timer |
| DELETE | `/api/timelogs/:id` | Delete time log |

### Sales & Supplies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales` | List sales |
| POST | `/api/sales` | Record sale |
| GET | `/api/supplies` | List supplies |
| POST | `/api/supplies` | Add supply |
| PUT | `/api/supplies/:id` | Update supply |
| DELETE | `/api/supplies/:id` | Delete supply |

### Automation & Devices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/devices` | List devices |
| POST | `/api/devices` | Add device |
| PUT | `/api/devices/:id` | Update device |
| DELETE | `/api/devices/:id` | Delete device |
| POST | `/api/devices/light/on` | Turn light on |
| POST | `/api/devices/light/off` | Turn light off |
| POST | `/api/devices/water/pump` | Activate water pump |
| GET | `/api/automation/schedules` | List schedules |
| POST | `/api/automation/schedules` | Create schedule |

### Dashboard & Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get dashboard statistics |
| POST | `/api/dashboard/health-check` | Run health check on all cuttings |
| GET | `/api/rooting-rules` | Get rooting rules |
| POST | `/api/rooting-rules` | Create/update rooting rule |
| GET | `/api/notifications` | List notifications |
| PUT | `/api/notifications` | Mark notification as read |

---

## 🌱 Sample Data

The seed data includes:

### Plants
- **Monstera adansonii** — Swiss Cheese Vine mother plant (Shelf A)
- **Philodendron hederaceum** — Heartleaf Philodendron mother plant (Greenhouse Bay 1)
- **Peperomia obtusifolia** — Baby Rubber Plant mother plant (Tray B)

### Cuttings in Various Stages
| Species | Status | Health | Method |
|---------|--------|--------|--------|
| Monstera adansonii | Rooting | Healthy | Water |
| Monstera adansonii | Rooted | Healthy | Soil |
| Monstera adansonii | Not Started | Healthy | Perlite |
| Philodendron hederaceum | Rooting | Healthy | Water |
| Philodendron hederaceum | Transplanted | Healthy | Soil |
| Philodendron hederaceum | Sold | Healthy | Water |
| Peperomia obtusifolia | Rooting | Delayed | Water |
| Peperomia obtusifolia | Dead | Failed | Soil |

### Supplies
- Perlite (5 bags, $6.99/bag)
- Rooting Hormone (2 bottles, $8.99/bottle)
- Small Plastic Pots (50 pieces, $0.50/piece)
- Premium Potting Soil (3 bags, $12.99/bag)

---

## 🔄 Sample Workflow: Cutting → Rooting → Sale

```
1. CREATE CUTTING
   POST /api/cuttings
   { species: "Monstera adansonii", propagationMethod: "water", nodeCount: 2 }

2. START ROOTING
   PUT /api/cuttings/:id
   { rootingStatus: "rooting" }
   → System starts tracking rooting time
   → Health assessment: "Healthy" (green)

3. MONITOR (Day 7-21)
   GET /api/dashboard
   → Shows cutting health status
   → Auto-alerts if delayed/at_risk

4. MARK AS ROOTED
   PUT /api/cuttings/:id
   { rootingStatus: "rooted" }
   → dateRooted automatically set

5. TRANSPLANT
   PUT /api/cuttings/:id
   { rootingStatus: "transplanted" }
   → dateTransplanted automatically set

6. SELL
   POST /api/sales
   { cuttingId: "...", salePrice: 15.00, costBasis: 2.50 }
   → profit automatically calculated: $12.50
   → Cutting status updated to "sold"
```

---

## 🔍 Smart Failure Detection

### How It Works
Each cutting is automatically assessed based on:
- **Species-specific rooting timelines** (customizable per user)
- **Propagation method** (water, soil, perlite)
- **Time elapsed** since cutting date

### Health Status Levels

| Status | Color | Trigger | Action Suggested |
|--------|-------|---------|-----------------|
| **Healthy** | 🟢 Green | Within normal timeframe | Continue current care |
| **Delayed** | 🟡 Yellow | Exceeding expected time by 25% | Refresh water, check light |
| **At Risk** | 🟠 Orange | Exceeding expected time by 50% | Check for rot, refresh medium |
| **Likely Failed** | 🔴 Red | Exceeding expected time by 75%+ | Recut node, check for decay |

### Default Rooting Windows

| Species | Water | Soil/Perlite |
|---------|-------|-------------|
| Monstera adansonii | 7–21 days | 14–30 days |
| Philodendron hederaceum | 5–14 days | 10–25 days |
| Peperomia obtusifolia | 14–30 days | 21–45 days |

### Running Health Checks
- **Manual:** Click "Run Health Check" on the dashboard
- **API:** POST `/api/dashboard/health-check`
- Updates all cutting health statuses and creates notifications for status changes

---

## 🤖 Automation System

### Grow Light Control
- Schedule lights per zone (e.g., Shelf A, Greenhouse Bay 1)
- Default: 12-14 hours ON per day
- Manual override always available
- Smart mode adjusts for stressed cuttings

### Watering Automation
- Track last watered date per cutting/tray
- Configurable watering intervals
- Alerts for overdue watering
- Smart suggestions based on health status

### Device Integration API
```
POST /api/devices/light/on   → { deviceId: "..." }
POST /api/devices/light/off  → { deviceId: "..." }
POST /api/devices/water/pump → { deviceId: "...", zone: "..." }
```

### Supported Devices
- Kasa Smart Plugs
- TP-Link WiFi devices
- Arduino / Raspberry Pi / ESP32 (via API)

### Automation Modes
1. **Manual** — Full user control
2. **Scheduled** — Fixed timer schedules
3. **Smart** — Auto-adjusts based on plant health, rooting stage, and failure risk

---

## 📁 Project Structure

```
PropagatePro/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Sample data seeder
│   └── migrations/            # Database migrations
├── src/
│   ├── app/
│   │   ├── globals.css        # Global styles + dark mode
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   ├── (auth)/
│   │   │   ├── login/         # Login page
│   │   │   └── register/      # Register page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx     # Dashboard sidebar layout
│   │   │   ├── page.tsx       # Dashboard overview
│   │   │   ├── inventory/     # Mother plants management
│   │   │   ├── cuttings/      # Cuttings lifecycle tracking
│   │   │   ├── batches/       # Batch management
│   │   │   ├── tasks/         # Timer & task logging
│   │   │   ├── sales/         # Sales tracking
│   │   │   ├── business/      # Analytics & profits
│   │   │   ├── automation/    # Device & schedule control
│   │   │   ├── supplies/      # Supply cost tracking
│   │   │   ├── notifications/ # Alerts & reminders
│   │   │   └── settings/      # Rules & preferences
│   │   └── api/
│   │       ├── auth/          # Authentication routes
│   │       ├── plants/        # Plant CRUD
│   │       ├── cuttings/      # Cutting CRUD
│   │       ├── batches/       # Batch CRUD
│   │       ├── tasks/         # Task logging
│   │       ├── timelogs/      # Timer start/stop
│   │       ├── sales/         # Sales recording
│   │       ├── supplies/      # Supply tracking
│   │       ├── devices/       # Device control
│   │       ├── automation/    # Schedule management
│   │       ├── dashboard/     # Stats & health check
│   │       ├── rooting-rules/ # Custom rules
│   │       └── notifications/ # Alert management
│   ├── context/
│   │   └── AuthContext.tsx     # Authentication context
│   ├── lib/
│   │   ├── prisma.ts          # Database client
│   │   ├── auth.ts            # JWT authentication
│   │   └── rooting-rules.ts   # Failure detection engine
│   └── generated/
│       └── prisma/            # Generated Prisma client
├── .env                       # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🌐 Plant Dataset Reference

This application references the [Plant Dataset on Hugging Face](https://huggingface.co/datasets/jibrand/Plant-dataset/viewer/default/train?row=50) for species information. The default rooting rules are based on common propagation timelines for popular houseplant species.

---

## 📄 License

MIT License — Free for personal and commercial use.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
