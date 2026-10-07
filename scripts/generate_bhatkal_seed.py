#!/usr/bin/env python3
"""
Builds backend/src/main/resources/seed/bhatkal-restaurants.json for the dev-only Bhatkal demo seeder.

WHERE THE DATA COMES FROM
  Restaurant names, coordinates and cuisine tags come from OpenStreetMap through the public Overpass API.
  Data (c) OpenStreetMap contributors, licensed ODbL: https://www.openstreetmap.org/copyright
  Google Maps is deliberately NOT scraped (its terms forbid it). To list more places, use the official
  Google Places API with your own key, or add entries by hand: this script only needs a list of places.

WHAT IS NOT REAL
  OpenStreetMap has no menus or prices. Every menu below is a SAMPLE chosen from the restaurant's type
  (Udupi veg, biryani, seafood, Chinese, bakery, cafe, family restaurant) with placeholder prices.
  The restaurant description says so, and nothing here should be shown to the public as the real menu.
  Owner logins use made-up @zestora.local addresses, so no real person or business is contacted.
  No passwords are stored anywhere in the repo: the seeder gives every demo account the DEMO_PASSWORD
  from backend/.env.

USAGE
  python scripts/generate_bhatkal_seed.py                 # fetch from Overpass
  python scripts/generate_bhatkal_seed.py --offline f.json   # reuse a saved Overpass response
"""
import argparse
import io
import json
import math
import os
import re
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "backend", "src", "main", "resources", "seed", "bhatkal-restaurants.json")
ACCOUNTS_MD = os.path.join(ROOT, "backend", "DEMO_ACCOUNTS.md")

BHATKAL = (13.985, 74.555)
MAX_KM = 40
BBOX = "13.75,74.30,14.45,74.75"
TOWNS = {
    "Bhatkal": (13.985, 74.555), "Murdeshwar": (14.094, 74.489), "Honnavar": (14.280, 74.445),
    "Byndoor": (13.867, 74.634), "Kumta": (14.428, 74.419),
}

QUERY = f"""[out:json][timeout:90];
(
  nwr["amenity"~"restaurant|cafe|fast_food|food_court|ice_cream"]({BBOX});
  nwr["shop"~"bakery|confectionery|sweets"]({BBOX});
);
out center tags;"""


