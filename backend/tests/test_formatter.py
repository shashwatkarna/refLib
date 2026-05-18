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
        self.assertGreater(stats["reading_ease"], 0)
        self.assertLess(stats["reading_ease"], 100)
        self.assertGreater(stats["reading_time_seconds"], 0)
        self.assertGreater(stats["average_sentence_length"], 5)

    def test_compliance_passing(self):
        compliance = AcademicAnalytics.check_academic_compliance(self.sample_paper_compliant)
        
        self.assertIn("compliance_score", compliance)
        # Compliant paper should have a higher score and less alerts
        self.assertGreaterEqual(compliance["compliance_score"], 70)
        
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
        self.assertEqual(AcademicAnalytics._count_syllables("cryptography"), 5)

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
        self.assertEqual(parsed["authors"].strip(), "Author Name")
        self.assertEqual(parsed["abstract"].strip(), "This is the abstract of the research paper. It explains the core concepts and findings of the research.")
        self.assertEqual(parsed["keywords"].strip(), "test, keywords, list")
        self.assertIn("1. INTRODUCTION", parsed["body"])

if __name__ == '__main__':
    unittest.main()
