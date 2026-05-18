import re

class AcademicAnalytics:
    @staticmethod
    def calculate_metrics(text: str) -> dict:
        """
        Calculates basic readability and text structure metrics.
        """
        # Clean text
        words = re.findall(r'\b\w+\b', text)
        word_count = len(words)
        
        # Sentences (simple count by terminal punctuation)
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        sentence_count = len(sentences) or 1
        
        # Syllables
        syllable_count = 0
        for word in words:
            syllable_count += AcademicAnalytics._count_syllables(word)
            
        # Character count (no spaces)
        char_count = sum(len(w) for w in words)
        
        # Readability Formulas
        # Flesch Reading Ease
        # Formula: 206.835 - 1.015 * (total words / total sentences) - 84.6 * (total syllables / total words)
        words_per_sentence = word_count / sentence_count
        syllables_per_word = syllable_count / (word_count or 1)
        
        reading_ease = 206.835 - (1.015 * words_per_sentence) - (84.6 * syllables_per_word)
        reading_ease = max(0.0, min(100.0, reading_ease))
        
        # Gunning Fog Index
        # Formula: 0.4 * ((words / sentences) + 100 * (complex words / words))
        # Complex words are words with 3 or more syllables
        complex_words = sum(1 for w in words if AcademicAnalytics._count_syllables(w) >= 3)
        pct_complex = (complex_words / (word_count or 1)) * 100
        gunning_fog = 0.4 * (words_per_sentence + pct_complex)
        
        # Estimated reading time (average 225 words per minute)
        reading_time_seconds = int((word_count / 225) * 60)
        
        return {
            "word_count": word_count,
            "sentence_count": sentence_count,
            "char_count": char_count,
            "reading_ease": round(reading_ease, 2),
            "gunning_fog": round(gunning_fog, 2),
            "reading_time_seconds": reading_time_seconds,
            "average_word_length": round(char_count / (word_count or 1), 2),
            "average_sentence_length": round(words_per_sentence, 2)
        }
        
    @staticmethod
    def check_academic_compliance(text: str) -> dict:
        """
        Validates academic compliance as per standard Indian academic guidelines.
        """
        issues = []
        scores = []
        
        # Abstract word limit check (200-300 words)
        abstract_match = re.search(r'(?:abstract|synopsis)\s*:(.*?)(?=\n\s*(?:keywords|key\s*words|introduction)|\n\n)', text, re.IGNORECASE | re.DOTALL)
        if abstract_match:
            abstract_text = abstract_match.group(1).strip()
            abstract_words = len(re.findall(r'\b\w+\b', abstract_text))
            if abstract_words < 200 or abstract_words > 300:
                issues.append(f"Abstract word count is {abstract_words} words. The guideline recommends between 200-300 words.")
                scores.append(40)
            else:
                scores.append(100)
        else:
            issues.append("Abstract section not clearly identified. Check heading casing and colons.")
            scores.append(0)
            
        # Keywords presence check
        keywords_match = re.search(r'(?:keywords|key\s*words)\s*:(.*?)(?=\n|\n\n)', text, re.IGNORECASE)
        if keywords_match:
            kws = [k.strip() for k in re.split(r'[,;]+', keywords_match.group(1)) if k.strip()]
            if len(kws) < 3:
                issues.append(f"Found only {len(kws)} keywords. Academic papers usually require at least 3-5 keywords.")
                scores.append(50)
            else:
                scores.append(100)
        else:
            issues.append("Keywords section not found. Ensure 'Keywords:' is listed directly below the abstract.")
            scores.append(0)
            
        # Title Casing and Length Check
        # Assume first non-empty line is the title
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if lines:
            title = lines[0]
            title_words = len(title.split())
            if title_words > 15:
                issues.append(f"Title is too long ({title_words} words). Aim for a concise title under 15 words.")
                scores.append(60)
            else:
                scores.append(100)
                
            # Casing check (Should not be all lowercase)
            if title.islower():
                issues.append("Title should be in Title Case or Upper Case, not lowercase.")
                scores.append(30)
            else:
                scores.append(100)
        else:
            scores.append(0)
            
        # References check
        has_references = re.search(r'(?:references|bibliography|works\s+cited)', text, re.IGNORECASE) is not None
        if not has_references:
            issues.append("No Reference section detected. Ensure 'References' is clearly marked at the end.")
            scores.append(0)
        else:
            scores.append(100)
            
        compliance_score = int(sum(scores) / len(scores)) if scores else 0
        
        return {
            "compliance_score": compliance_score,
            "issues": issues,
            "passed": compliance_score >= 80
        }
        
    @staticmethod
    def _count_syllables(word: str) -> int:
        """
        Simple syllable counter heuristics.
        """
        word = word.lower()
        if not word:
            return 0
        # Simple vowel counter
        vowels = "aeiouy"
        count = 0
        if word[0] in vowels:
            count += 1
        for index in range(1, len(word)):
            if word[index] in vowels and word[index - 1] not in vowels:
                count += 1
        if word.endswith("e"):
            count -= 1
        if count == 0:
            count = 1
        return count
