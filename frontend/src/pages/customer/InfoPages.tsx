import { Link } from 'react-router-dom';

const POINTS: [string, string][] = [
  ['Menus as the restaurants print them', 'Dish names, prices and veg labels come from the restaurants themselves. Where a restaurant has not told us something, we leave it out instead of guessing.'],
  ['Prices you can trust', 'The server works out every total from the menu before you pay. Delivery is free on food orders of ₹499 and above.'],
  ['Follow your order', 'See your order move from the kitchen to your door, step by step.'],
];

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl py-4 sm:py-10">
      <h1 className="font-display text-5xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">Good food, <span className="text-brand">close to home.</span></h1>
      <p className="mt-6 max-w-xl text-lg text-stone-600">Zestora brings food and groceries from local Bhatkal kitchens and stores to your door.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {POINTS.map(([t, d]) => (
          <div key={t} className="rounded-3xl bg-white p-6 shadow-soft">
            <h2 className="font-display text-xl font-semibold">{t}</h2>
            <p className="mt-2 text-sm text-stone-600">{d}</p>
          </div>
        ))}
      </div>
      <Link to="/" className="btn-primary mt-10 px-8 py-3">View restaurants</Link>
    </div>
  );
}

export function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl py-4 sm:py-10">
      <h1 className="font-display text-5xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">Need a <span className="text-brand">hand?</span></h1>
      <p className="mt-6 max-w-xl text-lg text-stone-600">If you have an order with us, the fastest way to reach us is through Support.</p>
      <div className="card mt-10 max-w-xl">
        <h2 className="font-display text-xl font-semibold">Order help</h2>
        <p className="mt-2 text-sm text-stone-600">Log in and open Support to raise a question about an order. We have not published a public phone number or email address yet.</p>
        <Link to="/support" className="btn-primary mt-5 px-7">Open Support</Link>
      </div>
    </div>
  );
}
