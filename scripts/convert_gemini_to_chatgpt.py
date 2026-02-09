#!/usr/bin/env python3
"""
Convert Gemini batch results JSONL files to ChatGPT format for batch import.

Input format (Gemini):
{
    "key": "SantaAna40.JPG",
    "response": {
        "candidates": [{
            "content": {
                "parts": [{
                    "text": "```json\n{...}\n```"
                }]
            }
        }]
    }
}

Output format (ChatGPT):
{
    "custom_id": "SantaAna40.JPG",
    "response": {
        "body": {
            "choices": [{
                "message": {
                    "content": "|||{...}|||"
                }
            }]
        }
    }
}
"""

import json
import re
import sys
import argparse
from pathlib import Path


def extract_json_from_markdown(text, debug=False):
    """Extract JSON from markdown code blocks (```json ... ```)."""
    if debug:
        print(f"DEBUG: Raw text length: {len(text)}", file=sys.stderr)
        print(f"DEBUG: First 200 chars: {text[:200]}", file=sys.stderr)
    
    # Try to find JSON in code blocks first
    json_match = re.search(r'```json\s*\n(.*?)\n```', text, re.DOTALL)
    if json_match:
        extracted = json_match.group(1).strip()
        if debug:
            print(f"DEBUG: Found JSON in code block, length: {len(extracted)}", file=sys.stderr)
        return extracted
    
    # Try to find JSON wrapped in ||| markers (some Gemini responses already have this)
    pipe_match = re.search(r'\|\|\|(.*?)\|\|\|', text, re.DOTALL)
    if pipe_match:
        extracted = pipe_match.group(1).strip()
        # Check if it starts with invalid prefix like "{return format}" or similar
        if '{return format}' in extracted:
            # Remove the prefix and extract the actual JSON
            # Find where the actual JSON object starts (after the prefix)
            prefix_pattern = r'\{return format\}'
            if re.search(prefix_pattern, extracted):
                # Find the first { that starts a valid JSON object (after the prefix)
                # Look for the pattern: {return format}\n{...actual JSON...}
                json_start = re.search(r'\{return format\}\s*\n\s*(\{)', extracted)
                if json_start:
                    # Extract from the second { onwards
                    start_pos = json_start.end() - 1  # Position of the second {
                    extracted = extracted[start_pos:].strip()
                else:
                    # Fallback: find first { after the prefix
                    prefix_end = extracted.find('}', extracted.find('{return format}')) + 1
                    if prefix_end > 0:
                        # Find the next { which should be the start of the JSON
                        json_start_pos = extracted.find('{', prefix_end)
                        if json_start_pos > 0:
                            extracted = extracted[json_start_pos:].strip()
        elif not extracted.startswith('{'):
            # If it doesn't start with {, try to find the JSON object
            json_match = re.search(r'\{.*\}', extracted, re.DOTALL)
            if json_match:
                extracted = json_match.group(0).strip()
        if debug:
            print(f"DEBUG: Found JSON in ||| markers, length: {len(extracted)}", file=sys.stderr)
        return extracted
    
    # If no code block, try to find JSON object directly
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        extracted = json_match.group(0).strip()
        if debug:
            print(f"DEBUG: Found JSON object directly, length: {len(extracted)}", file=sys.stderr)
        return extracted
    
    # If still not found, return the whole text (might be plain JSON)
    if debug:
        print(f"DEBUG: No JSON found, returning whole text", file=sys.stderr)
    return text.strip()


def convert_gemini_to_chatgpt(gemini_data, debug=False):
    """Convert a single Gemini result to ChatGPT format."""
    # Extract the key (image identifier)
    custom_id = gemini_data.get("key", "")
    
    if debug:
        print(f"DEBUG: Processing key: {custom_id}", file=sys.stderr)
    
    # Handle different possible structures
    response = gemini_data.get("response", {})
    
    # Extract text from Gemini response
    text_content = ""
    
    # Try different paths to find the text content
    if "candidates" in response and len(response["candidates"]) > 0:
        candidate = response["candidates"][0]
        if "content" in candidate:
            content = candidate["content"]
            if "parts" in content and len(content["parts"]) > 0:
                # Get text from parts
                for part in content["parts"]:
                    if "text" in part:
                        text_content = part["text"]
                        break
            elif "text" in content:
                text_content = content["text"]
    
    if not text_content:
        raise ValueError(f"Could not find text content in Gemini response for key: {custom_id}")
    
    if debug:
        print(f"DEBUG: Found text content, length: {len(text_content)}", file=sys.stderr)
        print(f"DEBUG: Text preview (first 300 chars): {text_content[:300]}", file=sys.stderr)
    
    # Extract JSON from markdown code blocks
    json_content = extract_json_from_markdown(text_content, debug=debug)
    
    if debug:
        print(f"DEBUG: Extracted JSON content, length: {len(json_content)}", file=sys.stderr)
        print(f"DEBUG: JSON preview (first 200 chars): {json_content[:200]}", file=sys.stderr)
    
    # Validate that we extracted valid JSON
    try:
        parsed_json = json.loads(json_content)
        if debug:
            print(f"DEBUG: JSON validation successful", file=sys.stderr)
    except json.JSONDecodeError as e:
        error_msg = (
            f"Extracted content is not valid JSON for key {custom_id}: {e}\n"
            f"  Extracted content preview (first 500 chars): {json_content[:500]}"
        )
        raise ValueError(error_msg)
    
    # Wrap JSON in ||| markers
    wrapped_content = f"|||{json_content}|||"
    
    # Create ChatGPT format structure
    chatgpt_data = {
        "custom_id": custom_id,
        "response": {
            "body": {
                "choices": [{
                    "message": {
                        "content": wrapped_content
                    }
                }]
            }
        }
    }
    
    return chatgpt_data


