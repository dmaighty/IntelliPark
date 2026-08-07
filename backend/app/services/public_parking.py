"""Public/on-street parking lookup via the OpenStreetMap Overpass API.

This complements the app's own `ParkingLot` database: Overpass covers
municipal lots and on-street parking that IntelliPark hasn't onboarded,
using OSM's `amenity=parking` tagging (which includes `access` and `fee`
tags useful for distinguishing genuinely public spots).
"""

from __future__ import annotations

import json
import logging
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.utils.geo import haversine_km

logger = logging.getLogger(__name__)

# Public Overpass instances are free, shared infrastructure and frequently
# return 504s under load. Try each in turn before giving up.
OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
]
PER_REQUEST_TIMEOUT = 12.0
MAX_RESULTS = 8


class PublicParkingUnavailable(Exception):
    """Raised when every Overpass mirror fails — distinct from "no results found"."""


def _overpass_query(lat: float, lon: float, radius_m: int) -> str:
    return f"""
[out:json][timeout:20];
(
  node["amenity"="parking"](around:{radius_m},{lat},{lon});
  way["amenity"="parking"](around:{radius_m},{lat},{lon});
);
out center tags;
""".strip()


def _element_coords(element: dict) -> tuple[float, float] | None:
    if "lat" in element and "lon" in element:
        return element["lat"], element["lon"]
    center = element.get("center")
    if center and "lat" in center and "lon" in center:
        return center["lat"], center["lon"]
    return None


def _describe(tags: dict) -> tuple[str, str | None]:
    access = tags.get("access")
    fee = tags.get("fee")

    if access in ("private", "customers", "permit", "no"):
        kind = "private"
    else:
        kind = "public"

    fee_label = None
    if fee == "no":
        fee_label = "free"
    elif fee == "yes":
        fee_label = "paid"

    return kind, fee_label


def _address_from_tags(tags: dict) -> str | None:
    """Build a short street address from OSM addr:* tags, when present."""
    house_number = tags.get("addr:housenumber")
    street = tags.get("addr:street")
    city = tags.get("addr:city")

    if street:
        street_part = f"{house_number} {street}" if house_number else street
        return f"{street_part}, {city}" if city else street_part

    return None


def _label_for(tags: dict) -> str:
    """Best available human-readable label — never raw coordinates."""
    name = tags.get("name")
    if name:
        return name

    address = _address_from_tags(tags)
    if address:
        return address

    operator = tags.get("operator")
    if operator:
        return f"{operator} parking"

    return "Public parking (unnamed)"


def search_public_parking(
    lat: float,
    lon: float,
    radius_km: float = 1.5,
    public_only: bool = True,
) -> list[dict]:
    """Query Overpass for parking near (lat, lon). Returns plain dicts, closest first.

    Each result: name (best available label — OSM name, else a street address, else
    operator, never raw coordinates), address (street address if known, else None),
    distance_km, access ("public"/"private"), fee ("free"/"paid"/None),
    source ("openstreetmap"), plus latitude/longitude for map-linking only.
    """
    radius_m = max(100, min(int(radius_km * 1000), 20_000))
    query = _overpass_query(lat, lon, radius_m)
    body = f"data={query}".encode("utf-8")

    raw: str | None = None
    last_error: Exception | None = None

    for url in OVERPASS_MIRRORS:
        req = Request(
            url,
            data=body,
            method="POST",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "IntelliPark/1.0 (parking assistant)",
            },
        )
        try:
            with urlopen(req, timeout=PER_REQUEST_TIMEOUT) as resp:
                raw = resp.read().decode("utf-8")
            break
        except (HTTPError, URLError) as e:
            logger.warning("Overpass mirror %s failed: %s", url, e)
            last_error = e
            continue

    if raw is None:
        raise PublicParkingUnavailable(
            f"All Overpass mirrors failed: {last_error}"
        ) from last_error

    try:
        elements = json.loads(raw).get("elements", [])
    except json.JSONDecodeError as e:
        raise PublicParkingUnavailable("Overpass returned an invalid response") from e

    results: list[dict] = []
    for element in elements:
        coords = _element_coords(element)
        if not coords:
            continue
        el_lat, el_lon = coords
        tags = element.get("tags", {})
        access, fee = _describe(tags)

        if public_only and access == "private":
            continue

        results.append(
            {
                "name": _label_for(tags),
                "address": _address_from_tags(tags),
                "distance_km": round(haversine_km(lat, lon, el_lat, el_lon), 3),
                "access": access,
                "fee": fee,
                "source": "openstreetmap",
                # For map-linking only — the model should not print these raw.
                "latitude": el_lat,
                "longitude": el_lon,
            }
        )

    results.sort(key=lambda r: r["distance_km"])
    return results[:MAX_RESULTS]
