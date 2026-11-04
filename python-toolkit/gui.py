"""
StreamArmor / Desktop GUI for torupload & safe stream downloader.
Provides a clean, ad-free desktop interface for direct stream fetching.
"""

import os
import subprocess
import sys
import threading
from pathlib import Path

try:
    import tkinter as tk
    from tkinter import filedialog, messagebox, scrolledtext, ttk
except ImportError:
    tk = None

PROJECT_DIR = Path(__file__).resolve().parent
DOWNLOADER = PROJECT_DIR / "downloader.py"
DOWNLOADS_DIR = PROJECT_DIR / "downloads"


class DownloaderGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("StreamArmor - Safe Stream Downloader")
        self.root.geometry("740x560")
        self.root.resizable(True, True)
        self.root.minsize(640, 440)

        self.is_downloading = False
        self.build_ui()

    def build_ui(self):
        # Header banner
        header_frame = ttk.Frame(self.root, padding=(12, 12, 12, 6))
        header_frame.pack(fill="x")
        title_label = ttk.Label(
            header_frame,
            text="StreamArmor Media & File Downloader",
            font=("Segoe UI", 12, "bold")
        )
        title_label.pack(anchor="w")
        sub_label = ttk.Label(
            header_frame,
            text="Safe stream capture without loading JavaScript, 20-tab cascades, or ad walls",
            foreground="#64748b"
        )
        sub_label.pack(anchor="w")

        # Top frame: URL input
        url_frame = ttk.Frame(self.root, padding=(12, 6, 12, 6))
        url_frame.pack(fill="x")

        ttk.Label(url_frame, text="Target URL (Page or Direct Stream):").pack(anchor="w")
        self.url_var = tk.StringVar()
        self.url_entry = ttk.Entry(url_frame, textvariable=self.url_var, width=80)
        self.url_entry.pack(fill="x", pady=(2, 0))
        self.url_entry.bind("<Return>", lambda e: self.start_download())

        # Output path
        out_frame = ttk.Frame(self.root, padding=(12, 6, 12, 6))
        out_frame.pack(fill="x")

        ttk.Label(out_frame, text="Output file (optional, auto-detected from URL):").pack(anchor="w")
        out_row = ttk.Frame(out_frame)
        out_row.pack(fill="x", pady=(2, 0))
        self.output_var = tk.StringVar()
        self.output_entry = ttk.Entry(out_row, textvariable=self.output_var, width=60)
        self.output_entry.pack(side="left", fill="x", expand=True)
        ttk.Button(out_row, text="Browse...", command=self.browse_output).pack(side="right", padx=(6, 0))

        # Options
        opt_frame = ttk.Frame(self.root, padding=(12, 6, 12, 6))
        opt_frame.pack(fill="x")

        ttk.Label(opt_frame, text="Delay (seconds):").pack(side="left")
        self.delay_var = tk.StringVar(value="1.0")
        ttk.Entry(opt_frame, textvariable=self.delay_var, width=6).pack(side="left", padx=(4, 16))

        ttk.Label(opt_frame, text="Referer (optional):").pack(side="left")
        self.referer_var = tk.StringVar()
        ttk.Entry(opt_frame, textvariable=self.referer_var, width=24).pack(side="left", padx=(4, 16))

        ttk.Label(opt_frame, text="Cookies:").pack(side="left")
        self.cookies_var = tk.StringVar()
        ttk.Entry(opt_frame, textvariable=self.cookies_var, width=20).pack(side="left", padx=(4, 0), fill="x", expand=True)

        # Buttons
        btn_frame = ttk.Frame(self.root, padding=(12, 8, 12, 8))
        btn_frame.pack(fill="x")

        self.download_btn = ttk.Button(btn_frame, text="Download Safely", command=self.start_download)
        self.download_btn.pack(side="left")

        ttk.Button(btn_frame, text="Clear Log", command=self.clear_log).pack(side="left", padx=(10, 0))
        ttk.Button(btn_frame, text="Open Downloads Folder", command=self.open_downloads).pack(side="right")

        # Log area
        log_frame = ttk.Frame(self.root, padding=12)
        log_frame.pack(fill="both", expand=True)

        ttk.Label(log_frame, text="Live Engine Execution Log:").pack(anchor="w")
        self.log = scrolledtext.ScrolledText(log_frame, height=13, state="disabled", wrap="word", font=("Consolas", 9))
        self.log.pack(fill="both", expand=True, pady=(2, 0))

        # Status bar
        self.status_var = tk.StringVar(value="Ready")
        status_bar = ttk.Label(self.root, textvariable=self.status_var, relief="sunken", anchor="w", padding=6)
        status_bar.pack(fill="x", side="bottom")

        self.log_message("Welcome to StreamArmor Downloader.")
        self.log_message("Engine operates with Payload Armor to inspect headers and kill malicious executables.")
        self.log_message("Enter a URL and click 'Download Safely'.\n")

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
        DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
        path = filedialog.asksaveasfilename(
            initialdir=str(DOWNLOADS_DIR),
            title="Save file as",
            defaultextension=".rar",
            filetypes=[
                ("Video / Archive Files", "*.mp4;*.mkv;*.rar;*.zip;*.7z;*.avi"),
                ("All Files", "*.*")
            ]
        )
        if path:
            self.output_var.set(path)

    def open_downloads(self):
        DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
        if sys.platform == "win32":
            os.startfile(str(DOWNLOADS_DIR))
        elif sys.platform == "darwin":
            subprocess.run(["open", str(DOWNLOADS_DIR)])
        else:
            subprocess.run(["xdg-open", str(DOWNLOADS_DIR)])

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
        self.log_message(f"[RADAR] Initiating safe retrieval for: {url}")

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

            referer = self.referer_var.get().strip()
            if referer:
                cmd.extend(["--referer", referer])

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
                self.root.after(0, self.status_var.set, "Download complete — Payload Armor Verified")
            else:
                self.root.after(0, self.status_var.set, "Download failed or aborted by safety filter")

        except Exception as exc:
            self.root.after(0, self.log_message, f"[ERROR] {exc}")
            self.root.after(0, self.status_var.set, "Error")
        finally:
            self.is_downloading = False
            self.root.after(0, self.download_btn.config, {"state": "normal"})


def main():
    if not tk:
        print("[ERROR] Tkinter is not available in this Python environment.")
        return 1
    root = tk.Tk()
    app = DownloaderGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
