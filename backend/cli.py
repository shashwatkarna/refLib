#!/usr/bin/env python3
"""
refLib AI LAB v3.0 CLI Command Line Tool
Provides direct, terminal-based access to refLib formatting and document analytics.
"""

import argparse
import sys
import os
import time

# Add the parent directory to the system path to allow local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.formatter import extract_text, parse_text, in_place_format_docx
from services.analytics import AcademicAnalytics

# Neo-brutalist CLI Styling Helpers
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

def print_banner():
    banner = f"""
{Colors.BOLD}{Colors.YELLOW}========================================================================
                 __ _     _ _       _   ___   _        _     
                / _(_)   | | |     / | |__ \ / |      | |    
  _ __ ___     | |_ _    | | |__   | |    ) || |  __ _| |__  
 | '__/ _ \    |  _| |   | | '_ \  | |   / / | | / _` | '_ \ 
 | | |  __/    | | | |   | | |_) | | |  / /_ | || (_| | |_) |
 |_|  \___|    |_| |_|   |_|_.__/  |_| |____||_| \__,_|_.__/ 
                                                             
                     ACADEMIC FORMATTER CLI v3.0
========================================================================{Colors.END}
    """
    print(banner)

def main():
    print_banner()
    
    parser = argparse.ArgumentParser(
        description="Format academic papers automatically based on Indian guidelines and analyze compliance.",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        '-i', '--input', 
        required=True, 
        help="Path to the input DOCX or PDF file to format."
    )
    
    parser.add_argument(
        '-o', '--output', 
        required=True, 
        help="Path to save the formatted DOCX document."
    )
    
    parser.add_argument(
        '-s', '--style', 
        default='APA', 
        choices=['APA', 'MLA', 'IEEE', 'ACM', 'Springer'],
        help="Academic citation/formatting style (default: APA)."
    )
    
    parser.add_argument(
        '-c', '--columns', 
        type=int, 
        default=2, 
        choices=[1, 2],
        help="Number of columns layout (default: 2)."
    )
    
    parser.add_argument(
        '--analyse-only', 
        action='store_true', 
        help="Only run academic compliance analytics without modifying the document."
    )

    args = parser.parse_args()
    
    # 1. Validate File Existence
    if not os.path.exists(args.input):
        print(f"{Colors.RED}{Colors.BOLD}[ERROR]{Colors.END} Input file not found: {args.input}")
        sys.exit(1)
        
    print(f"{Colors.BLUE}[INFO]{Colors.END} Loading file: {Colors.BOLD}{os.path.basename(args.input)}{Colors.END}")
    
    # 2. Extract text for compliance check
    start_time = time.time()
    try:
        raw_text = extract_text(args.input)
    except Exception as e:
        print(f"{Colors.RED}{Colors.BOLD}[ERROR]{Colors.END} Failed to extract text from file: {e}")
        sys.exit(1)
        
    # 3. Perform Analytics
    print(f"{Colors.BLUE}[INFO]{Colors.END} Analyzing document statistics and compliance...")
    stats = AcademicAnalytics.calculate_metrics(raw_text)
    compliance = AcademicAnalytics.check_academic_compliance(raw_text)
    
    # Render compliance stats
    print(f"\n{Colors.BOLD}--- DOCUMENT STATISTICS ---{Colors.END}")
    print(f"Word Count              : {Colors.BOLD}{stats['word_count']}{Colors.END}")
    print(f"Sentence Count          : {stats['sentence_count']}")
    print(f"Readability (Fog Index) : {stats['gunning_fog']} (Grade Level)")
    print(f"Est. Reading Time       : {stats['reading_time_seconds']} seconds")
    print(f"Avg. Sentence Length    : {stats['average_sentence_length']} words")
    
    print(f"\n{Colors.BOLD}--- ACADEMIC COMPLIANCE ---{Colors.END}")
    color = Colors.GREEN if compliance['passed'] else Colors.RED
    status = "PASSED" if compliance['passed'] else "FAILED GUIDELINES"
    print(f"Guidelines Status       : {color}{Colors.BOLD}{status} ({compliance['compliance_score']}% compliance){Colors.END}")
    
    if compliance['issues']:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}[GUIDELINE ALERTS]:{Colors.END}")
        for idx, issue in enumerate(compliance['issues'], 1):
            print(f"  {idx}. {issue}")
            
    if args.analyse_only:
        print(f"\n{Colors.GREEN}{Colors.BOLD}[SUCCESS]{Colors.END} Analytics dry-run complete.")
        sys.exit(0)
        
    # 4. Run Academic Formatting
    print(f"\n{Colors.BLUE}[INFO]{Colors.END} Formatting document using {Colors.BOLD}{args.style}{Colors.END} style ({args.columns} Column)...")
    try:
        # Load and parse text structure
        doc_structure = parse_text(raw_text)
        
        # We need to perform docx formatting
        if args.input.lower().endswith('.docx'):
            # Format docx file
            options = {
                "citation_style": args.style,
                "columns": args.columns,
                "heading_font": "Times New Roman",
                "heading_size": 20,
                "heading_color": "#000000",
                "content_font": "Times New Roman",
                "content_size": 10,
                "content_color": "#000000"
            }
            in_place_format_docx(args.input, args.output, options)
            
            elapsed = time.time() - start_time
            print(f"\n{Colors.GREEN}{Colors.BOLD}[SUCCESS]{Colors.END} Formatting completed successfully in {elapsed:.2f}s!")
            print(f"{Colors.GREEN}[OUTPUT]{Colors.END} Formatted document saved to: {Colors.BOLD}{args.output}{Colors.END}")
        else:
            print(f"{Colors.RED}{Colors.BOLD}[ERROR]{Colors.END} Standalone CLI formatting currently only supports .docx files as template streams.")
            sys.exit(1)
            
    except Exception as e:
        print(f"{Colors.RED}{Colors.BOLD}[ERROR]{Colors.END} Formatting failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
