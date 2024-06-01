import os
import json
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog

class JSONFileManagerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("JSON File Manager")
        self.json_data = {}
        self.json_frames = {}
        self.file_paths = {}
        self.selectedKey= ''

        self.setup_toolbar()
        self.setup_main_frame()

    def setup_toolbar(self):
        toolbar = tk.Frame(self.root)
        toolbar.pack(side=tk.TOP, fill=tk.X)

        load_button = tk.Button(toolbar, text="Load JSON Files", command=self.load_json_files)
        load_button.pack(side=tk.LEFT, padx=2, pady=2)

        save_button = tk.Button(toolbar, text="Save JSON Files", command=self.save_json_files)
        save_button.pack(side=tk.LEFT, padx=2, pady=2)

        self.search_entry = tk.Entry(toolbar)
        self.search_entry.pack(side=tk.LEFT, padx=2, pady=2)

        search_button = tk.Button(toolbar, text="Search Node", command=self.search_node)
        search_button.pack(side=tk.LEFT, padx=2, pady=2)

        add_button = tk.Button(toolbar, text="Add Node", command=self.add_node)
        add_button.pack(side=tk.LEFT, padx=2, pady=2)

        delete_button = tk.Button(toolbar, text="Delete Node", command=self.delete_node)
        delete_button.pack(side=tk.LEFT, padx=2, pady=2)

    def setup_main_frame(self):
        self.main_frame = tk.Frame(self.root)
        self.main_frame.pack(fill=tk.BOTH, expand=True)

    def load_json_files(self):
        file_paths = filedialog.askopenfilenames(
            title="Select JSON Files",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        for file_path in file_paths:
            with open(file_path, 'r') as file:
                data = json.load(file)
                file_name = os.path.basename(file_path)
                self.json_data[file_name] = data
                self.file_paths[file_name] = file_path
                self.display_json_file(file_name, data)

    def save_json_files(self):
        for file_name, data in self.json_data.items():
            file_path = self.file_paths[file_name]
            with open(file_path, 'w') as file:
                json.dump(data, file, indent=4)
        messagebox.showinfo("Success", "All JSON files have been saved successfully.")

    def display_json_file(self, file_name, data):
        if file_name in self.json_frames:
            self.json_frames[file_name].destroy()

        frame = tk.Frame(self.main_frame, borderwidth=2, relief=tk.GROOVE)
        frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        title = tk.Label(frame, text=file_name, font=("Arial", 12, "bold"))
        title.pack()

        listbox = tk.Listbox(frame)
        listbox.pack(fill=tk.BOTH, expand=True)
        listbox.bind('<<ListboxSelect>>', self.on_listbox_select)
        listbox.bind('<Double-1>', lambda event, fn=file_name: self.open_edit_window(event, fn))
        listbox.bind('<Delete>', self.delete_node)
        for key, value in data.items():
            listbox.insert(tk.END, f"{key}: {value}")

        self.json_frames[file_name] = (frame, listbox)

    def on_listbox_select(self, event):
        listbox = event.widget
        selection = listbox.curselection()
        if selection:
            selected_text = listbox.get(selection[0])
            key, _ = selected_text.split(": ", 1)
            self.selectedKey = key

    def open_edit_window(self, event, file_name):
        listbox = event.widget
        selection = listbox.curselection()
        if selection:
            selected_text = listbox.get(selection[0])
            key, value = selected_text.split(": ", 1)

            edit_window = tk.Toplevel(self.root)
            edit_window.title(f"Edit Values for Key: {key}")

            inputs = {}
            row = 0

            for fn, data in self.json_data.items():
                tk.Label(edit_window, text=fn).grid(row=row, column=0, padx=10, pady=5, sticky=tk.W)
                entry = tk.Entry(edit_window)
                entry.grid(row=row, column=1, padx=10, pady=5)
                entry.insert(0, data.get(key, ""))
                inputs[fn] = entry
                row += 1

            def update_values():
                for fn, entry in inputs.items():
                    self.json_data[fn][key] = entry.get()
                self.refresh_display()
                edit_window.destroy()

            ok_button = tk.Button(edit_window, text="OK", command=update_values)
            ok_button.grid(row=row, column=0, columnspan=2, pady=10)

    def add_node(self):
        file_name = simpledialog.askstring("Input", "Enter the file name:")
        if file_name not in self.json_data:
            messagebox.showerror("Error", "File not found.")
            return

        key = simpledialog.askstring("Input", "Enter the node key:")
        value = simpledialog.askstring("Input", "Enter the node value:")
        self.json_data[file_name][key] = value
        self.display_json_file(file_name, self.json_data[file_name])

    def delete_node(self):        
        if self.selectedKey:            
            key = self.selectedKey
            confirm = messagebox.askyesno("Confirm Delete", f"Are you sure you want to delete '{key}' across all files?")
            if confirm:
                for fn, data in self.json_data.items():
                    if key in data:
                        del data[key]
                self.refresh_display()

    def search_node(self):
        search_key = self.search_entry.get().strip().lower()
        if not search_key:
            self.refresh_display()
            return

        matched_keys = set()
        matched_results = []

        # First pass: search for matching keys
        for file_name, data in self.json_data.items():
            for key, value in data.items():
                if search_key in key.lower():
                    matched_keys.add(key)
                    matched_results.append((key, value, file_name))

        # Second pass: if no matching keys, search for matching values
        if not matched_keys:
            for file_name, data in self.json_data.items():
                for key, value in data.items():
                    if search_key in str(value).lower():
                        matched_keys.add(key)
                        matched_results.append((key, value, file_name))

        # Final pass: search for matched keys across all files
        final_results = []
        if matched_keys:
            for file_name, data in self.json_data.items():
                for key, value in data.items():
                    if key in matched_keys:
                        final_results.append((key, value, file_name))

        # Clear and update the listboxes with sorted results
        for file_name, (frame, listbox) in self.json_frames.items():
            listbox.delete(0, tk.END)
            for key, value, fn in sorted(final_results, key=lambda x: (x[2], x[0])):
                if fn == file_name:
                    listbox.insert(tk.END, f"{key}: {value}")

    def refresh_display(self):
        for file_name, (frame, listbox) in self.json_frames.items():
            listbox.delete(0, tk.END)
            data = self.json_data[file_name]
            for key, value in data.items():
                listbox.insert(tk.END, f"{key}: {value}")

if __name__ == "__main__":
    root = tk.Tk()
    app = JSONFileManagerApp(root)
    root.mainloop()
