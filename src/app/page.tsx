import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Clock,
  BookOpen,
  Zap,
  Lock,
  CheckCircle,
  ArrowRight,
  Users,
  AlertTriangle,
  Key,
  Building,
} from "lucide-react";

const features = [
  {
    icon: <Clock className="h-6 w-6 text-blue-400" />,
    title: "Just-in-Time Access",
    description:
      "Grant temporary, time-limited access that automatically expires. No more standing privileges — access is provisioned exactly when needed and revoked the moment it expires.",
  },
  {
    icon: <Zap className="h-6 w-6 text-violet-400" />,
    title: "Automated Workflows",
    description:
      "Define approval policies that auto-approve low-risk requests, route sensitive requests to designated approvers, and enforce MFA before granting elevated access.",
  },
  {
    icon: <Shield className="h-6 w-6 text-emerald-400" />,
    title: "Microsoft 365 Native",
    description:
      "Deep integration with Entra ID — manage directory roles, M365 group membership, and Azure resource assignments via Microsoft Graph API.",
  },
  {
    icon: <BookOpen className="h-6 w-6 text-amber-400" />,
    title: "Complete Audit Trail",
    description:
      "Every request, approval, denial, and revocation is logged with user context, IP address, and timestamp. Export to SIEM or review in-app.",
  },
  {
    icon: <Users className="h-6 w-6 text-pink-400" />,
    title: "Multi-Tenant SaaS",
    description:
      "Built for MSPs and enterprise IT teams. Manage multiple Microsoft 365 tenants from a single dashboard with per-tenant isolation.",
  },
  {
    icon: <Lock className="h-6 w-6 text-cyan-400" />,
    title: "Zero Standing Privileges",
    description:
      "Replace permanent privileged accounts with on-demand elevation. Aligns with NIST, CIS, and Zero Trust principles out of the box.",
  },
];

const pricingTiers = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "For small IT teams",
    highlight: false,
    features: [
      "Up to 25 users",
      "1 Microsoft 365 tenant",
      "5 access policies",
      "30-day audit log retention",
      "Email notifications",
      "Email support",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Professional",
    price: "$149",
    period: "/month",
    description: "For growing organizations",
    highlight: true,
    features: [
      "Up to 200 users",
      "3 Microsoft 365 tenants",
      "Unlimited policies",
      "1-year audit log retention",
      "Slack + Teams notifications",
      "Priority support",
      "Custom approval workflows",
      "API access",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large enterprises & MSPs",
    highlight: false,
    features: [
      "Unlimited users",
      "Unlimited tenants",
      "Unlimited policies",
      "Unlimited audit retention",
      "SIEM integration",
      "Dedicated CSM",
      "SLA guarantees",
      "On-premise deployment option",
    ],
    cta: "Contact Sales",
  },
];

