import os
import re
import PyPDF2
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import shutil

def hex_to_rgb(hex_color):
    """Convert hex color string to RGB tuple."""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = ''.join([c*2 for c in hex_color])
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def extract_text(filepath):
    """Extract text from PDF or DOCX file."""
    text = ""
    if filepath.lower().endswith('.pdf'):
        with open(filepath, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    elif filepath.lower().endswith('.docx'):
        doc = Document(filepath)
        for para in doc.paragraphs:
            if para.text.strip():
                text += para.text + "\n"
    return text

def parse_text(text):
    """Heuristic-based parser to identify sections of the paper."""
    lines = text.split('\n')
    lines = [L.strip() for L in lines if L.strip()]
    
    parsed = {
        'title': '',
        'authors': [],
        'university': '',
        'abstract': '',
        'keywords': '',
        'body': [],
        'references': []
    }
    
    if not lines:
        return parsed

    state = 'start'
    
    for line in lines:
        lower_line = line.lower()
        
        if state == 'start':
            parsed['title'] = line
            state = 'authors'
        elif state == 'authors':
            if lower_line.startswith('abstract'):
                parsed['abstract'] += line[8:].strip() + " "
                state = 'abstract'
            elif 'university' in lower_line or 'department' in lower_line or 'college' in lower_line or 'institute' in lower_line:
                parsed['university'] = line
            else:
                if len(line.split()) < 10 and not parsed['abstract']:
                    parsed['authors'].append(line)
                else:
                    # Maybe it's abstract without a header
                    if len(line.split()) > 20:
                        parsed['abstract'] += line + " "
                        state = 'abstract'
        elif state == 'abstract':
            if lower_line.startswith('keyword') or lower_line.startswith('index term'):
                parsed['keywords'] = line
                state = 'body'
            elif lower_line.startswith('introduction') or (len(line.split()) < 10 and not line.endswith('.')):
                parsed['body'].append(line)
                state = 'body'
            else:
                parsed['abstract'] += line + " "
        elif state == 'body':
            if lower_line == 'references' or lower_line == 'works cited' or lower_line == 'bibliography':
                state = 'references'
            else:
                parsed['body'].append(line)
        elif state == 'references':
            # Collect references
            if line:
                parsed['references'].append(line)
                
    return parsed

def set_number_of_columns(section, cols, space_twips):
    sectPr = section._sectPr
    cols_element = sectPr.xpath('./w:cols')
    if not cols_element:
        cols_element = OxmlElement('w:cols')
        sectPr.append(cols_element)
    else:
        cols_element = cols_element[0]
    cols_element.set(qn('w:num'), str(cols))
    cols_element.set(qn('w:space'), str(space_twips))

def format_document(parsed_data, output_path, options=None):
    """Create a formatted docx document based on parsed data and academic guidelines."""
    if options is None:
        options = {}
    
    citation_style = options.get('citation_style', 'APA')
    num_columns = int(options.get('columns', 2))
    
    h_font_name = options.get('heading_font', 'Times New Roman')
    h_font_size = int(options.get('heading_size', 20))
    h_color_rgb = hex_to_rgb(options.get('heading_color', '#000000'))
    
    c_font_name = options.get('content_font', 'Times New Roman')
    c_font_size = int(options.get('content_size', 10))
    c_color_rgb = hex_to_rgb(options.get('content_color', '#000000'))

    doc = Document()
    
    # Configure default style
    style = doc.styles['Normal']
    font = style.font
    font.name = c_font_name
    font.size = Pt(c_font_size)
    font.color.rgb = RGBColor(*c_color_rgb)
    style.paragraph_format.line_spacing = 1.0  # Single-spaced (typical in IEEE/IJRTI)
    
    # 0.6-inch margins for all sections
    # Initial section (Title, Authors, Abstract) -> 1 column
    section1 = doc.sections[0]
    section1.top_margin = Inches(0.6)
    section1.bottom_margin = Inches(0.6)
    section1.left_margin = Inches(0.6)
    section1.right_margin = Inches(0.6)
    
    # Title (Bold, Centered, 20pt)
    if parsed_data['title']:
        title_p = doc.add_paragraph()
        title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        title_run = title_p.add_run(parsed_data['title'])
        title_run.bold = True
        title_run.font.name = h_font_name
        title_run.font.size = Pt(h_font_size)
        title_run.font.color.rgb = RGBColor(*h_color_rgb)
        
    # Authors
    for author in parsed_data['authors']:
        auth_p = doc.add_paragraph()
        auth_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        auth_run = auth_p.add_run(author)
        auth_run.bold = True
        auth_run.font.size = Pt(11)
        
    # University
    if parsed_data['university']:
        univ_p = doc.add_paragraph()
        univ_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        u_run = univ_p.add_run(parsed_data['university'])
        u_run.font.size = Pt(10)
        
    # Abstract
    abs_text = parsed_data['abstract'].strip()
    if abs_text:
        abs_p = doc.add_paragraph()
        abs_p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        a_title = abs_p.add_run("Abstract— ")
        a_title.bold = True
        a_title.italic = True
        a_body = abs_p.add_run(abs_text)
        a_body.bold = True
        a_body.italic = True
        
    # Keywords
    if parsed_data['keywords']:
        kw_p = doc.add_paragraph()
        kw_p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        kw_run = kw_p.add_run(parsed_data['keywords'])
        kw_run.bold = True
        kw_run.italic = True
        
    # Create Continuous Section for two columns
    new_section = doc.add_section(WD_SECTION.CONTINUOUS)
    new_section.top_margin = Inches(0.6)
    new_section.bottom_margin = Inches(0.6)
    new_section.left_margin = Inches(0.6)
    new_section.right_margin = Inches(0.6)
    # columns with 0.3 inch spacing (432 twips)
    set_number_of_columns(new_section, num_columns, 432)
        
    # Body
    for para in parsed_data['body']:
        words = para.split()
        if len(words) < 12 and not para.endswith('.'):
            # Heading
            h_p = doc.add_paragraph()
            h_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            h_run = h_p.add_run(para)
            h_run.bold = True
            h_run.font.name = h_font_name
            h_run.font.size = Pt(int(h_font_size * 0.6)) # Smaller sub-heading
            h_run.font.color.rgb = RGBColor(*h_color_rgb)
        else:
            # Regular paragraph
            p = doc.add_paragraph(para)
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.first_line_indent = Inches(0.15)
            
    # References
    if parsed_data['references']:
        ref_h = doc.add_paragraph()
        ref_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
        ref_h.add_run("References").bold = True
        
        for line in parsed_data['references']:
            r_p = doc.add_paragraph(line)
            r_p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            r_p.paragraph_format.left_indent = Inches(0.15)
            r_p.paragraph_format.first_line_indent = Inches(-0.15)

    try:
        doc.save(output_path)
        return True, "Formatting successful."
    except Exception as e:
        return False, str(e)

def in_place_format_docx(input_path, output_path, options=None):
    """Format docx in place to retain tables, images, and inline formatting"""
    if options is None:
        options = {}
        
    num_columns = int(options.get('columns', 2))
    
    h_font_name = options.get('heading_font', 'Times New Roman')
    h_font_size = int(options.get('heading_size', 20))
    h_color_rgb = hex_to_rgb(options.get('heading_color', '#000000'))
    
    c_font_name = options.get('content_font', 'Times New Roman')
    c_font_size = int(options.get('content_size', 10))
    c_color_rgb = hex_to_rgb(options.get('content_color', '#000000'))

    try:
        shutil.copy(input_path, output_path)
        doc = Document(output_path)
    except Exception as e:
        return False, f"Could not create output file: {str(e)}"

    # Configure default style
    style = doc.styles['Normal']
    font = style.font
    font.name = c_font_name
    font.size = Pt(c_font_size)
    font.color.rgb = RGBColor(*c_color_rgb)
    if hasattr(style.paragraph_format, 'line_spacing'):
        style.paragraph_format.line_spacing = 1.0

    # Locate abstract or start of body
    abstract_idx = -1
    for i, p in enumerate(doc.paragraphs):
        text = p.text.strip().lower()
        if text.startswith('abstract') or text == 'abstract' or text.startswith('abstract—'):
            abstract_idx = i
            break
            
    if abstract_idx == -1:
        for i, p in enumerate(doc.paragraphs):
            text = p.text.strip().lower()
            if text.startswith('keywords') or text.startswith('index terms') or text.startswith('1. introduction') or text == 'introduction':
                abstract_idx = i
                break
                
    if abstract_idx == -1:
        abstract_idx = 3 # fallback
    if abstract_idx <= 0 or abstract_idx >= len(doc.paragraphs):
        abstract_idx = 1
        
    # Format Title and Authors
    for i in range(abstract_idx):
        p = doc.paragraphs[i]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        if i == 0:
            for run in p.runs:
                run.font.name = h_font_name
                run.font.size = Pt(h_font_size)
                run.font.color.rgb = RGBColor(*h_color_rgb)
                run.bold = True
        else:
            for run in p.runs:
                run.font.name = c_font_name
                run.font.size = Pt(c_font_size + 1)
                run.font.color.rgb = RGBColor(*c_color_rgb)
                
    # Insert Section break at abstract_idx - 1
    last_header_para = doc.paragraphs[abstract_idx - 1]
    pPr = last_header_para._p.get_or_add_pPr()
    sectPr = OxmlElement('w:sectPr')
    
    # Section 1 (Title) -> 1 column
    type_el = OxmlElement('w:type')
    type_el.set(qn('w:val'), 'continuous')
    sectPr.append(type_el)
    
    cols = OxmlElement('w:cols')
    cols.set(qn('w:num'), str(num_columns))
    cols.set(qn('w:space'), '432')
    sectPr.append(cols)
    
    # Section 1 Margins (0.6 inch = 864 twips)
    pgMar = OxmlElement('w:pgMar')
    pgMar.set(qn('w:top'), '864')
    pgMar.set(qn('w:bottom'), '864')
    pgMar.set(qn('w:left'), '864')
    pgMar.set(qn('w:right'), '864')
    sectPr.append(pgMar)
    
    pPr.append(sectPr)
    
    # Format document's main section (Section 2) -> 2 columns
    doc.sections[-1].top_margin = Inches(0.6)
    doc.sections[-1].bottom_margin = Inches(0.6)
    doc.sections[-1].left_margin = Inches(0.6)
    doc.sections[-1].right_margin = Inches(0.6)
    
    doc_sectPr = doc.sections[-1]._sectPr
    doc_cols = doc_sectPr.xpath('./w:cols')
    if not doc_cols:
        doc_cols = OxmlElement('w:cols')
        doc_sectPr.append(doc_cols)
    else:
        doc_cols = doc_cols[0]
    doc_cols.set(qn('w:num'), str(num_columns))
    doc_cols.set(qn('w:space'), '432')
    
    # Format the rest of the body (Abstract, Keywords, text)
    for i in range(abstract_idx, len(doc.paragraphs)):
        p = doc.paragraphs[i]
        text = p.text.strip().lower()
        if not text:
            continue
        
        words = text.split()
        # Headings heuristic
        if len(words) < 12 and not text.endswith('.'):
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in p.runs:
                run.font.name = h_font_name
                run.font.size = Pt(int(h_font_size * 0.6))
                run.font.color.rgb = RGBColor(*h_color_rgb)
                run.bold = True
        else:
            # Regular paragraph
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.first_line_indent = Inches(0.15)
            # If abstract, bold it
            if i == abstract_idx:
                for run in p.runs:
                    run.bold = True
                    run.italic = True
                    
    # Clean up spacing, center images, remove top margins
    for p in doc.paragraphs:
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(6)
        
        # Center paragraphs containing images
        if p._element.xpath('.//pic:pic') or p._element.xpath('.//w:drawing'):
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(12)
            p.paragraph_format.first_line_indent = Inches(0)
            
    # Remove trailing empty paragraphs via direct body child traversal (DOM accurate)
    body = doc._element.body
    for child in reversed(list(body)):
        if child.tag.endswith('sectPr'):
            continue
        if child.tag.endswith('p'):
            p = child
            text = "".join(node.text for node in p.iter() if node.tag.endswith('t') and node.text)
            has_drawing = bool(p.xpath('.//w:drawing') or p.xpath('.//pic:pic'))
            if not text.strip() and not has_drawing:
                body.remove(child)
            else:
                break
        else:
            break
                    
    # Autofit tables to ensure they don't bleed out of columns
    for table in doc.tables:
        table.autofit = True
        tblPr = table._element.xpath('w:tblPr')
        if tblPr:
            tblW = tblPr[0].xpath('w:tblW')
            if not tblW:
                tblW_el = OxmlElement('w:tblW')
                tblPr[0].append(tblW_el)
            else:
                tblW_el = tblW[0]
            tblW_el.set(qn('w:type'), 'pct')
            tblW_el.set(qn('w:w'), '5000')  # 100% of current column width
            
        # Strip cell width constraints so table can actually shrink organically
        for row in table.rows:
            for cell in row.cells:
                tcW = cell._element.xpath('.//w:tcW')
                for w in tcW:
                    w.set(qn('w:type'), 'auto')
                    w.set(qn('w:w'), '0')
                # Prevent cells from accidentally page breaking layout
                for p in cell.paragraphs:
                    p.paragraph_format.keep_with_next = False
                    p.paragraph_format.page_break_before = False
            
    # Autofit inline images to ensure they don't break columns
    MAX_WIDTH = Inches(3.4)
    for shape in doc.inline_shapes:
        if shape.width > MAX_WIDTH:
            ratio = MAX_WIDTH / shape.width
            shape.width = MAX_WIDTH
            shape.height = int(shape.height * ratio)

    try:
        doc.save(output_path)
        return True, "Formatting successful."
    except Exception as e:
        return False, str(e)

def mock_ai_refinement(text, instruction):
    """Simulate AI text refinement based on instructions."""
    inst = instruction.lower()
    
    # 1. Formalize / Academic
    if "formal" in inst or "academic" in inst or "formalize" in inst:
        academic_replacements = {
            "get": "obtain",
            "don't": "do not",
            "it's": "it is",
            "can't": "cannot",
            "a lot of": "numerous",
            "show": "demonstrate",
            "find out": "determine",
            "good": "advantageous",
            "bad": "detrimental"
        }
        refined = text
        for old, new in academic_replacements.items():
            refined = refined.replace(old, new).replace(old.capitalize(), new.capitalize())
        return refined
        
    # 2. Shorten
    elif "shorten" in inst or "concise" in inst:
        points = text.split(". ")
        if len(points) > 1:
            return f"{points[0]}. (Summary: {points[-1]})"
        return f"{text[:len(text)//2]}..."
        
    # 3. Explain / Simple
    elif "explain" in inst or "simpler" in inst:
        return f"[Simpler Explanation]: Essentially, this means that {text.lower() if text[0].islower() else text[0].lower() + text[1:]}"
        
    # 4. Grammar
    elif "grammar" in inst or "punctuation" in inst:
        # Simulated grammar fix (e.g. capitalize first letter, add period)
        refined = text.strip()
        if refined and not refined[0].isupper():
            refined = refined[0].upper() + refined[1:]
        if refined and not refined.endswith("."):
            refined += "."
        return refined
        
    # 5. Default/Custom
    return f"[AI-Edited]: {text}"

def refine_docx(file_path, original_text, instruction):
    """Find text in docx and replace it with refined version."""
    try:
        doc = Document(file_path)
        new_text = mock_ai_refinement(original_text, instruction)
        found = False
        
        # Search and replace logic
        for para in doc.paragraphs:
            if original_text in para.text:
                # Replace in runs to preserve some formatting if possible
                # Simple full paragraph replace for now to ensure consistency
                para.text = para.text.replace(original_text, new_text)
                found = True
                
        if not found:
            # Try fuzzy matching if exact fails
            for para in doc.paragraphs:
                if len(para.text) > 10 and original_text[:10] in para.text:
                    para.text = para.text.replace(para.text, new_text)
                    found = True
                    break
        
        doc.save(file_path)
        return True, new_text
    except Exception as e:
        return False, str(e)