def convert_file(input_path, output_path=None, debug=False, verbose=False):
    """Convert a Gemini JSONL file to ChatGPT format."""
    input_path = Path(input_path)
    
    if not input_path.exists():
        raise FileNotFoundError(f"Input path not found: {input_path}")
    
    # Determine output path
    if output_path is None:
        output_path = input_path.parent / f"{input_path.stem}_chatgpt{input_path.suffix}"
    else:
        output_path = Path(output_path)
    
    # Process the file
    processed_count = 0
    error_count = 0
    errors = []
    skipped_count = 0
    
    print(f"Reading from: {input_path}")
    print(f"Writing to: {output_path}")
    if debug:
        print("DEBUG mode enabled - detailed logging will be shown", file=sys.stderr)
    print()
    
    with open(input_path, 'r', encoding='utf-8') as infile, \
         open(output_path, 'w', encoding='utf-8') as outfile:
        
        for line_num, line in enumerate(infile, 1):
            line = line.strip()
            if not line:
                continue
            
            try:
                # Parse Gemini JSON
                gemini_data = json.loads(line)
                
                # Extract key for logging
                custom_id = gemini_data.get("key", f"line_{line_num}")
                
                if verbose and line_num % 10 == 0:
                    print(f"Processing line {line_num}: {custom_id}", file=sys.stderr)
                
                # Convert to ChatGPT format
                chatgpt_data = convert_gemini_to_chatgpt(gemini_data, debug=debug)
                
                # Write to output file
                outfile.write(json.dumps(chatgpt_data) + '\n')
                processed_count += 1
                
            except json.JSONDecodeError as e:
                error_msg = f"Line {line_num}: Invalid JSON in input file - {e}"
                errors.append(error_msg)
                print(f"ERROR: {error_msg}", file=sys.stderr)
                if debug:
                    print(f"DEBUG: Line content (first 500 chars): {line[:500]}", file=sys.stderr)
                error_count += 1
                
            except ValueError as e:
                # This is likely a case where JSON extraction failed or content is missing
                error_msg = f"Line {line_num}: {e}"
                errors.append(error_msg)
                print(f"ERROR: {error_msg}", file=sys.stderr)
                
                # Check if this is a case where there's no JSON (just descriptive text)
                try:
                    gemini_data = json.loads(line)
                    response = gemini_data.get("response", {})
                    if "candidates" in response and len(response["candidates"]) > 0:
                        candidate = response["candidates"][0]
                        if "content" in candidate:
                            content = candidate["content"]
                            if "parts" in content and len(content["parts"]) > 0:
                                for part in content["parts"]:
                                    if "text" in part:
                                        text = part["text"]
                                        # Check if it's just descriptive text without JSON
                                        if "```json" not in text and "{" not in text[:100]:
                                            print(f"  INFO: This appears to be descriptive text without JSON structure. Skipping.", file=sys.stderr)
                                            skipped_count += 1
                                            break
                except:
                    pass
                
                error_count += 1
                
            except Exception as e:
                error_msg = f"Line {line_num}: Unexpected error - {type(e).__name__}: {e}"
                errors.append(error_msg)
                print(f"ERROR: {error_msg}", file=sys.stderr)
                if debug:
                    import traceback
                    print(f"DEBUG: Traceback:", file=sys.stderr)
                    traceback.print_exc(file=sys.stderr)
                error_count += 1
    
    # Print summary
    print(f"\nConversion complete!")
    print(f"  Successfully processed: {processed_count}")
    print(f"  Errors: {error_count}")
    if skipped_count > 0:
        print(f"  Skipped (no JSON found): {skipped_count}")
    
    if errors:
        if len(errors) <= 20:
            print(f"\nAll errors encountered:")
            for i, error in enumerate(errors, 1):
                print(f"  {i}. {error}")
        else:
            print(f"\n{len(errors)} errors encountered (showing first 20):")
            for i, error in enumerate(errors[:20], 1):
                print(f"  {i}. {error}")
            print(f"  ... and {len(errors) - 20} more errors")
    
    return processed_count, error_count, skipped_count


