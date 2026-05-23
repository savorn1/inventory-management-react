const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const CrossIcon = () => (
  <svg className="w-5 h-5 text-slate-300 shrink-0" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

interface Feature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  description: string;
  price: string | null;
  period?: string;
  isFree?: boolean;
  popular?: boolean;
  buttonLabel: string;
  buttonStyle: "outline" | "white" | "purple";
  iconBg: string;
  iconColor: string;
  iconPath: string;
  features: Feature[];
}

const plans: Plan[] = [
  {
    name: "Starter",
    description: "Perfect for small businesses getting started",
    price: null,
    isFree: true,
    buttonLabel: "Get Started Free",
    buttonStyle: "outline",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-500",
    iconPath: "M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z",
    features: [
      { text: "Up to 2 users", included: true },
      { text: "100 transactions / month", included: true },
      { text: "Basic financial dashboard", included: true },
      { text: "Client & supplier management", included: true },
      { text: "Invoice generation (10/mo)", included: true },
      { text: "Email support", included: true },
      { text: "Employee & payroll module", included: false },
      { text: "Advanced analytics & charts", included: false },
      { text: "Multi-bank account management", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Professional",
    description: "Everything you need to grow your business",
    price: "29",
    period: "mo",
    popular: true,
    buttonLabel: "Start Free Trial",
    buttonStyle: "white",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
    features: [
      { text: "Up to 10 users", included: true },
      { text: "Unlimited transactions", included: true },
      { text: "Advanced financial dashboard", included: true },
      { text: "Client & supplier management", included: true },
      { text: "Unlimited invoice generation", included: true },
      { text: "Employee & payroll module", included: true },
      { text: "Advanced analytics & charts", included: true },
      { text: "Income & expense tracking", included: true },
      { text: "Multi-bank account management", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Enterprise",
    description: "Full power for large organizations",
    price: "79",
    period: "mo",
    buttonLabel: "Contact Sales",
    buttonStyle: "purple",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    iconPath: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    features: [
      { text: "Unlimited users", included: true },
      { text: "Unlimited transactions", included: true },
      { text: "Full analytics suite", included: true },
      { text: "Client & supplier management", included: true },
      { text: "Unlimited invoicing", included: true },
      { text: "Employee & payroll module", included: true },
      { text: "Advanced analytics & charts", included: true },
      { text: "Income & expense tracking", included: true },
      { text: "Multi-bank account management", included: true },
      { text: "Priority 24/7 support + SLA", included: true },
    ],
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  const isPopular = plan.popular;

  const buttonClass = (() => {
    if (plan.buttonStyle === "outline")
      return "border-2 border-indigo-500 text-indigo-600 bg-white hover:bg-indigo-50";
    if (plan.buttonStyle === "white")
      return "bg-white text-indigo-700 hover:bg-indigo-50";
    return "bg-purple-600 text-white hover:bg-purple-700";
  })();

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-7 shadow-lg ${
        isPopular
          ? "bg-indigo-700 text-white"
          : "bg-white text-slate-800 border border-slate-100"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-orange-400 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
            Most Popular
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${plan.iconBg}`}>
          <svg className={`w-6 h-6 ${plan.iconColor}`} viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d={plan.iconPath} clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className={`font-bold text-lg leading-tight ${isPopular ? "text-white" : "text-slate-800"}`}>
            {plan.name}
          </h3>
          <p className={`text-sm ${isPopular ? "text-indigo-200" : "text-slate-500"}`}>
            {plan.description}
          </p>
        </div>
      </div>

      <div className="mb-6">
        {plan.isFree ? (
          <span className={`text-3xl font-bold ${isPopular ? "text-white" : "text-indigo-600"}`}>
            Free forever
          </span>
        ) : (
          <div className="flex items-end gap-1">
            <span className={`text-lg font-semibold ${isPopular ? "text-indigo-200" : "text-slate-500"}`}>$</span>
            <span className={`text-5xl font-bold leading-none ${isPopular ? "text-white" : "text-purple-600"}`}>
              {plan.price}
            </span>
            <span className={`text-base mb-1 ${isPopular ? "text-indigo-200" : "text-slate-500"}`}>
              / {plan.period}
            </span>
          </div>
        )}
      </div>

      <button
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors mb-7 cursor-pointer ${buttonClass}`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M13 9l3 3-3 3M6 12h10M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {plan.buttonLabel}
      </button>

      <ul className="flex flex-col gap-3">
        {plan.features.map((f) => (
          <li key={f.text} className="flex items-center gap-3">
            {isPopular ? (
              f.included ? (
                <svg className="w-5 h-5 text-green-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-indigo-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )
            ) : f.included ? (
              <CheckIcon />
            ) : (
              <CrossIcon />
            )}
            <span
              className={`text-sm ${
                isPopular
                  ? f.included ? "text-white" : "text-indigo-300"
                  : f.included ? "text-slate-700" : "text-slate-400"
              }`}
            >
              {f.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PricingView() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 px-4 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-white mb-3">Simple, Transparent Pricing</h1>
          <p className="text-indigo-200 text-lg">Choose the plan that fits your business needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </div>
    </div>
  );
}
