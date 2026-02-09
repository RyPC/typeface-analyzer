#!/usr/bin/env python3
"""
Update the municipality field for photos where custom_id matches a regex pattern.

This script updates all photos in the database where custom_id matches the pattern
'^SantaAna' to set their municipality field to 'Santa Ana'.
"""

import os
import sys
import re
from pymongo import MongoClient
from dotenv import load_dotenv


def update_municipality_by_regex(pattern, new_municipality, dry_run=False):
    """
    Update municipality field for photos matching the regex pattern.
    
    Args:
        pattern: Regex pattern to match against custom_id field
        new_municipality: The new municipality value to set
        dry_run: If True, only show what would be updated without making changes
    
    Returns:
        tuple: (matched_count, updated_count)
    """
    # Load environment variables from .env file
    # Script is in scripts/ folder, so go up one level to find server/.env
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    env_path = os.path.join(project_root, 'server', '.env')
    load_dotenv(env_path)
    
    # Get MongoDB connection URI
    mongodb_uri = os.getenv('MONGODB_URI')
    if not mongodb_uri:
        raise ValueError("MONGODB_URI not found in environment variables. Please check your .env file.")
    
    # Connect to MongoDB
    try:
        client = MongoClient(mongodb_uri)
        db = client['visualTextDB']
        photos_collection = db['photos']
        
        print(f"Connected to MongoDB database: visualTextDB")
        print(f"Collection: photos")
        print()
        
        # Build the query using regex
        query = {'custom_id': {'$regex': pattern}}
        
        # Count matching documents
        matched_count = photos_collection.count_documents(query)
        print(f"Found {matched_count} document(s) matching pattern: {pattern}")
        
        if matched_count == 0:
            print("No documents to update.")
            client.close()
            return (0, 0)
        
        # Show some examples of what will be updated
        print("\nSample documents that will be updated:")
        sample_docs = photos_collection.find(query).limit(5)
        for i, doc in enumerate(sample_docs, 1):
            print(f"  {i}. custom_id: {doc.get('custom_id', 'N/A')}, "
                  f"current municipality: {doc.get('municipality', 'N/A')}")
        
        if matched_count > 5:
            print(f"  ... and {matched_count - 5} more")
        
        print()
        
        if dry_run:
            print("DRY RUN MODE - No changes will be made")
            print(f"Would update {matched_count} document(s) to municipality: '{new_municipality}'")
            client.close()
            return (matched_count, 0)
        
        # Perform the update
        print(f"Updating municipality to '{new_municipality}'...")
        result = photos_collection.update_many(
            query,
            {'$set': {'municipality': new_municipality}}
        )
        
        updated_count = result.modified_count
        print(f"\nUpdate complete!")
        print(f"  Matched: {matched_count} document(s)")
        print(f"  Updated: {updated_count} document(s)")
        
        if updated_count < matched_count:
            print(f"  Note: {matched_count - updated_count} document(s) may have already had this municipality value.")
        
        client.close()
        return (matched_count, updated_count)
        
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}", file=sys.stderr)
        raise


def main():
    """Main function to run the script."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Update municipality field for photos matching a regex pattern",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Interactive mode (will prompt for pattern and municipality)
  python update_municipality.py
  
  # Specify pattern and municipality via command line
  python update_municipality.py --pattern '^GardenGrove' --municipality 'Garden Grove'
  
  # Dry run to see what would be updated
  python update_municipality.py --pattern '^GardenGrove' --municipality 'Garden Grove' --dry-run
        """
    )
    
    parser.add_argument(
        '--pattern',
        default=None,
        help='Regex pattern to match against custom_id field (required if not using interactive mode)'
    )
    
    parser.add_argument(
        '--municipality',
        default=None,
        help='New municipality value to set (required if not using interactive mode)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be updated without making changes'
    )
    
    args = parser.parse_args()
    
    # Get pattern and municipality - prompt if not provided
    pattern = args.pattern
    municipality = args.municipality
    
    if not pattern:
        pattern = input("Enter regex pattern to match custom_id (e.g., '^GardenGrove'): ").strip()
        if not pattern:
            print("Error: Pattern is required.", file=sys.stderr)
            sys.exit(1)
    
    if not municipality:
        municipality = input("Enter new municipality value (e.g., 'Garden Grove'): ").strip()
        if not municipality:
            print("Error: Municipality is required.", file=sys.stderr)
            sys.exit(1)
    
    try:
        matched, updated = update_municipality_by_regex(
            pattern,
            municipality,
            dry_run=args.dry_run
        )
        
        if args.dry_run:
            print("\nRun without --dry-run to apply changes.")
        else:
            print(f"\nSuccessfully updated {updated} document(s).")
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