def convert_folder(input_folder, output_folder=None, debug=False, verbose=False):
    """Convert all JSONL files in a folder to ChatGPT format."""
    input_folder = Path(input_folder)
    
    if not input_folder.exists():
        raise FileNotFoundError(f"Input folder not found: {input_folder}")
    
    if not input_folder.is_dir():
        raise ValueError(f"Input path is not a directory: {input_folder}")
    
    # Find all JSONL files
    jsonl_files = list(input_folder.glob("*.jsonl"))
    
    if not jsonl_files:
        print(f"No JSONL files found in {input_folder}")
        return
    
    # Determine output folder - create a new folder with _chatgpt suffix
    if output_folder is None:
        # Create a new folder with _chatgpt suffix
        output_folder = input_folder.parent / f"{input_folder.name}_chatgpt"
    else:
        output_folder = Path(output_folder)
    
    # Create the output folder if it doesn't exist
    output_folder.mkdir(parents=True, exist_ok=True)
    
    print(f"Found {len(jsonl_files)} JSONL file(s) in {input_folder}")
    print(f"Output folder: {output_folder}")
    print()
    
    # Process each file
    total_processed = 0
    total_errors = 0
    total_skipped = 0
    files_processed = 0
    
    for jsonl_file in sorted(jsonl_files):
        print(f"{'='*60}")
        print(f"Processing: {jsonl_file.name}")
        print(f"{'='*60}")
        
        # Create output filename
        output_file = output_folder / f"{jsonl_file.stem}_chatgpt{jsonl_file.suffix}"
        
        try:
            processed, errors, skipped = convert_file(
                jsonl_file, 
                output_file, 
                debug=debug, 
                verbose=verbose
            )
            total_processed += processed
            total_errors += errors
            total_skipped += skipped
            files_processed += 1
            print()
        except Exception as e:
            print(f"FATAL ERROR processing {jsonl_file.name}: {e}", file=sys.stderr)
            if debug:
                import traceback
                traceback.print_exc(file=sys.stderr)
            print()
    
    # Print overall summary
    print(f"{'='*60}")
    print("OVERALL SUMMARY")
    print(f"{'='*60}")
    print(f"Files processed: {files_processed}/{len(jsonl_files)}")
    print(f"Total entries successfully converted: {total_processed}")
    print(f"Total errors: {total_errors}")
    print(f"Total skipped (no JSON found): {total_skipped}")


def main():
    parser = argparse.ArgumentParser(
        description="Convert Gemini batch results JSONL to ChatGPT format",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Convert a single file
  python convert_gemini_to_chatgpt.py input.jsonl
  python convert_gemini_to_chatgpt.py input.jsonl -o output.jsonl
  
  # Convert all JSONL files in a folder (creates folder_chatgpt/)
  python convert_gemini_to_chatgpt.py /path/to/folder
  
  # Convert all JSONL files to a specific output folder
  python convert_gemini_to_chatgpt.py /path/to/folder -o /path/to/output_folder
        """
    )
    
    parser.add_argument(
        'input_path',
        help='Input Gemini JSONL file path or folder containing JSONL files'
    )
    
    parser.add_argument(
        '-o', '--output',
        dest='output_path',
        help='Output ChatGPT JSONL file path (for single file) or output folder (for folder input). Default: <input>_chatgpt.jsonl for files, <folder>_chatgpt/ for folders'
    )
    
    parser.add_argument(
        '-d', '--debug',
        action='store_true',
        help='Enable debug mode with detailed logging'
    )
    
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose mode (show progress)'
    )
    
    args = parser.parse_args()
    
    try:
        input_path = Path(args.input_path)
        
        # Check if it's a file or folder
        if input_path.is_file():
            # Single file conversion
            convert_file(args.input_path, args.output_path, debug=args.debug, verbose=args.verbose)
        elif input_path.is_dir():
            # Folder conversion
            convert_folder(args.input_path, args.output_path, debug=args.debug, verbose=args.verbose)
        else:
            raise ValueError(f"Input path is neither a file nor a directory: {input_path}")
            
    except Exception as e:
        print(f"FATAL ERROR: {e}", file=sys.stderr)
        if args.debug:
            import traceback
            traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
