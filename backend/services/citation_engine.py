import re

class CitationParser:
    @staticmethod
    def parse_reference(raw_ref: str) -> dict:
        """
        Parses a raw bibliographic reference string and extracts key elements:
        authors, year, title, journal, volume, issue, pages.
        Supports APA, IEEE, MLA, and general unstructured inputs.
        """
        raw_ref = raw_ref.strip()
        
        parsed = {
            "raw": raw_ref,
            "authors": "",
            "year": "",
            "title": "",
            "journal": "",
            "volume": "",
            "issue": "",
            "pages": ""
        }
        
        if not raw_ref:
            return parsed
            
        # Clean up any citation markers at the start like "[1]" or "1."
        clean_ref = re.sub(r'^\[\d+\]\s*', '', raw_ref)
        clean_ref = re.sub(r'^\d+\.\s*', '', clean_ref)
        
        # 1. Extract Year (usually a 4-digit number between 1900 and 2099, sometimes in parentheses)
        year_match = re.search(r'\b(19\d{2}|20\d{2})\b', clean_ref)
        if year_match:
            parsed["year"] = year_match.group(1)
            # Remove year from reference to simplify other parsing steps
            clean_ref_no_year = clean_ref.replace(f"({parsed['year']})", "").replace(parsed["year"], "")
        else:
            clean_ref_no_year = clean_ref

        # 2. Extract Pages
        pages_match = re.search(r'\bpp?\.\s*(\d+[\s\-\u2013\u2014]*\d*)', clean_ref, re.IGNORECASE) or \
                      re.search(r'\bpages\s*(\d+[\s\-\u2013\u2014]*\d*)', clean_ref, re.IGNORECASE) or \
                      re.search(r':\s*(\d+[\s\-\u2013\u2014]+\d+)\b', clean_ref)
        if pages_match:
            parsed["pages"] = pages_match.group(1).replace(" ", "")
            # Remove pages from working string
            clean_ref_no_year = clean_ref_no_year.replace(pages_match.group(0), "")

        # 3. Extract Volume and Issue
        # e.g., vol. 12, no. 4 or 12(4)
        vol_issue_match = re.search(r'\bvol\.\s*(\d+)\s*,\s*no\.\s*(\d+)', clean_ref_no_year, re.IGNORECASE)
        if vol_issue_match:
            parsed["volume"] = vol_issue_match.group(1)
            parsed["issue"] = vol_issue_match.group(2)
            clean_ref_no_year = clean_ref_no_year.replace(vol_issue_match.group(0), "")
        else:
            # Check 12(4) format
            vol_paren_match = re.search(r'\b(\d+)\((\d+)\)', clean_ref_no_year)
            if vol_paren_match:
                parsed["volume"] = vol_paren_match.group(1)
                parsed["issue"] = vol_paren_match.group(2)
                clean_ref_no_year = clean_ref_no_year.replace(vol_paren_match.group(0), "")
            else:
                # Just volume
                vol_only_match = re.search(r'\bvol\.\s*(\d+)\b', clean_ref_no_year, re.IGNORECASE)
                if vol_only_match:
                    parsed["volume"] = vol_only_match.group(1)
                    clean_ref_no_year = clean_ref_no_year.replace(vol_only_match.group(0), "")

        # 4. Extract Title and Journal via punctuation/quote splits
        # Case A: Title in double quotes (standard IEEE/MLA)
        title_quote_match = re.search(r'["\u201c\u201d](.*?)["\u201c\u201d]', clean_ref_no_year)
        if title_quote_match:
            parsed["title"] = title_quote_match.group(1).strip(" .,")
            # The remaining text usually holds authors before and journal after
            parts = clean_ref_no_year.split(title_quote_match.group(0))
            if len(parts) >= 2:
                parsed["authors"] = parts[0].strip(" .,")
                parsed["journal"] = parts[1].strip(" .,")
        else:
            # Case B: Standard APA split by periods, ignoring middle initials (e.g. S. or A.)
            parts = [p.strip() for p in re.split(r'(?<!\b[A-Z])\.', clean_ref_no_year) if p.strip()]
            if len(parts) >= 3:
                # If the first part looks like authors (contains comma, names, or "and")
                parsed["authors"] = parts[0].strip(" ,")
                parsed["title"] = parts[1].strip(" ,")
                parsed["journal"] = parts[2].strip(" ,")
            elif len(parts) == 2:
                parsed["authors"] = parts[0].strip(" ,")
                parsed["title"] = parts[1].strip(" ,")
            else:
                parsed["title"] = clean_ref_no_year.strip(" .,")
                
        # Final cleanup for punctuation
        for key in ["authors", "title", "journal"]:
            parsed[key] = re.sub(r'^[,\.\s]+|[,\.\s]+$', '', parsed[key]).strip()
            
        return parsed

