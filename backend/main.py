from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import tempfile
import os
import shutil

# Import the existing formatting logic
from services.formatter import extract_text, parse_text, format_document, in_place_format_docx, refine_docx
import mammoth # For generating live preview HTML on backend, refine_docx

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

app = FastAPI(title="Research Paper Formatter API")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"Validation Error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, configure explicit origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def cleanup_file(path: str):
    """Deletes temporary file/directory after it has been served."""
    try:
        if os.path.exists(path):
            shutil.rmtree(path) if os.path.isdir(path) else os.remove(path)
    except Exception as e:
        print(f"Error cleaning up {path}: {e}")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Research Paper Formatter API is running."}

@app.post("/api/format")
async def format_paper(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    citation_style: str = Form("APA"),
    columns: str = Form("2"),
    heading_font: str = Form("Times New Roman"),
    heading_size: str = Form("20"),
    heading_color: str = Form("#000000"),
    content_font: str = Form("Times New Roman"),
    content_size: str = Form("10"),
    content_color: str = Form("#000000")
):
    if not file.filename.endswith(('.docx', '.pdf')):
        raise HTTPException(status_code=400, detail="Only .docx and .pdf files are supported")

    # Create a temporary directory to process the files
    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, file.filename)
    output_filename = f"Formatted_{file.filename}" if file.filename.endswith('.docx') else f"Formatted_{file.filename.replace('.pdf', '.docx')}"
    output_path = os.path.join(temp_dir, output_filename)

    try:
        # Save uploaded file
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Apply formatting using legacy logic
        success = False
        msg = ""

        options = {
            "citation_style": citation_style,
            "columns": int(columns),
            "heading_font": heading_font,
            "heading_size": int(heading_size),
            "heading_color": heading_color,
            "content_font": content_font,
            "content_size": int(content_size),
            "content_color": content_color
        }

        if input_path.lower().endswith('.docx'):
            # The original logic formatting in place
            success, msg = in_place_format_docx(input_path, output_path, options)
        else:
            # For PDF, extract text and format
            text = extract_text(input_path)
            parsed_data = parse_text(text)
            success, msg = format_document(parsed_data, output_path, options)

        if not success:
            raise HTTPException(status_code=500, detail=f"Formatting failed: {msg}")

        # Instead of returning FileResponse immediately, Generate HTML preview for Workspace
        html_preview = ""
        try:
            with open(output_path, "rb") as docx_file:
                result = mammoth.convert_to_html(docx_file)
                html_preview = result.value
        except Exception as e:
            html_preview = f"<p>Preview error: {str(e)}</p>"

        return {
            "success": True,
            "file_path": output_path, # Return path for subsequent edits
            "html": html_preview,
            "filename": output_filename
        }

    except HTTPException as he:
        cleanup_file(temp_dir)
        raise he
    except Exception as e:
        cleanup_file(temp_dir)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/refine")
async def refine_paper(
    file_path: str = Form(...),
    original_text: str = Form(...),
    instruction: str = Form(...)
):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File session expired or not found")
        
    success, result_text = refine_docx(file_path, original_text, instruction)
    
    if not success:
        raise HTTPException(status_code=500, detail=f"Refinement failed: {result_text}")
        
    # Generate new HTML after edit
    new_html = ""
    try:
        with open(file_path, "rb") as docx_file:
            new_html = mammoth.convert_to_html(docx_file).value
    except:
        new_html = "<p>Error updating preview</p>"
        
    return {"success": True, "new_text": result_text, "html": new_html}

@app.get("/api/download")
async def download_paper(file_path: str, filename: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(
        path=file_path, 
        filename=filename,
        media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )

