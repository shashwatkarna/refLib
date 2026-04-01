from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import tempfile
import os
import shutil

# Import the existing formatting logic
from services.formatter import extract_text, parse_text, format_document, in_place_format_docx

app = FastAPI(title="Research Paper Formatter API")

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
    columns: int = Form(2) # Extensible placeholder for future logic
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

        if input_path.lower().endswith('.docx'):
            # The original logic formatting in place
            success, msg = in_place_format_docx(input_path, output_path, citation_style=citation_style)
        else:
            # For PDF, extract text and format
            text = extract_text(input_path)
            parsed_data = parse_text(text)
            success, msg = format_document(parsed_data, output_path, citation_style=citation_style)

        if not success:
            raise HTTPException(status_code=500, detail=f"Formatting failed: {msg}")

        # Schedule background cleanup of the temporary directory
        background_tasks.add_task(cleanup_file, temp_dir)

        # Return the formatted file back to the client
        return FileResponse(
            path=output_path, 
            filename=output_filename,
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            headers={"Access-Control-Expose-Headers": "Content-Disposition"}  # Vital to read filename cleanly on frontend
        )

    except HTTPException as he:
        cleanup_file(temp_dir)
        raise he
    except Exception as e:
        cleanup_file(temp_dir)
        raise HTTPException(status_code=500, detail=str(e))