const stats = [
  { value: "< 30s", label: "Average request processing time" },
  { value: "99.9%", label: "Platform uptime SLA" },
  { value: "100%", label: "Requests audited with full context" },
  { value: "0", label: "Standing privileged accounts needed" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
                <Lock className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                AccessPilot
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#"
                className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
              >
                Docs
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-gray-100"
                asChild
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                asChild
              >
                <Link href="/sign-up">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm font-medium text-blue-300">
              The AutoElevate Alternative Built for the Modern IT Stack
            </span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            JIT Access Management
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              for Microsoft 365
            </span>
          </h1>

          <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Replace standing privileged accounts with just-in-time access.
            Request, approve, grant, and auto-revoke Entra ID roles and M365 group
            memberships — with a complete audit trail.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-base"
              asChild
            >
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 h-12 text-base"
              asChild
            >
              <Link href="/sign-in">View Dashboard Demo</Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            No credit card required · 14-day free trial · Connect M365 in 5 minutes
          </p>
        </div>

        {/* Hero visual */}
        <div className="relative mt-16 mx-auto max-w-5xl">
          <div className="rounded-2xl border border-gray-700/50 bg-gray-900/80 backdrop-blur overflow-hidden shadow-2xl">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700/50 bg-gray-900">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-amber-500/60" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 mx-4 rounded-md bg-gray-800 px-3 py-1 text-xs text-gray-500">
                app.accesspilot.io/dashboard
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="p-6 bg-gray-950">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Pending Requests", value: "3", color: "amber" },
                  { label: "Active Grants", value: "12", color: "blue" },
                  { label: "Policies", value: "8", color: "violet" },
                  { label: "Expiring Soon", value: "2", color: "red" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4"
                  >
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-100 mt-1">
                      {stat.value}
                    </p>
                    <div
                      className={`mt-2 h-0.5 rounded bg-${stat.color}-500/40`}
                    />
                  </div>
                ))}
              </div>

              {/* Requests preview */}
              <div className="rounded-lg border border-gray-700/50 bg-gray-900/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">
                    Recent Access Requests
                  </span>
                  <span className="text-xs text-blue-400">View all →</span>
                </div>
                {[
                  {
                    user: "Sarah K.",
                    resource: "Global Administrator",
                    status: "PENDING",
                    time: "2m ago",
                    statusColor: "amber",
                  },
                  {
                    user: "Mike R.",
                    resource: "IT Operations Group",
                    status: "APPROVED",
                    time: "15m ago",
                    statusColor: "emerald",
                  },
                  {
                    user: "Alex P.",
                    resource: "Security Reader",
                    status: "AUTO-APPROVED",
                    time: "1h ago",
                    statusColor: "blue",
                  },
                ].map((req, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                        {req.user[0]}
                      </div>
                      <div>
                        <p className="text-sm text-gray-200">{req.resource}</p>
                        <p className="text-xs text-gray-500">{req.user}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600">{req.time}</span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-${req.statusColor}-500/20 text-${req.statusColor}-400`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-800 bg-gray-900/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Everything you need for least-privilege access
            </h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
              AccessPilot replaces manual access request spreadsheets, shared
              admin accounts, and standing privileges with automated JIT access
              workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-gray-700/50 bg-gray-900/50 p-6 hover:border-gray-600 hover:bg-gray-900 transition-all"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800 group-hover:bg-gray-700 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              How AccessPilot works
            </h2>
            <p className="mt-4 text-gray-400">
              From request to revocation in minutes, not tickets.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {[
              {
                step: "01",
                icon: <Key className="h-6 w-6" />,
                title: "Request",
                description:
                  "User requests temporary access to a role or group, specifying duration and justification.",
              },
              {
                step: "02",
                icon: <CheckCircle className="h-6 w-6" />,
                title: "Approve",
                description:
                  "Approver reviews and approves (or auto-approval if policy allows). Takes < 30 seconds.",
              },
              {
                step: "03",
                icon: <Shield className="h-6 w-6" />,
                title: "Grant",
                description:
                  "AccessPilot provisions access in Entra ID via Graph API. User gets an email confirmation.",
              },
              {
                step: "04",
                icon: <AlertTriangle className="h-6 w-6" />,
                title: "Revoke",
                description:
                  "Access is automatically revoked at expiry. BullMQ worker handles revocation in the background.",
              },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 3 && (
                  <div className="absolute top-6 left-full w-full h-[1px] bg-gradient-to-r from-blue-500/30 to-transparent hidden md:block" />
                )}
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-blue-500/30 bg-blue-500/10 text-blue-400">
                    {item.icon}
                  </div>
                  <div className="mb-1 text-xs font-bold text-blue-500 tracking-wider">
                    STEP {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-gray-400">
              Start free, scale as you grow. No per-user fees on Starter.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-8 ${
                  tier.highlight
                    ? "border-2 border-blue-500 bg-blue-600/5"
                    : "border border-gray-700/50 bg-gray-900/50"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-bold text-white uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{tier.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      {tier.price}
                    </span>
                    <span className="text-gray-400">{tier.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    tier.highlight
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600"
                  }`}
                  asChild
                >
                  <Link href={tier.name === "Enterprise" ? "#" : "/sign-up"}>
                    {tier.cta}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600/10 via-gray-900 to-violet-600/10 border-t border-gray-800">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-xl">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to eliminate standing privileges?
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            Connect your Microsoft 365 tenant in under 5 minutes and start your
            free 14-day trial.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-base"
              asChild
            >
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-600">
                <Lock className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-300">
                AccessPilot
              </span>
            </div>
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} AccessPilot. Built for Zero Trust.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-gray-600 hover:text-gray-400">
                Privacy
              </a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-400">
                Terms
              </a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-400">
                Docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