class CitationFormatter:
    @staticmethod
    def format_reference(data: dict, style: str, index: int = 1) -> str:
        """
        Formats a structured reference data dictionary into a selected style string.
        """
        authors = data.get("authors", "").strip()
        year = data.get("year", "").strip() or "n.d."
        title = data.get("title", "").strip()
        journal = data.get("journal", "").strip()
        volume = data.get("volume", "").strip()
        issue = data.get("issue", "").strip()
        pages = data.get("pages", "").strip()
        
        if not title:
            return data.get("raw", "")
            
        style = style.upper()
        
        if style == "APA":
            # APA: Author, A. A. (Year). Title of article. Journal, Volume(Issue), pages.
            result = f"{authors} ({year}). {title}."
            if journal:
                result += f" *{journal}*"
                if volume:
                    result += f", {volume}"
                    if issue:
                        result += f"({issue})"
                if pages:
                    result += f", {pages}"
            return result + "."
            
        elif style == "IEEE":
            # IEEE: [index] A. A. Author, "Title of article," Journal, vol. Volume, no. Issue, pp. pages, Year.
            # Format author names slightly for IEEE style if they are in "Last, F." format
            formatted_authors = CitationFormatter._ieee_authors(authors)
            result = f"[{index}] {formatted_authors}, \"{title},\""
            if journal:
                result += f" *{journal}*"
            if volume:
                result += f", vol. {volume}"
            if issue:
                result += f", no. {issue}"
            if pages:
                result += f", pp. {pages}"
            result += f", {year}."
            return result
            
        elif style == "MLA":
            # MLA: Author, First M. "Title of Article." Journal, vol. Volume, no. Issue, Year, pp. pages.
            result = f"{authors}. \"{title}.\""
            if journal:
                result += f" *{journal}*"
                if volume:
                    result += f", vol. {volume}"
                if issue:
                    result += f", no. {issue}"
            result += f", {year}"
            if pages:
                result += f", pp. {pages}"
            return result + "."
            
        elif style == "HARVARD":
            # Harvard: Author, A.A., Year. Title of article. Journal, Volume(Issue), pp.pages.
            result = f"{authors}, {year}. {title}."
            if journal:
                result += f" *{journal}*"
                if volume:
                    result += f", {volume}"
                    if issue:
                        result += f"({issue})"
                if pages:
                    result += f", pp.{pages}"
            return result + "."
            
        elif style == "CHICAGO":
            # Chicago: Author, First M. "Title of Article." Journal Volume, no. Issue (Year): pages.
            result = f"{authors}. \"{title}.\""
            if journal:
                result += f" *{journal}*"
                if volume:
                    result += f" {volume}"
                if issue:
                    result += f", no. {issue}"
            result += f" ({year})"
            if pages:
                result += f": {pages}"
            return result + "."
            
        # Fallback to standard APA
        return f"{authors} ({year}). {title}. {journal}."

    @staticmethod
    def _ieee_authors(authors: str) -> str:
        """Helper to convert LastName, F.M. into F. M. LastName for IEEE."""
        if not authors:
            return ""
        individual_authors = re.split(r'\s+and\s+|\s*;\s*', authors)
        formatted_list = []
        for auth in individual_authors:
            auth = auth.strip()
            parts = auth.split(',')
            if len(parts) == 2:
                last_name = parts[0].strip()
                initials = parts[1].strip()
                formatted_list.append(f"{initials} {last_name}")
            else:
                formatted_list.append(auth)
        
        if len(formatted_list) > 2:
            return ", ".join(formatted_list[:-1]) + ", and " + formatted_list[-1]
        elif len(formatted_list) == 2:
            return f"{formatted_list[0]} and {formatted_list[1]}"
        return formatted_list[0] if formatted_list else ""
