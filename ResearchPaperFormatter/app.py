import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import os
from formatter import extract_text, parse_text, format_document, in_place_format_docx

class PaperFormatterApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Research Paper Formatting AI Tool")
        self.root.geometry("500x350")
        self.root.resizable(False, False)
        
        self.filepath = None
        
        self.create_widgets()
        
    def create_widgets(self):
        style = ttk.Style()
        style.configure("TButton", padding=6, relief="flat", background="#ccc")
        
        lbl_title = tk.Label(self.root, text="Research Paper Formatter", font=("Times New Roman", 18, "bold"))
        lbl_title.pack(pady=20)
        
        lbl_desc = tk.Label(self.root, text="Formats .docx and .pdf files according to\nstandard Indian academic guidelines.", font=("Arial", 10))
        lbl_desc.pack(pady=5)
        
        self.btn_select = ttk.Button(self.root, text="Select File (.docx, .pdf)", command=self.select_file)
        self.btn_select.pack(pady=15)
        
        self.lbl_file = tk.Label(self.root, text="No file selected", fg="gray")
        self.lbl_file.pack()
        
        frame_options = tk.Frame(self.root)
        frame_options.pack(pady=15)
        
        tk.Label(frame_options, text="Citation Style:").pack(side=tk.LEFT, padx=5)
        self.citation_var = tk.StringVar(value="APA")
        tk.Radiobutton(frame_options, text="APA", variable=self.citation_var, value="APA").pack(side=tk.LEFT)
        tk.Radiobutton(frame_options, text="MLA", variable=self.citation_var, value="MLA").pack(side=tk.LEFT)
        
        self.btn_format = ttk.Button(self.root, text="Format Document", command=self.format_file, state=tk.DISABLED)
        self.btn_format.pack(pady=20)
        
    def select_file(self):
        filename = filedialog.askopenfilename(
            title="Select a Research Paper",
            filetypes=(("Word Documents", "*.docx"), ("PDF Files", "*.pdf"), ("All Files", "*.*"))
        )
        if filename:
            self.filepath = filename
            self.lbl_file.config(text=os.path.basename(filename), fg="black")
            self.btn_format.config(state=tk.NORMAL)
            
    def format_file(self):
        if not self.filepath:
            return
            
        output_path = filedialog.asksaveasfilename(
            title="Save Formatted File As",
            defaultextension=".docx",
            filetypes=(("Word Documents", "*.docx"),)
        )
        
        if not output_path:
            return
            
        try:
            self.btn_format.config(text="Formatting...", state=tk.DISABLED)
            self.root.update()
            
            if self.filepath.lower().endswith('.docx'):
                success, msg = in_place_format_docx(self.filepath, output_path, citation_style=self.citation_var.get())
            else:
                # 1. Extract
                text = extract_text(self.filepath)
                # 2. Parse (AI/NLP/Regex step)
                parsed_data = parse_text(text)
                # 3. Format and Save
                success, msg = format_document(parsed_data, output_path, citation_style=self.citation_var.get())
            
            if success:
                messagebox.showinfo("Success", f"Document formatted successfully!\nSaved to: {output_path}")
            else:
                messagebox.showerror("Error", f"Failed to format document.\nError: {msg}")
                
        except Exception as e:
            messagebox.showerror("Error", f"An unexpected error occurred:\n{str(e)}")
        finally:
            self.btn_format.config(text="Format Document", state=tk.NORMAL)

if __name__ == "__main__":
    root = tk.Tk()
    app = PaperFormatterApp(root)
    root.mainloop()
