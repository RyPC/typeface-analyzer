#!/usr/bin/env python3
"""
Find duplicate substrates across all photos.

Compares substrates at the substrate level: two substrates match only if they
have identical typeface text sets (all copy values must match across all
typefaces within the substrate).
"""

import hashlib
import os
import sys
from collections import defaultdict
from urllib.parse import quote

# Add project root for imports
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
sys.path.insert(0, project_root)


S3_PHOTO_BASE = "https://typeface-s3-photo-bucket.s3.us-west-1.amazonaws.com/Font+Census+Data"


def get_photo_url(custom_id):
    """Build S3 URL for a photo from its custom_id."""
    if not custom_id:
        return None
    encoded = quote(str(custom_id), safe="./_-")
    return f"{S3_PHOTO_BASE}/{encoded}"


def normalize_text(text):
    """Normalize text for comparison (strip, collapse whitespace)."""
    if text is None or not isinstance(text, str):
        return None
    # Strip and collapse runs of whitespace (including newlines) to single space
    normalized = " ".join(text.split())
    return normalized if normalized else None


def get_substrate_fingerprint(copy_texts):
    """
    Create a hashable fingerprint for a substrate from its typeface copy values.
    Uses sorted tuple to make order-independent while preserving multiplicity.
    """
    normalized_list = []
    for text in copy_texts:
        n = normalize_text(text)
        if n is not None:
            normalized_list.append(n)
    if not normalized_list:
        return None
    # Sorted for order-independent matching; tuple preserves multiplicity
    fingerprint = tuple(sorted(normalized_list))
    return hashlib.sha256(str(fingerprint).encode("utf-8")).hexdigest()


def extract_substrate_occurrences(photos):
    """
    Extract substrates with their full typeface copy sets.
    Two substrates match only if all typeface texts within them are identical.

    Returns: dict mapping substrate_fingerprint -> list of substrate occurrences
    """
    fingerprint_to_occurrences = defaultdict(list)

    for photo in photos:
        photo_id = photo.get("id") or photo.get("_id", "")
        custom_id = photo.get("custom_id", "")
        municipality = photo.get("municipality", "")

        substrates = photo.get("substrates") or []
        for sub_idx, substrate in enumerate(substrates):
            typefaces = substrate.get("typefaces") or []
            copy_texts = []
            for typeface in typefaces:
                copy_text = typeface.get("copy")
                if copy_text is not None:
                    copy_texts.append(copy_text)

            # Skip substrates with no typeface copy values
            if not copy_texts:
                continue

            fingerprint = get_substrate_fingerprint(copy_texts)
            if fingerprint is None:
                continue

            # Normalized copy texts for display
            normalized_texts = [normalize_text(t) for t in copy_texts]
            normalized_texts = [n for n in normalized_texts if n is not None]

            fingerprint_to_occurrences[fingerprint].append(
                {
                    "copy_texts": copy_texts,
                    "normalized_texts": normalized_texts,
                    "photo_id": str(photo_id),
                    "custom_id": custom_id,
                    "municipality": municipality,
                    "substrate_idx": sub_idx,
                    "typeface_count": len(copy_texts),
                }
            )

    return fingerprint_to_occurrences


def load_photos_from_mongodb():
    """Load all photos from MongoDB."""
    from pymongo import MongoClient
    from dotenv import load_dotenv

    env_path = os.path.join(project_root, "server", ".env")
    load_dotenv(env_path)

    mongodb_uri = os.environ.get("MONGODB_URI")
    if not mongodb_uri:
        raise ValueError("MONGODB_URI not found. Set it in server/.env")

    client = MongoClient(mongodb_uri)
    db = client["visualTextDB"]
    photos_collection = db["photos"]

    photos = list(photos_collection.find({}))
    client.close()
    return photos


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Find duplicate copy/text values across all photos",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--exact",
        action="store_true",
        help="Match exact text only (no whitespace normalization)",
    )
    parser.add_argument(
        "--min-occurrences",
        type=int,
        default=2,
        help="Minimum occurrences to count as duplicate (default: 2)",
    )
    parser.add_argument(
        "-o",
        "--output",
        metavar="FILE",
        default="duplicate_substrates.md",
        help="Output markdown file (default: duplicate_substrates.md)",
    )
    args = parser.parse_args()

    if args.exact:
        # Override normalize to identity
        global normalize_text
        normalize_text = lambda t: (t.strip() if t and isinstance(t, str) else None)

    # Load photos from MongoDB
    try:
        photos = load_photos_from_mongodb()
        print(f"Loaded {len(photos)} photos from MongoDB")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    fingerprint_to_occurrences = extract_substrate_occurrences(photos)

    # Find duplicates (substrates with identical typeface sets appearing 2+ times)
    duplicates = {
        fp: occs
        for fp, occs in fingerprint_to_occurrences.items()
        if len(occs) >= args.min_occurrences
    }

    # Build markdown output
    output_path = args.output
    if not os.path.isabs(output_path):
        output_path = os.path.join(project_root, output_path)

    lines = [
        "# Duplicate Substrates Report",
        "",
        f"Found **{len(duplicates)}** duplicate substrate(s) (matching all typeface texts, appearing in {args.min_occurrences}+ places).",
        "",
    ]

    if duplicates:
        for fingerprint, occurrences in sorted(
            duplicates.items(), key=lambda x: -len(x[1])
        ):
            first = occurrences[0]
            normalized_texts = first["normalized_texts"]
            display_parts = []
            for i, nt in enumerate(normalized_texts):
                truncated = nt[:60] + "..." if len(nt) > 60 else nt
                truncated = truncated.replace("\n", " ")
                display_parts.append(f"{i + 1}. {truncated}")

            lines.append(f"## [{len(occurrences)} occurrences] Substrate with {len(normalized_texts)} typeface(s)")
            lines.append("")
            lines.append("**Typeface texts:**")
            lines.append("")
            for part in display_parts:
                lines.append(f"- {part}")
            lines.append("")
            lines.append("**Photos:**")
            lines.append("")
            for occ in occurrences:
                url = get_photo_url(occ["custom_id"])
                link = f"[{occ['custom_id']}]({url})" if url else occ["custom_id"]
                lines.append(
                    f"- {link} (municipality: {occ['municipality']}) [substrate {occ['substrate_idx']}]"
                )
            lines.append("")
            lines.append("---")
            lines.append("")
    else:
        lines.append("No duplicate substrates found.")
        lines.append("")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Report written to {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