def km(a, b):
    r = 6371
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp, dl = p2 - p1, math.radians(b[1] - a[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def fetch():
    req = urllib.request.Request(
        "https://overpass-api.de/api/interpreter",
        data=urllib.parse.urlencode({"data": QUERY}).encode(),
        headers={"User-Agent": "zestora-demo-seeder/0.1 (local dev)"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode("utf-8"))


# ───────────────────────── sample menus (placeholder prices in INR) ─────────────────────────
def item(name, category, price, veg=True, desc=None, variants=None, addons=None):
    return {"name": name, "category": category, "price": price, "veg": veg, "description": desc,
            "variants": variants or [], "addons": addons or []}


UDUPI_VEG = [
    item("Idli Vada (2+1)", "Breakfast", 55, desc="Steamed idli with crisp medu vada, sambar and chutney"),
    item("Masala Dosa", "Dosa", 70, desc="Crisp dosa with potato palya", addons=[("Extra Butter", 10), ("Cheese", 25)]),
    item("Plain Dosa", "Dosa", 50),
    item("Set Dosa (3)", "Dosa", 60, desc="Soft dosas with vegetable saagu"),
    item("Uttapam", "Dosa", 65),
    item("Puri Bhaji", "Breakfast", 60),
    item("Upma", "Breakfast", 35),
    item("Neer Dosa (3) with Chutney", "Dosa", 60, desc="Coastal lacy rice dosa"),
    item("South Indian Meals", "Meals", 110, desc="Rice, sambar, rasam, palya, kootu, curd, payasa"),
    item("Curd Rice", "Meals", 55),
    item("Veg Pulao", "Rice", 90),
    item("Filter Coffee", "Beverages", 20),
    item("Masala Tea", "Beverages", 15),
    item("Gulab Jamun (2)", "Desserts", 40),
]

BIRYANI = [
    item("Chicken Dum Biryani", "Biryani", 180, False, "Slow-cooked with raita and salan",
         variants=[("Half", 180), ("Full", 320)], addons=[("Boiled Egg", 15), ("Extra Raita", 20)]),
    item("Mutton Dum Biryani", "Biryani", 260, False, variants=[("Half", 260), ("Full", 480)]),
    item("Egg Biryani", "Biryani", 140, False),
    item("Veg Biryani", "Biryani", 130, True),
    item("Chicken 65", "Starters", 160, False),
    item("Chicken Kebab", "Starters", 170, False),
    item("Paneer Tikka", "Starters", 150, True),
    item("Butter Naan", "Breads", 35, True),
    item("Chicken Curry", "Curries", 170, False),
    item("Raita", "Sides", 30, True),
    item("Soft Drink", "Beverages", 25, True),
    item("Falooda", "Desserts", 90, True),
]

SEAFOOD = [
    item("Fish Thali (Pomfret)", "Meals", 220, False, "Fried fish, fish curry, rice, solkadi"),
    item("Fish Curry Meals", "Meals", 150, False, "Coastal fish curry with rice"),
    item("Prawns Ghee Roast", "Starters", 280, False),
    item("Fish Fry (Anjal)", "Starters", 240, False),
    item("Crab Masala", "Curries", 320, False),
    item("Chicken Sukka", "Starters", 180, False),
    item("Neer Dosa (3) with Chicken Curry", "Breakfast", 120, False),
    item("Ghee Rice", "Rice", 90, True),
    item("Solkadi", "Beverages", 30, True),
    item("Egg Curry", "Curries", 110, False),
]

CHINESE_FAST_FOOD = [
    item("Veg Fried Rice", "Rice & Noodles", 110, True, variants=[("Veg", 110), ("Egg", 130), ("Chicken", 150)]),
    item("Hakka Noodles", "Rice & Noodles", 110, True, variants=[("Veg", 110), ("Egg", 130), ("Chicken", 150)]),
    item("Gobi Manchurian", "Starters", 120, True),
    item("Chicken Manchurian", "Starters", 160, False),
    item("Chilli Chicken", "Starters", 170, False),
    item("Chicken Roll", "Rolls", 90, False),
    item("Paneer Roll", "Rolls", 80, True),
    item("Chicken Burger", "Burgers", 100, False, addons=[("Cheese Slice", 20)]),
    item("French Fries", "Sides", 70, True),
    item("Chicken Shawarma", "Rolls", 90, False),
    item("Lime Soda", "Beverages", 30, True),
]

CHICKEN_NONVEG = [
    item("Chicken Fry (Bhatkali style)", "Starters", 170, False),
    item("Chicken Biryani", "Biryani", 170, False, variants=[("Half", 170), ("Full", 300)]),
    item("Chicken Kebab", "Starters", 160, False),
    item("Grilled Chicken (Quarter)", "Grill", 140, False, addons=[("Garlic Mayo", 15)]),
    item("Chicken Sukka", "Starters", 170, False),
    item("Malabar Parotta", "Breads", 20, True),
    item("Butter Chicken", "Curries", 200, False),
    item("Ghee Rice", "Rice", 80, True),
    item("Egg Masala", "Curries", 100, False),
    item("Soft Drink", "Beverages", 25, True),
]

FAMILY = [
    item("Chicken Biryani", "Biryani", 160, False),
    item("Veg Biryani", "Biryani", 120, True),
    item("Paneer Butter Masala", "North Indian", 170, True),
    item("Butter Chicken", "North Indian", 200, False),
    item("Dal Tadka", "North Indian", 110, True),
    item("Butter Naan", "Breads", 35, True),
    item("Tandoori Roti", "Breads", 20, True),
    item("Veg Fried Rice", "Chinese", 110, True),
    item("Chilli Chicken", "Chinese", 170, False),
    item("Masala Dosa", "South Indian", 70, True),
    item("South Indian Meals", "Meals", 120, True),
    item("Fresh Lime Soda", "Beverages", 35, True),
]

BAKERY = [
    item("Veg Puff", "Bakery", 20), item("Egg Puff", "Bakery", 25, False), item("Chicken Puff", "Bakery", 35, False),
    item("Fruit Bun", "Bakery", 20), item("Milk Bread", "Bread", 40), item("Cream Roll", "Bakery", 30),
    item("Butter Biscuits (250g)", "Biscuits", 90), item("Rusk (250g)", "Biscuits", 60),
    item("Plum Cake (500g)", "Cakes", 280), item("Black Forest Pastry", "Cakes", 60),
    item("Mixture (250g)", "Snacks", 70), item("Mysore Pak (250g)", "Sweets", 160),
]

CAFE = [
    item("Cold Coffee", "Beverages", 90, True, addons=[("Ice Cream Scoop", 30)]),
    item("Hot Coffee", "Beverages", 50), item("Chocolate Shake", "Beverages", 110), item("Oreo Shake", "Beverages", 120),
    item("Chicken Burger", "Burgers", 120, False, addons=[("Cheese Slice", 20)]),
    item("Veg Burger", "Burgers", 90), item("Grilled Sandwich", "Snacks", 80),
    item("Chicken Wings (6)", "Snacks", 180, False), item("French Fries", "Snacks", 80),
    item("Donut", "Bakery", 60), item("Brownie with Ice Cream", "Desserts", 130), item("Ice Cream Sundae", "Desserts", 110),
]

TEMPLATES = {
    "udupi": ("Udupi / South Indian", UDUPI_VEG), "biryani": ("Biryani", BIRYANI), "seafood": ("Coastal seafood", SEAFOOD),
    "chinese": ("Chinese & fast food", CHINESE_FAST_FOOD), "chicken": ("Chicken specialities", CHICKEN_NONVEG),
    "family": ("Family restaurant", FAMILY), "bakery": ("Bakery", BAKERY), "cafe": ("Cafe & fast food", CAFE),
}


def pick_template(tags):
    name = tags.get("name", "").lower()
    cuisine = (tags.get("cuisine") or "").lower()
    kind = tags.get("amenity") or tags.get("shop")
    if kind in ("bakery", "confectionery", "sweets"): return "bakery"
    if "seafood" in cuisine or "machalee" in name or "fish" in name: return "seafood"
    if "biryani" in name or "biryani" in cuisine: return "biryani"
    if "chinese" in name: return "chinese"
    if "chicken" in name: return "chicken"
    if "pure veg" in name or "udupi" in name or "kamat" in name or "shiv sagar" in name: return "udupi"
    if kind == "cafe" or "burger" in cuisine: return "cafe"
    return "family"


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--offline", help="path to a saved Overpass JSON response")
    args = ap.parse_args()

    if args.offline:
        data = json.load(io.open(args.offline, encoding="utf-8"))
    else:
        data = fetch()

    # Keep named places within MAX_KM of Bhatkal; merge duplicate nodes (same name, < 150 m apart).
    places = []
    for e in data["elements"]:
        t = e.get("tags", {})
        name = t.get("name")
        lat = e.get("lat") or e.get("center", {}).get("lat")
        lon = e.get("lon") or e.get("center", {}).get("lon")
        if not name or lat is None or km(BHATKAL, (lat, lon)) > MAX_KM:
            continue
        dup = next((p for p in places if p["name"].lower() == name.lower() and km((p["lat"], p["lng"]), (lat, lon)) < 0.15), None)
        if dup:
            dup["tags"].update({k: v for k, v in t.items() if k not in dup["tags"]})
            continue
        places.append({"osmId": f"{e['type'][0]}{e['id']}", "name": name.strip(), "lat": round(lat, 6), "lng": round(lon, 6), "tags": dict(t)})

    restaurants = []
    for p in sorted(places, key=lambda p: km(BHATKAL, (p["lat"], p["lng"]))):
        town = min(TOWNS, key=lambda k: km(TOWNS[k], (p["lat"], p["lng"])))
        key = TEMPLATES[pick_template(p["tags"])]
        label, menu = key
        slug = slugify(f"{p['name']} {town}")
        veg_only = "pure veg" in p["name"].lower()
        items = []
        for m in menu:
            if veg_only and not m["veg"]:
                continue
            items.append({
                "name": m["name"], "category": m["category"], "price": m["price"], "veg": m["veg"], "description": m["description"],
                "variants": [{"name": n, "price": pr} for n, pr in m["variants"]],
                "addons": [{"name": n, "price": pr} for n, pr in m["addons"]],
            })
        restaurants.append({
            "osmId": p["osmId"], "name": p["name"], "slug": slug, "city": town, "lat": p["lat"], "lng": p["lng"],
            "cuisines": [label], "vegOnly": veg_only,
            "description": f"{label} in {town}. DEMO LISTING: the menu and prices are samples, not this restaurant's real menu.",
            "ownerName": f"{p['name']} (demo owner)", "ownerEmail": f"{slug}@zestora.local",
            "menu": items,
        })

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    doc = {
        "_source": "Places: OpenStreetMap contributors (ODbL, https://www.openstreetmap.org/copyright) via Overpass API. "
                   "Menus and prices are SAMPLES generated by scripts/generate_bhatkal_seed.py, not real data.",
        "restaurants": restaurants,
    }
    with io.open(OUT, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)

    lines = [
        "# Demo restaurant accounts (development only)", "",
        "Created by the `bhatkal` seed profile. Each restaurant owner signs in at the app with the email below and the",
        "`DEMO_PASSWORD` from your `backend/.env`, and lands on the kitchen console (orders + menu).",
        "The emails are fake (`@zestora.local`); nothing is sent to any real business.",
        "Places come from OpenStreetMap (c) OpenStreetMap contributors, ODbL. **Menus and prices are samples.**", "",
        "| Restaurant | Town | Menu type | Email |", "|---|---|---|---|",
    ]
    for r in restaurants:
        lines.append(f"| {r['name']} | {r['city']} | {r['cuisines'][0]} | `{r['ownerEmail']}` |")
    lines += ["", "Local development only. Never run the `bhatkal` profile against a production database."]
    with io.open(ACCOUNTS_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"{len(restaurants)} restaurants written to {OUT}")
    for r in restaurants:
        print(f"  {r['name']} ({r['city']}) - {r['cuisines'][0]} - {len(r['menu'])} items")


if __name__ == "__main__":
    main()
