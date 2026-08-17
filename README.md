# Teamflow
> Collaborate, manage projects, and reach new productivity peaks.

Teamflow is a cutting-edge team synchronization and task management application, equipped with premium tools like limitless speech recognition tasks, AI-generation pipelines, and dynamic analytics designed to push project delivery out from the terminal and onto the main stage. 

## 🚀 Features Highlights

- **Dynamic Workflows:** Kanban boards, customized labels, recurring scheduling, and deeply immersive filtering.
- **Smart Generation & AI:** Dictate tasks effortlessly via voice or prompt the system to establish intricate project sub-tasks automatically.
- **Premium Upgrades:** Out of the box integration with Stripe Checkout subscriptions securely gating the Pro features!
- **Modern UI:** Built on the robust Radix UI framework combined with Tailwind's extreme utility capabilities to ensure highly aesthetic dark/light layouts with real-time hydration transitions.

## 💻 Tech Stack
- **Framework:** [Next.js](https://nextjs.org/) (App Router Architecture)
- **Database:** Prisma ORM connected to PostgreSQL
- **Payments:** [Stripe](https://stripe.com) Integration Suite
- **Styling:** Vanilla TailwindCSS + Glassmorphism UX Overlays
- **Authentication:** `next-auth`

## 🛠 Required Installations
Duplicate `.env.example` over to an isolated `.env` configuration file to configure secrets.

*NextJS Setup:*
```bash
npm install
npm run dev
```

*For complete Stripe testing mechanisms, ensure:*
```text
STRIPE_SECRET_KEY="sk_test_..."
```
Is loaded natively onto your internal `.env`!
