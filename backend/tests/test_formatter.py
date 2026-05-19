import unittest
import sys
import os

# Add parent and grandparent paths for local module importing
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.formatter import parse_text
from services.analytics import AcademicAnalytics

class TestAcademicAnalytics(unittest.TestCase):
    
    def setUp(self):
        # A mock standard academic abstract & introduction text
        self.sample_paper_compliant = """An Analytical Approach to Quantum Cryptography and Secure Multi-party Communication
Shashwat Karna, Department of Computer Science

Abstract: Quantum cryptography represents a massive paradigm shift in network security protocol design. This paper proposes a highly scalable, multi-tenant quantum key distribution scheme tailored to high-throughput commercial application scenarios. By utilizing standard polarization entanglement metrics combined with real-time error corrections, we demonstrate how security thresholds can be dynamically adjusted depending on environment indices. The resulting algorithm achieves theoretical absolute secrecy under perfect conditions and high resilience under heavy active interception attempts, ensuring bulletproof channels. This detailed investigation spans three years of testing and concludes with verified computational evidence of cryptographic safety in large networks.

Keywords: Quantum Cryptography, Network Security, Key Distribution, Entanglement

1. INTRODUCTION
Secure communication in the digital age relies on mathematical complexity...
"""

        self.sample_paper_non_compliant = """short title
abstract: too short abstract.
keywords: none
"""

    def test_calculate_metrics(self):
        stats = AcademicAnalytics.calculate_metrics(self.sample_paper_compliant)
        
        self.assertGreater(stats["word_count"], 50)
        self.assertGreater(stats["sentence_count"], 0)
        self.assertGreaterEqual(stats["reading_ease"], 0)
        self.assertLess(stats["reading_ease"], 100)
        self.assertGreater(stats["reading_time_seconds"], 0)
        self.assertGreater(stats["average_sentence_length"], 5)

    def test_compliance_passing(self):
        compliance = AcademicAnalytics.check_academic_compliance(self.sample_paper_compliant)
        
        self.assertIn("compliance_score", compliance)
        # Compliant paper should have a higher score and less alerts
        self.assertGreaterEqual(compliance["compliance_score"], 60)
        
    def test_compliance_failing(self):
        compliance = AcademicAnalytics.check_academic_compliance(self.sample_paper_non_compliant)
        
        # Failing paper should fail the threshold
        self.assertFalse(compliance["passed"])
        self.assertLess(compliance["compliance_score"], 60)
        # Should have recorded several issues
        self.assertGreater(len(compliance["issues"]), 1)
        
    def test_syllable_counter(self):
        self.assertEqual(AcademicAnalytics._count_syllables("quantum"), 2)
        self.assertEqual(AcademicAnalytics._count_syllables("security"), 4)
        self.assertEqual(AcademicAnalytics._count_syllables("a"), 1)
        self.assertEqual(AcademicAnalytics._count_syllables("cryptography"), 4)

class TestAcademicParser(unittest.TestCase):
    
    def test_parse_text_sections(self):
        raw_text = """A Great Title
Author Name

Abstract: This is the abstract of the research paper. It explains the core concepts and findings of the research.

Keywords: test, keywords, list

1. INTRODUCTION
This is the introduction text.
"""
        parsed = parse_text(raw_text)
        
        self.assertEqual(parsed["title"].strip(), "A Great Title")
        self.assertEqual(parsed["authors"][0].strip(), "Author Name")
        self.assertEqual(parsed["abstract"].lstrip(': ').strip(), "This is the abstract of the research paper. It explains the core concepts and findings of the research.")
        self.assertEqual(parsed["keywords"].replace("Keywords:", "").replace("keywords:", "").strip(), "test, keywords, list")
        self.assertIn("1. INTRODUCTION", parsed["body"])

from services.citation_engine import CitationParser, CitationFormatter
from services.equation_formatter import EquationFormatter

class TestCitationEngine(unittest.TestCase):
    
    def test_citation_parsing_apa(self):
        raw = "Karna, S., and Kumar, A. (2024). Quantum Cryptography. Journal of Computer Science, 12(4), pp. 45-56."
        parsed = CitationParser.parse_reference(raw)
        
        self.assertEqual(parsed["year"], "2024")
        self.assertEqual(parsed["volume"], "12")
        self.assertEqual(parsed["issue"], "4")
        self.assertEqual(parsed["pages"], "45-56")
        self.assertIn("Karna", parsed["authors"])
        self.assertIn("Quantum Cryptography", parsed["title"])
        self.assertIn("Journal of Computer Science", parsed["journal"])
        
    def test_citation_formatting_ieee(self):
        data = {
            "authors": "Karna, S., and Kumar, A.",
            "year": "2024",
            "title": "Quantum Cryptography",
            "journal": "Journal of Computer Science",
            "volume": "12",
            "issue": "4",
            "pages": "45-56"
        }
        formatted = CitationFormatter.format_reference(data, "IEEE", index=3)
        self.assertTrue(formatted.startswith("[3]"))
        self.assertIn("vol. 12", formatted)
        self.assertIn("no. 4", formatted)
        self.assertIn("pp. 45-56", formatted)
        
class TestEquationFormatter(unittest.TestCase):
    
    def test_latex_to_omml_inline(self):
        latex = "e=mc^2"
        xml = EquationFormatter.latex_to_omml(latex, is_block=False)
        self.assertIn("<m:oMath", xml)
        self.assertIn("<m:sSup>", xml)
        self.assertIn("mc", xml)
        self.assertIn("2", xml)
        
    def test_greek_letters_replacement(self):
        latex = r"\alpha + \beta = \gamma"
        xml = EquationFormatter.latex_to_omml(latex, is_block=False)
        self.assertIn("α", xml)
        self.assertIn("β", xml)
        self.assertIn("γ", xml)

from services.formatter import validate_academic_paper, in_place_format_docx
from docx import Document

class TestAcademicValidationAndLayout(unittest.TestCase):
    
    def test_validate_academic_paper_passing(self):
        paper_text = """
        Deep Learning for Sequence Classification
        Abstract: Deep neural networks have revolutionized sequence classification.
        Introduction: Sequence modeling is a critical field...
        References:
        [1] Y. Bengio, "Deep Learning", MIT Press, 2016.
        """
        is_valid, msg = validate_academic_paper(paper_text)
        self.assertTrue(is_valid)
        self.assertEqual(msg, "")
        
    def test_validate_academic_paper_failing_resume(self):
        resume_text = """
        John Doe
        Email: john@example.com | Phone: 123-456-7890
        Professional Experience:
        - Lead Software Engineer at Google (2020 - Present)
        - Developed high-performance React frontends and scalable Node backends.
        Skills: Python, TypeScript, React, Docker, Kubernetes.
        Education:
        B.S. in Computer Science from Stanford University.
        """
        is_valid, msg = validate_academic_paper(resume_text)
        self.assertFalse(is_valid)
        self.assertIn("Abstract", msg)

if __name__ == '__main__':
    unittest.main()
