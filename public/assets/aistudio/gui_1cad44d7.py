"""GUI for torupload-safe-downloader."""

import os
import subprocess
import sys
import threading
from pathlib import Path

import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext, ttk

PROJECT_DIR = Path(__file__).resolve().parent
DOWNLOADER = PROJECT_DIR / "downloader.py"
DOWNLOADS_DIR = PROJECT_DIR / "downloads"


class DownloaderGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("torupload-safe-downloader")
        self.root.geometry("720x520")
        self.root.resizable(True, True)
        self.root.minsize(600, 400)

        self.is_downloading = False
        self.build_ui()

    def build_ui(self):
        # --- Top frame: URL input ---
        url_frame = ttk.Frame(self.root, padding=10)
        url_frame.pack(fill="x")

        ttk.Label(url_frame, text="Target URL:").pack(anchor="w")
        self.url_var = tk.StringVar()
        self.url_entry = ttk.Entry(url_frame, textvariable=self.url_var, width=80)
        self.url_entry.pack(fill="x", pady=(2, 0))
        self.url_entry.bind("<Return>", lambda e: self.start_download())

        # --- Output path ---
        out_frame = ttk.Frame(self.root, padding=(10, 0, 10, 10))
        out_frame.pack(fill="x")

        ttk.Label(out_frame, text="Output file (optional):", ).pack(anchor="w")
        out_row = ttk.Frame(out_frame)
        out_row.pack(fill="x", pady=(2, 0))
        self.output_var = tk.StringVar()
        self.output_entry = ttk.Entry(out_row, textvariable=self.output_var, width=60)
        self.output_entry.pack(side="left", fill="x", expand=True)
        ttk.Button(out_row, text="Browse...", command=self.browse_output).pack(side="right", padx=(5, 0))

        # --- Options ---
        opt_frame = ttk.Frame(self.root, padding=(10, 0, 10, 10))
        opt_frame.pack(fill="x")

        ttk.Label(opt_frame, text="Delay (seconds):", ).pack(side="left")
        self.delay_var = tk.StringVar(value="2.0")
        ttk.Entry(opt_frame, textvariable=self.delay_var, width=8).pack(side="left", padx=(5, 15))

        ttk.Label(opt_frame, text="Cookies (optional):", ).pack(side="left")
        self.cookies_var = tk.StringVar()
        ttk.Entry(opt_frame, textvariable=self.cookies_var, width=30).pack(side="left", padx=(5, 0), fill="x", expand=True)

        # --- Buttons ---
        btn_frame = ttk.Frame(self.root, padding=(10, 0, 10, 10))
        btn_frame.pack(fill="x")

        self.download_btn = ttk.Button(btn_frame, text="Download", command=self.start_download)
        self.download_btn.pack(side="left")

        ttk.Button(btn_frame, text="Clear Log", command=self.clear_log).pack(side="left", padx=(10, 0))
        ttk.Button(btn_frame, text="Open Downloads Folder", command=self.open_downloads).pack(side="right")

        # --- Log area ---
        log_frame = ttk.Frame(self.root, padding=10)
        log_frame.pack(fill="both", expand=True)

        ttk.Label(log_frame, text="Status / Log:").pack(anchor="w")
        self.log = scrolledtext.ScrolledText(log_frame, height=15, state="disabled", wrap="word")
        self.log.pack(fill="both", expand=True, pady=(2, 0))

        # --- Status bar ---
        self.status_var = tk.StringVar(value="Ready")
        status_bar = ttk.Label(self.root, textvariable=self.status_var, relief="sunken", anchor="w", padding=5)
        status_bar.pack(fill="x", side="bottom")

        self.log_message("Welcome to torupload-safe-downloader.")
        self.log_message("This tool disables JavaScript on the target page to avoid click-hijack.")
        self.log_message("Enter a URL and click Download.\n")

    def log_message(self, msg):
        self.log.config(state="normal")
        self.log.insert("end", msg + "\n")
        self.log.see("end")
        self.log.config(state="disabled")

    def clear_log(self):
        self.log.config(state="normal")
        self.log.delete("1.0", "end")
        self.log.config(state="disabled")

    def browse_output(self):
        path = filedialog.asksaveasfilename(
            initialdir=str(DOWNLOADS_DIR),
            title="Save file as",
            defaultextension=".rar",
        )
        if path:
            self.output_var.set(path)

    def open_downloads(self):
        DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
        os.startfile(str(DOWNLOADS_DIR))

    def start_download(self):
        if self.is_downloading:
            messagebox.showwarning("Busy", "A download is already in progress.")
            return

        url = self.url_var.get().strip()
        if not url:
            messagebox.showerror("Error", "Please enter a target URL.")
            return

        self.is_downloading = True
        self.download_btn.config(state="disabled")
        self.status_var.set("Downloading...")
        self.clear_log()
        self.log_message(f"Target URL: {url}")
        self.log_message("Launching headless browser (JavaScript DISABLED for safety)...")
        self.log_message("Capturing network requests (no clicks, no script execution)...\n")

        thread = threading.Thread(target=self.run_download, args=(url,), daemon=True)
        thread.start()

    def run_download(self, url):
        try:
            cmd = [sys.executable, str(DOWNLOADER), "--url", url]

            output = self.output_var.get().strip()
            if output:
                cmd.extend(["--output", output])

            delay = self.delay_var.get().strip()
            if delay:
                cmd.extend(["--delay", delay])

            cookies = self.cookies_var.get().strip()
            if cookies:
                cmd.extend(["--cookies", cookies])

            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
            )

            for line in process.stdout:
                self.root.after(0, self.log_message, line.rstrip())

            process.wait()

            if process.returncode == 0:
                self.root.after(0, self.log_message, "")
                self.root.after(0, self.log_message, "=" * 60)
                self.root.after(0, self.log_message, "DOWNLOAD COMPLETE")
                self.root.after(0, self.log_message, "=" * 60)
                self.root.after(0, self.log_message, "")
                self.root.after(0, self.log_message, "SECURITY CHECKLIST (do this before extracting):")
                self.root.after(0, self.log_message, "  1. Scan the file with VirusTotal or Windows Defender")
                self.root.after(0, self.log_message, "  2. Inspect contents inside Windows Sandbox or a fresh VM")
                self.root.after(0, self.log_message, "  3. Never extract on your daily-driver OS")
                self.root.after(0, self.log_message, "  4. Verify file types: .mp4/.mkv/.avi are expected; .exe/.scr/.bat/.lnk are NOT")
                self.root.after(0, self.status_var.set, "Download complete")
            else:
                self.root.after(0, self.log_message, "")
                self.root.after(0, self.log_message, "[ERROR] Download failed. See output above.")
                self.root.after(0, self.status_var.set, "Download failed")

        except Exception as exc:
            self.root.after(0, self.log_message, f"[ERROR] {exc}")
            self.root.after(0, self.status_var.set, "Error")
        finally:
            self.is_downloading = False
            self.root.after(0, self.download_btn.config, {"state": "normal"})


def main():
    root = tk.Tk()
    app = DownloaderGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
