from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import os

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
}

CB_TARGET_URL = "https://www.cb.com.tr/ilanlar?officeid=470&officeuserid=23339"

def clean_text(element):
    return element.get_text(strip=True) if element else ""

def fetch_real_estate_data():
    try:
        response = requests.get(CB_TARGET_URL, headers=HEADERS, timeout=15)
        if response.status_code != 200:
            return []

        soup = BeautifulSoup(response.content, "html.parser")
        listings = []
        
        cards = soup.select(".card.locationDiv")
        if not cards:
            cards = soup.select(".cb-list-item")
            
        for card in cards:
            try:
                title_el = card.select_one(".cb-list-item-info h2") or card.select_one(".card-title")
                title = clean_text(title_el)
                if not title: continue

                price_el = card.select_one(".feature-item .text-primary") or card.select_one("span.h5.text-primary")
                price = clean_text(price_el)

                link_el = card.select_one(".cb-list-img-container a") or card.select_one("a.title") or card.select_one("a[href]")
                link = link_el["href"] if link_el else "#"
                if link and not link.startswith("http"):
                    link = "https://www.cb.com.tr" + link

                img_el = card.select_one(".cb-list-img-container img") or card.select_one("img.card-img-top")
                img_url = "https://via.placeholder.com/400x300"
                if img_el:
                    img_url = img_el.get("src") or img_el.get("data-src") or img_url

                region_el = card.select_one('span[itemprop="addressRegion"]')
                street_el = card.select_one('span[itemprop="streetAddress"]')
                region = clean_text(region_el)
                street = clean_text(street_el)
                loc = f"{region}, {street}" if region and street else "Ankara"

                rooms = area = ""
                for feat in card.select(".feature-item"):
                    text = clean_text(feat)
                    if "m2" in text or "m²" in text:
                        area = text
                    elif "+" in text:
                        rooms = text

                listings.append({
                    "title": title,
                    "price": price,
                    "url": link,
                    "img": img_url,
                    "loc": loc,
                    "rooms": rooms,
                    "area": area,
                    "type": "Satılık" if "Satılık" in title else "Kiralık"
                })
            except Exception as e:
                print(f"Error parsing card: {e}")
                continue
                
        return listings
    except Exception as e:
        print(f"Scraper error: {e}")
        return []

@app.route('/')
def serve_index():
    return app.send_static_file('index.html')

@app.route('/api/listings')
def get_listings():
    data = fetch_real_estate_data()
    if data:
        return jsonify({"success": True, "count": len(data), "data": data})
    else:
        return jsonify({"success": False, "message": "Failed to fetch listings"}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    app.run(host='0.0.0.0', port=port, debug=False)
