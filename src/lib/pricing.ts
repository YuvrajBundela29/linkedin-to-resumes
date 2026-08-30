// Client-safe pricing catalogue for the credit store.

export type CreditPack = {
  id: string;
  name: string;
  credits: number;
  pricePaise: number;
  /** Struck-through "value" price, purely for anchoring. */
  comparePaise: number;
  tagline: string;
  perks: string[];
  badge?: string;
  featured?: boolean;
};

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 250,
    pricePaise: 9900,
    comparePaise: 19900,
    tagline: "For one focused application sprint.",
    perks: [
      "250 credits — never expire",
      "~250 AI chat edits",
      "All 15 templates unlocked",
      "Unlimited PDF & text exports",
    ],
  },
  {
    id: "pro",
    name: "Professional",
    credits: 750,
    pricePaise: 24900,
    comparePaise: 59900,
    tagline: "What 9 out of 10 serious job seekers pick.",
    perks: [
      "750 credits — never expire",
      "Tailor to unlimited job descriptions",
      "Full version history",
      "Priority AI queue",
      "Resume + CV modes",
    ],
    badge: "Most popular",
    featured: true,
  },
  {
    id: "career",
    name: "Career Suite",
    credits: 2000,
    pricePaise: 59900,
    comparePaise: 149900,
    tagline: "A full year of switching, tailoring, winning.",
    perks: [
      "2,000 credits — never expire",
      "Best value per credit",
      "Every template + every future template",
      "Academic CV mode included",
      "Priority AI queue",
    ],
    badge: "Best value",
  },
];

export function packById(id: string) {
  return CREDIT_PACKS.find((p) => p.id === id);
}

export function formatINR(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function pricePerCredit(paise: number, credits: number) {
  return `₹${(paise / 100 / credits).toFixed(2)}/credit`;
}
